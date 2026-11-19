# Hero loop

Renders the 12 s loop that plays in the phone in the home page hero, plus a poster per language:

- `assets/hero-loop-pl.mp4`, `assets/hero-loop-pl.webm`, `assets/hero-poster-pl.jpg`
- the same three files with `-en`

The loop is an HTML page (`loop.html`). Every frame comes from `render(t)` for `t` from 0 to 12 s, with no CSS animations, so every render gives the same frames. Scenes, 3 s each:

1. Monday: a "new plan from your trainer" push arrives and the plan card fills in.
2. Wednesday: the technique video plays and the four sets turn green one by one.
3. Friday: the streak goes from 11 to 12 and a badge pops up.
4. Sunday: the weight chart draws downward to −3.6 kg.

Copy for both languages is in the `TXT` object at the top of the script in `loop.html`.

The folder starts with `_`, so GitHub Pages (Jekyll) does not publish it.

## Requirements

- Node.js
- Google Chrome. The default path is `C:\Program Files\Google\Chrome\Application\chrome.exe`; set `CHROME_PATH` to use another one.
- ffmpeg with libx264 and libvpx-vp9 (`winget install Gyan.FFmpeg`). `paths.js` finds the winget install by itself; set `FFMPEG_PATH` to use another one.

## Usage

```
cd _tools/hero-loop
npm install
npm run preview    # preview-pl.png / preview-en.png: key moments side by side
npm run build      # record frames, then encode into ../../assets
```

To check the result, serve the repo root (`python -m http.server 8766`) and run `npm run check`. It confirms the video plays in PL and EN, swaps when the language changes, stays on the poster under reduced motion, and that the console shows no errors.

Files must stay under 1.5 MB each (the current ones are about 240 KB for MP4, 370 KB for WebM and 100 KB for the poster). `encode.js` flags any file over the limit.
