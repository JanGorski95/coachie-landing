// Check the hero loop on a locally served landing: it plays, swaps with the
// language switch, and stays on the poster under prefers-reduced-motion.
// Start a server in the repo root first, e.g.:  python -m http.server 8766
// Usage: node check.js [http://127.0.0.1:8766/]
const puppeteer = require('puppeteer-core');
const path = require('path');
const { CHROME } = require('./paths');
const URL = process.argv[2] || 'http://127.0.0.1:8766/';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  const state = () => page.evaluate(() => { const v = document.querySelector('.hero-video'); return { src: v.currentSrc, t: +v.currentTime.toFixed(2), paused: v.paused, poster: v.poster }; });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.querySelector('[data-lang="pl"]').click());
  await new Promise(r => setTimeout(r, 2500));
  const pl = await state();
  await page.screenshot({ path: path.join(__dirname, 'check-hero-pl.png') });
  await page.evaluate(() => document.querySelector('[data-lang="en"]').click());
  await new Promise(r => setTimeout(r, 3500));
  const en = await state();
  await page.screenshot({ path: path.join(__dirname, 'check-hero-en.png') });

  const rm = await browser.newPage();
  await rm.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await rm.setViewport({ width: 390, height: 844 });
  await rm.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const reduced = await rm.evaluate(() => { const v = document.querySelector('.hero-video'); return { paused: v.paused, t: v.currentTime, poster: v.poster, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }; });
  await rm.screenshot({ path: path.join(__dirname, 'check-hero-390.png') });
  console.log(JSON.stringify({ pl, en, reduced, errors }, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
