# The Design Index

A static, publicly browsable index of website and app templates. Every entry is
a single self-contained `.html` file: open it, download it, hand it to Claude
Code or Cursor as a starting point.

Live: `https://the-design-index.vercel.app` (see [Deploying](#deploying))

---

## Running it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output into dist/
npm run preview    # serve dist/
npm run thumbs     # regenerate every thumbnail + the OG card
```

Node 22.12 or newer.

---

## Adding a template

Three steps. **Never touch layout code.**

1. **Drop the file** into `public/templates/<id>.html`.
2. **Shoot the thumbnail**: `npm run thumbs -- --only=<id>`
3. **Add one object** to `src/data/templates.json`:

```json
{
  "id": "aster",
  "name": "Aster",
  "description": "Editorial storefront with quick view, size and colour selection, and a slide-out cart.",
  "categories": ["clothing"],
  "date": "2026-08-28",
  "createdBy": "Renz Tolentino",
  "recommended": true,
  "rank": 1
}
```

| Field | Notes |
| --- | --- |
| `id` | Lowercase, digits and hyphens. Also the default file and thumbnail name. |
| `categories` | One or more ids from `src/lib/categories.ts`. A typo fails the build. |
| `date` | `YYYY-MM-DD`. Rendered as `2026.08.28`. |
| `recommended` / `rank` | Both or neither — the schema rejects one without the other. `rank` orders the Recommended section, lowest first. |
| `file`, `thumbnail` | Optional. Default to `/templates/<id>.html` and `/thumbnails/<id>.png`. |

A template listed in two categories appears in both sections. Categories with
no entries are dropped at build time rather than rendered empty.

To add a **category**, add one entry to the array in `src/lib/categories.ts`.
Array order is display order.

---

## Regenerating thumbnails

```bash
npm run thumbs              # every template, plus public/og.png
npm run thumbs -- --only=kiri
```

Shots are 1440×900 (16:10 — the ratio the grid and modal both hold).
Run it on demand and commit the images; nothing renders at request time.

Shots are captured 1:1 and encoded as lossless WebP when `cwebp` is available
(PNG otherwise — the content schema resolves whichever format is committed).

The script uses **Playwright** when it is installed, and otherwise falls back to
a locally installed Chrome, so a fresh clone can regenerate images without
downloading a browser. Both paths produce the same shot.

```bash
npm i -D playwright && npx playwright install chromium   # optional
CHROME_PATH=/path/to/chromium npm run thumbs             # or point at a binary
```

---

## What a template must be

- **One self-contained `.html` file.** CSS in `<style>`, JS in `<script>`.
- **No network requests.** No webfonts, no CDNs, no hotlinked images. Use local
  font stacks, inline SVG, CSS shapes, or solid blocks.
- **A full page**, not a component.
- **Interactive**: buttons click, dropdowns open, tabs switch, modals appear,
  inputs accept text. Nothing persists or submits anywhere.
- **Responsive.**

Templates are *not* bound to the site palette — the chrome is black and white,
the templates have their own personality. Keep them minimal and flat: no 3D, no
video backgrounds, no heavy motion.

The index currently lists **no templates** — `src/data/templates.json` is an
empty array, and the page renders a single quiet line in place of the sections.
Add the first entry as described above and the Recommended and category sections
appear on their own.

Two finished templates are still on disk at `public/templates/` (`aster.html`
and `kiri.html`, with thumbnails alongside) but are unlisted. Add an entry for
either to bring it back, or delete the files if they are not wanted.

---

## How it is built

| Piece | Choice |
| --- | --- |
| Framework | Astro, static output, zero JS shipped except the modal |
| Styling | Tailwind v4, theme in `src/styles/global.css` |
| Data | Astro content collection over `src/data/templates.json`, Zod-validated |
| Modal | Native `<dialog>` + ~40 lines of vanilla JS |
| Font | Raleway from Google Fonts, weights 300/400/500 |
| Thumbnails | Local screenshot script, committed as PNGs |

**The Tailwind theme enforces the design rules rather than documenting them.**
`src/styles/global.css` clears Tailwind's defaults (`--color-*: initial`,
`--radius-*: initial`) and defines only ink, bone and one grey. There is no
rounded-corner scale left to reach for, and a stray `bg-blue-500` compiles to
nothing. `rounded-full` survives as a static utility for the one deliberate
curve: the rank seals.

Hairlines are the palette at low alpha (`border-grey/30`) rather than extra
colours, which keeps the palette literally three values.

---

## Deploying

Static output on Vercel's free tier, Git-connected.

1. Create a **public** GitHub repo and push.
2. Import it on Vercel. `vercel.json` sets framework, build command and output
   directory, so no dashboard configuration is needed.
3. Claim a `.vercel.app` subdomain, then update **`src/lib/site.ts`**:
   - `url` — used for canonical, Open Graph and JSON-LD
   - `repo` — where every "View source" link points

   and the domain in `public/robots.txt` and `public/sitemap.xml`.

Everything is pre-generated. No server-side rendering, no API routes, no
serverless functions, no edge middleware, nothing stored — no auth, sessions,
database, cookies, localStorage or analytics.

---

## Judgment calls

Where the brief was silent or said two things, this is what was chosen and why.

- **Raleway is loaded from the Google Fonts CDN**, with preconnect to both font
  hosts and only weights 300/400/500 requested. The build order mentioned
  Fontsource, but the tech-stack and settled-decisions sections both specify
  Google Fonts and describe the preconnect; those won.
- **Thumbnail ratio is 16:10**, matching a browser viewport, so screenshots look
  natural rather than cropped.
- **The whole card is an `<a>` pointing at the template file**, which JS
  intercepts to open the modal. Without JS — or on a cmd/middle click — it still
  goes somewhere useful: the live preview. Search engines see real links.
- **One `<dialog>` is pre-rendered per template** rather than one populated by
  JS, so all modal content is in the static HTML for crawlers and the script
  stays tiny. Escape, the focus trap, focus restore and page inertness come free
  from `showModal()`; only opening, the close button and the click-outside are
  coded. Scroll lock is `html:has(dialog[open])` — pure CSS.
- **"View source" points at the GitHub blob URL** for the file. Browsers block
  `view-source:` links, and the raw file is already what Preview and Download
  serve, so GitHub is the only target that shows *source* rather than a rendered
  page. This is why `SITE.repo` must be correct.
- **`file` and `thumbnail` are optional** and derived from `id`, so a normal
  addition is one small object. Set them only to break the convention.
- **No sitemap integration.** `public/sitemap.xml` and `public/robots.txt` are
  static one-liners; a single-page site does not need a generator, and the brief
  asked for no integrations beyond search visibility.
- **`public/og.png` is generated by the same script** as the thumbnails, so
  shared links have a card without adding an image service.
- **Aster is filed under "Online clothing stores" only**, not also "Online
  shops". The specific category is the flagship; listing it twice just duplicated
  the entry.
- **Playwright is not a declared dependency.** The brief specifies it and the
  script prefers it, but the Chrome fallback means a clone can regenerate
  thumbnails with nothing installed. Add it whenever you want the Playwright path.

## Licence

Free to use, no attribution needed.
