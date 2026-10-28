/* 帧记 · 交互绑定 */
(() => {
  const FN = globalThis.FN;
  const App = FN.App;
  const state = App.state;
  const Actions = (FN.Actions = {});

  const el = (name) => App.el(name);
  const root = () => FN.UI.root;

  async function handleAction(action, target, event) {
    switch (action) {
      case 'open':
        await App.openPanel();
        break;
      case 'close':
        App.closePanel({ dismiss: true });
        break;
      case 'collapse':
        App.closePanel();
        break;
      case 'library':
        FN.Dialogs.library();
        break;
      case 'settings':
        FN.Dialogs.settings();
        break;
      case 'open-settings':
        FN.Dialogs.settings({ firstTime: !FN.AI.isConfigured(state.settings) });
        break;
      case 'help':
        FN.Dialogs.help();
        break;
      case 'export':
        FN.Dialogs.exportPanel();
        break;

      case 'play':
        if (!App.tracker?.video) {
          App.toast('当前页面没有检测到视频', 'error');
          break;
        }
        try {
          await App.tracker.toggle();
        } catch (error) {
          App.toast(error?.message || '播放失败', 'error');
        }
        break;
      case 'rewind':
        App.tracker?.jump(-10);
        break;
      case 'forward':
        App.tracker?.jump(10);
        break;
      case 'speed':
        App.tracker?.cycleSpeed();
        break;
      case 'timestamp':
        if (!state.note) await App.openPanel();
        App.Notes.insertTimestamp();
        break;
      case 'snapshot':
        await App.Notes.snapshot();
        break;
      case 'ocr':
        await App.Notes.ocrCurrent();
        break;
      case 'speech':
        App.Dialogs.openSpeech();
        break;
      case 'dock-panel':
        App.setPanelFloating(false);
        App.toast('面板已停靠到右侧', 'success', 1800);
        break;
      case 'ai-generate':
        await App.Insights.generateNotes(state.template);
        break;

      case 'insert-ts':
        App.Notes.insertTimestamp();
        break;
      case 'editor-image':
        await App.Notes.snapshot();
        break;
      case 'editor-ocr':
        await App.Notes.ocrCurrent({ mode: 'insertBoth' });
        break;
      case 'editor-upload':
        el('imageFile')?.click();
        break;
      case 'editor-link':
        App.Notes.insertLink();
        break;
      case 'editor-clear':
        await App.Notes.clearRich();
        break;

      case 'outline-add':
        if (!state.note) break;
        App.Notes.addOutlineNode({ level: 1 });
        break;
      case 'outline-ai':
        await App.Insights.generateNotes('outline');
        break;
      case 'outline-map':
        App.Notes.outlineToMap();
        break;

      case 'extract-captions':
        await App.Notes.extractCaptions();
        break;
      case 'import-subtitle':
        el('subtitleFile')?.click();
        break;
      case 'transcribe-record':
        if (App.Notes.autoAudioActive?.()) {
          await App.Notes.stopAutoAudio({ summarize: false, silent: true });
        }
        await App.Notes.startRecording();
        break;
      case 'auto-audio':
        if (App.Notes.autoAudioActive()) {
          await App.Notes.stopAutoAudio({ summarize: true, disable: true });
        } else {
          await App.Notes.startAutoAudio();
        }
        break;
      case 'stop-recording':
        if (App.Notes.autoAudioActive?.()) {
          await App.Notes.stopAutoAudio({ summarize: true, disable: true });
        } else {
          App.Notes.stopRecording('手动停止');
        }
        break;
      case 'audio-summary':
        await App.Notes.summarizeAudioNow();
        break;
      case 'transcript-menu':
        App.Notes.transcriptMenu();
        break;
      case 'clear-transcript-search':
        state.transcriptQuery = '';
        App.Notes.renderTranscript();
        break;
      case 'segment-quote':
        App.Notes.quoteSegment(target.dataset.id);
        break;
      case 'segment-copy':
        await App.Notes.copySegment(target.dataset.id);
        break;

      case 'summary-generate':
        await App.Insights.generateSummary();
        break;
      case 'summary-to-map':
        state.mapSource = 'summary';
        App.setView('map');
        break;
      case 'summary-share':
        if (state.note) await FN.Dialogs.shareImage(state.note);
        break;

      case 'map-generate':
        await App.Insights.generateMap();
        break;
      case 'map-from-outline':
        state.mapSource = 'outline';
        App.setView('map');
        break;
      case 'map-from-summary':
        state.mapSource = 'summary';
        App.setView('map');
        break;
      case 'map-download':
        App.Insights.downloadMap();
        break;
      case 'map-fullscreen':
        App.Insights.openMapFullscreen();
        break;
      case 'map-zoom-in':
        App.Insights.applyMapZoom(state.mapZoom + 0.15);
        break;
      case 'map-zoom-out':
        App.Insights.applyMapZoom(state.mapZoom - 0.15);
        break;
      case 'map-zoom-fit':
        App.Insights.applyMapZoom(1, true);
        break;

      case 'quiz-generate':
        syncQuizConfig();
        await App.Insights.generateQuiz();
        break;
      case 'quiz-reset':
        App.Insights.resetQuiz();
        break;

      case 'chat-send':
        await App.Insights.sendChat();
        break;
      case 'chat-clear':
        await App.Insights.clearChat();
        break;

      case 'note-more':
        openNoteMenu();
        break;

      default:
        console.debug('[帧记] 未处理的动作', action);
    }
  }

  function syncQuizConfig() {
    const count = root()?.querySelector('[data-quiz-count]');
    const difficulty = root()?.querySelector('[data-quiz-difficulty]');
    if (count) state.quizCount = Number(count.value) || 5;
    if (difficulty) state.quizDifficulty = difficulty.value || 'medium';
  }

  function openNoteMenu() {
    if (!state.note) return;
    const handle = FN.UI.openModal({
      title: '笔记操作',
      icon: 'more',
      narrow: true,
      body: `
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="export">${FN.icon('download', 14)} 导出 / 分享这篇笔记</button>
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="copy">${FN.icon('copy', 14)} 复制分享文案</button>
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="share-image">${FN.icon('image', 14)} 生成分享长图</button>
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="summary">${FN.icon('eye', 14)} 生成 AI 速览</button>
          ${state.note.outline?.length ? `<button class="fn-btn" style="justify-content:flex-start" data-note-action="outline-map">${FN.icon('brain', 14)} 用大纲生成导图</button>` : ''}
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="auto-snapshot">${FN.icon('camera', 14)} AI 辅助截图 <span class="fn-chip ${state.settings.autoSnapshot ? 'is-primary' : ''}" style="margin-left:auto">${state.settings.autoSnapshot ? '已开启' : '已关闭'}</span></button>
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="auto-audio">${FN.icon('mic', 14)} 自动识别音频 <span class="fn-chip ${App.Notes.autoAudioActive?.() ? 'is-primary' : ''}" style="margin-left:auto">${App.Notes.autoAudioActive?.() ? '识别中' : '去开启'}</span></button>
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="audio-summary">${FN.icon('eye', 14)} 生成音频总结</button>
          ${state.note.history?.length ? `<button class="fn-btn" style="justify-content:flex-start" data-note-action="restore-ai">${FN.icon('refresh', 14)} 恢复 AI 生成前版本</button>` : ''}
          <div class="fn-divider" style="margin:4px 0"></div>
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="library">${FN.icon('library', 14)} 笔记库</button>
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="settings">${FN.icon('settings', 14)} 设置</button>
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="float">${FN.icon('grid', 14)} ${state.panelFloating ? '停靠右侧' : '浮动窗口'}</button>
          <button class="fn-btn" style="justify-content:flex-start" data-note-action="help">${FN.icon('help', 14)} 使用帮助</button>
          <div class="fn-divider" style="margin:4px 0"></div>
          <button class="fn-btn is-danger" style="justify-content:flex-start" data-note-action="clear">${FN.icon('trash', 14)} 清空当前模板内容</button>
          <button class="fn-btn is-danger" style="justify-content:flex-start" data-note-action="delete">${FN.icon('trash', 14)} 删除这篇笔记</button>
        </div>`,
      onMount: (modal) => {
        modal.querySelectorAll('[data-note-action]').forEach((button) => {
          button.addEventListener('click', async () => {
            const action = button.dataset.noteAction;
            handle.close();
            if (action === 'export') FN.Dialogs.exportPanel();
            if (action === 'copy') {
              await FN.copy(FN.Dialogs.shareText(state.note));
              App.toast('分享文案已复制', 'success');
            }
            if (action === 'share-image') await FN.Dialogs.shareImage(state.note);
            if (action === 'summary') await App.Insights.generateSummary();
            if (action === 'outline-map') {
              state.mapSource = 'outline';
              App.setView('map');
            }
            if (action === 'auto-snapshot') {
              state.settings = await FN.Store.saveSettings({
                autoSnapshot: !state.settings.autoSnapshot
              });
              App.toast(state.settings.autoSnapshot ? 'AI 辅助截图已开启' : 'AI 辅助截图已关闭');
            }
            if (action === 'auto-audio') {
              if (App.Notes.autoAudioActive()) {
                await App.Notes.stopAutoAudio({ summarize: true, disable: true });
              } else {
                await App.Notes.startAutoAudio();
              }
            }
            if (action === 'audio-summary') {
              await App.Notes.summarizeAudioNow();
            }
            if (action === 'restore-ai') {
              App.Insights.restoreLastAI();
            }
            if (action === 'library') FN.Dialogs.library();
            if (action === 'settings') FN.Dialogs.settings();
            if (action === 'help') FN.Dialogs.help();
            if (action === 'float') {
              App.setPanelFloating(!state.panelFloating);
              App.toast(state.panelFloating ? '已切换浮动窗口，可拖动标题栏' : '已停靠到右侧', 'success', 2200);
            }
            if (action === 'clear') {
              if (state.template === 'rich') await App.Notes.clearRich();
              else if (state.template === 'outline') {
                const ok = await FN.UI.confirm({
                  title: '清空大纲？',
                  message: '所有大纲节点会被删除，图文与文稿不受影响。',
                  confirmText: '清空大纲',
                  danger: true
                });
                if (ok) {
                  state.note.outline = [];
                  App.Notes.renderOutline();
                  App.Notes.renderNoteMeta();
                  App.persistSoon();
                }
              } else {
                await App.Notes.clearTranscript();
              }
            }
            if (action === 'delete') {
              const ok = await FN.UI.confirm({
                title: '删除这篇笔记？',
                message: `「${FN.escapeHtml(state.note.title || '未命名视频')}」的所有内容会从本机删除，且无法恢复。`,
                confirmText: '删除笔记',
                danger: true
              });
              if (!ok) return;
              await FN.Store.deleteNote(state.note.key);
              state.note = null;
              state.noteKey = '';
              await App.loadForCurrent();
              App.toast('笔记已删除');
            }
          });
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
   * 点击
   * ---------------------------------------------------------------------- */

  async function onClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    // 时间戳优先级最高：无论在编辑器还是卡片里，都跳转视频
    const tsEl = target.closest('[data-ts]');
    if (tsEl && !target.closest('[data-outline-act]')) {
      event.preventDefault();
      event.stopPropagation();
      const ts = Number(tsEl.dataset.ts);
      if (Number.isFinite(ts)) App.seek(ts);
      return;
    }

    const actionEl = target.closest('[data-act]');
    if (actionEl) {
      event.preventDefault();
      event.stopPropagation();
      try {
        await handleAction(actionEl.dataset.act, actionEl, event);
      } catch (error) {
        console.error('[帧记] 操作失败', error);
        App.toast(error?.message || '操作失败', 'error');
      }
      return;
    }

    const viewEl = target.closest('[data-view]');
    if (viewEl) {
      App.setView(viewEl.dataset.view);
      return;
    }

    const templateEl = target.closest('[data-template]');
    if (templateEl) {
      App.setTemplate(templateEl.dataset.template);
      return;
    }

    const cmdEl = target.closest('[data-cmd]');
    if (cmdEl) {
      event.preventDefault();
      App.Notes.runEditorCommand(cmdEl.dataset.cmd);
      return;
    }

    const mapSource = target.closest('[data-map-source]');
    if (mapSource) {
      App.setMapSource(mapSource.dataset.mapSource);
      return;
    }

    const outlineAct = target.closest('[data-outline-act]');
    if (outlineAct) {
      event.preventDefault();
      const id = outlineAct.dataset.id;
      const act = outlineAct.dataset.outlineAct;
      const node = state.note?.outline.find((item) => item.id === id);
      if (!node) return;
      if (act === 'star') {
        node.star = !node.star;
        App.Notes.renderOutline();
        App.persistSoon();
      } else if (act === 'ts') {
        node.ts = Number(App.tracker?.video?.currentTime) || 0;
        App.Notes.renderOutline();
        App.persistSoon();
        App.toast(`已绑定 ${FN.fmtTime(node.ts)}`, 'success', 1600);
      } else if (act === 'child') {
        App.Notes.addOutlineNode({
          afterId: id,
          level: Math.min(5, (Number(node.level) || 1) + 1),
          focus: true
        });
      } else if (act === 'delete') {
        App.Notes.removeOutlineNode(id);
      }
      return;
    }

    const quizOption = target.closest('[data-quiz-answer]');
    if (quizOption) {
      const card = quizOption.closest('[data-qid]');
      if (card) App.Insights.answerQuiz(card.dataset.qid, Number(quizOption.dataset.quizAnswer));
      return;
    }

    const suggestion = target.closest('[data-chat-suggest]');
    if (suggestion) {
      App.Insights.sendChat(suggestion.dataset.chatSuggest);
      return;
    }
  }

  /* ------------------------------------------------------------------------
   * 输入
   * ---------------------------------------------------------------------- */

  function autoGrow(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(110, Math.max(24, textarea.scrollHeight))}px`;
  }

  function onInput(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest('.fn-editor')) {
      App.Notes.syncRichToNote();
      App.persistSoon();
      return;
    }
    if (target === el('noteTitle')) {
      if (state.note) {
        state.note.title = target.value;
        App.persistSoon();
      }
      return;
    }
    if (target.matches('[data-outline-text]')) {
      App.Notes.bindOutlineText(target);
      return;
    }
    if (target.matches('[data-seg-text]')) {
      App.Notes.bindTranscriptText(target);
      return;
    }
    if (target === el('transcriptSearch')) {
      App.Notes.filterTranscript(target.value);
      return;
    }
    if (target === el('chatInput')) {
      autoGrow(target);
      return;
    }
    if (target === el('recordingTime')) return;
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target === el('followTranscript')) {
      FN.Store.saveSettings({ followTranscript: target.checked }).then((settings) => {
        state.settings = settings;
        App.toast(target.checked ? '文稿会跟随播放高亮' : '已关闭文稿跟随', 'info', 1600);
      });
      return;
    }
    if (target.matches('[data-el="autoAudioToggle"]')) {
      if (target.checked) {
        App.Notes.startAutoAudio().then((ok) => {
          if (!ok) target.checked = false;
        });
      } else {
        App.Notes.stopAutoAudio({ summarize: true, disable: true });
      }
      return;
    }
    if (target.matches('[data-quiz-count]')) {
      state.quizCount = Number(target.value) || 5;
      return;
    }
    if (target.matches('[data-quiz-difficulty]')) {
      state.quizDifficulty = target.value || 'medium';
      return;
    }
    if (target === el('subtitleFile')) {
      const file = target.files?.[0];
      target.value = '';
      if (file) App.Notes.importSubtitle(file);
      return;
    }
    if (target === el('imageFile')) {
      const file = target.files?.[0];
      target.value = '';
      if (file) uploadImage(file);
    }
  }

  async function uploadImage(file) {
    if (!file.type.startsWith('image/')) {
      App.toast('请选择图片文件', 'error');
      return;
    }
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
      App.Notes.insertHtml(
        App.Notes.figureHtml(
          { dataUrl: compressed, time: Number(App.tracker?.video?.currentTime) || 0 },
          { source: 'upload' }
        )
      );
      App.toast('图片已插入，并绑定当前时间', 'success');
    } catch (error) {
      App.toast(`图片插入失败：${error?.message || error}`, 'error');
    }
  }

  /* ------------------------------------------------------------------------
   * 键盘
   * ---------------------------------------------------------------------- */

  function onKeydown(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.matches('[data-outline-text]')) {
      App.Notes.handleOutlineKeydown(event, target.dataset.outlineText);
      return;
    }
    if (target === el('chatInput')) {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        App.Insights.sendChat();
      }
      return;
    }
    if (target.matches('[data-el="progress"]')) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        App.tracker?.jump(event.key === 'ArrowLeft' ? -5 : 5);
      }
    }
  }

  function onGlobalKeydown(event) {
    if (event.defaultPrevented) return;
    if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'n') {
      if (!state.panelOpen || FN.UI.hasModal) return;
      const active = document.activeElement;
      const insidePanel =
        active === FN.UI.host ||
        (active instanceof Node && FN.UI.root?.contains(active)) ||
        !!active?.closest?.('#framenote-host');
      if (!insidePanel) return;
      event.preventDefault();
      App.Notes.insertTimestamp();
      return;
    }
    if (event.key === 'Escape' && !FN.UI.hasModal && state.panelOpen) {
      App.closePanel();
    }
  }

  function onWheel(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-el="transcriptList"]')) {
      state.transcriptScrollLockUntil = Date.now() + 5000;
    }
    const stage = target.closest('[data-el="mapStage"]');
    if (stage && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      App.Insights.applyMapZoom((state.mapZoom || 1) + delta);
    }
  }

  /* ------------------------------------------------------------------------
   * 粘贴
   * ---------------------------------------------------------------------- */

  function onPaste(event) {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('.fn-editor')) return;
    const items = [...(event.clipboardData?.items || [])];
    if (items.some((item) => item.type.startsWith('image/'))) {
      App.Notes.handlePaste(event);
      return;
    }
    const html = event.clipboardData?.getData('text/html');
    if (html && /<(p|div|h[1-6]|ul|ol|table|strong|em|blockquote)\b/i.test(html)) {
      event.preventDefault();
      const clean = FN.sanitizeHtml(html);
      App.Notes.insertHtml(clean);
    }
  }

  /* ------------------------------------------------------------------------
   * 进度条 / 缩放
   * ---------------------------------------------------------------------- */

  function bindProgress() {
    const progress = el('progress');
    if (!progress) return;
    let scrubbing = false;
    const seekFromEvent = (event) => {
      const duration = Number(App.tracker?.video?.duration) || Number(state.videoMeta?.duration) || 0;
      if (!duration) return;
      const rect = progress.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      App.tracker?.seekTo(ratio * duration);
    };
    progress.addEventListener('pointerdown', (event) => {
      if (!App.tracker?.video) return;
      scrubbing = true;
      progress.setPointerCapture?.(event.pointerId);
      seekFromEvent(event);
      event.preventDefault();
    });
    progress.addEventListener('pointermove', (event) => {
      if (!scrubbing) return;
      seekFromEvent(event);
    });
    const stop = () => {
      scrubbing = false;
    };
    progress.addEventListener('pointerup', stop);
    progress.addEventListener('pointercancel', stop);
    progress.addEventListener('click', (event) => {
      if (!scrubbing) seekFromEvent(event);
    });
  }

  function bindPanelDrag() {
    const header = root()?.querySelector('.fn-header');
    if (!header || header.dataset.dragBound === '1') return;
    header.dataset.dragBound = '1';
    let dragging = false;
    let activated = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    header.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !state.panelOpen) return;
      if (event.target.closest('button, input, select, textarea, a, [contenteditable="true"]')) return;
      const panel = FN.UI.root?.querySelector('.fn-panel');
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      dragging = true;
      activated = false;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      header.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });

    header.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const panel = FN.UI.root?.querySelector('.fn-panel');
      if (!panel) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!activated) {
        if (Math.hypot(dx, dy) < 5) return;
        activated = true;
        if (!state.panelFloating) App.setPanelFloating(true);
        root()?.classList.add('is-panel-dragging');
      }
      const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
      const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
      const left = Math.max(8, Math.min(maxLeft, startLeft + dx));
      const top = Math.max(8, Math.min(maxTop, startTop + dy));
      panel.style.left = `${Math.round(left)}px`;
      panel.style.top = `${Math.round(top)}px`;
      event.preventDefault();
    });

    const finish = () => {
      if (!dragging) return;
      dragging = false;
      const wasActivated = activated;
      activated = false;
      root()?.classList.remove('is-panel-dragging');
      if (wasActivated) {
        App.persistPanelGeometry();
        App.applyDocking();
      }
    };
    header.addEventListener('pointerup', finish);
    header.addEventListener('pointercancel', finish);
    header.addEventListener('dblclick', (event) => {
      if (event.target.closest('button, input, select, textarea, a, [contenteditable="true"]')) return;
      App.setPanelFloating(!state.panelFloating);
      App.toast(state.panelFloating ? '已切换浮动窗口' : '面板已停靠到右侧', 'success', 1800);
    });
  }

  function bindResizeEdges() {
    const panel = root()?.querySelector('.fn-panel');
    if (!panel || panel.dataset.edgesBound === '1') return;
    panel.dataset.edgesBound = '1';
    const handles = [
      ['resizeE', 'e'],
      ['resizeS', 's'],
      ['resizeSE', 'se']
    ];
    for (const [name, edge] of handles) {
      const handle = root().querySelector(`[data-el="${name}"]`);
      if (!handle) continue;
      let dragging = false;
      let activated = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      handle.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = panel.getBoundingClientRect();
        dragging = true;
        activated = false;
        startX = event.clientX;
        startY = event.clientY;
        startWidth = rect.width;
        startHeight = rect.height;
        handle.setPointerCapture?.(event.pointerId);
      });
      handle.addEventListener('pointermove', (event) => {
        if (!dragging) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (!activated) {
          if (Math.hypot(dx, dy) < 4) return;
          activated = true;
          if (!state.panelFloating) App.setPanelFloating(true);
        }
        const maxWidth = Math.min(720, window.innerWidth - panel.getBoundingClientRect().left - 8);
        const maxHeight = Math.min(window.innerHeight - 24, window.innerHeight - panel.getBoundingClientRect().top - 8);
        if (edge === 'e' || edge === 'se') {
          const width = Math.max(360, Math.min(maxWidth, startWidth + dx));
          panel.style.width = `${Math.round(width)}px`;
        }
        if (edge === 's' || edge === 'se') {
          const height = Math.max(420, Math.min(maxHeight, startHeight + dy));
          panel.style.height = `${Math.round(height)}px`;
        }
        event.preventDefault();
      });
      const finish = () => {
        if (!dragging) return;
        dragging = false;
        const wasActivated = activated;
        activated = false;
        if (wasActivated) {
          App.persistPanelGeometry();
          App.applyDocking();
        }
      };
      handle.addEventListener('pointerup', finish);
      handle.addEventListener('pointercancel', finish);
    }
  }

  function bindFabDrag() {
    const fab = root()?.querySelector('.fn-fab');
    if (!fab || fab.dataset.dragBound === '1') return;
    fab.dataset.dragBound = '1';
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let startRight = 22;
    let startBottom = 24;

    fab.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const rect = fab.getBoundingClientRect();
      dragging = true;
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      startRight = Math.max(8, window.innerWidth - rect.right);
      startBottom = Math.max(8, window.innerHeight - rect.bottom);
      fab.setPointerCapture?.(event.pointerId);
    });

    fab.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      fab.classList.add('is-dragging');
      const size = fab.offsetWidth || 58;
      const maxRight = Math.max(8, window.innerWidth - size - 8);
      const maxBottom = Math.max(8, window.innerHeight - size - 8);
      const right = Math.max(8, Math.min(maxRight, startRight - dx));
      const bottom = Math.max(8, Math.min(maxBottom, startBottom - dy));
      fab.style.right = `${Math.round(right)}px`;
      fab.style.bottom = `${Math.round(bottom)}px`;
      event.preventDefault();
    });

    const finish = () => {
      if (!dragging) return;
      dragging = false;
      fab.classList.remove('is-dragging');
      if (!moved) return;
      fab.dataset.suppressClick = '1';
      setTimeout(() => delete fab.dataset.suppressClick, 360);
      const right = Math.round(parseFloat(fab.style.right) || 22);
      const bottom = Math.round(parseFloat(fab.style.bottom) || 24);
      state.settings.fabRight = right;
      state.settings.fabBottom = bottom;
      FN.Store.saveSettings({ fabRight: right, fabBottom: bottom });
    };
    fab.addEventListener('pointerup', finish);
    fab.addEventListener('pointercancel', finish);
    fab.addEventListener(
      'click',
      (event) => {
        if (fab.dataset.suppressClick === '1') {
          event.preventDefault();
          event.stopImmediatePropagation();
          delete fab.dataset.suppressClick;
        }
      },
      true
    );
  }

  function bindResize() {
    const handle = el('resize');
    if (!handle || handle.dataset.bound === '1') return;
    handle.dataset.bound = '1';
    const panel = root()?.querySelector('.fn-panel');
    let dragging = false;
    let previousUserSelect = '';
    let startRight = 0;
    let startWidth = 0;
    handle.addEventListener('pointerdown', (event) => {
      if (!panel) return;
      dragging = true;
      previousUserSelect = document.documentElement.style.userSelect;
      document.documentElement.style.userSelect = 'none';
      const rect = panel.getBoundingClientRect();
      startRight = rect.right;
      startWidth = rect.width;
      handle.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });
    const move = (event) => {
      if (!dragging || !panel) return;
      if (state.panelFloating) {
        const maxWidth = Math.min(720, window.innerWidth - 24);
        const width = Math.max(360, Math.min(maxWidth, startRight - event.clientX));
        panel.style.width = `${Math.round(width)}px`;
        panel.style.left = `${Math.round(Math.max(8, startRight - width))}px`;
      } else {
        const width = Math.max(360, Math.min(720, window.innerWidth - event.clientX - 12));
        FN.UI.setWidth(width);
      }
    };
    handle.addEventListener('pointermove', move);
    const stop = () => {
      if (!dragging) return;
      dragging = false;
      document.documentElement.style.userSelect = previousUserSelect;
      if (state.panelFloating) {
        App.persistPanelGeometry();
        App.applyDocking();
        return;
      }
      const width = parseInt(FN.UI.root?.style.getPropertyValue('--fn-width') || '442', 10);
      state.settings.uiWidth = width;
      FN.Store.saveSettings({ uiWidth: width });
      App.applyDocking();
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  /* ------------------------------------------------------------------------
   * 绑定
   * ---------------------------------------------------------------------- */

  Actions.bind = function bind() {
    const shadowRoot = FN.UI.root;
    if (!shadowRoot) return;
    shadowRoot.addEventListener('click', onClick);
    shadowRoot.addEventListener('input', onInput);
    shadowRoot.addEventListener('change', onChange);
    shadowRoot.addEventListener('keydown', onKeydown);
    shadowRoot.addEventListener('paste', onPaste);
    shadowRoot.addEventListener('wheel', onWheel, { passive: false });
    shadowRoot.addEventListener('mousedown', (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.fn-editor-toolbar')) {
        event.preventDefault();
      }
    });
    document.addEventListener('keydown', onGlobalKeydown, true);
    bindProgress();
    bindResize();
    bindResizeEdges();
    bindPanelDrag();
    bindFabDrag();
    window.addEventListener('resize', () => {
      FN.UI.setFabPosition(state.settings.fabRight ?? 22, state.settings.fabBottom ?? 24);
      if (state.panelFloating) {
        FN.UI.syncFloatingPanel();
        App.persistPanelGeometry();
      }
    });
    const chatInput = el('chatInput');
    if (chatInput) autoGrow(chatInput);
  };

  App.Actions = Actions;
  FN.Actions = Actions;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init(), { once: true });
  } else {
    App.init();
  }
})();
