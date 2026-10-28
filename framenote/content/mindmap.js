/* 帧记 · 思维导图：布局、渲染、导出 */
(() => {
  const FN = globalThis.FN;

  const FONT_STACK = '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif';
  const COLORS = {
    rootFrom: '#b7de70',
    rootTo: '#9dc952',
    edge: '#d5d5cb',
    edgeStrong: '#a8c977',
    text: '#1b1b17',
    muted: '#77776c',
    border: '#e3e3da',
    depth1: '#eef4df',
    depth1Border: '#d3e2b7',
    star: '#f2f8e4',
    starBorder: '#bad67f',
    starText: '#43551e',
    white: '#ffffff'
  };

  let measureCanvas = null;
  function measureText(text, font) {
    if (!measureCanvas) measureCanvas = document.createElement('canvas');
    const ctx = measureCanvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
  }

  function wrapText(text, maxWidth, font, maxLines = 4) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return ['未命名节点'];
    const tokens = clean.match(/[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]|[^\s\u3400-\u9fff\u3000-\u303f\uff00-\uffef]+|\s+/g) || [clean];
    const lines = [];
    let current = '';
    for (const token of tokens) {
      const candidate = current + token;
      if (measureText(candidate, font) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current.trim());
        current = token.trimStart();
        if (lines.length >= maxLines) break;
      }
    }
    if (current && lines.length < maxLines) lines.push(current.trim());
    if (lines.length === 0) lines.push(clean.slice(0, 12));

    // 如果仍有未显示内容，在末行加省略号
    const consumed = lines.join('');
    if (consumed.length < clean.replace(/\s/g, '').length) {
      let last = lines[lines.length - 1];
      while (last.length > 2 && measureText(`${last}…`, font) > maxWidth) last = last.slice(0, -1);
      lines[lines.length - 1] = `${last}…`;
    }
    return lines;
  }

  function sanitizeText(value, max = 120) {
    return FN.cleanText(String(value || '')).slice(0, max);
  }

  function normalizeTree(raw, fallbackTitle = '视频笔记') {
    const MAX_DEPTH = 5;
    const MAX_NODES = 100;
    let count = 0;
    let source = raw;
    if (Array.isArray(source)) {
      source = { text: fallbackTitle, children: source };
    }
    if (!source || typeof source !== 'object') return null;

    const seen = new Set();
    const visit = (node, depth) => {
      if (!node || typeof node !== 'object' || count >= MAX_NODES) return null;
      const text = sanitizeText(
        node.text ?? node.title ?? node.name ?? node.label ?? node.topic ?? '',
        140
      );
      if (!text) return null;
      const id = FN.uid('mn');
      seen.add(id);
      count += 1;
      const rawChildren = Array.isArray(node.children)
        ? node.children
        : Array.isArray(node.nodes)
          ? node.nodes
          : Array.isArray(node.subtopics)
            ? node.subtopics
            : [];
      const children = depth < MAX_DEPTH
        ? rawChildren.map((child) => visit(child, depth + 1)).filter(Boolean)
        : [];
      return {
        id,
        text,
        ts: node.ts != null ? FN.parseTime(node.ts) : node.time != null ? FN.parseTime(node.time) : null,
        star: !!(node.star || node.key || node.important || node.highlight),
        children
      };
    };

    const root = visit(source, 0);
    if (!root) return null;
    if (!root.children.length) {
      // 单节点也保留，但避免误把普通对象当树
      const fallbackText = sanitizeText(source.text || source.title || '');
      if (!fallbackText) return null;
    }
    return root;
  }

  function fromOutline(nodes, title) {
    if (!Array.isArray(nodes) || !nodes.length) return null;
    const root = { id: FN.uid('mn'), text: title || '视频笔记', ts: null, star: false, children: [] };
    const stack = [{ node: root, level: 0 }];
    let count = 0;
    for (const item of nodes) {
      const text = sanitizeText(item.text, 140);
      if (!text || count > 100) continue;
      const level = Math.max(1, Math.min(5, Number(item.level) || 1));
      while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
      const parent = stack[stack.length - 1]?.node || root;
      const node = {
        id: item.id || FN.uid('mn'),
        text,
        ts: item.ts != null ? FN.parseTime(item.ts) : null,
        star: !!item.star,
        children: []
      };
      parent.children.push(node);
      stack.push({ node, level });
      count += 1;
    }
    return root;
  }

  function fromSummary(summary, title) {
    if (!summary?.chapters?.length) return null;
    const root = {
      id: FN.uid('mn'),
      text: title || '视频笔记',
      ts: null,
      star: false,
      children: []
    };
    for (const chapter of summary.chapters.slice(0, 20)) {
      const node = {
        id: FN.uid('mn'),
        text: sanitizeText(chapter.title, 80),
        ts: chapter.ts != null ? FN.parseTime(chapter.ts) : null,
        star: !!chapter.star,
        children: (chapter.keyPoints || chapter.points || [])
          .slice(0, 6)
          .map((point) => ({
            id: FN.uid('mn'),
            text: sanitizeText(point, 120),
            ts: null,
            star: false,
            children: []
          }))
      };
      root.children.push(node);
    }
    return root.children.length ? root : null;
  }

  function fromRich(html, title) {
    const template = document.createElement('template');
    template.innerHTML = FN.sanitizeHtml(html || '');
    const root = { id: FN.uid('mn'), text: title || '视频笔记', ts: null, star: false, children: [] };
    const stack = [{ node: root, level: 0 }];
    let count = 0;

    const walk = (parent, container) => {
      for (const element of container.children) {
        if (count > 80) return;
        const tag = element.tagName;
        if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
          const level = Number(tag.slice(1));
          while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
          const tsEl = element.querySelector('[data-ts]');
          const node = {
            id: FN.uid('mn'),
            text: sanitizeText(element.textContent.replace(/\d{1,2}:\d{2}(?::\d{2})?/g, '').trim(), 120),
            ts: tsEl ? FN.parseTime(tsEl.dataset.ts) : null,
            star: false,
            children: []
          };
          if (!node.text) continue;
          (stack[stack.length - 1]?.node || root).children.push(node);
          stack.push({ node, level });
          count += 1;
        } else if (tag === 'UL' || tag === 'OL') {
          const parentNode = stack[stack.length - 1]?.node || root;
          for (const li of element.querySelectorAll(':scope > li')) {
            const tsEl = li.querySelector('[data-ts]');
            const text = sanitizeText(
              [...li.childNodes]
                .filter((child) => child.nodeType === 3 || child.tagName !== 'UL')
                .map((child) => child.textContent)
                .join(' ')
                .replace(/\d{1,2}:\d{2}(?::\d{2})?/g, '')
                .trim(),
              120
            );
            if (!text) continue;
            parentNode.children.push({
              id: FN.uid('mn'),
              text,
              ts: tsEl ? FN.parseTime(tsEl.dataset.ts) : null,
              star: false,
              children: []
            });
            count += 1;
          }
        } else if (['DIV', 'SECTION', 'ARTICLE', 'BLOCKQUOTE', 'FIGURE'].includes(tag)) {
          walk(parent, element);
        }
      }
    };

    walk(root, template.content);
    return root.children.length ? root : null;
  }

  function fromTranscript(segments, title, transcriptTitle) {
    if (!Array.isArray(segments) || !segments.length) return null;
    const root = {
      id: FN.uid('mn'),
      text: title || '视频笔记',
      ts: null,
      star: false,
      children: []
    };
    const groups = new Map();
    for (const segment of segments) {
      if (!segment.text) continue;
      const bucket = Math.floor((Number(segment.start) || 0) / 300);
      if (!groups.has(bucket)) groups.set(bucket, []);
      groups.get(bucket).push(segment);
    }
    for (const [bucket, group] of groups) {
      const start = Math.min(...group.map((item) => Number(item.start) || 0));
      root.children.push({
        id: FN.uid('mn'),
        text: `${FN.fmtTime(start)} ${FN.truncate(group[0].text, 30)}`,
        ts: start,
        star: false,
        children: group.slice(0, 6).map((segment) => ({
          id: FN.uid('mn'),
          text: FN.truncate(segment.text, 90),
          ts: Number(segment.start) || 0,
          star: false,
          children: []
        }))
      });
      if (root.children.length >= 40) break;
    }
    return root.children.length ? root : null;
  }

  function countNodes(tree) {
    if (!tree) return 0;
    return 1 + (tree.children || []).reduce((sum, child) => sum + countNodes(child), 0);
  }

  function prepare(tree, depth = 0) {
    const isRoot = depth === 0;
    const font = isRoot ? `600 15px ${FONT_STACK}` : `500 13px ${FONT_STACK}`;
    const maxTextWidth = isRoot ? 184 : 158;
    const lines = wrapText(tree.text, maxTextWidth, font, isRoot ? 3 : 4);
    const width = isRoot ? 240 : 196;
    const lineHeight = isRoot ? 21 : 18;
    const textHeight = lines.length * lineHeight;
    const tsHeight = tree.ts != null ? 15 : 2;
    const height = Math.max(isRoot ? 58 : 40, 16 + textHeight + tsHeight + 12);
    const node = {
      ...tree,
      depth,
      isRoot,
      lines,
      font,
      width,
      height,
      lineHeight,
      textHeight,
      children: (tree.children || []).map((child) => prepare(child, depth + 1))
    };
    return node;
  }

  function measureSubtree(node, vGap = 16) {
    if (!node.children.length) {
      node.subHeight = node.height;
      return;
    }
    for (const child of node.children) measureSubtree(child, vGap);
    const childrenHeight =
      node.children.reduce((sum, child) => sum + child.subHeight, 0) + vGap * (node.children.length - 1);
    node.subHeight = Math.max(node.height, childrenHeight);
  }

  function assignPositions(node, left, top, vGap = 16) {
    node.x = left;
    node.cy = top + node.subHeight / 2;
    node.y = node.cy - node.height / 2;
    if (!node.children.length) return;
    const childrenHeight =
      node.children.reduce((sum, child) => sum + child.subHeight, 0) + vGap * (node.children.length - 1);
    let cursor = top + (node.subHeight - childrenHeight) / 2;
    for (const child of node.children) {
      const childLeft = left + node.width + 62;
      assignPositions(child, childLeft, cursor, vGap);
      cursor += child.subHeight + vGap;
    }
  }

  function collect(node, out = []) {
    out.push(node);
    for (const child of node.children) collect(child, out);
    return out;
  }

  function buildLayout(tree, options = {}) {
    const prepared = prepare(tree);
    measureSubtree(prepared);
    assignPositions(prepared, 46, 46);
    const nodes = collect(prepared);
    const maxRight = Math.max(...nodes.map((node) => node.x + node.width));
    const maxBottom = Math.max(...nodes.map((node) => node.y + node.height));
    return {
      root: prepared,
      nodes,
      width: Math.ceil(maxRight + 46),
      height: Math.ceil(maxBottom + 46),
      margin: 46
    };
  }

  function escapeXml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function truncateLine(text, maxWidth, font) {
    let value = text;
    while (value.length > 1 && measureText(`${value}…`, font) > maxWidth) {
      value = value.slice(0, -1);
    }
    return `${value}…`;
  }

  function nodeSvg(node, interactive) {
    const fill = node.isRoot
      ? 'url(#fnRootGradient)'
      : node.star
        ? COLORS.star
        : node.depth === 1
          ? COLORS.depth1
          : COLORS.white;
    const stroke = node.isRoot ? 'none' : node.star ? COLORS.starBorder : node.depth === 1 ? COLORS.depth1Border : COLORS.border;
    const textColor = node.isRoot ? '#14170d' : node.star ? COLORS.starText : COLORS.text;
    const radius = node.isRoot ? 16 : 12;
    const ts = node.ts != null ? FN.fmtTime(node.ts) : '';
    const star = node.star && !node.isRoot ? '★ ' : '';
    const lines = node.lines.map((line, index) => {
      const y = 16 + node.lineHeight * index + node.lineHeight * 0.72;
      return `<tspan x="14" y="${y.toFixed(1)}">${escapeXml(star && index === 0 ? star : '')}${escapeXml(line)}</tspan>`;
    });

    const tsSvg = ts
      ? `<g class="fn-map-ts"><rect x="13" y="${node.height - 23}" width="${Math.max(42, ts.length * 7.4 + 12)}" height="16" rx="8" fill="${node.isRoot ? 'rgba(20,23,13,.1)' : 'rgba(120,166,40,.1)'}"/><text x="${13 + Math.max(42, ts.length * 7.4 + 12) / 2}" y="${node.height - 11.5}" text-anchor="middle" font-family='${FONT_STACK}' font-size="9.5" fill="${node.isRoot ? '#35440f' : '#46640f'}">${ts}</text></g>`
      : '';

    const attrs = interactive
      ? `class="fn-map-node${node.ts != null ? ' is-seekable' : ''}" data-node-id="${escapeXml(node.id)}"${node.ts != null ? ` data-ts="${node.ts}"` : ''} role="button" tabindex="0"`
      : '';

    return `<g ${attrs} transform="translate(${node.x.toFixed(1)} ${node.y.toFixed(1)})">
      <rect width="${node.width}" height="${node.height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.4" filter="url(#fnNodeShadow)"/>
      ${node.isRoot ? `<rect x="0" y="0" width="4" height="${node.height}" rx="2" fill="rgba(20,23,13,.28)"/>` : ''}
      <text font-family='${FONT_STACK}' font-size="${node.isRoot ? 15 : 13}" font-weight="${node.isRoot ? 600 : 500}" fill="${textColor}">${lines.join('')}</text>
      ${tsSvg}
      ${node.isRoot ? `<circle cx="${node.width - 20}" cy="18" r="5" fill="rgba(20,23,13,.32)"/>` : ''}
    </g>`;
  }

  function edgeSvg(parent, child) {
    const x1 = parent.x + parent.width;
    const y1 = parent.cy;
    const x2 = child.x;
    const y2 = child.cy;
    const mid = x1 + (x2 - x1) * 0.52;
    const emphasized = child.star || child.depth === 1;
    return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${mid.toFixed(1)} ${y1.toFixed(1)}, ${mid.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${emphasized ? COLORS.edgeStrong : COLORS.edge}" stroke-width="${child.depth === 1 ? 2 : 1.6}" stroke-linecap="round"/>`;
  }

  function buildSvg(tree, options = {}) {
    const layout = buildLayout(tree);
    const exportMode = options.exportMode || false;
    const title = options.title || tree?.text || '视频笔记';
    const subtitle = options.subtitle || '';
    const headerHeight = exportMode ? 88 : 0;
    const width = Math.max(layout.width, exportMode ? 720 : 0);
    const height = layout.height + headerHeight + (exportMode ? 34 : 0);
    const nodeMarkup = layout.nodes.map((node) => nodeSvg(node, !exportMode)).join('');
    const edgeMarkup = [];
    for (const node of layout.nodes) {
      for (const child of node.children) edgeMarkup.push(edgeSvg(node, child));
    }
    const starCount = layout.nodes.filter((node) => node.star).length;
    const header = exportMode
      ? `<g class="fn-map-header">
          <text x="46" y="42" font-family='${FONT_STACK}' font-size="22" font-weight="700" fill="#1b1b17">${escapeXml(title)}</text>
          <text x="46" y="66" font-family='${FONT_STACK}' font-size="11.5" fill="#87877c">${escapeXml(subtitle || `共 ${layout.nodes.length} 个知识点${starCount ? ` · ${starCount} 个重点` : ''}`)}</text>
          <line x1="46" y1="80" x2="${width - 46}" y2="80" stroke="#e6e6de"/>
        </g>`
      : '';
    const footer = exportMode
      ? `<text x="${width - 46}" y="${height - 15}" text-anchor="end" font-family='${FONT_STACK}' font-size="10" fill="#a0a096">由 帧记 · AI 视频笔记 生成</text>`
      : '';

    return {
      width,
      height,
      count: layout.nodes.length,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="fn-mindmap-svg" role="img" aria-label="${escapeXml(title)} 思维导图">
        <defs>
          <linearGradient id="fnRootGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${COLORS.rootFrom}"/>
            <stop offset="1" stop-color="${COLORS.rootTo}"/>
          </linearGradient>
          <filter id="fnNodeShadow" x="-12%" y="-20%" width="130%" height="150%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.6" flood-color="#14140f" flood-opacity="0.08"/>
          </filter>
        </defs>
        <rect width="${width}" height="${height}" fill="#fbfbf8"/>
        ${header}
        <g transform="translate(0 ${headerHeight})">
          <g class="fn-map-edges">${edgeMarkup.join('')}</g>
          <g class="fn-map-nodes">${nodeMarkup}</g>
        </g>
        ${footer}
      </svg>`
    };
  }

  function renderTo(container, tree, options = {}) {
    if (!container) return null;
    if (!tree) {
      container.innerHTML = '';
      return null;
    }
    const built = buildSvg(tree, options);
    container.innerHTML = built.svg;
    container.dataset.mapWidth = String(built.width);
    container.dataset.mapHeight = String(built.height);
    return built;
  }

  function toMarkdown(tree) {
    if (!tree) return '';
    const lines = [];
    const walk = (node, depth) => {
      const indent = '  '.repeat(depth);
      const star = node.star ? ' **★ 重点**' : '';
      const ts = node.ts != null ? ` \`[${FN.fmtTime(node.ts)}]\`` : '';
      lines.push(`${indent}- ${node.text}${ts}${star}`);
      for (const child of node.children || []) walk(child, depth + 1);
    };
    walk(tree, 0);
    return lines.join('\n');
  }

  function toOPML(tree, title) {
    if (!tree) return '';
    const escape = (value) =>
      String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const build = (node) => {
      const text = `${node.star ? '★ ' : ''}${node.text}${node.ts != null ? ` [${FN.fmtTime(node.ts)}]` : ''}`;
      if (!node.children?.length) return `<outline text="${escape(text)}"/>`;
      return `<outline text="${escape(text)}">${node.children.map(build).join('')}</outline>`;
    };
    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>${escape(title || tree.text)}</title></head>
  <body>${build(tree)}</body>
</opml>`;
  }

  async function rasterize(svg, width, height, scale = 2) {
    const maxDimension = 12000;
    const actualScale = Math.min(scale, maxDimension / Math.max(width, height));
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('思维导图渲染失败'));
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * actualScale));
      canvas.height = Math.max(1, Math.round(height * actualScale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fbfbfe';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(actualScale, actualScale);
      ctx.drawImage(image, 0, 0, width, height);
      return await FN.canvasToBlob(canvas, 'image/png', 0.96);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function downloadPNG(tree, options = {}) {
    const built = buildSvg(tree, { exportMode: true, title: options.title, subtitle: options.subtitle });
    const blob = await rasterize(built.svg, built.width, built.height, options.scale || 2);
    const dataUrl = await FN.blobToDataUrl(blob);
    const filename = `${FN.slugify(options.filename || options.title || '思维导图')}-思维导图.png`;
    await FN.download(dataUrl, filename);
    return { filename, width: built.width, height: built.height };
  }

  async function downloadSVG(tree, options = {}) {
    const built = buildSvg(tree, { exportMode: true, title: options.title, subtitle: options.subtitle });
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(built.svg)}`;
    const filename = `${FN.slugify(options.filename || options.title || '思维导图')}-思维导图.svg`;
    await FN.download(dataUrl, filename);
    return { filename, width: built.width, height: built.height };
  }

  async function downloadMarkdown(tree, options = {}) {
    const md = `# ${options.title || tree?.text || '思维导图'}\n\n${toMarkdown(tree)}\n\n---\n由「帧记 · AI 视频笔记」生成\n`;
    const filename = `${FN.slugify(options.filename || options.title || '思维导图')}-思维导图.md`;
    await FN.downloadText(md, filename, 'text/markdown;charset=utf-8');
    return { filename };
  }

  FN.Mindmap = {
    normalizeTree,
    fromOutline,
    fromSummary,
    fromRich,
    fromTranscript,
    countNodes,
    buildLayout,
    buildSvg,
    renderTo,
    toMarkdown,
    toOPML,
    downloadPNG,
    downloadSVG,
    downloadMarkdown
  };
})();
