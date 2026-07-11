const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
const uuidv4 = () => crypto.randomUUID();

// ---- FFmpeg path resolution ----
// Priority: env var > ./bin/ > system PATH
const BIN_DIR = path.join(__dirname, 'bin');
const FFMPEG_ENV = process.env.FFMPEG_PATH;
const FFPROBE_ENV = process.env.FFPROBE_PATH;

function findExe(name) {
  const candidates = [];
  if (FFMPEG_ENV && name === 'ffmpeg') candidates.push(FFMPEG_ENV);
  if (FFPROBE_ENV && name === 'ffprobe') candidates.push(FFPROBE_ENV);
  candidates.push(
    path.join(BIN_DIR, name + '.exe'),
    path.join(BIN_DIR, name),
    name + '.exe',
    name,
  );
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

const ffmpegPath = findExe('ffmpeg');
const ffprobePath = findExe('ffprobe');

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure directories exist
['uploads', 'outputs'].forEach(d => {
  const p = path.join(__dirname, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p);
});

// File upload setup
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads/'),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 }, // 4GB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.mp4', '.webm', '.mkv', '.mov', '.avi'];
    if (allowed.includes(ext) || file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Unsupported video format'));
  },
});

// Store active compression jobs
const jobs = new Map();
// Store SSE clients
const sseClients = new Map();

// ===================== API ROUTES =====================

// Upload video file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const id = path.parse(req.file.filename).name;
  jobs.set(id, {
    id,
    originalName: req.file.originalname,
    inputPath: req.file.path,
    inputSize: req.file.size,
    status: 'uploaded',
    progress: 0,
    outputPath: null,
    outputSize: 0,
    error: null,
  });
  res.json({ id, filename: req.file.originalname, size: req.file.size });
});

// Get video metadata via ffprobe
app.get('/api/info/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'File not found' });

  ffmpeg.ffprobe(job.inputPath, (err, metadata) => {
    if (err) return res.status(500).json({ error: 'ffprobe failed: ' + err.message });

    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

    // Parse framerate (ffprobe returns it as a fraction string like "30000/1001")
    let fps = 30;
    if (videoStream && videoStream.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split('/');
      fps = parts.length === 2 ? Math.round(parseInt(parts[0]) / parseInt(parts[1])) : parseFloat(videoStream.r_frame_rate);
    }

    const info = {
      width: videoStream?.width || 0,
      height: videoStream?.height || 0,
      duration: parseFloat(metadata.format?.duration || 0),
      fps,
      codec: videoStream?.codec_name || '',
      codecLabel: (videoStream?.codec_long_name || videoStream?.codec_name || ''),
      videoBitrate: parseInt(videoStream?.bit_rate || 0) || parseInt(metadata.format?.bit_rate || 0) || 0,
      hasAudio: !!audioStream,
      audioBitrate: audioStream ? (parseInt(audioStream.bit_rate) || 0) : 0,
      format: metadata.format?.format_name || '',
    };
    res.json(info);
  });
});

// Start compression
app.post('/api/compress/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'File not found' });
  if (job.status === 'processing') return res.status(400).json({ error: 'Already processing' });

  const opts = req.body;
  job.options = opts;
  job.status = 'processing';
  job.progress = 0;
  job.outputPath = path.join(__dirname, 'outputs', job.id + '_compressed.mp4');

  // Build FFmpeg command
  const cmd = ffmpeg(job.inputPath);

  // Video codec
  const codec = opts.codec || 'libx264';
  cmd.videoCodec(codec.includes('h264') || codec.includes('avc') ? 'libx264' :
                  codec.includes('h265') || codec.includes('hevc') || codec.includes('hvc') ? 'libx265' :
                  codec.includes('vp9') ? 'libvpx-vp9' : 'libx264');

  // Resolution
  if (opts.width && opts.height) cmd.size(`${opts.width}x${opts.height}`);
  else if (opts.width) cmd.size(`${opts.width}x?`);
  else if (opts.height) cmd.size(`?x${opts.height}`);

  // Framerate
  if (opts.fps && !opts.keepOriginalFps) cmd.fps(opts.fps);

  // Bitrate
  if (opts.videoBitrate) cmd.videoBitrate(Math.round(opts.videoBitrate / 1000) + 'k');

  // Audio
  if (opts.audioBitrate && opts.audioBitrate > 0) {
    cmd.audioCodec('aac').audioBitrate(Math.round(opts.audioBitrate / 1000) + 'k');
  } else {
    cmd.noAudio();
  }

  // Bitrate mode
  if (opts.bitrateMode === 'cbr') {
    cmd.outputOptions(['-nal-hrd cbr']);
  }

  // Common options
  cmd.outputOptions([
    '-movflags', '+faststart',  // Web-optimized
    '-preset', 'fast',          // Balance speed vs quality
    '-pix_fmt', 'yuv420p',     // Wide compatibility
  ]);

  // GPU acceleration: try HW encoder based on available hardware
  // NVIDIA NVENC
  const gpuCodec = codec.includes('265') || codec.includes('hevc') ? 'hevc_nvenc' : 'h264_nvenc';
  // We'll check by trying; ffmpeg will error if not available

  cmd.output(job.outputPath);

  // Track progress
  let lastProgress = 0;
  cmd.on('progress', (progress) => {
    const pct = progress.percent ? Math.round(progress.percent) : 0;
    if (pct !== lastProgress) {
      lastProgress = pct;
      job.progress = pct;
      job.currentFps = progress.currentFps || 0;
      job.speed = progress.currentKbps || 0;
      notifyClients(job.id, { type: 'progress', progress: pct, fps: progress.currentFps, speed: progress.currentKbps });
    }
  });

  cmd.on('end', () => {
    if (fs.existsSync(job.outputPath)) {
      job.outputSize = fs.statSync(job.outputPath).size;
    }
    job.status = 'completed';
    job.progress = 100;
    notifyClients(job.id, { type: 'completed', size: job.outputSize });
  });

  cmd.on('error', (err) => {
    console.error('FFmpeg error:', err.message);
    job.status = 'failed';
    job.error = err.message;
    notifyClients(job.id, { type: 'error', message: err.message });
  });

  cmd.run();
  res.json({ status: 'started', sseUrl: `/api/progress/${job.id}` });
});

// SSE progress stream
app.get('/api/progress/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'File not found' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send current state
  res.write(`data: ${JSON.stringify({ type: 'status', status: job.status, progress: job.progress })}\n\n`);

  // Register client
  if (!sseClients.has(req.params.id)) sseClients.set(req.params.id, []);
  sseClients.get(req.params.id).push(res);

  req.on('close', () => {
    const clients = sseClients.get(req.params.id);
    if (clients) {
      const idx = clients.indexOf(res);
      if (idx !== -1) clients.splice(idx, 1);
    }
  });
});

function notifyClients(id, data) {
  const clients = sseClients.get(id);
  if (!clients) return;
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => { try { c.write(msg); } catch {} });
}

// Download compressed file
app.get('/api/download/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job || !job.outputPath || !fs.existsSync(job.outputPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  const ext = path.extname(job.originalName);
  const dlName = path.basename(job.originalName, ext) + '_compressed.mp4';
  res.download(job.outputPath, dlName);
});

// Cleanup
app.delete('/api/file/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  try { if (fs.existsSync(job.inputPath)) fs.unlinkSync(job.inputPath); } catch {}
  try { if (job.outputPath && fs.existsSync(job.outputPath)) fs.unlinkSync(job.outputPath); } catch {}
  jobs.delete(req.params.id);
  res.json({ ok: true });
});

// Start server
app.listen(PORT, () => {
  console.log('🎬 VideoCompress server running at http://localhost:' + PORT);
  console.log('   FFmpeg :', ffmpegPath || '(system PATH)');
  console.log('   FFprobe:', ffprobePath || '(system PATH)');
  if (!ffmpegPath && !ffprobePath) {
    console.log('   💡 Put ffmpeg.exe + ffprobe.exe in ./bin/');
  }
  console.log('');
  console.log('   Upload:   POST /api/upload');
  console.log('   Info:     GET  /api/info/:id');
  console.log('   Compress: POST /api/compress/:id');
  console.log('   Progress: GET  /api/progress/:id (SSE)');
  console.log('   Download: GET  /api/download/:id');
});
