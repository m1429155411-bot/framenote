/* 帧记 · 设置 / 笔记库 / 导出 / OCR / 帮助 */
(() => {
  const FN = globalThis.FN;
  const App = FN.App;
  const Dialogs = (FN.Dialogs = {});

  const state = App.state;
  let ocrProgressHandler = null;

  const PROVIDERS = {
    deepseek: {
      label: 'DeepSeek（文本模型，性价比高）',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      visionModel: '',
      sttModel: ''
    },
    zhipu: {
      label: '智谱 GLM（支持视觉）',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4-flash',
      visionModel: 'glm-4v-flash',
      sttModel: ''
    },
    qwen: {
      label: '通义千问（支持视觉）',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
      visionModel: 'qwen-vl-plus',
      sttModel: ''
    },
    moonshot: {
      label: '月之暗面 Kimi（支持视觉）',
      baseUrl: 'https://api.moonshot.cn/v1',
      model: 'moonshot-v1-8k',
      visionModel: 'moonshot-v1-8k-vision-preview',
      sttModel: ''
    },
    openai: {
      label: 'OpenAI（文本 / 视觉 / 转写）',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4.1-mini',
      visionModel: 'gpt-4.1-mini',
      sttModel: 'whisper-1'
    },
    gemini: {
      label: 'Google Gemini（OpenAI 兼容）',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: 'gemini-2.5-flash',
      visionModel: 'gemini-2.5-flash',
      sttModel: ''
    },
    siliconflow: {
      label: '硅基流动 SiliconFlow（支持视觉）',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'Qwen/Qwen2.5-7B-Instruct',
      visionModel: 'Qwen/Qwen2.5-VL-72B-Instruct',
      sttModel: ''
    },
    ollama: {
      label: 'Ollama 本地模型',
      baseUrl: 'http://localhost:11434/v1',
      model: 'llama3.2',
      visionModel: 'llava',
      sttModel: ''
    },
    custom: {
      label: '自定义 OpenAI 兼容接口',
      baseUrl: '',
      model: '',
      visionModel: '',
      sttModel: ''
    }
  };

  function esc(value) {
    return FN.escapeHtml(value);
  }

  function settingsField(label, name, value, options = {}) {
    return `<div class="fn-field">
      <label>${label}${options.optional ? '<span>可选</span>' : ''}</label>
      <input class="fn-input" data-field="${name}" type="${options.type || 'text'}" value="${esc(value ?? '')}" placeholder="${esc(options.placeholder || '')}" ${options.spellcheck === false ? 'spellcheck="false"' : ''} />
      ${options.hint ? `<p class="fn-hint">${options.hint}</p>` : ''}
    </div>`;
  }

  function toggleRow(title, hint, setting, checked) {
    return `<div class="fn-settings-row">
      <div class="fn-settings-row-text"><b>${esc(title)}</b><span>${esc(hint)}</span></div>
      <label class="fn-toggle">
        <input type="checkbox" data-setting-toggle="${setting}" ${checked ? 'checked' : ''} />
        <span class="fn-toggle-track"></span>
      </label>
    </div>`;
  }

  /* ------------------------------------------------------------------------
   * 欢迎
   * ---------------------------------------------------------------------- */

  Dialogs.maybeWelcome = function maybeWelcome() {
    if (!state.settings || state.settings.onboarded || state.welcomeShown) return;
    if (!state.panelOpen) return;
    state.welcomeShown = true;
    const handle = FN.UI.openModal({
      title: '欢迎使用帧记',
      icon: 'sparkles',
      body: `
        <div class="fn-help-hero">
          <h3>视频看到哪，笔记记到哪。</h3>
          <p>帧记把网页视频、时间戳笔记、AI 与 OCR 放进同一个侧栏，不用再在播放器、截图工具和文档之间来回切换。</p>
        </div>
        <div class="fn-help-steps">
          <div class="fn-help-step"><span class="fn-help-step-num">1</span><div><b>边看边记，自动带时间</b><span>暂停时截图、点击「时间戳」或按 Alt+Shift+S，笔记会自动绑定当前播放位置，点击即可跳回。</span></div></div>
          <div class="fn-help-step"><span class="fn-help-step-num">2</span><div><b>三种模板，一份视频</b><span>图文笔记放重点画面，大纲笔记长成思维导图，文稿笔记保存字幕或 AI 逐字稿。</span></div></div>
          <div class="fn-help-step"><span class="fn-help-step-num">3</span><div><b>AI 帮你省时间</b><span>配置任意 OpenAI 兼容接口后，可一键笔记、速览、出题、脑图；顶部「听写」可单独录一段视频声音，先编辑识别结果再插入。AI 进度只在面板内显示，不遮视频。</span></div></div>
        </div>
        <div class="fn-storage-box" style="margin-top:14px">
          <span>${FN.icon('lock', 12)} 所有笔记默认只保存在本机浏览器，API Key 不会上传到帧记服务器。</span>
        </div>`,
      footer: `
        <button class="fn-btn is-sm" data-welcome-settings>先配置 AI</button>
        <button class="fn-btn is-sm is-primary" data-welcome-start>开始使用</button>`,
      onMount: (modal) => {
        modal.querySelector('[data-welcome-start]').addEventListener('click', async () => {
          state.settings = await FN.Store.saveSettings({ onboarded: true });
          handle.close();
        });
        modal.querySelector('[data-welcome-settings]').addEventListener('click', async () => {
          state.settings = await FN.Store.saveSettings({ onboarded: true });
          handle.close();
          Dialogs.settings({ firstTime: true });
        });
      },
      onClose: () => {
        if (!state.settings.onboarded) {
          FN.Store.saveSettings({ onboarded: true }).then((settings) => {
            state.settings = settings;
          });
        }
      }
    });
  };

  /* ------------------------------------------------------------------------
   * 设置
   * ---------------------------------------------------------------------- */

  Dialogs.settings = function settings(options = {}) {
    if (!state.settings) return;
    const s = state.settings;
    const provider = PROVIDERS[s.provider] ? s.provider : 'custom';
    const providerOptions = Object.entries(PROVIDERS)
      .map(([key, item]) => `<option value="${key}" ${key === provider ? 'selected' : ''}>${esc(item.label)}</option>`)
      .join('');

    const handle = FN.UI.openModal({
      title: options.firstTime ? '连接你的 AI' : '设置',
      subtitle: '支持 OpenAI 兼容接口。密钥只保存在本机，并通过扩展后台直接请求你填写的服务。',
      icon: 'settings',
      wide: true,
      body: `
        <div class="fn-form-section">
          <div class="fn-form-title">${FN.icon('sparkles', 13)} AI 服务</div>
          <div class="fn-field">
            <label>服务商</label>
            <select class="fn-input" data-field="provider">${providerOptions}</select>
          </div>
          <div class="fn-field">
            <label>API 地址 <span>OpenAI 兼容</span></label>
            <input class="fn-input" data-field="baseUrl" type="url" value="${esc(s.baseUrl)}" placeholder="https://api.deepseek.com/v1" spellcheck="false" />
            <p class="fn-hint">一般以 /v1 结尾，帧记会自动拼接 /chat/completions；也支持直接填写完整的 /chat/completions 地址。</p>
          </div>
          <div class="fn-field">
            <label>API Key</label>
            <div class="fn-input-group">
              <input class="fn-input" data-field="apiKey" type="password" value="${esc(s.apiKey)}" placeholder="sk-..." spellcheck="false" autocomplete="off" />
              <button class="fn-password-toggle" type="button" data-toggle-key title="显示 / 隐藏">${FN.icon('eye', 14)}</button>
            </div>
          </div>
          <div class="fn-field-row">
            <div class="fn-field">
              <label>文本模型</label>
              <input class="fn-input" data-field="model" type="text" value="${esc(s.model)}" placeholder="deepseek-chat" spellcheck="false" />
            </div>
            <div class="fn-field">
              <label>视觉模型 <span>用于 OCR / 截图理解</span></label>
              <input class="fn-input" data-field="visionModel" type="text" value="${esc(s.visionModel)}" placeholder="留空则使用本地 OCR" spellcheck="false" />
            </div>
          </div>
          <div class="fn-field">
            <label>语音转写模型 <span>用于 AI 逐字稿</span></label>
            <input class="fn-input" data-field="sttModel" type="text" value="${esc(s.sttModel)}" placeholder="whisper-1；留空则不可用" spellcheck="false" />
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <button class="fn-btn is-sm" type="button" data-test-ai>${FN.icon('target', 13)} 测试连接</button>
            <span class="fn-test-status" data-test-status>尚未测试</span>
          </div>
        </div>

        <div class="fn-form-section">
          <div class="fn-form-title">${FN.icon('camera', 13)} 记录偏好</div>
          <div class="fn-field-row">
            <div class="fn-field">
              <label>默认笔记模板</label>
              <select class="fn-input" data-field="defaultTemplate">
                <option value="rich" ${s.defaultTemplate === 'rich' ? 'selected' : ''}>图文笔记</option>
                <option value="outline" ${s.defaultTemplate === 'outline' ? 'selected' : ''}>大纲笔记</option>
                <option value="transcript" ${s.defaultTemplate === 'transcript' ? 'selected' : ''}>文稿笔记</option>
              </select>
            </div>
            <div class="fn-field">
              <label>界面主题</label>
              <div class="fn-segmented" data-theme-picker>
                ${[['auto', '跟随系统'], ['light', '浅色'], ['dark', '深色']].map(([value, label]) => `<button type="button" data-theme-value="${value}" class="${s.theme === value ? 'is-active' : ''}">${label}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="fn-field" style="margin-top:8px">
            <label>主题配色 <span>只改变强调色</span></label>
            <div class="fn-accent-picker" data-accent-picker>
              ${[['lime', '青柠', '#9ccb4a'], ['ocean', '海蓝', '#72b7e6'], ['amber', '琥珀', '#e9b94f'], ['coral', '珊瑚', '#e9967d']]
                .map(
                  ([value, label, color]) =>
                    `<button class="fn-accent-option ${(s.accent || 'lime') === value ? 'is-active' : ''}" type="button" data-accent-value="${value}" aria-pressed="${(s.accent || 'lime') === value}" style="--swatch:${color}"><i></i>${label}</button>`
                )
                .join('')}
            </div>
            <p class="fn-hint">青柠是默认配色；海蓝 / 琥珀 / 珊瑚会同步应用到按钮、选中态和进度条。</p>
          </div>
          ${toggleRow('暂停时自动截图', '视频暂停时，把当前画面插入图文笔记（AI 辅助模式）', 'autoSnapshot', s.autoSnapshot)}
          ${toggleRow('自动截图画面的文字', '截图后顺带 OCR，把画面文字一起写进笔记', 'autoOcr', s.autoOcr)}
          ${toggleRow('AI 图文笔记自动配图', '生成图文笔记时，截取 2-4 张重点画面（会短暂定位视频）', 'aiScreenshots', s.aiScreenshots !== false)}
          ${toggleRow('文稿跟随播放', '播放时高亮并滚动到当前字幕', 'followTranscript', s.followTranscript)}
          ${toggleRow('打开面板时压缩页面', '给右侧笔记面板预留空间，避免盖住正在播放的视频', 'dockPage', s.dockPage !== false)}
        </div>

        <div class="fn-form-section">
          <div class="fn-form-title">${FN.icon('mic', 13)} 音频识别（自动文稿 + 总结）</div>
          ${toggleRow('自动识别视频音频', '边看边把视频声音按 20 秒分段转写，自动写入文稿；暂停/继续会跟着视频走', 'autoAudio', !!s.autoAudio)}
          ${toggleRow('停止后自动生成总结', '音频识别停止后，后台自动生成 AI 速览与总结文案，不弹出遮挡视频的窗口', 'autoAudioSummary', s.autoAudioSummary !== false)}
          <p class="fn-hint">需要先在「语音转写模型」中填写支持 <code>/audio/transcriptions</code> 的模型（如 OpenAI <code>whisper-1</code>），并填写同一 API 的 Key。音频会分段发送到你配置的接口。</p>
        </div>

        <div class="fn-form-section">
          <div class="fn-form-title">${FN.icon('scan', 13)} OCR 与语言</div>
          <div class="fn-field-row">
            <div class="fn-field">
              <label>OCR 引擎</label>
              <select class="fn-input" data-field="ocrEngine">
                <option value="auto" ${s.ocrEngine === 'auto' ? 'selected' : ''}>自动（本地优先，失败用视觉模型）</option>
                <option value="local" ${s.ocrEngine === 'local' ? 'selected' : ''}>本地 Tesseract（离线）</option>
                <option value="ai" ${s.ocrEngine === 'ai' ? 'selected' : ''}>AI 视觉模型（更准）</option>
              </select>
            </div>
            <div class="fn-field">
              <label>识别语言</label>
              <select class="fn-input" data-field="ocrLang">
                <option value="chi_sim+eng" ${s.ocrLang === 'chi_sim+eng' ? 'selected' : ''}>中文 + 英文</option>
                <option value="chi_sim" ${s.ocrLang === 'chi_sim' ? 'selected' : ''}>仅中文</option>
                <option value="eng" ${s.ocrLang === 'eng' ? 'selected' : ''}>仅英文</option>
              </select>
            </div>
          </div>
          <p class="fn-hint">本地 OCR 使用随扩展打包的 Tesseract 与中英文语言包，完全离线，首次识别需要加载约 10 秒。</p>
        </div>

        <div class="fn-form-section">
          <div class="fn-form-title">${FN.icon('library', 13)} 数据</div>
          <div class="fn-storage-box">
            <span>笔记与截图保存在 chrome.storage.local</span>
            <span data-storage-usage>正在统计…</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
            <button class="fn-btn is-xs" type="button" data-data-action="backup">${FN.icon('download', 11)} 备份全部笔记</button>
            <button class="fn-btn is-xs" type="button" data-data-action="restore">${FN.icon('plus', 11)} 导入备份</button>
            <button class="fn-btn is-xs is-danger" type="button" data-data-action="clear">${FN.icon('trash', 11)} 清空所有笔记</button>
          </div>
          <p class="fn-hint">备份为 JSON，包含笔记、截图和设置，但不包含 API Key。清空操作不可恢复。</p>
        </div>

        <div class="fn-form-section">
          <div class="fn-form-title">${FN.icon('lock', 13)} 隐私</div>
          <p class="fn-hint" style="font-size:10px">帧记没有服务器。视频笔记、截图和对话保存在你的浏览器中；只有你主动点击 AI 功能时，相关文字或截图才会发送到你配置的 AI 服务。请不要在公共电脑上保存长期 API Key。</p>
        </div>`,
      footer: `
        <span class="fn-test-status" data-footer-status></span>
        <div class="fn-spacer"></div>
        <button class="fn-btn is-sm" data-cancel>取消</button>
        <button class="fn-btn is-sm is-primary" data-save>${options.firstTime ? '保存并开始' : '保存设置'}</button>`,
      onMount: (modal) => {
        const collect = () => {
          const get = (name) => modal.querySelector(`[data-field="${name}"]`)?.value?.trim() ?? '';
          return {
            ...state.settings,
            provider: get('provider'),
            baseUrl: get('baseUrl'),
            apiKey: get('apiKey'),
            model: get('model'),
            visionModel: get('visionModel'),
            sttModel: get('sttModel'),
            defaultTemplate: get('defaultTemplate'),
            theme: modal.querySelector('[data-theme-value].is-active')?.dataset.themeValue || 'auto',
            accent: modal.querySelector('[data-accent-value].is-active')?.dataset.accentValue || 'lime',
            ocrEngine: get('ocrEngine'),
            ocrLang: get('ocrLang'),
            autoSnapshot: !!modal.querySelector('[data-setting-toggle="autoSnapshot"]')?.checked,
            autoOcr: !!modal.querySelector('[data-setting-toggle="autoOcr"]')?.checked,
            aiScreenshots: !!modal.querySelector('[data-setting-toggle="aiScreenshots"]')?.checked,
            followTranscript: !!modal.querySelector('[data-setting-toggle="followTranscript"]')?.checked,
            dockPage: !!modal.querySelector('[data-setting-toggle="dockPage"]')?.checked,
            autoAudio: !!modal.querySelector('[data-setting-toggle="autoAudio"]')?.checked,
            autoAudioSummary: !!modal.querySelector('[data-setting-toggle="autoAudioSummary"]')?.checked
          };
        };

        modal.querySelector('[data-toggle-key]')?.addEventListener('click', () => {
          const input = modal.querySelector('[data-field="apiKey"]');
          input.type = input.type === 'password' ? 'text' : 'password';
        });

        modal.querySelector('[data-field="provider"]')?.addEventListener('change', (event) => {
          const preset = PROVIDERS[event.target.value];
          if (!preset || event.target.value === 'custom') return;
          modal.querySelector('[data-field="baseUrl"]').value = preset.baseUrl;
          modal.querySelector('[data-field="model"]').value = preset.model;
          modal.querySelector('[data-field="visionModel"]').value = preset.visionModel;
          modal.querySelector('[data-field="sttModel"]').value = preset.sttModel;
          modal.querySelector('[data-test-status]').textContent = '已填入预设，记得测试连接';
          modal.querySelector('[data-test-status]').className = 'fn-test-status';
        });

        modal.querySelectorAll('[data-theme-value]').forEach((button) => {
          button.addEventListener('click', () => {
            modal.querySelectorAll('[data-theme-value]').forEach((item) => item.classList.remove('is-active'));
            button.classList.add('is-active');
            FN.UI.setTheme(button.dataset.themeValue);
          });
        });

        modal.querySelectorAll('[data-accent-value]').forEach((button) => {
          button.addEventListener('click', () => {
            modal.querySelectorAll('[data-accent-value]').forEach((item) => {
              item.classList.remove('is-active');
              item.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('is-active');
            button.setAttribute('aria-pressed', 'true');
            FN.UI.setAccent(button.dataset.accentValue);
          });
        });

        modal.querySelector('[data-test-ai]')?.addEventListener('click', async () => {
          const config = collect();
          const status = modal.querySelector('[data-test-status]');
          const button = modal.querySelector('[data-test-ai]');
          if (!config.baseUrl || !config.model) {
            status.textContent = '请先填写 API 地址和文本模型';
            status.className = 'fn-test-status is-error';
            return;
          }
          button.disabled = true;
          status.textContent = '正在连接…';
          status.className = 'fn-test-status';
          try {
            const text = await FN.AI.test(config);
            status.textContent = `连接成功，模型回复：${FN.truncate(text, 24)}`;
            status.className = 'fn-test-status is-ok';
          } catch (error) {
            status.textContent = error?.message || '连接失败';
            status.className = 'fn-test-status is-error';
          } finally {
            button.disabled = false;
          }
        });

        modal.querySelector('[data-data-action="backup"]')?.addEventListener('click', () => Dialogs.backupAll());
        modal.querySelector('[data-data-action="restore"]')?.addEventListener('click', () => Dialogs.pickBackupFile(handle));
        modal.querySelector('[data-data-action="clear"]')?.addEventListener('click', async () => {
          const ok = await FN.UI.confirm({
            title: '清空所有笔记？',
            message: '所有视频笔记、截图、速览、练习与对话都会被删除，且无法恢复。建议先做一次备份。',
            confirmText: '全部删除',
            danger: true
          });
          if (!ok) return;
          await FN.Store.clearAllNotes();
          state.note = null;
          state.noteKey = '';
          handle.close();
          await App.loadForCurrent();
          App.toast('所有笔记已清空');
        });

        modal.querySelector('[data-cancel]')?.addEventListener('click', () => {
          FN.UI.setTheme(state.settings.theme || 'auto');
          FN.UI.setAccent(state.settings.accent || 'lime');
          handle.close();
        });

        modal.querySelector('[data-save]')?.addEventListener('click', async () => {
          const next = collect();
          if (!next.baseUrl || !next.model) {
            App.toast('请填写 API 地址和文本模型；如果暂时不用 AI，可以先关闭设置', 'error');
            return;
          }
          if (!/^https?:\/\//i.test(next.baseUrl)) next.baseUrl = `https://${next.baseUrl}`;
          const previousAutoAudio = !!state.settings.autoAudio;
          state.settings = await FN.Store.saveSettings(next);
          FN.UI.setTheme(state.settings.theme);
          FN.UI.setAccent(state.settings.accent || 'lime');
          FN.UI.setWidth(state.settings.uiWidth || 442);
          App.applyDocking();
          App.renderAll();
          handle.close();
          if (state.settings.autoAudio && !previousAutoAudio) {
            if (!state.settings.sttModel) {
              state.settings = await FN.Store.saveSettings({ autoAudio: false });
              App.toast('自动音频识别需要先填写语音转写模型', 'error', 4200);
            } else {
              App.Notes.startAutoAudio({ fromSettings: true });
            }
          } else if (!state.settings.autoAudio && App.Notes.autoAudioActive?.()) {
            App.Notes.stopAutoAudio({ summarize: false, silent: true });
          }
          App.toast('设置已保存', 'success');
        });

        FN.Store.storageUsage().then((bytes) => {
          const node = modal.querySelector('[data-storage-usage]');
          if (node) node.textContent = bytes == null ? '本机存储' : `已用 ${FN.bytes(bytes)}`;
        });
      },
      onClose: () => {
        if (state.settings) {
          FN.UI.setTheme(state.settings.theme || 'auto');
          FN.UI.setAccent(state.settings.accent || 'lime');
        }
      }
    });
    return handle;
  };

  /* ------------------------------------------------------------------------
   * 语音听写
   * ---------------------------------------------------------------------- */

  Dialogs.openSpeech = function openSpeech() {
    if (!App.requireNote()) return;
    if (state.recording) {
      Dialogs.openSpeechStatus();
      return;
    }
    const start = Number(App.tracker?.video?.currentTime) || 0;
    const configured = FN.AI.isConfigured(state.settings) && !!state.settings?.sttModel;
    const handle = FN.UI.openModal({
      title: '语音转文字',
      subtitle: '把当前视频的声音识别成可编辑的带时间戳文字',
      icon: 'mic',
      narrow: true,
      body: `
        <div class="fn-speech-intro">
          <div class="fn-speech-icon">${FN.icon('mic', 25)}</div>
          <h3>先录下声音，再识别成文字</h3>
          <p>听写会从当前播放位置开始，最长录制 10 分钟。停止后会先给你一份可编辑的结果，不会直接覆盖现有文稿。</p>
          <div class="fn-speech-facts">
            <span>起点 <b>${FN.fmtTime(start)}</b></span>
            <span>最长 <b>10 分钟</b></span>
            <span>输出 <b>带时间戳文字</b></span>
          </div>
        </div>
        <p class="fn-hint">${configured ? '使用已配置的语音模型识别；录制期间可以关闭本窗口，在面板顶部停止。' : '还没有配置语音模型，开始时会先打开设置。'}</p>`,
      footer: `
        <button class="fn-btn is-sm" type="button" data-speech-cancel>取消</button>
        <div class="fn-spacer"></div>
        <button class="fn-btn is-sm is-primary" type="button" data-speech-start>${configured ? '开始听写' : '先配置语音模型'}</button>`,
      onMount: (modal) => {
        modal.querySelector('[data-speech-cancel]').addEventListener('click', () => handle.close());
        modal.querySelector('[data-speech-start]').addEventListener('click', () => {
          handle.close();
          if (!configured) {
            App.Dialogs.settings({ firstTime: true });
            return;
          }
          App.Notes.startRecording({ standalone: true });
        });
      }
    });
  };

  Dialogs.openSpeechStatus = function openSpeechStatus() {
    const recording = state.recording;
    if (!recording) {
      Dialogs.openSpeech();
      return;
    }
    const startedAt = recording.startedAt;
    let statusTimer = null;
    const handle = FN.UI.openModal({
      title: recording.standalone ? '正在听写' : '正在录音',
      subtitle: '录音在后台继续；关闭本窗口不会停止，面板顶部可以停止',
      icon: 'mic',
      narrow: true,
      body: `
        <div class="fn-speech-intro is-live">
          <div class="fn-speech-icon is-live">${FN.icon('mic', 25)}</div>
          <h3>${recording.standalone ? '正在听写视频声音' : '正在录制视频声音'}</h3>
          <p>起点 ${FN.fmtTime(recording.offset)}。保持视频播放，停止后会进入识别结果。</p>
          <div class="fn-speech-facts"><span>已录制 <b data-speech-elapsed>00:00</b></span></div>
        </div>`,
      footer: `
        <button class="fn-btn is-sm" type="button" data-speech-background>后台继续</button>
        <div class="fn-spacer"></div>
        <button class="fn-btn is-sm is-primary" type="button" data-speech-stop>停止并识别</button>`,
      onMount: (modal) => {
        const elapsed = modal.querySelector('[data-speech-elapsed]');
        statusTimer = setInterval(() => {
          if (!modal.isConnected) return;
          if (elapsed) elapsed.textContent = FN.fmtTime((Date.now() - startedAt) / 1000);
        }, 400);
        modal.querySelector('[data-speech-background]').addEventListener('click', () => handle.close());
        modal.querySelector('[data-speech-stop]').addEventListener('click', () => {
          clearInterval(statusTimer);
          handle.close();
          App.Notes.stopRecording('语音听写停止');
        });
      },
      onClose: () => clearInterval(statusTimer)
    });
  };

  function parseSpeechLines(text, fallbackStart, fallbackDuration) {
    const lines = String(text || '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const total = lines.length || 1;
    const step = fallbackDuration ? Math.max(2, fallbackDuration / total) : 2;
    const segments = [];
    lines.forEach((line, index) => {
      const match = line.match(/^\s*\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(.+)$/);
      const start = match ? FN.parseTime(match[1]) : Number(fallbackStart) + index * step;
      const body = FN.cleanText(match ? match[2] : line);
      if (!body) return;
      segments.push({
        id: FN.uid('seg'),
        start,
        end: start + 3,
        text: body,
        source: 'stt'
      });
    });
    segments.forEach((segment, index) => {
      if (segments[index + 1]) segment.end = Math.max(segment.start + 1, segments[index + 1].start);
    });
    return segments;
  }

  Dialogs.openSpeechResult = function openSpeechResult(segments, meta = {}) {
    if (!segments?.length) return;
    const lines = segments
      .map((segment) => `[${FN.fmtTime(segment.start)}] ${segment.text}`)
      .join('\n');
    const handle = FN.UI.openModal({
      title: '语音识别结果',
      subtitle: `识别出 ${segments.length} 段 · 可以修改文字后再插入`,
      icon: 'mic',
      wide: true,
      body: `
        <div class="fn-speech-result">
          <div class="fn-speech-result-meta">
            <span>${FN.icon('clock', 11)} 录音起点 ${FN.fmtTime(meta.start || 0)}</span>
            <span>${segments.length} 段文字</span>
          </div>
          <textarea class="fn-textarea fn-speech-text" data-speech-text spellcheck="false">${esc(lines)}</textarea>
          <p class="fn-hint">每行格式为 <code>[时间] 文字</code>。修改文字不会丢失时间戳；也可以追加到现有文稿，不会覆盖原内容。</p>
        </div>`,
      footer: `
        <button class="fn-btn is-sm" type="button" data-speech-copy>${FN.icon('copy', 12)} 复制文字</button>
        <div class="fn-spacer"></div>
        <button class="fn-btn is-sm" type="button" data-speech-cancel>取消</button>
        <button class="fn-btn is-sm" type="button" data-speech-rich>插入图文</button>
        <button class="fn-btn is-sm is-primary" type="button" data-speech-append>${FN.icon('plus', 12)} 追加到文稿</button>`,
      onMount: (modal) => {
        const textarea = modal.querySelector('[data-speech-text]');
        const parse = () => parseSpeechLines(textarea.value, meta.start || 0, meta.duration || 0);
        modal.querySelector('[data-speech-cancel]').addEventListener('click', () => handle.close());
        modal.querySelector('[data-speech-copy]').addEventListener('click', async () => {
          await FN.copy(textarea.value.trim());
          App.toast('语音文字已复制', 'success', 1500);
        });
        modal.querySelector('[data-speech-rich]').addEventListener('click', () => {
          const parsed = parse();
          if (!parsed.length) {
            App.toast('没有可插入的文字', 'error');
            return;
          }
          handle.close();
          App.Notes.insertSpeechResult(parsed);
        });
        modal.querySelector('[data-speech-append]').addEventListener('click', async () => {
          const parsed = parse();
          if (!parsed.length) {
            App.toast('没有可写入的文字', 'error');
            return;
          }
          handle.close();
          const ok = await App.Notes.setTranscript(parsed, '语音听写', { append: true });
          if (ok) App.setView('notes');
        });
      }
    });
  };

  /* ------------------------------------------------------------------------
   * OCR
   * ---------------------------------------------------------------------- */

  Dialogs.openOCR = function openOCR(shot, options = {}) {
    if (!shot?.dataUrl) {
      App.toast('没有可识别的画面，请重试', 'error');
      return;
    }
    const handle = FN.UI.openModal({
      title: '识别画面文字',
      subtitle: '本地 Tesseract 或你配置的视觉模型；结果可直接插入笔记',
      icon: 'scan',
      body: `
        <div class="fn-ocr-layout">
          <div class="fn-ocr-preview"><img src="${shot.dataUrl}" alt="待识别画面" /></div>
          <div class="fn-ocr-result-head">
            <span data-ocr-status>正在准备 OCR 引擎…</span>
            <span data-ocr-engine></span>
          </div>
          <div class="fn-progress-bar" style="margin:2px 0 0"><i data-ocr-bar style="width:5%"></i></div>
          <textarea class="fn-textarea fn-ocr-text" data-ocr-text placeholder="识别结果会出现在这里，也可以手动修改…"></textarea>
          <p class="fn-hint">${FN.icon('clock', 10)} 识别结果会绑定画面时间 ${FN.fmtTime(shot.time)}。</p>
        </div>`,
      footer: `
        <button class="fn-btn is-sm" data-ocr-copy disabled>${FN.icon('copy', 12)} 复制文字</button>
        <div class="fn-spacer"></div>
        <button class="fn-btn is-sm" data-cancel>取消</button>
        <button class="fn-btn is-sm is-primary" data-ocr-insert disabled>${FN.icon('plus', 12)} 插入笔记</button>`,
      onMount: async (modal) => {
        const textarea = modal.querySelector('[data-ocr-text]');
        const status = modal.querySelector('[data-ocr-status]');
        const engineLabel = modal.querySelector('[data-ocr-engine]');
        const bar = modal.querySelector('[data-ocr-bar]');
        const copyButton = modal.querySelector('[data-ocr-copy]');
        const insertButton = modal.querySelector('[data-ocr-insert]');

        const enable = () => {
          const hasText = textarea.value.trim().length > 0;
          copyButton.disabled = !hasText;
          insertButton.disabled = !hasText;
        };
        ocrProgressHandler = (message) => {
          if (!modal.isConnected) return;
          const labels = {
            'loading tesseract core': '加载 OCR 核心…',
            'initializing tesseract': '初始化 OCR 引擎…',
            'loading language traineddata': '加载中英文语言包…',
            'initializing api': '初始化识别接口…',
            'recognizing text': '正在识别文字…'
          };
          if (message.status) {
            status.textContent = labels[message.status] || message.status;
            if (Number.isFinite(Number(message.progress))) {
              bar.style.width = `${Math.max(4, Math.min(98, Number(message.progress) * 100))}%`;
            }
          }
        };

        copyButton.addEventListener('click', async () => {
          await FN.copy(textarea.value);
          App.toast('已复制文字', 'success', 1500);
        });
        modal.querySelector('[data-cancel]').addEventListener('click', () => handle.close());
        insertButton.addEventListener('click', () => {
          const text = textarea.value.trim();
          if (!text) return;
          ocrProgressHandler = null;
          handle.close();
          App.Notes.insertOCRResult(shot, text, {
            figureInserted: !!options.figureInserted
          });
          App.toast('已插入笔记并绑定时间戳', 'success');
        });
        textarea.addEventListener('input', enable);

        try {
          const result = await FN.AI.ocr(state.settings, shot.dataUrl);
          ocrProgressHandler = null;
          bar.style.width = '100%';
          if (result.text) {
            textarea.value = result.text;
            status.textContent = '识别完成';
            engineLabel.textContent =
              result.engine === 'ai'
                ? 'AI 视觉模型'
                : `本地 OCR${result.confidence ? ` · 置信度 ${result.confidence}%` : ''}`;
          } else {
            status.textContent = '没有识别到文字';
            engineLabel.textContent = result.engine === 'ai' ? 'AI 视觉模型' : '本地 OCR';
            textarea.placeholder = '没有识别到文字。可以手动输入画面里看到的内容，或换一帧再试。';
          }
          enable();
          textarea.focus();
        } catch (error) {
          ocrProgressHandler = null;
          bar.style.width = '100%';
          bar.style.background = 'var(--fn-danger)';
          status.textContent = error?.message || '识别失败';
          engineLabel.textContent = '可手动输入';
          textarea.placeholder = '识别失败。你仍然可以手动输入画面文字后插入笔记。';
          textarea.focus();
        }
      },
      onClose: () => {
        ocrProgressHandler = null;
      }
    });
    return handle;
  };

  Dialogs.updateOCRProgress = function updateOCRProgress(message) {
    if (ocrProgressHandler) ocrProgressHandler(message);
  };

  /* ------------------------------------------------------------------------
   * 笔记库
   * ---------------------------------------------------------------------- */

  Dialogs.library = async function library() {
    const notes = await FN.Store.listNotes();
    const handle = FN.UI.openModal({
      title: '我的笔记',
      subtitle: `本地共 ${notes.length} 篇 · 按最近更新排序`,
      icon: 'library',
      wide: true,
      flush: false,
      body: `
        <div class="fn-library-search" style="padding:0 0 10px;border:0">
          <div class="fn-transcript-search" style="margin:0">
            ${FN.icon('scan', 13)}
            <input type="search" data-library-search placeholder="搜索标题、站点或摘要…" />
          </div>
        </div>
        <div class="fn-library-list" data-library-list>
          ${Dialogs.libraryItemsHtml(notes)}
        </div>`,
      footer: `
        <span class="fn-small fn-muted" data-library-count>${notes.length} 篇笔记</span>
        <div class="fn-spacer"></div>
        <button class="fn-btn is-sm" data-library-backup>${FN.icon('download', 12)} 备份全部</button>
        <button class="fn-btn is-sm" data-library-import>${FN.icon('plus', 12)} 导入备份</button>`,
      onMount: (modal) => {
        const list = modal.querySelector('[data-library-list]');
        modal.querySelector('[data-library-search]').addEventListener('input', (event) => {
          const query = event.target.value.trim().toLowerCase();
          let count = 0;
          for (const item of list.querySelectorAll('[data-lib-key]')) {
            const text = item.textContent.toLowerCase();
            const show = !query || text.includes(query);
            item.hidden = !show;
            if (show) count += 1;
          }
          const label = modal.querySelector('[data-library-count]');
          if (label) label.textContent = `${count} 篇匹配`;
        });

        list.addEventListener('click', async (event) => {
          const item = event.target.closest('[data-lib-key]');
          if (!item) return;
          const key = item.dataset.libKey;
          const meta = notes.find((note) => note.key === key);
          if (!meta) return;
          if (event.target.closest('[data-lib-action="delete"]')) {
            const ok = await FN.UI.confirm({
              title: '删除这篇笔记？',
              message: `「${esc(meta.title)}」的所有内容将从本机删除，无法恢复。`,
              confirmText: '删除',
              danger: true
            });
            if (!ok) return;
            await FN.Store.deleteNote(key);
            item.remove();
            if (key === state.noteKey) {
              state.note = null;
              state.noteKey = '';
              await App.loadForCurrent();
            }
            App.toast('笔记已删除');
            return;
          }
          if (event.target.closest('[data-lib-action="export"]')) {
            const note = await FN.Store.loadNote(meta);
            Dialogs.exportPanel(note);
            return;
          }
          if (event.target.closest('[data-lib-action="open"]')) {
            if (meta.url) window.open(meta.url, '_blank', 'noopener');
            else App.toast('这篇笔记没有保存视频地址', 'error');
            return;
          }
          if (key === state.noteKey) {
            handle.close();
            App.setView('notes');
          } else if (meta.url) {
            window.open(meta.url, '_blank', 'noopener');
            App.toast('已在新标签打开原视频，点击扩展图标即可继续记笔记');
          }
        });

        modal.querySelector('[data-library-backup]')?.addEventListener('click', () => Dialogs.backupAll());
        modal.querySelector('[data-library-import]')?.addEventListener('click', () => Dialogs.pickBackupFile(handle));
      }
    });
    return handle;
  };

  Dialogs.libraryItemsHtml = function libraryItemsHtml(notes) {
    if (!notes.length) {
      return `<div class="fn-library-empty">${FN.icon('library', 26)}<br /><br />还没有笔记。打开一个视频，写下第一句话试试。</div>`;
    }
    return notes
      .map(
        (note) => `
      <div class="fn-library-item${note.key === state.noteKey ? ' is-current' : ''}" data-lib-key="${esc(note.key)}">
        <div class="fn-library-thumb">${FN.icon(note.hasImage ? 'image' : note.hasMindmap ? 'brain' : 'file', 17)}</div>
        <div class="fn-library-body">
          <div class="fn-library-title">${esc(note.title || '未命名笔记')}</div>
          <div class="fn-library-meta">
            <span>${esc(note.site || '网页')}</span><span>·</span>
            <span>${esc(FN.fmtRelative(note.updatedAt))}</span><span>·</span>
            <span>${note.textLength || 0} 字</span>
            ${note.timestamps ? `<span>·</span><span>${note.timestamps} 个时间戳</span>` : ''}
            ${note.key === state.noteKey ? '<span class="fn-chip is-primary" style="height:17px;font-size:9px">当前</span>' : ''}
          </div>
          ${note.preview ? `<div class="fn-hint" style="margin-top:3px">${esc(note.preview)}</div>` : ''}
        </div>
        <div class="fn-library-actions">
          <button class="fn-mini-btn" type="button" data-lib-action="open" title="打开原视频">${FN.icon('external', 13)}</button>
          <button class="fn-mini-btn" type="button" data-lib-action="export" title="导出">${FN.icon('download', 13)}</button>
          <button class="fn-mini-btn" type="button" data-lib-action="delete" title="删除">${FN.icon('trash', 13)}</button>
        </div>
      </div>`
      )
      .join('');
  };

  /* ------------------------------------------------------------------------
   * 备份 / 恢复
   * ---------------------------------------------------------------------- */

  Dialogs.backupAll = async function backupAll() {
    try {
      const payload = await FN.Store.exportAll();
      await FN.downloadText(
        JSON.stringify(payload, null, 2),
        `帧记备份-${new Date().toISOString().slice(0, 10)}.json`,
        'application/json;charset=utf-8'
      );
      App.toast('备份已导出', 'success');
    } catch (error) {
      App.toast(`备份失败：${error?.message || error}`, 'error');
    }
  };

  Dialogs.pickBackupFile = function pickBackupFile(parentHandle) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.documentElement.appendChild(input);
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return;
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        const count = await FN.Store.importAll(payload);
        state.settings = await FN.Store.getSettings();
        App.applyTheme();
        parentHandle?.close?.();
        await App.loadForCurrent();
        App.toast(`已导入 ${count} 篇笔记`, 'success');
      } catch (error) {
        App.toast(`导入失败：${error?.message || error}`, 'error', 6000);
      }
    });
    input.click();
  };

  /* ------------------------------------------------------------------------
   * 导出
   * ---------------------------------------------------------------------- */

  Dialogs.exportPanel = function exportPanel(noteArg) {
    const note = noteArg || state.note;
    if (!note) {
      App.toast('当前没有可导出的笔记', 'error');
      return;
    }
    const hasTranscript = (note.transcript || []).length > 0;
    const handle = FN.UI.openModal({
      title: '导出与分享',
      subtitle: `${note.title || '视频笔记'} · 选择格式后保存到本机`,
      icon: 'share',
      body: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
          <button class="fn-btn" style="height:44px;justify-content:flex-start" data-export="md">${FN.icon('file', 16)} Markdown</button>
          <button class="fn-btn" style="height:44px;justify-content:flex-start" data-export="html">${FN.icon('external', 16)} 网页 HTML</button>
          <button class="fn-btn" style="height:44px;justify-content:flex-start" data-export="json">${FN.icon('file', 16)} JSON 数据</button>
          <button class="fn-btn" style="height:44px;justify-content:flex-start" data-export="share">${FN.icon('image', 16)} 分享长图</button>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px">
          <button class="fn-btn is-sm" data-export="copy">${FN.icon('copy', 12)} 复制分享文案</button>
          ${hasTranscript ? '<button class="fn-btn is-sm" data-export="srt">SRT 字幕</button><button class="fn-btn is-sm" data-export="txt">带时间戳文稿</button>' : ''}
          <button class="fn-btn is-sm" data-export="print">${FN.icon('file', 12)} 打印 / PDF</button>
        </div>
        <p class="fn-hint" style="margin-top:11px">HTML 为单文件，截图已内嵌，可直接分享或打印为 PDF。长图适合发到群里。</p>`,
      onMount: (modal) => {
        modal.querySelectorAll('[data-export]').forEach((button) => {
          button.addEventListener('click', async () => {
            const type = button.dataset.export;
            if (type === 'share' || type === 'print') {
              handle.close();
            }
            await Dialogs.exportNoteAs(type, note);
            if (type !== 'share' && type !== 'print') handle.close();
          });
        });
      }
    });
    return handle;
  };

  Dialogs.exportNoteAs = async function exportNoteAs(type, note) {
    if (!note) return;
    const base = FN.slugify(note.title || '视频笔记');
    try {
      if (type === 'md') {
        await FN.downloadText(Dialogs.buildMarkdown(note), `${base}.md`, 'text/markdown;charset=utf-8');
        App.toast('Markdown 已导出', 'success');
      } else if (type === 'html') {
        await FN.downloadText(Dialogs.buildHTML(note), `${base}.html`, 'text/html;charset=utf-8');
        App.toast('HTML 已导出，可直接打开或打印为 PDF', 'success');
      } else if (type === 'json') {
        await FN.downloadText(JSON.stringify(note, null, 2), `${base}.json`, 'application/json;charset=utf-8');
        App.toast('JSON 已导出', 'success');
      } else if (type === 'copy') {
        await FN.copy(Dialogs.shareText(note));
        App.toast('分享文案已复制', 'success');
      } else if (type === 'srt') {
        const segments = note.transcript || [];
        const content = segments
          .map((segment, index) => `${index + 1}\n${srtTime(segment.start)} --> ${srtTime(segment.end)}\n${segment.text}\n`)
          .join('\n');
        await FN.downloadText(content, `${base}.srt`, 'application/x-subrip;charset=utf-8');
        App.toast('SRT 已导出', 'success');
      } else if (type === 'txt') {
        const content = (note.transcript || []).map((segment) => `[${FN.fmtTime(segment.start)}] ${segment.text}`).join('\n');
        await FN.downloadText(content, `${base}-逐字稿.txt`, 'text/plain;charset=utf-8');
        App.toast('文稿已导出', 'success');
      } else if (type === 'share') {
        await Dialogs.shareImage(note);
      } else if (type === 'print') {
        Dialogs.printNote(note);
      }
    } catch (error) {
      App.toast(`导出失败：${error?.message || error}`, 'error', 5000);
    }
  };

  function srtTime(seconds) {
    const ms = Math.max(0, Math.round((Number(seconds) || 0) * 1000));
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`;
  }

  Dialogs.buildMarkdown = function buildMarkdown(note) {
    const lines = [];
    lines.push(`# ${note.title || '视频笔记'}`);
    lines.push('');
    lines.push(`> 来源：${note.site || '网页视频'}  `);
    if (note.url) lines.push(`> 链接：${note.url}  `);
    if (note.duration) lines.push(`> 时长：${FN.fmtTime(note.duration)}  `);
    lines.push(`> 导出时间：${FN.fmtClock(new Date())}`);
    lines.push('');
    if (note.summary?.overview) {
      lines.push('## AI 速览');
      lines.push('');
      lines.push(note.summary.overview);
      lines.push('');
      if (note.summary.keyPoints?.length) {
        for (const point of note.summary.keyPoints) lines.push(`- ${point}`);
        lines.push('');
      }
      if (note.summary.chapters?.length) {
        lines.push('### 分段总结');
        for (const chapter of note.summary.chapters) {
          lines.push(`- ${chapter.ts != null ? `[${FN.fmtTime(chapter.ts)}] ` : ''}**${chapter.title}**${chapter.summary ? `：${chapter.summary}` : ''}`);
        }
        lines.push('');
      }
    }
    if (FN.stripHtml(note.richHtml || '')) {
      lines.push('## 图文笔记');
      lines.push('');
      lines.push(App.Notes.htmlToMarkdown(note.richHtml));
      lines.push('');
    }
    if (note.outline?.length) {
      lines.push('## 大纲笔记');
      lines.push('');
      for (const node of note.outline) {
        const indent = '  '.repeat(Math.max(0, (Number(node.level) || 1) - 1));
        lines.push(`${indent}- ${node.star ? '★ ' : ''}${node.text}${node.ts != null ? ` [${FN.fmtTime(node.ts)}]` : ''}`);
      }
      lines.push('');
    }
    if (note.transcript?.length) {
      lines.push('## 文稿');
      lines.push('');
      for (const segment of note.transcript) {
        lines.push(`**[${FN.fmtTime(segment.start)}]** ${segment.text}`);
        lines.push('');
      }
    }
    if (note.quiz?.questions?.length) {
      lines.push('## AI 练习');
      lines.push('');
      note.quiz.questions.forEach((question, index) => {
        lines.push(`### ${index + 1}. ${question.question}`);
        question.options.forEach((option, optionIndex) => lines.push(`- ${String.fromCharCode(65 + optionIndex)}. ${option}`));
        lines.push('');
        lines.push(`**答案：${String.fromCharCode(65 + question.answer)}**`);
        if (question.explanation) lines.push(`解析：${question.explanation}`);
        lines.push('');
      });
    }
    if (note.mindmap) {
      lines.push('## 思维导图');
      lines.push('');
      lines.push(FN.Mindmap.toMarkdown(note.mindmap));
      lines.push('');
    }
    if (note.chat?.length) {
      lines.push('## AI 对话');
      lines.push('');
      for (const message of note.chat.slice(-12)) {
        lines.push(`**${message.role === 'user' ? '我' : 'AI'}：** ${message.content}`);
        lines.push('');
      }
    }
    lines.push('---');
    lines.push('由「帧记 · AI 视频笔记」生成');
    return lines.join('\n');
  };

  Dialogs.shareText = function shareText(note) {
    const parts = [`【${note.title || '视频笔记'}】`];
    if (note.summary?.overview) parts.push(note.summary.overview);
    if (note.summary?.keyPoints?.length) {
      parts.push('关键结论：');
      note.summary.keyPoints.slice(0, 4).forEach((point, index) => parts.push(`${index + 1}. ${point}`));
    }
    if (note.url) parts.push(`视频：${note.url}`);
    parts.push('—— 由帧记 AI 视频笔记整理');
    return parts.join('\n');
  };

  Dialogs.buildHTML = function buildHTML(note) {
    const safeTitle = esc(note.title || '视频笔记');
    const outline = (note.outline || [])
      .map((node) => `<li style="margin-left:${Math.max(0, (Number(node.level) || 1) - 1) * 18}px">${node.star ? '★ ' : ''}${esc(node.text)}${node.ts != null ? ` <span class="ts">${FN.fmtTime(node.ts)}</span>` : ''}</li>`)
      .join('');
    const transcript = (note.transcript || [])
      .map((segment) => `<div class="seg"><span class="ts">${FN.fmtTime(segment.start)}</span><p>${esc(segment.text)}</p></div>`)
      .join('');
    const quiz = (note.quiz?.questions || [])
      .map(
        (question, index) => `<div class="quiz"><h3>${index + 1}. ${esc(question.question)}</h3><ol>${question.options.map((option) => `<li>${esc(option)}</li>`).join('')}</ol><p class="answer">答案：${String.fromCharCode(65 + question.answer)}${question.explanation ? ` · ${esc(question.explanation)}` : ''}</p></div>`
      )
      .join('');
    const map = note.mindmap
      ? `<h2>思维导图</h2><div class="map">${FN.Mindmap.buildSvg(note.mindmap, { exportMode: true, title: note.title }).svg}</div>`
      : '';
    const summary = note.summary
      ? `<section><h2>AI 速览</h2><p>${esc(note.summary.overview || '')}</p>${
          note.summary.keyPoints?.length
            ? `<ul>${note.summary.keyPoints.map((point) => `<li>${esc(point)}</li>`).join('')}</ul>`
            : ''
        }${(note.summary.chapters || [])
          .map((chapter) => `<div class="chapter">${chapter.ts != null ? `<span class="ts">${FN.fmtTime(chapter.ts)}</span>` : ''}<b>${esc(chapter.title)}</b><p>${esc(chapter.summary || '')}</p></div>`)
          .join('')}</section>`
      : '';
    const rich = FN.sanitizeHtml(note.richHtml || '');
    const style = `
      *{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#1b1b17;font-family:"Segoe UI","Microsoft YaHei","PingFang SC",system-ui,sans-serif;line-height:1.8}
      .page{max-width:820px;margin:32px auto;background:#fff;border-radius:18px;padding:40px 48px 54px;box-shadow:0 12px 46px rgba(20,20,15,.08)}
      .hero{border-bottom:1px solid #e6e6de;padding-bottom:20px;margin-bottom:24px}
      h1{font-size:30px;line-height:1.4;margin:0 0 10px;color:#171713}h2{font-size:20px;margin:30px 0 12px;padding-left:10px;border-left:4px solid #a8dd3d}
      h3{font-size:15px;margin:22px 0 8px}.meta{color:#87877c;font-size:12px}.meta a{color:#46640f}
      .ts,.fn-ts{display:inline-flex;align-items:center;padding:0 7px;height:20px;border-radius:5px;background:#edf6d8;color:#46640f;font-size:11px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;text-decoration:none}
      .fn-star{color:#6b8f1e;font-size:13px}.fn-ai-signature{color:#a0a096;font-size:10px;text-align:right;margin-top:18px}
      .seg{display:flex;gap:10px;border-bottom:1px solid #efefe8;padding:7px 0}.seg p{margin:0;font-size:13px;color:#4f4f47}
      img{max-width:100%;border-radius:10px;border:1px solid #e6e6de;display:block;margin:10px auto}
      figure{margin:18px 0}figcaption{text-align:center;color:#87877c;font-size:11px;margin-top:6px}
      blockquote{margin:14px 0;padding:10px 14px;background:#f7f8ef;border-left:3px solid #9ccb4a;color:#4f4f47;border-radius:0 8px 8px 0}
      table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #e6e6de;padding:8px 10px;text-align:left}th{background:#f7f7f3}
      ul,ol{padding-left:22px}li{margin:4px 0}.quiz{border:1px solid #e6e6de;border-radius:10px;padding:14px 16px;margin:12px 0}.answer{color:#23895a;font-size:12px}
      .chapter{margin:10px 0}.chapter p{margin:2px 0;color:#77776c;font-size:13px}.map{overflow:auto;border:1px solid #e6e6de;border-radius:12px;padding:8px}
      .footer{margin-top:36px;padding-top:14px;border-top:1px solid #e6e6de;color:#a0a096;font-size:11px;text-align:right}
      @media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none;padding:20px}h2{break-after:avoid}figure,table{break-inside:avoid}}
    `;
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${safeTitle} · 帧记</title><style>${style}</style></head><body><main class="page">
      <header class="hero"><h1>${safeTitle}</h1><div class="meta">${esc(note.site || '网页视频')}${note.url ? ` · <a href="${esc(note.url)}" target="_blank" rel="noopener">查看原视频</a>` : ''}${note.duration ? ` · ${FN.fmtTime(note.duration)}` : ''}<br />导出于 ${FN.fmtClock(new Date())} · 由帧记 AI 视频笔记生成</div></header>
      ${summary}
      ${rich ? `<section><h2>图文笔记</h2>${rich}</section>` : ''}
      ${outline ? `<section><h2>大纲笔记</h2><ul>${outline}</ul></section>` : ''}
      ${transcript ? `<section><h2>文稿</h2>${transcript}</section>` : ''}
      ${quiz ? `<section><h2>AI 练习</h2>${quiz}</section>` : ''}
      ${map}
      <div class="footer">帧记 · 视频看到哪，笔记记到哪</div>
    </main></body></html>`;
  };

  Dialogs.printNote = function printNote(note) {
    const html = Dialogs.buildHTML(note);
    const win = window.open('', '_blank');
    if (!win) {
      App.toast('浏览器拦截了新窗口，请先导出 HTML 后再打印', 'error');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  };

  /* ------------------------------------------------------------------------
   * 分享长图
   * ---------------------------------------------------------------------- */

  function wrapCanvasText(ctx, text, maxWidth) {
    const source = String(text || '').replace(/\s+/g, ' ').trim();
    if (!source) return [];
    const lines = [];
    let line = '';
    for (const char of source) {
      const candidate = line + char;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  Dialogs.shareImage = async function shareImage(note) {
    const width = 1080;
    const padding = 76;
    const contentWidth = width - padding * 2;
    const title = note.title || '视频笔记';
    const overview =
      note.summary?.overview ||
      note.ai?.overview ||
      FN.truncate(FN.stripHtml(note.richHtml || ''), 180) ||
      '这篇视频笔记记录了视频中的关键知识点与时间戳。';
    const points = (
      note.summary?.keyPoints ||
      (note.ai?.sections || []).filter((section) => section.star).flatMap((section) => section.points || []).slice(0, 4) ||
      []
    ).slice(0, 4);

    const measure = document.createElement('canvas').getContext('2d');
    measure.font = `700 50px "Microsoft YaHei", "PingFang SC", sans-serif`;
    const titleLines = wrapCanvasText(measure, title, contentWidth);
    measure.font = `400 27px "Microsoft YaHei", "PingFang SC", sans-serif`;
    const overviewLines = wrapCanvasText(measure, overview, contentWidth);
    const pointLines = points.map((point) => {
      measure.font = `400 25px "Microsoft YaHei", "PingFang SC", sans-serif`;
      return wrapCanvasText(measure, point, contentWidth - 56);
    });
    const pointsHeight = pointLines.reduce((sum, lines) => sum + Math.max(1, lines.length) * 40 + 20, 0);
    const height = Math.max(
      1280,
      230 + titleLines.length * 66 + 44 + overviewLines.length * 44 + 54 + pointsHeight + 160
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 背景
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#f2f4e9');
    bg.addColorStop(0.55, '#fbfbf8');
    bg.addColorStop(1, '#f7f8ef');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // 顶部 lime 光晕
    const orb = ctx.createRadialGradient(width - 120, 80, 20, width - 120, 80, 500);
    orb.addColorStop(0, 'rgba(156,203,74,.18)');
    orb.addColorStop(1, 'rgba(156,203,74,0)');
    ctx.fillStyle = orb;
    ctx.fillRect(0, 0, width, 600);

    // 卡片
    roundRect(ctx, 40, 40, width - 80, height - 80, 36);
    ctx.fillStyle = 'rgba(255,255,255,.96)';
    ctx.fill();
    ctx.strokeStyle = '#e3e3da';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 品牌栏：黑底 lime 播放标
    roundRect(ctx, padding, 82, 54, 54, 16);
    ctx.fillStyle = '#171713';
    ctx.fill();
    ctx.fillStyle = '#9ccb4a';
    ctx.beginPath();
    ctx.moveTo(padding + 21, 98);
    ctx.lineTo(padding + 21, 120);
    ctx.lineTo(padding + 39, 109);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#171713';
    ctx.font = `700 27px "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.fillText('帧记 · AI 视频笔记', padding + 72, 108);
    ctx.fillStyle = '#87877c';
    ctx.font = `400 17px "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.fillText('视频看到哪，笔记记到哪', padding + 72, 132);

    let y = 210;
    ctx.fillStyle = '#171713';
    ctx.font = `700 50px "Microsoft YaHei", "PingFang SC", sans-serif`;
    for (const line of titleLines) {
      ctx.fillText(line, padding, y);
      y += 66;
    }

    ctx.fillStyle = '#87877c';
    ctx.font = `400 19px "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.fillText(
      `${note.site || '网页视频'}${note.duration ? ` · ${FN.fmtTime(note.duration)}` : ''} · ${new Date().toLocaleDateString('zh-CN')}`,
      padding,
      y + 6
    );
    y += 50;

    // 分隔线
    ctx.strokeStyle = '#e6e6de';
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 48;

    ctx.fillStyle = '#46640f';
    ctx.font = `700 18px "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.fillText('AI 摘要', padding, y);
    y += 40;

    ctx.fillStyle = '#4f4f47';
    ctx.font = `400 27px "Microsoft YaHei", "PingFang SC", sans-serif`;
    for (const line of overviewLines) {
      ctx.fillText(line, padding, y);
      y += 44;
    }
    y += 38;

    if (pointLines.length) {
      ctx.fillStyle = '#46640f';
      ctx.font = `700 18px "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.fillText('关键结论', padding, y);
      y += 38;
      pointLines.forEach((lines, index) => {
        ctx.fillStyle = '#edf6d8';
        ctx.beginPath();
        ctx.arc(padding + 17, y - 8, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#46640f';
        ctx.font = `700 17px "Microsoft YaHei", "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(String(index + 1), padding + 17, y - 2);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#3a3a33';
        ctx.font = `400 25px "Microsoft YaHei", "PingFang SC", sans-serif`;
        for (const line of lines) {
          ctx.fillText(line, padding + 50, y);
          y += 40;
        }
        y += 20;
      });
    }

    // 页脚
    const footerY = height - 100;
    ctx.strokeStyle = '#e6e6de';
    ctx.beginPath();
    ctx.moveTo(padding, footerY - 34);
    ctx.lineTo(width - padding, footerY - 34);
    ctx.stroke();
    ctx.fillStyle = '#9a9a90';
    ctx.font = `400 17px "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.fillText('由「帧记」浏览器扩展生成 · 时间戳与视频同步', padding, footerY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#46640f';
    ctx.font = `600 17px "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.fillText('FRAMENOTE', width - padding, footerY);
    ctx.textAlign = 'left';

    const dataUrl = canvas.toDataURL('image/png');
    const filename = `${FN.slugify(title)}-分享长图.png`;
    const handle = FN.UI.openModal({
      title: '分享长图',
      subtitle: '已生成适合发到群聊 / 朋友圈的竖版长图',
      icon: 'image',
      wide: true,
      body: `<div class="fn-share-preview"><img src="${dataUrl}" alt="分享长图预览" /></div>`,
      footer: `
        <button class="fn-btn is-sm" type="button" data-share-copy>${FN.icon('copy', 12)} 复制分享文案</button>
        <div class="fn-spacer"></div>
        <button class="fn-btn is-sm" type="button" data-share-close>关闭</button>
        <button class="fn-btn is-sm is-primary" type="button" data-share-download>${FN.icon('download', 12)} 下载长图</button>`,
      onMount: (modal) => {
        modal.querySelector('[data-share-close]').addEventListener('click', () => handle.close());
        modal.querySelector('[data-share-copy]').addEventListener('click', async () => {
          await FN.copy(Dialogs.shareText(note));
          App.toast('分享文案已复制', 'success', 1600);
        });
        modal.querySelector('[data-share-download]').addEventListener('click', async () => {
          try {
            await FN.download(dataUrl, filename);
            handle.close();
            App.toast('分享长图已生成', 'success');
          } catch (error) {
            App.toast(`下载失败：${error?.message || error}`, 'error');
          }
        });
      }
    });
    return handle;
  };

  /* ------------------------------------------------------------------------
   * 帮助
   * ---------------------------------------------------------------------- */

  Dialogs.help = function help() {
    const handle = FN.UI.openModal({
      title: '使用帮助',
      subtitle: '一分钟上手帧记',
      icon: 'help',
      wide: true,
      body: `
        <div class="fn-help-hero">
          <h3>打开网页视频，再点扩展图标</h3>
          <p>帧记会自动给右侧面板让出页面空间，视频会缩小重排到左侧；遇到固定定位播放器，会让整页内容一起向左让位，不会被面板盖住。AI 进度也只显示在面板内部。也可以在设置里关闭「打开面板时压缩页面」。</p>
        </div>
        <div class="fn-help-steps">
          <div class="fn-help-step"><span class="fn-help-step-num">1</span><div><b>时间戳笔记</b><span>「时间戳」按钮把当前播放位置插入图文；大纲节点也能单独绑定时间。点击任意时间戳会跳回视频，播放时对应标签会高亮。</span></div></div>
          <div class="fn-help-step"><span class="fn-help-step-num">2</span><div><b>图文 / 大纲 / 文稿</b><span>暂停时截图会自动带时间；大纲支持 Tab 缩进与 Enter 连续输入；文稿可提取网页字幕、导入 SRT / VTT，或用 AI 录制转写。</span></div></div>
          <div class="fn-help-step"><span class="fn-help-step-num">3</span><div><b>听写与自动识别</b><span>顶部「听写」是独立功能：录一段视频声音，先给可编辑的带时间戳结果，再追加到文稿或插入图文。文稿里的「自动识别」则适合边看边持续转写，停止后自动总结。</span></div></div>
          <div class="fn-help-step"><span class="fn-help-step-num">4</span><div><b>AI 笔记与脑图</b><span>点「AI 笔记」会读取字幕或抽样识别画面，生成带时间戳的笔记；生成过程只占用面板内一小块进度区。进度卡里有「停止」，停止后可「继续」重新生成。导图支持从大纲、速览或 AI 提炼，并下载 PNG / SVG / Markdown / OPML。</span></div></div>
          <div class="fn-help-step"><span class="fn-help-step-num">5</span><div><b>识字与导出</b><span>「识字」可识别当前画面中的中英文文字，优先使用离线 OCR。笔记可导出 Markdown、单文件 HTML、JSON、SRT、分享长图，或打印成 PDF。</span></div></div>
        </div>
        <div class="fn-form-title" style="margin-top:18px">窗口操作</div>
        <div class="fn-settings-row"><div class="fn-settings-row-text"><b>移动 / 缩放</b><span>拖动标题栏移动窗口；拖右下角调整宽高；右上角网格按钮或双击标题栏可停靠回右侧</span></div><span>${FN.icon('grid', 14)}</span></div>
        <div class="fn-form-title" style="margin-top:18px">快捷键</div>
        <div class="fn-settings-row"><div class="fn-settings-row-text"><b>打开 / 收起面板</b><span>扩展快捷键，可在 chrome://extensions/shortcuts 修改</span></div><span><span class="fn-kbd">Alt</span><span class="fn-kbd">Shift</span><span class="fn-kbd">F</span></span></div>
        <div class="fn-settings-row"><div class="fn-settings-row-text"><b>截取当前画面</b><span>面板打开时也可直接按快捷键</span></div><span><span class="fn-kbd">Alt</span><span class="fn-kbd">Shift</span><span class="fn-kbd">S</span></span></div>
        <div class="fn-settings-row"><div class="fn-settings-row-text"><b>插入时间戳</b><span>面板打开且未在输入时</span></div><span><span class="fn-kbd">Alt</span><span class="fn-kbd">N</span></span></div>
        <div class="fn-form-title" style="margin-top:18px">常见问题</div>
        <div class="fn-help-step"><span class="fn-help-step-num">?</span><div><b>为什么截图失败？</b><span>部分网站对视频做了跨域保护。帧记会自动尝试截取可见标签页并裁切视频区域；如果面板遮住了视频，会短暂隐藏面板。仍失败时请让视频完整显示再试。</span></div></div>
        <div class="fn-help-step"><span class="fn-help-step-num">?</span><div><b>为什么提取不到字幕？</b><span>网页需要暴露 HTML5 字幕轨。没有字幕时，可以导入 SRT / VTT，或使用「AI 转写」录制视频声音（需要支持 Whisper 类接口，且网站未做音频保护）。</span></div></div>
        <div class="fn-help-step"><span class="fn-help-step-num">?</span><div><b>AI 笔记没有配图？</b><span>请确认设置里「AI 图文笔记自动配图」已开启，且视频允许截图。跨域保护严格的网站可能只能生成文字笔记。</span></div></div>
        <div class="fn-form-title" style="margin-top:18px">数据与隐私</div>
        <p class="fn-hint">笔记默认保存在本机 <code>chrome.storage.local</code>；没有帧记服务器。只有主动触发 AI 功能时，相关文字或截图才会发送到你配置的接口。建议定期在「笔记库 → 备份全部」导出 JSON。</p>
        <div class="fn-storage-box" style="margin-top:10px">
          <span>${FN.icon('lock', 12)} 不上传、不追踪、不需要登录</span>
          <button class="fn-link-btn" data-help-settings>打开设置</button>
        </div>`,
      footer: `
        <button class="fn-btn is-sm" data-help-reset>重新显示新手引导</button>
        <div class="fn-spacer"></div>
        <button class="fn-btn is-sm is-primary" data-help-close>知道了</button>`,
      onMount: (modal) => {
        modal.querySelector('[data-help-close]').addEventListener('click', () => handle.close());
        modal.querySelector('[data-help-settings]').addEventListener('click', () => {
          handle.close();
          Dialogs.settings();
        });
        modal.querySelector('[data-help-reset]').addEventListener('click', async () => {
          state.settings = await FN.Store.saveSettings({ onboarded: false });
          state.welcomeShown = false;
          handle.close();
          Dialogs.maybeWelcome();
        });
      }
    });
    return handle;
  };

  App.Dialogs = Dialogs;
})();
