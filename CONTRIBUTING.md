# Contributing

The most useful contribution is a good template. Fixes to the site itself are
welcome too.

Everything here is [CC0](LICENSE). By opening a pull request you agree your
contribution is dedicated to the public domain, and you confirm the work is
yours to give — do not submit anything derived from a paid theme, a licensed
asset, or another site's markup.

## Adding a template

`README.md` has the full procedure and the field reference. In short:

```bash
# 1. write public/templates/<id>.html
# 2. add one object to src/data/templates.json
npm run thumbs -- --only=<id>     # 3. shoot the thumbnail
npm run build                     # 4. this is what validates the entry
```

The entry must exist before step 3 — the thumbnail script reads
`templates.json` to decide what to shoot.

Commit the generated thumbnail. Images are produced on demand and checked in;
nothing renders at request time.

## What gets a template merged

Hard requirements, all enforced or checked at review:

- **One self-contained `.html` file.** CSS in `<style>`, JS in `<script>`.
- **Zero network requests.** No webfonts, no CDN, no hotlinked images. Use local
  font stacks, inline SVG, CSS shapes or solid blocks. Production serves
  `/templates/*` under a CSP that blocks all network access, so a template that
  phones home is visibly broken.
- **A full page**, not a component.
- **Genuinely interactive.** Buttons click, dropdowns open, tabs switch, modals
  appear, inputs accept text. Nothing persists or submits anywhere.
- **Responsive.**
- **Readable source.** No minified or obfuscated script. People are meant to read
  and edit this file — that is the entire point of the index.
- **Original.** Not a clone of a real brand's UI, and not close enough to a real
  login or checkout screen to work as a phishing page.

Style: keep it minimal and flat. No 3D, no video backgrounds, no heavy motion.
Templates are *not* bound to the site's three-colour palette — they should have
their own personality.

## Changing the site itself

Read `.claude/CLAUDE.md` first. The short version: `src/styles/global.css` wipes
Tailwind's default palette, radius, font and type scales, so a utility outside
the theme compiles to **no CSS and no error**. Check the token exists before you
use it.

The site is `output: 'static'`. Don't add an adapter, API routes, middleware, or
anything that stores data.

There is no test suite. `npm run build` is the gate — it must pass.

## Adding a category

One entry in the `CATEGORIES` array in `src/lib/categories.ts`. Array order is
display order. A category with no templates is dropped at build time, so add the
category and its first template together.
