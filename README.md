# Experiments

Small UI interaction experiments, each in its own folder, with a gallery page at the root. Plain HTML, CSS and JS — no build step, so any static host can serve it as-is.

```
index.html            gallery
task-list/            one experiment (index.html, styles, script, assets, preview.mp4)
tools/record/         records preview videos (not part of the site)
```

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Add an experiment

1. Create a folder, e.g. `my-thing/`, with its own `index.html`.
2. Add a card for it in the root `index.html`.
3. Optionally record a preview (below) and point the card's `<video>` at `my-thing/preview.mp4`.

## Record a preview video

Writes a 1920×1080, 60fps MP4 (good for X) to `<experiment>/preview.mp4`. Needs Google Chrome and the local server running.

1. Write `tools/record/demos/<experiment>.js` defining `window.runDemo()` — it drives a fake cursor through the interaction. Copy `demos/task-list.js` as a starting point.
2. Run:

```bash
cd tools/record && npm install && npm run record -- my-thing
```

## Deploy

Connect this repo to Vercel, Netlify or Cloudflare Pages as a static site: no build command, output directory is the repo root. Every push goes live.
