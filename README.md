# Experiments

Small UI interaction experiments, each in its own folder, with a gallery page at the root. Plain HTML, CSS and JS — no build step, so any static host can serve it as-is.

```
index.html            gallery
task-list/            one experiment (index.html, styles, script, assets, preview.mp4)
tools/                local server and video recorder (not part of the site)
```

## Run locally

```bash
python3 tools/serve.py
```

Then open http://localhost:5180. This server turns off browser caching, so edits always show up on a normal reload (a plain `python3 -m http.server` lets Chrome keep stale copies, especially inside the gallery previews).

## Add an experiment

1. Create a folder, e.g. `my-thing/`, with its own `index.html`.
2. Add a card for it in the root `index.html` (a title only). The card shows the page itself as a static preview (an `<iframe>` pointing at the folder).
3. To hide anything from that preview (like the back link), style it under `.embedded`, which the page adds when it's inside the gallery.

## Record a video

For sharing on X and elsewhere. Writes a 1920×1080, 60fps MP4 to `<experiment>/preview.mp4`. Needs Google Chrome and the local server running.

1. Write `tools/record/demos/<experiment>.js` defining `window.runDemo()` — it drives a fake cursor through the interaction. Copy `demos/task-list.js` as a starting point.
2. Run:

```bash
cd tools/record && npm install && npm run record -- my-thing
```

## Deploy

Connect this repo to Vercel, Netlify or Cloudflare Pages as a static site: no build command, output directory is the repo root. Every push goes live.
