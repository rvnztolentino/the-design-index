---
name: add-template
description: Add, author, or remove a template in The Design Index, or add a category. Use whenever editing src/data/templates.json, writing a file in public/templates/, regenerating thumbnails, or touching src/lib/categories.ts. Covers the required order of operations and every way the content schema rejects an entry.
---

# Adding a template

One template is three artefacts that must agree:

| Artefact | Path |
| --- | --- |
| The template | `public/templates/<id>.html` |
| The thumbnail | `public/thumbnails/<id>.webp` (or `.png`) |
| The index entry | one object in `src/data/templates.json` |

## Order of operations

Follow this order. The README lists the thumbnail before the JSON entry; that
does not work, because `scripts/thumbnails.mjs` reads `templates.json` to decide
what to shoot:

1. Write `public/templates/<id>.html`
2. Add the object to `src/data/templates.json`
3. `npm run thumbs -- --only=<id>`
4. `npm run build` — the schema only runs here, so this is the real check

Shooting before step 2 fails: `--only=<id>` on a missing id exits 1 with
`No template with id "<id>"`, and on an empty index the script prints
`No templates listed yet — nothing to shoot.` and exits **0** without shooting.
A green exit code is not evidence a thumbnail was produced — check the file.

## The entry

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

`templates.json` is a plain array. Keep it hand-editable — no trailing commas,
two-space indent.

## How the schema rejects things

All of this lives in `src/content.config.ts` and fails the **build**, not the edit:

- **`id`** must match `^[a-z0-9-]+$`. Duplicate ids throw from the loader parser
  with `Duplicate template id "<id>" in templates.json`.
- **`categories`** is a non-empty array of ids from `src/lib/categories.ts`. A
  typo is a build error, not a silently empty section.
- **`date`** is `YYYY-MM-DD`, coerced to a Date and rendered `2026.08.28`.
- **`recommended` and `rank` are all-or-nothing.** A `.refine()` rejects one
  without the other: `A recommended template needs a rank, and vice versa.`
  Lower `rank` sorts first in the Recommended section.
- **`file` and `thumbnail`** default to `/templates/<id>.html` and the resolved
  thumbnail. Set them only to break the convention. Both are constrained to
  `^\/(?!\/)[\w./-]+$` — a single leading slash — so a value can never become a
  `javascript:` URI, an absolute URL, or a protocol-relative `//host` href once
  it reaches an anchor. Do not loosen that regex.

`resolveThumbnail()` checks the disk at build time, preferring `.webp` over
`.png`, and falls back to the `.png` path when neither exists so the miss shows
up as a visible 404 rather than a silent blank.

## Authoring the HTML

A template is a **single self-contained file**: CSS in `<style>`, JS in
`<script>`, and **zero network requests** — no webfonts, no CDN, no hotlinked
images. Use local font stacks, inline SVG, CSS shapes, or solid blocks. It must
be a full page (not a component), responsive, and actually interactive: buttons
click, dropdowns open, tabs switch, modals appear, inputs accept text. Nothing
persists or submits anywhere.

Grep the file for `http://`, `https://`, `//fonts.`, and `src=` before adding it.
One remote request breaks the offline guarantee for every downloader.

In production this is enforced, not trusted: `vercel.json` serves `/templates/*`
under `default-src 'none'`, so a remote fetch, script, webfont or form submission
is blocked by the browser. A template that phones home looks broken on the live
site but fine locally — which is exactly why the grep matters before merge.

Templates are **not** bound to the site palette — they carry their own
personality. Keep them minimal and flat: no 3D, no video backgrounds, no heavy
motion.

## Site chrome is a different rule set

When editing anything under `src/components/`, `src/layouts/` or
`src/pages/` — not templates — the Tailwind theme in `src/styles/global.css`
clears `--color-*`, `--radius-*`, `--font-*`, `--text-*` and `--tracking-*` to
`initial`. The whole palette is `ink`, `bone`, `grey`.

**A utility outside the theme compiles to nothing and fails silently.**
`bg-blue-500` produces no CSS and no error. There is no `rounded-*` scale left;
`rounded-full` survives as a static utility for the rank seals. Hairlines are
`border-grey/30`, not a fourth colour. Use the `label` and `wordmark` custom
utilities rather than respelling their letter-spacing.

## Categories

Add one entry to the `CATEGORIES` array in `src/lib/categories.ts`. Array order
is display order, the id flows into the Zod enum automatically, and a category
with no templates is dropped at build time rather than rendered empty.

## Removing a template

Delete the object from `templates.json`, then delete
`public/templates/<id>.html` and its thumbnail. Leaving the files without the
entry is a valid state — they are simply unlisted and unreachable from the index.

## Commit the images

Thumbnails and `public/og.png` are generated on demand and committed. Nothing
renders at request time. `npm run thumbs` with no `--only` also rebuilds the OG
card.

`cwebp` is optional; without it the script keeps the PNG and the schema resolves
whichever format is on disk. Playwright is optional too — the script falls back
to a locally installed Chrome, or `CHROME_PATH`.
