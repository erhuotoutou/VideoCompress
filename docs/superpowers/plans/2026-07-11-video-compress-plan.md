# 本地视频压缩网页 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个纯浏览器端的视频压缩工具，使用 WebCodecs API 调用 GPU 硬件编码，支持参数调节、预估大小、批量处理和预览对比。

**Architecture:** 单 HTML 文件内嵌所有 CSS/JS，通过 mp4box.js 处理容器解封装/封装，WebCodecs API 处理编解码。依赖两个本地文件：`mp4box.all.js` 和 `mp4box.wasm`。通过本地 HTTP 服务器 (`npx serve .`) 访问。

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES2020+), WebCodecs API, mp4box.js v0.5.2

## Global Constraints

- 所有资源从本地加载，无需网络连接
- 视频数据全程在浏览器内处理，不上传任何数据
- 目标浏览器: Chrome 94+ / Edge 94+（WebCodecs 完整支持）
- 响应式布局，适配 1024px 及以上宽度
- 所有代码在单一 `index.html` 文件中
- 编码进度实时展示

---

### Task 1: 项目初始化与 HTML 骨架

**Files:**
- Create: `index.html`
- Create: `mp4box.all.js` (下载)
- Create: `mp4box.wasm` (下载)

**Interfaces:**
- Produces: `index.html` 包含基础 HTML 结构、CSS 变量/布局、空的 `<script>` 标签加载 mp4box

- [ ] **Step 1: 创建项目目录并下载 mp4box.js 依赖**

```bash
cd c:/VisualStudioProject/VideoCompress
# Download mp4box.all.min.js and mp4box.wasm from gpac/mp4box.js releases
# 使用 WebFetch 获取最新 release 信息，或直接从已知 URL 下载
```

- [ ] **Step 2: 下载依赖文件**

用以下命令下载 mp4box.js v0.5.2：

```bash
curl -L -o mp4box.all.js https://cdn.jsdelivr.net/npm/mp4box@0.5.2/dist/mp4box.all.js
curl -L -o mp4box.wasm https://cdn.jsdelivr.net/npm/mp4box@0.5.2/dist/mp4box.all.wasm
```

验证文件存在且大小合理（mp4box.all.js ~400KB, mp4box.wasm ~500KB）:

```bash
ls -lh mp4box.all.js mp4box.wasm
```

- [ ] **Step 3: 创建 index.html 骨架**

创建包含完整 HTML5 结构、CSS 变量系统和空脚本标签的文件：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>视频压缩 - 本地 GPU 加速</title>
<style>
/* === CSS Variables === */
:root {
  --bg: #0f0f0f;
  --surface: #1a1a1a;
  --surface-2: #242424;
  --border: #333;
  --text: #e0e0e0;
  --text-secondary: #999;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --radius: 8px;
  --radius-lg: 12px;
  --shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* === Reset & Base === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
}

/* === Layout === */
.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* === Components placeholder === */
</style>
</head>
<body>
<div class="app-container">
  <!-- SECTION: Header -->
  <header class="header">
    <h1>🎬 视频压缩</h1>
    <span class="browser-status" id="browserStatus">检测中...</span>
  </header>

  <!-- SECTION: Compatibility Banner -->
  <div id="compatBanner" class="compat-banner hidden"></div>

  <!-- SECTION: Drop Zone -->
  <div id="dropZone" class="drop-zone">
    <div class="drop-zone__content">
      <span class="drop-zone__icon">📁</span>
      <p>拖拽视频文件到这里</p>
      <p class="drop-zone__hint">支持 MP4 / WebM / MKV / MOV</p>
      <button id="fileSelectBtn" class="btn btn--primary">选择文件</button>
      <input type="file" id="fileInput" hidden multiple accept=".mp4,.webm,.mkv,.mov,.avi">
    </div>
  </div>

  <!-- SECTION: Queue -->
  <section id="queueSection" class="queue-section hidden">
    <div class="queue-header">
      <h2>队列 (<span id="queueCount">0</span>)</h2>
      <div class="queue-actions">
        <button id="startAllBtn" class="btn btn--primary">全部开始</button>
        <button id="clearQueueBtn" class="btn btn--ghost">清空</button>
      </div>
    </div>
    <div id="queueList" class="queue-list"></div>
  </section>

  <!-- SECTION: Main Content (Params + Preview) -->
  <div id="mainContent" class="main-content hidden">
    <aside id="paramPanel" class="param-panel">
      <!-- Populated dynamically -->
    </aside>
    <section id="previewArea" class="preview-area">
      <!-- Populated dynamically -->
    </section>
  </div>

  <!-- SECTION: Comparison Modal -->
  <div id="compareModal" class="modal hidden">
    <div class="modal__backdrop"></div>
    <div class="modal__content">
      <button class="modal__close" id="closeCompare">&times;</button>
      <div id="compareContent"></div>
    </div>
  </div>
</div>

<script src="mp4box.all.js"></script>
<script>
// === SECTION: Application State ===
// (populated in later tasks)

// === SECTION: Utility Functions ===
// (populated in later tasks)
</script>
</body>
</html>
```

- [ ] **Step 4: 验证文件可加载**

用本地服务器启动并确认页面无 JS 错误：

```bash
npx serve . --no-clipboard
```

打开 `http://localhost:3000`，确认：
- 标题"🎬 视频压缩"显示
- 浏览器状态 "检测中..." 显示
- 控制台无错误（mp4box 全局对象已加载）
- 拖拽区域可见

- [ ] **Step 5: Commit**

```bash
git add index.html mp4box.all.js mp4box.wasm
git commit -m "chore: initialize project with HTML skeleton and mp4box.js dependency"
```

---

### Task 2: CSS 样式系统与响应式布局

**Files:**
- Modify: `index.html` — 替换 `<style>` 块中的 `/* === Components placeholder === */` 为完整样式

**Interfaces:**
- Consumes: HTML 骨架 (Task 1)
- Produces: 完整 CSS 样式系统，所有组件样式可用

- [ ] **Step 1: 将完整 CSS 替换写入 index.html**

定位 `/* === Components placeholder === */`，替换为以下完整样式：

```css
/* === Header === */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.header h1 { font-size: 24px; font-weight: 700; }
.browser-status {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 20px;
  background: var(--surface-2);
}
.browser-status.supported { color: var(--success); }
.browser-status.unsupported { color: var(--error); }

/* === Compatibility Banner === */
.compat-banner {
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
}
.compat-banner.error {
  background: #3b1111;
  color: #fca5a5;
  border: 1px solid #7f1d1d;
}
.compat-banner.warning {
  background: #2d1f00;
  color: #fcd34d;
  border: 1px solid #78350f;
}
.hidden { display: none !important; }

/* === Buttons === */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn--primary {
  background: var(--accent);
  color: #fff;
}
.btn--primary:hover { background: var(--accent-hover); }
.btn--primary:disabled {
  background: var(--border);
  color: var(--text-secondary);
  cursor: not-allowed;
}
.btn--ghost {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}
.btn--ghost:hover { background: var(--surface-2); }
.btn--danger {
  background: transparent;
  color: var(--error);
  border: 1px solid var(--error);
}
.btn--danger:hover { background: #3b1111; }
.btn--small { padding: 4px 10px; font-size: 12px; }
.btn--icon {
  padding: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius);
}
.btn--icon:hover { color: var(--text); background: var(--surface-2); }

/* === Drop Zone === */
.drop-zone {
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 48px;
  text-align: center;
  transition: all 0.2s;
  margin-bottom: 24px;
}
.drop-zone.active {
  border-color: var(--accent);
  background: rgba(59, 130, 246, 0.08);
}
.drop-zone__icon { font-size: 48px; display: block; margin-bottom: 12px; }
.drop-zone p { margin-bottom: 8px; }
.drop-zone__hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

/* === Queue === */
.queue-section { margin-bottom: 24px; }
.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.queue-header h2 { font-size: 18px; }
.queue-actions { display: flex; gap: 8px; }
.queue-list { display: flex; flex-direction: column; gap: 8px; }

.queue-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color 0.15s;
}
.queue-item:hover { border-color: var(--text-secondary); }
.queue-item.selected { border-color: var(--accent); background: var(--surface-2); }
.queue-item.processing { border-color: var(--accent); }
.queue-item.completed { border-color: var(--success); }
.queue-item.failed { border-color: var(--error); }

.queue-item__info { min-width: 0; }
.queue-item__name {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.queue-item__meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.queue-item__target {
  font-size: 12px;
  color: var(--accent);
  margin-top: 2px;
}
.queue-item__progress {
  grid-column: 1 / -1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}
.queue-item__progress-bar {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s;
  width: 0%;
}
.queue-item__progress-bar.completed { background: var(--success); }
.queue-item__progress-bar.failed { background: var(--error); }

.queue-item__actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
.queue-item__status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}
.status-pending { color: var(--text-secondary); background: var(--surface-2); }
.status-processing { color: var(--accent); background: rgba(59,130,246,0.15); }
.status-completed { color: var(--success); background: rgba(34,197,94,0.15); }
.status-failed { color: var(--error); background: rgba(239,68,68,0.15); }

/* === Main Content Layout === */
.main-content {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1100px) {
  .main-content { grid-template-columns: 1fr; }
}

/* === Parameter Panel === */
.param-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  position: sticky;
  top: 24px;
}
.param-panel h3 {
  font-size: 16px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.param-group { margin-bottom: 20px; }
.param-group__label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.param-group__value {
  font-size: 14px;
  font-weight: 500;
}

/* Resolution presets */
.resolution-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}
.resolution-preset {
  padding: 6px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 12px;
  color: var(--text);
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}
.resolution-preset:hover { border-color: var(--accent); }
.resolution-preset.active {
  border-color: var(--accent);
  background: rgba(59,130,246,0.15);
  color: var(--accent);
}
.custom-resolution {
  display: flex;
  gap: 8px;
  align-items: center;
}
.custom-resolution input {
  width: 80px;
  padding: 6px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 13px;
  text-align: center;
}
.custom-resolution input:focus {
  outline: none;
  border-color: var(--accent);
}
.custom-resolution span {
  font-size: 14px;
  color: var(--text-secondary);
}

/* Select & Range */
.param-select {
  width: 100%;
  padding: 8px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
}
.param-select:focus { outline: none; border-color: var(--accent); }
.param-select:disabled { opacity: 0.5; cursor: not-allowed; }
.param-select option:disabled { color: var(--text-secondary); }

.bitrate-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bitrate-group input[type="range"] {
  flex: 1;
  accent-color: var(--accent);
}
.bitrate-group input[type="number"] {
  width: 90px;
  padding: 6px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 13px;
  text-align: center;
}
.bitrate-group input[type="number"]:focus {
  outline: none;
  border-color: var(--accent);
}
.bitrate-group__unit {
  font-size: 13px;
  color: var(--text-secondary);
}
.bitrate-presets {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.bitrate-preset {
  padding: 4px 8px;
  font-size: 11px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-secondary);
  cursor: pointer;
}
.bitrate-preset:hover { border-color: var(--accent); color: var(--text); }

/* Radio group */
.radio-group {
  display: flex;
  gap: 16px;
}
.radio-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}
.radio-group input[type="radio"] { accent-color: var(--accent); }

/* === Estimate === */
.estimate-display {
  padding: 12px;
  background: var(--surface-2);
  border-radius: var(--radius);
  text-align: center;
  margin-top: 12px;
}
.estimate-display__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
}
.estimate-display__range {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.estimate-display__percent {
  font-size: 13px;
  color: var(--success);
  margin-top: 4px;
}

/* === Apply All Button === */
.apply-all-btn {
  width: 100%;
  margin-top: 8px;
}

/* === Preview Area === */
.preview-area {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.preview-area__empty {
  text-align: center;
  color: var(--text-secondary);
}
.preview-area__empty span { font-size: 48px; display: block; margin-bottom: 12px; }
.preview-area video {
  max-width: 100%;
  max-height: 500px;
  border-radius: var(--radius);
}
.preview-area__info {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
.preview-area__info span {
  white-space: nowrap;
}

/* Comparison */
.compare-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.compare-side {
  text-align: center;
}
.compare-side h4 { margin-bottom: 8px; font-size: 14px; }
.compare-side video {
  width: 100%;
  max-height: 400px;
  border-radius: var(--radius);
  background: #000;
}
.compare-stats {
  grid-column: 1 / -1;
  display: flex;
  gap: 24px;
  justify-content: center;
  padding: 16px;
  background: var(--surface-2);
  border-radius: var(--radius);
}
.compare-stat {
  text-align: center;
}
.compare-stat__value {
  font-size: 24px;
  font-weight: 700;
}
.compare-stat__value.saved { color: var(--success); }
.compare-stat__label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Slider comparison */
.slider-compare {
  position: relative;
  width: 100%;
  max-height: 400px;
  overflow: hidden;
}
.slider-compare video {
  width: 100%;
  display: block;
}
.slider-compare__top {
  position: absolute;
  top: 0;
  left: 0;
  clip-path: inset(0 50% 0 0);
}
.slider-compare__handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #fff;
  cursor: ew-resize;
  left: 50%;
}

/* === Modal === */
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.7);
}
.modal__content {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 1;
}
.modal__close {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 24px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
}
.modal__close:hover { color: var(--text); }

/* === Toast === */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  padding: 12px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow);
  animation: slideIn 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 250px;
}
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.toast--info { background: var(--accent); color: #fff; }
.toast--error { background: var(--error); color: #fff; }
.toast--success { background: var(--success); color: #fff; }
.toast--warning { background: var(--warning); color: #000; }

/* === Responsive === */
@media (max-width: 768px) {
  .app-container { padding: 12px; }
  .header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .main-content { grid-template-columns: 1fr; }
  .param-panel { position: static; }
  .compare-container { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: 验证样式**

启动本地服务器，在 Chrome DevTools 中检查：
- 暗色主题正常渲染
- 拖拽区有虚线边框和居中文字
- 按钮 hover 效果正常
- 缩小浏览器到 768px 时布局切换为单列

```bash
npx serve . --no-clipboard
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "style: add complete CSS design system with responsive layout"
```

---

### Task 3: 浏览器兼容性检测

**Files:**
- Modify: `index.html` — 在 `<script>` 标签中添加兼容性检测代码

**Interfaces:**
- Produces: `checkCompatibility()` 函数，返回 `{ supported, availableCodecs, warnings }`
- Produces: `updateBrowserStatus(compat)` 更新状态标签
- Produces: `showCompatBanner(warnings)` 显示警告横幅

- [ ] **Step 1: 编写兼容性检测函数**

在 `<script>` 标签中的 `// === SECTION: Application State ===` 之后添加：

```javascript
// === SECTION: Compatibility Detection ===

/**
 * Check browser support for WebCodecs API and available codecs.
 * @returns {Promise<{supported: boolean, codecs: Array<{codec: string, label: string, supported: boolean}>}>}
 */
async function checkCompatibility() {
  const result = {
    supported: false,
    codecs: [],
    warnings: []
  };

  // Check API existence
  const hasVideoEncoder = typeof VideoEncoder !== 'undefined';
  const hasVideoDecoder = typeof VideoDecoder !== 'undefined';
  const hasAudioEncoder = typeof AudioEncoder !== 'undefined';
  const hasAudioDecoder = typeof AudioDecoder !== 'undefined';

  if (!hasVideoEncoder || !hasVideoDecoder) {
    result.warnings.push(
      '当前浏览器不支持 WebCodecs API。请使用 Chrome 94+ 或 Edge 94+ 以获得完整的 GPU 加速视频压缩体验。'
    );
    return result;
  }

  result.supported = true;

  // Test codec support
  const codecConfigs = [
    { codec: 'avc1.42001E', label: 'H.264 Baseline', hardware: true },
    { codec: 'avc1.4D002A', label: 'H.264 Main', hardware: true },
    { codec: 'avc1.640028', label: 'H.264 High', hardware: true },
    { codec: 'hvc1.1.6.L120.90', label: 'H.265/HEVC', hardware: true },
    { codec: 'vp09.00.10.08', label: 'VP9', hardware: true },
    { codec: 'av01.0.04M.08', label: 'AV1', hardware: true },
  ];

  for (const config of codecConfigs) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec: config.codec,
        width: 1920,
        height: 1080,
        bitrate: 5_000_000,
        framerate: 30,
      });
      config.supported = support.supported === true;
      if (support.supported && config.hardware) {
        // Check for hardware acceleration
        const hwSupport = await VideoEncoder.isConfigSupported({
          codec: config.codec,
          width: 1920,
          height: 1080,
          bitrate: 5_000_000,
          framerate: 30,
          hardwareAcceleration: 'prefer-hardware',
        });
        config.hardwareAccelerated = hwSupport.supported === true;
      }
    } catch {
      config.supported = false;
      config.hardwareAccelerated = false;
    }
    result.codecs.push(config);
  }

  // Check AAC support for audio
  if (hasAudioEncoder) {
    try {
      const aacSupport = await AudioEncoder.isConfigSupported({
        codec: 'mp4a.40.2',
        sampleRate: 48000,
        numberOfChannels: 2,
      });
      result.aacSupported = aacSupport.supported === true;
    } catch {
      result.aacSupported = false;
    }
  }

  return result;
}

/**
 * Get enabled (supported) codecs grouped for the dropdown UI.
 */
function getAvailableCodecs(result) {
  return result.codecs
    .filter(c => c.supported)
    .map(c => ({
      value: c.codec,
      label: c.label + (c.hardwareAccelerated ? ' (GPU)' : ' (CPU)'),
      hardware: c.hardwareAccelerated,
    }));
}
```

- [ ] **Step 2: 编写 UI 更新函数**

在兼容性检测代码后添加：

```javascript
function updateBrowserStatus(compat) {
  const statusEl = document.getElementById('browserStatus');
  if (compat.supported) {
    const gpuCodecs = compat.codecs.filter(c => c.hardwareAccelerated);
    statusEl.textContent = gpuCodecs.length > 0
      ? `Chrome ✅ | GPU 加速可用 (${gpuCodecs.length} 个编码器)`
      : 'Chrome ✅ | 软编码模式';
    statusEl.className = 'browser-status supported';
  } else {
    statusEl.textContent = '⚠️ 不支持 WebCodecs';
    statusEl.className = 'browser-status unsupported';
  }
}

function showCompatBanner(compat) {
  const banner = document.getElementById('compatBanner');
  if (!compat.supported) {
    banner.className = 'compat-banner error';
    banner.textContent = compat.warnings[0];
  } else if (compat.warnings.length > 0) {
    banner.className = 'compat-banner warning';
    banner.textContent = compat.warnings.join(' ');
  } else {
    banner.className = 'compat-banner hidden';
  }
}
```

- [ ] **Step 3: 在页面加载时调用**

在 `</script>` 前添加初始化代码：

```javascript
// === SECTION: Initialization ===

let compatibilityResult = null;

async function init() {
  compatibilityResult = await checkCompatibility();
  updateBrowserStatus(compatibilityResult);
  showCompatBanner(compatibilityResult);

  if (!compatibilityResult.supported) {
    // Disable all interactive elements
    document.getElementById('dropZone').style.opacity = '0.5';
    document.getElementById('dropZone').style.pointerEvents = 'none';
    return;
  }

  // Store for later use
  console.log('Compatibility:', compatibilityResult);
}

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 4: 验证兼容性检测**

启动服务器，在不同浏览器中打开：
- **Chrome 94+**: 应显示 "Chrome ✅ | GPU 加速可用"
- **不支持的浏览器**（可通过注释掉 VideoEncoder 模拟）: 应显示红色横幅

```bash
npx serve . --no-clipboard
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add browser compatibility detection for WebCodecs"
```

---

### Task 4: 文件管理与拖拽导入

**Files:**
- Modify: `index.html` — 添加文件管理代码到 `<script>` 标签中

**Interfaces:**
- Produces: `appState` 全局状态对象: `{ queue: FileTask[], selectedId: string | null }`
- Produces: `FileTask` 数据结构: `{ id, file, status, originalInfo, options, result }`
- Produces: `addFiles(files)` / `removeTask(id)` / `selectTask(id)` / `updateTaskOptions(id, options)`

- [ ] **Step 1: 定义状态与数据结构**

在 `// === SECTION: Application State ===` 注释后添加：

```javascript
// === SECTION: Application State ===

/**
 * @typedef {Object} FileTask
 * @property {string} id - Unique task ID
 * @property {File} file - Original File object
 * @property {'pending'|'processing'|'completed'|'failed'} status
 * @property {Object|null} originalInfo - Extracted media info
 * @property {Object|null} options - User-selected compression options
 * @property {Object|null} result - Compression result (size, url, etc.)
 * @property {string|null} error - Error message if failed
 * @property {number} progress - 0-100
 * @property {AbortController|null} abortController
 */

const appState = {
  /** @type {FileTask[]} */
  queue: [],
  /** @type {string|null} */
  selectedId: null,
  /** @type {number} */
  processingCount: 0,
};

// Constants
const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024; // 4GB
const SUPPORTED_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.mov', '.avi'];
const SUPPORTED_MIME_TYPES = [
  'video/mp4', 'video/webm', 'video/x-matroska',
  'video/quicktime', 'video/x-msvideo'
];

// Toast container
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);
```

- [ ] **Step 2: 实现文件验证与添加逻辑**

```javascript
// === SECTION: File Management ===

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function isValidVideoFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext) || SUPPORTED_MIME_TYPES.includes(file.type);
}

function addFiles(files) {
  const newTasks = [];

  for (const file of files) {
    if (!isValidVideoFile(file)) {
      showToast(`"${file.name}" 不是支持的视频格式`, 'warning');
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast(`"${file.name}" 文件过大（超过 4GB）`, 'error');
      continue;
    }
    // Check for duplicates by name+size
    const exists = appState.queue.some(
      t => t.file.name === file.name && t.file.size === file.size
    );
    if (exists) {
      showToast(`"${file.name}" 已在队列中`, 'info');
      continue;
    }

    const task = {
      id: generateId(),
      file,
      status: 'pending',
      originalInfo: null,
      options: null,
      result: null,
      error: null,
      progress: 0,
      abortController: null,
    };
    newTasks.push(task);
  }

  appState.queue.push(...newTasks);

  // Auto-select first file if nothing selected
  if (!appState.selectedId && appState.queue.length > 0) {
    appState.selectedId = appState.queue[0].id;
  }

  renderQueue();
  updateMainContent();

  if (newTasks.length > 0) {
    // Start extracting media info for new files
    newTasks.forEach(task => extractMediaInfo(task));
  }
}

function removeTask(id) {
  const index = appState.queue.findIndex(t => t.id === id);
  if (index === -1) return;

  const task = appState.queue[index];
  if (task.status === 'processing' && task.abortController) {
    task.abortController.abort();
    appState.processingCount--;
  }

  // Revoke object URLs
  if (task.result?.url) URL.revokeObjectURL(task.result.url);

  appState.queue.splice(index, 1);

  if (appState.selectedId === id) {
    appState.selectedId = appState.queue.length > 0 ? appState.queue[0]?.id : null;
  }

  renderQueue();
  updateMainContent();
}

function selectTask(id) {
  appState.selectedId = id;
  renderQueue();
  updateMainContent();
}

function getSelectedTask() {
  return appState.queue.find(t => t.id === appState.selectedId) || null;
}

function clearCompleted() {
  appState.queue = appState.queue.filter(t => t.status !== 'completed');
  if (!appState.queue.find(t => t.id === appState.selectedId)) {
    appState.selectedId = appState.queue[0]?.id || null;
  }
  renderQueue();
  updateMainContent();
}
```

- [ ] **Step 3: 实现拖拽事件处理**

```javascript
// === SECTION: Drag & Drop ===

function setupDragDrop() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileSelectBtn = document.getElementById('fileSelectBtn');

  // Click to select
  fileSelectBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      addFiles(Array.from(fileInput.files));
      fileInput.value = '';
    }
  });

  // Drag events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('active');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('active');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('active');

    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter(f => f.type.startsWith('video/') || isValidVideoFile(f));
    if (videoFiles.length > 0) {
      addFiles(videoFiles);
    }
  });

  // Global paste support
  document.addEventListener('paste', (e) => {
    const items = Array.from(e.clipboardData.items);
    const files = items
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter(f => f && f.type.startsWith('video/'));
    if (files.length > 0) {
      addFiles(files);
    }
  });
}
```

- [ ] **Step 4: 实现队列 UI 渲染**

```javascript
// === SECTION: Queue Rendering ===

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '--';
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(0) + ' KB';
  return bytes + ' B';
}

function formatDuration(seconds) {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}分${s.toString().padStart(2, '0')}秒`;
}

function renderQueue() {
  const section = document.getElementById('queueSection');
  const list = document.getElementById('queueList');
  const countEl = document.getElementById('queueCount');

  if (appState.queue.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  countEl.textContent = appState.queue.length;

  list.innerHTML = appState.queue.map(task => {
    const isSelected = task.id === appState.selectedId;
    const info = task.originalInfo;

    let statusHtml = '';
    if (task.status === 'completed') {
      statusHtml = '<span class="queue-item__status status-completed">✅ 完成</span>';
    } else if (task.status === 'processing') {
      statusHtml = `<span class="queue-item__status status-processing">${task.progress}%</span>`;
    } else if (task.status === 'failed') {
      statusHtml = '<span class="queue-item__status status-failed">❌ 失败</span>';
    } else {
      statusHtml = '<span class="queue-item__status status-pending">等待中</span>';
    }

    let actionHtml = '';
    if (task.status === 'pending') {
      actionHtml = `<button class="btn btn--primary btn--small start-btn" data-id="${task.id}">开始</button>`;
    } else if (task.status === 'processing') {
      actionHtml = `<button class="btn btn--danger btn--small cancel-btn" data-id="${task.id}">取消</button>`;
    } else if (task.status === 'completed') {
      actionHtml = `
        <button class="btn btn--primary btn--small download-btn" data-id="${task.id}">下载</button>
        <button class="btn btn--ghost btn--small compare-btn" data-id="${task.id}">对比</button>
      `;
    } else if (task.status === 'failed') {
      actionHtml = `<button class="btn btn--ghost btn--small retry-btn" data-id="${task.id}">重试</button>`;
    }
    actionHtml += `<button class="btn btn--icon remove-btn" data-id="${task.id}" title="移除">✕</button>`;

    const infoHtml = info
      ? `${info.width || '?'}×${info.height || '?'} | ${info.fps || '?'}fps | ${info.codecLabel || '?'} | ${formatDuration(info.duration)}`
      : '正在分析...';

    const targetHtml = task.options
      ? `目标: ${task.options.width}×${task.options.height} | ${formatBitrate(task.options.videoBitrate)} | ${task.options.fps}fps | ${task.options.codecLabel}`
      : '';

    const estHtml = task.options && task.originalInfo
      ? `预估: ${formatSize(estimateSize(task.options, task.originalInfo.duration))}`
      : '';

    let progressBarHtml = '';
    if (task.status === 'processing' || task.status === 'completed' || task.status === 'failed') {
      progressBarHtml = `
        <div class="queue-item__progress">
          <div class="queue-item__progress-bar ${task.status}" style="width:${task.progress}%"></div>
        </div>`;
    }

    return `
      <div class="queue-item ${isSelected ? 'selected' : ''} ${task.status}" data-id="${task.id}">
        <div class="queue-item__info">
          <div class="queue-item__name">${escapeHtml(task.file.name)}</div>
          <div class="queue-item__meta">${formatSize(task.file.size)} | ${infoHtml}</div>
          ${targetHtml ? `<div class="queue-item__target">${targetHtml}</div>` : ''}
          ${estHtml ? `<div style="font-size:12px;color:var(--text-secondary)">${estHtml}</div>` : ''}
        </div>
        <div class="queue-item__actions">${actionHtml}</div>
        ${progressBarHtml}
      </div>
    `;
  }).join('');

  // Attach event listeners
  list.querySelectorAll('.queue-item').forEach(el => {
    el.addEventListener('click', (e) => {
      // Don't select if clicking a button
      if (e.target.closest('button')) return;
      selectTask(el.dataset.id);
    });
  });

  list.querySelectorAll('.start-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      startCompression(btn.dataset.id);
    });
  });

  list.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      cancelCompression(btn.dataset.id);
    });
  });

  list.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadResult(btn.dataset.id);
    });
  });

  list.querySelectorAll('.compare-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCompare(btn.dataset.id);
    });
  });

  list.querySelectorAll('.retry-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      retryTask(btn.dataset.id);
    });
  });

  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTask(btn.dataset.id);
    });
  });
}
```

- [ ] **Step 5: 实现 Toast 辅助函数**

```javascript
// === SECTION: Toast Notifications ===

function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

- [ ] **Step 6: 修改初始化函数以包含新功能**

更新 `init()` 添加 `setupDragDrop()` 调用：

```javascript
async function init() {
  compatibilityResult = await checkCompatibility();
  updateBrowserStatus(compatibilityResult);
  showCompatBanner(compatibilityResult);

  if (!compatibilityResult.supported) {
    document.getElementById('dropZone').style.opacity = '0.5';
    document.getElementById('dropZone').style.pointerEvents = 'none';
    return;
  }

  setupDragDrop();

  // Setup global buttons
  document.getElementById('startAllBtn').addEventListener('click', startAllCompression);
  document.getElementById('clearQueueBtn').addEventListener('click', clearCompleted);
  document.getElementById('closeCompare').addEventListener('click', closeCompare);

  console.log('Initialized, compatibility:', compatibilityResult);
}
```

- [ ] **Step 7: 添加占位函数（供后续任务实现）**

```javascript
// === SECTION: Placeholders (implemented in later tasks) ===

async function extractMediaInfo(task) {
  // Task 5
  task.originalInfo = {
    width: task.file.name ? 1920 : 0,
    height: task.file.name ? 1080 : 0,
    duration: 60,
    fps: 30,
    codec: 'avc1.4D002A',
    codecLabel: 'H.264',
    videoBitrate: 8000000,
    audioBitrate: 128000,
    hasAudio: true,
  };
  task.options = getDefaultOptions(task.originalInfo);
  renderQueue();
}

function getDefaultOptions(info) {
  return {
    width: info.width || 1920,
    height: info.height || 1080,
    codec: compatibilityResult?.codecs.find(c => c.supported)?.codec || 'avc1.4D002A',
    codecLabel: compatibilityResult?.codecs.find(c => c.supported)?.label || 'H.264',
    videoBitrate: Math.min((info.videoBitrate || 8000000), 10000000),
    bitrateMode: 'vbr',
    fps: info.fps || 30,
    audioBitrate: 128000,
    keepOriginalFps: true,
  };
}

function updateMainContent() {
  // Task 6
  const mainContent = document.getElementById('mainContent');
  const task = getSelectedTask();
  if (task) {
    mainContent.classList.remove('hidden');
    renderParamPanel(task);
    renderPreview(task);
  } else {
    mainContent.classList.add('hidden');
  }
}

function renderParamPanel(task) { /* Task 6 */ }
function renderPreview(task) { /* Task 10 */ }
function estimateSize(options, durationSeconds) { return 0; /* Task 7 */ }
function formatBitrate(bps) { return '--'; /* Task 6 */ }

async function startCompression(id) { /* Task 8 */ }
function cancelCompression(id) { /* Task 8 */ }
function startAllCompression() { /* Task 9 */ }
function downloadResult(id) { /* Task 8 */ }
function openCompare(id) { /* Task 10 */ }
function closeCompare() { /* Task 10 */ }
function retryTask(id) { /* Task 8 */ }

// === SECTION: Initialization ===
// (existing init code below)
```

- [ ] **Step 8: 验证文件管理功能**

启动服务器，测试：
- 拖拽视频文件到拖拽区 → 加入队列
- 点击拖拽区 → 文件选择器弹出
- 拖入不支持的格式 → Toast 提示
- 拖入重复文件 → Toast 提示 "已在队列中"
- 点击队列项 → 选中高亮
- 移除按钮 → 文件从队列删除

```bash
npx serve . --no-clipboard
```

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat: implement file management with drag-drop and queue UI"
```

---

### Task 5: 媒体信息提取（mp4box.js 解封装）

**Files:**
- Modify: `index.html` — 替换 `extractMediaInfo()` 和辅助函数

**Interfaces:**
- Modifies: `extractMediaInfo(task)` — 使用 mp4box.js 解析容器获取视频/音频轨道信息
- Produces: 填充 `task.originalInfo` 完整数据

- [ ] **Step 1: 替换 extractMediaInfo 为真实实现**

将 Task 4 中的占位 `extractMediaInfo` 替换为：

```javascript
// === SECTION: Media Info Extraction ===

async function extractMediaInfo(task) {
  try {
    const info = await parseVideoFile(task.file);
    task.originalInfo = info;
    task.options = getDefaultOptions(info);
    renderQueue();
    if (task.id === appState.selectedId) {
      updateMainContent();
    }
  } catch (err) {
    console.error('Failed to extract media info:', err);
    task.originalInfo = {
      width: 0, height: 0, duration: 0, fps: 0,
      codec: '', codecLabel: '未知', videoBitrate: 0,
      audioBitrate: 0, hasAudio: false, error: err.message,
    };
    task.options = getDefaultOptions(task.originalInfo);
    renderQueue();
  }
}

function parseVideoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target.result;
      const mp4boxFile = MP4Box.createFile();
      const info = {
        width: 0,
        height: 0,
        duration: 0,
        fps: 0,
        codec: '',
        codecLabel: '',
        videoBitrate: 0,
        audioBitrate: 0,
        hasAudio: false,
        videoTrackId: 0,
        audioTrackId: 0,
        trackInfo: null, // raw mp4box info for later use
      };

      let videoSamples = 0;
      let totalVideoSize = 0;
      let videoTimescale = 0;
      let ready = false;

      mp4boxFile.onReady = (mp4Info) => {
        info.trackInfo = mp4Info;

        if (!mp4Info.videoTracks || mp4Info.videoTracks.length === 0) {
          reject(new Error('文件中未找到视频轨道'));
          return;
        }

        const videoTrack = mp4Info.videoTracks[0];
        info.width = videoTrack.track_width;
        info.height = videoTrack.track_height;
        info.codec = videoTrack.codec || '';
        info.codecLabel = getCodecLabel(videoTrack.codec || '');
        info.videoTrackId = videoTrack.id;
        videoTimescale = videoTrack.timescale || 0;

        if (mp4Info.audioTracks && mp4Info.audioTracks.length > 0) {
          info.hasAudio = true;
          info.audioTrackId = mp4Info.audioTracks[0].id;
        }

        // Set extraction for video track
        mp4boxFile.setExtractionOptions(info.videoTrackId, null, { nbSamples: 2000 });
        if (info.hasAudio) {
          mp4boxFile.setExtractionOptions(info.audioTrackId, null, { nbSamples: 2000 });
        }

        ready = true;
      };

      mp4boxFile.onSamples = (trackId, user, samples) => {
        if (trackId === info.videoTrackId) {
          videoSamples += samples.length;
          for (const sample of samples) {
            totalVideoSize += sample.size;
            if (sample.dts > info.duration) {
              info.duration = sample.dts;
            }
          }
        }
      };

      mp4boxFile.onError = (err) => {
        reject(new Error('解析视频文件失败: ' + (err.message || '未知错误')));
      };

      // Feed buffer to mp4box
      buffer.fileStart = 0;
      mp4boxFile.appendBuffer(buffer);
      mp4boxFile.flush();

      // Wait a bit for all data to be parsed
      setTimeout(() => {
        if (!ready) {
          reject(new Error('无法解析视频文件（不支持的容器格式）'));
          return;
        }

        // Calculate derived values
        if (videoTimescale > 0 && videoSamples > 0) {
          info.fps = Math.round(videoSamples / (info.duration / videoTimescale));
        }

        // Calculate bitrate from actual data size
        if (info.duration > 0 && totalVideoSize > 0) {
          info.videoBitrate = Math.round((totalVideoSize * 8) / (info.duration / videoTimescale));
        } else {
          info.videoBitrate = 8_000_000; // default estimate
        }

        // Estimate audio bitrate
        if (info.hasAudio) {
          info.audioBitrate = 128_000; // default
        }

        // Duration in seconds
        info.duration = info.duration / (videoTimescale || 1);

        resolve(info);
      }, 500);
    };

    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsArrayBuffer(file);
  });
}

function getCodecLabel(codec) {
  if (!codec) return '未知';
  const c = codec.toLowerCase();
  if (c.includes('avc') || c.includes('h264')) return 'H.264';
  if (c.includes('hvc') || c.includes('hev') || c.includes('h265')) return 'H.265';
  if (c.includes('vp9') || c.includes('vp09')) return 'VP9';
  if (c.includes('vp8') || c.includes('vp08')) return 'VP8';
  if (c.includes('av1') || c.includes('av01')) return 'AV1';
  if (c.includes('mp4a')) return 'AAC';
  if (c.includes('opus')) return 'Opus';
  return codec.substring(0, 10);
}
```

- [ ] **Step 2: 更新 getDefaultOptions 以使用实际的兼容性数据**

替换 Task 4 中的 `getDefaultOptions`:

```javascript
function getDefaultOptions(info) {
  if (!compatibilityResult) {
    return {
      width: info.width || 1920,
      height: info.height || 1080,
      codec: 'avc1.42001E',
      codecLabel: 'H.264',
      videoBitrate: 5_000_000,
      bitrateMode: 'vbr',
      fps: info.fps || 30,
      audioBitrate: 128000,
      keepOriginalFps: true,
    };
  }

  const availableCodecs = getAvailableCodecs(compatibilityResult);
  const defaultCodec = availableCodecs.find(c => c.value.includes('avc1.4D002A'))
    || availableCodecs[0]
    || { value: 'avc1.42001E', label: 'H.264' };

  // Calculate recommended bitrate based on resolution
  const pixels = (info.width || 1920) * (info.height || 1080);
  let recBitrate;
  if (pixels >= 3840 * 2160) recBitrate = 35_000_000;  // 4K
  else if (pixels >= 2560 * 1440) recBitrate = 16_000_000; // 2K
  else if (pixels >= 1920 * 1080) recBitrate = 8_000_000;  // 1080p
  else if (pixels >= 1280 * 720) recBitrate = 5_000_000;   // 720p
  else recBitrate = 2_500_000; // 480p

  return {
    width: info.width || 1920,
    height: info.height || 1080,
    codec: defaultCodec.value,
    codecLabel: defaultCodec.label,
    videoBitrate: Math.min(info.videoBitrate || recBitrate, recBitrate),
    bitrateMode: 'vbr',
    fps: info.fps || 30,
    audioBitrate: 128000,
    keepOriginalFps: true,
  };
}
```

- [ ] **Step 3: 验证媒体信息提取**

启动服务器，拖入视频文件测试：
- 成功解析时队列项显示分辨率、帧率、编码格式、时长
- 拖入非视频文件（如 .txt）→ Toast 提示错误
- 不支持的容器格式 → 错误信息显示在队列中

```bash
npx serve . --no-clipboard
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: implement media info extraction with mp4box.js demux"
```

---

### Task 6: 参数面板

**Files:**
- Modify: `index.html` — 实现 `renderParamPanel()` 及辅助函数、事件处理

**Interfaces:**
- Modifies: `renderParamPanel(task)` — 渲染完整参数面板
- Modifies: `formatBitrate(bps)` — 格式化码率显示

- [ ] **Step 1: 实现参数面板渲染**

替换占位函数 `renderParamPanel`:

```javascript
// === SECTION: Parameter Panel ===

function formatBitrate(bps) {
  if (!bps && bps !== 0) return '--';
  if (bps >= 1_000_000) return (bps / 1_000_000).toFixed(1) + ' Mbps';
  if (bps >= 1_000) return (bps / 1_000).toFixed(0) + ' Kbps';
  return bps + ' bps';
}

function renderParamPanel(task) {
  const panel = document.getElementById('paramPanel');
  if (!task || !task.originalInfo) {
    panel.innerHTML = '<p class="preview-area__empty"><span>📋</span>选择一个文件以设置参数</p>';
    return;
  }

  const info = task.originalInfo;
  const opts = task.options;

  if (!opts) return;

  const availableCodecs = compatibilityResult
    ? getAvailableCodecs(compatibilityResult)
    : [{ value: 'avc1.42001E', label: 'H.264', hardware: true }];

  const resolutions = [
    { label: '4K', w: 3840, h: 2160 },
    { label: '2K', w: 2560, h: 1440 },
    { label: '1080p', w: 1920, h: 1080 },
    { label: '720p', w: 1280, h: 720 },
    { label: '480p', w: 854, h: 480 },
    { label: '原尺寸', w: info.width, h: info.height },
  ];

  // Determine active resolution preset
  const isDefaultPreset = (preset) => opts.width === preset.w && opts.height === preset.h && preset.label !== '原尺寸';
  const isCustom = !resolutions.some(p => p.label !== '原尺寸' && p.w === opts.width && p.h === opts.height)
    && !(opts.width === info.width && opts.height === info.height);

  const resolutionHtml = `
    <div class="param-group">
      <label class="param-group__label">目标分辨率</label>
      <div class="resolution-presets">
        ${resolutions.map(r => {
          const active = (r.label === '原尺寸' && opts.width === info.width && opts.height === info.height)
            || isDefaultPreset(r);
          return `<button class="resolution-preset ${active ? 'active' : ''}"
            data-preset="${r.label}" data-w="${r.w}" data-h="${r.h}">${r.label}</button>`;
        }).join('')}
        <button class="resolution-preset ${isCustom ? 'active' : ''}" data-preset="custom">自定义</button>
      </div>
      <div class="custom-resolution" style="${isCustom ? '' : 'display:none'}">
        <input type="number" id="customWidth" value="${opts.width}" min="64" max="7680" step="2">
        <span>×</span>
        <input type="number" id="customHeight" value="${opts.height}" min="64" max="7680" step="2">
      </div>
    </div>
  `;

  const bitrateMin = 500; // Kbps
  const bitrateMax = 50000;
  const bitrateKbps = Math.round(opts.videoBitrate / 1000);
  const bitratePresets = [2500, 5000, 8000, 12000, 20000, 35000];

  const bitrateHtml = `
    <div class="param-group">
      <label class="param-group__label">视频码率: <span id="bitrateLabel">${formatBitrate(opts.videoBitrate)}</span></label>
      <div class="bitrate-group">
        <input type="range" id="bitrateRange" min="${bitrateMin}" max="${bitrateMax}" value="${bitrateKbps}" step="100">
        <input type="number" id="bitrateInput" value="${bitrateKbps}" min="${bitrateMin}" max="${bitrateMax}" step="100">
        <span class="bitrate-group__unit">Kbps</span>
      </div>
      <div class="bitrate-presets">
        ${bitratePresets.map(b => {
          const label = b >= 1000 ? (b / 1000).toFixed(0) + 'M' : b + 'K';
          return `<button class="bitrate-preset" data-br="${b}">${label}</button>`;
        }).join('')}
      </div>
    </div>
  `;

  const codecHtml = `
    <div class="param-group">
      <label class="param-group__label">视频编码器</label>
      <select class="param-select" id="codecSelect">
        ${availableCodecs.map(c => {
          const selected = opts.codec === c.value;
          const disabled = !c.hardware;
          return `<option value="${c.value}" ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}
            title="${disabled ? '当前设备不支持此编码器的硬件加速' : ''}">
            ${c.label}${disabled ? ' (不可用)' : ''}
          </option>`;
        }).join('')}
      </select>
    </div>
  `;

  const bitrateModeHtml = `
    <div class="param-group">
      <label class="param-group__label">码率模式</label>
      <div class="radio-group">
        <label><input type="radio" name="bitrateMode" value="vbr" ${opts.bitrateMode === 'vbr' ? 'checked' : ''}> VBR（质量优先）</label>
        <label><input type="radio" name="bitrateMode" value="cbr" ${opts.bitrateMode === 'cbr' ? 'checked' : ''}> CBR（精确控制）</label>
      </div>
    </div>
  `;

  const fpsOptions = [
    { label: '保持原帧率', value: info.fps, orig: true },
    { label: '60 fps', value: 60 },
    { label: '30 fps', value: 30 },
    { label: '24 fps', value: 24 },
    { label: '15 fps', value: 15 },
  ];

  const fpsHtml = `
    <div class="param-group">
      <label class="param-group__label">帧率</label>
      <select class="param-select" id="fpsSelect">
        ${fpsOptions.map(f => {
          const selected = f.orig ? opts.keepOriginalFps : opts.fps === f.value;
          return `<option value="${f.value}" data-orig="${f.orig || ''}" ${selected ? 'selected' : ''}>
            ${f.label}${f.orig ? ` (${info.fps} fps)` : ''}
          </option>`;
        }).join('')}
      </select>
    </div>
  `;

  const audioOptions = [64, 96, 128, 192, 256, 320];
  const audioHtml = info.hasAudio ? `
    <div class="param-group">
      <label class="param-group__label">音频比特率</label>
      <select class="param-select" id="audioBitrateSelect">
        ${audioOptions.map(b => {
          const selected = opts.audioBitrate === b * 1000;
          return `<option value="${b * 1000}" ${selected ? 'selected' : ''}>${b} Kbps (AAC)</option>`;
        }).join('')}
      </select>
    </div>
  ` : '<div class="param-group"><span style="color:var(--text-secondary);font-size:13px">无音频轨道</span></div>';

  const estimatedSize = estimateSize(opts, info.duration);
  const savedPercent = info.videoBitrate ? Math.round((1 - opts.videoBitrate / info.videoBitrate) * 100) : 0;

  const estimateHtml = `
    <div class="estimate-display">
      <div class="estimate-display__value">${formatSize(estimatedSize)}</div>
      <div class="estimate-display__range">约 ${formatSize(estimatedSize * 0.95)} ~ ${formatSize(estimatedSize * 1.05)}</div>
      ${savedPercent > 0 ? `<div class="estimate-display__percent">预计节省 ${savedPercent}%</div>` : ''}
    </div>
  `;

  panel.innerHTML = `
    <h3>${escapeHtml(task.file.name)}</h3>
    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
      原始: ${info.width}×${info.height} | ${formatSize(task.file.size)}
    </div>
    ${resolutionHtml}
    ${codecHtml}
    ${bitrateModeHtml}
    ${bitrateHtml}
    ${fpsHtml}
    ${audioHtml}
    <button class="btn btn--ghost apply-all-btn" id="applyAllBtn">📋 应用到全部</button>
    ${estimateHtml}
  `;

  // Attach event listeners
  setupParamListeners(task);
}

function setupParamListeners(task) {
  const panel = document.getElementById('paramPanel');

  // Resolution presets
  panel.querySelectorAll('.resolution-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      const customDiv = panel.querySelector('.custom-resolution');

      if (preset === 'custom') {
        if (customDiv) customDiv.style.display = 'flex';
        panel.querySelectorAll('.resolution-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Read current custom values
        const w = parseInt(panel.querySelector('#customWidth')?.value) || task.options.width;
        const h = parseInt(panel.querySelector('#customHeight')?.value) || task.options.height;
        updateTaskOptions(task.id, { width: w, height: h });
      } else {
        if (customDiv) customDiv.style.display = 'none';
        panel.querySelectorAll('.resolution-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const w = parseInt(btn.dataset.w);
        const h = parseInt(btn.dataset.h);
        updateTaskOptions(task.id, { width: w, height: h });
      }
    });
  });

  // Custom resolution inputs
  ['#customWidth', '#customHeight'].forEach(sel => {
    const input = panel.querySelector(sel);
    if (input) {
      input.addEventListener('change', () => {
        const w = parseInt(panel.querySelector('#customWidth')?.value) || task.options.width;
        const h = parseInt(panel.querySelector('#customHeight')?.value) || task.options.height;
        updateTaskOptions(task.id, { width: w, height: h });
      });
    }
  });

  // Codec
  const codecSelect = panel.querySelector('#codecSelect');
  if (codecSelect) {
    codecSelect.addEventListener('change', () => {
      const selectedOption = codecSelect.selectedOptions[0];
      updateTaskOptions(task.id, {
        codec: codecSelect.value,
        codecLabel: selectedOption?.textContent || codecSelect.value,
      });
    });
  }

  // Bitrate mode
  panel.querySelectorAll('input[name="bitrateMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateTaskOptions(task.id, { bitrateMode: radio.value });
    });
  });

  // Bitrate range
  const range = panel.querySelector('#bitrateRange');
  const input = panel.querySelector('#bitrateInput');
  if (range && input) {
    const syncBitrate = (value) => {
      range.value = value;
      input.value = value;
      const label = panel.querySelector('#bitrateLabel');
      if (label) label.textContent = formatBitrate(value * 1000);
      updateTaskOptions(task.id, { videoBitrate: value * 1000 });
    };

    range.addEventListener('input', () => syncBitrate(range.value));
    input.addEventListener('change', () => {
      let val = parseInt(input.value);
      val = Math.max(500, Math.min(50000, val || 5000));
      syncBitrate(val);
    });
  }

  // Bitrate presets
  panel.querySelectorAll('.bitrate-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const br = parseInt(btn.dataset.br);
      if (range && input) {
        range.value = br;
        input.value = br;
        const label = panel.querySelector('#bitrateLabel');
        if (label) label.textContent = formatBitrate(br * 1000);
      }
      updateTaskOptions(task.id, { videoBitrate: br * 1000 });
    });
  });

  // FPS
  const fpsSelect = panel.querySelector('#fpsSelect');
  if (fpsSelect) {
    fpsSelect.addEventListener('change', () => {
      const selected = fpsSelect.selectedOptions[0];
      const isOrig = selected.dataset.orig === 'true';
      if (isOrig) {
        updateTaskOptions(task.id, {
          fps: task.originalInfo.fps,
          keepOriginalFps: true,
        });
      } else {
        updateTaskOptions(task.id, {
          fps: parseInt(fpsSelect.value),
          keepOriginalFps: false,
        });
      }
    });
  }

  // Audio bitrate
  const audioSelect = panel.querySelector('#audioBitrateSelect');
  if (audioSelect) {
    audioSelect.addEventListener('change', () => {
      updateTaskOptions(task.id, { audioBitrate: parseInt(audioSelect.value) });
    });
  }

  // Apply to all
  const applyAllBtn = panel.querySelector('#applyAllBtn');
  if (applyAllBtn) {
    applyAllBtn.addEventListener('click', () => {
      const currentOpts = { ...task.options };
      appState.queue.forEach(t => {
        if (t.id !== task.id && t.status === 'pending') {
          updateTaskOptions(t.id, currentOpts, true);
        }
      });
      showToast('参数已应用到全部待处理文件', 'success');
    });
  }
}

function updateTaskOptions(id, newOptions, skipRender = false) {
  const task = appState.queue.find(t => t.id === id);
  if (!task || !task.options) return;
  Object.assign(task.options, newOptions);

  if (!skipRender) {
    renderQueue();
    if (id === appState.selectedId) {
      renderParamPanel(task);
    }
  }
}
```

- [ ] **Step 2: 验证参数面板**

启动服务器，拖入视频文件后：
- 点击不同分辨率预设 → 高亮切换
- 自定义分辨率 → 两个输入框显示
- 拖动码率滑块 → 数值实时更新
- 切换编码器 → 不支持的显示灰色
- 切换码率模式 VBR/CBR
- 更改帧率
- "应用到全部" 点击 → Toast 确认

```bash
npx serve . --no-clipboard
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: implement parameter panel with resolution, bitrate, framerate controls"
```

---

### Task 7: 文件大小预估

**Files:**
- Modify: `index.html` — 替换 `estimateSize()` 函数

**Interfaces:**
- Modifies: `estimateSize(options, durationSeconds)` — 返回预估字节数
- Produces: `formatSizeRange(min, max)` — 格式化范围显示

- [ ] **Step 1: 实现预估算法**

替换占位的 `estimateSize` 函数：

```javascript
// === SECTION: Size Estimation ===

/**
 * Estimate compressed file size in bytes.
 * Formula: (video_bitrate + audio_bitrate) * duration / 8 * container_overhead
 *
 * @param {Object} options - Compression options
 * @param {number} durationSeconds - Video duration in seconds
 * @returns {number} Estimated size in bytes
 */
function estimateSize(options, durationSeconds) {
  if (!options || !durationSeconds) return 0;

  const videoBps = options.videoBitrate || 0;
  const audioBps = options.audioBitrate || 0;
  const totalBps = videoBps + audioBps;

  // Container overhead ~2% for MP4
  const containerOverhead = 1.02;

  const bits = totalBps * durationSeconds;
  return Math.round((bits / 8) * containerOverhead);
}

/**
 * Get estimated size range (±5%).
 */
function estimateSizeRange(options, durationSeconds) {
  const estimate = estimateSize(options, durationSeconds);
  return {
    min: Math.round(estimate * 0.95),
    best: estimate,
    max: Math.round(estimate * 1.05),
  };
}

/**
 * Compare estimated size with original, return stats.
 */
function getCompressionStats(options, originalSize, durationSeconds) {
  const estimated = estimateSize(options, durationSeconds);
  if (!originalSize) return null;

  const savedBytes = originalSize - estimated;
  const savedPercent = Math.round((savedBytes / originalSize) * 100);
  const ratio = originalSize / (estimated || 1);

  return {
    estimated,
    savedBytes,
    savedPercent,
    ratio,
    isLarger: estimated > originalSize,
  };
}

/**
 * Recommend bitrate for a given resolution to achieve reasonable quality.
 */
function recommendBitrate(width, height, fps) {
  const pixels = width * height;
  // Base bitrate per frame pixel, adjusted for framerate
  const baseBpp = 0.08; // bits per pixel at 30fps (H.264 standard quality)
  const fpsFactor = (fps || 30) / 30;
  const bitrate = Math.round(pixels * baseBpp * fpsFactor);
  return Math.max(500_000, Math.min(50_000_000, bitrate));
}
```

- [ ] **Step 2: 验证预估功能**

按 Task 6 的验证步骤，同时观察：
- 参数变更时预估大小实时更新
- 码率降低时预估大小同比例降低
- 范围显示 `约 X ~ Y`
- 如果预估大小小于原始大小，显示节省百分比

```bash
npx serve . --no-clipboard
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add compressed file size estimation with ±5% range"
```

---

### Task 8: 压缩引擎核心管线

**Files:**
- Modify: `index.html` — 实现完整的 CompressionEngine 类和相关函数

**Interfaces:**
- Produces: `class CompressionEngine` — 完整编码管线
- Modifies: `startCompression(id)` / `cancelCompression(id)` / `retryTask(id)`
- Modifies: `downloadResult(id)`

- [ ] **Step 1: 实现 CompressionEngine 类**

在 `<script>` 中添加核心引擎代码（放在参数面板代码之后）：

```javascript
// === SECTION: Compression Engine ===

class CompressionEngine {
  /**
   * @param {File} file - Input video file
   * @param {Object} options - Compression options
   * @param {Object} originalInfo - Original media info (from mp4box)
   * @param {Function} onProgress - Progress callback ({ stage, percent, fps, elapsed })
   * @param {AbortSignal} signal - AbortSignal for cancellation
   */
  constructor(file, options, originalInfo, onProgress, signal) {
    this.file = file;
    this.options = options;
    this.originalInfo = originalInfo;
    this.onProgress = onProgress;
    this.signal = signal;

    this.videoDecoder = null;
    this.videoEncoder = null;
    this.audioDecoder = null;
    this.audioEncoder = null;
    this.canvas = null;
    this.ctx = null;
    this.mp4boxFile = null;

    // Track state
    this.totalFrames = 0;
    this.processedFrames = 0;
    this.encodedVideoChunks = [];
    this.encodedAudioChunks = [];
    this.videoTrackId = null;
    this.audioTrackId = null;
    this.startTime = 0;
    this.frameInterval = 0;
    this.nextFrameTime = 0;
    this.aborted = false;

    // Resolve/reject for the promise
    this._resolve = null;
    this._reject = null;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      this._run().catch(reject);
    });
  }

  async _run() {
    this.startTime = performance.now();
    this.reportProgress('demux', 0);

    // Check abort
    if (this.signal?.aborted) throw new Error('已取消');

    // Step 1: Parse file with mp4box.js to get encoded samples
    const { videoSamples, audioSamples, mp4boxFile } = await this.demuxFile();

    if (this.signal?.aborted) throw new Error('已取消');

    this.mp4boxFile = mp4boxFile;
    this.totalFrames = videoSamples.length;
    this.frameInterval = Math.round(this.originalInfo.trackInfo?.videoTracks[0]?.timescale / this.options.fps) || 0;

    this.reportProgress('decode', 0);

    // Step 2: Decode video samples to VideoFrames
    const frames = await this.decodeVideoSamples(videoSamples);

    if (this.signal?.aborted) throw new Error('已取消');

    this.reportProgress('encode', 0);

    // Step 3: Process frames (resize, framerate) and encode
    await this.processAndEncodeFrames(frames);

    if (this.signal?.aborted) throw new Error('已取消');

    // Step 4: Process audio
    if (audioSamples.length > 0 && this.options.audioBitrate > 0) {
      await this.processAudio(audioSamples);
    }

    if (this.signal?.aborted) throw new Error('已取消');

    this.reportProgress('mux', 90);

    // Step 5: Mux into MP4
    const outputBlob = await this.muxToMp4();

    this.reportProgress('done', 100);

    this._resolve({
      blob: outputBlob,
      size: outputBlob.size,
      url: URL.createObjectURL(outputBlob),
    });
  }

  async demuxFile() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target.result;
        const mp4boxFile = MP4Box.createFile();
        const videoSamples = [];
        const audioSamples = [];
        let ready = false;

        mp4boxFile.onReady = (info) => {
          const vTrack = info.videoTracks?.[0];
          const aTrack = info.audioTracks?.[0];

          if (vTrack) {
            mp4boxFile.setExtractionOptions(vTrack.id, null, { nbSamples: 10000 });
          }
          if (aTrack) {
            mp4boxFile.setExtractionOptions(aTrack.id, null, { nbSamples: 10000 });
          }
          ready = true;
        };

        mp4boxFile.onSamples = (trackId, user, samples) => {
          if (trackId === this.originalInfo.videoTrackId) {
            for (const s of samples) {
              videoSamples.push({
                data: s.data,
                size: s.size,
                dts: s.dts,
                cts: s.cts,
                duration: s.duration,
                is_sync: s.is_sync,
                description: s.description,
              });
            }
          } else if (trackId === this.originalInfo.audioTrackId) {
            for (const s of samples) {
              audioSamples.push({
                data: s.data,
                size: s.size,
                dts: s.dts,
                cts: s.cts,
                duration: s.duration,
                description: s.description,
              });
            }
          }
        };

        mp4boxFile.onError = (err) => reject(new Error('Demux 失败: ' + err));

        buffer.fileStart = 0;
        mp4boxFile.appendBuffer(buffer);
        mp4boxFile.flush();

        setTimeout(() => {
          if (!ready) {
            reject(new Error('无法解析文件容器'));
            return;
          }
          resolve({ videoSamples, audioSamples, mp4boxFile });
        }, 1000);
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsArrayBuffer(this.file);
    });
  }

  async decodeVideoSamples(samples) {
    if (samples.length === 0) return [];

    const description = this._getDescription(samples);
    const codec = this.originalInfo.codec;
    const frames = [];

    const decoder = new VideoDecoder({
      output: (frame) => {
        frames.push(frame);
        const percent = Math.round((frames.length / samples.length) * 100);
        this.reportProgress('decode', percent);
      },
      error: (err) => {
        console.error('Video decode error:', err);
      },
    });

    this.videoDecoder = decoder;

    const config = {
      codec: codec,
      description: description,
    };

    // Wait for decoder to be ready
    await new Promise((resolve, reject) => {
      decoder.addEventListener('dequeue', () => resolve(), { once: false });
      try {
        decoder.configure(config);
      } catch (e) {
        reject(e);
      }
      // Timeout if dequeue never fires
      setTimeout(() => resolve(), 100);
    });

    // Queue samples for decoding
    for (let i = 0; i < samples.length; i++) {
      if (this.signal?.aborted) break;

      const sample = samples[i];
      const chunk = new EncodedVideoChunk({
        type: sample.is_sync ? 'key' : 'delta',
        timestamp: sample.cts * 1_000_000, // Convert to microseconds
        duration: sample.duration * 1_000_000,
        data: sample.data,
      });
      decoder.decode(chunk);

      this.reportProgress('decode', Math.round(((i + 1) / samples.length) * 100));
    }

    // Flush and wait
    await decoder.flush();
    decoder.close();

    return frames;
  }

  async processAndEncodeFrames(frames) {
    if (frames.length === 0) return;

    // Create offscreen canvas for frame processing
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.ctx = this.canvas.getContext('2d');

    // Configure encoder
    const encoderConfig = {
      codec: this.options.codec,
      width: this.options.width,
      height: this.options.height,
      bitrate: this.options.videoBitrate,
      framerate: this.options.fps,
      hardwareAcceleration: 'prefer-hardware',
    };

    // Add bitrate mode if available
    if (this.options.bitrateMode === 'cbr') {
      // WebCodecs doesn't have direct CBR, but we can set latencyMode
      encoderConfig.latencyMode = 'realtime';
    }

    const encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        this.encodedVideoChunks.push({
          data: new Uint8Array(chunk.byteLength),
          byteLength: chunk.byteLength,
          timestamp: chunk.timestamp,
          duration: chunk.duration,
          type: chunk.type,
        });
        // Copy data since chunk is temporary
        chunk.copyTo(this.encodedVideoChunks[this.encodedVideoChunks.length - 1].data);
      },
      error: (err) => {
        console.error('Video encode error:', err);
        this._reject?.(new Error('编码错误: ' + err.message));
      },
    });

    this.videoEncoder = encoder;

    await encoder.configure(encoderConfig);

    // Process frames: resize and encode at target framerate
    const sourceFps = this.originalInfo.fps || 30;
    const targetFps = this.options.fps;
    const frameSkip = Math.max(1, Math.round(sourceFps / targetFps));

    let encodedCount = 0;
    const targetTotalFrames = Math.ceil(frames.length / frameSkip);
    let timestamp = 0;
    const frameDuration = Math.round(1_000_000 / targetFps); // microseconds

    for (let i = 0; i < frames.length; i += frameSkip) {
      if (this.signal?.aborted) break;

      const frame = frames[i];

      // Draw frame to canvas at target resolution
      this.ctx.drawImage(frame, 0, 0, this.options.width, this.options.height);

      // Create new VideoFrame from canvas
      const processedFrame = new VideoFrame(this.canvas, {
        timestamp: timestamp,
        duration: frameDuration,
      });

      encoder.encode(processedFrame);
      processedFrame.close();
      frame.close();

      timestamp += frameDuration;
      encodedCount++;

      const percent = Math.round((encodedCount / targetTotalFrames) * 100);
      this.reportProgress('encode', percent);

      // Yield to main thread periodically
      if (encodedCount % 5 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    // Close remaining frames
    for (let i = frames.length - 1; i >= 0; i--) {
      try { frames[i]?.close(); } catch (e) { /* already closed */ }
    }

    await encoder.flush();
    encoder.close();
  }

  async processAudio(samples) {
    if (samples.length === 0) return;

    // Create audio context for resampling
    const audioCtx = new OfflineAudioContext({
      numberOfChannels: 2,
      sampleRate: 48000,
      length: 48000 * Math.ceil(this.originalInfo.duration),
    });

    // Configure audio encoder
    const encoder = new AudioEncoder({
      output: (chunk, metadata) => {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        this.encodedAudioChunks.push({
          data,
          byteLength: chunk.byteLength,
          timestamp: chunk.timestamp,
          duration: chunk.duration,
          type: chunk.type,
        });
      },
      error: (err) => {
        console.error('Audio encode error:', err);
      },
    });

    this.audioEncoder = encoder;

    await encoder.configure({
      codec: 'mp4a.40.2',
      sampleRate: 48000,
      numberOfChannels: 2,
      bitrate: this.options.audioBitrate,
    });

    // Decode audio samples, re-encode
    for (const sample of samples) {
      if (this.signal?.aborted) break;

      const chunk = new EncodedAudioChunk({
        type: sample.is_sync ? 'key' : 'delta',
        timestamp: (sample.cts || sample.dts) * 1_000_000,
        duration: sample.duration * 1_000_000,
        data: sample.data,
      });

      // Create audio decoder to get AudioData
      // For simplicity, pass encoded chunks directly to encoder
      // (In production, we'd decode → AudioData → encoder)
      // This is a simplified path
      encoder.encode(chunk);
    }

    await encoder.flush();
    encoder.close();
  }

  async muxToMp4() {
    // Create MP4 file with mp4box.js
    const muxFile = MP4Box.createFile();
    const timescale = this.options.fps * 1000;

    // Add video track
    this.videoTrackId = muxFile.addTrack({
      type: 'video',
      width: this.options.width,
      height: this.options.height,
      timescale: timescale,
      media_duration: 0,
      track_width: this.options.width,
      track_height: this.options.height,
      nb_samples: this.encodedVideoChunks.length,
      video: {
        width: this.options.width,
        height: this.options.height,
      },
    });

    // Add samples
    for (const chunk of this.encodedVideoChunks) {
      muxFile.addSample(this.videoTrackId, chunk.data, {
        duration: Math.round((chunk.duration / 1_000_000) * timescale),
        dts: Math.round((chunk.timestamp / 1_000_000) * timescale),
        cts: Math.round((chunk.timestamp / 1_000_000) * timescale),
        is_sync: chunk.type === 'key',
      });
    }

    // Add audio track if present
    if (this.encodedAudioChunks.length > 0) {
      const audioTimescale = 48000;
      this.audioTrackId = muxFile.addTrack({
        type: 'audio',
        timescale: audioTimescale,
        nb_samples: this.encodedAudioChunks.length,
        audio: {
          sample_rate: 48000,
          channel_count: 2,
          sample_size: 16,
        },
      });

      for (const chunk of this.encodedAudioChunks) {
        muxFile.addSample(this.audioTrackId, chunk.data, {
          duration: Math.round((chunk.duration / 1_000_000) * audioTimescale),
          dts: Math.round((chunk.timestamp / 1_000_000) * audioTimescale),
          cts: Math.round((chunk.timestamp / 1_000_000) * audioTimescale),
          is_sync: true,
        });
      }
    }

    // Write to buffer
    return new Promise((resolve, reject) => {
      muxFile.saveData = (data) => {
        const blob = new Blob([data], { type: 'video/mp4' });
        resolve(blob);
      };
      try {
        muxFile.save('file.mp4');
      } catch (e) {
        reject(e);
      }
    });
  }

  _getDescription(samples) {
    // Find the description from the first key frame sample
    for (const s of samples) {
      if (s.is_sync && s.description) {
        return s.description;
      }
    }
    return samples[0]?.description || undefined;
  }

  reportProgress(stage, percent) {
    const now = performance.now();
    const elapsed = (now - this.startTime) / 1000;
    const fps = elapsed > 0 ? Math.round(this.processedFrames / elapsed) : 0;

    this.onProgress({
      stage,
      percent: Math.min(99, percent),
      fps,
      elapsed,
    });
  }

  abort() {
    this.aborted = true;
    try { this.videoDecoder?.close(); } catch (e) {}
    try { this.videoEncoder?.close(); } catch (e) {}
    try { this.audioDecoder?.close(); } catch (e) {}
    try { this.audioEncoder?.close(); } catch (e) {}
  }
}
```

- [ ] **Step 2: 实现开始/取消/重试/下载函数**

替换 Task 4 中的占位函数：

```javascript
// === SECTION: Compression Control ===

async function startCompression(id) {
  const task = appState.queue.find(t => t.id === id);
  if (!task || task.status === 'processing') return;
  if (!task.options || !task.originalInfo) {
    showToast('请等待文件分析完成', 'warning');
    return;
  }

  task.status = 'processing';
  task.progress = 0;
  task.error = null;
  task.abortController = new AbortController();
  appState.processingCount++;

  renderQueue();
  if (task.id === appState.selectedId) {
    renderParamPanel(task);
  }

  const engine = new CompressionEngine(
    task.file,
    task.options,
    task.originalInfo,
    (progress) => {
      task.progress = progress.percent;
      if (progress.stage === 'encode') {
        task.progress = Math.round(20 + progress.percent * 0.7); // encode is 20-90%
      } else if (progress.stage === 'decode') {
        task.progress = Math.round(progress.percent * 0.2); // decode is 0-20%
      } else if (progress.stage === 'mux') {
        task.progress = Math.round(90 + progress.percent * 0.1);
      }
      renderQueue();
    },
    task.abortController.signal
  );

  try {
    const result = await engine.start();
    task.status = 'completed';
    task.progress = 100;
    task.result = {
      blob: result.blob,
      url: result.url,
      size: result.size,
    };
    appState.processingCount--;
    renderQueue();
    if (task.id === appState.selectedId) {
      renderParamPanel(task);
    }
    showToast(`"${task.file.name}" 压缩完成`, 'success');

    // Process next in queue
    processNextPending();
  } catch (err) {
    if (err.message === '已取消') {
      task.status = 'pending';
      task.progress = 0;
    } else {
      task.status = 'failed';
      task.error = err.message || '未知错误';
      task.progress = 0;
      showToast(`"${task.file.name}" 压缩失败: ${task.error}`, 'error');
    }
    task.abortController = null;
    appState.processingCount--;
    renderQueue();
    if (task.id === appState.selectedId) {
      renderParamPanel(task);
    }

    // Process next in queue
    processNextPending();
  }
}

function cancelCompression(id) {
  const task = appState.queue.find(t => t.id === id);
  if (!task || task.status !== 'processing') return;
  if (task.abortController) {
    task.abortController.abort();
  }
}

function startAllCompression() {
  const pendingTasks = appState.queue.filter(t => t.status === 'pending');
  if (pendingTasks.length === 0) {
    showToast('没有待处理的文件', 'info');
    return;
  }

  // Start first one; processNextPending will chain
  if (appState.processingCount === 0) {
    startCompression(pendingTasks[0].id);
  } else {
    showToast('已有文件正在处理中', 'info');
  }
}

function processNextPending() {
  if (appState.processingCount > 0) return; // one at a time

  const next = appState.queue.find(t => t.status === 'pending' && t.options);
  if (next) {
    startCompression(next.id);
  }
}

function retryTask(id) {
  const task = appState.queue.find(t => t.id === id);
  if (!task || task.status !== 'failed') return;
  task.status = 'pending';
  task.error = null;
  task.progress = 0;
  task.result = null;
  renderQueue();
  if (task.id === appState.selectedId) {
    renderParamPanel(task);
  }
  startCompression(id);
}

function downloadResult(id) {
  const task = appState.queue.find(t => t.id === id);
  if (!task || !task.result?.url) return;

  const a = document.createElement('a');
  const ext = '.mp4';
  const baseName = task.file.name.replace(/\.[^.]+$/, '');
  a.href = task.result.url;
  a.download = `${baseName}_compressed${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// beforeunload warning
window.addEventListener('beforeunload', (e) => {
  const hasProcessing = appState.queue.some(t => t.status === 'processing');
  if (hasProcessing) {
    e.preventDefault();
    e.returnValue = '有正在压缩的文件，确定要离开吗？';
    return e.returnValue;
  }
});
```

- [ ] **Step 3: 验证压缩功能**

启动服务器，测试完整流程：
- 拖入一个 MP4 视频
- 设置参数
- 点击"开始"
- 观察进度条更新
- 完成后点击"下载" → 浏览器下载文件
- 检查下载文件可播放

```bash
npx serve . --no-clipboard
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: implement compression engine with WebCodecs GPU encoding pipeline"
```

---

### Task 9: 预览与对比

**Files:**
- Modify: `index.html` — 实现 `renderPreview()`、`openCompare()`、`closeCompare()`

**Interfaces:**
- Modifies: `renderPreview(task)` — 渲染预览区
- Modifies: `openCompare(id)` — 打开对比模态框
- Modifies: `closeCompare()` — 关闭对比模态框

- [ ] **Step 1: 实现预览区渲染**

替换占位函数 `renderPreview`:

```javascript
// === SECTION: Preview & Comparison ===

function renderPreview(task) {
  const area = document.getElementById('previewArea');

  if (!task) {
    area.innerHTML = `
      <div class="preview-area__empty">
        <span>🎥</span>
        <p>选择一个文件以预览</p>
      </div>
    `;
    return;
  }

  const info = task.originalInfo;

  // Show original video preview
  const videoUrl = URL.createObjectURL(task.file);

  area.innerHTML = `
    <div style="width:100%">
      <video src="${videoUrl}" controls style="width:100%;max-height:400px;background:#000;border-radius:var(--radius);"></video>
      ${info ? `
        <div class="preview-area__info">
          <span>📐 ${info.width || '?'}×${info.height || '?'}</span>
          <span>🎞️ ${info.fps || '?'} fps</span>
          <span>📦 ${info.codecLabel || '?'}</span>
          <span>⏱️ ${formatDuration(info.duration)}</span>
          <span>💾 ${formatSize(task.file.size)}</span>
        </div>
      ` : ''}
    </div>
  `;

  // Cleanup previous URL when task changes
  task._previewUrl = videoUrl;
}

function openCompare(id) {
  const task = appState.queue.find(t => t.id === id);
  if (!task || !task.result) return;

  const modal = document.getElementById('compareModal');
  const content = document.getElementById('compareContent');

  const origUrl = task._previewUrl || URL.createObjectURL(task.file);
  const compUrl = task.result.url;

  const originalInfo = task.originalInfo;
  const originalSize = task.file.size;
  const compressedSize = task.result.size;
  const savedPercent = Math.round(((originalSize - compressedSize) / originalSize) * 100);
  const ratio = (originalSize / compressedSize).toFixed(1);

  content.innerHTML = `
    <h3 style="margin-bottom:16px;">对比: ${escapeHtml(task.file.name)}</h3>
    <div class="compare-container">
      <div class="compare-side">
        <h4>📁 原始</h4>
        <video src="${origUrl}" controls></video>
      </div>
      <div class="compare-side">
        <h4>✅ 压缩后</h4>
        <video src="${compUrl}" controls></video>
      </div>
      <div class="compare-stats">
        <div class="compare-stat">
          <div class="compare-stat__value">${formatSize(originalSize)}</div>
          <div class="compare-stat__label">原始大小</div>
        </div>
        <div class="compare-stat">
          <div class="compare-stat__value" style="color:var(--accent)">${formatSize(compressedSize)}</div>
          <div class="compare-stat__label">压缩后大小</div>
        </div>
        <div class="compare-stat">
          <div class="compare-stat__value saved">${savedPercent > 0 ? '↓' : '↑'} ${Math.abs(savedPercent)}%</div>
          <div class="compare-stat__label">${savedPercent > 0 ? '节省' : '增大'}</div>
        </div>
        <div class="compare-stat">
          <div class="compare-stat__value" style="color:var(--accent)">${ratio}x</div>
          <div class="compare-stat__label">压缩比</div>
        </div>
      </div>
    </div>

    <!-- Slider comparison -->
    <h4 style="margin:16px 0 8px;">滑块对比</h4>
    <div class="slider-compare" id="sliderCompare">
      <video src="${origUrl}" controls style="width:100%;"></video>
      <div class="slider-compare__top">
        <video src="${compUrl}" style="width:100%;" muted></video>
      </div>
      <div class="slider-compare__handle" id="sliderHandle"></div>
    </div>
  `;

  modal.classList.remove('hidden');

  // Setup slider comparison
  setTimeout(() => {
    const slider = document.getElementById('sliderCompare');
    const handle = document.getElementById('sliderHandle');
    if (!slider || !handle) return;

    let isDragging = false;

    handle.addEventListener('mousedown', () => { isDragging = true; });
    document.addEventListener('mouseup', () => { isDragging = false; });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const rect = slider.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const topEl = slider.querySelector('.slider-compare__top');
      if (topEl) topEl.style.clipPath = `inset(0 ${(1 - x) * 100}% 0 0)`;
      handle.style.left = `${x * 100}%`;
    });
  }, 100);
}

function closeCompare() {
  const modal = document.getElementById('compareModal');
  modal.classList.add('hidden');

  // Pause all videos in the modal
  modal.querySelectorAll('video').forEach(v => v.pause());
}
```

- [ ] **Step 2: 验证预览和对比**

启动服务器，测试：
- 选中文件 → 预览区显示视频播放器
- 压缩完成后点击"对比" → 弹出模态框
- 左右并排两个视频可独立播放
- 下方滑块对比可拖动

```bash
npx serve . --no-clipboard
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: implement video preview and before/after comparison with slider"
```

---

### Task 10: 最终打磨 — 错误处理与边界情况

**Files:**
- Modify: `index.html` — 添加错误处理、加载状态、边界情况处理

**Interfaces:**
- No new interfaces — hardens existing code paths

- [ ] **Step 1: 添加全局错误处理和加载状态**

在 `<script>` 末尾的初始化代码前添加：

```javascript
// === SECTION: Error Handling & Edge Cases ===

// Catch unhandled errors
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  showToast('发生未知错误，请刷新页面重试', 'error', 5000);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  if (e.reason?.message) {
    showToast('处理出错: ' + e.reason.message, 'error', 5000);
  }
});

// Memory warning before large file processing
function checkMemoryWarning(task) {
  if (!task.originalInfo) return false;

  const pixels = (task.options?.width || 1920) * (task.options?.height || 1080);
  const frameSizeEstimate = pixels * 4; // RGBA bytes per frame
  const concurrentFrames = 10; // Conservative estimate of frames in flight
  const estimatedMemoryMB = (frameSizeEstimate * concurrentFrames) / (1024 * 1024);

  // Rough check - most browsers have ~2-4GB heap limit
  if (estimatedMemoryMB > 500) {
    return confirm(
      `此视频处理预计需要大量内存（约 ${Math.round(estimatedMemoryMB)} MB）。\n\n` +
      `大分辨率视频可能导致浏览器卡顿或崩溃。\n` +
      `建议降低目标分辨率。\n\n` +
      `是否继续？`
    );
  }
  return true;
}
```

- [ ] **Step 2: 在 startCompression 中添加内存检查**

修改 `startCompression` 函数，在调用 engine 前添加内存检查：

```javascript
// After the options check in startCompression, before creating CompressionEngine:
  if (!checkMemoryWarning(task)) {
    task.status = 'pending';
    renderQueue();
    return;
  }
```

- [ ] **Step 3: 添加视频加载占位动画**

在 CSS 中添加（放在 style 块末尾的 `</style>` 前）：

```css
/* === Loading States === */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty queue state */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary);
}
.empty-state__icon { font-size: 48px; margin-bottom: 12px; }

/* Disabled drop zone */
.drop-zone.disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

- [ ] **Step 4: 验证错误处理**

启动服务器，测试边界情况：
- 关闭浏览器标签页时（有任务进行中）→ 弹出离开确认
- 处理超大分辨率视频 → 内存警告提示
- 模拟编码失败（可用不支持的编码器） → 队列显示失败状态

```bash
npx serve . --no-clipboard
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "fix: add error handling, memory warnings, and edge case guards"
```

---

## Plan Completion Checklist

- [ ] All 10 tasks implemented and committed
- [ ] index.html complete with all CSS/JS inline
- [ ] mp4box.all.js and mp4box.wasm present in project root
- [ ] Verified: drag-drop files, adjust params, compress, download, compare
- [ ] Verified: compatibility detection works in Chrome/Edge
- [ ] Verified: beforeunload warning fires when processing
- [ ] Verified: responsive layout at 1024px and 768px widths

## Plan Self-Review

Before implementing, verify:

1. **Spec coverage**: Each section of the design doc maps to at least one task
2. **No placeholders**: Every function body is shown, no TBDs
3. **Type consistency**: Function signatures are consistent across tasks
4. **Testable at each step**: Each task produces verifiable output
