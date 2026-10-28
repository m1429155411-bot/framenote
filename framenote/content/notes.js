/* 帧记 · 笔记编辑器与文稿 */
(() => {
  const FN = globalThis.FN;
  const App = FN.App;

  const TEMPLATE_LABEL = { rich: '图文笔记', outline: '大纲笔记', transcript: '文稿笔记' };

  const Notes = (FN.Notes = {});

  const el = (name) => App.el(name);
  const state = App.state;

  function esc(value) {
    return FN.escapeHtml(value);
  }

  function inline(value) {
    return FN.escapeHtml(value)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function tsSpan(ts, extraClass = '') {
    if (ts == null || ts === '') return '';
    return `<span class="fn-ts ${extraClass}" data-ts="${Number(ts)}" contenteditable="false">${FN.fmtTime(ts)}</span>`;
  }

  function currentTime() {
    return Number(App.tracker?.video?.currentTime) || 0;
  }

  /* ------------------------------------------------------------------------
   * 头部 / 状态
   * ---------------------------------------------------------------------- */

  Notes.renderAIBanner = function renderAIBanner() {
    if (!el('aiBanner')) return;
    if (!state.settings) return;
    if (FN.AI.isConfigured(state.settings)) {
      el('aiBanner').innerHTML = '';
      return;
    }
    el('aiBanner').innerHTML = `
      <div class="fn-ai-banner" data-act="open-settings">
        <div class="fn-ai-banner-icon">${FN.icon('sparkles', 16)}</div>
        <div class="fn-ai-banner-text">
          <b>连接 AI，解锁一键笔记 / 脑图 / 出题</b>
          <span>本地 OCR 与时间戳笔记无需配置，打开即用</span>
        </div>
        <span class="fn-link-btn">去配置 ${FN.icon('chevronRight', 11)}</span>
      </div>`;
  };

  Notes.renderHeader = function renderHeader() {
    if (!state.note) return;
    const titleInput = el('noteTitle');
    if (titleInput && document.activeElement !== titleInput) {
      titleInput.value = state.note.title || '';
    }
    Notes.renderNoteMeta();
  };

  Notes.renderNoteMeta = function renderNoteMeta() {
    if (!state.note || !el('noteMeta')) return;
    const meta = FN.Store.noteMeta(state.note);
    const bits = [
      `<span class="fn-chip is-primary">${TEMPLATE_LABEL[state.template] || '笔记'}</span>`,
      `<span>${meta.words.toLocaleString('zh-CN')} 字</span>`,
      `<span class="fn-dot"></span>`,
      `<span>${meta.timestamps} 个时间戳</span>`
    ];
    if (meta.hasImage) {
      bits.push('<span class="fn-dot"></span>', `<span>${meta.images} 张截图</span>`);
    }
    if (state.note.ai?.generatedAt) {
      bits.push('<span class="fn-dot"></span>', '<span>AI 生成</span>');
    }
    if (state.note.transcript?.length) {
      bits.push('<span class="fn-dot"></span>', `<span>${state.note.transcript.length} 条文稿</span>`);
    }
    el('noteMeta').innerHTML = bits.join('');
    const stats = el('editorStats');
    if (stats) {
      stats.textContent = `${meta.words} 字 · ${meta.images} 张图`;
    }
  };

  Notes.applyTemplate = function applyTemplate() {
    for (const button of App.els.templateBtns || []) {
      button.classList.toggle('is-active', button.dataset.template === state.template);
    }
    const rich = el('templateRich');
    const outline = el('templateOutline');
    const transcript = el('templateTranscript');
    if (rich) rich.hidden = state.template !== 'rich';
    if (outline) outline.hidden = state.template !== 'outline';
    if (transcript) transcript.hidden = state.template !== 'transcript';
  };

  Notes.render = function render() {
    if (!state.note) return;
    Notes.renderHeader();
    if (state.template === 'rich') Notes.renderRich();
    if (state.template === 'outline') Notes.renderOutline();
    if (state.template === 'transcript') Notes.renderTranscript();
    Notes.renderNoteMeta();
  };

  /* ------------------------------------------------------------------------
   * 图文编辑器
   * ---------------------------------------------------------------------- */

  function hydrateRich() {
    const editor = el('editor');
    if (!editor) return;
    for (const node of editor.querySelectorAll('.fn-ts')) {
      node.setAttribute('contenteditable', 'false');
      if (!node.title) node.title = '点击跳转到视频 ' + (node.textContent || '');
    }
    for (const figure of editor.querySelectorAll('figure')) {
      figure.setAttribute('contenteditable', 'false');
    }
    for (const img of editor.querySelectorAll('img')) {
      img.loading = 'lazy';
      img.decoding = 'async';
    }
  }

  Notes.renderRich = function renderRich() {
    const editor = el('editor');
    if (!editor || !state.note) return;
    const html = FN.sanitizeHtml(state.note.richHtml || '');
    if (document.activeElement !== editor && editor.innerHTML !== html) {
      editor.innerHTML = html;
    }
    hydrateRich();
    Notes.updateEditorStats();
  };

  Notes.syncRichToNote = function syncRichToNote() {
    if (!state.note || !el('editor')) return;
    state.note.richHtml = FN.sanitizeHtml(el('editor').innerHTML || '');
    Notes.updateEditorStats();
  };

  Notes.updateEditorStats = function updateEditorStats() {
    if (!state.note) return;
    const html = el('editor')?.innerHTML || state.note.richHtml || '';
    const text = FN.stripHtml(html);
    const images = (html.match(/<img\b/gi) || []).length;
    const stamps = new Set();
    for (const match of html.matchAll(/data-ts="([^"]+)"/g)) stamps.add(match[1]);
    if (el('editorStats')) {
      el('editorStats').textContent = `${text.replace(/\s/g, '').length} 字 · ${images} 张图 · ${stamps.size} 个时间戳`;
    }
  };

  Notes.insertHtml = function insertHtml(html, options = {}) {
    const editor = el('editor');
    if (!editor) return;
    if (state.template !== 'rich') {
      state.template = 'rich';
      state.note.template = 'rich';
      Notes.applyTemplate();
      Notes.renderRich();
    }
    editor.focus();
    const selection = window.getSelection();
    const inEditor =
      selection?.rangeCount > 0 &&
      editor.contains(selection.anchorNode) &&
      editor.contains(selection.focusNode);
    if (inEditor) {
      document.execCommand('insertHTML', false, html);
    } else {
      editor.insertAdjacentHTML('beforeend', html);
    }
    if (options.ensureParagraph !== false) {
      const last = editor.lastElementChild;
      if (!last || !['FIGURE', 'P', 'UL', 'OL', 'BLOCKQUOTE', 'H2'].includes(last.tagName)) {
        editor.insertAdjacentHTML('beforeend', '<p><br></p>');
      }
    }
    hydrateRich();
    Notes.syncRichToNote();
    Notes.updateEditorStats();
    App.persistSoon();
    editor.scrollTop = editor.scrollHeight;
    if (options.focus !== false) editor.focus();
  };

  Notes.insertTimestamp = function insertTimestamp(ts = currentTime()) {
    if (!state.note) return;
    if (state.template === 'rich') {
      Notes.insertHtml(`${tsSpan(ts)}&nbsp;`);
      App.toast(`已插入时间戳 ${FN.fmtTime(ts)}`, 'success', 1800);
      return;
    }
    if (state.template === 'outline') {
      Notes.addOutlineNode({ level: 1, ts, focus: true });
      App.toast(`已新建带时间戳的大纲节点 ${FN.fmtTime(ts)}`, 'success', 1800);
      return;
    }
    if (state.template === 'transcript') {
      if (App.tracker?.video) App.seek(ts);
      else App.toast('当前页面没有视频可跳转', 'error');
    }
  };

  Notes.runEditorCommand = function runEditorCommand(command) {
    const editor = el('editor');
    if (!editor) return;
    editor.focus();
    const exec = (cmd, value = null) => document.execCommand(cmd, false, value);
    if (command === 'h2') {
      const current = document.queryCommandValue('formatBlock');
      exec('formatBlock', current === 'h2' ? 'p' : 'h2');
    } else if (command === 'quote') {
      const current = document.queryCommandValue('formatBlock');
      exec('formatBlock', current === 'blockquote' ? 'p' : 'blockquote');
    } else if (command === 'ul') {
      exec('insertUnorderedList');
    } else {
      exec(command);
    }
    Notes.syncRichToNote();
    App.persistSoon();
  };

  Notes.insertLink = function insertLink() {
    const editor = el('editor');
    if (!editor) return;
    const selection = window.getSelection();
    const selected = selection?.rangeCount ? selection.toString().trim() : '';
    const handle = FN.UI.openModal({
      title: '插入链接',
      icon: 'link',
      narrow: true,
      body: `
        <div class="fn-field">
          <label>链接地址</label>
          <input class="fn-input" data-link-url type="url" placeholder="https://..." value="https://" />
        </div>
        <div class="fn-field">
          <label>显示文字</label>
          <input class="fn-input" data-link-text type="text" placeholder="链接文字" value="${esc(selected)}" />
        </div>`,
      footer:
        '<button class="fn-btn is-sm" data-cancel>取消</button><button class="fn-btn is-sm is-primary" data-ok>插入</button>',
      onMount: (modal) => {
        modal.querySelector('[data-cancel]').addEventListener('click', () => handle.close());
        modal.querySelector('[data-ok]').addEventListener('click', () => {
          const url = modal.querySelector('[data-link-url]').value.trim();
          const text = modal.querySelector('[data-link-text]').value.trim() || url;
          if (!/^https?:\/\//i.test(url)) {
            App.toast('请输入 http:// 或 https:// 开头的链接', 'error');
            return;
          }
          handle.close();
          Notes.insertHtml(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>&nbsp;`);
        });
      }
    });
  };

  Notes.clearRich = async function clearRich() {
    if (!state.note) return;
    const ok = await FN.UI.confirm({
      title: '清空图文笔记？',
      message: '正文、截图和时间戳都会删除，且无法恢复。大纲与文稿不受影响。',
      confirmText: '清空正文',
      danger: true
    });
    if (!ok) return;
    state.note.richHtml = '';
    if (el('editor')) el('editor').innerHTML = '';
    Notes.updateEditorStats();
    Notes.renderNoteMeta();
    App.persistSoon();
    App.toast('已清空图文正文');
  };

  /* ------------------------------------------------------------------------
   * 大纲
   * ---------------------------------------------------------------------- */

  Notes.renderOutline = function renderOutline() {
    const list = el('outlineList');
    if (!list || !state.note) return;
    const nodes = state.note.outline || [];
    if (!nodes.length) {
      list.innerHTML = `
        <div class="fn-empty" style="padding: 22px 14px 16px">
          <div class="fn-empty-art">${FN.icon('list', 24)}</div>
          <h3>把视频拆成一张知识地图</h3>
          <p>回车新建节点，Tab 缩进层级，点击时钟把当前播放位置钉在节点上。</p>
          <div class="fn-empty-actions">
            <button class="fn-btn is-sm is-primary" type="button" data-act="outline-add">${FN.icon('plus', 12)} 新建节点</button>
            <button class="fn-btn is-sm" type="button" data-act="outline-ai">${FN.icon('sparkles', 12)} AI 生成大纲</button>
          </div>
        </div>`;
      return;
    }
    list.innerHTML = nodes
      .map((node) => {
        const level = Math.max(1, Math.min(5, Number(node.level) || 1));
        return `
        <div class="fn-outline-row${node.star ? ' is-star' : ''}" data-id="${esc(node.id)}" data-level="${level}" style="padding-left:${(level - 1) * 17 + 6}px">
          <span class="fn-outline-handle">${FN.icon('menu', 11)}</span>
          <span class="fn-outline-bullet"><span></span></span>
          <div class="fn-outline-text" contenteditable="true"
            data-outline-text="${esc(node.id)}" data-placeholder="输入知识点…">${esc(node.text || '')}</div>
          ${node.ts != null ? `<button class="fn-ts fn-outline-ts" type="button" data-ts="${Number(node.ts)}" title="跳转">${FN.fmtTime(node.ts)}</button>` : ''}
          <div class="fn-outline-actions">
            <button class="fn-outline-action${node.star ? ' is-starred' : ''}" type="button" data-outline-act="star" data-id="${esc(node.id)}" title="${node.star ? '取消重点' : '标为重点'}">${FN.icon('star', 12)}</button>
            <button class="fn-outline-action" type="button" data-outline-act="ts" data-id="${esc(node.id)}" title="绑定当前时间">${FN.icon('clock', 12)}</button>
            <button class="fn-outline-action" type="button" data-outline-act="child" data-id="${esc(node.id)}" title="添加子节点">${FN.icon('plus', 12)}</button>
            <button class="fn-outline-action" type="button" data-outline-act="delete" data-id="${esc(node.id)}" title="删除节点">${FN.icon('trash', 12)}</button>
          </div>
        </div>`;
      })
      .join('');
  };

  Notes.addOutlineNode = function addOutlineNode(options = {}) {
    if (!state.note) return null;
    const nodes = state.note.outline;
    let level = Math.max(1, Math.min(5, Number(options.level) || 1));
    let insertIndex = nodes.length;
    if (options.afterId) {
      const index = nodes.findIndex((node) => node.id === options.afterId);
      if (index >= 0) {
        insertIndex = index + 1;
        level = Math.max(1, Math.min(5, Number(options.level) || Number(nodes[index].level) || 1));
      }
    }
    const node = {
      id: FN.uid('node'),
      text: options.text || '',
      level,
      ts: options.ts != null ? Number(options.ts) : null,
      star: !!options.star
    };
    nodes.splice(insertIndex, 0, node);
    Notes.renderOutline();
    App.persistSoon();
    if (options.focus !== false) {
      setTimeout(() => {
        const textEl = el('outlineList')?.querySelector(`[data-outline-text="${node.id}"]`);
        textEl?.focus();
        if (textEl) {
          const range = document.createRange();
          range.selectNodeContents(textEl);
          range.collapse(false);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }, 30);
    }
    return node;
  };

  Notes.updateOutlineNode = function updateOutlineNode(id, patch) {
    if (!state.note) return;
    const node = state.note.outline.find((item) => item.id === id);
    if (!node) return;
    Object.assign(node, patch);
    App.persistSoon();
  };

  Notes.removeOutlineNode = function removeOutlineNode(id) {
    if (!state.note) return;
    const index = state.note.outline.findIndex((item) => item.id === id);
    if (index < 0) return;
    state.note.outline.splice(index, 1);
    Notes.renderOutline();
    App.persistSoon();
  };

  Notes.changeOutlineLevel = function changeOutlineLevel(id, delta) {
    if (!state.note) return;
    const node = state.note.outline.find((item) => item.id === id);
    if (!node) return;
    node.level = Math.max(1, Math.min(5, (Number(node.level) || 1) + delta));
    Notes.renderOutline();
    App.persistSoon();
    setTimeout(() => {
      el('outlineList')?.querySelector(`[data-outline-text="${id}"]`)?.focus();
    }, 20);
  };

  Notes.handleOutlineKeydown = function handleOutlineKeydown(event, id) {
    const node = state.note?.outline.find((item) => item.id === id);
    if (!node) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      Notes.addOutlineNode({ afterId: id, level: node.level, focus: true });
    } else if (event.key === 'Tab') {
      event.preventDefault();
      Notes.changeOutlineLevel(id, event.shiftKey ? -1 : 1);
    } else if (event.key === 'Backspace' && !node.text) {
      event.preventDefault();
      const index = state.note.outline.findIndex((item) => item.id === id);
      Notes.removeOutlineNode(id);
      const prev = state.note.outline[Math.max(0, index - 1)];
      if (prev) {
        setTimeout(() => {
          const target = el('outlineList')?.querySelector(`[data-outline-text="${prev.id}"]`);
          target?.focus();
        }, 20);
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const index = state.note.outline.findIndex((item) => item.id === id);
      const next = state.note.outline[index + (event.key === 'ArrowDown' ? 1 : -1)];
      if (next) {
        event.preventDefault();
        const target = el('outlineList')?.querySelector(`[data-outline-text="${next.id}"]`);
        target?.focus();
      }
    }
  };

  Notes.bindOutlineText = function bindOutlineText(target) {
    const id = target.dataset.outlineText;
    const node = state.note?.outline.find((item) => item.id === id);
    if (!node) return;
    node.text = FN.cleanText(target.textContent || '');
    App.persistSoon();
  };

  Notes.outlineToMap = function outlineToMap() {
    if (!state.note?.outline?.length) {
      App.toast('先添加几个大纲节点，再生成导图', 'error');
      return;
    }
    state.mapSource = 'outline';
    App.setView('map');
  };

  /* ------------------------------------------------------------------------
   * 文稿
   * ---------------------------------------------------------------------- */

  Notes.renderTranscript = function renderTranscript() {
    const container = el('transcriptContent');
    if (!container || !state.note) return;
    const segments = state.note.transcript || [];
    const tools = `
      <div class="fn-transcript-tools">
        <button class="fn-btn is-sm is-primary" type="button" data-act="extract-captions">${FN.icon('download', 12)} 提取字幕</button>
        <button class="fn-btn is-sm" type="button" data-act="import-subtitle">${FN.icon('file', 12)} 导入 SRT</button>
        <button class="fn-btn is-sm" type="button" data-act="transcribe-record">${FN.icon('mic', 12)} AI 转写</button>
        <label class="fn-toggle fn-auto-audio-toggle" title="边看边识别视频音频，自动写入文稿，停止后自动总结">
          <input type="checkbox" data-el="autoAudioToggle" ${state.autoAudio?.active || state.settings.autoAudio ? 'checked' : ''} />
          <span class="fn-toggle-track"></span>
          自动识别
        </label>
        <div class="fn-spacer"></div>
        <button class="fn-mini-btn" type="button" data-act="transcript-menu" title="更多">${FN.icon('more', 15)}</button>
      </div>`;

    if (!segments.length) {
      container.innerHTML = `
        ${tools}
        <div class="fn-transcript-empty">
          <div class="fn-empty-art" style="width:48px;height:48px;border-radius:15px">${FN.icon('text', 22)}</div>
          <div>
            <div style="font-size:12.5px;font-weight:650;color:var(--fn-text);margin-bottom:2px">把视频里的声音变成可搜索的文字</div>
            <p>支持读取网页视频自带的字幕轨，也可以导入 SRT / VTT，或录制视频声音交给 AI 转写。点击任意时间戳即可回到原片。</p>
          </div>
          <div class="fn-transcript-empty-actions">
            <button class="fn-btn is-xs" type="button" data-act="extract-captions">${FN.icon('download', 11)} 提取字幕</button>
            <button class="fn-btn is-xs" type="button" data-act="import-subtitle">${FN.icon('plus', 11)} 导入文件</button>
            <button class="fn-btn is-xs" type="button" data-act="auto-audio">${FN.icon('mic', 11)} 自动识别音频</button>
            <button class="fn-btn is-xs" type="button" data-act="transcribe-record">${FN.icon('mic', 11)} 手动转写</button>
          </div>
        </div>`;
      return;
    }

    const query = String(state.transcriptQuery || '').trim().toLowerCase();
    const visible = segments.filter(
      (segment) => !query || String(segment.text || '').toLowerCase().includes(query)
    );
    const rows = visible
      .map((segment) => {
        const active = state.activeSegmentId === segment.id;
        return `
        <div class="fn-segment${active ? ' is-active' : ''}" data-seg-id="${esc(segment.id)}">
          <button class="fn-segment-time" type="button" data-ts="${Number(segment.start) || 0}" title="跳转到 ${FN.fmtTime(segment.start)}">${FN.fmtTime(segment.start)}</button>
          <div class="fn-segment-body">
            <div class="fn-segment-text" contenteditable="true" data-seg-text="${esc(segment.id)}" spellcheck="false">${esc(segment.text || '')}</div>
            <div class="fn-segment-actions">
              <button class="fn-segment-action" type="button" data-act="segment-quote" data-id="${esc(segment.id)}">${FN.icon('quote', 10)} 引用到图文</button>
              <button class="fn-segment-action" type="button" data-act="segment-copy" data-id="${esc(segment.id)}">${FN.icon('copy', 10)} 复制</button>
            </div>
          </div>
        </div>`;
      })
      .join('');

    container.innerHTML = `
      ${tools}
      <div class="fn-transcript-search">
        ${FN.icon('scan', 13)}
        <input type="search" data-el="transcriptSearch" placeholder="搜索文稿内容…" value="${esc(state.transcriptQuery || '')}" />
        ${query ? `<button class="fn-mini-btn" type="button" data-act="clear-transcript-search" title="清除">${FN.icon('close', 12)}</button>` : `<span class="fn-small fn-muted">${segments.length} 条</span>`}
      </div>
      <div class="fn-note-card">
        <div class="fn-transcript-list" data-el="transcriptList">
          ${rows || '<div class="fn-library-empty">没有匹配的文稿内容</div>'}
        </div>
      </div>
      <div class="fn-transcript-footer">
        <span>${esc(state.note.transcriptSource || '视频字幕')} · ${segments.length} 条 · 点击时间跳转</span>
        <label class="fn-toggle" title="播放时自动高亮并滚动到当前文稿">
          <input type="checkbox" data-el="followTranscript" ${state.settings.followTranscript ? 'checked' : ''} />
          <span class="fn-toggle-track"></span>
          跟随播放
        </label>
      </div>`;
    Notes.syncTranscript(Number(state.videoState?.time) || 0, true);
  };

  Notes.filterTranscript = function filterTranscript(query) {
    state.transcriptQuery = query || '';
    const rows = el('transcriptList')?.querySelectorAll('[data-seg-id]');
    if (!rows) return;
    const value = String(query || '').trim().toLowerCase();
    let count = 0;
    for (const row of rows) {
      const text = row.querySelector('[data-seg-text]')?.textContent.toLowerCase() || '';
      const match = !value || text.includes(value);
      row.hidden = !match;
      if (match) count += 1;
    }
    const empty = el('transcriptList')?.querySelector('.fn-library-empty');
    if (empty) empty.hidden = count > 0;
    const search = el('transcriptSearch');
    if (search && document.activeElement !== search) search.value = state.transcriptQuery;
  };

  Notes.bindTranscriptText = function bindTranscriptText(target) {
    const id = target.dataset.segText;
    const segment = state.note?.transcript.find((item) => item.id === id);
    if (!segment) return;
    segment.text = FN.cleanText(target.textContent || '');
    App.persistSoon();
  };

  Notes.syncTranscript = function syncTranscript(time, force = false) {
    if (!state.note?.transcript?.length) return;
    const active = state.note.transcript.find(
      (segment) =>
        time >= (Number(segment.start) || 0) - 0.15 &&
        time < (Number(segment.end) || Number(segment.start) + 2) + 0.15
    );
    const nextId = active?.id || null;
    if (!force && nextId === state.activeSegmentId) return;
    state.activeSegmentId = nextId;
    const list = el('transcriptList');
    if (!list) return;
    for (const row of list.querySelectorAll('[data-seg-id]')) {
      row.classList.toggle('is-active', row.dataset.segId === nextId);
    }
    if (nextId && state.settings.followTranscript && state.view === 'notes' && state.template === 'transcript') {
      if (Date.now() < (state.transcriptScrollLockUntil || 0)) return;
      const activeEl = list.querySelector(`[data-seg-id="${nextId}"]`);
      if (activeEl) {
        const listRect = list.getBoundingClientRect();
        const rect = activeEl.getBoundingClientRect();
        if (rect.top < listRect.top + 12 || rect.bottom > listRect.bottom - 12) {
          activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  };

  Notes.normalizeSegments = function normalizeSegments(segments, source) {
    const duration =
      Number(state.videoMeta?.duration) ||
      Number(state.videoState?.duration) ||
      Number(state.note?.duration) ||
      0;
    let list = (segments || [])
      .map((segment) => ({
        id: segment.id || FN.uid('seg'),
        start: segment.start != null ? Number(segment.start) : null,
        end: segment.end != null ? Number(segment.end) : null,
        text: FN.cleanText(segment.text || ''),
        source: segment.source || source || 'subtitle'
      }))
      .filter((segment) => segment.text);

    list.sort((a, b) => {
      if (a.start == null && b.start == null) return 0;
      if (a.start == null) return 1;
      if (b.start == null) return -1;
      return a.start - b.start;
    });

    const count = list.length;
    const slice = count > 0 ? (duration || count * 3) / count : 3;
    for (let i = 0; i < count; i += 1) {
      const segment = list[i];
      if (segment.start == null) segment.start = duration ? (duration * i) / count : i * 3;
      if (segment.end == null || segment.end <= segment.start) {
        segment.end = Math.min(
          duration || segment.start + slice,
          segment.start + Math.max(1.2, slice)
        );
      }
      segment.start = Math.max(0, segment.start);
      segment.end = Math.max(segment.start + 0.5, segment.end);
    }

    // 去重相邻的完全相同片段
    const deduped = [];
    for (const segment of list) {
      const prev = deduped[deduped.length - 1];
      if (prev && prev.text === segment.text && Math.abs(prev.start - segment.start) < 0.8) continue;
      deduped.push(segment);
    }
    return deduped;
  };

  Notes.setTranscript = async function setTranscript(segments, source, options = {}) {
    if (!state.note) return;
    const normalized = Notes.normalizeSegments(segments, source);
    if (!normalized.length) {
      App.toast('没有识别到可用文字，请换一个视频片段或导入字幕文件', 'error');
      return false;
    }
    if (options.append && state.note.transcript?.length) {
      const existing = state.note.transcript.slice();
      const seen = new Set(existing.map((segment) => String(segment.text || '').trim()));
      const additions = normalized.filter((segment) => !seen.has(String(segment.text || '').trim()));
      if (!additions.length) {
        App.toast('这段文字已经在文稿里了', 'info');
        return false;
      }
      state.note.transcript = [...existing, ...additions].sort(
        (a, b) => (Number(a.start) || 0) - (Number(b.start) || 0)
      );
      state.note.transcriptSource = source || '语音听写';
      state.note.template = 'transcript';
      state.template = 'transcript';
      await App.persistNow();
      App.renderAll();
      App.toast(`已追加 ${additions.length} 条文稿`, 'success');
      return true;
    }
    if (!options.replace && state.note.transcript?.length) {
      const ok = await FN.UI.confirm({
        title: '替换现有文稿？',
        message: `当前已有 <b>${state.note.transcript.length}</b> 条文稿。继续会替换整份文稿，原内容无法恢复。`,
        confirmText: '替换文稿',
        danger: true
      });
      if (!ok) return false;
    }
    state.note.transcript = normalized;
    state.note.transcriptSource = source || '视频字幕';
    state.note.template = 'transcript';
    state.template = 'transcript';
    state.transcriptQuery = '';
    await App.persistNow();
    App.renderAll();
    App.toast(`已写入 ${normalized.length} 条文稿`, 'success');
    return true;
  };

  Notes.extractCaptions = async function extractCaptions() {
    if (!App.tracker?.video) {
      App.toast('当前页面没有检测到视频', 'error');
      return;
    }
    App.toast('正在读取视频字幕轨…');
    try {
      const result = await App.tracker.extractCaptions();
      const ok = await Notes.setTranscript(result.segments, result.source || '视频字幕');
      if (ok) App.setView('notes');
    } catch (error) {
      App.toast(error?.message || '字幕提取失败', 'error', 6000);
    }
  };

  Notes.importSubtitle = async function importSubtitle(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      App.toast('字幕文件太大了（上限 8MB）', 'error');
      return;
    }
    try {
      const text = await file.text();
      const segments = FN.parseSubtitle(text);
      if (!segments.length) throw new Error('没有解析到字幕内容，请确认是 SRT / VTT / 带时间戳的文本。');
      await Notes.setTranscript(segments, file.name.replace(/\.[^.]+$/, '') || '导入字幕');
    } catch (error) {
      App.toast(`导入失败：${error?.message || error}`, 'error', 6000);
    }
  };

  Notes.pasteTranscript = function pasteTranscript() {
    const handle = FN.UI.openModal({
      title: '粘贴文稿或字幕',
      subtitle: '支持 SRT / VTT / 每行一句的纯文本；没有时间戳时会按时长自动分配。',
      icon: 'text',
      body: '<textarea class="fn-textarea" data-transcript-paste rows="12" placeholder="粘贴字幕、课程文稿或视频文字…"></textarea>',
      footer:
        '<button class="fn-btn is-sm" data-cancel>取消</button><button class="fn-btn is-sm is-primary" data-ok>导入文稿</button>',
      onMount: (modal) => {
        modal.querySelector('[data-cancel]').addEventListener('click', () => handle.close());
        modal.querySelector('[data-ok]').addEventListener('click', async () => {
          const text = modal.querySelector('[data-transcript-paste]').value;
          if (!text.trim()) return;
          handle.close();
          const segments = FN.parseSubtitle(text);
          await Notes.setTranscript(segments, '粘贴文稿');
        });
      }
    });
  };

  Notes.clearTranscript = async function clearTranscript() {
    if (!state.note?.transcript?.length) return;
    const ok = await FN.UI.confirm({
      title: '清空文稿？',
      message: '整份文稿会被删除，笔记中的其它内容不受影响。',
      confirmText: '清空文稿',
      danger: true
    });
    if (!ok) return;
    state.note.transcript = [];
    state.note.transcriptSource = '';
    state.activeSegmentId = null;
    App.persistSoon();
    Notes.renderTranscript();
    Notes.renderNoteMeta();
    App.toast('已清空文稿');
  };

  Notes.transcriptMenu = function transcriptMenu() {
    const handle = FN.UI.openModal({
      title: '文稿工具',
      icon: 'text',
      narrow: true,
      body: `
        <div style="display:flex;flex-direction:column;gap:7px">
          <button class="fn-btn" style="justify-content:flex-start" data-menu="paste">${FN.icon('plus', 14)} 粘贴文稿 / 字幕</button>
          <button class="fn-btn" style="justify-content:flex-start" data-menu="srt">${FN.icon('download', 14)} 导出 SRT 字幕</button>
          <button class="fn-btn" style="justify-content:flex-start" data-menu="txt">${FN.icon('file', 14)} 导出带时间戳 TXT</button>
          <button class="fn-btn is-danger" style="justify-content:flex-start" data-menu="clear">${FN.icon('trash', 14)} 清空全部文稿</button>
        </div>`,
      onMount: (modal) => {
        modal.querySelectorAll('[data-menu]').forEach((button) => {
          button.addEventListener('click', () => {
            const action = button.dataset.menu;
            handle.close();
            if (action === 'paste') Notes.pasteTranscript();
            if (action === 'srt') Notes.exportTranscript('srt');
            if (action === 'txt') Notes.exportTranscript('txt');
            if (action === 'clear') Notes.clearTranscript();
          });
        });
      }
    });
  };

  function srtTime(seconds) {
    const ms = Math.max(0, Math.round((Number(seconds) || 0) * 1000));
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    const milli = String(ms % 1000).padStart(3, '0');
    return `${h}:${m}:${s},${milli}`;
  }

  Notes.exportTranscript = async function exportTranscript(format) {
    const segments = state.note?.transcript || [];
    if (!segments.length) {
      App.toast('还没有文稿可以导出', 'error');
      return;
    }
    const base = FN.slugify(state.note.title || '视频文稿');
    if (format === 'srt') {
      const content = segments
        .map((segment, index) => {
          const start = srtTime(segment.start);
          const end = srtTime(segment.end || Number(segment.start) + 2);
          return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
        })
        .join('\n');
      await FN.downloadText(content, `${base}.srt`, 'application/x-subrip;charset=utf-8');
    } else {
      const content = segments
        .map((segment) => `[${FN.fmtTime(segment.start)}] ${segment.text}`)
        .join('\n');
      await FN.downloadText(content, `${base}-逐字稿.txt`, 'text/plain;charset=utf-8');
    }
    App.toast('文稿已导出', 'success');
  };

  /* ------------------------------------------------------------------------
   * 录音转写
   * ---------------------------------------------------------------------- */

  Notes.startRecording = async function startRecording(options = {}) {
    const standalone = !!options.standalone;
    if (!state.note) return false;
    if (Notes.autoAudioActive()) {
      await Notes.stopAutoAudio({ summarize: false, silent: true });
    }
    if (!App.requireAI()) return false;
    if (!state.settings.sttModel) {
      App.toast('请先在设置中填写语音转写模型（如 whisper-1）', 'error');
      App.Dialogs.settings();
      return false;
    }
    if (state.recording) {
      App.toast('已经在录音了');
      return false;
    }
    if (!App.tracker?.video) {
      App.toast('当前页面没有检测到视频', 'error');
      return false;
    }
    if (!standalone && (state.note.transcript || []).length) {
      const ok = await FN.UI.confirm({
        title: 'AI 转写会替换现有文稿',
        message: `当前已有 <b>${state.note.transcript.length}</b> 条文稿。建议先导出备份。录制结束后会用新的转写替换它。`,
        confirmText: '开始录制',
        danger: false
      });
      if (!ok) return false;
    }

    let stream;
    try {
      stream = App.tracker.getAudioStream();
    } catch (error) {
      App.toast(error?.message || '无法捕获视频音频', 'error', 6000);
      return false;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
    if (!mimeType) {
      stream.getTracks().forEach((track) => track.stop());
      App.toast('当前浏览器不支持录音格式', 'error');
      return false;
    }

    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
    const chunks = [];
    const offset = currentTime();
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };
    recorder.onerror = () => {
      App.toast('录音出现错误，请重试', 'error');
    };
    recorder.onstop = async () => {
      const recording = state.recording;
      clearInterval(state.recordingTimer);
      state.recordingTimer = null;
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch (_) {
        /* ignore */
      }
      if (!recording || recording.finalizing) return;
      recording.finalizing = true;
      await Notes.finalizeRecording(recording, chunks);
    };

    state.recording = {
      recorder,
      stream,
      chunks,
      offset,
      startedAt: Date.now(),
      duration: 0,
      stopping: false,
      finalizing: false,
      reason: '',
      standalone
    };
    try {
      if (App.tracker.video.paused) await App.tracker.play();
      recorder.start(1000);
    } catch (error) {
      state.recording = null;
      stream.getTracks().forEach((track) => track.stop());
      App.toast(`无法开始录音：${error?.message || error}`, 'error');
      return false;
    }
    Notes.renderRecordingBar();
    state.recordingTimer = setInterval(() => {
      if (!state.recording) return;
      const elapsed = (Date.now() - state.recording.startedAt) / 1000;
      state.recording.duration = elapsed;
      const label = el('recordingTime');
      if (label) label.textContent = FN.fmtTime(elapsed);
      if (elapsed >= 600) Notes.stopRecording('已达到 10 分钟上限，正在转写');
    }, 500);
    App.toast(
      standalone
        ? '开始听写视频声音。点击面板顶部「停止并识别」结束。'
        : '开始录制视频声音。暂停视频或点击「停止」结束转写。',
      'success',
      4000
    );
    return true;
  };

  Notes.stopRecording = function stopRecording(reason = '') {
    const recording = state.recording;
    if (!recording || recording.stopping) return;
    recording.stopping = true;
    recording.reason = reason || '';
    recording.duration = (Date.now() - recording.startedAt) / 1000;
    clearInterval(state.recordingTimer);
    state.recordingTimer = null;
    try {
      if (recording.recorder.state !== 'inactive') recording.recorder.stop();
    } catch (_) {
      /* ignore */
    }
    Notes.renderRecordingBar();
  };

  Notes.finalizeRecording = async function finalizeRecording(recording, chunks) {
    state.recording = null;
    Notes.renderRecordingBar();
    if (!chunks.length) {
      App.toast('没有录到音频数据，请确认视频有声音且已开始播放', 'error');
      return;
    }
    const blob = new Blob(chunks, { type: recording.recorder.mimeType || 'audio/webm' });
    if (blob.size < 1200) {
      App.toast('录音太短，没有可转写的内容', 'error');
      return;
    }
    const handle = FN.UI.openModal({
      title: 'AI 正在转写',
      icon: 'mic',
      narrow: true,
      persistent: true,
      body: `
        <div class="fn-ai-progress">
          <div class="fn-ai-orb">${FN.icon('mic', 26)}</div>
          <h3>正在把声音变成带时间戳的文字</h3>
          <p>录音 ${FN.fmtTime(recording.duration)}，上传后由语音模型识别。长音频可能需要 1-2 分钟，请不要关闭面板。</p>
          <div class="fn-progress-bar"><i style="width:64%;animation:fnPulse 1.8s infinite"></i></div>
        </div>`
    });
    try {
      const dataUrl = await FN.blobToDataUrl(blob);
      const base64 = String(dataUrl).split(',')[1];
      const result = await FN.AI.transcribe(
        state.settings,
        base64,
        blob.type,
        recording.duration
      );
      let segments = (result.segments || []).map((segment) => ({
        id: FN.uid('seg'),
        start: recording.offset + (Number(segment.start) || 0),
        end: recording.offset + (Number(segment.end) || Number(segment.start) + 3),
        text: segment.text,
        source: 'stt'
      }));
      if (!segments.length && result.text) {
        segments = Notes.splitTextToSegments(result.text, recording.offset, result.duration || recording.duration);
      }
      if (!segments.length) throw new Error('转写结果为空，请确认视频有清晰人声。');
      handle.close();
      if (recording.standalone) {
        App.Dialogs.openSpeechResult(segments, {
          start: recording.offset,
          duration: recording.duration
        });
        return;
      }
      await Notes.setTranscript(segments, 'AI 语音转写', { replace: true });
      state.note.template = 'transcript';
      state.template = 'transcript';
      App.setView('notes');
      await App.persistNow();
      App.renderAll();
    } catch (error) {
      handle.close();
      App.toast(`转写失败：${error?.message || error}`, 'error', 7000);
    }
  };

  Notes.splitTextToSegments = function splitTextToSegments(text, offset = 0, duration = 0) {
    const clean = FN.cleanText(text);
    if (!clean) return [];
    const sentences = clean.match(/[^。！？!?；;\n]+[。！？!?；;]?/g) || [clean];
    const pieces = [];
    let buffer = '';
    for (const sentence of sentences) {
      buffer += sentence.trim();
      if (buffer.length >= 42) {
        pieces.push(buffer);
        buffer = '';
      }
    }
    if (buffer.trim()) pieces.push(buffer.trim());
    const totalChars = pieces.reduce((sum, piece) => sum + piece.length, 0) || 1;
    const totalDuration = duration || Math.max(3, pieces.length * 4);
    let cursor = 0;
    return pieces.map((piece) => {
      const span = (piece.length / totalChars) * totalDuration;
      const start = offset + cursor;
      cursor += span;
      return {
        id: FN.uid('seg'),
        start,
        end: Math.max(start + 0.8, offset + cursor),
        text: piece,
        source: 'stt'
      };
    });
  };

  /* ------------------------------------------------------------------------
   * 自动音频识别：边看边转写，停止后后台自动总结
   * ---------------------------------------------------------------------- */

  const AUTO_AUDIO_CHUNK_SECONDS = 20;

  Notes.autoAudioActive = function autoAudioActive() {
    return !!state.autoAudio?.active;
  };

  Notes.syncAutoAudioToggle = function syncAutoAudioToggle(enabled) {
    for (const input of FN.UI.root?.querySelectorAll('[data-el="autoAudioToggle"]') || []) {
      input.checked = !!enabled;
    }
  };

  Notes.setAutoAudioEnabled = async function setAutoAudioEnabled(enabled) {
    state.settings = await FN.Store.saveSettings({ autoAudio: !!enabled });
    Notes.syncAutoAudioToggle(!!enabled);
  };

  Notes.startAutoAudio = async function startAutoAudio(options = {}) {
    if (state.autoAudio?.active) {
      Notes.resumeAutoAudio();
      return true;
    }
    if (state.autoAudio) {
      App.toast('上一段音频识别正在收尾，请稍等一下', 'info', 1800);
      return false;
    }
    if (!state.note) return false;
    if (state.recording) {
      App.toast('正在手动录音，请先停止后再开启自动识别', 'error');
      return false;
    }
    if (!FN.AI.isConfigured(state.settings)) {
      App.toast('自动音频识别需要先配置 AI 接口', 'error');
      await Notes.setAutoAudioEnabled(false);
      Notes.syncAutoAudioToggle(false);
      App.Dialogs.settings({ firstTime: true });
      return false;
    }
    if (!state.settings.sttModel) {
      App.toast('请先在设置中填写语音转写模型（如 whisper-1）', 'error');
      await Notes.setAutoAudioEnabled(false);
      Notes.syncAutoAudioToggle(false);
      App.Dialogs.settings({ firstTime: true });
      return false;
    }
    if (!App.tracker?.video) {
      App.toast('当前页面没有检测到视频', 'error');
      await Notes.setAutoAudioEnabled(false);
      Notes.syncAutoAudioToggle(false);
      return false;
    }

    let stream;
    try {
      stream = App.tracker.getAudioStream();
    } catch (error) {
      App.toast(error?.message || '无法捕获视频音频', 'error', 6500);
      await Notes.setAutoAudioEnabled(false);
      Notes.syncAutoAudioToggle(false);
      return false;
    }

    const existingCount = (state.note.transcript || []).length;
    const auto = {
      active: true,
      stream,
      videoKey: state.noteKey,
      chunk: null,
      chunkTimer: null,
      queue: Promise.resolve(),
      pending: 0,
      transcribing: false,
      segmentsAdded: 0,
      errors: 0,
      startedAt: Date.now(),
      suppressRestartUntil: 0,
      chunkSeconds: AUTO_AUDIO_CHUNK_SECONDS
    };
    state.autoAudio = auto;
    if (!options.fromSettings) await Notes.setAutoAudioEnabled(true);
    Notes.syncAutoAudioToggle(true);
    Notes.renderRecordingBar();

    if (!App.tracker.video.paused) {
      Notes.startAutoAudioChunk();
      App.toast(
        existingCount
          ? '自动音频识别已开启，新的转写会追加到现有文稿'
          : '自动音频识别已开启，边看边转写；停止后会自动总结',
        'success',
        3200
      );
    } else {
      App.toast('自动音频识别已开启，播放视频后开始转写', 'info', 3000);
    }
    return true;
  };

  Notes.startAutoAudioChunk = function startAutoAudioChunk() {
    const auto = state.autoAudio;
    const video = App.tracker?.video;
    if (!auto?.active || auto.chunk || !auto.stream || !video || video.paused || video.ended) return;
    if (!auto.stream.active) {
      App.toast('音频流已结束，自动识别已停止', 'error');
      Notes.stopAutoAudio({ summarize: false, silent: true });
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
    if (!mimeType) {
      App.toast('当前浏览器不支持录音格式，无法自动识别音频', 'error');
      Notes.stopAutoAudio({ summarize: false, silent: true });
      return;
    }

    let recorder;
    try {
      recorder = new MediaRecorder(auto.stream, { mimeType, audioBitsPerSecond: 32000 });
    } catch (error) {
      App.toast(`无法启动音频识别：${error?.message || error}`, 'error');
      Notes.stopAutoAudio({ summarize: false, silent: true });
      return;
    }

    const chunk = {
      recorder,
      chunks: [],
      startVideo: Number(video.currentTime) || 0,
      startWall: Date.now(),
      stopping: false,
      reason: ''
    };
    auto.chunk = chunk;
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunk.chunks.push(event.data);
    };
    recorder.onerror = () => {
      App.toast('音频识别出错，正在重试下一段', 'error', 3000);
      chunk.stopping = true;
      if (auto.chunk === chunk) auto.chunk = null;
      if (auto.active && !video.paused) setTimeout(() => Notes.startAutoAudioChunk(), 600);
    };
    recorder.onstop = () => {
      clearTimeout(auto.chunkTimer);
      if (auto.chunk !== chunk) return;
      auto.chunk = null;
      const endVideo = Number(App.tracker?.video?.currentTime) || chunk.startVideo;
      const wallDuration = Math.max(0.5, (Date.now() - chunk.startWall) / 1000);
      const blob = chunk.chunks.length
        ? new Blob(chunk.chunks, { type: recorder.mimeType || 'audio/webm' })
        : null;
      if (blob && blob.size > 1200) {
        Notes.enqueueAutoAudioChunk(blob, chunk.startVideo, endVideo, wallDuration, chunk.reason);
      }
      Notes.renderRecordingBar();
      if (
        auto.active &&
        !App.tracker?.video?.paused &&
        !App.tracker?.video?.ended &&
        Date.now() >= (auto.suppressRestartUntil || 0)
      ) {
        setTimeout(() => Notes.startAutoAudioChunk(), 40);
      }
    };

    try {
      recorder.start(1000);
      auto.chunkTimer = setTimeout(() => Notes.flushAutoAudioChunk('interval'), auto.chunkSeconds * 1000);
      Notes.renderRecordingBar();
    } catch (error) {
      auto.chunk = null;
      App.toast(`无法录制视频音频：${error?.message || error}`, 'error', 5000);
    }
  };

  Notes.flushAutoAudioChunk = function flushAutoAudioChunk(reason = 'flush') {
    const auto = state.autoAudio;
    const chunk = auto?.chunk;
    if (!chunk || chunk.stopping) return;
    chunk.stopping = true;
    chunk.reason = reason;
    clearTimeout(auto.chunkTimer);
    try {
      if (chunk.recorder.state !== 'inactive') chunk.recorder.stop();
    } catch (_) {
      auto.chunk = null;
    }
  };

  Notes.pauseAutoAudio = function pauseAutoAudio() {
    if (!Notes.autoAudioActive()) return;
    Notes.flushAutoAudioChunk('pause');
    Notes.renderRecordingBar();
  };

  Notes.resumeAutoAudio = function resumeAutoAudio() {
    if (!state.settings?.autoAudio) return;
    if (!state.autoAudio?.active) {
      if (state.panelOpen && state.note) Notes.startAutoAudio({ fromSettings: true });
      return;
    }
    if (!App.tracker?.video?.paused) Notes.startAutoAudioChunk();
  };

  Notes.onAutoAudioSeek = function onAutoAudioSeek() {
    if (!Notes.autoAudioActive()) return;
    if (App.tracker?.suppressPause) return;
    const auto = state.autoAudio;
    auto.suppressRestartUntil = Date.now() + 700;
    Notes.flushAutoAudioChunk('seek');
    setTimeout(() => {
      if (
        state.autoAudio?.active &&
        !App.tracker?.video?.paused &&
        Date.now() >= (state.autoAudio.suppressRestartUntil || 0)
      ) {
        Notes.startAutoAudioChunk();
      }
    }, 760);
  };

  Notes.enqueueAutoAudioChunk = function enqueueAutoAudioChunk(blob, startVideo, endVideo, wallDuration, reason) {
    const auto = state.autoAudio;
    if (!auto) return;
    const videoSpan = Math.max(0.5, Number(endVideo) - Number(startVideo));
    auto.pending += 1;
    auto.queue = auto.queue
      .then(async () => {
        auto.transcribing = true;
        Notes.renderRecordingBar();
        try {
          const dataUrl = await FN.blobToDataUrl(blob);
          const base64 = String(dataUrl).split(',')[1];
          const result = await FN.AI.transcribe(state.settings, base64, blob.type, wallDuration);
          if (!state.note || auto.videoKey !== state.noteKey) return;
          let segments = (result.segments || []).map((segment) => {
            const scale = videoSpan / Math.max(0.5, Number(result.duration) || wallDuration || videoSpan);
            const start = Number(startVideo) + (Number(segment.start) || 0) * scale;
            const end = Number(startVideo) + (Number(segment.end) || Number(segment.start) + 2) * scale;
            return {
              id: FN.uid('seg'),
              start,
              end,
              text: FN.cleanText(segment.text || ''),
              source: 'auto-audio'
            };
          });
          if (!segments.length && result.text) {
            segments = Notes.splitTextToSegments(result.text, Number(startVideo), videoSpan);
          }
          const added = Notes.appendAutoAudioSegments(segments, auto);
          auto.segmentsAdded += added;
          auto.lastReason = reason;
        } catch (error) {
          auto.errors += 1;
          if (auto.errors <= 1) {
            App.toast(`音频转写失败：${error?.message || error}`, 'error', 5000);
          }
          if (auto.errors >= 2 && auto.active) {
            App.toast('音频识别连续失败，已自动停止。请检查语音模型和 API 设置。', 'error', 6000);
            setTimeout(() => Notes.stopAutoAudio({ summarize: false, silent: true }), 50);
          }
        } finally {
          auto.pending = Math.max(0, auto.pending - 1);
          auto.transcribing = false;
          Notes.renderRecordingBar();
        }
      })
      .catch(() => {
        auto.pending = Math.max(0, auto.pending - 1);
        auto.transcribing = false;
      });
  };

  Notes.appendAutoAudioSegments = function appendAutoAudioSegments(segments, auto) {
    if (!state.note || !Array.isArray(segments) || !segments.length) return 0;
    if (auto?.videoKey && auto.videoKey !== state.noteKey) return 0;
    const note = state.note;
    note.transcript = Array.isArray(note.transcript) ? note.transcript : [];
    const norm = (text) => String(text || '').replace(/[\s，。！？、,.!?；;：:]/g, '');
    const existing = new Set(note.transcript.map((segment) => norm(segment.text)));
    let added = 0;
    for (const segment of segments) {
      const text = FN.cleanText(segment.text || '');
      if (!text) continue;
      const fingerprint = norm(text);
      if (!fingerprint || existing.has(fingerprint)) continue;
      // 相邻同文去重
      const near = note.transcript.some(
        (item) =>
          Math.abs((Number(item.start) || 0) - (Number(segment.start) || 0)) < 1.5 &&
          norm(item.text) === fingerprint
      );
      if (near) continue;
      note.transcript.push({
        id: segment.id || FN.uid('seg'),
        start: Math.max(0, Number(segment.start) || 0),
        end: Math.max((Number(segment.start) || 0) + 0.8, Number(segment.end) || 0),
        text,
        source: 'auto-audio'
      });
      existing.add(fingerprint);
      added += 1;
    }
    if (!added) {
      Notes.renderRecordingBar();
      return 0;
    }
    note.transcript.sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));
    if (!note.transcriptSource || note.transcriptSource === '视频字幕') {
      note.transcriptSource = '自动音频识别';
    } else if (!String(note.transcriptSource).includes('自动音频')) {
      note.transcriptSource = `${note.transcriptSource} + 自动音频`;
    }
    App.persistSoon();
    if (
      state.view === 'notes' &&
      state.template === 'transcript' &&
      !document.activeElement?.closest?.('.fn-segment-text')
    ) {
      const scrollEl = el('scroll');
      const scrollTop = scrollEl?.scrollTop || 0;
      const list = el('transcriptList');
      const listTop = list?.scrollTop || 0;
      Notes.renderTranscript();
      if (scrollEl) scrollEl.scrollTop = scrollTop;
      if (list) list.scrollTop = listTop;
    } else {
      Notes.renderNoteMeta();
    }
    Notes.renderRecordingBar();
    return added;
  };

  Notes.stopAutoAudio = async function stopAutoAudio(options = {}) {
    const auto = state.autoAudio;
    if (!auto) {
      Notes.syncAutoAudioToggle(false);
      Notes.renderRecordingBar();
      return;
    }
    if (auto.stopping) return;
    auto.stopping = true;
    auto.active = false;
    clearTimeout(auto.chunkTimer);
    Notes.flushAutoAudioChunk('stop');

    // 等待最后一段录音与排队中的转写完成（最多约 45 秒）
    for (let i = 0; i < 450; i += 1) {
      if (!auto.chunk && auto.pending === 0 && !auto.transcribing) break;
      await FN.sleep(100);
    }
    try {
      await auto.queue;
    } catch (_) {
      /* ignore */
    }
    try {
      auto.stream?.getTracks().forEach((track) => track.stop());
    } catch (_) {
      /* ignore */
    }
    const added = auto.segmentsAdded;
    state.autoAudio = null;
    Notes.renderRecordingBar();
    Notes.syncAutoAudioToggle(false);
    if (options.disable !== false) await Notes.setAutoAudioEnabled(false);

    if (!options.silent) {
      App.toast(
        added
          ? `音频识别已停止，新增 ${added} 条文稿${options.summarize ? '，正在后台生成总结' : ''}`
          : '音频识别已停止，没有识别到新的语音内容',
        added ? 'success' : 'info',
        3200
      );
    }
    if (
      options.summarize &&
      state.settings.autoAudioSummary !== false &&
      (state.note?.transcript || []).length > 0 &&
      FN.AI.isConfigured(state.settings)
    ) {
      setTimeout(() => {
        if (state.note && state.panelOpen) {
          App.Insights.generateSummary({ auto: true });
        }
      }, 260);
    }
  };

  Notes.renderRecordingBar = function renderRecordingBar() {
    const bar = el('recordingBar');
    if (!bar) return;
    const recording = state.recording;
    const auto = state.autoAudio;
    bar.hidden = !recording && !auto;
    if (recording) {
      const elapsed = (Date.now() - recording.startedAt) / 1000;
      if (el('recordingLabel')) {
        el('recordingLabel').textContent = recording.standalone ? '语音听写中…' : '正在录制视频声音…';
      }
      if (el('recordingHint')) el('recordingHint').textContent = recording.standalone ? '听写' : '手动录音';
      if (el('recordingAction')) {
        el('recordingAction').textContent = recording.standalone ? '停止并识别' : '停止并转写';
      }
      if (el('recordingTime')) el('recordingTime').textContent = FN.fmtTime(elapsed);
      return;
    }
    if (auto) {
      const paused = !!App.tracker?.video?.paused;
      const count = state.note?.transcript?.length || 0;
      if (el('recordingLabel')) {
        el('recordingLabel').textContent = paused
          ? '识别已暂停'
          : auto.transcribing
            ? '转写中…'
            : '自动识别中…';
      }
      if (el('recordingHint')) {
        el('recordingHint').textContent = `${count} 条${auto.pending ? ` · 队列${auto.pending}` : ''}`;
      }
      if (el('recordingAction')) el('recordingAction').textContent = '停止并总结';
      if (el('recordingTime')) {
        el('recordingTime').textContent = FN.fmtTime(Number(App.tracker?.video?.currentTime) || 0);
      }
    }
  };

  Notes.summarizeAudioNow = async function summarizeAudioNow() {
    if (!state.note) return;
    if (!(state.note.transcript || []).length) {
      App.toast('还没有识别到文稿内容，先播放视频并开启自动识别', 'error');
      return;
    }
    await App.Insights.generateSummary({ auto: true });
  };

  /* ------------------------------------------------------------------------
   * 截图 / OCR
   * ---------------------------------------------------------------------- */

  Notes.maybeAutoSnapshot = function maybeAutoSnapshot() {
    if (!state.settings.autoSnapshot) return;
    if (!state.panelOpen || state.view !== 'notes' || state.template !== 'rich') return;
    if (!state.note || !App.tracker?.video) return;
    const time = currentTime();
    if (time < 0.8) return;
    if (Date.now() - state.lastAutoSnapshot < 4000) return;
    setTimeout(async () => {
      if (!state.panelOpen || state.template !== 'rich') return;
      if (!App.tracker.video?.paused) return;
      if (Math.abs(currentTime() - time) > 1.5) return;
      state.lastAutoSnapshot = Date.now();
      await Notes.snapshot({ auto: true });
    }, 850);
  };

  Notes.snapshot = async function snapshot(options = {}) {
    if (!state.note) return;
    if (!App.tracker?.video) {
      if (!options.auto) App.toast('当前页面没有检测到视频', 'error');
      return;
    }
    try {
      if (state.template !== 'rich' && !options.auto) {
        state.template = 'rich';
        state.note.template = 'rich';
        Notes.applyTemplate();
        Notes.renderRich();
      }
      const shot = await App.tracker.capture({
        maxWidth: 1280,
        quality: state.settings.screenshotQuality || 0.9
      });
      if (state.template !== 'rich') return;
      const figureTime = shot.time;
      Notes.insertHtml(Notes.figureHtml(shot, { source: options.auto ? 'auto' : 'manual' }));
      App.persistSoon();
      if (!options.auto) App.toast(`已截取 ${FN.fmtTime(figureTime)} 的画面，可继续补充说明`, 'success', 2600);

      if (options.openOcr || state.settings.autoOcr) {
        if (options.auto) {
          const result = await FN.AI.ocr(state.settings, shot.dataUrl);
          if (result.text) {
            Notes.insertHtml(Notes.ocrBlockHtml(result.text, figureTime));
            App.persistSoon();
          }
        } else {
          App.Dialogs.openOCR(shot, { mode: 'textAfterFigure', figureInserted: true });
        }
      }
    } catch (error) {
      if (!options.auto) App.toast(error?.message || '截图失败', 'error', 6000);
    }
  };

  Notes.figureHtml = function figureHtml(shot, options = {}) {
    const time = Number(shot.time) || 0;
    const label = options.source === 'auto' ? '自动截图' : '截图';
    return `<figure class="fn-figure" contenteditable="false" data-ts="${time}">
      <img src="${shot.dataUrl}" alt="视频截图 ${FN.fmtTime(time)}" />
      <figcaption>${tsSpan(time)} <span>${label} · ${FN.fmtTime(time)}</span></figcaption>
    </figure><p><br></p>`;
  };

  Notes.ocrBlockHtml = function ocrBlockHtml(text, ts) {
    const lines = String(text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) return '';
    return `<blockquote class="fn-ocr-quote">${ts != null ? `${tsSpan(ts)} ` : ''}<strong>画面文字</strong><br>${lines.map((line) => esc(line)).join('<br>')}</blockquote><p><br></p>`;
  };

  Notes.ocrCurrent = async function ocrCurrent(options = {}) {
    if (!state.note) return;
    if (!App.tracker?.video) {
      App.toast('当前页面没有检测到视频', 'error');
      return;
    }
    App.toast('正在截取画面并识别文字…');
    try {
      const shot = await App.tracker.capture({
        maxWidth: 1600,
        quality: state.settings.screenshotQuality || 0.9
      });
      App.Dialogs.openOCR(shot, { mode: options.mode || 'insertBoth' });
    } catch (error) {
      App.toast(error?.message || '截图失败', 'error', 6000);
    }
  };

  Notes.insertOCRResult = function insertOCRResult(shot, text, options = {}) {
    if (!state.note) return;
    if (state.template !== 'rich') {
      state.template = 'rich';
      state.note.template = 'rich';
      Notes.applyTemplate();
      Notes.renderRich();
    }
    const time = Number(shot?.time) || currentTime();
    if (!options.figureInserted && shot?.dataUrl) {
      Notes.insertHtml(
        `${Notes.figureHtml(shot, { source: 'ocr' })}${Notes.ocrBlockHtml(text, time)}`
      );
    } else {
      Notes.insertHtml(Notes.ocrBlockHtml(text, time));
    }
    App.persistSoon();
  };

  Notes.insertSpeechResult = function insertSpeechResult(segments) {
    if (!state.note || !segments?.length) return;
    if (state.template !== 'rich') {
      state.template = 'rich';
      state.note.template = 'rich';
      Notes.applyTemplate();
      Notes.renderRich();
    }
    const lines = segments
      .map((segment) => `<p>${tsSpan(segment.start)} ${esc(segment.text || '')}</p>`)
      .join('');
    Notes.insertHtml(`<blockquote class="fn-speech-quote">${lines}</blockquote><p><br></p>`);
    App.persistSoon();
    App.setView('notes');
    App.toast('语音文字已插入图文笔记', 'success');
  };

  Notes.quoteSegment = function quoteSegment(id) {
    const segment = state.note?.transcript.find((item) => item.id === id);
    if (!segment) return;
    state.template = 'rich';
    state.note.template = 'rich';
    Notes.applyTemplate();
    Notes.renderRich();
    Notes.insertHtml(
      `<blockquote>${tsSpan(segment.start)} ${esc(segment.text)}</blockquote><p><br></p>`
    );
    App.persistSoon();
    App.toast('已引用到图文笔记', 'success');
  };

  Notes.copySegment = async function copySegment(id) {
    const segment = state.note?.transcript.find((item) => item.id === id);
    if (!segment) return;
    await FN.copy(`[${FN.fmtTime(segment.start)}] ${segment.text}`);
    App.toast('已复制', 'success', 1500);
  };

  /* ------------------------------------------------------------------------
   * 粘贴图片
   * ---------------------------------------------------------------------- */

  Notes.handlePaste = async function handlePaste(event) {
    const items = [...(event.clipboardData?.items || [])];
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    event.preventDefault();
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const compressed = await FN.compressDataUrl(dataUrl, {
        maxWidth: 1280,
        quality: state.settings.screenshotQuality || 0.9
      });
      Notes.insertHtml(
        Notes.figureHtml(
          { dataUrl: compressed, time: currentTime() },
          { source: 'paste' }
        )
      );
      App.toast('已插入剪贴板图片，并绑定当前时间', 'success');
    } catch (error) {
      App.toast(`图片插入失败：${error?.message || error}`, 'error');
    }
  };

  /* ------------------------------------------------------------------------
   * AI 结果 -> 笔记模板
   * ---------------------------------------------------------------------- */

  Notes.buildRichFromAI = function buildRichFromAI(result, screenshots = new Map()) {
    const title = result.title || state.note.title || '视频笔记';
    const parts = [`<h1>${esc(title)}</h1>`];
    if (result.overview) {
      parts.push(`<p>${inline(result.overview)}</p>`);
    }
    for (const section of result.sections || []) {
      const star = section.star ? ' <span class="fn-star">★</span>' : '';
      parts.push(
        `<h2>${section.ts != null ? `${tsSpan(section.ts)} ` : ''}${esc(section.heading || '')}${star}</h2>`
      );
      if (section.points?.length) {
        parts.push(`<ul>${section.points.map((point) => `<li>${inline(point)}</li>`).join('')}</ul>`);
      }
      if (section.quote) {
        parts.push(`<blockquote>${esc(section.quote)}</blockquote>`);
      }
      const shot = section.ts != null ? screenshots.get(String(section.ts)) : null;
      if (shot) {
        parts.push(
          `<figure class="fn-figure" contenteditable="false" data-ts="${Number(section.ts)}">
            <img src="${shot}" alt="关键画面 ${FN.fmtTime(section.ts)}" />
            <figcaption>${tsSpan(section.ts)} <span>重点课件 · ${FN.fmtTime(section.ts)}</span></figcaption>
          </figure>`
        );
      }
    }
    if (result.summaryTable?.length) {
      parts.push('<h2>知识小结</h2><table><thead><tr><th>概念 / 术语</th><th>解释</th></tr></thead><tbody>');
      for (const row of result.summaryTable) {
        parts.push(`<tr><td>${inline(row.term)}</td><td>${inline(row.explain)}</td></tr>`);
      }
      parts.push('</tbody></table>');
    }
    if (result.keywords?.length) {
      parts.push(`<p><strong>关键词：</strong>${result.keywords.map((keyword) => esc(keyword)).join(' · ')}</p>`);
    }
    parts.push(`<p class="fn-ai-signature">由帧记 AI 整理 · ${FN.fmtClock(new Date())}</p>`);
    return parts.join('');
  };

  Notes.buildOutlineFromAI = function buildOutlineFromAI(result) {
    const nodes = [];
    for (const section of result.sections || []) {
      nodes.push({
        id: FN.uid('node'),
        text: section.heading || '未命名章节',
        level: 1,
        ts: section.ts != null ? Number(section.ts) : null,
        star: !!section.star
      });
      for (const point of section.points || []) {
        nodes.push({
          id: FN.uid('node'),
          text: point,
          level: 2,
          ts: null,
          star: false
        });
      }
    }
    if (result.summaryTable?.length) {
      nodes.push({ id: FN.uid('node'), text: '知识小结', level: 1, ts: null, star: false });
      for (const row of result.summaryTable) {
        nodes.push({
          id: FN.uid('node'),
          text: `${row.term}：${row.explain}`,
          level: 2,
          ts: null,
          star: false
        });
      }
    }
    return nodes;
  };

  Notes.buildTranscriptFromAI = function buildTranscriptFromAI(result) {
    const sections = result.sections || [];
    if (!sections.length) return [];
    const duration = Number(state.videoMeta?.duration) || Number(state.note?.duration) || 0;
    const count = sections.length;
    return sections.map((section, index) => {
      const start =
        section.ts != null && Number.isFinite(Number(section.ts))
          ? Number(section.ts)
          : duration
            ? (duration * index) / count
            : index * 8;
      const text = [section.heading, ...(section.points || [])].filter(Boolean).join('。');
      return {
        id: FN.uid('seg'),
        start,
        end: start + Math.max(4, (duration ? duration / count : 8) - 0.5),
        text,
        source: 'ai'
      };
    });
  };

  /* ------------------------------------------------------------------------
   * 导出用 HTML -> Markdown
   * ---------------------------------------------------------------------- */

  Notes.htmlToMarkdown = function htmlToMarkdown(html) {
    const container = document.createElement('div');
    container.innerHTML = FN.sanitizeHtml(html || '');
    const lines = [];
    const walk = (node, listDepth = 0) => {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent.trim();
          if (text) lines.push(text);
          continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        const tag = child.tagName;
        if (tag === 'H1') lines.push(`\n# ${child.textContent.trim()}\n`);
        else if (tag === 'H2') lines.push(`\n## ${child.textContent.trim()}\n`);
        else if (tag === 'H3') lines.push(`\n### ${child.textContent.trim()}\n`);
        else if (tag === 'P') {
          const text = child.textContent.trim();
          if (text) lines.push(`\n${text}\n`);
        } else if (tag === 'BLOCKQUOTE') {
          lines.push(`\n> ${child.textContent.trim().replace(/\n/g, '\n> ')}\n`);
        } else if (tag === 'UL' || tag === 'OL') {
          [...child.children].forEach((li, index) => {
            lines.push(`${'  '.repeat(listDepth)}- ${tag === 'OL' ? `${index + 1}. ` : ''}${li.textContent.trim()}`);
          });
        } else if (tag === 'FIGURE') {
          const img = child.querySelector('img');
          const caption = child.querySelector('figcaption')?.textContent.trim() || '';
          if (img?.src) lines.push(`\n![${caption || '视频截图'}](${img.src})\n`);
        } else if (tag === 'TABLE') {
          const rows = [...child.querySelectorAll('tr')];
          rows.forEach((row) => {
            const cells = [...row.querySelectorAll('th,td')].map((cell) => cell.textContent.trim());
            lines.push(`| ${cells.join(' | ')} |`);
            if (row === rows[0]) lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
          });
          lines.push('');
        } else if (tag === 'HR') {
          lines.push('\n---\n');
        } else {
          walk(child, listDepth);
        }
      }
    };
    walk(container);
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  App.Notes = Notes;
  FN.Notes = Notes;
})();
