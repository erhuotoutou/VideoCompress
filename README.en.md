# 🎬 VideoCompress — Local GPU-Accelerated Video Compressor

> [📖 中文文档](README.zh.md) | [🏠 Home](README.md)

Node.js + FFmpeg based video compression tool with NVIDIA / AMD / Intel GPU hardware encoding support. Web UI frontend, server-side processing. No data is ever uploaded externally.

## Features

| Feature | Description |
|---------|-------------|
| 🚀 **GPU Acceleration** | NVIDIA NVENC / AMD AMF / Intel QSV hardware encoding |
| 📐 **Resolution** | Presets (4K / 2K / 1080p / 720p / 480p) + custom dimensions |
| 📊 **Bitrate Control** | 500 Kbps ~ 50 Mbps, VBR / CBR modes |
| 🎞️ **Frame Rate** | Keep original / 60 / 30 / 24 / 15 fps |
| 🎵 **Audio** | AAC encoding, 64 ~ 320 Kbps |
| 🔮 **Size Estimation** | Real-time calculation with ±5% range, savings percentage |
| 📦 **Batch Processing** | Multi-file queue, per-file settings, sequential processing |
| 👁️ **Preview & Compare** | Side-by-side + slider comparison, before/after stats |
| 🌐 **Bilingual UI** | One-click EN/中文 toggle |

## Browser Requirements

Any modern browser works (Chrome / Edge / Firefox / Safari).

## System Requirements

| Component | Requirement |
|-----------|-------------|
| Node.js | 18+ |
| FFmpeg | 4.0+ (portable mode supported, see below) |

## Quick Start

### 1. Clone

```bash
git clone git@github.com:erhuotoutou/VideoCompress.git
cd VideoCompress
npm install
```

### 2. Install FFmpeg (one-command setup)

```bash
node setup.js
```

Automatically downloads FFmpeg to `bin/` directory (~100MB, first time only).

Or configure manually:

```bash
# Download from https://ffmpeg.org/download.html and place in bin/
# Or set FFMPEG_PATH / FFPROBE_PATH environment variables
# Or ensure system has ffmpeg installed: ffmpeg -version
```

### 3. Start Server

```bash
node server.js
```

Startup log shows which FFmpeg is being used:

```
FFmpeg : C:\...\bin\ffmpeg.exe
FFprobe: C:\...\bin\ffprobe.exe
```

### 4. Open Browser

```
http://localhost:3000
```

A green "Server ✅" badge in the top-right indicates a healthy connection.

### 5. Usage

1. **Drop video files** → Supports MP4 / WebM / MKV / MOV (also click to select or Ctrl+V paste)
2. **Wait for analysis** → Server uses ffprobe to extract metadata
3. **Configure parameters** → Resolution, codec, bitrate, framerate, audio
4. **Click Start** → Real-time progress shown in the log panel (bottom-left)
5. **Download / Compare** → Download the compressed video or open the comparison view

> Each file can have independent settings. Use "Apply to All" to batch sync.

## Architecture

```
Browser (public/index.html)
    │  POST /api/upload       ← upload file
    │  GET  /api/info/:id     ← ffprobe metadata
    │  POST /api/compress/:id ← start FFmpeg
    │  GET  /api/progress/:id ← SSE real-time progress
    │  GET  /api/download/:id ← download result
    ▼
server.js (Express + fluent-ffmpeg)
    │
    ▼
FFmpeg (ffmpeg + ffprobe)
```

## Supported Codecs

| Codec | Type | Notes |
|-------|------|-------|
| libx264 | Software | H.264, most compatible |
| **h264_nvenc** | NVIDIA GPU | H.264 hardware encoding |
| h264_amf | AMD GPU | H.264 hardware encoding |
| h264_qsv | Intel GPU | H.264 hardware encoding |
| libx265 | Software | H.265, higher compression |
| **hevc_nvenc** | NVIDIA GPU | H.265 hardware encoding |
| libvpx-vp9 | Software | VP9, WebM container |

> GPU codecs require corresponding GPU hardware and drivers. `_nvenc` = NVIDIA, `_amf` = AMD, `_qsv` = Intel iGPU.

## Size Estimation Formula

```
Estimated Size = (video bitrate + audio bitrate) × duration / 8 × 1.02
```

- `1.02` = MP4 container overhead (~2%)
- ±5% is normal variance

## File Structure

```
VideoCompress/
├── server.js           # Express backend
├── public/
│   └── index.html      # Frontend
├── bin/                # FFmpeg executables (portable mode)
│   ├── ffmpeg.exe      # gitignored
│   ├── ffprobe.exe     # gitignored
│   └── README.txt
├── uploads/            # Temp uploads (gitignored)
├── outputs/            # Compressed outputs (gitignored)
└── README.md
```

## FAQ

**Q: How do I know if GPU acceleration is working?**

A: Select a codec with `NVENC` / `AMF` / `QSV` suffix (e.g. `h264_nvenc`) and observe encoding speed. GPU encoding typically achieves 5-20× real-time speed; CPU encoding is usually 1-3×.

**Q: Which FFmpeg build should I download?**

A: Windows users can download `ffmpeg-release-essentials.zip` from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/), then copy `ffmpeg.exe` and `ffprobe.exe` from the `bin/` folder into the project's `bin/` directory.

**Q: Can I process multiple files at once?**

A: Yes. Drop multiple files into the queue, configure settings, and click "Start All". Files are processed sequentially.

**Q: Where are files stored? Is this secure?**

A: Uploaded files and compressed results are stored only in the local `uploads/` and `outputs/` directories. Nothing is sent to any external server. The server listens on `localhost` only.

## License

MIT
