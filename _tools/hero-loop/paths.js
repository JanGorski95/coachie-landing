// Where Chrome and ffmpeg live. Override with CHROME_PATH / FFMPEG_PATH.
const fs = require('fs');
const path = require('path');

function findWingetFfmpeg() {
  const base = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
  if (!fs.existsSync(base)) return null;
  for (const pkg of fs.readdirSync(base).filter(d => d.startsWith('Gyan.FFmpeg'))) {
    for (const build of fs.readdirSync(path.join(base, pkg))) {
      const exe = path.join(base, pkg, build, 'bin', 'ffmpeg.exe');
      if (fs.existsSync(exe)) return exe;
    }
  }
  return null;
}

module.exports = {
  CHROME: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  FFMPEG: process.env.FFMPEG_PATH || findWingetFfmpeg() || 'ffmpeg',
};
