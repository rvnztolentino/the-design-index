#!/usr/bin/env node
/**
 * Regenerates every thumbnail in public/thumbnails/ from the template files
 * in public/templates/, plus the Open Graph card.
 *
 *   npm run thumbs              all templates
 *   npm run thumbs -- --only=aster
 *
 * Run on demand and commit the PNGs; nothing here ever runs at request time.
 *
 * Uses Playwright when it is installed. If it is not, it falls back to a
 * locally installed Chrome, so a fresh clone can regenerate images without
 * downloading a browser. Both produce the same 1440x900 shot at 2x.
 */

import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Screenshots are flat UI with text, so lossless WebP is the right encoding —
 * lossy smears type and flat-colour edges. cwebp is optional: without it the
 * PNG is kept, and the content schema resolves whichever file is on disk.
 */
async function toLosslessWebp(png) {
  const webp = png.replace(/\.png$/, ".webp");
  try {
    await run("cwebp", ["-quiet", "-lossless", png, "-o", webp]);
  } catch {
    return null;
  }
  const [a, b] = [statSync(png).size, statSync(webp).size];
  if (b >= a) {
    await rm(webp, { force: true });
    return null;
  }
  await rm(png, { force: true });
  return { webp, saved: a - b, before: a, after: b };
}

/** 16:10 — the aspect ratio the grid and the modal both hold. */
const WIDTH = 1440;
const HEIGHT = 900;

/**
 * Capture 1:1. The largest a thumbnail is ever drawn is the modal's left
 * column at ~484 CSS px, so 1440 already covers a 2x display with room to
 * spare. Shooting at 2x tripled the file for pixels nothing can display, and
 * downscaling a 2x shot afterwards compresses worse than a native 1:1 render.
 */
const SCALE = 1;

const CHROMES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

/* -- backends ------------------------------------------------------------ */

async function playwrightBackend() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return null;
  }
  const browser = await chromium.launch();
  return {
    name: "playwright",
    async shoot(url, out, width = WIDTH, height = HEIGHT) {
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: SCALE,
      });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      await page.screenshot({ path: out });
      await page.close();
    },
    close: () => browser.close(),
  };
}

function chromeBackend() {
  const bin = CHROMES.find((p) => existsSync(p));
  if (!bin) return null;
  return {
    name: "chrome",
    async shoot(url, out, width = WIDTH, height = HEIGHT) {
      await run(bin, [
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        `--force-device-scale-factor=${SCALE}`,
        `--window-size=${width},${height}`,
        // Fast-forwards timers so fonts and transitions settle before the shot.
        "--virtual-time-budget=3000",
        `--screenshot=${out}`,
        url,
      ]);
    },
    close: async () => {},
  };
}

/* -- the Open Graph card ------------------------------------------------- */

const OG_HTML = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;500&display=swap">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:#0f0e0c;color:#ece7de;
       font-family:Raleway,sans-serif;padding:76px 84px;display:flex;
       flex-direction:column;justify-content:space-between}
  .mark{font-size:15px;font-weight:500;letter-spacing:.3em;text-transform:uppercase}
  h1{font-size:60px;font-weight:300;line-height:1.15;letter-spacing:-.01em;max-width:20ch}
  .rule{height:1px;background:#857f74;opacity:.35}
  .foot{display:flex;justify-content:space-between;font-size:15px;color:#857f74;font-weight:300}
</style>
<p class="mark">The Design Index</p>
<h1>Website and app templates, one self-contained file each.</h1>
<div>
  <div class="rule"></div>
  <div class="foot" style="margin-top:22px">
    <span>Free to use, no attribution needed.</span>
    <span>the-design-index.vercel.app</span>
  </div>
</div>`;

/* -- main ---------------------------------------------------------------- */

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

const only = process.argv
  .find((a) => a.startsWith("--only="))
  ?.split("=")[1];

const all = JSON.parse(
  await readFile(join(ROOT, "src/data/templates.json"), "utf8"),
);
const templates = all.filter((t) => !only || t.id === only);

// An empty index is a legitimate state, so say so and stop without an error.
if (!all.length) {
  console.log("No templates listed yet — nothing to shoot.");
  process.exit(0);
}
if (!templates.length) {
  console.error(`No template with id "${only}".`);
  process.exit(1);
}

const backend = (await playwrightBackend()) ?? chromeBackend();
if (!backend) {
  console.error(
    "No browser available. Either `npm i -D playwright && npx playwright install chromium`,\n" +
      "or install Chrome, or point CHROME_PATH at a Chromium binary.",
  );
  process.exit(1);
}

await mkdir(join(ROOT, "public/thumbnails"), { recursive: true });
console.log(`Shooting ${templates.length} template(s) via ${backend.name}\n`);

for (const t of templates) {
  const src = join(ROOT, "public", t.file ?? `/templates/${t.id}.html`);
  if (!existsSync(src)) {
    console.error(`  ✗ ${t.id} — no such file: ${src}`);
    process.exitCode = 1;
    continue;
  }
  const out = join(ROOT, "public", `/thumbnails/${t.id}.png`);
  await backend.shoot(pathToFileURL(src).href, out);

  const webp = await toLosslessWebp(out);
  const final = webp ? webp.webp : out;
  // Never leave both formats behind — the schema would pick the stale one.
  await rm(webp ? out : out.replace(/\.png$/, ".webp"), { force: true });

  const note = webp
    ? ` (${kb(webp.before)} png → ${kb(webp.after)} webp)`
    : ` (${kb(statSync(out).size)} png — install cwebp for lossless webp)`;
  console.log(`  ✓ ${t.id} → ${final.replace(ROOT + "/", "")}${note}`);
}

// The OG card only needs rebuilding on a full run.
if (!only) {
  const tmp = join(tmpdir(), `design-index-og-${Date.now()}.html`);
  await writeFile(tmp, OG_HTML);
  await backend.shoot(pathToFileURL(tmp).href, join(ROOT, "public/og.png"), 1200, 630);
  await rm(tmp, { force: true });
  console.log("  ✓ og  → public/og.png");
}

await backend.close();
console.log("\nDone. Commit the generated images.");
