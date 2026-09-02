# Security

## Reporting a vulnerability

Open a [security advisory](https://github.com/rvnztolentino/the-design-index/security/advisories/new)
rather than a public issue. If advisories are unavailable, open an issue that
describes the impact without a working exploit and say you'd like a private
channel.

Expect a first reply within a week. This is a personal project, not a funded
one — there is no bounty.

## What the attack surface actually is

The site is static. There is no server, no database, no auth, no sessions, no
cookies, no localStorage and no analytics. Every route is a file generated at
build time. Most classes of web vulnerability do not apply here.

Two things are worth reporting:

**1. A malicious or unsafe template.** Templates are arbitrary HTML, CSS and JS
served from the site's own origin, and anyone can submit one by pull request.
That makes template review the primary security control. Report a listed
template that:

- makes a network request of any kind
- imitates a real company's login, checkout or payment screen closely enough to
  work as a phishing page
- tries to read or write anything outside itself
- ships obfuscated or minified script with no readable source

**2. A gap in the headers.** `public/_headers` serves `/templates/*` under
`default-src 'none'` with `form-action 'none'` and `base-uri 'none'`, so a
template cannot fetch, XHR, open a WebSocket, load a remote script or webfont,
or submit a form. If you find a way for a template to escape that policy,
exfiltrate data, or reach the parent page, please report it.

## Out of scope

- Missing rate limits, CSRF tokens or auth hardening — there is nothing to rate
  limit and no session to forge.
- Findings from automated scanners with no demonstrated impact on a static site.
- The absence of `Strict-Transport-Security` preloading. The site sends HSTS
  with `includeSubDomains` and is served HTTPS-only; preload submission is
  made on the apex `rvnztolentino.com`, outside this repo.
- Anything requiring an attacker to already control the repo or the Cloudflare
  account.
