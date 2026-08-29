# The Design Index

A static Astro site that indexes self-contained HTML templates. Every listed
template is one `.html` file in `public/templates/` that a visitor can preview,
download, and use as a starting point.

Node 22.12+. See `README.md` for the full tour.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on :4321. Start it in background mode, never blocking. |
| `npm run build` | Static output to `dist/`. **The content schema only runs here** — this is the real check after any data edit. |
| `npm run preview` | Serve the built `dist/`. |
| `npm run thumbs` | Regenerate every thumbnail + `public/og.png`. `-- --only=<id>` for one. |

There is no test suite and no linter. `npm run build` is the gate.

## Adding or editing templates

Use the `add-template` skill. It covers the order of operations, the schema
invariants, and the authoring contract. Do not work from the README's
"Adding a template" steps — they list the thumbnail before the JSON entry, and
the thumbnail script reads `templates.json` to decide what to shoot.

## The palette fails silently

`src/styles/global.css` resets Tailwind's `--color-*`, `--radius-*`, `--font-*`,
`--text-*` and `--tracking-*` to `initial`. The entire palette is `ink`, `bone`,
`grey`.

**A utility outside the theme compiles to no CSS and raises no error.**
`bg-blue-500`, `text-sm` and `rounded-lg` all vanish quietly. Spacing and layout
utilities are untouched — it is colour, radius, font, type size and tracking that
have no scale left. Before reaching for one of those in site chrome, confirm the
token exists in `global.css`.

- Hairlines are `border-grey/30` — not a fourth colour.
- `rounded-full` is the only radius left, kept for the rank seals.
- Use the `label` and `wordmark` custom utilities instead of respelling their
  letter-spacing.
- Type sizes are the custom scale: `text-micro`, `text-label`, `text-small`,
  `text-body`, `text-lead`, `text-name`, `text-title`.

This applies to `src/components/`, `src/layouts/` and `src/pages/` only.
Templates in `public/templates/` are deliberately **not** bound to the palette —
they carry their own personality and never import site CSS.

## The site stays static

`output: 'static'`, deployed prerendered to Vercel. Do not add an adapter, API
routes, middleware, or a server island. Nothing is stored: no auth, sessions,
database, cookies, localStorage or analytics.

`vercel.json` scopes the site CSP to `/` and a separate, stricter one to
`/templates/(.*)`, deliberately not `/(.*)`, so a template is never served two
overlapping policies. **A new route therefore ships with no CSP until you add an
entry.** The templates policy is `default-src 'none'` — it enforces the
"no network requests" contract in the browser, so don't loosen it to make a
template work; fix the template.

Shipped JS is `src/scripts/modal.ts` and nothing else. Keep it that way — native
`<dialog>` already provides Escape, the focus trap, focus restore and page
inertness, so don't reimplement them.

## Generated files are committed

Thumbnails and `public/og.png` are produced on demand by `scripts/thumbnails.mjs`
and committed. Nothing renders at request time. Regenerate and commit the images
in the same change as the template.

`dist/` and `.astro/` are gitignored build output — never edit them by hand.

## When the site URL changes

`SITE.url` and `SITE.repo` in `src/lib/site.ts` feed the canonical tag, Open
Graph, JSON-LD and every "View source" link. A wrong `repo` breaks View source
on every card. `public/robots.txt` and `public/sitemap.xml` hardcode the domain
too — update all four together.

## Licence

CC0 1.0 (`LICENSE`). Public domain, no attribution. Contributions come in on the
same terms — see `CONTRIBUTING.md`. Don't add a template derived from a paid
theme or another site's markup.
