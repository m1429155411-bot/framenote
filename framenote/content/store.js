/* 帧记 · 本地数据层 */
(() => {
  const FN = globalThis.FN;
  const NOTE_PREFIX = 'fn:note:';
  const INDEX_KEY = 'fn:index';
  const SETTINGS_KEY = 'fn:settings';

  const DEFAULT_SETTINGS = {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
    visionModel: '',
    sttModel: '',
    temperature: 0.35,
    theme: 'auto',
    accent: 'lime',
    defaultTemplate: 'rich',
    autoSnapshot: false,
    autoOcr: false,
    aiScreenshots: true,
    followTranscript: true,
    autoAudio: false,
    autoAudioSummary: true,
    dockPage: true,
    ocrEngine: 'auto',
    ocrLang: 'chi_sim+eng',
    screenshotQuality: 0.9,
    onboarded: false,
    uiWidth: 442,
    panelFloating: false,
    panelLeft: null,
    panelTop: 12,
    panelWidth: 442,
    panelHeight: null,
    fabRight: 22,
    fabBottom: 24
  };

  const noteStorageKey = (key) => `${NOTE_PREFIX}${encodeURIComponent(key)}`;

  let indexWriteQueue = Promise.resolve();

  function createNote(meta) {
    const now = new Date().toISOString();
    return {
      version: 1,
      id: FN.uid('note'),
      key: meta.key,
      url: meta.url,
      title: meta.title || '未命名视频',
      site: meta.site || '',
      duration: Number(meta.duration) || 0,
      createdAt: now,
      updatedAt: now,
      template: 'rich',
      richHtml: '',
      outline: [],
      transcript: [],
      transcriptSource: '',
      summary: null,
      ai: null,
      mindmap: null,
      quiz: null,
      chat: [],
      history: [],
      tags: [],
      stats: {}
    };
  }

  function normalizeNote(note, meta) {
    const base = createNote(meta);
    const merged = {
      ...base,
      ...note,
      key: meta.key,
      url: meta.url || note?.url || '',
      duration: Number(meta.duration) || Number(note?.duration) || 0,
      outline: Array.isArray(note?.outline) ? note.outline : [],
      transcript: Array.isArray(note?.transcript) ? note.transcript : [],
      chat: Array.isArray(note?.chat) ? note.chat : [],
      history: Array.isArray(note?.history) ? note.history.slice(-2) : [],
      tags: Array.isArray(note?.tags) ? note.tags : [],
      stats: note?.stats && typeof note.stats === 'object' ? note.stats : {}
    };
    if (!merged.title && meta.title) merged.title = meta.title;
    if (!merged.site && meta.site) merged.site = meta.site;
    if (!['rich', 'outline', 'transcript'].includes(merged.template)) merged.template = 'rich';
    return merged;
  }

  function noteMeta(note) {
    const textLength =
      FN.stripHtml(note.richHtml || '').length +
      note.outline.reduce((sum, node) => sum + String(node.text || '').length, 0) +
      note.transcript.reduce((sum, segment) => sum + String(segment.text || '').length, 0);
    const timestamps = new Set();
    for (const match of String(note.richHtml || '').matchAll(/data-ts="([^"]+)"/g)) {
      timestamps.add(match[1]);
    }
    for (const node of note.outline) if (node.ts != null) timestamps.add(String(node.ts));
    for (const segment of note.transcript) if (segment.start != null) timestamps.add(String(segment.start));
    const imageCount = (String(note.richHtml || '').match(/<img\b/gi) || []).length;
    return {
      key: note.key,
      id: note.id,
      title: note.title,
      site: note.site,
      url: note.url,
      duration: note.duration,
      template: note.template,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      textLength,
      words: textLength,
      images: imageCount,
      timestamps: timestamps.size,
      hasImage: imageCount > 0,
      hasSummary: !!note.summary,
      hasQuiz: Array.isArray(note.quiz?.questions) && note.quiz.questions.length > 0,
      hasMindmap: !!note.mindmap,
      transcriptCount: note.transcript.length,
      preview: FN.truncate(
        FN.stripHtml(note.richHtml || '') ||
          note.outline.map((node) => node.text).join(' ') ||
          note.transcript.map((segment) => segment.text).join(' '),
        90
      )
    };
  }

  async function readIndex() {
    const result = await chrome.storage.local.get(INDEX_KEY);
    const index = result?.[INDEX_KEY];
    return index && typeof index === 'object' ? index : {};
  }

  function writeIndex(mutator) {
    indexWriteQueue = indexWriteQueue
      .then(async () => {
        const index = await readIndex();
        mutator(index);
        await chrome.storage.local.set({ [INDEX_KEY]: index });
      })
      .catch((error) => {
        console.warn('[帧记] 索引写入失败', error);
      });
    return indexWriteQueue;
  }

  async function getSettings() {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...(result?.[SETTINGS_KEY] || {}) };
  }

  async function saveSettings(patch) {
    const current = await getSettings();
    const next = { ...current, ...patch };
    await chrome.storage.local.set({ [SETTINGS_KEY]: next });
    return next;
  }

  async function loadNote(meta) {
    const key = noteStorageKey(meta.key);
    const result = await chrome.storage.local.get(key);
    let note = result?.[key];
    if (!note) {
      note = createNote(meta);
    }
    // 视频信息变化时同步展示标题与站点，但不覆盖用户手动设置的标题
    if (meta.title && (!note.title || note.title === '未命名视频')) note.title = meta.title;
    if (meta.site) note.site = meta.site;
    if (meta.duration) note.duration = Number(meta.duration) || note.duration;
    note = normalizeNote(note, meta);
    await saveNote(note, { touch: false });
    return note;
  }

  async function saveNote(note, options = {}) {
    if (!note?.key) throw new Error('笔记缺少视频标识');
    if (options.touch !== false) note.updatedAt = new Date().toISOString();
    note.version = 1;
    note.stats = buildStats(note);
    const storageKey = noteStorageKey(note.key);
    await chrome.storage.local.set({ [storageKey]: note });
    await writeIndex((index) => {
      index[note.key] = noteMeta(note);
    });
    return note;
  }

  function buildStats(note) {
    let images = 0;
    let imageBytes = 0;
    for (const match of String(note.richHtml || '').matchAll(/<img[^>]+src="(data:image\/[^"]+)"/g)) {
      images += 1;
      imageBytes += FN.dataUrlBytes(match[1]);
    }
    const words = (
      FN.stripHtml(note.richHtml || '') +
      note.outline.map((node) => node.text).join('') +
      note.transcript.map((segment) => segment.text).join('')
    ).replace(/\s/g, '').length;
    const timestampSet = new Set();
    for (const match of String(note.richHtml || '').matchAll(/data-ts="([^"]+)"/g)) {
      timestampSet.add(match[1]);
    }
    for (const node of note.outline) if (node.ts != null) timestampSet.add(String(node.ts));
    for (const segment of note.transcript) if (segment.start != null) timestampSet.add(String(segment.start));
    return {
      words,
      images,
      imageBytes,
      timestamps: timestampSet.size,
      updatedAt: note.updatedAt
    };
  }

  async function listNotes() {
    const index = await readIndex();
    return Object.values(index)
      .filter((item) => item && item.key)
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  async function deleteNote(key) {
    await chrome.storage.local.remove(noteStorageKey(key));
    await writeIndex((index) => {
      delete index[key];
    });
  }

  async function exportAll() {
    const index = await readIndex();
    const keys = [
      INDEX_KEY,
      SETTINGS_KEY,
      ...Object.keys(index).map((key) => noteStorageKey(key))
    ];
    const result = await chrome.storage.local.get(keys);
    const settings = { ...(result[SETTINGS_KEY] || DEFAULT_SETTINGS), apiKey: '' };
    return {
      app: 'framenote',
      format: 1,
      exportedAt: new Date().toISOString(),
      settings,
      notes: Object.values(index)
        .map((meta) => result[noteStorageKey(meta.key)])
        .filter(Boolean)
    };
  }

  async function importAll(payload) {
    if (!payload || payload.app !== 'framenote' || !Array.isArray(payload.notes)) {
      throw new Error('这不是有效的帧记备份文件');
    }
    let imported = 0;
    for (const raw of payload.notes) {
      if (!raw?.key || typeof raw.key !== 'string') continue;
      const note = normalizeNote(raw, {
        key: raw.key,
        url: raw.url || '',
        title: raw.title || '未命名视频',
        site: raw.site || '',
        duration: raw.duration || 0
      });
      note.updatedAt = new Date().toISOString();
      await saveNote(note, { touch: false });
      imported += 1;
    }
    if (payload.settings && typeof payload.settings === 'object') {
      const current = await getSettings();
      const { apiKey: _ignored, ...safeSettings } = payload.settings;
      await saveSettings({ ...safeSettings, apiKey: current.apiKey });
    }
    return imported;
  }

  async function storageUsage() {
    if (!chrome.storage?.local?.getBytesInUse) return null;
    try {
      return await chrome.storage.local.getBytesInUse(null);
    } catch (_) {
      return null;
    }
  }

  async function clearAllNotes() {
    const index = await readIndex();
    const keys = Object.keys(index).map((key) => noteStorageKey(key));
    if (keys.length) await chrome.storage.local.remove(keys);
    await chrome.storage.local.set({ [INDEX_KEY]: {} });
  }

  FN.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  FN.Store = {
    DEFAULT_SETTINGS,
    createNote,
    normalizeNote,
    noteMeta,
    getSettings,
    saveSettings,
    loadNote,
    saveNote,
    listNotes,
    deleteNote,
    exportAll,
    importAll,
    storageUsage,
    clearAllNotes
  };
})();
