/* 帧记 · 应用核心 */
(() => {
  const FN = globalThis.FN;
  const App = (FN.App = {
    state: {
      ready: false,
      settings: null,
      note: null,
      noteKey: '',
      videoMeta: null,
      videoState: { found: false, time: 0, duration: 0, paused: true, rate: 1 },
      view: 'notes',
      template: 'rich',
      panelOpen: false,
      panelFloating: false,
      dirty: false,
      saving: false,
      pendingSave: false,
      saveError: '',
      lastSavedAt: null,
      loadToken: 0,
      mapSource: 'ai',
      mapZoom: 1,
      mapTree: null,
      mapBuilt: null,
      chatBusy: false,
      recording: null,
      recordingTimer: null,
      autoAudio: null,
      transcriptQuery: '',
      activeSegmentId: null,
      lastAutoSnapshot: 0,
      transcriptScrollLockUntil: 0,
      aiBusy: false,
      welcomeShown: false
    },
    els: {},
    tracker: null
  });

  const state = App.state;
  let saveTimer = null;
  let videoSwitchTimer = null;
  let savePromise = Promise.resolve();
  let lastSaveStatus = '';

  App.el = (name) =>
    App.els[name] || FN.UI.root?.querySelector(`[data-el="${name}"]`) || null;
  const el = (name) => App.el(name);

  /* ------------------------------------------------------------------------
   * 启动
   * ---------------------------------------------------------------------- */

  App.init = async function init() {
    if (window.__FRAMENOTE_READY__) return;
    window.__FRAMENOTE_READY__ = true;
    if (window.top !== window) return;

    try {
      state.settings = await FN.Store.getSettings();
      const mounted = await FN.UI.mount();
      App.els = mounted.els;
      FN.UI.setTheme(state.settings.theme || 'auto');
      FN.UI.setAccent(state.settings.accent || 'lime');
      FN.UI.setWidth(state.settings.uiWidth || 442);
      FN.UI.setFabPosition(state.settings.fabRight ?? 22, state.settings.fabBottom ?? 24);
      App.applyPanelLayout();
      App.bindChromeMessages();
      App.Actions.bind();
      App.initTracker();
      App.applyTheme();
      App.renderAll();
      state.ready = true;
      App.setSaveState('saved', '本地自动保存');
      if (!state.settings.onboarded) {
        setTimeout(() => App.Dialogs.maybeWelcome(), 700);
      }
    } catch (error) {
      console.error('[帧记] 初始化失败', error);
      try {
        FN.UI.toast(`帧记初始化失败：${error?.message || error}`, 'error', 6000);
      } catch (_) {
        /* shadow UI 也可能没挂载 */
      }
    }
  };

  App.initTracker = function initTracker() {
    const tracker = new FN.VideoTracker();
    App.tracker = tracker;
    tracker.beforeFallbackCapture = async () => {
      const host = FN.UI.host;
      if (!host) return () => {};
      const previous = host.style.visibility;
      host.style.visibility = 'hidden';
      await FN.sleep(90);
      return () => {
        host.style.visibility = previous || '';
      };
    };

    tracker.on('change', (meta) => App.onVideoChanged(meta));
    tracker.on('time', (payload) => {
      state.videoState = payload;
      if (payload?.meta && !state.videoMeta) state.videoMeta = payload.meta;
      App.updateVideoUI();
      App.syncPlaybackHighlights(payload?.time || 0);
    });
    tracker.on('play', () => {
      state.videoState = tracker.getState();
      App.updateVideoUI();
      if (
        state.settings?.autoAudio &&
        state.settings.sttModel &&
        FN.AI.isConfigured(state.settings) &&
        state.panelOpen &&
        state.note &&
        !state.recording
      ) {
        App.Notes.resumeAutoAudio();
      }
    });
    tracker.on('pause', ({ suppressed } = {}) => {
      state.videoState = tracker.getState();
      App.updateVideoUI();
      if (state.recording) App.Notes.stopRecording('视频暂停，已停止录音');
      if (!suppressed && App.Notes.autoAudioActive?.()) App.Notes.pauseAutoAudio();
      if (!suppressed) App.Notes.maybeAutoSnapshot();
    });
    tracker.on('ended', () => {
      if (state.recording) App.Notes.stopRecording('视频播放结束，已停止录音');
      if (App.Notes.autoAudioActive?.()) {
        App.Notes.stopAutoAudio({ summarize: state.settings.autoAudioSummary !== false });
      }
    });
    tracker.on('seek', ({ time }) => {
      state.videoState = tracker.getState();
      App.updateVideoUI();
      App.syncPlaybackHighlights(time);
      if (App.Notes.autoAudioActive?.()) App.Notes.onAutoAudioSeek(time);
    });
    tracker.start();
  };

  /* ------------------------------------------------------------------------
   * 面板
   * ---------------------------------------------------------------------- */

  App.openPanel = async function openPanel(options = {}) {
    if (!state.ready) return;
    FN.UI.setDismissed(false);
    // 面板关闭时会从 DOM 移除，先重新挂载再应用浮动几何。
    FN.UI.setOpen(true);
    App.applyPanelLayout();
    state.panelOpen = true;
    App.applyDocking();
    if (!state.note) {
      await App.loadForCurrent({ switchView: true });
    }
    App.renderAll();
    App.applyDocking();
    if (options.focusEditor) {
      setTimeout(() => el('editor')?.focus(), 120);
    }
    if (!state.settings.onboarded && !state.welcomeShown) {
      setTimeout(() => App.Dialogs.maybeWelcome(), 320);
    }
    if (
      state.settings.autoAudio &&
      state.settings.sttModel &&
      FN.AI.isConfigured(state.settings) &&
      App.tracker?.video &&
      !App.tracker.video.paused
    ) {
      setTimeout(() => {
        if (!App.Notes.autoAudioActive()) App.Notes.startAutoAudio({ fromSettings: true });
      }, 450);
    }
  };

  App.closePanel = function closePanel(options = {}) {
    if (state.recording) App.Notes.stopRecording('面板已收起');
    if (App.Notes?.autoAudioActive?.()) App.Notes.stopAutoAudio({ summarize: false, silent: true });
    App.persistSoon();
    state.panelOpen = false;
    FN.UI.setOpen(false);
    App.applyDocking();
    if (FN.UI.hasModal) FN.UI.closeModal();
    if (options.dismiss) FN.UI.setDismissed(true);
  };

  App.applyDocking = function applyDocking() {
    const hasVideo = !!App.tracker?.video;
    const enabled = state.panelOpen && !!state.settings?.dockPage && hasVideo;
    const panel = FN.UI.root?.querySelector('.fn-panel');
    const width = state.settings?.uiWidth || 442;
    let reserved = null;
    if (state.panelFloating && panel) {
      const rect = panel.getBoundingClientRect();
      if (rect.width > 0 && rect.left > 0) {
        reserved = Math.max(
          380,
          Math.min(window.innerWidth - 120, window.innerWidth - rect.left + 12)
        );
      }
    }
    FN.UI.applyPageDock(enabled, width, reserved);
  };

  App.applyPanelLayout = function applyPanelLayout() {
    state.panelFloating = !!state.settings?.panelFloating;
    if (state.panelFloating) {
      FN.UI.applyPanelGeometry({
        floating: true,
        left: state.settings.panelLeft,
        top: state.settings.panelTop,
        width: state.settings.panelWidth || state.settings.uiWidth || 442,
        height: state.settings.panelHeight
      });
    } else {
      FN.UI.applyPanelGeometry({ floating: false });
    }
  };

  App.persistPanelGeometry = function persistPanelGeometry() {
    const panel = FN.UI.root?.querySelector('.fn-panel');
    if (!panel || !state.panelFloating) return;
    const rect = panel.getBoundingClientRect();
    const geometry = {
      panelFloating: true,
      panelLeft: Math.round(rect.left),
      panelTop: Math.round(rect.top),
      panelWidth: Math.round(rect.width),
      panelHeight: Math.round(rect.height)
    };
    Object.assign(state.settings, geometry);
    FN.Store.saveSettings(geometry);
  };

  App.setPanelFloating = function setPanelFloating(floating) {
    const panel = FN.UI.root?.querySelector('.fn-panel');
    if (!panel) return;
    if (floating) {
      const rect = panel.getBoundingClientRect();
      state.panelFloating = true;
      Object.assign(state.settings, {
        panelFloating: true,
        panelLeft: Math.round(rect.left),
        panelTop: Math.round(rect.top),
        panelWidth: Math.round(rect.width),
        panelHeight: Math.round(rect.height)
      });
      FN.UI.applyPanelGeometry({
        floating: true,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
    } else {
      state.panelFloating = false;
      state.settings.panelFloating = false;
      FN.UI.applyPanelGeometry({ floating: false });
    }
    FN.Store.saveSettings({
      panelFloating: state.panelFloating,
      panelLeft: state.settings.panelLeft,
      panelTop: state.settings.panelTop,
      panelWidth: state.settings.panelWidth,
      panelHeight: state.settings.panelHeight
    });
    App.applyDocking();
  };

  App.togglePanel = async function togglePanel() {
    if (FN.UI.root?.classList.contains('is-open')) App.closePanel();
    else await App.openPanel();
  };

  App.applyTheme = function applyTheme() {
    FN.UI.setTheme(state.settings?.theme || 'auto');
    if (!App._themeMediaBound && window.matchMedia) {
      App._themeMediaBound = true;
      matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
        if ((state.settings?.theme || 'auto') === 'auto') FN.UI.setTheme('auto');
      });
    }
  };

  /* ------------------------------------------------------------------------
   * 视频
   * ---------------------------------------------------------------------- */

  App.pageMeta = function pageMeta() {
    let key = `page:${location.href.split('#')[0]}`;
    try {
      const url = new URL(location.href);
      url.hash = '';
      for (const name of ['utm_source', 'utm_medium', 'utm_campaign', 'spm_id_from', 'from', 'vd_source']) {
        url.searchParams.delete(name);
      }
      key = `page:${url.toString()}`;
    } catch (_) {
      /* ignore */
    }
    return {
      key,
      url: location.href,
      title: FN.cleanText(document.title) || '网页笔记',
      site: FN.hostLabel(location.hostname),
      duration: 0,
      currentTime: 0,
      paused: true,
      playbackRate: 1
    };
  };

  App.currentMeta = function currentMeta() {
    return App.tracker?.meta || state.videoMeta || App.pageMeta();
  };

  App.onVideoChanged = function onVideoChanged(meta) {
    state.videoMeta = meta;
    state.videoState = App.tracker.getState();
    if (
      meta &&
      state.note &&
      state.note.key === meta.key &&
      Number(meta.duration) > 0 &&
      Math.abs((Number(state.note.duration) || 0) - Number(meta.duration)) > 0.5
    ) {
      state.note.duration = Number(meta.duration);
      App.persistSoon();
    }
    App.updateVideoUI();
    App.applyDocking();
    if (App.Notes?.autoAudioActive?.() && state.autoAudio?.videoKey !== (meta?.key || '')) {
      App.Notes.stopAutoAudio({ summarize: false, silent: true });
    }
    if (!state.panelOpen) return;

    const targetKey = (meta || App.pageMeta()).key;
    if (targetKey === state.noteKey) return;
    clearTimeout(videoSwitchTimer);
    videoSwitchTimer = setTimeout(async () => {
      if (!state.panelOpen) return;
      if (state.note && state.dirty) await App.persistNow();
      await App.loadForCurrent({ switchView: true });
    }, 300);
  };

  App.updateVideoUI = function updateVideoUI() {
    if (!el('videoStrip')) return;
    const meta = state.videoMeta || App.tracker?.meta;
    const st = state.videoState || App.tracker?.getState() || {};
    const found = !!(meta && App.tracker?.video);
    const strip = el('videoStrip');
    strip.classList.toggle('is-empty', !found);
    FN.UI.root?.classList.toggle('has-video', found);

    if (found) {
      const displayDuration =
        Number(st.duration) || Number(meta.duration) || Number(state.note?.duration) || 0;
      el('videoTitle').textContent = meta.title || '网页视频';
      el('videoTitle').title = meta.title || '';
      el('videoSite').textContent = meta.site || FN.hostLabel(location.hostname);
      el('videoDuration').textContent =
        displayDuration > 0 ? FN.fmtTime(displayDuration) : '时长未知';
      el('videoBadge').classList.remove('is-empty');
      el('videoBadge').textContent = (meta.site || '视').slice(0, 1);
      el('videoDot').classList.remove('is-empty');
    } else {
      el('videoTitle').textContent = '未检测到视频';
      el('videoTitle').title = '';
      el('videoSite').textContent = '也可以先记录普通网页笔记';
      el('videoDuration').textContent = '--:--';
      el('videoBadge').classList.add('is-empty');
      el('videoBadge').innerHTML = FN.icon('play', 13);
      el('videoDot').classList.add('is-empty');
    }

    const time = Number(st.time) || 0;
    const duration = Number(st.duration) || Number(meta?.duration) || 0;
    const pct = duration > 0 ? Math.max(0, Math.min(100, (time / duration) * 100)) : 0;
    el('currentTime').textContent = FN.fmtTime(time);
    el('duration').textContent = duration > 0 ? FN.fmtTime(duration) : '--:--';
    if (el('liveTime')) el('liveTime').textContent = FN.fmtTime(time);
    el('played').style.width = `${pct}%`;
    el('knob').style.left = `${pct}%`;
    const buffered = Number(st.buffered) || 0;
    el('buffered').style.width = duration > 0 ? `${Math.min(100, (buffered / duration) * 100)}%` : '0%';
    el('speed').textContent = `${(Number(st.rate) || 1).toFixed(2).replace(/0$/, '')}×`;
    el('play').innerHTML = FN.icon(st.paused === false ? 'pause' : 'play', 15);
    el('progress').setAttribute('aria-valuenow', String(Math.round(pct)));
    el('videoDot').classList.toggle('is-paused', !!st.paused);
  };

  App.syncPlaybackHighlights = function syncPlaybackHighlights(time) {
    const now = Date.now();
    if (now - (App._lastHighlight || 0) < 550) return;
    App._lastHighlight = now;
    for (const node of FN.UI.root.querySelectorAll('.fn-ts[data-ts]')) {
      const ts = Number(node.dataset.ts);
      node.classList.toggle('is-active', Number.isFinite(ts) && Math.abs(ts - time) < 1.1);
    }
    App.Notes?.syncTranscript(time);
  };

  App.seek = function seek(seconds, options = {}) {
    if (!App.tracker?.video) {
      App.toast('当前页面没有可跳转的视频', 'error');
      return false;
    }
    return App.tracker.seekTo(seconds, options);
  };

  /* ------------------------------------------------------------------------
   * 笔记加载 / 保存
   * ---------------------------------------------------------------------- */

  App.loadForCurrent = async function loadForCurrent(options = {}) {
    const meta = App.currentMeta();
    if (!meta) return;
    const token = ++state.loadToken;
    App.setSaveState('saving', '正在载入笔记…');
    let note;
    try {
      note = await FN.Store.loadNote(meta);
    } catch (error) {
      App.setSaveState('error', '笔记载入失败');
      App.toast(`载入笔记失败：${error?.message || error}`, 'error', 5000);
      return;
    }
    if (token !== state.loadToken) return;
    state.note = note;
    state.noteKey = meta.key;
    state.dirty = false;
    state.transcriptQuery = '';
    state.activeSegmentId = null;
    state.mapZoom = 1;
    const isEmptyNote =
      !note.richHtml &&
      !(note.outline || []).length &&
      !(note.transcript || []).length &&
      !note.summary &&
      !note.mindmap &&
      !(note.quiz?.questions || []).length;
    if (isEmptyNote && ['rich', 'outline', 'transcript'].includes(state.settings.defaultTemplate)) {
      note.template = state.settings.defaultTemplate;
    }
    state.template = ['rich', 'outline', 'transcript'].includes(note.template)
      ? note.template
      : state.settings.defaultTemplate || 'rich';
    note.template = state.template;
    if (options.switchView !== false) state.view = 'notes';
    if (note.mindmap) state.mapSource = 'ai';
    else if (note.outline.length) state.mapSource = 'outline';
    else if (note.summary) state.mapSource = 'summary';
    if (note.quiz?.questions?.length && [3, 5, 8, 10].includes(note.quiz.questions.length)) {
      state.quizCount = note.quiz.questions.length;
    }
    if (!note.title) note.title = meta.title;
    App.renderAll();
    App.setSaveState('saved', '已载入 · 自动保存');
  };

  App.persistSoon = function persistSoon(delay = 550) {
    if (!state.note) return;
    state.dirty = true;
    App.setSaveState('saving', '正在保存…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      App.persistNow();
    }, delay);
  };

  App.persistNow = function persistNow() {
    clearTimeout(saveTimer);
    if (!state.note) return Promise.resolve();
    if (state.saving) {
      state.pendingSave = true;
      return savePromise;
    }
    state.saving = true;
    state.pendingSave = false;
    App.setSaveState('saving', '正在保存…');
    savePromise = FN.Store.saveNote(state.note)
      .then(() => {
        state.dirty = false;
        state.saveError = '';
        state.lastSavedAt = new Date();
        App.setSaveState('saved', `已保存 ${FN.fmtClock(state.lastSavedAt).slice(11)}`);
        App.Notes?.renderNoteMeta();
      })
      .catch((error) => {
        console.warn('[帧记] 保存失败', error);
        state.saveError = error?.message || String(error);
        App.setSaveState('error', '保存失败');
        App.toast(
          `保存失败：${state.saveError}。图片较多时请尝试删除部分截图。`,
          'error',
          6000
        );
      })
      .finally(() => {
        state.saving = false;
        if (state.pendingSave) {
          state.pendingSave = false;
          setTimeout(() => App.persistNow(), 60);
        }
      });
    return savePromise;
  };

  App.setSaveState = function setSaveState(kind, text) {
    const node = el('saveState');
    if (!node) return;
    if (lastSaveStatus === `${kind}:${text}`) return;
    lastSaveStatus = `${kind}:${text}`;
    node.classList.toggle('is-saving', kind === 'saving');
    node.classList.remove('is-error');
    if (kind === 'error') node.classList.add('is-error');
    const textNode = el('saveText');
    if (textNode) textNode.textContent = text;
  };

  App.noteHasContent = function noteHasContent(note = state.note) {
    if (!note) return false;
    return !!(
      FN.stripHtml(note.richHtml || '') ||
      (note.outline || []).some((node) => String(node.text || '').trim()) ||
      (note.transcript || []).length ||
      note.summary ||
      note.mindmap ||
      (note.quiz?.questions || []).length ||
      (note.chat || []).length
    );
  };

  /* ------------------------------------------------------------------------
   * 总渲染
   * ---------------------------------------------------------------------- */

  App.renderAll = function renderAll() {
    if (!state.note) {
      App.updateVideoUI();
      return;
    }
    state.note.template = state.template;
    App.renderVideo();
    App.Notes.renderAIBanner();
    App.Notes.renderHeader();
    App.Notes.applyTemplate();
    App.Notes.render();
    App.Insights.renderSummary();
    App.Insights.renderMap();
    App.Insights.renderQuiz();
    App.Insights.renderChat();
    App.applyView();
  };

  App.renderVideo = function renderVideo() {
    App.updateVideoUI();
  };

  App.applyView = function applyView() {
    const view = state.view || 'notes';
    for (const tab of App.els.tabs || []) {
      tab.classList.toggle('is-active', tab.dataset.view === view);
    }
    for (const panel of App.els.views || []) {
      panel.classList.toggle('is-active', panel.dataset.panel === view);
    }
    el('scroll')?.classList.toggle('is-chat', view === 'chat');
    if (view === 'chat') {
      el('scroll').scrollTop = 0;
      setTimeout(() => App.Insights.scrollChatToBottom(), 40);
    }
  };

  App.setView = function setView(view) {
    if (!['notes', 'summary', 'map', 'quiz', 'chat'].includes(view)) return;
    state.view = view;
    App.applyView();
    if (view === 'summary') App.Insights.renderSummary();
    if (view === 'map') App.Insights.renderMap();
    if (view === 'quiz') App.Insights.renderQuiz();
    if (view === 'chat') {
      App.Insights.renderChat();
      setTimeout(() => App.Insights.scrollChatToBottom(), 40);
    }
    if (view === 'notes') App.Notes.render();
  };

  App.setTemplate = function setTemplate(template) {
    if (!state.note || !['rich', 'outline', 'transcript'].includes(template)) return;
    if (state.template === template) return;
    App.Notes.syncRichToNote();
    state.template = template;
    state.note.template = template;
    App.Notes.applyTemplate();
    App.Notes.render();
    App.persistSoon();
  };

  App.setMapSource = function setMapSource(source) {
    state.mapSource = source;
    state.mapZoom = 1;
    App.Insights.renderMap();
  };

  /* ------------------------------------------------------------------------
   * AI 上下文
   * ---------------------------------------------------------------------- */

  App.context = function context(options = {}) {
    return FN.AI.makeContext({
      note: state.note,
      state: {
        ...state.videoState,
        meta: App.tracker?.meta || state.videoMeta,
        duration: state.videoState.duration || state.videoMeta?.duration || state.note?.duration
      },
      transcript: options.transcript,
      maxChars: options.maxChars
    });
  };

  App.requireAI = function requireAI(options = {}) {
    if (FN.AI.isConfigured(state.settings)) return true;
    App.toast('先配置 AI 才能使用这个功能', 'error');
    App.Dialogs.settings({ firstTime: true });
    return false;
  };

  App.toast = function toast(message, type = 'info', timeout) {
    FN.UI.toast(message, type, timeout);
  };

  App.requireNote = function requireNote() {
    if (!state.note) {
      App.toast('笔记还没有载入，请稍后重试', 'error');
      return false;
    }
    return true;
  };

  /* ------------------------------------------------------------------------
   * Chrome 消息
   * ---------------------------------------------------------------------- */

  App.bindChromeMessages = function bindChromeMessages() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message) return;
      if (message.type === 'fn:ping') {
        sendResponse({ ok: true });
        return;
      }
      if (message.type === 'fn:toggle') {
        (async () => {
          const open = FN.UI.root?.classList.contains('is-open');
          if (message.mode === 'open') await App.openPanel();
          else if (open) App.closePanel();
          else await App.openPanel();
        })();
        sendResponse({ ok: true });
        return;
      }
      if (message.type === 'fn:quick-capture') {
        (async () => {
          await App.openPanel();
          await App.Notes.snapshot({ openOcr: false, source: 'shortcut' });
        })();
        sendResponse({ ok: true });
        return;
      }
      if (message.type === 'fn:ocr-progress') {
        App.Dialogs.updateOCRProgress(message);
      }
    });
  };

  /* ------------------------------------------------------------------------
   * 页面生命周期
   * ---------------------------------------------------------------------- */

  window.addEventListener('pagehide', () => {
    if (state.note && state.dirty) {
      FN.Store.saveNote(state.note).catch(() => {});
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && state.note && state.dirty) {
      App.persistNow();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const host = FN.UI.host;
    if (!host) return;
    if (document.fullscreenElement && !document.fullscreenElement.contains(host)) {
      try {
        document.fullscreenElement.appendChild(host);
      } catch (_) {
        /* video 元素自身全屏时无法挂载 */
      }
    } else if (!document.fullscreenElement) {
      document.documentElement.appendChild(host);
    }
    setTimeout(() => App.applyDocking(), 80);
  });

  let dockResizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(dockResizeTimer);
    dockResizeTimer = setTimeout(() => App.applyDocking(), 180);
  });

  window.addEventListener('beforeunload', () => {
    if (App.Notes?.autoAudioActive?.()) {
      App.Notes.stopAutoAudio({ summarize: false, silent: true });
    }
  });
})();
