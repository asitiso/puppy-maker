import { chromium } from 'playwright';
const out = 'C:/Users/우/AppData/Local/Temp/claude/c--Users---Documents-Codex-puppy/598def47-8c0a-42f3-8ad3-b7791bcc8d30/scratchpad';
const base = 'http://localhost:5191';
const files = ['/ui/back_button_circle_frame.png', '/ui/map_pin_frame.png', '/ui/map_pin_frame_active.png'];
const items = files.map(f => `
  <div style="display:inline-block;margin:4px;border:1px solid #000">
    <div style="font:10px monospace;background:#fff">${f}</div>
    <div style="background:#ff2d2d;width:140px;height:120px;display:flex;align-items:center;justify-content:center"><img src="${base}${f}" style="max-width:130px;max-height:110px"></div>
    <div style="background:#28d02a;width:140px;height:120px;display:flex;align-items:center;justify-content:center"><img src="${base}${f}" style="max-width:130px;max-height:110px"></div>
  </div>`).join('');
const html = `<!doctype html><html><body style="margin:0;background:#333">${items}</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 400 } });
await page.setContent(html);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/new_assets_alpha_check.png` });
await browser.close();
console.log('done');
