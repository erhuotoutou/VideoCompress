# 🎬 VideoCompress — Local GPU-Accelerated Video Compressor

> [📖 中文文档](README.zh.md) | [🏠 Home](README.md)

A pure browser-based video compression tool using GPU hardware encoding. No data is ever uploaded.

## Features

| Feature | Description |
|---------|-------------|
| 🚀 **GPU Acceleration** | WebCodecs API → NVENC / AMF / QSV hardware encoding |
| 📐 **Resolution** | Presets (4K / 2K / 1080p / 720p / 480p) + custom dimensions |
| 📊 **Bitrate Control** | 500 Kbps ~ 50 Mbps, VBR / CBR modes |
| 🎞️ **Frame Rate** | Keep original / 60 / 30 / 24 / 15 fps |
| 🎵 **Audio** | AAC encoding, 64 ~ 320 Kbps |
| 🔮 **Size Estimation** | Real-time calculation with ±5% range, savings percentage |
| 📦 **Batch Processing** | Multi-file queue, per-file settings, sequential processing |
| 👁️ **Preview & Compare** | Side-by-side + slider comparison, before/after stats |

## Browser Requirements

| Browser | Support |
|---------|---------|
| Chrome 94+ | ✅ Full GPU acceleration |
| Edge 94+ | ✅ Full GPU acceleration |
| Firefox | ⚠️ Incomplete WebCodecs support |
| Safari | ⚠️ Incomplete WebCodecs support |

## Quick Start

### 1. Clone

```bash
git clone git@github.com:erhuotoutou/VideoCompress.git
cd VideoCompress
```

### 2. Start Local Server

Must use an HTTP server (`file://` protocol does NOT support WebCodecs):

```bash
# Option A: Python (recommended)
python -m http.server 3000

# Option B: Node.js
npx serve . -p 3000 --no-clipboard
```

### 3. Open Browser

```
http://localhost:3000
```

### 4. Usage

1. **Drop video files** → Supports MP4 / WebM / MKV / MOV (also click to select or Ctrl+V paste)
2. **Configure parameters** → Resolution, codec, bitrate, framerate, audio
3. **Click Start** → Real-time progress shown in the log panel (bottom-left)
4. **Download / Compare** → Download the compressed video or open the comparison view

> Each file can have independent settings. Use "Apply to All" to batch sync.

## How It Works

```
File → <video> decode → Canvas(resize/fps adjustment)
     → VideoEncoder(GPU encode) → mp4box.js(mux) → .mp4 download
```

- **Decode**: Browser's native `<video>` element — compatible with all playable formats
- **Frame Processing**: Canvas handles resolution and framerate changes
- **Encode**: WebCodecs API directly invokes system GPU hardware encoder
- **Mux**: mp4box.js generates the MP4 container
- **100% Local**: All processing happens in-browser. Video data never leaves your machine.

## Size Estimation Formula

```
Estimated Size = (video bitrate + audio bitrate) × duration / 8 × 1.02
```

- `1.02` = MP4 container overhead (~2%)
- ±5% is normal variance

## File Structure

```
VideoCompress/
├── index.html          # Main page with all CSS/JS inline
├── mp4box.all.js       # mp4box.js container library (pure JS)
├── README.md           # Home (language selection)
├── README.zh.md        # Chinese docs
├── README.en.md        # English docs (this file)
└── docs/
    ├── specs/          # Design docs
    └── plans/          # Implementation plans
```

## Supported Codecs

| Codec | Output | GPU Accelerated |
|-------|--------|-----------------|
| H.264 (Baseline / Main / High) | ✅ | ✅ Widely available |
| H.265 / HEVC | ✅ | ⚠️ Requires GPU driver support |
| VP9 | ✅ | ✅ Chrome built-in |
| AV1 | ✅ | ⚠️ Requires newer hardware |

Codec availability is auto-detected on page load. Unsupported codecs are grayed out.

## FAQ

**Q: Why do I need a local HTTP server?**

A: The `file://` protocol blocks certain browser APIs. `python -m http.server` solves this with one command.

**Q: Does Firefox / Safari work?**

A: Currently Firefox and Safari have incomplete WebCodecs support. Chrome or Edge is recommended.

**Q: Why is H.265 grayed out?**

A: H.265 hardware encoding requires GPU driver support. Most NVIDIA (GTX 10 series+) and Intel iGPUs (6th gen+) support it.

**Q: How fast is the compression?**

A: GPU hardware encoding typically achieves 2-5x real-time speed, depending on resolution, bitrate, and hardware.

**Q: Why can't some MP4 files be compressed?**

A: Camera-origin MP4 files may have unusual codec configurations. The project now uses the browser's native video decoder for frame extraction — any video the browser can play should be compressible. If issues persist, please open an Issue.

## License

MIT
