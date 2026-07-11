// Auto-download FFmpeg executables to ./bin/
// Run: node setup.js

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BIN_DIR = path.join(__dirname, 'bin');
const OS = process.platform; // win32, darwin, linux

// FFmpeg builds for each platform
const BUILDS = {
  win32: {
    url: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
    files: ['bin/ffmpeg.exe', 'bin/ffprobe.exe'],
  },
  darwin: {
    // macOS static builds from evermeet.cx
    ffmpeg: 'https://evermeet.cx/ffmpeg/ffmpeg-7.0.2.zip',
    ffprobe: 'https://evermeet.cx/ffmpeg/ffprobe-7.0.2.zip',
    type: 'separate',
  },
  linux: {
    // For Linux, just use apt/dnf install
    type: 'package-manager',
  },
};

if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true });

// Check if already present
if (fs.existsSync(path.join(BIN_DIR, 'ffmpeg.exe')) || fs.existsSync(path.join(BIN_DIR, 'ffmpeg'))) {
  console.log('✅ FFmpeg already present in ./bin/');
  process.exit(0);
}

console.log('📥 Downloading FFmpeg...');
console.log('   (one-time setup, ~100MB)');

async function main() {
  const build = BUILDS[OS];
  if (!build) {
    console.error('❌ Unsupported OS:', OS);
    process.exit(1);
  }

  if (build.type === 'package-manager') {
    console.log('💡 On Linux, use your package manager:');
    console.log('   sudo apt install ffmpeg    # Debian/Ubuntu');
    console.log('   sudo dnf install ffmpeg    # Fedora');
    console.log('   Or download static builds from https://johnvansickle.com/ffmpeg/');
    process.exit(0);
  }

  if (build.type === 'separate') {
    // macOS: download ffmpeg and ffprobe separately
    await downloadAndExtract(build.ffmpeg, 'ffmpeg');
    await downloadAndExtract(build.ffprobe, 'ffprobe');
  } else {
    // Windows: single zip
    await downloadAndExtract(build.url, null, build.files);
  }

  console.log('✅ FFmpeg ready in ./bin/');
  console.log('   Run: node server.js');
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      const total = parseInt(response.headers['content-length'] || '0', 10);
      let downloaded = 0;
      response.pipe(file);
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total > 0) {
          process.stdout.write('\r   ' + Math.round(downloaded / total * 100) + '%');
        }
      });
      file.on('finish', () => { file.close(); console.log(''); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadAndExtract(url, singleName, files) {
  const isWindows = OS === 'win32';
  const ext = isWindows ? '.zip' : '.zip';
  const zipPath = path.join(__dirname, 'ffmpeg_download' + ext);

  console.log('   Downloading from ' + url);
  await downloadFile(url, zipPath);
  console.log('   Extracting...');

  if (isWindows) {
    // Use PowerShell for extraction (Windows built-in)
    try {
      execSync('powershell -Command "Expand-Archive -Path \'' + zipPath + '\' -DestinationPath \'' + path.join(__dirname, 'ffmpeg_temp') + '\' -Force"', { stdio: 'pipe' });
    } catch {
      // Fallback: try unzip if available
      try {
        execSync('unzip -o "' + zipPath + '" -d "' + path.join(__dirname, 'ffmpeg_temp') + '"', { stdio: 'pipe' });
      } catch {
        console.error('❌ Cannot extract zip. Install 7-Zip or enable PowerShell.');
        fs.unlinkSync(zipPath);
        process.exit(1);
      }
    }

    // Find and copy the executables
    const tempDir = path.join(__dirname, 'ffmpeg_temp');
    const foundDir = findBinDir(tempDir);

    for (const f of (files || ['ffmpeg.exe', 'ffprobe.exe'])) {
      const srcName = path.basename(f);
      const src = findFile(foundDir || tempDir, srcName);
      if (src) {
        fs.copyFileSync(src, path.join(BIN_DIR, srcName));
        console.log('   ✓ ' + srcName);
      }
    }

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  fs.unlinkSync(zipPath);
}

function findBinDir(dir) {
  // The extracted folder usually has bin/ inside
  const binPath = path.join(dir, 'bin');
  if (fs.existsSync(binPath)) return binPath;

  // Check subdirectories
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const subBin = path.join(dir, e.name, 'bin');
        if (fs.existsSync(subBin)) return subBin;
        const deep = findBinDir(path.join(dir, e.name));
        if (deep) return deep;
      }
    }
  } catch {}

  return null;
}

function findFile(dir, name) {
  const direct = path.join(dir, name);
  if (fs.existsSync(direct)) return direct;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const found = findFile(path.join(dir, e.name), name);
        if (found) return found;
      }
    }
  } catch {}

  return null;
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
