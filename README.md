# 🎬 VideoCompress

**本地 GPU 加速视频压缩工具** | **Local GPU-Accelerated Video Compressor**

> Node.js + FFmpeg 架构，支持 NVIDIA / AMD / Intel GPU 硬件编码

[📖 中文文档](README.zh.md) | [📖 English Docs](README.en.md)

---

## 快速开始 / Quick Start

```bash
git clone git@github.com:erhuotoutou/VideoCompress.git
cd VideoCompress
npm install

# 方式 A: 便携模式（推荐）
#   从 https://ffmpeg.org/download.html 下载 ffmpeg.exe + ffprobe.exe
#   放入 bin/ 目录，无需安装

# 方式 B: 系统安装
#   确保 ffmpeg -version 可用

node server.js
# → http://localhost:3000
```

> 要求 Node.js 18+ | FFmpeg 4.0+

选择语言查看完整文档 / Choose language for full docs:

- [中文文档 (README.zh.md)](README.zh.md)
- [English Docs (README.en.md)](README.en.md)

## License

MIT
