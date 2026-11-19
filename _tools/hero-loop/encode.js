// Encode frames/<lang>/ into the site's hero assets:
//   assets/hero-loop-<lang>.mp4 (H.264), .webm (VP9), hero-poster-<lang>.jpg (frame at 2.5 s)
// Usage: node encode.js [pl] [en]
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { FFMPEG } = require('./paths');

const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['pl', 'en'];
const assets = path.join(__dirname, '..', '..', 'assets');
const POSTER_FRAME = '0075'; // 2.5 s: Monday with the new plan showing
const LIMIT = 1.5 * 1024 * 1024;

const run = args => execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });

for (const lang of langs) {
  const frames = path.join(__dirname, 'frames', lang, '%04d.png');
  const out = name => path.join(assets, name);
  run(['-framerate', '30', '-i', frames, '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-tune', 'animation', '-movflags', '+faststart', '-an', out(`hero-loop-${lang}.mp4`)]);
  run(['-framerate', '30', '-i', frames, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-an', out(`hero-loop-${lang}.webm`)]);
  run(['-i', path.join(__dirname, 'frames', lang, POSTER_FRAME + '.png'), '-q:v', '4', out(`hero-poster-${lang}.jpg`)]);
  for (const f of [`hero-loop-${lang}.mp4`, `hero-loop-${lang}.webm`, `hero-poster-${lang}.jpg`]) {
    const size = fs.statSync(out(f)).size;
    console.log(`${f} ${(size / 1024).toFixed(0)} KB${size > LIMIT ? '  OVER 1.5 MB' : ''}`);
  }
}
