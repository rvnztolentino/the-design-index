# The Design Index

A static, publicly browsable index of website and app templates. Every entry is
a single self-contained `.html` file — open it, download it, hand it to an AI
coding agent as a starting point. Everything is public domain.

## Tech stack

- **Astro 7**, static output, zero JavaScript shipped except one modal script
- **Tailwind v4** via `@tailwindcss/vite`, theme defined in `src/styles/global.css`
- **TypeScript**, with the template index validated by Zod through an Astro
  content collection over `src/data/templates.json`
- **Raleway** from Google Fonts, weights 300/400/500
- Thumbnails from a local screenshot script, committed as images
- Deployed static to Vercel

No framework runtime, no database, no API routes, no serverless functions.

## Setup

Requires Node 22.12 or newer.

```bash
git clone https://github.com/rvnztolentino/the-design-index.git
cd the-design-index
npm install
```

## Running it

```bash
npm run dev       # dev server on http://localhost:4321
npm run build     # static output into dist/
npm run preview   # serve the built dist/
npm run thumbs    # regenerate thumbnails and the Open Graph card
```

There is no test suite and no linter. `npm run build` is the gate — the content
schema runs there and nowhere else, so it is what actually accepts or rejects a
template entry.

## Configuration

The site itself needs no environment variables, keys or external services.
Nothing is stored and nothing is fetched at request time.

Two optional variables affect the thumbnail script only:

- `CHROME_PATH` — point at a Chromium binary if the script cannot find a browser
- Installing Playwright (`npm i -D playwright && npx playwright install chromium`)
  makes the script prefer it. It is not a declared dependency; without it the
  script falls back to a locally installed Chrome, so a fresh clone can still
  regenerate images.

Installing `cwebp` is also optional. With it, screenshots are encoded as lossless
WebP; without it the PNG is kept and the content schema resolves whichever format
is on disk.

The deployed domain is hardcoded in several files rather than read from an
environment variable — see [Deploying](#deploying).

## Adding a template

Four steps, in this order. Never touch layout code.

1. Write the template to `public/templates/<id>.html`.
2. Add one object to `src/data/templates.json`.
3. Shoot the thumbnail: `npm run thumbs -- --only=<id>`
4. Verify with `npm run build`.

The entry has to exist before step 3, because `scripts/thumbnails.mjs` reads
`templates.json` to decide what to shoot. Run it earlier and it shoots nothing.

An entry looks like this:

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

- `id` — lowercase letters, digits and hyphens. Doubles as the default file and
  thumbnail name. Duplicates fail the build.
- `categories` — one or more ids from `src/lib/categories.ts`. A typo fails the
  build rather than rendering an empty section.
- `date` — `YYYY-MM-DD`, displayed as `2026.08.28`.
- `recommended` and `rank` — both or neither; the schema rejects one without the
  other. Lower `rank` sorts first in the Recommended section.
- `file` and `thumbnail` — optional, derived from `id`. Set them only to break
  the convention. Both are constrained to a root-relative path so a stray value
  cannot become an absolute or `javascript:` URL.

A template listed in two categories appears in both. Categories with no entries
are dropped at build time. To add a category, add one entry to the `CATEGORIES`
array in `src/lib/categories.ts` — array order is display order.

Commit the generated thumbnail alongside the entry. Images are produced on
demand; nothing renders at request time.

## What a template must be

- One self-contained `.html` file, CSS in `<style>` and JS in `<script>`.
- No network requests. No webfonts, no CDNs, no hotlinked images. Use local font
  stacks, inline SVG, CSS shapes or solid blocks. This is enforced in production
  by the Content-Security-Policy described under [Security](#security), so a
  template that phones home breaks visibly rather than silently.
- A full page, not a component.
- Genuinely interactive: buttons click, dropdowns open, tabs switch, modals
  appear, inputs accept text. Nothing persists or submits anywhere.
- Responsive.
- Readable source. No minified or obfuscated script — people are meant to read
  and edit the file.

Templates are deliberately not bound to the site palette. The site chrome is
black and white; templates carry their own personality. Keep them minimal and
flat: no 3D, no video backgrounds, no heavy motion.

## Working on the site itself

`src/styles/global.css` clears Tailwind's default colour, radius, font, type and
tracking scales to `initial` and defines only three colours: ink, bone and one
grey.

This means **a utility outside the theme compiles to no CSS and raises no
error**. `bg-blue-500`, `text-sm` and `rounded-lg` all vanish quietly. Spacing
and layout utilities are untouched. Confirm a token exists in `global.css`
before reaching for it.

Hairlines are the palette at low alpha (`border-grey/30`) rather than a fourth
colour. `rounded-full` is the only radius left, kept for the rank seals. Type
sizes are the custom scale: `text-micro` through `text-title`.

The site is `output: 'static'`. Do not add an adapter, API routes or middleware.
The only JavaScript shipped is `src/scripts/modal.ts`; native `<dialog>` already
provides Escape, the focus trap, focus restore and page inertness, so none of
that is reimplemented.

## Regenerating thumbnails

```bash
npm run thumbs              # every template, plus public/og.png
npm run thumbs -- --only=<id>
```

Shots are 1440×900 at 1:1 — the 16:10 ratio the grid and modal both hold. A full
run also rebuilds `public/og.png`, and does so even when the index is empty,
because the card is built from its own markup rather than from the templates.

## Deploying

Static output on Vercel's free tier, Git-connected. `vercel.json` sets the
framework, build command, output directory and response headers, so no dashboard
configuration is needed.

1. Push to a **public** GitHub repo. It must be public, or every "View source"
   link 404s.
2. Import it on Vercel.
3. Claim a `.vercel.app` subdomain. Vercel prefixes it with your username, so the
   result looks like `<user>-<repo>.vercel.app`.
4. Update the domain everywhere it is hardcoded: `SITE.url` in `src/lib/site.ts`,
   `site` in `astro.config.mjs`, the `Sitemap:` line in `public/robots.txt`, the
   `<loc>` in `public/sitemap.xml`, the footer of `OG_HTML` in
   `scripts/thumbnails.mjs`, and the "Live:" line at the top of this file.
5. Run `npm run thumbs` and commit `public/og.png`. The domain is rendered into
   that image, so changing the source alone leaves shared links showing the old
   one.

`SITE.repo` is separate and points at the GitHub repo, not the deploy. Every
"View source" link is built from it, so a wrong value breaks all of them.

## Security

Nothing is stored and there is no server: no auth, sessions, database, cookies,
localStorage or analytics. Every route is a pre-generated file.

The one real surface is that templates are arbitrary HTML served from the site's
own origin, and anyone can submit one by pull request. `vercel.json` constrains
what a template can do: `/templates/*` is served under `default-src 'none'` with
inline `<style>` and `<script>` allowed and images limited to `data:` URIs. A
template cannot fetch, open a WebSocket, pull a remote script or webfont, or
submit a form. `form-action 'none'` and `base-uri 'none'` stop a template being
used to phish on the real domain.

Reviewing template pull requests is still the primary control; the policy is
defence in depth, and it catches honest mistakes as reliably as malicious ones.

The site CSP is scoped to `/` rather than `/(.*)`, so `/templates/*` receives
exactly one policy instead of two overlapping ones. A new route needs its own
entry in `vercel.json` or it ships with no CSP.

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## Contributing

Templates are the most useful contribution. See [CONTRIBUTING.md](CONTRIBUTING.md)
for what gets one merged.

## Licence

[CC0 1.0 Universal](LICENSE) — the site, the tooling and every template are
dedicated to the public domain. Free to use, modify and sell, no attribution
needed. Contributions are accepted on the same terms.
