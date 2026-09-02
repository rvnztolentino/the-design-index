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

`output: 'static'`, deployed prerendered to Cloudflare Pages: build command
`npm run build`, output directory `dist`. Do not add an adapter, API routes,
middleware, a server island, or a Pages Function. Nothing is stored: no auth,
sessions, database, cookies, localStorage or analytics.

`public/_headers` scopes the site CSP to `/` and a separate, stricter one to
`/templates/*`, deliberately not `/*`, so a template is never served two
overlapping policies. That split is load-bearing, not tidiness: Pages applies
every rule a request matches and joins two rules setting the same header with a
comma, and a comma inside a CSP is read by the browser as two policies enforced
together. **A new route therefore ships with no CSP until you add an entry.**
The templates policy is `default-src 'none'`: it enforces the "no network
requests" contract in the browser, so don't loosen it to make a template work;
fix the template.

`_headers` covers static assets only. It is silently ignored for anything served
by a Pages Function, which is one more reason there are none.

Shipped JS is `src/scripts/modal.ts` and nothing else. Keep it that way — native
`<dialog>` already provides Escape, the focus trap, focus restore and page
inertness, so don't reimplement them.

## The lockfile is generated with npm 10

Pages installs with `npm clean-install` using **npm 10.9.2**, which rejects a
lockfile npm 11 considers complete. npm 11 prunes transitive deps of the optional
wasm32 packages under `sharp` and `@tailwindcss/oxide`; npm 10 then fails the
build with `Missing: @emnapi/core` and `Missing: @emnapi/runtime`, before Astro
ever runs. Local `npm ci` will not catch it, because those optional packages are
skipped on macOS.

So after any dependency change, regenerate the lock with the deploy's npm and
commit that:

```sh
npx npm@10.9.2 install --package-lock-only
```

Run it from a directory holding only `package.json` if npm reports "up to date"
and leaves the lock unchanged: an existing `node_modules` short-circuits the
resolution. `.node-version` pins Node 22.16.0, whose bundled npm is the same
10.9.2, so the deploy and the lock agree.

## Generated files are committed

Thumbnails and `public/og.png` are produced on demand by `scripts/thumbnails.mjs`
and committed. Nothing renders at request time. Regenerate and commit the images
in the same change as the template.

`dist/` and `.astro/` are gitignored build output — never edit them by hand.

## When the site URL changes

The deployed domain is hardcoded in five places. Change one, change all five:

- `src/lib/site.ts` — `SITE.url`, feeding canonical, Open Graph and JSON-LD
- `astro.config.mjs` — `site`
- `public/robots.txt` — the `Sitemap:` line
- `public/sitemap.xml` — the `<loc>`
- `scripts/thumbnails.mjs` — the footer of `OG_HTML`

Adding the domain to the Cloudflare Pages project comes first, so DNS and the
certificate are live before the new URL ships. `public/_headers` needs no change:
its rules are path-scoped. The single host-scoped rule is written against
`pages.dev`, to keep that mirror of the site out of search results, so a change
of custom domain leaves it correct.

Then run `npm run thumbs` and commit `public/og.png`: the domain is **rendered
into that image**, so editing the source alone leaves every shared link showing
the old one. A full run rebuilds the card even when the index is empty.

`SITE.repo` is separate and points at GitHub, not the deploy. A wrong `repo`
breaks "View source" on every card.

## Licence

CC0 1.0 (`LICENSE`). Public domain, no attribution. Contributions come in on the
same terms — see `CONTRIBUTING.md`. Don't add a template derived from a paid
theme or another site's markup.
