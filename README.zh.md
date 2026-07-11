# 🎬 视频压缩 — 本地 GPU 加速

> [📖 English Docs](README.en.md) | [🏠 Home](README.md)

基于 Node.js + FFmpeg 的本地视频压缩工具，支持 NVIDIA / AMD / Intel GPU 硬件编码。网页端操作，服务端处理，无需上传任何数据。

## 功能

| 功能 | 说明 |
|------|------|
| 🚀 **GPU 加速** | NVIDIA NVENC / AMD AMF / Intel QSV 硬件编码 |
| 📐 **分辨率** | 预设 (4K / 2K / 1080p / 720p / 480p) + 自定义宽高 |
| 📊 **码率控制** | 500 Kbps ~ 50 Mbps，VBR / CBR 模式 |
| 🎞️ **帧率** | 保持原始 / 60 / 30 / 24 / 15 fps |
| 🎵 **音频** | AAC 编码，64 ~ 320 Kbps |
| 🔮 **预估大小** | 实时计算 ±5% 范围，显示节省百分比 |
| 📦 **批量处理** | 多文件队列，独立参数，顺序处理 |
| 👁️ **预览对比** | 并排 + 滑块对比，压缩前后大小统计 |
| 🌐 **中英双语** | 页面右上角一键切换 |

## 浏览器要求

任意现代浏览器均可使用（Chrome / Edge / Firefox / Safari）。

## 环境要求

| 组件 | 要求 |
|------|------|
| Node.js | 18+ |
| FFmpeg | 4.0+（支持便携模式，见下方） |

## 快速开始

### 1. 克隆项目

```bash
git clone git@github.com:erhuotoutou/VideoCompress.git
cd VideoCompress
npm install
```

### 2. 安装 FFmpeg（一键脚本）

```bash
node setup.js
```

自动从网络下载 FFmpeg 到 `bin/` 目录（约 100MB，仅首次需要）。

也可以手动配置：

```bash
# 或从 https://ffmpeg.org/download.html 下载后放入 bin/
# 或设置环境变量 FFMPEG_PATH / FFPROBE_PATH
# 或确保系统已安装: ffmpeg -version
```

### 3. 启动服务器

```bash
node server.js
```

启动日志会显示当前使用的 FFmpeg 路径：

```
FFmpeg : C:\...\bin\ffmpeg.exe
FFprobe: C:\...\bin\ffprobe.exe
```

### 4. 打开浏览器

```
http://localhost:3000
```

页面右上角显示「服务器 ✅」表示连接正常。

### 5. 使用

1. **拖入视频** → 支持 MP4 / WebM / MKV / MOV（也可点击选择或 Ctrl+V 粘贴）
2. **等待分析** → 服务器通过 ffprobe 获取视频元数据
3. **设置参数** → 分辨率、编码器、码率、帧率、音频
4. **点击开始** → 左下角日志面板显示实时进度
5. **下载 / 对比** → 完成后下载压缩视频，或打开对比窗口

> 每个文件可独立设置参数，使用「应用到全部」按钮批量同步。

## 架构

```
浏览器 (public/index.html)
    │  POST /api/upload       ← 上传文件
    │  GET  /api/info/:id     ← ffprobe 获取元数据
    │  POST /api/compress/:id ← 启动 FFmpeg
    │  GET  /api/progress/:id ← SSE 实时进度
    │  GET  /api/download/:id ← 下载结果
    ▼
server.js (Express + fluent-ffmpeg)
    │
    ▼
FFmpeg (ffmpeg + ffprobe)
```

## 支持的编码器

| 编码器 | 类型 | 说明 |
|--------|------|------|
| libx264 | 软件 | H.264，最通用 |
| **h264_nvenc** | NVIDIA GPU | H.264 硬件编码 |
| h264_amf | AMD GPU | H.264 硬件编码 |
| h264_qsv | Intel GPU | H.264 硬件编码 |
| libx265 | 软件 | H.265，更高压缩比 |
| **hevc_nvenc** | NVIDIA GPU | H.265 硬件编码 |
| libvpx-vp9 | 软件 | VP9，WebM 容器 |

> GPU 编码器需要对应的显卡和驱动支持。以 `_nvenc` 结尾的需要 NVIDIA 显卡，`_amf` 需要 AMD 显卡，`_qsv` 需要 Intel 核显。

## 预估大小公式

```
预估大小 = (视频码率 + 音频码率) × 时长 / 8 × 1.02
```

- `1.02` = MP4 容器开销系数（约 2%）
- ±5% 为正常浮动范围

## 文件结构

```
VideoCompress/
├── server.js           # Express 服务端
├── public/
│   └── index.html      # 前端页面
├── bin/                # FFmpeg 可执行文件（便携模式）
│   ├── ffmpeg.exe      # gitignored
│   ├── ffprobe.exe     # gitignored
│   └── README.txt
├── uploads/            # 临时上传（gitignored）
├── outputs/            # 压缩输出（gitignored）
└── README.md
```

## 常见问题

**Q: 如何确认 GPU 加速是否生效？**

A: 选择带 `NVENC` / `AMF` / `QSV` 的编码器（如 `h264_nvenc`），压缩时观察编码速度。GPU 编码通常能达到 5-20x 实时速度，CPU 编码通常只有 1-3x。

**Q: FFmpeg 下载哪个版本？**

A: Windows 用户从 [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) 下载 `ffmpeg-release-essentials.zip`，解压后把 `bin/` 里的 `ffmpeg.exe` 和 `ffprobe.exe` 拷贝到项目的 `bin/` 目录。

**Q: 能同时处理多个文件吗？**

A: 可以。拖入多个文件加入队列，设置参数后点击「全部开始」。队列按顺序逐个处理。

**Q: 文件存在哪里？安全吗？**

A: 上传的文件和压缩结果只存在本地服务器的 `uploads/` 和 `outputs/` 目录，不会上传到任何外部服务器。服务器只在 `localhost` 监听。

## License

MIT
