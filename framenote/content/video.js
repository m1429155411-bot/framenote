/* 帧记 · 网页视频探测器与控制器 */
(() => {
  const FN = globalThis.FN;

  const SPEEDS = [1, 1.25, 1.5, 2, 0.75];

  function isVisible(video) {
    if (!video || !video.isConnected) return false;
    const rect = video.getBoundingClientRect();
    if (rect.width < 120 || rect.height < 70) return false;
    if (rect.bottom <= 0 || rect.right <= 0) return false;
    if (rect.top >= innerHeight || rect.left >= innerWidth) return false;
    const style = getComputedStyle(video);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
      return false;
    }
    return true;
  }

  function collectVideosFromShadow(root, out, depth = 0) {
    if (depth > 6) return;
    for (const element of root.querySelectorAll('*')) {
      if (element.shadowRoot) collectVideosFromShadow(element.shadowRoot, out, depth + 1);
    }
    for (const video of root.querySelectorAll('video')) {
      if (!out.includes(video)) out.push(video);
    }
  }

  function stripCueHtml(text) {
    const div = document.createElement('div');
    div.innerHTML = String(text || '').replace(/\r/g, '');
    return FN.cleanText(div.textContent || '');
  }

  FN.parseSubtitle = (content) => {
    const source = String(content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const segments = [];

    if (/^\s*WEBVTT/i.test(source) || /-->/.test(source)) {
      const blocks = source.split(/\n{2,}/);
      for (const block of blocks) {
        const lines = block.split('\n').filter((line) => line.trim());
        if (!lines.length) continue;
        if (/^(WEBVTT|NOTE|STYLE|REGION)\b/i.test(lines[0])) continue;
        let timingIndex = lines.findIndex((line) => line.includes('-->'));
        if (timingIndex < 0) continue;
        const timing = lines[timingIndex].match(
          /(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}/
        );
        if (!timing) continue;
        const [startRaw, endRaw] = timing[0].split('-->').map((part) => part.trim().split(/\s+/)[0]);
        const text = stripCueHtml(lines.slice(timingIndex + 1).join('\n'));
        if (!text) continue;
        segments.push({
          id: FN.uid('seg'),
          start: FN.parseTime(startRaw.replace(',', '.')),
          end: FN.parseTime(endRaw.replace(',', '.')),
          text,
          source: 'subtitle'
        });
      }
    } else {
      // 纯文本：支持 [00:12] 开头，否则按行均分，后续由 video 时长修正
      const lines = source.split('\n').map((line) => line.trim()).filter(Boolean);
      for (const line of lines) {
        const match = line.match(/^\[?((?:\d{1,2}:)?\d{1,2}:\d{2})\]?\s*(.+)$/);
        segments.push({
          id: FN.uid('seg'),
          start: match ? FN.parseTime(match[1]) : null,
          end: null,
          text: match ? match[2].trim() : line,
          source: 'text'
        });
      }
    }

    segments.sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    // 去重（YouTube 自动字幕常见滚动重复）
    const deduped = [];
    for (const segment of segments) {
      const previous = deduped[deduped.length - 1];
      if (previous && previous.text === segment.text && Math.abs((segment.start || 0) - (previous.start || 0)) < 1.2) {
        continue;
      }
      deduped.push(segment);
    }
    return deduped;
  };

  class VideoTracker {
    constructor() {
      this.video = null;
      this.key = '';
      this.meta = null;
      this.listeners = new Map();
      this.lastUrl = location.href;
      this.lastTimeEmit = 0;
      this.scanTimer = null;
      this.pollTimer = null;
      this.suppressPause = false;
      this.beforeFallbackCapture = null;
      this._onDocEvent = this._onDocEvent.bind(this);
      this._onTimeUpdate = this._onTimeUpdate.bind(this);
    }

    on(event, callback) {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set());
      this.listeners.get(event).add(callback);
      return () => this.listeners.get(event)?.delete(callback);
    }

    emit(event, payload) {
      for (const callback of this.listeners.get(event) || []) {
        try {
          callback(payload);
        } catch (error) {
          console.warn('[帧记] 视频事件处理失败', error);
        }
      }
    }

    start() {
      const events = ['play', 'pause', 'ended', 'ratechange', 'loadedmetadata', 'durationchange', 'seeked', 'timeupdate'];
      for (const event of events) {
        document.addEventListener(event, this._onDocEvent, true);
      }
      this.scan({ silent: false });
      this.pollTimer = setInterval(() => this._poll(), 1000);
      this.scanTimer = setInterval(() => this.scan({ silent: true }), 2600);
    }

    stop() {
      for (const event of ['play', 'pause', 'ended', 'ratechange', 'loadedmetadata', 'durationchange', 'seeked', 'timeupdate']) {
        document.removeEventListener(event, this._onDocEvent, true);
      }
      clearInterval(this.pollTimer);
      clearInterval(this.scanTimer);
      this.listeners.clear();
    }

    _onDocEvent(event) {
      const target = event.target;
      if (!(target instanceof HTMLVideoElement)) return;
      if (event.type === 'play') {
        if (target !== this.video) {
          this._select(target);
        }
        this.emit('play');
        this._emitState();
      } else if (event.type === 'pause') {
        if (target !== this.video) return;
        this.emit('pause', { suppressed: this.suppressPause });
        this._emitState();
      } else if (event.type === 'ended') {
        if (target !== this.video) return;
        this.emit('ended');
        this._emitState();
      } else if (event.type === 'timeupdate') {
        if (target === this.video) this._onTimeUpdate();
      } else if (event.type === 'seeked') {
        if (target === this.video) this._emitState();
      } else if (event.type === 'ratechange') {
        if (target === this.video) this._emitState();
      } else if (event.type === 'loadedmetadata' || event.type === 'durationchange') {
        if (target === this.video) {
          this._refreshMeta();
        } else {
          this.scan({ silent: true });
        }
      }
    }

    _onTimeUpdate() {
      const now = Date.now();
      if (now - this.lastTimeEmit < 180) return;
      this.lastTimeEmit = now;
      this.emit('time', this.getState());
    }

    _poll() {
      if (location.href !== this.lastUrl) {
        this.lastUrl = location.href;
        this.scan({ silent: true });
      }
      if (!this.video || !isVisible(this.video)) {
        this.scan({ silent: true });
        return;
      }
      this._emitTime();
    }

    _emitTime() {
      const now = Date.now();
      if (now - this.lastTimeEmit < 450) return;
      this.lastTimeEmit = now;
      this.emit('time', this.getState());
    }

    _emitState() {
      this.emit('time', this.getState());
    }

    scan({ silent = false } = {}) {
      let videos = [...document.querySelectorAll('video')];
      if (!videos.length) {
        const shadowVideos = [];
        collectVideosFromShadow(document, shadowVideos);
        videos = shadowVideos;
      }
      const candidates = videos.filter(isVisible);
      if (!candidates.length) {
        if (this.video) {
          this.video = null;
          this.meta = null;
          this.key = '';
          this.emit('change', null);
        } else if (!silent) {
          this.emit('change', null);
        }
        return;
      }

      const score = (video) => {
        const rect = video.getBoundingClientRect();
        let value = Math.min(rect.width * rect.height, innerWidth * innerHeight);
        if (!video.paused) value *= 2.2;
        if (video === this.video) value *= 1.15;
        if (Number(video.duration) > 0) value += 500;
        if (video.videoWidth > 0) value += 500;
        return value;
      };
      candidates.sort((a, b) => score(b) - score(a));
      const best = candidates[0];
      if (best !== this.video) {
        this._select(best);
      } else {
        this._refreshMeta();
      }
    }

    _select(video) {
      this.video = video;
      this._refreshMeta(true);
    }

    _refreshMeta(forceChange = false) {
      if (!this.video) return;
      const next = this._buildMeta();
      const durationChanged =
        !!this.meta &&
        this.meta.key === next.key &&
        Math.abs((Number(this.meta.duration) || 0) - (Number(next.duration) || 0)) > 0.5;
      const changed =
        forceChange ||
        !this.meta ||
        this.meta.key !== next.key ||
        this.meta.title !== next.title ||
        this.meta.url !== next.url ||
        durationChanged;
      this.meta = next;
      this.key = next.key;
      if (changed) this.emit('change', next);
    }

    _normalizedPageUrl() {
      try {
        const url = new URL(location.href);
        const keep = [
          'v', 'bvid', 'aid', 'p', 'list', 'index', 'episode_id', 'course', 'lesson',
          'video_id', 'lecture', 'cid', 'chapter', 'id'
        ];
        const params = new URLSearchParams();
        for (const key of keep) {
          if (url.searchParams.has(key)) params.set(key, url.searchParams.get(key));
        }
        let path = url.pathname.replace(/\/+$/, '') || '/';
        if (path === '/' && url.hash.startsWith('#/')) path = url.hash.replace(/#/g, '');
        const query = params.toString();
        return `${url.origin}${path}${query ? `?${query}` : ''}`;
      } catch (_) {
        return location.href.split('#')[0];
      }
    }

    _videoSourceHint() {
      const src = this.video?.currentSrc || this.video?.src || '';
      if (!src || src.startsWith('blob:') || src.startsWith('data:')) return '';
      try {
        const url = new URL(src);
        const path = url.pathname;
        if (/\.(m3u8|mp4|webm|flv|mkv)$/i.test(path)) return `${url.host}${path}`;
        return '';
      } catch (_) {
        return '';
      }
    }

    _buildMeta() {
      const video = this.video;
      if (!video) return null;
      const pageUrl = this._normalizedPageUrl();
      const sourceHint = this._videoSourceHint();
      let key = pageUrl;
      try {
        const path = new URL(pageUrl).pathname;
        if ((path === '/' || path === '') && sourceHint) key += `::${sourceHint}`;
      } catch (_) {
        /* ignore */
      }
      return {
        key,
        url: location.href,
        title: this._detectTitle(),
        site: FN.hostLabel(location.hostname),
        hostname: location.hostname,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        currentTime: Number(video.currentTime) || 0,
        paused: video.paused,
        playbackRate: video.playbackRate || 1,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        poster: video.poster || '',
        muted: video.muted,
        volume: video.volume
      };
    }

    _detectTitle() {
      const clean = (value) =>
        FN.cleanText(value)
          .replace(/\s*[-–—|]\s*(YouTube|哔哩哔哩|bilibili|Vimeo|Coursera|Udemy|TED|网易公开课)\s*$/i, '')
          .replace(/\s*_哔哩哔哩_bilibili\s*$/i, '')
          .replace(/\s*-\s*Microsoft.*$/i, '')
          .trim();

      const candidates = [];
      const og = document.querySelector('meta[property="og:title"]')?.content;
      if (og) candidates.push(og);
      const itemprop = document.querySelector('meta[itemprop="name"]')?.content;
      if (itemprop) candidates.push(itemprop);
      candidates.push(
        document.querySelector('h1.video-title, .video-title h1, h1[title], .bpx-player-video-info-title')?.textContent,
        document.title,
        this.video?.title,
        this.video?.getAttribute('aria-label')
      );
      const pageTitle = clean(document.title);
      for (const candidate of candidates) {
        const value = clean(candidate);
        if (!value) continue;
        if (value.length < 3) continue;
        if (/^(视频|播放器|video|watch)$/i.test(value)) continue;
        if (document.title && clean(document.title).length > 0) {
          return value.slice(0, 180);
        }
        return value.slice(0, 180);
      }
      return pageTitle || '网页视频';
    }

    getState() {
      const video = this.video;
      if (!video) {
        return {
          found: false,
          time: 0,
          duration: 0,
          paused: true,
          rate: 1,
          meta: this.meta
        };
      }
      return {
        found: true,
        time: Number(video.currentTime) || 0,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        paused: video.paused,
        ended: video.ended,
        rate: video.playbackRate || 1,
        buffered: this._bufferedEnd(),
        meta: this.meta || this._buildMeta()
      };
    }

    _bufferedEnd() {
      const video = this.video;
      if (!video || !video.buffered?.length) return 0;
      try {
        return video.buffered.end(video.buffered.length - 1);
      } catch (_) {
        return 0;
      }
    }

    async toggle() {
      if (!this.video) throw new Error('当前页面没有可播放的视频');
      if (this.video.paused) await this.video.play();
      else this.video.pause();
    }

    async play() {
      if (!this.video) return;
      try {
        await this.video.play();
      } catch (error) {
        throw new Error('浏览器阻止了播放，请先点击一次视频。');
      }
    }

    pause() {
      this.video?.pause();
    }

    jump(delta) {
      if (!this.video) return;
      this.seekTo((Number(this.video.currentTime) || 0) + delta);
    }

    seekTo(seconds, { play = false } = {}) {
      if (!this.video) return false;
      const duration = Number.isFinite(this.video.duration) ? this.video.duration : 0;
      const value = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, Number(seconds) || 0));
      this.suppressPause = true;
      try {
        this.video.currentTime = value;
      } finally {
        setTimeout(() => {
          this.suppressPause = false;
        }, 250);
      }
      this.emit('seek', { time: value });
      if (play) this.video.play().catch(() => {});
      this._emitTime();
      return true;
    }

    cycleSpeed() {
      if (!this.video) return 1;
      const current = this.video.playbackRate || 1;
      const index = SPEEDS.indexOf(current);
      const next = SPEEDS[(index + 1) % SPEEDS.length] || 1;
      this.video.playbackRate = next;
      this.emit('time', this.getState());
      return next;
    }

    async capture(options = {}) {
      const video = this.video;
      if (!video) throw new Error('当前页面没有检测到视频');
      if (!video.videoWidth || !video.videoHeight) {
        throw new Error('视频画面尚未加载，请先播放一下视频再试。');
      }
      const maxWidth = options.maxWidth || 1280;
      const quality = options.quality ?? 0.9;
      const width = video.videoWidth;
      const height = video.videoHeight;
      const scale = Math.min(1, maxWidth / width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      let dataUrl;
      try {
        dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl || dataUrl === 'data:,') throw new Error('empty');
      } catch (error) {
        dataUrl = await this._captureVisibleFallback(quality);
      }
      return {
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        time: Number(video.currentTime) || 0,
        paused: video.paused,
        capturedAt: new Date().toISOString(),
        mode: 'video'
      };
    }

    async _captureVisibleFallback(quality) {
      const rect = this.video.getBoundingClientRect();
      const visible = {
        left: Math.max(0, rect.left),
        top: Math.max(0, rect.top),
        right: Math.min(innerWidth, rect.right),
        bottom: Math.min(innerHeight, rect.bottom)
      };
      if (visible.right - visible.left < 80 || visible.bottom - visible.top < 50) {
        throw new Error('视频画面不在可视区域，请让视频完整显示后再截图。');
      }

      let restore = null;
      try {
        if (this.beforeFallbackCapture) restore = await this.beforeFallbackCapture();
        await FN.sleep(80);
        const response = await chrome.runtime.sendMessage({ type: 'fn:capture-visible' });
        if (!response?.ok) throw new Error(response?.error || '浏览器截屏失败');
        const image = await FN.imageFromDataUrl(response.dataUrl);
        const ratio = image.naturalWidth / innerWidth;
        const crop = document.createElement('canvas');
        crop.width = Math.max(1, Math.round((visible.right - visible.left) * ratio));
        crop.height = Math.max(1, Math.round((visible.bottom - visible.top) * ratio));
        const ctx = crop.getContext('2d');
        ctx.drawImage(
          image,
          visible.left * ratio,
          visible.top * ratio,
          (visible.right - visible.left) * ratio,
          (visible.bottom - visible.top) * ratio,
          0,
          0,
          crop.width,
          crop.height
        );
        let output = crop;
        if (crop.width > 1600) {
          output = document.createElement('canvas');
          output.width = 1600;
          output.height = Math.max(1, Math.round((crop.height * 1600) / crop.width));
          const outCtx = output.getContext('2d');
          outCtx.imageSmoothingEnabled = true;
          outCtx.imageSmoothingQuality = 'high';
          outCtx.drawImage(crop, 0, 0, output.width, output.height);
        }
        return output.toDataURL('image/webp', quality);
      } catch (error) {
        throw new Error(
          `受网站跨域保护限制，无法直接读取视频画面。${error?.message ? `（${error.message}）` : ''}`
        );
      } finally {
        if (typeof restore === 'function') restore();
      }
    }

    async captureAt(seconds, options = {}) {
      const video = this.video;
      if (!video) throw new Error('当前页面没有检测到视频');
      const wasPaused = video.paused;
      const originalTime = video.currentTime;
      const target = Math.max(0, Math.min(Number.isFinite(video.duration) ? video.duration - 0.05 : seconds, seconds));
      try {
        this.suppressPause = true;
        if (Math.abs(originalTime - target) > 0.35) {
          await new Promise((resolve, reject) => {
            let done = false;
            const onSeeked = () => {
              if (done) return;
              done = true;
              video.removeEventListener('seeked', onSeeked);
              clearTimeout(timer);
              resolve();
            };
            const timer = setTimeout(() => {
              if (done) return;
              done = true;
              video.removeEventListener('seeked', onSeeked);
              resolve();
            }, 2500);
            video.addEventListener('seeked', onSeeked, { once: true });
            video.currentTime = target;
            if (Math.abs(video.currentTime - target) < 0.05) {
              setTimeout(onSeeked, 120);
            }
          });
        }
        await FN.sleep(120);
        return await this.capture(options);
      } finally {
        try {
          video.currentTime = originalTime;
          if (!wasPaused) video.play().catch(() => {});
        } catch (_) {
          /* ignore */
        }
        setTimeout(() => {
          this.suppressPause = false;
        }, 350);
      }
    }

    async extractCaptions() {
      const video = this.video;
      if (!video) throw new Error('当前页面没有检测到视频');
      let segments = [];
      let source = '';

      const tracks = [...(video.textTracks || [])].filter(
        (track) => track.kind === 'subtitles' || track.kind === 'captions'
      );
      for (const track of tracks) {
        try {
          const previousMode = track.mode;
          track.mode = 'hidden';
          await FN.sleep(350);
          const cues = track.cues ? [...track.cues] : [];
          if (cues.length) {
            const parsed = cues
              .map((cue) => ({
                id: FN.uid('seg'),
                start: Number(cue.startTime) || 0,
                end: Number(cue.endTime) || Number(cue.startTime) + 2,
                text: stripCueHtml(cue.text),
                source: 'subtitle'
              }))
              .filter((cue) => cue.text);
            if (parsed.length > segments.length) {
              segments = parsed;
              source = track.label || '视频字幕';
            }
          }
          if (previousMode && previousMode !== 'disabled') track.mode = previousMode;
        } catch (_) {
          /* 跨域字幕可能无法读取 */
        }
      }

      if (!segments.length) {
        const trackEls = [...video.querySelectorAll('track')];
        for (const trackEl of trackEls) {
          const src = trackEl.src;
          if (!src) continue;
          try {
            const response = await fetch(src, { credentials: 'include' });
            if (!response.ok) continue;
            const text = await response.text();
            const parsed = FN.parseSubtitle(text);
            if (parsed.length > segments.length) {
              segments = parsed;
              source = trackEl.label || '视频字幕';
            }
          } catch (_) {
            /* CORS */
          }
        }
      }

      segments = segments
        .filter((segment) => segment.text)
        .sort((a, b) => a.start - b.start)
        .map((segment, index, list) => ({
          ...segment,
          end: segment.end || list[index + 1]?.start || segment.start + 3
        }));

      if (!segments.length) {
        throw new Error('这个视频没有可读取的字幕轨。你可以在「文稿」中导入 SRT / VTT，或使用 AI 录音转写。');
      }
      return { segments, source: source || '视频字幕' };
    }

    getAudioStream() {
      const video = this.video;
      if (!video) throw new Error('当前页面没有检测到视频');
      if (typeof video.captureStream !== 'function') {
        throw new Error('当前浏览器不支持从视频元素捕获音频。');
      }
      let stream;
      try {
        stream = video.captureStream();
      } catch (error) {
        throw new Error(`受网站跨域或版权保护限制，无法捕获视频音频（${error?.message || 'captureStream 失败'}）。`);
      }
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) {
        throw new Error('视频没有可捕获的音轨。若视频为静音课件，请改用「导入字幕」或「视频识字」。');
      }
      return new MediaStream(audioTracks);
    }

    scrollIntoView() {
      this.video?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  FN.VideoTracker = VideoTracker;
  FN.VIDEO_SPEEDS = SPEEDS;
})();
