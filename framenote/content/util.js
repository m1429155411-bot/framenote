/* 帧记 · 工具函数（内容脚本共享命名空间） */
(() => {
  const FN = (globalThis.FN = globalThis.FN || {});
  const CHROME = typeof chrome !== 'undefined' ? chrome : null;

  /* ------------------------------------------------------------------------
   * 时间
   * ---------------------------------------------------------------------- */

  FN.fmtTime = (seconds, forceHours = false) => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    if (h > 0 || forceHours) return `${h}:${mm}:${ss}`;
    return `${mm}:${ss}`;
  };

  FN.parseTime = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
    const text = String(value || '').trim().replace(/[\[\]()]/g, '');
    if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
    const parts = text.split(':').map((part) => Number(part));
    if (!parts.length || parts.some((part) => !Number.isFinite(part))) return 0;
    return parts.reduce((total, part) => total * 60 + part, 0);
  };

  FN.fmtClock = (date = new Date()) => {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  FN.fmtRelative = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    if (!Number.isFinite(diff)) return '';
    if (diff < 60e3) return '刚刚';
    if (diff < 3600e3) return `${Math.floor(diff / 60e3)} 分钟前`;
    if (diff < 86400e3) return `${Math.floor(diff / 3600e3)} 小时前`;
    if (diff < 7 * 86400e3) return `${Math.floor(diff / 86400e3)} 天前`;
    return FN.fmtClock(timestamp).slice(5, 10);
  };

  /* ------------------------------------------------------------------------
   * 基础
   * ---------------------------------------------------------------------- */

  FN.uid = (prefix = 'id') =>
    `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

  FN.escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  FN.debounce = (fn, wait = 300) => {
    let timer = null;
    const wrapped = (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(null, args), wait);
    };
    wrapped.flush = (...args) => {
      clearTimeout(timer);
      fn.apply(null, args);
    };
    wrapped.cancel = () => clearTimeout(timer);
    return wrapped;
  };

  FN.throttle = (fn, wait = 200) => {
    let last = 0;
    let timer = null;
    let lastArgs = null;
    return (...args) => {
      lastArgs = args;
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        last = now;
        fn(...args);
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          last = Date.now();
          fn(...lastArgs);
        }, remaining);
      }
    };
  };

  FN.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  FN.cleanText = (value) =>
    String(value || '')
      .replace(/\u200b/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  FN.truncate = (value, max = 120) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  };

  FN.slugify = (value, fallback = '帧记笔记') => {
    const cleaned = String(value || '')
      .replace(/[\\/:*?"<>|\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return (cleaned || fallback).slice(0, 70);
  };

  FN.stripHtml = (html) => {
    const div = document.createElement('div');
    div.innerHTML = String(html || '');
    return FN.cleanText(div.innerText || div.textContent || '');
  };

  FN.isTypingTarget = (target) => {
    if (!target || !(target instanceof Element)) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable ||
      !!target.closest('[contenteditable="true"]')
    );
  };

  FN.bytes = (n) => {
    if (!Number.isFinite(n)) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  };

  FN.pickJson = (text) => {
    const source = String(text || '').trim();
    const attempts = [];
    const fenced = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) attempts.push(fenced[1].trim());
    attempts.push(source);

    const firstBrace = source.search(/[{[]/);
    if (firstBrace >= 0) {
      const opener = source[firstBrace];
      const closer = opener === '{' ? '}' : ']';
      const last = source.lastIndexOf(closer);
      if (last > firstBrace) attempts.push(source.slice(firstBrace, last + 1));
    }

    for (const candidate of attempts) {
      if (!candidate) continue;
      for (const variant of [candidate, candidate.replace(/,\s*([}\]])/g, '$1')]) {
        try {
          return JSON.parse(variant);
        } catch (_) {
          /* next */
        }
      }
    }
    throw new Error('AI 返回的内容不是可解析的 JSON，请重试一次。');
  };

  /* ------------------------------------------------------------------------
   * 图标（内联 SVG，避免远程资源）
   * ---------------------------------------------------------------------- */

  const ICON_PATHS = {
    play: '<path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none"/>',
    rewind: '<path d="M11 6 5 12l6 6V6ZM19 6l-6 6 6 6V6Z"/>',
    forward: '<path d="m13 6 6 6-6 6V6ZM5 6l6 6-6 6V6Z"/>',
    camera:
      '<path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z"/><circle cx="12" cy="13" r="3.2"/>',
    scan: '<path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4M8 12h8M8 15h5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
    sparkles:
      '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/>',
    library:
      '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM10 4h4v16h-4zM16 5l3 .8-3.7 14.1-3-.8L16 5Z"/>',
    settings:
      '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .64 1.7 1.7 0 0 0-.36 1.05V21h-4v-.08A1.7 1.7 0 0 0 8.6 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.24 15a1.7 1.7 0 0 0-.64-1 1.7 1.7 0 0 0-1.05-.36H2.5v-4h.08A1.7 1.7 0 0 0 4.2 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.5 4.24a1.7 1.7 0 0 0 1-.64A1.7 1.7 0 0 0 9.86 2.5H10v-1h4v.08A1.7 1.7 0 0 0 15 3.2a1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.36 7.5c.14.38.36.72.64 1 .3.28.66.42 1.05.36H21v4h-.08a1.7 1.7 0 0 0-1.52 1.14Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chevronDown: '<path d="m7 9.5 5 5 5-5"/>',
    chevronRight: '<path d="m9.5 7 5 5-5 5"/>',
    chevronLeft: '<path d="m14.5 7-5 5 5 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>',
    download:
      '<path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 19.5h16"/>',
    copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 6.5"/>',
    star: '<path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6.1-5.4-3-5.4 3 1.2-6.1L3.3 9.4l6.1-.8L12 3Z"/>',
    more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    zoomIn: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6"/>',
    zoomOut: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 10.5h6"/>',
    expand: '<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>',
    compress: '<path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"/>',
    file: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h4M9 12h6M9 16h6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.2 2c-.9.7-1.7 1.2-1.7 2.5M12 17.2h.01"/>',
    eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    text: '<path d="M5 5h14M12 5v14M8 19h8"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 3-3 4 4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    bold: '<path d="M7 4h6a4 4 0 0 1 0 8H7V4Zm0 8h7a4 4 0 0 1 0 8H7v-8Z"/>',
    italic: '<path d="M10 4h8M6 20h8M14 4 10 20"/>',
    underline: '<path d="M6 4v7a6 6 0 0 0 12 0V4M4 20h16"/>',
    quote: '<path d="M5 11h4v7H4v-4c0-5 2-8 6-9M15 11h4v7h-5v-4c0-5 2-8 6-9"/>',
    heading: '<path d="M5 5v14M19 5v14M5 12h14"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
    brain: '<path d="M9.5 4A3.5 3.5 0 0 0 6 7.5a3 3 0 0 0-1.5 5.6A3.5 3.5 0 0 0 8 18.5c.3 1 1.2 1.7 2.3 1.7H12V4H9.5ZM14.5 4A3.5 3.5 0 0 1 18 7.5a3 3 0 0 1 1.5 5.6 3.5 3.5 0 0 1-3.5 5.4c-.3 1-1.2 1.7-2.3 1.7H12V4h2.5Z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    lightbulb: '<path d="M9 17h6M9.5 21h5M8 13.5a6 6 0 1 1 8 0c-.7.6-1 1.4-1 2.2V17H9v-1.3c0-.8-.3-1.6-1-2.2Z"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    arrowLeft: '<path d="M19 12H5m0 0 6-6m-6 6 6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    wand: '<path d="m15 4 5 5M13.5 5.5l5 5M4 20l9.5-9.5 2 2L6 22l-2-2ZM5 4v3M3.5 5.5h3M19 15v3M17.5 16.5h3"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>'
  };

  FN.icon = (name, size = 18, cls = '') => {
    const path = ICON_PATHS[name];
    if (!path) return '';
    return `<svg class="fn-icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  };

  /* ------------------------------------------------------------------------
   * HTML 清洗 / Markdown
   * ---------------------------------------------------------------------- */

  const ALLOWED_TAGS = new Set([
    'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'DIV', 'EM', 'FIGCAPTION', 'FIGURE',
    'H1', 'H2', 'H3', 'H4', 'HR', 'I', 'IMG', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN',
    'STRONG', 'TABLE', 'TBODY', 'TD', 'TH', 'THEAD', 'TR', 'U', 'UL', 'MARK', 'SUP', 'SUB'
  ]);
  const ALLOWED_ATTRS = new Set([
    'href', 'src', 'alt', 'title', 'class', 'data-ts', 'data-img', 'data-lang',
    'colspan', 'rowspan', 'target', 'rel'
  ]);

  FN.sanitizeHtml = (html) => {
    const template = document.createElement('template');
    template.innerHTML = String(html || '');
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
    const remove = [];
    let node = walker.currentNode;
    while (node) {
      if (node.nodeType === 1) {
        if (!ALLOWED_TAGS.has(node.tagName)) {
          remove.push(node);
        } else {
          for (const attr of [...node.attributes]) {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on') || !ALLOWED_ATTRS.has(name)) {
              node.removeAttribute(attr.name);
              continue;
            }
            if (name === 'href' || name === 'src') {
              const value = String(attr.value || '').trim();
              const safe =
                /^https?:\/\//i.test(value) ||
                /^mailto:/i.test(value) ||
                /^data:image\//i.test(value) ||
                /^chrome-extension:\/\//i.test(value) ||
                value.startsWith('#') ||
                (name === 'href' && value.startsWith('/'));
              if (!safe) node.removeAttribute(attr.name);
            }
            if (name === 'class') {
              const safeClasses = String(attr.value || '')
                .split(/\s+/)
                .filter((cls) => /^fn-[a-z0-9-]+$/i.test(cls))
                .join(' ');
              if (safeClasses) node.setAttribute('class', safeClasses);
              else node.removeAttribute('class');
            }
          }
          if (node.tagName === 'A') {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
          if (node.tagName === 'IMG') {
            const src = node.getAttribute('src') || '';
            if (!/^(data:image\/|chrome-extension:\/\/)/i.test(src)) {
              remove.push(node);
            } else {
              node.setAttribute('loading', 'lazy');
              node.setAttribute('decoding', 'async');
            }
          }
        }
      }
      node = walker.nextNode();
    }
    for (const el of remove) {
      const parent = el.parentNode;
      if (!parent) continue;
      if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|SVG|MATH|LINK|META|BASE)$/i.test(el.tagName)) {
        el.remove();
        continue;
      }
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    }
    return template.innerHTML;
  };

  const inlineMarkdown = (text) => {
    let value = FN.escapeHtml(text);
    const codeSpans = [];
    value = value.replace(/`([^`]+)`/g, (_m, code) => {
      const token = `\u0000CODE${codeSpans.length}\u0000`;
      codeSpans.push(`<code>${code}</code>`);
      return token;
    });
    value = value
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">[图片] $1</a>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,，。]|$)/g, '$1<em>$2</em>')
      .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,，。]|$)/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      .replace(/\n/g, '<br>');
    value = value.replace(/\u0000CODE(\d+)\u0000/g, (_m, index) => codeSpans[Number(index)] || '');
    return value;
  };

  FN.mdToHtml = (markdown) => {
    const source = String(markdown || '').replace(/\r\n/g, '\n').trim();
    if (!source) return '';
    const lines = source.split('\n');
    const out = [];
    let index = 0;

    const flushList = (type, items) => {
      if (!items.length) return;
      out.push(`<${type}>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</${type}>`);
      items.length = 0;
    };

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      const fence = line.match(/^```(\w+)?\s*$/);
      if (fence) {
        const lang = fence[1] || '';
        const code = [];
        index += 1;
        while (index < lines.length && !/^```\s*$/.test(lines[index])) {
          code.push(lines[index]);
          index += 1;
        }
        index += 1;
        out.push(
          `<pre><code${lang ? ` data-lang="${FN.escapeHtml(lang)}"` : ''}>${FN.escapeHtml(code.join('\n'))}</code></pre>`
        );
        continue;
      }

      if (/^#{1,4}\s+/.test(line)) {
        const level = Math.min(4, line.match(/^#+/)[0].length);
        out.push(`<h${level}>${inlineMarkdown(line.replace(/^#{1,4}\s+/, ''))}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quote = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) {
          quote.push(lines[index].replace(/^>\s?/, ''));
          index += 1;
        }
        out.push(`<blockquote>${inlineMarkdown(quote.join('\n'))}</blockquote>`);
        continue;
      }

      if (/^\s*([-*_]){3,}\s*$/.test(line)) {
        out.push('<hr>');
        index += 1;
        continue;
      }

      if (/^\s*\|.+\|\s*$/.test(line) && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[index + 1] || '')) {
        const header = line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
        const rows = [];
        index += 2;
        while (index < lines.length && /^\s*\|.+\|\s*$/.test(lines[index])) {
          rows.push(
            lines[index].trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
          );
          index += 1;
        }
        out.push(
          `<table><thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${rows
            .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`)
            .join('')}</tbody></table>`
        );
        continue;
      }

      const ul = line.match(/^\s*[-*+]\s+(.*)$/);
      if (ul) {
        const items = [];
        while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
          items.push(lines[index].replace(/^\s*[-*+]\s+/, ''));
          index += 1;
        }
        flushList('ul', items);
        continue;
      }

      const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (ol) {
        const items = [];
        while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
          items.push(lines[index].replace(/^\s*\d+[.)]\s+/, ''));
          index += 1;
        }
        flushList('ol', items);
        continue;
      }

      const paragraph = [line];
      index += 1;
      while (
        index < lines.length &&
        lines[index].trim() &&
        !/^(#{1,4}\s|```|>\s?|\s*[-*+]\s|\s*\d+[.)]\s|\s*\|)/.test(lines[index])
      ) {
        paragraph.push(lines[index]);
        index += 1;
      }
      out.push(`<p>${inlineMarkdown(paragraph.join('\n'))}</p>`);
    }
    return out.join('');
  };

  function timestampNodes(root, formatter) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const targets = [];
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      const blocked =
        !parent ||
        parent.closest('a, code, pre, button, .fn-ts, .fn-no-linkify') ||
        !/[\d:]{4,}/.test(node.nodeValue || '');
      if (!blocked) targets.push(node);
      node = walker.nextNode();
    }

    for (const textNode of targets) {
      const text = textNode.nodeValue;
      const regex = /\[?((?:\d{1,2}:)?\d{1,2}:\d{2})\]?/g;
      let match;
      let last = 0;
      let hasMatch = false;
      const fragment = document.createDocumentFragment();
      while ((match = regex.exec(text))) {
        const raw = match[0];
        const value = match[1];
        // 排除版本号、比例等非时间用法：前后不能紧跟数字
        const before = text[match.index - 1];
        const after = text[match.index + raw.length];
        if ((before && /\d/.test(before)) || (after && /[%\d]/.test(after))) continue;
        if (match.index > last) fragment.append(text.slice(last, match.index));
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fn-ts';
        btn.dataset.ts = String(FN.parseTime(value));
        btn.textContent = value;
        btn.title = '跳转到视频 ' + value;
        fragment.append(btn);
        last = match.index + raw.length;
        hasMatch = true;
      }
      if (!hasMatch) continue;
      if (last < text.length) fragment.append(text.slice(last));
      textNode.parentNode?.replaceChild(fragment, textNode);
    }
  }

  FN.decorateTimestamps = (root) => timestampNodes(root);

  FN.linkifyTimestamps = (container) => {
    if (!container) return;
    timestampNodes(container);
  };

  FN.renderMarkdown = (markdown) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = FN.sanitizeHtml(FN.mdToHtml(markdown));
    FN.decorateTimestamps(wrapper);
    return wrapper.innerHTML;
  };

  /* ------------------------------------------------------------------------
   * 图片来源处理
   * ---------------------------------------------------------------------- */

  FN.imageToDataUrl = (image, options = {}) => {
    const maxWidth = options.maxWidth || 1280;
    const quality = options.quality ?? 0.9;
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) throw new Error('图片尚未加载');
    const scale = Math.min(1, maxWidth / sourceWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', quality);
  };

  FN.compressDataUrl = (dataUrl, options = {}) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          resolve(FN.imageToDataUrl(img, options));
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('图片读取失败'));
      img.src = dataUrl;
    });

  FN.dataUrlBytes = (dataUrl) => {
    const base64 = String(dataUrl || '').split(',')[1] || '';
    return Math.floor((base64.length * 3) / 4);
  };

  FN.downloadBlob = (blob, filename) => {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.documentElement.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    return true;
  };

  FN.download = async (url, filename, options = {}) => {
    // 优先交给扩展后台/离屏页下载：数据 URL 会先转成扩展 origin 的 Blob URL，
    // 避免 data: 超长、下载被浏览器拒绝，以及异步生成后丢失用户激活的问题。
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'fn:download',
        url,
        filename,
        saveAs: options.saveAs === true
      });
      if (!response?.ok) throw new Error(response?.error || '下载失败');
      return true;
    } catch (error) {
      if (!/^data:/i.test(String(url))) throw error;
    }
    // 兜底：内容脚本内 Blob URL + a[download]
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return FN.downloadBlob(blob, filename);
    } catch (error) {
      throw new Error(`文件生成失败：${error?.message || error}`);
    }
  };

  FN.downloadText = (text, filename, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([text], { type: mime });
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => FN.download(reader.result, filename).then(resolve).catch(reject);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  FN.copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.documentElement.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      return ok;
    }
  };

  FN.imageFromDataUrl = (dataUrl) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('图片加载失败'));
      image.src = dataUrl;
    });

  FN.canvasToBlob = (canvas, type = 'image/png', quality = 0.95) =>
    new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('画布导出失败'));
      }, type, quality);
    });

  FN.blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  FN.escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  FN.hostLabel = (hostname) => {
    const host = String(hostname || '').replace(/^www\./, '');
    const map = {
      'youtube.com': 'YouTube',
      'm.youtube.com': 'YouTube',
      'bilibili.com': '哔哩哔哩',
      'player.bilibili.com': '哔哩哔哩',
      'vimeo.com': 'Vimeo',
      'coursera.org': 'Coursera',
      'udemy.com': 'Udemy',
      'icourse163.org': '中国大学MOOC',
      'xuetangx.com': '学堂在线',
      'chaoxing.com': '学习通',
      'zhihuishu.com': '智慧树',
      'ted.com': 'TED',
      'open.163.com': '网易公开课',
      'bilibili.tv': '哔哩哔哩'
    };
    for (const [key, label] of Object.entries(map)) {
      if (host === key || host.endsWith(`.${key}`)) return label;
    }
    return host || '网页视频';
  };

  FN.isExtensionAlive = () => {
    try {
      return !!(CHROME?.runtime?.id);
    } catch (_) {
      return false;
    }
  };
})();
