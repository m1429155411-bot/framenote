/* 帧记 · AI 视频笔记 — service worker
 * 负责：扩展入口、右键菜单、跨域抓图、下载、AI 中转、离屏 OCR。
 */

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

const CONTENT_FILES = [
  'content/util.js',
  'content/store.js',
  'content/video.js',
  'content/mindmap.js',
  'content/ai.js',
  'content/styles.js',
  'content/ui.js',
  'content/app.js',
  'content/notes.js',
  'content/insights.js',
  'content/dialogs.js',
  'content/actions.js'
];

const CONTEXT_MENU_ID = 'framenote-capture';
const AI_ABORTS = new Map();

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get('fn:settings');
  if (!current['fn:settings']) {
    await chrome.storage.local.set({ 'fn:settings': { ...DEFAULT_SETTINGS } });
  } else {
    await chrome.storage.local.set({
      'fn:settings': { ...DEFAULT_SETTINGS, ...current['fn:settings'] }
    });
  }

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: '用帧记截取此画面',
      contexts: ['video', 'page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*', 'file:///*']
    });
  });
});

chrome.runtime.onStartup?.addListener(() => {
  chrome.storage.local.get('fn:settings').then((result) => {
    if (!result['fn:settings']) {
      return chrome.storage.local.set({ 'fn:settings': { ...DEFAULT_SETTINGS } });
    }
  });
});

/* --------------------------------------------------------------------------
 * 注入 / 打开面板
 * ------------------------------------------------------------------------ */

async function ensureContentScript(tabId) {
  try {
    const pong = await chrome.tabs.sendMessage(tabId, { type: 'fn:ping' }, { frameId: 0 });
    if (pong?.ok) return true;
  } catch (_) {
    /* 页面载入前未注入，继续注入 */
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] },
      files: CONTENT_FILES
    });
    await new Promise((resolve) => setTimeout(resolve, 120));
    return true;
  } catch (error) {
    console.warn('[帧记] 注入失败：', error?.message || error);
    return false;
  }
}

async function togglePanel(tabId, mode = 'toggle') {
  if (!tabId) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    tabId = tab?.id;
  }
  if (!tabId) return false;
  const ready = await ensureContentScript(tabId);
  if (!ready) return false;
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'fn:toggle', mode }, { frameId: 0 });
    return true;
  } catch (error) {
    console.warn('[帧记] 无法打开面板：', error?.message || error);
    return false;
  }
}

chrome.action.onClicked.addListener((tab) => {
  togglePanel(tab?.id, 'toggle');
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-panel') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      togglePanel(tab?.id, 'toggle');
    });
  }
  if (command === 'capture-note') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (!tab?.id) return;
      const ready = await ensureContentScript(tab.id);
      if (ready) {
        chrome.tabs.sendMessage(tab.id, { type: 'fn:quick-capture' }, { frameId: 0 }).catch(() => {});
      }
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) return;
  ensureContentScript(tab.id).then((ready) => {
    if (ready) {
      chrome.tabs.sendMessage(tab.id, { type: 'fn:quick-capture' }, { frameId: 0 }).catch(() => {});
    }
  });
});

/* --------------------------------------------------------------------------
 * 消息路由
 * ------------------------------------------------------------------------ */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.target === 'offscreen') return;

  switch (message.type) {
    case 'fn:open-panel':
      togglePanel(sender.tab?.id, 'open').then((ok) => sendResponse({ ok }));
      return true;

    case 'fn:capture-visible': {
      (async () => {
        try {
          const tab = sender.tab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
          const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'jpeg',
            quality: 94
          });
          sendResponse({ ok: true, dataUrl });
        } catch (error) {
          sendResponse({ ok: false, error: error?.message || '截屏失败' });
        }
      })();
      return true;
    }

    case 'fn:download': {
      (async () => {
        try {
          let downloadId;
          if (/^data:/i.test(String(message.url || ''))) {
            await ensureOffscreenDocument();
            const result = await chrome.runtime.sendMessage({
              target: 'offscreen',
              type: 'fn:offscreen-download',
              dataUrl: message.url,
              filename: message.filename || 'framenote-export',
              saveAs: !!message.saveAs
            });
            if (!result?.ok) throw new Error(result?.error || '下载失败');
            downloadId = result.downloadId;
          } else {
            downloadId = await chrome.downloads.download({
              url: message.url,
              filename: message.filename || 'framenote-export',
              saveAs: message.saveAs === true
            });
          }
          sendResponse({ ok: true, downloadId });
        } catch (error) {
          sendResponse({ ok: false, error: error?.message || '下载失败' });
        }
      })();
      return true;
    }

    case 'fn:ocr':
      (async () => {
        try {
          const result = await runOffscreenOCR(message.dataUrl, message.lang);
          sendResponse({ ok: true, ...result });
        } catch (error) {
          sendResponse({ ok: false, error: error?.message || '本地 OCR 失败' });
        }
      })();
      return true;

    case 'fn:ai-chat':
      (async () => {
        const controller = new AbortController();
        if (message.requestId) AI_ABORTS.set(message.requestId, controller);
        try {
          const result = await chatCompletion(message.config, message.messages, {
            ...(message.options || {}),
            signal: controller.signal
          });
          sendResponse({ ok: true, ...result });
        } catch (error) {
          sendResponse({ ok: false, error: error?.message || 'AI 请求失败' });
        } finally {
          if (message.requestId) AI_ABORTS.delete(message.requestId);
        }
      })();
      return true;

    case 'fn:ai-abort': {
      const controller = AI_ABORTS.get(message.requestId);
      if (controller) controller.abort();
      sendResponse({ ok: true, aborted: !!controller });
      return true;
    }

    case 'fn:ai-transcribe':
      (async () => {
        try {
          const result = await transcribeAudio(message.config, message.audio, message.mime, message.duration);
          sendResponse({ ok: true, ...result });
        } catch (error) {
          sendResponse({ ok: false, error: error?.message || '语音转写失败' });
        }
      })();
      return true;

    case 'fn:ai-test':
      (async () => {
        try {
          const result = await chatCompletion(
            message.config,
            [{ role: 'user', content: '请只回复两个字：可用' }],
            { maxTokens: 12, temperature: 0 }
          );
          sendResponse({ ok: true, text: result.text });
        } catch (error) {
          sendResponse({ ok: false, error: error?.message || '连接失败' });
        }
      })();
      return true;

    default:
      return;
  }
});

/* --------------------------------------------------------------------------
 * 截图
 * ------------------------------------------------------------------------ */

/* captureVisibleTab is handled above; keep the handler body small in case the
 * active tab is a chrome:// page, where Chrome refuses the operation. */

/* --------------------------------------------------------------------------
 * AI 请求
 * ------------------------------------------------------------------------ */

function normalizeBaseUrl(baseUrl) {
  let base = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('尚未填写 API 地址');
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base;
}

async function fetchWithTimeout(url, init, timeoutMs = 150000, externalSignal = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onAbort, { once: true });
  }
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      if (externalSignal?.aborted) throw new Error('AI 任务已停止');
      throw new Error('请求超时。视频较长或模型响应较慢时，请稍后重试。');
    }
    throw new Error(`网络请求失败：${error?.message || error}`);
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener?.('abort', onAbort);
  }
}

async function chatCompletion(config, messages, options = {}) {
  const base = normalizeBaseUrl(config?.baseUrl);
  const url = /\/chat\/completions$/i.test(base) ? base : `${base}/chat/completions`;
  if (!config?.apiKey && !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(base)) {
    throw new Error('尚未填写 API Key');
  }

  const body = {
    model: config?.model || 'deepseek-chat',
    messages,
    temperature: options.temperature ?? config?.temperature ?? 0.35,
    max_tokens: options.maxTokens || 4096,
    stream: false
  };
  if (options.responseFormat === 'json') {
    body.response_format = { type: 'json_object' };
  }

  const headers = { 'Content-Type': 'application/json' };
  if (config?.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  let response = await fetchWithTimeout(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  }, 150000, options.signal);

  if (!response.ok && body.response_format) {
    // 一些兼容接口不接受 response_format，自动重试一次
    delete body.response_format;
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    }, 150000, options.signal);
  }

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(explainAIError(response.status, raw));
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    throw new Error('接口返回了无法解析的内容，请检查 API 地址是否为 OpenAI 兼容接口。');
  }

  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  let text = '';
  if (typeof content === 'string') {
    text = content;
  } else if (Array.isArray(content)) {
    text = content.map((part) => (typeof part === 'string' ? part : part?.text || '')).join('');
  }
  if (!text.trim()) {
    throw new Error('模型没有返回文本内容。请检查模型名称是否支持对话。');
  }
  return {
    text: text.trim(),
    usage: data?.usage || null,
    model: data?.model || body.model
  };
}

function explainAIError(status, raw) {
  let detail = '';
  try {
    const parsed = JSON.parse(raw);
    detail = parsed?.error?.message || parsed?.message || '';
  } catch (_) {
    detail = String(raw || '').slice(0, 300);
  }
  if (status === 401) return 'API Key 无效或已过期（401）。请到设置中检查。';
  if (status === 403) return `接口拒绝访问（403）。${detail}`;
  if (status === 404) return `接口或模型不存在（404）。请检查 API 地址与模型名称。${detail}`;
  if (status === 429) return '请求过于频繁或额度不足（429）。请稍后再试或检查账户额度。';
  if (status >= 500) return `AI 服务暂时不可用（${status}）。${detail}`;
  return `AI 请求失败（${status}）：${detail || '未知错误'}`;
}

async function transcribeAudio(config, base64, mime, duration) {
  const base = normalizeBaseUrl(config?.baseUrl);
  const url = /\/audio\/transcriptions$/i.test(base) ? base : `${base}/audio/transcriptions`;
  if (!config?.apiKey) throw new Error('尚未填写 API Key');

  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mime || 'audio/webm' });
  const file = new File([blob], 'framenote-audio.webm', { type: mime || 'audio/webm' });

  const buildForm = (verbose) => {
    const form = new FormData();
    form.append('file', file);
    form.append('model', config?.sttModel || 'whisper-1');
    form.append('language', 'zh');
    form.append('response_format', verbose ? 'verbose_json' : 'json');
    if (verbose) form.append('timestamp_granularities[]', 'segment');
    return form;
  };

  let response = await fetchWithTimeout(
    url,
    { method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}` }, body: buildForm(true) },
    300000
  );
  if (!response.ok) {
    response = await fetchWithTimeout(
      url,
      { method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}` }, body: buildForm(false) },
      300000
    );
  }
  const raw = await response.text();
  if (!response.ok) throw new Error(explainAIError(response.status, raw));
  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    throw new Error('转写接口返回格式无法解析。');
  }
  return {
    text: String(data?.text || '').trim(),
    segments: Array.isArray(data?.segments)
      ? data.segments.map((seg) => ({
          start: Number(seg.start) || 0,
          end: Number(seg.end) || Number(seg.start) + 3,
          text: String(seg.text || '').trim()
        }))
      : [],
    duration: Number(data?.duration) || Number(duration) || 0
  };
}

/* --------------------------------------------------------------------------
 * 离屏文档 OCR
 * ------------------------------------------------------------------------ */

let offscreenCreating = null;

async function ensureOffscreenDocument() {
  const has = await chrome.offscreen.hasDocument();
  if (has) return;
  if (offscreenCreating) {
    await offscreenCreating;
    return;
  }
  offscreenCreating = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['WORKERS'],
    justification: '使用本地 Tesseract 引擎识别视频画面中的文字'
  });
  try {
    await offscreenCreating;
  } finally {
    offscreenCreating = null;
  }
}

async function runOffscreenOCR(dataUrl, lang) {
  if (!dataUrl || !/^data:image\//.test(dataUrl)) {
    throw new Error('无法读取当前画面，请确保视频已开始播放且页面可见。');
  }
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({
    target: 'offscreen',
    type: 'fn:offscreen-ocr',
    dataUrl,
    lang: lang || 'chi_sim+eng'
  });
  if (!response) throw new Error('本地 OCR 无响应，请重试。');
  if (!response.ok) throw new Error(response.error || '本地 OCR 失败');
  return { text: response.text, confidence: response.confidence, lines: response.lines || [] };
}
