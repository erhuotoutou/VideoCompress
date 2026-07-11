# 🎬 视频压缩 — 本地 GPU 加速 / Video Compressor — Local GPU-Accelerated

纯浏览器的视频压缩工具，调用 GPU 硬件编码，无需上传任何数据。  
A pure browser-based video compression tool using GPU hardware encoding. No data is ever uploaded.

## 功能 / Features

| 功能 Feature | 说明 Description |
|-------------|-----------------|
| 🚀 **GPU 加速** | WebCodecs API → NVENC / AMF / QSV 硬件编码 |
| 📐 **分辨率** | 预设 (4K/2K/1080p/720p/480p) + 自定义宽高 |
| 📊 **码率控制** | 500 Kbps ~ 50 Mbps，VBR / CBR 模式 |
| 🎞️ **帧率** | 保持原始 / 60 / 30 / 24 / 15 fps |
| 🎵 **音频** | AAC 编码，64~320 Kbps |
| 🔮 **预估大小** | 实时计算 ±5% 范围，显示节省百分比 |
| 📦 **批量处理** | 多文件队列，独立参数，顺序处理 |
| 👁️ **预览对比** | 并排 + 滑块对比，压缩前后大小统计 |

## 浏览器要求 / Browser Requirements

| 浏览器 | 支持 |
|--------|------|
| Chrome 94+ | ✅ 完整 GPU 加速 |
| Edge 94+ | ✅ 完整 GPU 加速 |
| Firefox | ⚠️ WebCodecs 支持不完整 |
| Safari | ⚠️ WebCodecs 支持不完整 |

## 快速开始 / Quick Start

### 1. 克隆项目 / Clone

```bash
git clone git@github.com:erhuotoutou/VideoCompress.git
cd VideoCompress
```

### 2. 启动本地服务器 / Start Local Server

必须通过 HTTP 服务器访问（`file://` 协议下 WebCodecs 不可用）：  
Must use an HTTP server (`file://` protocol does NOT support WebCodecs):

```bash
# 方式 A: Python (推荐)
python -m http.server 3000

# 方式 B: Node.js
npx serve . -p 3000 --no-clipboard
```

### 3. 打开浏览器 / Open Browser

```
http://localhost:3000
```

### 4. 使用 / Usage

1. **拖入视频** → 拖拽区支持 MP4 / WebM / MKV / MOV（也支持点击选择或 Ctrl+V 粘贴）
2. **设置参数** → 分辨率、编码器、码率、帧率、音频
3. **点击开始** → 左下角日志面板显示实时进度
4. **下载/对比** → 完成后下载压缩视频，或打开对比窗口查看画质差异

> 每个文件可独立设置参数，使用「应用到全部」按钮批量同步。  
> Each file can have independent settings. Use "Apply to All" to batch sync.

## 工作原理 / How It Works

```
文件 → mp4box.js(解封装) → VideoDecoder(GPU解码) → Canvas(缩放/帧率)
     → VideoEncoder(GPU编码) → mp4box.js(封装) → .mp4 下载
```

- **解封装/封装**: mp4box.js 解析和生成 MP4 容器
- **编解码**: WebCodecs API 直接调用系统的硬件编/解码器
- **帧处理**: OffscreenCanvas 完成分辨率和帧率的调整
- **全本地**: 所有处理在浏览器内完成，视频数据不会离开你的电脑

---

```
File → mp4box.js(demux) → VideoDecoder(GPU decode) → Canvas(resize/fps)
     → VideoEncoder(GPU encode) → mp4box.js(mux) → .mp4 download
```

- **Demux/Mux**: mp4box.js parses and generates MP4 containers
- **Codec**: WebCodecs API directly invokes system hardware codecs
- **Frame processing**: OffscreenCanvas handles resolution and framerate changes
- **100% local**: All processing happens in-browser. Video data never leaves your machine.

## 预估大小公式 / Size Estimation Formula

```
预估大小 = (视频码率 + 音频码率) × 时长 / 8 × 1.02

Estimated Size = (video bitrate + audio bitrate) × duration / 8 × 1.02
```

- `1.02` = MP4 容器开销系数 / container overhead (~2%)
- ±5% 为正常浮动范围 / normal variance

## 文件结构 / File Structure

```
VideoCompress/
├── index.html          # 主页面，内嵌全部 CSS/JS (970 行)
├── mp4box.all.js       # mp4box.js 容器处理库 (144KB, 纯 JS)
├── package.json
└── docs/
    ├── specs/          # 设计文档
    └── plans/          # 实现计划
```

## 支持的编码器 / Supported Codecs

| 编码器 Codec | 输出 Output | GPU 加速 GPU Accelerated |
|-------------|------------|-------------------------|
| H.264 (Baseline/Main/High) | ✅ | ✅ 普遍可用 |
| H.265/HEVC | ✅ | ⚠️ 需显卡/驱动支持 |
| VP9 | ✅ | ✅ Chrome 内置 |
| AV1 | ✅ | ⚠️ 需较新硬件 |

编码器可用性在页面加载时自动检测，不支持的会灰掉。  
Codec availability is auto-detected on page load. Unsupported ones are grayed out.

## 常见问题 / FAQ

**Q: 为什么需要本地 HTTP 服务器？**  
A: `file://` 协议下浏览器禁止使用某些 API（如 Web Workers 中的 fetch）。用 `python -m http.server` 一行命令即可。

**Q: Firefox/Safari 能用吗？**  
A: 当前 Firefox 和 Safari 的 WebCodecs 支持不完整，推荐使用 Chrome 或 Edge。

**Q: 为什么 H.265 是灰的？**  
A: H.265 硬件编码需要显卡和驱动支持。多数 N 卡（GTX 10 系+）和 Intel 核显（6 代+）支持。

**Q: 压缩速度有多快？**  
A: GPU 硬编码通常能达到 2-5x 实时速度。具体取决于分辨率、码率和硬件。

---

**Q: Why do I need a local HTTP server?**  
A: The `file://` protocol blocks certain browser APIs. `python -m http.server` solves this with one command.

**Q: Does Firefox/Safari work?**  
A: Currently Firefox and Safari have incomplete WebCodecs support. Chrome or Edge is recommended.

**Q: Why is H.265 grayed out?**  
A: H.265 hardware encoding requires GPU driver support. Most NVIDIA (GTX 10+) and Intel iGPUs (6th gen+) support it.

**Q: How fast is the compression?**  
A: GPU hardware encoding typically achieves 2-5x real-time speed, depending on resolution, bitrate, and hardware.

## License

MIT
