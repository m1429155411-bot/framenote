/* 由 tools/build-css.mjs 从 panel.css 生成，请勿直接编辑 */
(() => {
  const FN = (globalThis.FN = globalThis.FN || {});
  FN.PANEL_CSS = String.raw`/* 帧记 · AI 视频笔记 — in-page panel */
:host {
  pointer-events: none !important;
}

:host,
#fn-root {
  --fn-primary: #9ccb4a;
  --fn-primary-2: #84b53a;
  --fn-primary-ink: #46640f;
  --fn-on-primary: #11150b;
  --fn-primary-soft: #edf6d8;
  --fn-accent: #c5df86;
  --fn-danger: #e5484d;
  --fn-success: #23895a;
  --fn-bg: #fcfcfa;
  --fn-bg-soft: #f7f7f3;
  --fn-surface: #f3f3ee;
  --fn-surface-2: #eaeae3;
  --fn-text: #171713;
  --fn-text-soft: #4f4f47;
  --fn-muted: #87877c;
  --fn-line: #e6e6de;
  --fn-line-strong: #d4d4c9;
  --fn-shadow: 0 24px 60px rgba(20, 20, 15, 0.16), 0 4px 14px rgba(20, 20, 15, 0.06);
  --fn-radius: 18px;
  --fn-width: 442px;
  --fn-font: "Segoe UI", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", system-ui, sans-serif;
  --fn-mono: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
  all: initial;
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: visible;
  z-index: 2147483647;
  pointer-events: none !important;
  font-family: var(--fn-font);
  color: var(--fn-text);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

#fn-root[data-theme="dark"] {
  --fn-primary: #a4d35a;
  --fn-primary-2: #8bbb45;
  --fn-primary-ink: #c0e08a;
  --fn-on-primary: #11150b;
  --fn-primary-soft: #25301a;
  --fn-accent: #c6e58d;
  --fn-success: #4ade80;
  --fn-bg: #121210;
  --fn-bg-soft: #171714;
  --fn-surface: #1d1d1a;
  --fn-surface-2: #262622;
  --fn-text: #f4f4ee;
  --fn-text-soft: #d8d8ce;
  --fn-muted: #a3a399;
  --fn-line: #34342e;
  --fn-line-strong: #4a4a42;
  --fn-shadow: 0 28px 72px rgba(0, 0, 0, 0.58), 0 4px 16px rgba(0, 0, 0, 0.35);
}

/* 可选强调色：青柠（默认）/ 海蓝 / 琥珀 / 珊瑚 */
#fn-root[data-accent="ocean"] {
  --fn-primary: #72b7e6;
  --fn-primary-2: #5b9fce;
  --fn-primary-ink: #155e8a;
  --fn-on-primary: #061820;
  --fn-primary-soft: #e6f3fb;
  --fn-accent: #a6d4ee;
}

#fn-root[data-accent="amber"] {
  --fn-primary: #e9b94f;
  --fn-primary-2: #d3a33a;
  --fn-primary-ink: #745000;
  --fn-on-primary: #211806;
  --fn-primary-soft: #fbf3dc;
  --fn-accent: #f3d48a;
}

#fn-root[data-accent="coral"] {
  --fn-primary: #e9967d;
  --fn-primary-2: #d47b62;
  --fn-primary-ink: #8e3c22;
  --fn-on-primary: #2a1008;
  --fn-primary-soft: #fbede8;
  --fn-accent: #f3b7a3;
}

#fn-root[data-theme="dark"][data-accent="ocean"] {
  --fn-primary: #7fc0e8;
  --fn-primary-2: #68a9d2;
  --fn-primary-ink: #a9d8f2;
  --fn-on-primary: #061820;
  --fn-primary-soft: #152a36;
  --fn-accent: #a6d8f0;
}

#fn-root[data-theme="dark"][data-accent="amber"] {
  --fn-primary: #e9b94f;
  --fn-primary-2: #d3a33a;
  --fn-primary-ink: #f0d28c;
  --fn-on-primary: #211806;
  --fn-primary-soft: #332a12;
  --fn-accent: #f3d48a;
}

#fn-root[data-theme="dark"][data-accent="coral"] {
  --fn-primary: #ec9c85;
  --fn-primary-2: #d7836b;
  --fn-primary-ink: #f3bba9;
  --fn-on-primary: #2a1008;
  --fn-primary-soft: #3a1f18;
  --fn-accent: #f3b7a3;
}

#fn-root *,
#fn-root *::before,
#fn-root *::after {
  box-sizing: border-box;
}

:where(#fn-root) :where(button, input, textarea, select) {
  font: inherit;
  color: inherit;
}

:where(#fn-root) :where(button) {
  border: 0;
  background: none;
  padding: 0;
  cursor: pointer;
}

#fn-root [hidden] {
  display: none !important;
}

#fn-root button:focus-visible,
#fn-root input:focus-visible,
#fn-root textarea:focus-visible,
#fn-root select:focus-visible,
#fn-root [contenteditable="true"]:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--fn-primary) 70%, transparent);
  outline-offset: 2px;
}

#fn-root ::selection {
  background: color-mix(in srgb, var(--fn-primary) 22%, transparent);
}

.fn-icon {
  display: block;
  flex: 0 0 auto;
}

/* --------------------------------------------------------------------------
 * 悬浮按钮
 * ------------------------------------------------------------------------ */

.fn-fab {
  position: fixed;
  right: 22px;
  bottom: 24px;
  width: 58px;
  height: 58px;
  border-radius: 19px;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 0 10px 28px rgba(20, 20, 15, 0.24), 0 2px 6px rgba(20, 20, 15, 0.14);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, visibility 0.18s;
  z-index: 2;
}

.fn-fab.is-dragging {
  cursor: grabbing;
  transform: scale(0.96);
  transition: none;
}

#fn-root.has-video .fn-fab {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.fn-fab img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 19px;
}

.fn-fab::after {
  content: "帧记 AI 笔记";
  position: absolute;
  right: 68px;
  top: 50%;
  transform: translateY(-50%) translateX(6px);
  white-space: nowrap;
  padding: 7px 11px;
  border-radius: 8px;
  background: rgba(30, 27, 46, 0.92);
  color: #fff;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fn-fab:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 14px 34px rgba(20, 20, 15, 0.3);
}

.fn-fab:hover::after {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

#fn-root.is-dismissed .fn-fab {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: scale(0.8);
}

.fn-fab .fn-fab-dot {
  position: absolute;
  right: -2px;
  top: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #38d39f;
  border: 2.5px solid #fff;
  box-shadow: 0 0 0 0 rgba(56, 211, 159, 0.5);
  animation: fnPulse 2.2s infinite;
}

@keyframes fnPulse {
  0% { box-shadow: 0 0 0 0 rgba(56, 211, 159, 0.45); }
  70% { box-shadow: 0 0 0 8px rgba(56, 211, 159, 0); }
  100% { box-shadow: 0 0 0 0 rgba(56, 211, 159, 0); }
}

/* --------------------------------------------------------------------------
 * 面板骨架
 * ------------------------------------------------------------------------ */

.fn-panel {
  position: fixed;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: var(--fn-width);
  max-width: calc(100vw - 24px);
  height: calc(100vh - 24px);
  background: var(--fn-bg);
  border-radius: var(--fn-radius);
  box-shadow: var(--fn-shadow);
  border: 1px solid color-mix(in srgb, var(--fn-line) 88%, transparent);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateX(22px) scale(0.985);
  transform-origin: right center;
  transition: opacity 0.22s ease, transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}

#fn-root.is-open .fn-panel {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0) scale(1);
}

/* 关闭时让整个面板（包括内部单独开启 pointer-events 的按钮）彻底不可命中，
   避免透明面板里的「更多」等按钮仍能被悬停出 tooltip 或点击。 */
#fn-root:not(.is-open) .fn-panel,
#fn-root:not(.is-open) .fn-panel * {
  visibility: hidden !important;
  pointer-events: none !important;
}

#fn-root.is-open .fn-fab {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: scale(0.8);
}

.fn-resize {
  position: absolute;
  left: 0;
  top: 58px;
  bottom: 40px;
  width: 7px;
  cursor: ew-resize;
  z-index: 30;
}

.fn-resize::after {
  content: "";
  position: absolute;
  left: 3px;
  top: 50%;
  width: 2px;
  height: 38px;
  transform: translateY(-50%);
  border-radius: 2px;
  background: transparent;
  transition: background 0.15s;
}

.fn-resize:hover::after {
  background: var(--fn-line-strong);
}

.fn-resize-e,
.fn-resize-s {
  display: none;
}

.fn-resize-se {
  display: block;
}

.fn-resize-e {
  left: auto;
  right: 0;
  top: 58px;
  bottom: 40px;
  width: 7px;
  height: auto;
  cursor: ew-resize;
}

.fn-resize-e::after {
  left: auto;
  right: 3px;
  top: 50%;
  width: 2px;
  height: 38px;
}

.fn-resize-s {
  left: 0;
  right: 0;
  top: auto;
  bottom: 0;
  width: auto;
  height: 7px;
  cursor: ns-resize;
}

.fn-resize-s::after {
  left: 50%;
  top: auto;
  bottom: 3px;
  width: 38px;
  height: 2px;
  transform: translateX(-50%);
}

.fn-resize-se {
  left: auto;
  right: 3px;
  top: auto;
  bottom: 3px;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  z-index: 32;
}

.fn-resize-se::after {
  content: "";
  display: block;
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 7px;
  height: 7px;
  border-right: 1px solid var(--fn-line-strong);
  border-bottom: 1px solid var(--fn-line-strong);
  border-radius: 0 0 2px 0;
}

#fn-root.is-floating .fn-resize-e,
#fn-root.is-floating .fn-resize-s {
  display: block;
}

#fn-root.is-floating .fn-panel {
  box-shadow: var(--fn-shadow);
}

.fn-dock-btn {
  display: none !important;
}

#fn-root.is-floating .fn-dock-btn {
  display: inline-flex !important;
}

.fn-header {
  position: relative;
  z-index: 45;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 14px 10px 16px;
  gap: 10px;
  pointer-events: auto;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

#fn-root.is-panel-dragging .fn-header {
  cursor: grabbing;
}

.fn-header button {
  cursor: pointer;
}

.fn-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.fn-logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  overflow: hidden;
  flex: 0 0 auto;
  box-shadow: 0 2px 8px rgba(20, 20, 15, 0.12);
}

.fn-logo img {
  width: 100%;
  height: 100%;
  display: block;
}

.fn-brand-text {
  min-width: 0;
}

.fn-brand-name {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
  line-height: 1.25;
  color: var(--fn-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.fn-brand-name em {
  font-style: normal;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--fn-on-primary);
  background: var(--fn-primary);
  border-radius: 4px;
  padding: 1px 4px;
}

.fn-brand-sub {
  margin-top: 1px;
  font-size: 10.5px;
  color: var(--fn-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fn-head-actions {
  position: relative;
  z-index: 46;
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
  pointer-events: auto;
}

.fn-icon-btn {
  position: relative;
  z-index: 47;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--fn-muted);
  pointer-events: auto;
  transition: background 0.15s, color 0.15s;
}

.fn-icon-btn:hover {
  background: var(--fn-surface);
  color: var(--fn-text);
}

.fn-icon-btn.is-danger:hover {
  background: color-mix(in srgb, var(--fn-danger) 10%, transparent);
  color: var(--fn-danger);
}

/* --------------------------------------------------------------------------
 * 视频条
 * ------------------------------------------------------------------------ */

.fn-video-strip {
  flex: 0 0 auto;
  margin: 0 12px;
  padding: 10px 12px 11px;
  border-radius: 12px;
  background: var(--fn-surface);
  border: 1px solid var(--fn-line);
}

.fn-video-top {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.fn-video-badge {
  width: 29px;
  height: 29px;
  border-radius: 8px;
  background: var(--fn-primary);
  color: var(--fn-on-primary);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  box-shadow: 0 2px 6px rgba(20, 20, 15, 0.12);
}

.fn-video-badge.is-empty {
  background: var(--fn-surface-2);
  color: var(--fn-muted);
  box-shadow: none;
}

.fn-video-meta {
  min-width: 0;
  flex: 1;
}

.fn-video-title {
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--fn-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fn-video-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--fn-muted);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fn-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--fn-success);
  flex: 0 0 auto;
}

.fn-status-dot.is-paused {
  background: #c9a23b;
}

.fn-status-dot.is-empty {
  background: var(--fn-muted);
}

.fn-live-pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 6px;
  background: var(--fn-bg);
  border: 1px solid var(--fn-line);
  font-size: 10px;
  color: var(--fn-text-soft);
  font-variant-numeric: tabular-nums;
}

.fn-live-pill b {
  color: var(--fn-primary-ink);
  font-weight: 700;
}

.fn-transport {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 9px;
}

.fn-play-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--fn-primary);
  color: var(--fn-on-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(20, 20, 15, 0.14);
  transition: transform 0.15s, box-shadow 0.15s;
}

.fn-play-btn:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 12px rgba(20, 20, 15, 0.18);
}

.fn-play-btn:disabled {
  opacity: 0.45;
  box-shadow: none;
}

.fn-transport-btn {
  width: 24px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--fn-text-soft);
}

.fn-transport-btn:hover {
  background: var(--fn-surface-2);
  color: var(--fn-text);
}

.fn-transport-btn:disabled {
  opacity: 0.35;
}

.fn-time-display {
  margin-left: 2px;
  font-size: 10.5px;
  color: var(--fn-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.fn-time-display b {
  color: var(--fn-text);
  font-weight: 600;
}

.fn-spacer {
  flex: 1;
}

.fn-speed-btn {
  height: 22px;
  padding: 0 7px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  color: var(--fn-text-soft);
  background: var(--fn-bg);
  border: 1px solid var(--fn-line);
  font-variant-numeric: tabular-nums;
}

.fn-speed-btn:hover {
  border-color: var(--fn-primary-ink);
  color: var(--fn-primary-ink);
}

.fn-progress {
  position: relative;
  height: 12px;
  margin-top: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.fn-progress::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--fn-line-strong) 76%, transparent);
  overflow: hidden;
}

.fn-progress-buffer,
.fn-progress-played {
  position: absolute;
  left: 0;
  height: 3px;
  border-radius: 3px;
  pointer-events: none;
}

.fn-progress-buffer {
  background: color-mix(in srgb, var(--fn-primary) 20%, transparent);
}

.fn-progress-played {
  background: var(--fn-primary);
}

.fn-progress-knob {
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--fn-bg);
  border: 2px solid var(--fn-primary);
  transform: translateX(-50%);
  box-shadow: 0 1px 4px rgba(20, 20, 15, 0.2);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
}

.fn-progress:hover .fn-progress-knob {
  opacity: 1;
}

.fn-video-strip.is-empty .fn-progress,
.fn-video-strip.is-empty .fn-transport-btn,
.fn-video-strip.is-empty .fn-speed-btn {
  opacity: 0.4;
  pointer-events: none;
}

.fn-video-strip.is-empty .fn-play-btn {
  opacity: 0.4;
  box-shadow: none;
}

/* --------------------------------------------------------------------------
 * 快捷操作
 * ------------------------------------------------------------------------ */

.fn-quickbar {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
  padding: 9px 12px 8px;
}

.fn-recording-bar {
  flex: 0 0 auto;
  margin: -2px 12px 8px;
  min-height: 34px;
  padding: 5px 8px 5px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--fn-danger) 8%, var(--fn-bg));
  border: 1px solid color-mix(in srgb, var(--fn-danger) 22%, transparent);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: var(--fn-text-soft);
}

.fn-recording-bar b {
  font-variant-numeric: tabular-nums;
  color: var(--fn-danger);
}

.fn-recording-hint {
  font-size: 9px;
  color: var(--fn-muted);
  white-space: nowrap;
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fn-recording-bar > span:not(.fn-recording-dot):not(.fn-recording-hint) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fn-recording-bar > b {
  flex: 0 0 auto;
}

.fn-recording-bar .fn-btn {
  flex: 0 0 auto;
  white-space: nowrap;
}

.fn-auto-audio-toggle {
  height: 28px;
  padding: 0 7px;
  border: 1px solid var(--fn-line);
  border-radius: 7px;
  background: var(--fn-bg);
  flex: 0 0 auto;
}

.fn-auto-audio-toggle:hover {
  border-color: color-mix(in srgb, var(--fn-primary) 35%, var(--fn-line));
}

.fn-recording-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--fn-danger);
  box-shadow: 0 0 0 0 rgba(229, 72, 77, 0.4);
  animation: fnPulseRed 1.4s infinite;
}

@keyframes fnPulseRed {
  0% { box-shadow: 0 0 0 0 rgba(229, 72, 77, 0.4); }
  70% { box-shadow: 0 0 0 7px rgba(229, 72, 77, 0); }
  100% { box-shadow: 0 0 0 0 rgba(229, 72, 77, 0); }
}

.fn-quick-btn {
  height: 31px;
  border-radius: 8px;
  border: 1px solid var(--fn-line);
  background: var(--fn-bg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--fn-text-soft);
  transition: all 0.15s;
  white-space: nowrap;
}

.fn-quick-btn .fn-icon {
  color: var(--fn-muted);
}

.fn-quick-btn:hover {
  border-color: color-mix(in srgb, var(--fn-primary) 55%, var(--fn-line));
  color: var(--fn-primary-ink);
  background: var(--fn-primary-soft);
}

.fn-quick-btn:hover .fn-icon {
  color: var(--fn-primary-ink);
}

.fn-quick-btn.is-primary {
  border-color: transparent;
  background: var(--fn-primary);
  color: var(--fn-on-primary);
  font-weight: 600;
  box-shadow: none;
}

.fn-quick-btn.is-primary .fn-icon {
  color: var(--fn-on-primary);
}

.fn-quick-btn.is-primary:hover {
  background: var(--fn-accent);
  color: var(--fn-on-primary);
  transform: translateY(-1px);
}

.fn-quick-btn.is-primary:hover .fn-icon {
  color: var(--fn-on-primary);
}

.fn-quick-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

#fn-root[data-theme="dark"] .fn-quick-btn:not(.is-primary) {
  background: var(--fn-surface);
  border-color: var(--fn-line-strong);
  color: var(--fn-text);
}

#fn-root[data-theme="dark"] .fn-quick-btn:not(.is-primary) .fn-icon {
  color: var(--fn-text-soft);
}

#fn-root[data-theme="dark"] .fn-quick-btn:not(.is-primary):hover {
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
}

/* --------------------------------------------------------------------------
 * 主标签
 * ------------------------------------------------------------------------ */

.fn-tabs {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 12px;
  padding: 3px;
  border-radius: 10px;
  background: var(--fn-surface);
  border: 1px solid color-mix(in srgb, var(--fn-line) 70%, transparent);
}

.fn-inline-progress-slot {
  flex: 0 0 auto;
  padding: 8px 12px 0;
}

.fn-inline-progress {
  border-radius: 11px;
  border: 1px solid color-mix(in srgb, var(--fn-primary) 24%, var(--fn-line));
  background: var(--fn-bg);
  box-shadow: none;
  padding: 9px 10px 8px;
}

.fn-inline-progress-head {
  display: flex;
  align-items: flex-start;
  gap: 7px;
}

.fn-inline-spinner {
  width: 23px;
  height: 23px;
  flex: 0 0 auto;
  border-radius: 7px;
  background: var(--fn-primary);
  color: var(--fn-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
}

.fn-inline-progress-title {
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}

.fn-inline-progress-title b {
  display: block;
  font-size: 11.5px;
  font-weight: 650;
  color: var(--fn-text);
}

.fn-inline-progress-title span {
  display: block;
  margin-top: 1px;
  font-size: 9.5px;
  color: var(--fn-muted);
}

.fn-inline-progress-body {
  margin-top: 4px;
}

.fn-inline-progress-content > p {
  margin: 3px 0 5px;
  font-size: 10px;
  color: var(--fn-text-soft);
  line-height: 1.55;
}

.fn-inline-progress .fn-progress-bar {
  height: 4px;
  margin: 5px 0 6px;
}

.fn-inline-progress .fn-progress-steps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 5px;
}

.fn-progress-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 6px;
}

.fn-progress-stop,
.fn-progress-resume,
.fn-progress-close {
  min-height: 24px;
  padding: 0 9px;
  border-radius: 6px;
  border: 1px solid var(--fn-line-strong);
  background: var(--fn-surface);
  color: var(--fn-text-soft);
  font-size: 10px;
}

.fn-progress-stop:hover,
.fn-progress-close:hover {
  color: var(--fn-text);
  border-color: var(--fn-line-strong);
}

.fn-progress-stop:disabled {
  opacity: 0.5;
}

.fn-progress-resume {
  border-color: transparent;
  background: var(--fn-primary);
  color: var(--fn-on-primary);
  font-weight: 650;
}

.fn-progress-stopped {
  padding: 3px 0 1px;
}

.fn-progress-stopped b {
  display: block;
  font-size: 11px;
  color: var(--fn-text);
}

.fn-progress-stopped p {
  margin: 2px 0 0;
  font-size: 9.5px;
  line-height: 1.5;
  color: var(--fn-muted);
}

.fn-inline-progress .fn-progress-step {
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 9px;
  gap: 4px;
}

.fn-inline-progress .fn-progress-step-icon {
  width: 12px;
  height: 12px;
}

.fn-inline-progress .fn-progress-step .fn-spinner {
  width: 9px;
  height: 9px;
  border-width: 1.4px;
}

.fn-inline-progress .fn-explanation {
  margin: 0 0 7px;
  font-size: 10px;
}

.fn-tab {
  flex: 1;
  height: 29px;
  border-radius: 7px;
  font-size: 11.5px;
  color: var(--fn-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.15s;
  white-space: nowrap;
}

.fn-tab:hover {
  color: var(--fn-text);
}

.fn-tab.is-active {
  background: var(--fn-primary);
  color: var(--fn-on-primary);
  font-weight: 650;
  box-shadow: none;
}

.fn-tab.is-active .fn-icon {
  color: var(--fn-on-primary);
}

.fn-tab .fn-icon {
  width: 14px;
  height: 14px;
}

/* --------------------------------------------------------------------------
 * 主体
 * ------------------------------------------------------------------------ */

.fn-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 10px 12px 18px;
  scrollbar-width: thin;
  scrollbar-color: var(--fn-line-strong) transparent;
}

.fn-scroll::-webkit-scrollbar {
  width: 7px;
}

.fn-scroll::-webkit-scrollbar-thumb {
  background: var(--fn-line-strong);
  border-radius: 6px;
  border: 2px solid var(--fn-bg);
}

.fn-scroll.is-chat {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 9px;
}

.fn-view {
  display: none;
  animation: fnFadeUp 0.22s ease;
}

.fn-view.is-active {
  display: block;
}

@keyframes fnFadeUp {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.fn-footer {
  flex: 0 0 auto;
  height: 35px;
  padding: 0 14px;
  border-top: 1px solid var(--fn-line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--fn-bg-soft);
  font-size: 10.5px;
  color: var(--fn-muted);
}

.fn-save-state {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fn-save-state .fn-status-dot {
  width: 5px;
  height: 5px;
}

.fn-save-state.is-saving .fn-status-dot {
  background: var(--fn-primary);
  animation: fnPulse 1.2s infinite;
}

.fn-save-state.is-error {
  color: var(--fn-danger);
}

.fn-save-state.is-error .fn-status-dot {
  background: var(--fn-danger);
}

.fn-footer-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.fn-footer-btn {
  height: 24px;
  padding: 0 7px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  color: var(--fn-text-soft);
}

.fn-footer-btn:hover {
  background: var(--fn-surface);
  color: var(--fn-text);
}

/* --------------------------------------------------------------------------
 * 通用组件
 * ------------------------------------------------------------------------ */

.fn-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 13px;
  border-radius: 8px;
  border: 1px solid var(--fn-line);
  background: var(--fn-bg);
  color: var(--fn-text-soft);
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s;
  white-space: nowrap;
}

.fn-btn:hover {
  border-color: color-mix(in srgb, var(--fn-primary) 55%, var(--fn-line));
  color: var(--fn-primary-ink);
  background: var(--fn-primary-soft);
}

.fn-btn.is-primary {
  border-color: transparent;
  background: var(--fn-primary);
  color: var(--fn-on-primary);
  box-shadow: none;
}

.fn-btn.is-primary:hover {
  background: var(--fn-accent);
  color: var(--fn-on-primary);
}

.fn-btn.is-ghost {
  border-color: transparent;
  background: transparent;
}

.fn-btn.is-danger {
  color: var(--fn-danger);
}

.fn-btn.is-danger:hover {
  background: color-mix(in srgb, var(--fn-danger) 8%, transparent);
  border-color: color-mix(in srgb, var(--fn-danger) 30%, transparent);
}

.fn-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 深色主题：次级按钮不要与背景糊在一起，文字用高对比近白色 */
#fn-root[data-theme="dark"] .fn-btn:not(.is-primary):not(.is-danger):not(.is-ghost) {
  background: var(--fn-surface);
  border-color: var(--fn-line-strong);
  color: var(--fn-text);
}

#fn-root[data-theme="dark"] .fn-btn:not(.is-primary):not(.is-danger):not(.is-ghost):hover {
  background: var(--fn-primary-soft);
  border-color: color-mix(in srgb, var(--fn-primary) 55%, var(--fn-line));
  color: var(--fn-primary-ink);
}

#fn-root[data-theme="dark"] .fn-btn.is-sm,
#fn-root[data-theme="dark"] .fn-btn.is-xs {
  font-weight: 550;
}

.fn-btn.is-sm {
  height: 28px;
  padding: 0 9px;
  font-size: 11px;
  border-radius: 7px;
}

.fn-btn.is-xs {
  height: 24px;
  padding: 0 7px;
  font-size: 10.5px;
  border-radius: 6px;
}

.fn-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border-radius: 20px;
  background: var(--fn-surface);
  color: var(--fn-text-soft);
  font-size: 10.5px;
  white-space: nowrap;
}

.fn-chip.is-primary {
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
}

.fn-ts {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 19px;
  padding: 0 6px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--fn-primary) 10%, transparent);
  color: var(--fn-primary-ink);
  font-size: 10.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  vertical-align: 1px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  border: 0;
}

.fn-ts::before {
  content: "";
  width: 0;
  height: 0;
  border-top: 3.5px solid transparent;
  border-bottom: 3.5px solid transparent;
  border-left: 5px solid currentColor;
  opacity: 0.85;
}

.fn-ts:hover,
.fn-ts.is-active {
  background: var(--fn-primary);
  color: var(--fn-on-primary);
}

.fn-link-btn {
  color: var(--fn-primary-ink);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
}

.fn-link-btn:hover {
  text-decoration: underline;
}

.fn-divider {
  height: 1px;
  background: var(--fn-line);
  margin: 12px 0;
}

.fn-muted {
  color: var(--fn-muted);
}

.fn-small {
  font-size: 10.5px;
}

/* 空状态改为左图右文，避免整块居中显得松散、占地方。 */
.fn-empty {
  padding: 18px 14px;
  text-align: left;
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  column-gap: 12px;
  row-gap: 4px;
  align-items: start;
}

.fn-empty.is-card {
  padding: 14px 16px;
  border: 1px solid var(--fn-line);
  border-radius: 12px;
  background: var(--fn-bg-soft);
}

.fn-empty-art {
  grid-row: 1 / span 4;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
  border: 1px solid color-mix(in srgb, var(--fn-primary) 12%, transparent);
  margin: 0;
}

.fn-empty h3 {
  grid-column: 2;
  margin: 0;
  font-size: 14px;
  font-weight: 650;
  color: var(--fn-text);
}

.fn-empty p {
  grid-column: 2;
  margin: 0;
  max-width: none;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--fn-muted);
}

.fn-empty-actions {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 3px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

/* --------------------------------------------------------------------------
 * 笔记视图
 * ------------------------------------------------------------------------ */

.fn-note-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.fn-template-switch {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: 8px;
  background: var(--fn-surface);
  border: 1px solid color-mix(in srgb, var(--fn-line) 70%, transparent);
}

.fn-template-btn {
  height: 25px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--fn-muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
}

.fn-template-btn:hover {
  color: var(--fn-text);
}

.fn-template-btn.is-active {
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
  font-weight: 650;
  box-shadow: none;
}

.fn-note-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.fn-mini-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--fn-muted);
}

.fn-mini-btn:hover {
  background: var(--fn-surface);
  color: var(--fn-text);
}

.fn-ai-banner {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  border-radius: 8px;
  background: var(--fn-bg);
  border: 1px solid var(--fn-line);
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.fn-ai-banner:hover {
  border-color: color-mix(in srgb, var(--fn-primary) 60%, var(--fn-line));
}

.fn-ai-banner-icon {
  width: 23px;
  height: 23px;
  border-radius: 7px;
  background: var(--fn-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fn-on-primary);
  flex: 0 0 auto;
  box-shadow: none;
}

.fn-ai-banner-text {
  flex: 1;
  min-width: 0;
}

.fn-ai-banner-text b {
  display: block;
  font-size: 11.5px;
  font-weight: 650;
  color: var(--fn-text);
}

.fn-ai-banner-text span {
  display: none;
}

.fn-note-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 2px 7px;
}

.fn-note-title {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.1px;
  color: var(--fn-text);
  padding: 2px 0;
  border-radius: 4px;
}

.fn-note-title:hover {
  background: color-mix(in srgb, var(--fn-surface) 65%, transparent);
}

.fn-note-title::placeholder {
  color: var(--fn-muted);
}

.fn-note-meta-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--fn-muted);
  margin: 0 2px 8px;
  flex-wrap: wrap;
}

.fn-note-meta-line .fn-dot {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: var(--fn-line-strong);
}

.fn-note-card {
  background: var(--fn-bg);
  border: 1px solid var(--fn-line);
  border-radius: 12px;
  overflow: hidden;
}

.fn-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 5px 6px;
  border-bottom: 1px solid var(--fn-line);
  background: var(--fn-bg-soft);
  flex-wrap: wrap;
}

.fn-editor-tool {
  width: 26px;
  height: 26px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--fn-text-soft);
}

.fn-editor-tool:hover {
  background: var(--fn-surface-2);
  color: var(--fn-primary-ink);
}

.fn-editor-tool.is-text {
  width: auto;
  padding: 0 7px;
  gap: 3px;
  font-size: 10.5px;
}

.fn-editor-sep {
  width: 1px;
  height: 14px;
  background: var(--fn-line);
  margin: 0 3px;
}

.fn-editor {
  min-height: 300px;
  max-height: 56vh;
  overflow-y: auto;
  padding: 13px 15px 30px;
  font-size: 13px;
  line-height: 1.85;
  color: var(--fn-text);
  outline: none;
  word-break: break-word;
}

.fn-editor:empty::before {
  content: attr(data-placeholder);
  color: var(--fn-muted);
  pointer-events: none;
  font-size: 12px;
  line-height: 1.8;
}

.fn-editor > *:first-child {
  margin-top: 0;
}

.fn-editor h1,
.fn-editor h2,
.fn-editor h3 {
  line-height: 1.45;
  color: var(--fn-text);
  margin: 1.2em 0 0.45em;
}

.fn-editor h1 {
  font-size: 19px;
  font-weight: 750;
}

.fn-editor h2 {
  font-size: 15.5px;
  font-weight: 700;
  padding-left: 9px;
  border-left: 3px solid var(--fn-primary);
}

.fn-editor h3 {
  font-size: 13.5px;
  font-weight: 700;
}

.fn-editor p {
  margin: 0.55em 0;
}

.fn-editor ul,
.fn-editor ol {
  margin: 0.5em 0;
  padding-left: 1.45em;
}

.fn-editor li {
  margin: 0.22em 0;
}

.fn-editor blockquote {
  margin: 0.8em 0;
  padding: 7px 11px;
  border-left: 3px solid color-mix(in srgb, var(--fn-primary) 50%, transparent);
  background: var(--fn-surface);
  border-radius: 0 6px 6px 0;
  color: var(--fn-text-soft);
  font-size: 12px;
}

.fn-editor code {
  font-family: var(--fn-mono);
  font-size: 11.5px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--fn-surface-2);
  color: #c24188;
}

.fn-editor pre {
  padding: 10px 12px;
  border-radius: 8px;
  background: #1e1d2b;
  color: #e9e8f5;
  overflow-x: auto;
  font-size: 11.5px;
  line-height: 1.65;
}

.fn-editor pre code {
  padding: 0;
  background: none;
  color: inherit;
}

.fn-editor table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.8em 0;
  font-size: 11.5px;
}

.fn-editor th,
.fn-editor td {
  border: 1px solid var(--fn-line);
  padding: 6px 8px;
  text-align: left;
  vertical-align: top;
}

.fn-editor th {
  background: var(--fn-surface);
  font-weight: 650;
}

.fn-editor img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 4px auto;
  border: 1px solid var(--fn-line);
}

.fn-editor figure {
  margin: 10px 0;
  padding: 0;
}

.fn-editor figcaption {
  margin-top: 5px;
  color: var(--fn-muted);
  font-size: 10px;
  text-align: center;
}

.fn-editor a {
  color: var(--fn-primary-ink);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.fn-editor hr {
  border: 0;
  height: 1px;
  background: var(--fn-line);
  margin: 1.2em 0;
}

.fn-editor mark {
  background: #fff1b8;
  color: #4a3c00;
  padding: 0 2px;
  border-radius: 2px;
}

.fn-editor .fn-star {
  color: var(--fn-primary-ink);
  font-size: 14px;
  vertical-align: 1px;
}

.fn-editor .fn-ai-signature {
  margin-top: 18px;
  color: var(--fn-muted);
  font-size: 9.5px;
  text-align: right;
}

.fn-editor .fn-ocr-quote {
  background: color-mix(in srgb, var(--fn-primary) 5%, var(--fn-surface));
  border-left-color: var(--fn-primary-ink);
}

.fn-editor-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-top: 1px solid var(--fn-line);
  background: var(--fn-bg-soft);
  font-size: 10px;
  color: var(--fn-muted);
}

.fn-editor-status .fn-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.fn-outline-tools,
.fn-transcript-tools {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.fn-outline-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 0;
}

.fn-outline-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  border-radius: 6px;
  padding: 3px 4px 3px 6px;
  min-height: 31px;
  transition: background 0.15s;
}

.fn-outline-row:hover {
  background: var(--fn-bg-soft);
}

.fn-outline-row.is-star .fn-outline-text {
  color: #8a6600;
  font-weight: 600;
}

.fn-outline-handle {
  width: 13px;
  flex: 0 0 auto;
  padding-top: 5px;
  color: var(--fn-line-strong);
  cursor: grab;
  opacity: 0;
}

.fn-outline-row:hover .fn-outline-handle {
  opacity: 1;
}

.fn-outline-bullet {
  flex: 0 0 auto;
  width: 14px;
  display: flex;
  justify-content: center;
  padding-top: 7px;
}

.fn-outline-bullet span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--fn-primary) 60%, var(--fn-line));
  background: var(--fn-bg);
}

.fn-outline-row[data-level="1"] .fn-outline-bullet span {
  background: var(--fn-primary);
  border-color: var(--fn-primary-ink);
}

.fn-outline-row[data-level="3"] .fn-outline-bullet span,
.fn-outline-row[data-level="4"] .fn-outline-bullet span {
  width: 4px;
  height: 4px;
  border: 0;
  background: var(--fn-muted);
}

.fn-outline-text {
  flex: 1;
  min-width: 0;
  padding: 3px 2px;
  font-size: 12.5px;
  line-height: 1.6;
  outline: none;
  word-break: break-word;
  min-height: 25px;
}

.fn-outline-text:empty::before {
  content: "输入知识点…";
  color: var(--fn-muted);
  pointer-events: none;
}

.fn-outline-ts {
  flex: 0 0 auto;
  margin-top: 4px;
  height: 19px;
  font-size: 10px;
}

.fn-outline-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 0;
  opacity: 0;
  transition: opacity 0.15s;
  margin-top: 1px;
}

.fn-outline-row:hover .fn-outline-actions,
.fn-outline-row:focus-within .fn-outline-actions {
  opacity: 1;
}

.fn-outline-action {
  width: 22px;
  height: 24px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--fn-muted);
}

.fn-outline-action:hover {
  background: var(--fn-surface-2);
  color: var(--fn-primary-ink);
}

.fn-outline-action.is-starred {
  color: #d4a017;
}

.fn-outline-add {
  width: 100%;
  height: 31px;
  border-radius: 7px;
  border: 1px dashed var(--fn-line-strong);
  color: var(--fn-muted);
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 7px;
}

.fn-outline-add:hover {
  border-color: var(--fn-primary-ink);
  color: var(--fn-primary-ink);
  background: var(--fn-primary-soft);
}

.fn-outline-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--fn-muted);
  font-size: 10px;
  margin-top: 6px;
  padding-left: 2px;
}

/* 文稿 */

.fn-transcript-search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 9px;
  border-radius: 7px;
  border: 1px solid var(--fn-line);
  background: var(--fn-bg);
  margin-bottom: 7px;
}

.fn-transcript-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  outline: none;
  font-size: 11px;
}

.fn-transcript-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 58vh;
  overflow-y: auto;
}

.fn-segment {
  display: flex;
  gap: 8px;
  padding: 7px 7px;
  border-radius: 7px;
  transition: background 0.15s;
  border-left: 2px solid transparent;
}

.fn-segment:hover {
  background: var(--fn-bg-soft);
}

.fn-segment.is-active {
  background: var(--fn-primary-soft);
  border-left-color: var(--fn-primary-ink);
}

.fn-segment-time {
  flex: 0 0 auto;
  min-width: 40px;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--fn-primary-ink);
  font-variant-numeric: tabular-nums;
  padding-top: 2px;
  text-align: left;
}

.fn-segment-body {
  flex: 1;
  min-width: 0;
}

.fn-segment-text {
  font-size: 12px;
  line-height: 1.65;
  color: var(--fn-text-soft);
  word-break: break-word;
  outline: none;
}

.fn-segment.is-active .fn-segment-text {
  color: var(--fn-text);
}

.fn-segment-actions {
  display: flex;
  gap: 0;
  margin-top: 3px;
  opacity: 0;
  transition: opacity 0.15s;
}

.fn-segment:hover .fn-segment-actions {
  opacity: 1;
}

.fn-segment-action {
  height: 20px;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 9.5px;
  color: var(--fn-muted);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.fn-segment-action:hover {
  background: var(--fn-surface-2);
  color: var(--fn-primary-ink);
}

.fn-transcript-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px solid var(--fn-line);
  font-size: 10px;
  color: var(--fn-muted);
}

.fn-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 10.5px;
  color: var(--fn-muted);
  user-select: none;
}

.fn-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.fn-toggle-track {
  width: 27px;
  height: 15px;
  border-radius: 10px;
  background: var(--fn-line-strong);
  position: relative;
  transition: background 0.18s;
  flex: 0 0 auto;
}

.fn-toggle-track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.18s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}

.fn-toggle input:checked + .fn-toggle-track {
  background: var(--fn-primary);
}

.fn-toggle input:checked + .fn-toggle-track::after {
  transform: translateX(12px);
}

/* 空文稿 */

.fn-transcript-empty {
  padding: 22px 16px;
  border: 1px dashed var(--fn-line-strong);
  border-radius: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.fn-transcript-empty p {
  margin: 0;
  font-size: 11px;
  line-height: 1.7;
  color: var(--fn-muted);
  max-width: 290px;
}

.fn-transcript-empty-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

/* --------------------------------------------------------------------------
 * 速览
 * ------------------------------------------------------------------------ */

.fn-view-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin: 2px 2px 9px;
}

.fn-view-head > div:first-child {
  flex: 1 1 170px;
  min-width: 0;
}

.fn-view-head .fn-map-source {
  margin-left: auto;
}

.fn-view-title {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--fn-text);
  line-height: 1.35;
}

.fn-view-sub {
  font-size: 10.5px;
  color: var(--fn-muted);
  margin-top: 2px;
}

.fn-view-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.fn-view-actions .fn-btn {
  flex: 0 0 auto;
  width: auto;
  height: auto;
  min-height: 28px;
  padding: 5px 9px;
  line-height: 1.25;
  white-space: nowrap;
}

.fn-overview-card {
  position: relative;
  padding: 14px 14px 13px;
  border-radius: 12px;
  background: var(--fn-bg);
  border: 1px solid var(--fn-line);
  border-left: 3px solid var(--fn-primary);
  margin-bottom: 11px;
}

.fn-overview-eyebrow {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--fn-primary-ink);
  margin-bottom: 6px;
}

.fn-overview-text {
  font-size: 12.5px;
  line-height: 1.85;
  color: var(--fn-text-soft);
  margin: 0;
}

.fn-keyword-row {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 9px;
}

.fn-keypoint-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  margin-bottom: 13px;
}

.fn-keypoint {
  padding: 9px 10px;
  border-radius: 9px;
  background: var(--fn-bg);
  border: 1px solid var(--fn-line);
  display: flex;
  gap: 7px;
  align-items: flex-start;
}

.fn-keypoint-num {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
  font-size: 9.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fn-keypoint p {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--fn-text-soft);
}

.fn-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 14px 2px 8px;
  font-size: 11px;
  font-weight: 650;
  color: var(--fn-text);
}

.fn-section-label::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--fn-line);
}

.fn-chapter {
  display: flex;
  gap: 9px;
  padding: 10px 0;
  border-bottom: 1px solid var(--fn-line);
}

.fn-chapter:last-child {
  border-bottom: 0;
}

.fn-chapter-time {
  flex: 0 0 auto;
  padding-top: 1px;
}

.fn-chapter-body {
  flex: 1;
  min-width: 0;
}

.fn-chapter-title {
  font-size: 12px;
  font-weight: 650;
  color: var(--fn-text);
  margin: 0 0 3px;
  line-height: 1.5;
}

.fn-chapter-summary {
  font-size: 11px;
  line-height: 1.7;
  color: var(--fn-muted);
  margin: 0;
}

.fn-chapter-points {
  margin: 5px 0 0;
  padding-left: 14px;
  font-size: 11px;
  line-height: 1.7;
  color: var(--fn-text-soft);
}

.fn-chapter-points li {
  margin: 2px 0;
}

.fn-term-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--fn-line);
  border-radius: 9px;
  overflow: hidden;
  font-size: 11px;
}

.fn-term-table th,
.fn-term-table td {
  padding: 7px 9px;
  text-align: left;
  border-bottom: 1px solid var(--fn-line);
  vertical-align: top;
}

.fn-term-table tr:last-child td {
  border-bottom: 0;
}

.fn-term-table th {
  background: var(--fn-surface);
  color: var(--fn-text-soft);
  font-weight: 650;
  width: 36%;
}

.fn-term-table td {
  color: var(--fn-muted);
  line-height: 1.6;
}

/* --------------------------------------------------------------------------
 * 导图
 * ------------------------------------------------------------------------ */

.fn-map-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  row-gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.fn-map-source {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 1px;
  padding: 2px;
  border-radius: 8px;
  background: var(--fn-surface);
  border: 1px solid var(--fn-line);
}

.fn-map-source button {
  flex: 0 0 auto;
  min-width: max-content;
  height: auto;
  min-height: 28px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.25;
  color: var(--fn-text-soft);
  white-space: nowrap;
}

#fn-root[data-theme="dark"] .fn-map-source button {
  color: var(--fn-text);
}

.fn-map-source button.is-active,
#fn-root[data-theme="dark"] .fn-map-source button.is-active {
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
  font-weight: 650;
  box-shadow: none;
}

.fn-map-shell {
  position: relative;
  height: min(56vh, 580px);
  border-radius: 12px;
  border: 1px solid var(--fn-line);
  background: #fbfbf8;
  overflow: hidden;
}

#fn-root[data-theme="dark"] .fn-map-shell {
  background: #171714;
}

.fn-map-stage {
  position: absolute;
  inset: 0;
  overflow: auto;
  cursor: grab;
  scrollbar-width: thin;
  scrollbar-color: var(--fn-line-strong) transparent;
}

.fn-map-stage.is-dragging {
  cursor: grabbing;
}

.fn-map-inner {
  transform-origin: 0 0;
  padding: 0;
  width: max-content;
  min-width: 100%;
  min-height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.fn-map-inner.is-centered {
  justify-content: center;
}

.fn-map-inner svg {
  display: block;
  max-width: none;
  height: auto;
}

.fn-map-node {
  cursor: default;
  transition: filter 0.15s;
}

.fn-map-node.is-seekable {
  cursor: pointer;
}

.fn-map-node.is-seekable:hover rect {
  filter: brightness(0.98);
}

.fn-map-node.is-seekable:hover {
  filter: drop-shadow(0 3px 7px rgba(60, 52, 140, 0.16));
}

.fn-map-node:focus-visible {
  outline: 2px solid var(--fn-primary);
}

.fn-map-zoom {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--fn-bg) 92%, transparent);
  border: 1px solid var(--fn-line);
  box-shadow: 0 4px 14px rgba(30, 25, 70, 0.1);
  z-index: 3;
}

.fn-map-zoom button {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--fn-text-soft);
}

.fn-map-zoom button:hover {
  background: var(--fn-surface);
  color: var(--fn-primary-ink);
}

.fn-map-zoom span {
  min-width: 34px;
  text-align: center;
  font-size: 9.5px;
  color: var(--fn-muted);
  font-variant-numeric: tabular-nums;
}

.fn-map-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9.5px;
  color: var(--fn-muted);
  margin-top: 6px;
  padding-left: 2px;
}

.fn-map-legend {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 6px;
  font-size: 9.5px;
  color: var(--fn-muted);
}

.fn-map-legend i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 3px;
  vertical-align: -1px;
}

.fn-map-empty-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

/* --------------------------------------------------------------------------
 * 练习
 * ------------------------------------------------------------------------ */

.fn-quiz-config {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.fn-select {
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--fn-line);
  background: var(--fn-bg);
  color: var(--fn-text-soft);
  padding: 0 6px;
  font-size: 10.5px;
  cursor: pointer;
}

.fn-quiz-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border-radius: 9px;
  background: var(--fn-primary-soft);
  margin-bottom: 10px;
  font-size: 11px;
  color: var(--fn-primary-ink);
}

.fn-quiz-summary b {
  font-size: 15px;
}

.fn-question-card {
  border: 1px solid var(--fn-line);
  border-radius: 11px;
  background: var(--fn-bg);
  margin-bottom: 9px;
  overflow: hidden;
}

.fn-question-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 11px 12px 8px;
}

.fn-question-num {
  flex: 0 0 auto;
  width: 21px;
  height: 21px;
  border-radius: 6px;
  background: var(--fn-surface);
  color: var(--fn-text-soft);
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.fn-question-text {
  flex: 1;
  font-size: 12px;
  line-height: 1.7;
  font-weight: 550;
  color: var(--fn-text);
  margin: 0;
}

.fn-question-body {
  padding: 0 12px 10px 41px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.fn-option {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  width: 100%;
  padding: 7px 9px;
  border-radius: 7px;
  border: 1px solid var(--fn-line);
  background: var(--fn-bg);
  text-align: left;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--fn-text-soft);
  transition: all 0.15s;
}

.fn-option:hover {
  border-color: color-mix(in srgb, var(--fn-primary) 45%, var(--fn-line));
  background: var(--fn-bg-soft);
}

.fn-option-letter {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--fn-line-strong);
  font-size: 8.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fn-muted);
  margin-top: 1px;
}

.fn-option.is-selected {
  border-color: var(--fn-primary-ink);
  background: var(--fn-primary-soft);
  color: var(--fn-text);
}

.fn-option.is-selected .fn-option-letter {
  background: var(--fn-primary);
  border-color: var(--fn-primary);
  color: var(--fn-on-primary);
}

.fn-option.is-correct {
  border-color: color-mix(in srgb, var(--fn-success) 50%, var(--fn-line));
  background: color-mix(in srgb, var(--fn-success) 7%, var(--fn-bg));
  color: var(--fn-text);
}

.fn-option.is-correct .fn-option-letter {
  background: var(--fn-success);
  border-color: var(--fn-success);
  color: #fff;
}

.fn-option.is-wrong {
  border-color: color-mix(in srgb, var(--fn-danger) 45%, var(--fn-line));
  background: color-mix(in srgb, var(--fn-danger) 6%, var(--fn-bg));
}

.fn-option.is-wrong .fn-option-letter {
  background: var(--fn-danger);
  border-color: var(--fn-danger);
  color: #fff;
}

.fn-option:disabled {
  cursor: default;
}

.fn-explanation {
  margin: 0 12px 11px 41px;
  padding: 8px 10px;
  border-radius: 7px;
  background: var(--fn-surface);
  font-size: 10.5px;
  line-height: 1.7;
  color: var(--fn-text-soft);
}

.fn-explanation b {
  color: var(--fn-text);
}

.fn-explanation .fn-ts {
  margin-left: 4px;
}

/* --------------------------------------------------------------------------
 * AI 对话
 * ------------------------------------------------------------------------ */

.fn-chat-view {
  flex: 1;
  display: none;
  flex-direction: column;
  min-height: 0;
  /* 和上方的笔记 / 速览 / 导图等功能区拉开层次，避免看成同一块。 */
  border-top: 1px solid var(--fn-line);
  margin-top: 2px;
  padding-top: 9px;
}

.fn-chat-view.is-active {
  display: flex;
}

.fn-chat-intro {
  margin: 2px 0 10px;
  padding: 12px;
  border: 1px solid var(--fn-line);
  border-radius: 12px;
  background: var(--fn-bg-soft);
}

.fn-chat-intro-main {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  column-gap: 10px;
  align-items: start;
}

.fn-chat-intro .fn-empty-art {
  grid-row: auto;
  width: 42px;
  height: 42px;
  border-radius: 12px;
}

.fn-chat-copy {
  min-width: 0;
}

.fn-chat-kicker {
  margin-bottom: 3px;
  color: var(--fn-primary-ink);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.fn-chat-intro h3 {
  margin: 0 0 3px;
  color: var(--fn-text);
  font-size: 13px;
  font-weight: 650;
}

.fn-chat-intro p {
  margin: 0;
  color: var(--fn-muted);
  font-size: 11px;
  line-height: 1.65;
}

.fn-chat-intro .fn-suggestions {
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px dashed var(--fn-line);
}

.fn-chat-prompt {
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px dashed var(--fn-line);
}

.fn-chat-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 2px 0 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--fn-line-strong) transparent;
}

.fn-chat-msg {
  display: flex;
  gap: 7px;
  margin-bottom: 11px;
  align-items: flex-start;
}

.fn-chat-msg.is-user {
  flex-direction: row-reverse;
}

.fn-chat-avatar {
  flex: 0 0 auto;
  width: 25px;
  height: 25px;
  border-radius: 8px;
  background: var(--fn-primary);
  color: var(--fn-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  overflow: hidden;
}

.fn-chat-avatar img {
  width: 100%;
  height: 100%;
}

.fn-chat-msg.is-user .fn-chat-avatar {
  background: var(--fn-surface-2);
  color: var(--fn-text-soft);
}

.fn-chat-bubble {
  max-width: calc(100% - 40px);
  padding: 8px 10px;
  border-radius: 4px 11px 11px 11px;
  background: var(--fn-surface);
  font-size: 11.5px;
  line-height: 1.8;
  color: var(--fn-text-soft);
  word-break: break-word;
}

.fn-chat-msg.is-user .fn-chat-bubble {
  border-radius: 11px 4px 11px 11px;
  background: var(--fn-primary);
  color: var(--fn-on-primary);
}

.fn-chat-bubble p {
  margin: 0.25em 0;
}

.fn-chat-bubble h1,
.fn-chat-bubble h2,
.fn-chat-bubble h3 {
  font-size: 12.5px;
  margin: 0.6em 0 0.3em;
  color: inherit;
}

.fn-chat-bubble ul,
.fn-chat-bubble ol {
  margin: 0.3em 0;
  padding-left: 1.2em;
}

.fn-chat-bubble li {
  margin: 0.15em 0;
}

.fn-chat-bubble code {
  font-family: var(--fn-mono);
  font-size: 10.5px;
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 4px;
  border-radius: 3px;
}

.fn-chat-bubble pre {
  background: #1e1d2b;
  color: #e9e8f5;
  padding: 8px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 10.5px;
}

.fn-chat-bubble .fn-ts {
  background: rgba(255, 255, 255, 0.18);
  color: inherit;
}

.fn-chat-msg.is-user .fn-chat-bubble .fn-ts {
  background: rgba(0, 0, 0, 0.1);
  color: var(--fn-on-primary);
}

.fn-chat-bubble a {
  color: var(--fn-primary-ink);
}

.fn-chat-msg.is-user .fn-chat-bubble a {
  color: var(--fn-on-primary);
}

.fn-chat-time {
  font-size: 9px;
  color: var(--fn-muted);
  margin-top: 3px;
  text-align: right;
}

.fn-typing {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 2px;
}

.fn-typing span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--fn-muted);
  animation: fnTyping 1.2s infinite;
}

.fn-typing span:nth-child(2) { animation-delay: 0.15s; }
.fn-typing span:nth-child(3) { animation-delay: 0.3s; }

@keyframes fnTyping {
  0%, 60%, 100% { opacity: 0.35; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-2px); }
}

.fn-suggestions {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}

.fn-suggestion {
  text-align: left;
  padding: 7px 9px;
  border-radius: 7px;
  border: 1px solid var(--fn-line);
  background: var(--fn-bg);
  font-size: 11px;
  color: var(--fn-text-soft);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}

.fn-suggestion:hover {
  border-color: color-mix(in srgb, var(--fn-primary) 35%, var(--fn-line));
  color: var(--fn-primary-ink);
  background: var(--fn-primary-soft);
}

.fn-chat-context {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9.5px;
  color: var(--fn-muted);
  padding: 4px 2px;
}

.fn-chat-composer {
  flex: 0 0 auto;
  border: 1px solid var(--fn-line);
  border-radius: 10px;
  background: var(--fn-bg);
  padding: 6px 7px 6px 10px;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.fn-chat-composer:focus-within {
  border-color: color-mix(in srgb, var(--fn-primary) 55%, var(--fn-line));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--fn-primary) 10%, transparent);
}

.fn-chat-composer textarea {
  flex: 1;
  min-width: 0;
  max-height: 110px;
  min-height: 24px;
  border: 0;
  resize: none;
  background: none;
  outline: none;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--fn-text);
  padding: 3px 0;
}

.fn-chat-composer textarea::placeholder {
  color: var(--fn-muted);
}

.fn-send-btn {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--fn-primary);
  color: var(--fn-on-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.fn-send-btn:hover {
  background: var(--fn-accent);
}

.fn-send-btn:disabled {
  opacity: 0.35;
}

/* --------------------------------------------------------------------------
 * 模态框
 * ------------------------------------------------------------------------ */

.fn-modal-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: visible;
  z-index: 2147483647;
  pointer-events: none;
}

.fn-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 17, 38, 0.44);
  backdrop-filter: blur(5px);
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  animation: fnFadeIn 0.16s ease;
}

@keyframes fnFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fn-modal {
  width: min(620px, calc(100vw - 28px));
  max-height: 88vh;
  background: var(--fn-bg);
  border-radius: 17px;
  box-shadow: 0 34px 90px rgba(20, 14, 55, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  animation: fnModalIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  border: 1px solid color-mix(in srgb, var(--fn-line) 80%, transparent);
}

@keyframes fnModalIn {
  from { opacity: 0; transform: translateY(8px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.fn-modal.is-wide {
  width: min(860px, calc(100vw - 28px));
}

.fn-modal.is-narrow {
  width: min(400px, calc(100vw - 28px));
}

.fn-modal-head {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 15px 17px 11px;
  border-bottom: 1px solid var(--fn-line);
}

.fn-modal-title {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--fn-text);
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 6px;
}

.fn-modal-sub {
  font-size: 10.5px;
  color: var(--fn-muted);
  margin-top: 2px;
  line-height: 1.55;
}

.fn-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 17px;
  scrollbar-width: thin;
  scrollbar-color: var(--fn-line-strong) transparent;
}

.fn-modal-body.is-flush {
  padding: 0;
}

.fn-modal-foot {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
  padding: 11px 17px;
  border-top: 1px solid var(--fn-line);
  background: var(--fn-bg-soft);
  flex-wrap: wrap;
}

.fn-modal-foot .fn-spacer {
  flex: 1;
}

/* 设置 */

.fn-form-section {
  margin-bottom: 16px;
}

.fn-form-section:last-child {
  margin-bottom: 4px;
}

.fn-form-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--fn-text);
  margin-bottom: 8px;
}

.fn-form-title::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--fn-line);
}

.fn-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 9px;
}

.fn-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.fn-field label {
  font-size: 10.5px;
  color: var(--fn-text-soft);
  font-weight: 550;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.fn-field label span {
  font-weight: 400;
  color: var(--fn-muted);
  font-size: 9.5px;
}

.fn-input,
.fn-textarea {
  width: 100%;
  height: 32px;
  border: 1px solid var(--fn-line);
  border-radius: 7px;
  background: var(--fn-bg);
  padding: 0 9px;
  font-size: 11.5px;
  color: var(--fn-text);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.fn-textarea {
  height: auto;
  min-height: 72px;
  padding: 7px 9px;
  resize: vertical;
  line-height: 1.6;
}

.fn-input:focus,
.fn-textarea:focus {
  border-color: var(--fn-primary-ink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--fn-primary) 10%, transparent);
}

.fn-input::placeholder,
.fn-textarea::placeholder {
  color: var(--fn-muted);
}

.fn-input-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.fn-input-group .fn-input {
  flex: 1;
}

.fn-password-toggle {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 7px;
  border: 1px solid var(--fn-line);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--fn-muted);
}

.fn-password-toggle:hover {
  color: var(--fn-primary-ink);
}

.fn-hint {
  font-size: 9.5px;
  line-height: 1.65;
  color: var(--fn-muted);
  margin: 2px 0 0;
}

.fn-hint a {
  color: var(--fn-primary-ink);
  text-decoration: none;
}

.fn-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--fn-line);
}

.fn-settings-row:last-child {
  border-bottom: 0;
}

.fn-settings-row-text b {
  display: block;
  font-size: 11.5px;
  font-weight: 550;
  color: var(--fn-text);
}

.fn-settings-row-text span {
  display: block;
  margin-top: 1px;
  font-size: 9.5px;
  color: var(--fn-muted);
  line-height: 1.55;
}

.fn-segmented {
  display: flex;
  width: 100%;
  padding: 2px;
  border-radius: 7px;
  background: var(--fn-surface);
  border: 1px solid var(--fn-line);
  flex: 0 0 auto;
}

.fn-segmented button {
  flex: 1;
  height: 23px;
  padding: 0 4px;
  border-radius: 5px;
  font-size: 10px;
  color: var(--fn-muted);
  white-space: nowrap;
}

.fn-segmented button.is-active {
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
  font-weight: 650;
  box-shadow: none;
}

.fn-accent-picker {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.fn-accent-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--fn-line);
  background: var(--fn-bg);
  color: var(--fn-text-soft);
  font-size: 10.5px;
  white-space: nowrap;
}

.fn-accent-option i {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--swatch);
  box-shadow: inset 0 0 0 1px rgba(20, 20, 15, 0.18);
  flex: 0 0 auto;
}

.fn-accent-option:hover {
  border-color: var(--fn-line-strong);
  color: var(--fn-text);
}

.fn-accent-option.is-active {
  border-color: var(--fn-primary);
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
  font-weight: 650;
}

#fn-root[data-theme="dark"] .fn-accent-option {
  background: var(--fn-surface);
  border-color: var(--fn-line-strong);
  color: var(--fn-text);
}

#fn-root[data-theme="dark"] .fn-accent-option.is-active {
  border-color: var(--fn-primary);
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
}

.fn-test-status {
  font-size: 10px;
  color: var(--fn-muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.fn-test-status.is-ok { color: var(--fn-success); }
.fn-test-status.is-error { color: var(--fn-danger); }

/* 设置里的数据统计 */
.fn-storage-box {
  padding: 9px 10px;
  border-radius: 8px;
  background: var(--fn-surface);
  font-size: 10px;
  color: var(--fn-muted);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

/* 进度模态 */

.fn-ai-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px 4px;
  text-align: center;
}

.fn-ai-orb {
  width: 62px;
  height: 62px;
  border-radius: 20px;
  background: var(--fn-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fn-on-primary);
  box-shadow: none;
  animation: fnOrb 2.4s ease-in-out infinite;
  margin-bottom: 12px;
}

@keyframes fnOrb {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-5px) rotate(2deg); }
}

.fn-ai-progress h3 {
  margin: 0 0 4px;
  font-size: 14px;
  color: var(--fn-text);
}

.fn-ai-progress p {
  margin: 0;
  font-size: 11px;
  line-height: 1.7;
  color: var(--fn-muted);
  max-width: 380px;
}

.fn-progress-bar {
  width: 100%;
  height: 5px;
  border-radius: 4px;
  background: var(--fn-surface-2);
  overflow: hidden;
  margin: 14px 0 10px;
}

.fn-progress-bar i {
  display: block;
  height: 100%;
  width: 8%;
  border-radius: 4px;
  background: var(--fn-primary);
  transition: width 0.35s ease;
}

.fn-progress-steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
  text-align: left;
}

.fn-progress-step {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 10.5px;
  color: var(--fn-muted);
}

.fn-progress-step.is-active {
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
}

.fn-progress-step.is-done {
  color: var(--fn-success);
}

.fn-progress-step.is-error {
  color: var(--fn-danger);
  background: color-mix(in srgb, var(--fn-danger) 7%, transparent);
}

.fn-progress-step-icon {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fn-spinner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.7px solid color-mix(in srgb, var(--fn-primary) 22%, transparent);
  border-top-color: var(--fn-primary-ink);
  animation: fnSpin 0.8s linear infinite;
}

@keyframes fnSpin {
  to { transform: rotate(360deg); }
}

/* OCR */

.fn-ocr-layout {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fn-ocr-preview {
  width: 100%;
  height: 230px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--fn-line);
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fn-ocr-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.fn-ocr-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 10.5px;
  color: var(--fn-muted);
}

.fn-ocr-text {
  min-height: 160px;
}

.fn-speech-intro {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--fn-line);
  background: var(--fn-surface);
}

.fn-speech-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fn-primary);
  color: var(--fn-on-primary);
}

.fn-speech-icon.is-live {
  animation: fnPulse 1.8s infinite;
}

.fn-speech-intro h3 {
  margin: 0;
  font-size: 14px;
  color: var(--fn-text);
}

.fn-speech-intro p {
  margin: 0;
  font-size: 11px;
  line-height: 1.7;
  color: var(--fn-text-soft);
}

.fn-speech-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 12px;
  margin-top: 2px;
  font-size: 10px;
  color: var(--fn-muted);
}

.fn-speech-facts b {
  color: var(--fn-primary-ink);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.fn-speech-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fn-speech-result-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  font-size: 10.5px;
  color: var(--fn-muted);
}

.fn-speech-result-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.fn-speech-text {
  min-height: 260px;
  font-size: 12.5px;
  line-height: 1.8;
  font-variant-numeric: tabular-nums;
}

.fn-speech-text:focus {
  outline: 2px solid color-mix(in srgb, var(--fn-primary) 50%, transparent);
  outline-offset: 1px;
}

.fn-share-preview {
  max-height: 62vh;
  overflow: auto;
  border-radius: 12px;
  background: var(--fn-surface);
  border: 1px solid var(--fn-line);
  padding: 10px;
  display: flex;
  justify-content: center;
}

.fn-share-preview img {
  width: min(100%, 520px);
  height: auto;
  display: block;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(40, 30, 90, 0.12);
}

/* 笔记库 */

.fn-library-search {
  padding: 10px 14px;
  border-bottom: 1px solid var(--fn-line);
  display: flex;
  align-items: center;
  gap: 8px;
}

.fn-library-search .fn-transcript-search {
  flex: 1;
  margin: 0;
}

.fn-library-list {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fn-library-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  border: 1px solid transparent;
}

.fn-library-item:hover {
  background: var(--fn-bg-soft);
  border-color: var(--fn-line);
}

.fn-library-item.is-current {
  background: var(--fn-primary-soft);
  border-color: color-mix(in srgb, var(--fn-primary) 16%, transparent);
}

.fn-library-thumb {
  width: 42px;
  height: 32px;
  border-radius: 6px;
  background: var(--fn-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fn-primary-ink);
  flex: 0 0 auto;
  overflow: hidden;
}

.fn-library-body {
  flex: 1;
  min-width: 0;
}

.fn-library-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--fn-text);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fn-library-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9.5px;
  color: var(--fn-muted);
  margin-top: 3px;
  flex-wrap: wrap;
}

.fn-library-actions {
  display: flex;
  align-items: center;
  gap: 1px;
  opacity: 0;
  transition: opacity 0.15s;
}

.fn-library-item:hover .fn-library-actions {
  opacity: 1;
}

.fn-library-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--fn-muted);
  font-size: 11px;
}

/* 通用确认 */

.fn-confirm-text {
  font-size: 12px;
  line-height: 1.75;
  color: var(--fn-text-soft);
  margin: 0;
}

.fn-confirm-text b {
  color: var(--fn-text);
}

/* 帮助 */

.fn-help-hero {
  padding: 14px;
  border-radius: 11px;
  background: var(--fn-primary-soft);
  border: 1px solid var(--fn-line);
  margin-bottom: 13px;
}

.fn-help-hero h3 {
  margin: 0 0 4px;
  font-size: 14px;
  color: var(--fn-text);
}

.fn-help-hero p {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.7;
  color: var(--fn-muted);
}

.fn-help-steps {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.fn-help-step {
  display: flex;
  gap: 9px;
  align-items: flex-start;
}

.fn-help-step-num {
  width: 21px;
  height: 21px;
  border-radius: 6px;
  background: var(--fn-primary-soft);
  color: var(--fn-primary-ink);
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.fn-help-step b {
  display: block;
  font-size: 11.5px;
  color: var(--fn-text);
  margin-bottom: 1px;
}

.fn-help-step span {
  display: block;
  font-size: 10.5px;
  line-height: 1.65;
  color: var(--fn-muted);
}

.fn-kbd {
  display: inline-block;
  min-width: 17px;
  padding: 1px 4px;
  border-radius: 4px;
  border: 1px solid var(--fn-line-strong);
  background: var(--fn-surface);
  font-size: 9px;
  color: var(--fn-text-soft);
  font-family: var(--fn-mono);
  text-align: center;
  margin: 0 1px;
}

/* Toast */

.fn-toasts {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 47px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 60;
  pointer-events: none;
}

.fn-toast {
  pointer-events: auto;
  max-width: 100%;
  padding: 8px 11px;
  border-radius: 8px;
  background: rgba(31, 29, 45, 0.95);
  color: #fff;
  font-size: 11px;
  line-height: 1.55;
  box-shadow: 0 8px 22px rgba(20, 15, 50, 0.25);
  display: flex;
  align-items: flex-start;
  gap: 6px;
  animation: fnToastIn 0.2s ease;
}

.fn-toast.is-error {
  background: #b92e38;
}

.fn-toast.is-success {
  background: #167a51;
}

.fn-toast .fn-icon {
  margin-top: 1px;
  flex: 0 0 auto;
}

@keyframes fnToastIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 小屏 */

@media (max-width: 600px) {
  .fn-panel {
    top: 8px;
    right: 8px;
    bottom: 8px;
    width: calc(100vw - 16px);
    height: calc(100vh - 16px);
    max-width: none;
    border-radius: 15px;
  }
  .fn-resize { display: none; }
  .fn-fab { right: 14px; bottom: 14px; }
  .fn-keypoint-grid { grid-template-columns: 1fr; }
  .fn-field-row { grid-template-columns: 1fr; }
  .fn-modal { width: calc(100vw - 20px); max-height: 92vh; }
  .fn-modal-backdrop { padding: 10px; }
}

/* 强调色填充的按钮统一使用深色字，避免深色主题里白字压在亮色上 */
#fn-root .fn-btn.is-primary,
#fn-root .fn-btn.is-primary:hover,
#fn-root .fn-quick-btn.is-primary,
#fn-root .fn-quick-btn.is-primary:hover,
#fn-root .fn-tab.is-active,
#fn-root .fn-play-btn,
#fn-root .fn-send-btn,
#fn-root .fn-chat-msg.is-user .fn-chat-bubble,
#fn-root .fn-chat-msg.is-user .fn-chat-bubble a,
#fn-root .fn-option.is-selected .fn-option-letter,
#fn-root .fn-video-badge,
#fn-root .fn-inline-spinner,
#fn-root .fn-ai-orb,
#fn-root .fn-ai-banner-icon {
  color: var(--fn-on-primary) !important;
}

#fn-root .fn-btn.is-primary .fn-icon,
#fn-root .fn-quick-btn.is-primary .fn-icon,
#fn-root .fn-tab.is-active .fn-icon,
#fn-root .fn-play-btn .fn-icon,
#fn-root .fn-send-btn .fn-icon {
  color: var(--fn-on-primary) !important;
}

/* 简约化：快捷工具只留图标，AI 笔记保留文字；工具栏与模板去掉图标噪音。 */
.fn-video-sub {
  display: none;
}

.fn-quickbar {
  grid-template-columns: repeat(4, 1fr) 1.55fr;
  gap: 4px;
  padding: 8px 10px 7px;
}

.fn-quick-btn {
  border-color: transparent;
  background: transparent;
}

.fn-quick-btn:not(.is-primary) {
  font-size: 0;
  gap: 0;
}

.fn-quick-btn:not(.is-primary) .fn-icon {
  width: 17px;
  height: 17px;
}

.fn-quick-btn:not(.is-primary):hover {
  background: var(--fn-surface);
  border-color: var(--fn-line);
}

.fn-tab .fn-icon,
.fn-template-btn .fn-icon {
  display: none;
}

@media (max-width: 410px) {
  .fn-quickbar { grid-template-columns: repeat(4, 1fr) 1.55fr; }
}

@media (prefers-reduced-motion: reduce) {
  #fn-root *,
  #fn-root *::before,
  #fn-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
})();
