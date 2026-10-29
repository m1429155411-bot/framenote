/* 帧记 · 速览 / 导图 / 练习 / AI 助手 */
(() => {
  const FN = globalThis.FN;
  const App = FN.App;
  const Insights = (FN.Insights = {});

  const el = (name) => App.el(name);
  const state = App.state;

  function esc(value) {
    return FN.escapeHtml(value);
  }

  function currentTime() {
    return Number(App.tracker?.video?.currentTime) || 0;
  }

  function emptyState({ icon, title, text, actions = '' }) {
    return `
      <div class="fn-empty is-card">
        <div class="fn-empty-art">${FN.icon(icon, 25)}</div>
        <h3>${esc(title)}</h3>
        <p>${text}</p>
        ${actions ? `<div class="fn-empty-actions">${actions}</div>` : ''}
      </div>`;
  }

  /* ------------------------------------------------------------------------
   * AI 进度弹窗
   * ---------------------------------------------------------------------- */

  async function withProgress({ title, subtitle, steps, run, retry }) {
    if (state.aiBusy) {
      App.toast('AI 正在处理上一个任务，请稍等一下', 'info', 2200);
      return null;
    }
    state.aiBusy = true;
    const stepsHtml = steps
      .map(
        (label, index) => `
        <div class="fn-progress-step" data-step="${index}">
          <span class="fn-progress-step-icon">${index === 0 ? '<span class="fn-spinner"></span>' : FN.icon('clock', 12)}</span>
          <span data-step-label>${esc(label)}</span>
        </div>`
      )
      .join('');
    // 使用面板内联进度，而不是全屏遮罩：视频区域始终可见，总结在后台继续跑。
    const handle = FN.UI.inlineProgress({
      title: title || 'AI 正在工作',
      subtitle: subtitle || '可以继续观看视频，完成后会提示你',
      body: `
        <div class="fn-inline-progress-content">
          <p data-progress-text>正在读取视频上下文…</p>
          <div class="fn-progress-bar"><i data-progress-bar style="width:6%"></i></div>
          <div class="fn-progress-steps">${stepsHtml}</div>
          <div class="fn-progress-controls">
            <button class="fn-progress-stop" type="button" data-progress-stop>停止</button>
          </div>
          <div data-progress-error style="display:none;width:100%;margin-top:10px"></div>
        </div>`
    });
    const modal = handle.card;
    let current = -1;
    let stopped = false;
    let rejectAbort = null;
    const controller = new AbortController();
    const abortPromise = new Promise((_, reject) => {
      rejectAbort = reject;
    });

    function abortError() {
      const error = new Error('AI 任务已停止');
      error.name = 'AbortError';
      return error;
    }

    function throwIfAborted() {
      if (controller.signal.aborted) throw abortError();
    }

    function markStep(index) {
      if (index === current) return;
      current = index;
      for (const node of modal.querySelectorAll('.fn-progress-step')) {
        const i = Number(node.dataset.step);
        node.classList.toggle('is-active', i === index);
        node.classList.toggle('is-done', i < index);
        node.classList.toggle('is-error', false);
        const icon = node.querySelector('.fn-progress-step-icon');
        if (i < index) icon.innerHTML = FN.icon('check', 12);
        else if (i === index) icon.innerHTML = '<span class="fn-spinner"></span>';
        else icon.innerHTML = FN.icon('clock', 12);
      }
      const bar = modal.querySelector('[data-progress-bar]');
      if (bar) bar.style.width = `${Math.min(94, ((index + 0.35) / steps.length) * 100)}%`;
    }

    function detail(text) {
      const node = modal.querySelector('[data-progress-text]');
      if (node) node.textContent = text;
    }

    function fail(error) {
      for (const node of modal.querySelectorAll('.fn-progress-step.is-active')) {
        node.classList.add('is-error');
        node.classList.remove('is-active');
        const icon = node.querySelector('.fn-progress-step-icon');
        if (icon) icon.innerHTML = FN.icon('close', 12);
      }
      const bar = modal.querySelector('[data-progress-bar]');
      if (bar) {
        bar.style.width = '100%';
        bar.style.background = 'var(--fn-danger)';
      }
      const errorNode = modal.querySelector('[data-progress-error]');
      if (errorNode) {
        errorNode.style.display = 'block';
        errorNode.innerHTML = `
          <div class="fn-explanation" style="margin:0 0 10px">${FN.UI.formatError(error)}</div>
          <button class="fn-btn is-sm is-primary" type="button" data-progress-close>知道了</button>`;
        errorNode.querySelector('[data-progress-close]')?.addEventListener('click', () => handle.close());
      }
      const titleNode = modal.querySelector('[data-progress-title]');
      if (titleNode) titleNode.textContent = '这次没有完成';
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      controller.abort();
      rejectAbort?.(abortError());
      const stopButton = modal.querySelector('[data-progress-stop]');
      if (stopButton) {
        stopButton.disabled = true;
        stopButton.textContent = '正在停止…';
      }
    }

    function showStopped() {
      const body = modal.querySelector('.fn-inline-progress-content');
      if (!body) return;
      const bar = modal.querySelector('[data-progress-bar]');
      if (bar) {
        bar.style.width = '100%';
        bar.style.background = 'var(--fn-line-strong)';
      }
      const titleNode = modal.querySelector('[data-progress-title]');
      if (titleNode) titleNode.textContent = 'AI 任务已停止';
      const subtitleNode = modal.querySelector('[data-progress-subtitle]');
      if (subtitleNode) subtitleNode.textContent = '你可以继续重新生成，或关闭这条提示';
      body.innerHTML = `
        <div class="fn-progress-stopped">
          <b>已停止这次 AI 任务</b>
          <p>当前笔记不会被覆盖。需要的话可以从头继续生成。</p>
          <div class="fn-progress-controls">
            ${typeof retry === 'function' ? '<button class="fn-progress-resume" type="button" data-progress-resume>继续</button>' : ''}
            <button class="fn-progress-close" type="button" data-progress-close>关闭</button>
          </div>
        </div>`;
      body.querySelector('[data-progress-close]')?.addEventListener('click', () => handle.close());
      body.querySelector('[data-progress-resume]')?.addEventListener('click', () => {
        handle.close();
        setTimeout(() => retry?.(), 20);
      });
    }

    modal.querySelector('[data-progress-stop]')?.addEventListener('click', stop);
    FN.AI.setSignal(controller.signal);
    markStep(0);
    try {
      const result = await Promise.race([
        run({
          step: markStep,
          detail,
          progress: (value) => {
            const bar = modal.querySelector('[data-progress-bar]');
            if (bar) bar.style.width = `${Math.max(4, Math.min(96, value))}%`;
          },
          signal: controller.signal,
          throwIfAborted
        }),
        abortPromise
      ]);
      throwIfAborted();
      handle.close();
      return result;
    } catch (error) {
      if (stopped || error?.name === 'AbortError' || controller.signal.aborted) {
        console.info('[帧记] AI 任务已停止');
        showStopped();
        return null;
      }
      console.warn('[帧记] AI 任务失败', error);
      fail(error);
      if (!modal.isConnected) {
        App.toast(error?.message || 'AI 任务失败', 'error', 5000);
      }
      return null;
    } finally {
      state.aiBusy = false;
      FN.AI.setSignal(null);
    }
  }

  /* ------------------------------------------------------------------------
   * 内容准备
   * ---------------------------------------------------------------------- */

  function transcriptChars(note) {
    return (note?.transcript || []).reduce((sum, segment) => sum + String(segment.text || '').length, 0);
  }

  Insights.harvestFrames = async function harvestFrames(api, stepIndex) {
    const video = App.tracker?.video;
    if (!video) throw new Error('当前页面没有检测到视频，无法读取画面内容。');
    const duration = Number(video.duration);
    if (!Number.isFinite(duration) || duration < 4) {
      throw new Error('视频时长太短或仍在加载，无法抽取画面。');
    }
    const count = duration < 90 ? 4 : duration < 600 ? 6 : 7;
    const times = Array.from({ length: count }, (_, index) =>
      Math.min(duration - 1.5, Math.max(1, (duration * (index + 0.5)) / count))
    );
    const wasPaused = video.paused;
    if (!wasPaused) {
      App.tracker.pause();
      await FN.sleep(160);
    }
    const segments = [];
    const seen = new Set();
    try {
      for (let index = 0; index < times.length; index += 1) {
        api.throwIfAborted?.();
        const time = times[index];
        api.step(stepIndex);
        api.detail(`正在识别第 ${index + 1}/${times.length} 帧画面文字（${FN.fmtTime(time)}）…`);
        api.progress(12 + (index / times.length) * 58);
        try {
          const shot = await App.tracker.captureAt(time, { maxWidth: 1600, quality: 0.92 });
          const engine = FN.AI.canVision(state.settings) ? 'ai' : 'local';
          const result = await FN.AI.ocr(state.settings, shot.dataUrl, { engine });
          const text = FN.cleanText(result.text || '');
          const fingerprint = text.replace(/\s/g, '').slice(0, 60);
          if (text.length >= 4 && !seen.has(fingerprint)) {
            seen.add(fingerprint);
            segments.push({
              id: FN.uid('seg'),
              start: time,
              end: Math.min(duration, time + Math.max(3, duration / count)),
              text,
              source: 'ocr'
            });
          }
        } catch (error) {
          console.warn('[帧记] 抽帧 OCR 失败', time, error);
        }
      }
    } finally {
      if (!wasPaused) App.tracker.play().catch(() => {});
    }
    api.throwIfAborted?.();
    if (!segments.length) {
      throw new Error('没有从画面里识别到文字。这个视频可能是纯人声讲解，建议在「文稿」中导入字幕，或使用「AI 转写」。');
    }
    state.note.transcript = segments;
    state.note.transcriptSource = '画面 OCR（抽样，非逐字稿）';
    await App.persistNow();
    return segments;
  };

  Insights.ensureContent = async function ensureContent(api, stepIndex) {
    if (!state.note) throw new Error('笔记尚未载入');
    // 只要已经有有效文稿（包括视频结束前刚写入的自动识别结果），就使用文稿，
    // 不再用抽帧 OCR 去替换它；否则视频结束后的自动总结会把已记录内容冲掉。
    if ((state.note.transcript || []).some((segment) => String(segment.text || '').trim())) {
      api.detail(`已读取 ${state.note.transcript.length} 条字幕 / 文稿`);
      return App.context();
    }
    const notesText = [
      FN.stripHtml(state.note.richHtml || ''),
      (state.note.outline || []).map((node) => node.text).join('\n')
    ].join('\n');
    if (notesText.replace(/\s/g, '').length >= 120) {
      api.detail('已使用你已有的笔记作为上下文');
      return App.context();
    }
    if (!App.tracker?.video) {
      throw new Error('这个页面没有视频，也没有足够的笔记内容。请先写一些笔记，或打开一个视频页面。');
    }
    api.detail('没有找到字幕，正在抽取关键帧并识别画面文字…');
    await Insights.harvestFrames(api, stepIndex);
    return App.context();
  };

  /* ------------------------------------------------------------------------
   * AI 笔记
   * ---------------------------------------------------------------------- */

  Insights.generateNotes = async function generateNotes(template = state.template, options = {}) {
    if (!App.requireAI() || !App.requireNote()) return;
    App.Notes.syncRichToNote();
    const labels = { rich: '图文笔记', outline: '大纲笔记', transcript: '文稿笔记' };
    const existing =
      template === 'rich'
        ? FN.stripHtml(state.note.richHtml || '').length > 20
        : template === 'outline'
          ? (state.note.outline || []).length > 0
          : (state.note.transcript || []).length > 0;
    if (existing) {
      // 不做全屏“覆盖确认”：先把上一版放进本地历史，生成过程中视频不会被弹窗遮住。
      const snapshot = {
        at: new Date().toISOString(),
        template,
        title: state.note.title
      };
      if (template === 'rich') snapshot.richHtml = state.note.richHtml || '';
      if (template === 'outline') snapshot.outline = JSON.parse(JSON.stringify(state.note.outline || []));
      if (template === 'transcript') {
        snapshot.transcript = JSON.parse(JSON.stringify(state.note.transcript || []));
        snapshot.transcriptSource = state.note.transcriptSource || '';
      }
      state.note.history = [...(state.note.history || []), snapshot].slice(-2);
    }

    const wantShots =
      template === 'rich' && state.settings.aiScreenshots !== false && !!App.tracker?.video;
    const steps = [
      '读取视频内容',
      wantShots ? '截取重点画面' : '提炼知识结构',
      '生成笔记内容',
      '整理时间戳与版式'
    ];
    const result = await withProgress({
      title: 'AI 正在整理视频笔记',
      subtitle: '字幕、时间戳与画面会一起理解',
      steps,
      run: async (api) => {
        const ctx = await Insights.ensureContent(api, 0);
        api.step(1);
        api.detail(wantShots ? '正在挑选最值得复习的画面…' : '正在梳理章节与知识点…');
        const generated = await FN.AI.generateNotes(state.settings, ctx, template);
        if (!generated.sections?.length) {
          throw new Error('AI 没有返回有效的笔记结构，请重试或换一个模型。');
        }

        const screenshots = new Map();
        if (wantShots) {
          const candidates = [];
          const seen = new Set();
          const sections = generated.sections || [];
          for (const section of sections.filter((item) => item.screenshot)) {
            if (section.ts != null && !seen.has(String(section.ts))) {
              seen.add(String(section.ts));
              candidates.push(section);
            }
          }
          for (const section of sections.filter((item) => item.star)) {
            if (section.ts != null && !seen.has(String(section.ts))) {
              seen.add(String(section.ts));
              candidates.push(section);
            }
          }
          for (const section of sections) {
            if (section.ts != null && !seen.has(String(section.ts))) {
              seen.add(String(section.ts));
              candidates.push(section);
            }
          }
          const picked = candidates.slice(0, 4);
          if (picked.length) {
            const video = App.tracker.video;
            const wasPaused = video.paused;
            if (!wasPaused) App.tracker.pause();
            try {
              for (let index = 0; index < picked.length; index += 1) {
                api.throwIfAborted?.();
                const section = picked[index];
                api.detail(`正在截取重点画面 ${index + 1}/${picked.length} · ${FN.fmtTime(section.ts)}`);
                api.progress(45 + (index / picked.length) * 20);
                try {
                  const shot = await App.tracker.captureAt(section.ts, {
                    maxWidth: 1280,
                    quality: 0.86
                  });
                  screenshots.set(String(section.ts), shot.dataUrl);
                } catch (error) {
                  console.warn('[帧记] 重点画面截取失败', error);
                }
              }
            } finally {
              if (!wasPaused) App.tracker.play().catch(() => {});
            }
          }
        }

        api.throwIfAborted?.();
        api.step(2);
        api.detail('正在把知识点写成可复习的笔记…');
        const aiTitle = generated.title || '';
        if (
          aiTitle &&
          (!state.note.title ||
            state.note.title === '未命名视频' ||
            state.note.title === state.videoMeta?.title)
        ) {
          state.note.title = aiTitle.slice(0, 60);
        }
        if (template === 'rich') {
          state.note.richHtml = App.Notes.buildRichFromAI(generated, screenshots);
        } else if (template === 'outline') {
          state.note.outline = App.Notes.buildOutlineFromAI(generated);
        } else if (template === 'transcript') {
          const keepRealTranscript =
            (state.note.transcript || []).length > 0 &&
            !/OCR/.test(state.note.transcriptSource || '');
          if (!keepRealTranscript) {
            state.note.transcript = App.Notes.buildTranscriptFromAI(generated);
            state.note.transcriptSource = 'AI 整理稿（基于视频内容）';
          }
        }
        state.note.ai = {
          title: aiTitle,
          overview: generated.overview,
          keywords: generated.keywords || [],
          sections: generated.sections,
          summaryTable: generated.summaryTable || [],
          template,
          generatedAt: new Date().toISOString()
        };
        state.note.template = template;
        state.template = template;
        api.step(3);
        api.detail('正在排版并绑定可点击的时间戳…');
        await FN.sleep(220);
        return generated;
      },
      retry: () => Insights.generateNotes(template, options)
    });

    if (!result) return;
    state.view = 'notes';
    state.mapSource = template === 'outline' ? 'outline' : state.mapSource;
    await App.persistNow();
    App.renderAll();
    App.setView('notes');
    App.toast(`${labels[template]}生成完成，点击时间戳可回到视频`, 'success', 3600);
    state.lastAutoSnapshot = Date.now();
  };

  Insights.restoreLastAI = function restoreLastAI() {
    if (!state.note?.history?.length) {
      App.toast('还没有可恢复的 AI 生成前版本', 'info');
      return;
    }
    const snapshot = state.note.history.pop();
    if (snapshot.title) state.note.title = snapshot.title;
    if (snapshot.template === 'rich' && typeof snapshot.richHtml === 'string') {
      state.note.richHtml = snapshot.richHtml;
    }
    if (snapshot.template === 'outline' && Array.isArray(snapshot.outline)) {
      state.note.outline = snapshot.outline;
    }
    if (snapshot.template === 'transcript' && Array.isArray(snapshot.transcript)) {
      state.note.transcript = snapshot.transcript;
      state.note.transcriptSource = snapshot.transcriptSource || state.note.transcriptSource;
    }
    state.template = snapshot.template;
    state.note.template = snapshot.template;
    state.view = 'notes';
    App.renderAll();
    App.setView('notes');
    App.persistNow();
    App.toast('已恢复 AI 生成前版本', 'success');
  };

  /* ------------------------------------------------------------------------
   * 速览
   * ---------------------------------------------------------------------- */

  Insights.generateSummary = async function generateSummary(options = {}) {
    if (!App.requireAI() || !App.requireNote()) return;
    App.Notes.syncRichToNote();
    const steps = ['读取视频内容', '分段理解', '生成速览与知识小结'];
    const result = await withProgress({
      title: 'AI 正在生成速览',
      subtitle: '先看全局，再决定从哪里开始复习',
      steps,
      run: async (api) => {
        const ctx = await Insights.ensureContent(api, 0);
        api.step(1);
        api.detail('正在按时间顺序拆分章节…');
        const summary = await FN.AI.generateSummary(state.settings, ctx);
        if (!summary.overview && !summary.chapters.length) {
          throw new Error('AI 没有返回有效的速览内容，请重试。');
        }
        api.step(2);
        api.detail('正在整理关键词和知识小结…');
        state.note.summary = summary;
        if (!state.note.ai) state.note.ai = { generatedAt: new Date().toISOString() };
        if (summary.terms?.length) state.note.ai.summaryTable = summary.terms;
        return summary;
      },
      retry: () => Insights.generateSummary(options)
    });
    if (!result) return;
    await App.persistNow();
    if (options.auto) {
      // 后台总结：不抢占当前标签、不遮挡视频，只更新“速览”数据并提示。
      App.renderAll();
      App.toast('音频总结已自动生成，可在「速览」查看', 'success', 3600);
    } else {
      state.view = 'summary';
      App.renderAll();
      App.setView('summary');
      App.toast('速览已生成，点击章节时间可跳转', 'success');
    }
  };

  Insights.renderSummary = function renderSummary() {
    const container = el('summaryContent');
    if (!container || !state.note) return;
    const summary = state.note.summary;
    if (!summary) {
      const configured = FN.AI.isConfigured(state.settings);
      container.innerHTML = `
        <div class="fn-view-head">
          <div>
            <div class="fn-view-title">AI 速览</div>
            <div class="fn-view-sub">摘要 · 分段总结 · 重点 · 知识小结</div>
          </div>
        </div>
        ${emptyState({
          icon: 'eye',
          title: '先花 1 分钟看懂整个视频',
          text: 'AI 会按时间顺序整理总览、关键结论和章节，每个章节都能点回原片位置。',
          actions: configured
            ? '<button class="fn-btn is-sm is-primary" type="button" data-act="summary-generate">生成速览</button><button class="fn-btn is-sm" type="button" data-act="extract-captions">先提取字幕</button>'
            : '<button class="fn-btn is-sm is-primary" type="button" data-act="open-settings">配置 AI</button>'
        })}`;
      return;
    }

    const keywords = state.note.ai?.keywords || [];
    const chapters = summary.chapters || [];
    const keyPoints = summary.keyPoints || [];
    container.innerHTML = `
      <div class="fn-view-head">
        <div>
          <div class="fn-view-title">AI 速览</div>
          <div class="fn-view-sub">生成于 ${esc(FN.fmtRelative(summary.generatedAt))} · ${chapters.length} 个章节 · 点击时间跳转</div>
        </div>
        <div class="fn-view-actions">
          <button class="fn-btn is-xs" type="button" data-act="summary-generate">${FN.icon('refresh', 11)} 重新生成</button>
        </div>
      </div>

      <div class="fn-overview-card">
        <div class="fn-overview-eyebrow">${FN.icon('sparkles', 11)} AI OVERVIEW</div>
        <p class="fn-overview-text">${esc(summary.overview || '暂无总览')}</p>
        ${keywords.length ? `<div class="fn-keyword-row">${keywords.slice(0, 8).map((keyword) => `<span class="fn-chip is-primary">${esc(keyword)}</span>`).join('')}</div>` : ''}
      </div>

      ${keyPoints.length ? `<div class="fn-section-label">${FN.icon('lightbulb', 12)} 关键结论</div><div class="fn-keypoint-grid">${keyPoints.slice(0, 6).map((point, index) => `<div class="fn-keypoint"><span class="fn-keypoint-num">${index + 1}</span><p>${esc(point)}</p></div>`).join('')}</div>` : ''}

      ${chapters.length ? `<div class="fn-section-label">${FN.icon('list', 12)} 分段总结</div><div data-el="summaryChapters">${chapters.map((chapter) => `
        <div class="fn-chapter">
          <div class="fn-chapter-time">${chapter.ts != null ? `<button class="fn-ts" type="button" data-ts="${Number(chapter.ts)}">${FN.fmtTime(chapter.ts)}</button>` : ''}</div>
          <div class="fn-chapter-body">
            <h4 class="fn-chapter-title">${esc(chapter.title || '')}</h4>
            ${chapter.summary ? `<p class="fn-chapter-summary">${esc(chapter.summary)}</p>` : ''}
            ${chapter.keyPoints?.length ? `<ul class="fn-chapter-points">${chapter.keyPoints.map((point) => `<li>${esc(point)}</li>`).join('')}</ul>` : ''}
          </div>
        </div>`).join('')}</div>` : ''}

      ${summary.terms?.length ? `<div class="fn-section-label">${FN.icon('file', 12)} 知识小结</div><table class="fn-term-table"><thead><tr><th>概念 / 术语</th><th>一句话解释</th></tr></thead><tbody>${summary.terms.map((row) => `<tr><th>${esc(row.term)}</th><td>${esc(row.explain)}</td></tr>`).join('')}</tbody></table>` : ''}

      <div style="display:flex;gap:6px;margin-top:14px;flex-wrap:wrap">
        <button class="fn-btn is-sm" type="button" data-act="summary-to-map">${FN.icon('brain', 12)} 用速览生成导图</button>
        <button class="fn-btn is-sm" type="button" data-act="summary-share">${FN.icon('share', 12)} 生成分享长图</button>
        <button class="fn-btn is-sm" type="button" data-act="export">${FN.icon('download', 12)} 导出</button>
      </div>`;
    FN.linkifyTimestamps(container.querySelector('[data-el="summaryChapters"]') || container);
  };

  /* ------------------------------------------------------------------------
   * 思维导图
   * ---------------------------------------------------------------------- */

  Insights.getMapTree = function getMapTree() {
    if (!state.note) return null;
    if (state.mapSource === 'outline') {
      return FN.Mindmap.fromOutline(state.note.outline, state.note.title);
    }
    if (state.mapSource === 'summary') {
      return FN.Mindmap.fromSummary(state.note.summary, state.note.title);
    }
    return FN.Mindmap.normalizeTree(state.note.mindmap, state.note.title);
  };

  Insights.generateMap = async function generateMap() {
    if (!App.requireAI() || !App.requireNote()) return;
    App.Notes.syncRichToNote();
    const steps = ['读取视频内容', '提炼知识结构', '生成思维导图'];
    const result = await withProgress({
      title: 'AI 正在画思维导图',
      subtitle: '把章节与要点折叠成一张可下载的知识地图',
      steps,
      run: async (api) => {
        const ctx = await Insights.ensureContent(api, 0);
        api.step(1);
        api.detail('正在提炼一级分支和重点节点…');
        const tree = await FN.AI.generateMindmap(state.settings, ctx);
        if (!tree) throw new Error('AI 没有返回有效的导图结构，请重试。');
        api.step(2);
        api.detail('正在计算节点布局…');
        state.note.mindmap = tree;
        state.mapSource = 'ai';
        state.mapZoom = 1;
        return tree;
      },
      retry: () => Insights.generateMap()
    });
    if (!result) return;
    await App.persistNow();
    App.renderAll();
    App.setView('map');
    App.toast('思维导图已生成，可下载 PNG / SVG', 'success');
  };

  Insights.renderMap = function renderMap() {
    const container = el('mapContent');
    if (!container || !state.note) return;
    const outlineCount = (state.note.outline || []).length;
    const hasAiMap = !!state.note.mindmap;
    const hasSummary = !!state.note.summary;
    if (state.mapSource === 'ai' && !hasAiMap) {
      if (outlineCount) state.mapSource = 'outline';
      else if (hasSummary) state.mapSource = 'summary';
    }
    const tree = Insights.getMapTree();
    const sourceSwitch = `
      <div class="fn-map-source" role="tablist">
        <button type="button" data-map-source="ai" class="${state.mapSource === 'ai' ? 'is-active' : ''}" ${hasAiMap ? '' : 'title="还没有 AI 导图"'}>AI 导图</button>
        <button type="button" data-map-source="outline" class="${state.mapSource === 'outline' ? 'is-active' : ''}" ${outlineCount ? '' : 'title="大纲为空"'}>大纲</button>
        <button type="button" data-map-source="summary" class="${state.mapSource === 'summary' ? 'is-active' : ''}" ${hasSummary ? '' : 'title="还没有速览"'}>速览</button>
      </div>`;

    if (!tree) {
      const configured = FN.AI.isConfigured(state.settings);
      container.innerHTML = `
        <div class="fn-view-head">
          <div>
            <div class="fn-view-title">思维导图</div>
            <div class="fn-view-sub">从视频内容提炼结构，支持下载 PNG / SVG / Markdown</div>
          </div>
          ${sourceSwitch}
        </div>
        ${emptyState({
          icon: 'brain',
          title: '把零散知识连成一张图',
          text: outlineCount
            ? '你已经有大纲了，可以直接转成导图；也可以让 AI 重新提炼更凝练的分支。'
            : 'AI 会从字幕、画面文字中提炼 2-5 个一级分支，并标出重点。也可以先写大纲，再一键转图。',
          actions: [
            outlineCount
              ? '<button class="fn-btn is-sm is-primary" type="button" data-act="map-from-outline">从大纲生成</button>'
              : '',
            configured
              ? '<button class="fn-btn is-sm ' + (outlineCount ? '' : 'is-primary') + '" type="button" data-act="map-generate">AI 提炼导图</button>'
              : '<button class="fn-btn is-sm is-primary" type="button" data-act="open-settings">配置 AI</button>',
            hasSummary ? '<button class="fn-btn is-sm" type="button" data-act="map-from-summary">从速览生成</button>' : ''
          ].join('')
        })}`;
      return;
    }

    const count = FN.Mindmap.countNodes(tree);
    const stars = (() => {
      let total = 0;
      const walk = (node) => {
        if (node.star) total += 1;
        for (const child of node.children || []) walk(child);
      };
      walk(tree);
      return total;
    })();
    container.innerHTML = `
      <div class="fn-view-head">
        <div>
          <div class="fn-view-title">思维导图</div>
          <div class="fn-view-sub">${count} 个知识点${stars ? ` · ${stars} 个重点` : ''} · 点击带时间的节点可跳转</div>
        </div>
      </div>
      <div class="fn-map-toolbar">
        ${sourceSwitch}
        <div class="fn-spacer"></div>
        <button class="fn-btn is-xs" type="button" data-act="map-generate" title="重新用 AI 提炼">${FN.icon('sparkles', 11)} AI</button>
        <button class="fn-btn is-xs" type="button" data-act="map-download">${FN.icon('download', 11)} 下载</button>
        <button class="fn-btn is-xs" type="button" data-act="map-fullscreen" title="全屏查看">${FN.icon('expand', 11)} 全屏</button>
      </div>
      <div class="fn-map-shell">
        <div class="fn-map-stage" data-el="mapStage">
          <div class="fn-map-inner" data-el="mapInner"></div>
        </div>
        <div class="fn-map-zoom">
          <button type="button" data-act="map-zoom-out" title="缩小">${FN.icon('zoomOut', 13)}</button>
          <span data-el="mapZoomLabel">100%</span>
          <button type="button" data-act="map-zoom-in" title="放大">${FN.icon('zoomIn', 13)}</button>
          <button type="button" data-act="map-zoom-fit" title="适应窗口">${FN.icon('compress', 12)}</button>
        </div>
      </div>
      <div class="fn-map-tip">${FN.icon('lightbulb', 10)} 全屏查看更清晰 · Ctrl/⌘ + 滚轮缩放 · 拖动画布浏览 · ★ 为重点</div>
      <div class="fn-map-legend">
        <span><i style="background:#eef4df;border:1px solid #d3e2b7"></i>一级分支</span>
        <span><i style="background:#f2f8e4;border:1px solid #bad67f"></i>重点</span>
        <span><i style="background:#fff;border:1px solid #e3e3da"></i>知识点</span>
      </div>`;
    const inner = el('mapInner');
    const built = FN.Mindmap.renderTo(inner, tree, { title: state.note.title });
    state.mapTree = tree;
    state.mapBuilt = built;
    if (built) {
      const stage = el('mapStage');
      if (stage) {
        stage.scrollLeft = 0;
        stage.scrollTop = 0;
      }
      setTimeout(() => Insights.applyMapZoom(state.mapZoom, true), 30);
      Insights.bindMapDrag();
    }
  };

  Insights.applyMapZoom = function applyMapZoom(zoom, fit = false) {
    const built = state.mapBuilt;
    const inner = el('mapInner');
    const svg = inner?.querySelector('svg');
    if (!built || !svg) return;
    const stage = el('mapStage');
    if (fit) {
      const available = Math.max(280, (stage?.clientWidth || 400) - 8);
      zoom = Math.min(1, available / built.width);
    }
    zoom = Math.max(0.35, Math.min(1.8, Number(zoom) || 1));
    state.mapZoom = zoom;
    svg.style.width = `${Math.round(built.width * zoom)}px`;
    svg.style.height = `${Math.round(built.height * zoom)}px`;
    const stageWidth = stage?.clientWidth || 0;
    inner.classList.toggle('is-centered', built.width * zoom < stageWidth - 4);
    if (el('mapZoomLabel')) el('mapZoomLabel').textContent = `${Math.round(zoom * 100)}%`;
  };

  Insights.bindMapDrag = function bindMapDrag() {
    const stage = el('mapStage');
    if (!stage || stage.dataset.bound === '1') return;
    stage.dataset.bound = '1';
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    stage.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('.fn-map-node, button, a')) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      scrollLeft = stage.scrollLeft;
      scrollTop = stage.scrollTop;
      stage.classList.add('is-dragging');
      stage.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });
    stage.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      stage.scrollLeft = scrollLeft - (event.clientX - startX);
      stage.scrollTop = scrollTop - (event.clientY - startY);
    });
    const stop = () => {
      dragging = false;
      stage.classList.remove('is-dragging');
    };
    stage.addEventListener('pointerup', stop);
    stage.addEventListener('pointercancel', stop);
  };

  Insights.downloadMap = function downloadMap() {
    const tree = Insights.getMapTree();
    if (!tree) {
      App.toast('还没有可下载的导图', 'error');
      return;
    }
    const handle = FN.UI.openModal({
      title: '下载思维导图',
      subtitle: '高清图片适合分享，SVG 可继续编辑',
      icon: 'download',
      narrow: true,
      body: `
        <div style="display:flex;flex-direction:column;gap:7px">
          <button class="fn-btn" style="justify-content:flex-start" data-map-dl="png">${FN.icon('image', 15)} PNG 高清图片（2×）<span style="margin-left:auto;color:var(--fn-muted);font-size:9.5px">推荐</span></button>
          <button class="fn-btn" style="justify-content:flex-start" data-map-dl="svg">${FN.icon('file', 15)} SVG 矢量图（可编辑）</button>
          <button class="fn-btn" style="justify-content:flex-start" data-map-dl="markdown">${FN.icon('text', 15)} Markdown 大纲</button>
          <button class="fn-btn" style="justify-content:flex-start" data-map-dl="opml">${FN.icon('list', 15)} OPML（XMind / MindManager）</button>
        </div>`,
      onMount: (modal) => {
        modal.querySelectorAll('[data-map-dl]').forEach((button) => {
          button.addEventListener('click', async () => {
            const type = button.dataset.mapDl;
            handle.close();
            await Insights.exportMapAs(type, tree);
          });
        });
      }
    });
  };

  Insights.exportMapAs = async function exportMapAs(type, tree) {
    const title = state.note?.title || '视频思维导图';
    try {
      if (type === 'png') {
        App.toast('正在生成高清 PNG…');
        await FN.Mindmap.downloadPNG(tree, { title, filename: title });
        App.toast('PNG 已导出', 'success');
      } else if (type === 'svg') {
        await FN.Mindmap.downloadSVG(tree, { title, filename: title });
        App.toast('SVG 已导出', 'success');
      } else if (type === 'markdown') {
        await FN.Mindmap.downloadMarkdown(tree, { title, filename: title });
        App.toast('Markdown 已导出', 'success');
      } else if (type === 'opml') {
        const content = FN.Mindmap.toOPML(tree, title);
        await FN.downloadText(content, `${FN.slugify(title)}-思维导图.opml`, 'text/x-opml;charset=utf-8');
        App.toast('OPML 已导出', 'success');
      }
    } catch (error) {
      App.toast(`导出失败：${error?.message || error}`, 'error', 5000);
    }
  };

  Insights.openMapFullscreen = function openMapFullscreen() {
    const tree = Insights.getMapTree();
    if (!tree) return;
    const handle = FN.UI.openModal({
      title: '思维导图',
      subtitle: '可缩放、拖动查看；点击带时间的节点跳回视频',
      wide: true,
      body: '<div class="fn-map-shell" style="height:68vh"><div class="fn-map-stage" data-el="mapStageFull"><div class="fn-map-inner" data-el="mapInnerFull"></div></div></div>',
      footer: `
        <div style="display:flex;align-items:center;gap:3px;margin-right:auto">
          <button class="fn-btn is-xs" type="button" data-full-zoom-out>缩小</button>
          <button class="fn-btn is-xs" type="button" data-full-fit>适应全图</button>
          <button class="fn-btn is-xs" type="button" data-full-zoom-in>放大</button>
        </div>
        <button class="fn-btn is-sm" type="button" data-full-download>下载 PNG</button>
        <button class="fn-btn is-sm" type="button" data-full-close>关闭</button>`,
      onMount: (modal) => {
        modal.style.width = 'min(1120px, calc(100vw - 28px))';
        const inner = modal.querySelector('[data-el="mapInnerFull"]');
        const stage = modal.querySelector('[data-el="mapStageFull"]');
        const built = FN.Mindmap.renderTo(inner, tree, { title: state.note.title });
        if (!built) return;
        const svg = inner.querySelector('svg');
        let zoom = Math.min(1, Math.max(280, stage.clientWidth - 8) / built.width);
        const apply = (next) => {
          zoom = Math.max(0.35, Math.min(2, next));
          svg.style.width = `${Math.round(built.width * zoom)}px`;
          svg.style.height = `${Math.round(built.height * zoom)}px`;
          inner.classList.toggle('is-centered', built.width * zoom < stage.clientWidth - 4);
        };
        apply(zoom);
        stage.scrollLeft = 0;
        stage.scrollTop = 0;
        modal.querySelector('[data-full-zoom-in]').addEventListener('click', () => apply(zoom + 0.15));
        modal.querySelector('[data-full-zoom-out]').addEventListener('click', () => apply(zoom - 0.15));
        modal.querySelector('[data-full-fit]').addEventListener('click', () => {
          apply(
            Math.min(
              1,
              Math.max(280, stage.clientWidth - 8) / built.width,
              Math.max(260, stage.clientHeight - 8) / built.height
            )
          );
          stage.scrollLeft = 0;
          stage.scrollTop = 0;
        });
        modal.querySelector('[data-full-close]').addEventListener('click', () => handle.close());
        modal.querySelector('[data-full-download]').addEventListener('click', async () => {
          await Insights.exportMapAs('png', tree);
        });
      }
    });
  };

  /* ------------------------------------------------------------------------
   * 练习
   * ---------------------------------------------------------------------- */

  Insights.generateQuiz = async function generateQuiz() {
    if (!App.requireAI() || !App.requireNote()) return;
    App.Notes.syncRichToNote();
    const count = state.quizCount || 5;
    const difficulty = state.quizDifficulty || 'medium';
    const steps = ['读取视频内容', '设计题目与干扰项', '生成答案和解析'];
    const result = await withProgress({
      title: 'AI 正在出题',
      subtitle: `准备 ${count} 道单选练习，检验是否真的学会了`,
      steps,
      run: async (api) => {
        const ctx = await Insights.ensureContent(api, 0);
        api.step(1);
        api.detail('正在围绕核心概念设计题目…');
        const quiz = await FN.AI.generateQuiz(state.settings, ctx, { count, difficulty });
        if (!quiz.questions?.length) throw new Error('AI 没有生成有效题目，请重试。');
        api.step(2);
        api.detail('正在补充解析与时间点…');
        state.note.quiz = quiz;
        if ([3, 5, 8, 10].includes(quiz.questions.length)) {
          state.quizCount = quiz.questions.length;
        }
        return quiz;
      },
      retry: () => Insights.generateQuiz()
    });
    if (!result) return;
    await App.persistNow();
    App.renderAll();
    App.setView('quiz');
    App.toast(`已生成 ${result.questions.length} 道练习题`, 'success');
  };

  Insights.renderQuiz = function renderQuiz() {
    const container = el('quizContent');
    if (!container || !state.note) return;
    state.quizCount = state.quizCount || 5;
    state.quizDifficulty = state.quizDifficulty || 'medium';
    const quiz = state.note.quiz;
    if (quiz?.questions?.length && [3, 5, 8, 10].includes(quiz.questions.length)) {
      state.quizCount = quiz.questions.length;
    }
    const questions = quiz?.questions || [];
    const configured = FN.AI.isConfigured(state.settings);

    if (!questions.length) {
      container.innerHTML = `
        <div class="fn-view-head">
          <div>
            <div class="fn-view-title">AI 练习</div>
            <div class="fn-view-sub">从视频里出题，检验理解而不是死记</div>
          </div>
        </div>
        ${emptyState({
          icon: 'target',
          title: '学完就练，记得更牢',
          text: 'AI 会根据视频中的概念、步骤和对比出单选题，并给出解析与对应时间点。可以自己选难度和题量。',
          actions: configured
            ? '<div class="fn-quiz-config"><select class="fn-select" data-quiz-count><option value="3">3 题</option><option value="5" selected>5 题</option><option value="8">8 题</option><option value="10">10 题</option></select><select class="fn-select" data-quiz-difficulty><option value="easy">基础</option><option value="medium" selected>理解</option><option value="hard">综合</option></select><button class="fn-btn is-sm is-primary" type="button" data-act="quiz-generate">生成练习</button></div>'
            : '<button class="fn-btn is-sm is-primary" type="button" data-act="open-settings">配置 AI</button>'
        })}`;
      return;
    }

    const answers = quiz.answers || {};
    const answeredCount = Object.keys(answers).length;
    const correctCount = questions.filter((question) => answers[question.id] === question.answer).length;
    const score = answeredCount ? Math.round((correctCount / questions.length) * 100) : 0;
    const cards = questions
      .map((question, index) => {
        const answered = Object.prototype.hasOwnProperty.call(answers, question.id);
        const selected = answers[question.id];
        return `
        <div class="fn-question-card" data-qid="${esc(question.id)}">
          <div class="fn-question-head">
            <span class="fn-question-num">${index + 1}</span>
            <p class="fn-question-text">${esc(question.question)}</p>
            ${question.ts != null ? `<button class="fn-ts" type="button" data-ts="${Number(question.ts)}">${FN.fmtTime(question.ts)}</button>` : ''}
          </div>
          <div class="fn-question-body">
            ${question.options.map((option, optionIndex) => {
              let cls = 'fn-option';
              if (answered) {
                if (optionIndex === question.answer) cls += ' is-correct';
                else if (optionIndex === selected) cls += ' is-wrong';
              }
              return `<button class="${cls}" type="button" data-quiz-answer="${optionIndex}" ${answered ? 'disabled' : ''}>
                <span class="fn-option-letter">${String.fromCharCode(65 + optionIndex)}</span>
                <span>${esc(option)}</span>
              </button>`;
            }).join('')}
          </div>
          ${answered ? `<div class="fn-explanation"><b>${selected === question.answer ? '回答正确 · ' : '正确答案：' + String.fromCharCode(65 + question.answer) + ' · '}</b>${esc(question.explanation || '暂无解析')}${question.ts != null ? `<button class="fn-ts" type="button" data-ts="${Number(question.ts)}">${FN.fmtTime(question.ts)}</button>` : ''}</div>` : ''}
        </div>`;
      })
      .join('');

    container.innerHTML = `
      <div class="fn-view-head">
        <div>
          <div class="fn-view-title">AI 练习</div>
          <div class="fn-view-sub">${questions.length} 道单选 · 已答 ${answeredCount}/${questions.length}</div>
        </div>
        <div class="fn-view-actions">
          <select class="fn-select" data-quiz-count>${[3, 5, 8, 10].map((n) => `<option value="${n}" ${n === state.quizCount ? 'selected' : ''}>${n} 题</option>`).join('')}</select>
          <select class="fn-select" data-quiz-difficulty>${[['easy', '基础'], ['medium', '理解'], ['hard', '综合']].map(([value, label]) => `<option value="${value}" ${value === state.quizDifficulty ? 'selected' : ''}>${label}</option>`).join('')}</select>
          <button class="fn-btn is-xs" type="button" data-act="quiz-generate">重新生成</button>
        </div>
      </div>
      ${answeredCount ? `<div class="fn-quiz-summary">${FN.icon('target', 15)} 当前得分 <b>${score}</b> 分 · 答对 ${correctCount}/${questions.length}${answeredCount === questions.length ? ' · 全部完成' : ''}<div class="fn-spacer"></div><button class="fn-link-btn" type="button" data-act="quiz-reset">重做</button></div>` : ''}
      ${cards}
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="fn-btn is-sm" type="button" data-act="quiz-generate">${FN.icon('refresh', 12)} 换一组题</button>
        ${answeredCount ? '<button class="fn-btn is-sm" type="button" data-act="quiz-reset">清空答案</button>' : ''}
      </div>`;
  };

  Insights.answerQuiz = function answerQuiz(questionId, optionIndex) {
    if (!state.note?.quiz?.questions) return;
    const question = state.note.quiz.questions.find((item) => item.id === questionId);
    if (!question) return;
    state.note.quiz.answers = state.note.quiz.answers || {};
    state.note.quiz.answers[question.id] = optionIndex;
    const scroll = el('scroll')?.scrollTop || 0;
    Insights.renderQuiz();
    if (el('scroll')) el('scroll').scrollTop = scroll;
    App.persistSoon();
    const answers = state.note.quiz.answers;
    if (Object.keys(answers).length === state.note.quiz.questions.length) {
      const correct = state.note.quiz.questions.filter((item) => answers[item.id] === item.answer).length;
      App.toast(`完成 ${state.note.quiz.questions.length} 题，答对 ${correct} 题`, 'success', 3600);
    }
  };

  Insights.resetQuiz = function resetQuiz() {
    if (!state.note?.quiz) return;
    state.note.quiz.answers = {};
    Insights.renderQuiz();
    App.persistSoon();
  };

  /* ------------------------------------------------------------------------
   * AI 助手
   * ---------------------------------------------------------------------- */

  const SUGGESTIONS = [
    '用一句话总结这个视频',
    '把当前这段内容讲得更通俗一些',
    '这个视频里最容易混淆的概念是什么？',
    '给我 3 个复习问题，先不要给答案'
  ];

  Insights.renderChat = function renderChat() {
    const container = el('chatScroll');
    if (!container || !state.note) return;
    const messages = state.note.chat || [];
    const configured = FN.AI.isConfigured(state.settings);
    if (!messages.length) {
      container.innerHTML = `
        <div class="fn-chat-intro">
          <div class="fn-chat-intro-main">
            <div class="fn-empty-art">${FN.icon('sparkles', 23)}</div>
            <div class="fn-chat-copy">
              <div class="fn-chat-kicker">AI 助手 · 独立对话</div>
              <h3>边看边问，理解得更快</h3>
              <p>AI 能看到当前视频的字幕、画面文字和你的笔记，并给出带时间戳的依据。</p>
            </div>
          </div>
          ${
            configured
              ? `<div class="fn-suggestions">${SUGGESTIONS.map((text) => `<button class="fn-suggestion" type="button" data-chat-suggest="${esc(text)}">${FN.icon('sparkles', 12)} ${esc(text)}</button>`).join('')}</div>`
              : '<div class="fn-chat-prompt"><button class="fn-btn is-sm is-primary" type="button" data-act="open-settings">配置 AI</button></div>'
          }
        </div>`;
    } else {
      container.innerHTML = messages
        .map((message) => {
          const isUser = message.role === 'user';
          const time = message.at ? new Date(message.at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
          return `
          <div class="fn-chat-msg${isUser ? ' is-user' : ''}">
            <div class="fn-chat-avatar">${isUser ? '我' : `<img src="${chrome.runtime.getURL('assets/icon128.png')}" alt="" />`}</div>
            <div>
              <div class="fn-chat-bubble">${isUser ? esc(message.content).replace(/\n/g, '<br>') : FN.renderMarkdown(message.content)}</div>
              ${time ? `<div class="fn-chat-time">${time}</div>` : ''}
            </div>
          </div>`;
        })
        .join('');
      if (state.chatBusy) {
        container.insertAdjacentHTML(
          'beforeend',
          `<div class="fn-chat-msg"><div class="fn-chat-avatar"><img src="${chrome.runtime.getURL('assets/icon128.png')}" alt="" /></div><div class="fn-chat-bubble"><span class="fn-typing"><span></span><span></span><span></span></span></div></div>`
        );
      }
    }
    const context = el('chatContext');
    if (context) {
      const chars = (state.note.transcript || []).reduce((sum, segment) => sum + segment.text.length, 0);
      context.innerHTML = chars
        ? `${FN.icon('target', 10)} 已连接视频上下文 · 文稿 ${state.note.transcript.length} 条 · 当前 ${FN.fmtTime(currentTime())}<span class="fn-spacer"></span><button class="fn-link-btn" type="button" data-act="chat-clear">清空</button>`
        : `${FN.icon('help', 10)} 还没有字幕或画面文字，建议先提取字幕或做一次「识字」<span class="fn-spacer"></span><button class="fn-link-btn" type="button" data-act="chat-clear">清空</button>`;
    }
    const sendBtn = FN.UI.root?.querySelector('[data-act="chat-send"]');
    if (sendBtn) sendBtn.disabled = state.chatBusy;
    setTimeout(() => Insights.scrollChatToBottom(), 20);
  };

  Insights.scrollChatToBottom = function scrollChatToBottom() {
    const container = el('chatScroll');
    if (container) container.scrollTop = container.scrollHeight;
  };

  Insights.sendChat = async function sendChat(preset) {
    if (state.chatBusy || !state.note) return;
    App.Notes.syncRichToNote();
    const input = el('chatInput');
    const question = String(preset || input?.value || '').trim();
    if (!question) return;
    if (!App.requireAI()) return;
    const ctx = App.context();
    if (!ctx.hasContent) {
      App.toast('先提取字幕、导入文稿或做一次「识字」，AI 才有内容可以回答', 'error', 5000);
      return;
    }
    state.note.chat = state.note.chat || [];
    const history = state.note.chat.slice(-8);
    state.note.chat.push({ role: 'user', content: question, at: new Date().toISOString() });
    if (input) input.value = '';
    state.chatBusy = true;
    Insights.renderChat();
    App.persistSoon();
    try {
      const reply = await FN.AI.chatWithVideo(state.settings, {
        question,
        ctx,
        history,
        state: { ...state.videoState, meta: state.videoMeta }
      });
      state.note.chat.push({ role: 'assistant', content: reply, at: new Date().toISOString() });
      state.chatBusy = false;
      Insights.renderChat();
      App.persistSoon();
    } catch (error) {
      state.chatBusy = false;
      state.note.chat.push({
        role: 'assistant',
        content: `请求失败：${error?.message || error}\n\n请检查设置中的 API 配置后重试。`,
        at: new Date().toISOString()
      });
      Insights.renderChat();
      App.persistSoon();
      App.toast(error?.message || 'AI 请求失败', 'error', 5000);
    }
  };

  App.Insights = Insights;

  Insights.clearChat = async function clearChat() {
    if (!state.note?.chat?.length) return;
    const ok = await FN.UI.confirm({
      title: '清空对话？',
      message: '只清空 AI 助手对话记录，笔记和文稿不会受影响。',
      confirmText: '清空对话',
      danger: true
    });
    if (!ok) return;
    state.note.chat = [];
    state.chatBusy = false;
    Insights.renderChat();
    App.persistSoon();
  };
})();
