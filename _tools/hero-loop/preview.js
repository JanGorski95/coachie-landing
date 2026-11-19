// Render a few key moments side by side into preview-<lang>.png for a quick check.
// Usage: node preview.js [pl|en]
const puppeteer = require('puppeteer-core');
const path = require('path');
const { CHROME } = require('./paths');
const lang = process.argv[2] || 'pl';
const times = [0.5, 2.5, 4.6, 5.6, 8.6, 11.5, 11.95];
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 1 });
  await page.goto('file:///' + path.join(__dirname, 'loop.html').replace(/\\/g, '/') + '?lang=' + lang, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const shots = [];
  for (const t of times) {
    await page.evaluate(x => window.render(x), t);
    shots.push((await page.screenshot({ encoding: 'base64' })));
  }
  const strip = await browser.newPage();
  await strip.setViewport({ width: 360 * times.length + 10 * (times.length - 1), height: 780 });
  await strip.setContent('<body style="margin:0;display:flex;gap:10px;background:#555">' + shots.map(s => `<img src="data:image/png;base64,${s}">`).join('') + '</body>');
  await strip.screenshot({ path: path.join(__dirname, 'preview-' + lang + '.png') });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
