// Render loop.html frame by frame (30 fps, 12 s, 720x1560) into frames/<lang>/.
// Usage: node record.js [pl] [en]   (both languages when none given)
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { CHROME } = require('./paths');

const FPS = 30, SECONDS = 12;
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['pl', 'en'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2 });
  for (const lang of langs) {
    const dir = path.join(__dirname, 'frames', lang);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const url = 'file:///' + path.join(__dirname, 'loop.html').replace(/\\/g, '/') + '?lang=' + lang;
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    for (let i = 0; i < FPS * SECONDS; i++) {
      await page.evaluate(t => window.render(t), i / FPS);
      await page.screenshot({ path: path.join(dir, String(i).padStart(4, '0') + '.png') });
    }
    console.log(lang, 'frames done');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
