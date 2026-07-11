# 🎬 视频压缩 — 本地 GPU 加速

> [📖 English Docs](README.en.md) | [🏠 Home](README.md)

纯浏览器的视频压缩工具，调用 GPU 硬件编码，无需上传任何数据。

## 功能

| 功能 | 说明 |
|------|------|
| 🚀 **GPU 加速** | WebCodecs API → NVENC / AMF / QSV 硬件编码 |
| 📐 **分辨率** | 预设 (4K / 2K / 1080p / 720p / 480p) + 自定义宽高 |
| 📊 **码率控制** | 500 Kbps ~ 50 Mbps，VBR / CBR 模式 |
| 🎞️ **帧率** | 保持原始 / 60 / 30 / 24 / 15 fps |
| 🎵 **音频** | AAC 编码，64 ~ 320 Kbps |
| 🔮 **预估大小** | 实时计算 ±5% 范围，显示节省百分比 |
| 📦 **批量处理** | 多文件队列，独立参数，顺序处理 |
| 👁️ **预览对比** | 并排 + 滑块对比，压缩前后大小统计 |

## 浏览器要求

| 浏览器 | 支持 |
|--------|------|
| Chrome 94+ | ✅ 完整 GPU 加速 |
| Edge 94+ | ✅ 完整 GPU 加速 |
| Firefox | ⚠️ WebCodecs 支持不完整 |
| Safari | ⚠️ WebCodecs 支持不完整 |

## 快速开始

### 1. 克隆项目

```bash
git clone git@github.com:erhuotoutou/VideoCompress.git
cd VideoCompress
```

### 2. 启动本地服务器

必须通过 HTTP 服务器访问（`file://` 协议下 WebCodecs 不可用）：

```bash
# 方式 A: Python (推荐)
python -m http.server 3000

# 方式 B: Node.js
npx serve . -p 3000 --no-clipboard
```

### 3. 打开浏览器

```
http://localhost:3000
```

### 4. 使用

1. **拖入视频** → 拖拽区支持 MP4 / WebM / MKV / MOV（也支持点击选择或 Ctrl+V 粘贴）
2. **设置参数** → 分辨率、编码器、码率、帧率、音频
3. **点击开始** → 左下角日志面板显示实时进度
4. **下载 / 对比** → 完成后下载压缩视频，或打开对比窗口查看画质差异

> 每个文件可独立设置参数，使用「应用到全部」按钮批量同步。

## 工作原理

```
文件 → <video>元素解码 → Canvas(缩放/帧率)
     → VideoEncoder(GPU编码) → mp4box.js(封装) → .mp4 下载
```

- **解码**: 浏览器原生 `<video>` 元素解码，兼容所有播放格式
- **帧处理**: Canvas 完成分辨率和帧率的调整
- **编码**: WebCodecs API 直接调用系统的 GPU 硬件编码器
- **封装**: mp4box.js 生成 MP4 容器
- **全本地**: 所有处理在浏览器内完成，视频数据不会离开你的电脑

## 预估大小公式

```
预估大小 = (视频码率 + 音频码率) × 时长 / 8 × 1.02
```

- `1.02` = MP4 容器开销系数（约 2%）
- ±5% 为正常浮动范围

## 文件结构

```
VideoCompress/
├── index.html          # 主页面，内嵌全部 CSS/JS
├── mp4box.all.js       # mp4box.js 容器处理库 (纯 JS)
├── README.md           # 首页 (语言选择)
├── README.zh.md        # 中文文档 (本文件)
├── README.en.md        # 英文文档
└── docs/
    ├── specs/          # 设计文档
    └── plans/          # 实现计划
```

## 支持的编码器

| 编码器 | 输出 | GPU 加速 |
|--------|------|----------|
| H.264 (Baseline / Main / High) | ✅ | ✅ 普遍可用 |
| H.265 / HEVC | ✅ | ⚠️ 需显卡 / 驱动支持 |
| VP9 | ✅ | ✅ Chrome 内置 |
| AV1 | ✅ | ⚠️ 需较新硬件 |

编码器可用性在页面加载时自动检测，不支持的会灰掉。

## 常见问题

**Q: 为什么需要本地 HTTP 服务器？**

A: `file://` 协议下浏览器禁止使用某些 API。用 `python -m http.server` 一行命令即可。

**Q: Firefox / Safari 能用吗？**

A: 当前 Firefox 和 Safari 的 WebCodecs 支持不完整，推荐使用 Chrome 或 Edge。

**Q: 为什么 H.265 是灰的？**

A: H.265 硬件编码需要显卡和驱动支持。多数 N 卡（GTX 10 系+）和 Intel 核显（6 代+）支持。

**Q: 压缩速度有多快？**

A: GPU 硬编码通常能达到 2-5x 实时速度。具体取决于分辨率、码率和硬件。

**Q: 为什么有些 MP4 文件无法压缩？**

A: 相机直出的 MP4 文件编码格式可能特殊。项目已使用浏览器原生解码器处理帧提取，浏览器能播放的视频理论上都能压缩。如仍有问题请提 Issue。

## License

MIT
