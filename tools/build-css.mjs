import fs from 'node:fs/promises';

const css = await fs.readFile('framenote/content/panel.css', 'utf8');
if (css.includes('`') || css.includes('${')) {
  throw new Error('panel.css contains template literal delimiters; escape before bundling');
}
const banner = '/* 由 tools/build-css.mjs 从 panel.css 生成，请勿直接编辑 */\n';
const output = `${banner}(() => {\n  const FN = (globalThis.FN = globalThis.FN || {});\n  FN.PANEL_CSS = String.raw\`${css}\`;\n})();\n`;
await fs.writeFile('framenote/content/styles.js', output, 'utf8');
console.log(`wrote styles.js (${css.length} bytes css, ${output.length} bytes js)`);
