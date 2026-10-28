/* 帧记 · 本地 OCR 离屏页面
 * 使用随扩展打包的 Tesseract.js + chi_sim / eng 语言包，完全离线。
 */

const TESSERACT_BASE = 'vendor/tesseract/';
let workerPromise = null;
let workerLang = null;
let queue = Promise.resolve();

function cleanOCRText(raw) {
  const lines = String(raw || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);

  const compact = lines.map((line) =>
    line
      .replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, '$1')
      .replace(/([\u3400-\u9fff])\s+([，。；：！？、）】》」』])/g, '$1$2')
      .replace(/([（【《「『])\s+([\u3400-\u9fff])/g, '$1$2')
  );

  // 合并被识别断开的单字行，保留段落结构
  const merged = [];
  for (const line of compact) {
    const prev = merged[merged.length - 1];
    const isFragment = line.length <= 2 && /[\u3400-\u9fff]/.test(line);
    if (prev && isFragment && !/[。！？.!?：:]$/.test(prev)) {
      merged[merged.length - 1] = prev + line;
    } else {
      merged.push(line);
    }
  }
  return merged.join('\n').trim();
}

async function getWorker(lang) {
  if (workerPromise && workerLang === lang) return workerPromise;
  if (workerPromise) {
    try {
      const old = await workerPromise;
      await old.terminate();
    } catch (_) {
      /* ignore */
    }
  }
  workerLang = lang;
  workerPromise = Tesseract.createWorker(lang, 1, {
    workerPath: chrome.runtime.getURL(`${TESSERACT_BASE}worker.min.js`),
    corePath: chrome.runtime.getURL(`${TESSERACT_BASE}tesseract-core-simd-lstm.wasm.js`),
    langPath: chrome.runtime.getURL(`${TESSERACT_BASE}lang`),
    gzip: false,
    workerBlobURL: false,
    cacheMethod: 'none',
    logger: (message) => {
      if (message?.status) {
        chrome.runtime.sendMessage({
          type: 'fn:ocr-progress',
          status: message.status,
          progress: message.progress
        }).catch(() => {});
      }
    }
  }).catch((error) => {
    workerPromise = null;
    workerLang = null;
    throw new Error(`OCR 引擎加载失败：${error?.message || error}`);
  });

  const worker = await workerPromise;
  await worker.setParameters({
    tessedit_pageseg_mode: '3',
    preserve_interword_spaces: '1',
    user_defined_dpi: '160'
  });
  return worker;
}

async function recognize(dataUrl, lang) {
  return queue = queue.then(async () => {
    const worker = await getWorker(lang || 'chi_sim+eng');
    const result = await worker.recognize(dataUrl);
    const data = result?.data || {};
    const lines = Array.isArray(data.lines)
      ? data.lines
          .map((line) => String(line.text || '').trim())
          .filter((line) => line.length > 0)
      : [];
    return {
      ok: true,
      text: cleanOCRText(data.text || lines.join('\n')),
      confidence: Math.round(Number(data.confidence) || 0),
      lines
    };
  }).catch((error) => {
    // 队列不能因为一次失败而永久 reject
    queue = Promise.resolve();
    throw error;
  });
}

async function downloadDataUrl(dataUrl, filename, saveAs) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  try {
    const downloadId = await new Promise((resolve, reject) => {
      chrome.downloads.download(
        {
          url: blobUrl,
          filename: filename || 'framenote-export',
          saveAs: !!saveAs
        },
        (id) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (typeof id !== 'number') {
            reject(new Error('浏览器没有创建下载任务'));
          } else {
            resolve(id);
          }
        }
      );
    });
    // 给下载器留出读取 Blob 的时间
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
    return downloadId;
  } catch (error) {
    URL.revokeObjectURL(blobUrl);
    throw error;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.target !== 'offscreen') return;
  if (message.type === 'fn:offscreen-ocr') {
    recognize(message.dataUrl, message.lang)
      .then((result) => sendResponse(result))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error?.message || '本地 OCR 识别失败'
        });
      });
    return true;
  }
  if (message.type === 'fn:offscreen-download') {
    downloadDataUrl(message.dataUrl, message.filename, message.saveAs)
      .then((downloadId) => sendResponse({ ok: true, downloadId }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || '下载失败' }));
    return true;
  }
});
