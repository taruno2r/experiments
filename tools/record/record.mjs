// Records an experiment's interaction to a 1920×1080, 60fps H.264 MP4
// (suitable for X) and saves it as <experiment>/preview.mp4.
//
// Usage (with the site served on :5173):
//   npm run record -- task-list
//
// Each experiment needs a script at demos/<experiment>.js that defines
// window.runDemo() — see demos/task-list.js.
//
// The page runs on a manual clock (clock.js), so every frame is captured at
// exactly 1/60s steps regardless of how fast the screenshots are taken.
import { chromium } from "playwright-core";
import ffmpeg from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

const name = process.argv[2];
const base = process.argv[3] ?? "http://localhost:5173";
const demo = path.join(here, "demos", `${name}.js`);
if (!name || !existsSync(demo)) {
  console.error(`Usage: npm run record -- <experiment> [baseUrl]\nNo demo script at ${demo}`);
  process.exit(1);
}

const url = `${base}/${name}/`;
const framesDir = path.join(here, "frames");
const out = path.join(root, name, "preview.mp4");

// 640×360 CSS px at 3× = 1920×1080, so small components fill the frame nicely.
const VIEWPORT = { width: 640, height: 360 };
const SCALE = 3;
const FPS = 60;
const MAX_FRAMES = FPS * 60;

rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir);

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE });
const page = await context.newPage();
await page.addInitScript({ path: path.join(here, "clock.js") });
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
// Site chrome (like the "← Experiments" link) stays out of the video.
await page.addStyleTag({ content: ".back { display: none !important; }" });
await page.addScriptTag({ path: demo });

await page.evaluate(() => {
  window.__done = false;
  window.runDemo().then(() => (window.__done = true));
});

let frame = 0;
while (frame < MAX_FRAMES) {
  const done = await page.evaluate(async (dt) => {
    await window.__clock.tick(dt);
    return window.__done;
  }, 1000 / FPS);
  await page.screenshot({
    path: path.join(framesDir, `f${String(frame).padStart(5, "0")}.png`),
  });
  frame++;
  if (done) break;
}
await browser.close();

execFileSync(ffmpeg, [
  "-y", "-hide_banner", "-loglevel", "error",
  "-framerate", String(FPS), "-i", path.join(framesDir, "f%05d.png"),
  "-vf", "scale=1920:1080:flags=lanczos,format=yuv420p",
  "-c:v", "libx264", "-preset", "slow", "-crf", "16",
  "-profile:v", "high", "-r", String(FPS), "-movflags", "+faststart",
  out,
]);

rmSync(framesDir, { recursive: true, force: true });
console.log(`${frame} frames (${(frame / FPS).toFixed(1)}s @ ${FPS}fps) → ${path.relative(root, out)}`);
