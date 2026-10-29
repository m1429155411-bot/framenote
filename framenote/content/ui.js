/* 帧记 · 面板骨架、弹窗、Toast */
(() => {
  const FN = globalThis.FN;

  const ICON = (name, size = 16) => FN.icon(name, size);

  function shellHtml() {
    const logo = chrome.runtime.getURL('assets/icon128.png');
    return `
<div id="fn-root" data-theme="light">
  <button class="fn-fab" type="button" data-act="open" title="打开帧记 AI 笔记" aria-label="打开帧记 AI 笔记">
    <img src="${logo}" alt="" />
    <span class="fn-fab-dot"></span>
  </button>

  <aside class="fn-panel" aria-label="帧记 AI 视频笔记">
    <div class="fn-resize" data-el="resize" title="拖动调整宽度"></div>
    <div class="fn-resize fn-resize-e" data-el="resizeE" title="拖动调整宽度"></div>
    <div class="fn-resize fn-resize-s" data-el="resizeS" title="拖动调整高度"></div>
    <div class="fn-resize fn-resize-se" data-el="resizeSE" title="拖动调整窗口大小"></div>

    <header class="fn-header" title="拖动标题栏移动窗口 · 拖右下角调整大小 · 双击停靠右侧">
      <div class="fn-brand">
        <div class="fn-logo"><img src="${logo}" alt="" /></div>
        <div class="fn-brand-text">
          <div class="fn-brand-name">帧记</div>
        </div>
      </div>
      <div class="fn-head-actions">
        <button class="fn-icon-btn fn-dock-btn" type="button" data-act="dock-panel" title="停靠到右侧" aria-label="停靠到右侧">${ICON('grid', 16)}</button>
        <button class="fn-icon-btn" type="button" data-act="note-more" title="更多：笔记库 / 设置 / 导出" aria-label="更多">${ICON('more', 18)}</button>
        <button class="fn-icon-btn" type="button" data-act="collapse" title="收起面板">${ICON('chevronRight', 18)}</button>
        <button class="fn-icon-btn" type="button" data-act="close" title="关闭">${ICON('close', 17)}</button>
      </div>
    </header>

    <div class="fn-video-strip is-empty" data-el="videoStrip">
      <div class="fn-video-top">
        <div class="fn-video-badge is-empty" data-el="videoBadge">${ICON('play', 13)}</div>
        <div class="fn-video-meta">
          <div class="fn-video-title" data-el="videoTitle">正在检测页面视频…</div>
          <div class="fn-video-sub">
            <span class="fn-status-dot is-empty" data-el="videoDot"></span>
            <span data-el="videoSite">等待视频</span>
            <span>·</span>
            <span data-el="videoDuration">--:--</span>
          </div>
        </div>
      </div>
      <div class="fn-transport">
        <button class="fn-play-btn" type="button" data-act="play" data-el="play" title="播放 / 暂停">${ICON('play', 15)}</button>
        <button class="fn-transport-btn" type="button" data-act="rewind" title="后退 10 秒">${ICON('rewind', 15)}</button>
        <button class="fn-transport-btn" type="button" data-act="forward" title="前进 10 秒">${ICON('forward', 15)}</button>
        <div class="fn-time-display"><b data-el="currentTime">00:00</b> / <span data-el="duration">00:00</span></div>
        <div class="fn-spacer"></div>
        <button class="fn-speed-btn" type="button" data-act="speed" data-el="speed" title="切换播放速度">1.0×</button>
      </div>
      <div class="fn-progress" data-el="progress" role="slider" aria-label="视频进度" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="fn-progress-buffer" data-el="buffered" style="width:0%"></div>
        <div class="fn-progress-played" data-el="played" style="width:0%"></div>
        <div class="fn-progress-knob" data-el="knob" style="left:0%"></div>
      </div>
    </div>

    <div class="fn-quickbar">
      <button class="fn-quick-btn" type="button" data-act="snapshot" title="截取当前视频画面（Alt+Shift+S）">${ICON('camera', 14)} 截图</button>
      <button class="fn-quick-btn" type="button" data-act="ocr" title="识别当前画面中的文字">${ICON('scan', 14)} 识字</button>
      <button class="fn-quick-btn" type="button" data-act="speech" title="把视频声音转成文字（语音听写）">${ICON('mic', 14)} 听写</button>
      <button class="fn-quick-btn" type="button" data-act="timestamp" title="插入当前时间戳">${ICON('clock', 14)} 时间戳</button>
      <button class="fn-quick-btn is-primary" type="button" data-act="ai-generate" title="用 AI 生成当前模板的笔记">${ICON('sparkles', 14)} AI 笔记</button>
    </div>

    <div class="fn-recording-bar" data-el="recordingBar" hidden>
      <span class="fn-recording-dot"></span>
      <span data-el="recordingLabel">正在录制视频声音 …</span>
      <b data-el="recordingTime">00:00</b>
      <span class="fn-recording-hint" data-el="recordingHint"></span>
      <div class="fn-spacer"></div>
      <button class="fn-btn is-xs is-danger" type="button" data-act="stop-recording" data-el="recordingAction">停止并转写</button>
    </div>

    <nav class="fn-tabs" aria-label="功能">
      <button class="fn-tab is-active" type="button" data-view="notes">${ICON('file', 14)} 笔记</button>
      <button class="fn-tab" type="button" data-view="summary">${ICON('eye', 14)} 速览</button>
      <button class="fn-tab" type="button" data-view="map">${ICON('brain', 14)} 导图</button>
      <button class="fn-tab" type="button" data-view="quiz">${ICON('target', 14)} 练习</button>
      <button class="fn-tab" type="button" data-view="chat">${ICON('sparkles', 14)} 助手</button>
    </nav>

    <div class="fn-inline-progress-slot" data-el="inlineProgress" hidden></div>

    <div class="fn-scroll" data-el="scroll">
      <!-- 笔记 -->
      <section class="fn-view is-active" data-panel="notes">
        <div class="fn-note-toolbar">
          <div class="fn-template-switch" role="tablist" aria-label="笔记模板">
            <button class="fn-template-btn is-active" type="button" data-template="rich" role="tab">${ICON('image', 12)} 图文</button>
            <button class="fn-template-btn" type="button" data-template="outline" role="tab">${ICON('list', 12)} 大纲</button>
            <button class="fn-template-btn" type="button" data-template="transcript" role="tab">${ICON('text', 12)} 文稿</button>
          </div>
          <div class="fn-note-toolbar-actions">
            <button class="fn-mini-btn" type="button" data-act="note-more" title="更多">${ICON('more', 16)}</button>
          </div>
        </div>

        <div data-el="aiBanner"></div>

        <div class="fn-note-title-row">
          <input class="fn-note-title" data-el="noteTitle" type="text" placeholder="给这篇笔记起个标题" spellcheck="false" />
        </div>
        <div class="fn-note-meta-line" data-el="noteMeta"></div>

        <div data-el="templateRich">
          <div class="fn-note-card">
            <div class="fn-editor-toolbar" data-el="editorToolbar">
              <button class="fn-editor-tool" type="button" data-cmd="bold" title="加粗">${ICON('bold', 14)}</button>
              <button class="fn-editor-tool" type="button" data-cmd="italic" title="斜体">${ICON('italic', 14)}</button>
              <button class="fn-editor-tool" type="button" data-cmd="underline" title="下划线">${ICON('underline', 14)}</button>
              <span class="fn-editor-sep"></span>
              <button class="fn-editor-tool" type="button" data-cmd="h2" title="二级标题">${ICON('heading', 14)}</button>
              <button class="fn-editor-tool" type="button" data-cmd="ul" title="无序列表">${ICON('list', 14)}</button>
              <button class="fn-editor-tool" type="button" data-cmd="quote" title="引用">${ICON('quote', 14)}</button>
              <span class="fn-editor-sep"></span>
              <button class="fn-editor-tool is-text" type="button" data-act="insert-ts" title="插入当前时间戳">${ICON('clock', 13)} 时间</button>
              <button class="fn-editor-tool" type="button" data-act="editor-upload" title="上传本地图片">${ICON('image', 14)}</button>
              <button class="fn-editor-tool" type="button" data-act="editor-link" title="插入链接">${ICON('link', 14)}</button>
              <div class="fn-spacer"></div>
              <button class="fn-editor-tool" type="button" data-act="editor-clear" title="清空正文">${ICON('trash', 13)}</button>
            </div>
            <div class="fn-editor" data-el="editor" contenteditable="true" spellcheck="false"
              data-placeholder="视频看到哪，笔记记到哪。&#10;点击上方「时间戳」把当前播放位置钉在笔记里；暂停视频后截图，画面会自动带上时间。"></div>
            <div class="fn-editor-status">
              <span class="fn-stat" data-el="editorStats">0 字 · 0 张图</span>
            </div>
          </div>
        </div>

        <div data-el="templateOutline" hidden>
          <div class="fn-outline-tools">
            <button class="fn-btn is-sm is-primary" type="button" data-act="outline-add">${ICON('plus', 13)} 添加节点</button>
            <button class="fn-btn is-sm" type="button" data-act="outline-ai">${ICON('sparkles', 13)} AI 大纲</button>
            <button class="fn-btn is-sm" type="button" data-act="outline-map">${ICON('brain', 13)} 生成导图</button>
          </div>
          <div class="fn-note-card">
            <div class="fn-outline-list" data-el="outlineList"></div>
            <div style="padding: 0 7px 8px">
              <button class="fn-outline-add" type="button" data-act="outline-add">${ICON('plus', 12)} 继续添加</button>
            </div>
          </div>
          <div class="fn-outline-hint">${ICON('lightbulb', 11)} Tab 缩进 · Shift+Tab 提升 · Enter 新建下一个节点 · 点击时间戳跳转</div>
        </div>

        <div data-el="templateTranscript" hidden>
          <div data-el="transcriptContent"></div>
        </div>
      </section>

      <!-- 速览 -->
      <section class="fn-view" data-panel="summary">
        <div data-el="summaryContent"></div>
      </section>

      <!-- 导图 -->
      <section class="fn-view" data-panel="map">
        <div data-el="mapContent"></div>
      </section>

      <!-- 练习 -->
      <section class="fn-view" data-panel="quiz">
        <div data-el="quizContent"></div>
      </section>

      <!-- AI 助手 -->
      <section class="fn-view fn-chat-view" data-panel="chat">
        <div class="fn-chat-scroll" data-el="chatScroll"></div>
        <div class="fn-chat-context" data-el="chatContext"></div>
        <div class="fn-chat-composer">
          <textarea data-el="chatInput" rows="1" placeholder="问问这个视频，例如：用一个例子解释这个概念" aria-label="向 AI 提问"></textarea>
          <button class="fn-send-btn" type="button" data-act="chat-send" title="发送">${ICON('send', 15)}</button>
        </div>
      </section>
    </div>

    <footer class="fn-footer">
      <span class="fn-save-state" data-el="saveState"><span class="fn-status-dot"></span><span data-el="saveText">本地自动保存</span></span>
      <div class="fn-footer-actions">
        <button class="fn-footer-btn" type="button" data-act="export" title="导出笔记">${ICON('download', 13)} 导出</button>
      </div>
    </footer>

    <div class="fn-toasts" data-el="toasts"></div>
  </aside>

  <div class="fn-modal-root" data-el="modalRoot"></div>
  <input type="file" data-el="subtitleFile" accept=".srt,.vtt,.txt,text/vtt,text/plain" hidden />
  <input type="file" data-el="imageFile" accept="image/*" hidden />
  <input type="file" data-el="backupFile" accept=".json,application/json" hidden />
</div>`;
  }

  let host = null;
  let shadow = null;
  let root = null;
  let els = {};
  let modalState = null;

  async function loadStyles() {
    if (FN.PANEL_CSS) return FN.PANEL_CSS;
    const url = chrome.runtime.getURL('content/panel.css');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));
      return await response.text();
    } catch (_) {
      // 某些页面会拦截 content script 的 fetch，退回 link 标签
      return null;
    }
  }

  async function mount() {
    if (host) return { host, root, els };
    host = document.createElement('div');
    host.id = 'framenote-host';
    // 宿主本身保持 0×0，只有面板 / 悬浮按钮 / 弹窗这些 fixed 子元素参与命中测试，
    // 避免全屏宿主在部分页面或浏览器下拦截网页点击。
    host.style.cssText =
      'all:initial;position:fixed;top:0;left:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none !important;';
    const css = await loadStyles();
    shadow = host.attachShadow({ mode: 'open' });
    if (css) {
      const style = document.createElement('style');
      style.textContent = css;
      shadow.appendChild(style);
    } else {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('content/panel.css');
      shadow.appendChild(link);
    }
    const wrapper = document.createElement('div');
    wrapper.innerHTML = shellHtml();
    root = wrapper.firstElementChild;
    shadow.appendChild(root);
    for (const node of root.querySelectorAll('[data-el]')) {
      els[node.dataset.el] = node;
    }
    els.views = [...root.querySelectorAll('[data-panel]')];
    els.tabs = [...root.querySelectorAll('[data-view]')];
    els.templateBtns = [...root.querySelectorAll('[data-template]')];
    els.editor.addEventListener('paste', () => {});
    document.documentElement.appendChild(host);
    return { host, root, els };
  }

  function setOpen(open) {
    if (!root) return;
    root.classList.toggle('is-open', !!open);
  }

  function setDismissed(dismissed) {
    if (!root) return;
    root.classList.toggle('is-dismissed', !!dismissed);
    if (dismissed) root.classList.remove('is-open');
  }

  function setTheme(theme) {
    if (!root) return;
    let resolved = theme;
    if (theme === 'auto') {
      resolved = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.dataset.theme = resolved === 'dark' ? 'dark' : 'light';
  }

  function setWidth(width) {
    if (!root) return;
    const clamped = Math.max(360, Math.min(720, Number(width) || 442));
    root.style.setProperty('--fn-width', `${clamped}px`);
  }

  function setAccent(accent) {
    if (!root) return;
    const value = ['lime', 'ocean', 'amber', 'coral'].includes(accent) ? accent : 'lime';
    root.dataset.accent = value;
  }

  function applyPanelGeometry(options = {}) {
    const panel = root?.querySelector('.fn-panel');
    if (!panel) return null;
    const floating = !!options.floating;
    if (!floating) {
      root.classList.remove('is-floating');
      panel.style.removeProperty('left');
      panel.style.removeProperty('top');
      panel.style.removeProperty('right');
      panel.style.removeProperty('bottom');
      panel.style.removeProperty('width');
      panel.style.removeProperty('height');
      return panel.getBoundingClientRect();
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minWidth = 360;
    const maxWidth = Math.max(minWidth, Math.min(720, viewportWidth - 24));
    const minHeight = 420;
    const maxHeight = Math.max(minHeight, viewportHeight - 24);
    const width = Math.max(minWidth, Math.min(maxWidth, Number(options.width) || 442));
    const height = Math.max(minHeight, Math.min(maxHeight, Number(options.height) || viewportHeight - 24));
    const left = Math.max(8, Math.min(viewportWidth - width - 8, Number(options.left) || viewportWidth - width - 24));
    const top = Math.max(8, Math.min(Math.max(8, viewportHeight - height - 8), Number(options.top) || 12));
    root.classList.add('is-floating');
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.width = `${Math.round(width)}px`;
    panel.style.height = `${Math.round(height)}px`;
    return panel.getBoundingClientRect();
  }

  function syncFloatingPanel(options = {}) {
    if (!root?.classList.contains('is-floating')) return;
    const panel = root.querySelector('.fn-panel');
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    applyPanelGeometry({
      floating: true,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      ...options
    });
  }

  function setFabPosition(right, bottom) {
    const fab = root?.querySelector('.fn-fab');
    if (!fab) return;
    const size = fab.offsetWidth || 58;
    const maxRight = Math.max(8, window.innerWidth - size - 8);
    const maxBottom = Math.max(8, window.innerHeight - size - 8);
    const r = Math.max(8, Math.min(maxRight, Number(right) || 22));
    const b = Math.max(8, Math.min(maxBottom, Number(bottom) || 24));
    fab.style.right = `${r}px`;
    fab.style.bottom = `${b}px`;
    fab.dataset.right = String(r);
    fab.dataset.bottom = String(b);
  }

  function toast(message, type = 'info', timeout = 3200) {
    if (!root || !els.toasts) return;
    const node = document.createElement('div');
    node.className = `fn-toast${type === 'error' ? ' is-error' : type === 'success' ? ' is-success' : ''}`;
    node.innerHTML = `${FN.icon(type === 'error' ? 'help' : type === 'success' ? 'check' : 'sparkles', 13)}<span>${FN.escapeHtml(message)}</span>`;
    els.toasts.appendChild(node);
    while (els.toasts.children.length > 4) els.toasts.firstElementChild?.remove();
    setTimeout(() => {
      node.style.opacity = '0';
      node.style.transform = 'translateY(4px)';
      node.style.transition = 'opacity .18s, transform .18s';
      setTimeout(() => node.remove(), 200);
    }, timeout);
  }

  function closeModal() {
    if (!modalState) return;
    const { backdrop, onClose, resolve } = modalState;
    modalState = null;
    backdrop.remove();
    try {
      onClose?.();
    } catch (_) {
      /* ignore */
    }
    if (resolve) resolve(false);
    document.removeEventListener('keydown', onModalKeydown, true);
  }

  function onModalKeydown(event) {
    if (event.key === 'Escape' && modalState) {
      event.preventDefault();
      event.stopPropagation();
      if (modalState.persistent) return;
      closeModal();
    }
  }

  function openModal(options = {}) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'fn-modal-backdrop';
    const sizeClass = options.wide ? ' is-wide' : options.narrow ? ' is-narrow' : '';
    backdrop.innerHTML = `
      <div class="fn-modal${sizeClass}" role="dialog" aria-modal="true" aria-label="${FN.escapeHtml(options.title || '帧记')}" tabindex="-1">
        <div class="fn-modal-head">
          <div>
            <div class="fn-modal-title">${options.icon ? FN.icon(options.icon, 17) : ''}${FN.escapeHtml(options.title || '')}</div>
            ${options.subtitle ? `<div class="fn-modal-sub">${options.subtitle}</div>` : ''}
          </div>
          <button class="fn-icon-btn" type="button" data-modal-close title="关闭">${FN.icon('close', 17)}</button>
        </div>
        <div class="fn-modal-body${options.flush ? ' is-flush' : ''}">${options.body || ''}</div>
        ${options.footer ? `<div class="fn-modal-foot">${options.footer}</div>` : ''}
      </div>`;
    els.modalRoot.appendChild(backdrop);
    const modal = backdrop.querySelector('.fn-modal');
    modalState = { backdrop, modal, onClose: options.onClose, persistent: !!options.persistent, resolve: null };
    backdrop.addEventListener('mousedown', (event) => {
      if (event.target === backdrop && !options.persistent) closeModal();
    });
    modal.querySelector('[data-modal-close]')?.addEventListener('click', () => {
      if (!options.persistent) closeModal();
    });
    document.addEventListener('keydown', onModalKeydown, true);
    setTimeout(() => {
      if (options.focus !== false) {
        const focusable = modal.querySelector(
          'input:not([type="hidden"]), textarea, select, button.is-primary, [data-autofocus]'
        );
        focusable?.focus();
      }
      options.onMount?.(modal);
    }, 30);
    return { modal, backdrop, close: closeModal };
  }

  function confirm(options = {}) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        closeModal();
        resolve(value);
      };
      const handle = openModal({
        title: options.title || '请确认',
        icon: options.icon || 'help',
        narrow: true,
        body: `<p class="fn-confirm-text">${options.message || ''}</p>`,
        footer: `
          <button class="fn-btn is-sm" type="button" data-confirm-cancel>${FN.escapeHtml(options.cancelText || '取消')}</button>
          <button class="fn-btn is-sm ${options.danger ? 'is-danger' : 'is-primary'}" type="button" data-confirm-ok>${FN.escapeHtml(options.confirmText || '确定')}</button>`,
        onClose: () => {
          if (!settled) {
            settled = true;
            resolve(false);
          }
        },
        onMount: (modal) => {
          modal.querySelector('[data-confirm-cancel]').addEventListener('click', () => finish(false));
          modal.querySelector('[data-confirm-ok]').addEventListener('click', () => finish(true));
        }
      });
      handle.modal.dataset.confirm = '1';
    });
  }

  function formatError(error) {
    const text = String(error?.message || error || '未知错误');
    return FN.escapeHtml(text).replace(/\n/g, '<br>');
  }

  /* ------------------------------------------------------------------------
   * 面板内联进度（不遮挡网页/视频）
   * ---------------------------------------------------------------------- */

  function inlineProgress(options = {}) {
    const slot = els.inlineProgress;
    if (!slot) return { card: document.createElement('div'), close: () => {} };
    slot.hidden = false;
    slot.innerHTML = `
      <div class="fn-inline-progress">
        <div class="fn-inline-progress-head">
          <span class="fn-inline-spinner">${FN.icon('sparkles', 14)}</span>
          <div class="fn-inline-progress-title">
            <b data-progress-title>${FN.escapeHtml(options.title || 'AI 正在工作')}</b>
            <span data-progress-subtitle>${FN.escapeHtml(options.subtitle || '可以继续观看视频，完成后会提示你')}</span>
          </div>
          <button class="fn-mini-btn" type="button" data-inline-close title="收起进度（任务继续）">${FN.icon('chevronDown', 14)}</button>
        </div>
        <div class="fn-inline-progress-body">${options.body || ''}</div>
      </div>`;
    const card = slot.querySelector('.fn-inline-progress');
    const close = () => {
      slot.hidden = true;
      slot.innerHTML = '';
    };
    slot.querySelector('[data-inline-close]')?.addEventListener('click', () => close());
    return { card, slot, close };
  }

  /* ------------------------------------------------------------------------
   * 页面让位：给右侧面板预留空间，避免盖住视频
   * ---------------------------------------------------------------------- */

  let dockStyle = null;
  let dockOriginalMargin = null;
  let dockCheckTimer = null;

  function ensureDockStyle() {
    if (dockStyle && dockStyle.isConnected) return;
    dockStyle = document.getElementById('fn-page-dock-style');
    if (dockStyle) return;
    dockStyle = document.createElement('style');
    dockStyle.id = 'fn-page-dock-style';
    dockStyle.textContent = `
      html.fn-framenote-docked {
        margin-right: var(--fn-page-dock-width, 0px) !important;
        box-sizing: border-box !important;
      }
      html.fn-framenote-docked.fn-framenote-shrink-video video {
        max-width: calc(100vw - var(--fn-page-dock-width, 0px) - 24px) !important;
      }
      /* 固定定位播放器 / 站点自己的布局无法靠 margin 重排时，整页等比缩到左侧。 */
      html.fn-framenote-docked.fn-framenote-scale-page body {
        transform: scale(var(--fn-page-scale, 1)) !important;
        transform-origin: top left !important;
      }
    `;
    (document.head || document.documentElement).appendChild(dockStyle);
  }

  function findPrimaryVideo() {
    const videos = [...document.querySelectorAll('video')];
    let best = null;
    let bestScore = -1;
    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 60) continue;
      if (rect.bottom < 0 || rect.right < 0) continue;
      const score = rect.width * rect.height + (video.paused ? 0 : 1e7);
      if (score > bestScore) {
        bestScore = score;
        best = video;
      }
    }
    return best;
  }

  function checkVideoOverlap() {
    const html = document.documentElement;
    if (!html.classList.contains('fn-framenote-docked')) return;
    const panel = root?.querySelector('.fn-panel');
    const video = findPrimaryVideo();
    if (!panel || !video) {
      html.classList.remove('fn-framenote-shrink-video');
      return;
    }
    const panelRect = panel.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();
    const overlaps = videoRect.width > 0 && videoRect.right > panelRect.left + 4;
    html.classList.toggle('fn-framenote-shrink-video', overlaps);
    if (overlaps && !html.classList.contains('fn-framenote-scale-page')) {
      // 关键不是把页面缩小，而是给 body 建立包含块：
      // 站点把播放器写成 position:fixed 时，它会改为相对 body 定位，
      // 从而跟随已经让出侧栏宽度后的页面，而不是继续贴着整个视口。
      // 配合上面的 video max-width，固定播放器也不会再被侧栏压住。
      html.style.setProperty('--fn-page-scale', '1');
      html.classList.add('fn-framenote-scale-page');
    }
  }

  function applyPageDock(enabled, width = 442, reservedOverride = null) {
    ensureDockStyle();
    const html = document.documentElement;
    const shouldDock =
      !!enabled &&
      !document.fullscreenElement &&
      window.innerWidth >= 860 &&
      !!root?.classList.contains('is-open');
    const isDocked = html.classList.contains('fn-framenote-docked');
    if (shouldDock) {
      if (!isDocked) {
        dockOriginalMargin = {
          value: html.style.getPropertyValue('margin-right'),
          priority: html.style.getPropertyPriority('margin-right')
        };
      }
      const reserved = Math.round(
        Number(reservedOverride) ||
          Math.max(360, Math.min(720, Number(width) || 442)) + 24
      );
      html.classList.add('fn-framenote-docked');
      html.style.setProperty('--fn-page-dock-width', `${reserved}px`);
      html.style.setProperty('margin-right', `${reserved}px`, 'important');
      clearTimeout(dockCheckTimer);
      dockCheckTimer = setTimeout(checkVideoOverlap, 320);
    } else {
      html.classList.remove('fn-framenote-docked');
      html.classList.remove('fn-framenote-shrink-video');
      html.classList.remove('fn-framenote-scale-page');
      html.style.removeProperty('--fn-page-scale');
      if (isDocked) {
        if (dockOriginalMargin?.value) {
          html.style.setProperty(
            'margin-right',
            dockOriginalMargin.value,
            dockOriginalMargin.priority || ''
          );
        } else {
          html.style.removeProperty('margin-right');
        }
      }
      html.style.removeProperty('--fn-page-dock-width');
      clearTimeout(dockCheckTimer);
      dockOriginalMargin = null;
    }
  }

  FN.UI = {
    mount,
    setOpen,
    setDismissed,
    setTheme,
    setAccent,
    setWidth,
    applyPanelGeometry,
    syncFloatingPanel,
    setFabPosition,
    toast,
    openModal,
    closeModal,
    confirm,
    formatError,
    inlineProgress,
    applyPageDock,
    get root() {
      return root;
    },
    get host() {
      return host;
    },
    get els() {
      return els;
    },
    get hasModal() {
      return !!modalState;
    }
  };
})();
