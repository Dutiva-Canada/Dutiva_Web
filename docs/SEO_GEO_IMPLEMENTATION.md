# SEO & GEO implementation

How search-engine and answer-engine visibility works in this repository:
what is generated, from which source of truth, and how to change it without
breaking the invariants the build enforces. The route-by-route inventory
lives in [SEO_ROUTE_MATRIX.md](./SEO_ROUTE_MATRIX.md).

## Architecture

The site is a Vite + React SPA whose **public pages are prerendered to
static HTML at build time**; the authenticated app (`/app…`) stays fully
client-rendered. `npm run build` runs four stages:

1. `vite build` — the client bundle (marketing visitors never download the
   app chunks or supabase-js; see the `codeSplitting` groups in
   `vite.config.ts`).
2. `vite build --ssr src/entry-server.tsx --outDir dist-ssr` — a Node render
   bundle over the exact same route table (`src/app/routes.tsx`).
3. `node scripts/prerender.mjs` — renders every public URL (EN + FR) with
   `react-dom/static`'s `prerender` (which waits for lazy chunks and
   `use()`-loaded content), injects each page's metadata into the HTML
   `<head>`, and writes `dist/<path>/index.html`. Also generates `app.html`
   (empty noindex shell for `/app`), `404.html`, `sitemap.xml`, `robots.txt`,
   and `llms.txt`.
4. `node scripts/validate-seo.mjs` — crawls `dist/` and **fails the build**
   on duplicate titles/canonicals, missing or non-reciprocal hreflang,
   invalid JSON-LD, private URLs in the sitemap or llms.txt, broken internal
   links, missing H1/`<main>`, placeholder values, and more. It also
   re-derives the route registry from the SSR bundle and checks **exact
   coverage** in both directions: every registry page exists in `dist/` and
   is in `sitemap.xml`, and `dist/` contains no page the registry doesn't
   declare. A page that silently stops being prerendered fails the build
   rather than quietly dropping out of search.

`src/main.tsx` hydrates prerendered pages (`hydrateRoot`) and client-renders
the app shell (`createRoot`). Suspense boundaries keep server HTML visible
until each lazy chunk arrives, so crawlers and no-JS visitors always see the
full page.

## Source of truth

**`src/seo/routes.ts` is the single registry** of public pages: pathnames
per locale, bilingual titles and descriptions, and indexability. The router,
the `<Seo>` tags, the sitemap, robots.txt, and llms.txt all derive from it —
they cannot drift apart, and the registry tests (`src/seo/seo.test.ts`)
enforce uniqueness and EN/FR parity.

Other modules in `src/seo/`:

| Module             | Role                                                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site.ts`          | Canonical origin (`SITE_ORIGIN`) + verified organization facts. Nothing else may hard-code `https://dutiva.ca`.                                                        |
| `head.ts`          | Framework-independent head model: builds/serializes/applies title, description, robots, canonical, hreflang, Open Graph, social cards.                                 |
| `Seo.tsx`          | The one component a page renders to declare its metadata. Client: applies to `document.head` (replace-all, no duplicates). Prerender: collected via `HeadSinkContext`. |
| `jsonld.ts`        | schema.org builders with stable `@id`s (`…/#organization`, `…/#website`, `…/#software`).                                                                               |
| `usePublicPath.ts` | Locale-aware internal link helper (`p('faq')`, `legalDoc('privacy')`, `home('#how')`).                                                                                 |
| `dates.ts`         | Parses the policy documents' displayed dates ("June 1, 2026" / "1er juin 2026") to ISO for JSON-LD and sitemap lastmod.                                                |

## Bilingual URL model

- **English pages keep the site's original unprefixed URLs** (`/`, `/about`,
  `/legal/terms`). **French pages live under `/fr` with localized slugs**
  (`/fr`, `/fr/a-propos`, `/fr/juridique/conditions-utilisation`). French
  slugs for the 26 policy documents live on `LEGAL_HUB_GROUPS` rows
  (`frSlug`, `src/features/marketing/legal/legalHubData.ts`).
- The URL is the only thing that decides the public page language
  (`ForcedLangProvider`); cookies/localStorage never change what a crawler
  sees. The app surface (`/app…`) keeps the persisted `dutiva-lang`
  preference (`LangProvider`).
- Every page is **self-canonical** and carries reciprocal
  `hreflang="en-CA"` / `"fr-CA"` / `"x-default"` (x-default → the English
  page). `<html lang>` is `en-CA` / `fr-CA`; Open Graph uses `og:locale`
  `en_CA`/`fr_CA` with the alternate.
- The header language toggle is a real `<a hreflang>` link to the same
  page's URL in the other language — a crawlable, visible EN↔FR
  cross-reference on every public page. It also persists the choice for the
  app surface.

## Indexing policy

- **Public marketing/legal/resource pages**: `index, follow,
max-image-preview:large`, self-canonical, in the sitemap.
- **`/app` and everything under it** (sign-in, workspace, admin): served
  from the noindex `app.html` shell, `X-Robots-Tag: noindex, nofollow`
  headers in `vercel.json`, disallowed in robots.txt, never in the sitemap.
  robots.txt is _not_ the security boundary — authentication
  (`RequireAdminSession`) remains the gate.
- **Unknown URLs**: static hosting serves `dist/404.html` (noindex) with a
  real 404 status; client-side navigation hits the router's catch-all
  `NotFoundPage`.
- **Preview/non-production deployments**: `vercel.json` adds
  `X-Robots-Tag: noindex, nofollow` for any `*.vercel.app` host (on top of
  Vercel's own preview noindex behaviour). Production on `dutiva.ca` is
  unaffected — the rule keys off the host header, not an env var, so a
  missing variable can never noindex production.

## Canonical strategy

HTTPS + apex host only (`https://dutiva.ca`); `www` 308-redirects to apex
(`vercel.json`, plus DNS config in Vercel); trailing slashes are normalized
off (`"trailingSlash": false`); paths are lowercase. The origin is
centralized in `src/seo/site.ts` and can be overridden per deployment with
`VITE_SITE_ORIGIN` (see `.env.example`). Canonical URLs never carry query
parameters. Cross-locale slug lookups (e.g. an EN slug under
`/fr/juridique/…`) still resolve but canonicalize to the properly localized
URL.

## Crawler & AI policy (robots.txt)

Generated by `scripts/prerender.mjs`; validated by `validate-seo.mjs`.

- **Search discovery is welcome** — general crawlers plus the AI _search_
  crawlers that cite sources (`OAI-SearchBot`, `Claude-SearchBot`,
  `PerplexityBot`). Each named group repeats the private-path exclusions
  (`/app`, `/app.html`, `/404.html`) because a bot-specific group replaces
  the `*` group entirely.
- **Foundation-model _training_ crawlers are opted in** (decided 2026-08-06,
  D4): `GPTBot` (OpenAI), `ClaudeBot` (Anthropic), `CCBot` (Common Crawl),
  `Amazonbot` (Amazon), `Google-Extended` (Google Gemini/Vertex). All get
  the same private-path exclusions as everyone else. To opt out of a
  specific provider's training, move its bot to a `Disallow: /` block in
  `scripts/prerender.mjs` and update this document.
- CSS/JS/image assets are not blocked.

## Structured data

One JSON-LD `@graph` per page (`<script type="application/ld+json">`),
built by `src/seo/jsonld.ts`. Every graph contains `Organization`
(legal name _Dutiva Canada Inc._, brand _Dutiva_, logo, support email,
areaServed Canada, `founder` pointing at the Person `@id`), `Person`
(Martin Constantineau, Founder & CEO, LinkedIn `sameAs`, on-origin photo),
and `WebSite`, plus a page node:

| Page                                                | Node types                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Home                                                | `WebPage` + `SoftwareApplication`/`WebApplication`                                               |
| Pricing                                             | `WebPage` + `WebApplication` with `Offer`s mirroring the visible CAD plan cards                  |
| About                                               | `AboutPage`                                                                                      |
| FAQ                                                 | `FAQPage` with `mainEntity` built from the _same_ GROUPS constant the page renders               |
| Blog / Guides / Templates / Legal hub / Help Centre | `CollectionPage`                                                                                 |
| Policy documents                                    | `WebPage` with real `datePublished`/`dateModified` (from the displayed dates) + `BreadcrumbList` |
| Help Centre articles                                | `WebPage` + `BreadcrumbList` (visible trail)                                                     |
| Guide / blog articles                               | `WebPage` + `BreadcrumbList` (visible trail)                                                     |
| Guides → Template usage                             | `WebPage` + `BreadcrumbList` (visible trail)                                                     |
| Known limitations / Contact / Status                | `WebPage`                                                                                        |

Hard rules: only verified, visible facts — no ratings, reviews, awards,
addresses, founding dates, or invented pricing. Social profiles (`sameAs`)
only when published on the site (currently the founder's LinkedIn). Offers
exist only on the pricing page because prices are visibly rendered there.
`validate-seo.mjs` parses every block and rejects off-origin URLs (LinkedIn
is allowlisted for `sameAs`) and placeholder values.

## Sitemap & llms.txt

- `sitemap.xml`: every indexable URL (both locales) with reciprocal
  `xhtml:link` alternates; `lastmod` **only** where a real authored date
  exists — policy documents (parsed from their displayed "Last updated"
  dates) and editorial articles (the `updated` field on the article record).
  Never the build date, and never on pages that carry no verified date: a
  `lastmod` that moves on every build teaches crawlers to ignore it.
  Both locales of an article share one date, because the article is authored
  bilingually in a single record and an EN/FR split would be fictional.
  Deterministic.
  Element order inside `<url>` is `loc` → `lastmod` → the `xhtml:link`
  alternates: the sitemaps.org 0.9 schema declares the sitemap-namespace
  children as an ordered sequence, so a `lastmod` trailing the extension
  elements trips strict validators. `validate-seo.mjs` enforces the order.
- `llms.txt`: a machine-readable orientation file generated from the same
  registry — identity, audience, jurisdictions, languages, the legal-advice
  limitation, major public pages, and a statement that `/app` is private.
  It is a supplemental navigation aid, not a ranking mechanism, and there is
  no `llms-full.txt` (the public corpus is not large enough to warrant one).

## Analytics & verification

There is no analytics provider today, and this work deliberately does not
add one. Search-engine ownership verification is env-backed:
`GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` set at build time are
injected as meta tags by the prerender script — no tokens live in the repo.

## How to…

### Add a public page

1. Add an entry to `SEO_ROUTES` in `src/seo/routes.ts` (both pathnames,
   bilingual title + description).
2. Add the route element in `publicRoutes()` in `src/app/routes.tsx`.
3. Render `<Seo route="…" />` once at the top of the page component (plus
   `pageType`, `breadcrumb`, `faq`, or `extraNodes` as appropriate).
4. `npm run build` — the prerenderer picks it up automatically; the
   validator fails if metadata is missing or duplicated.

**Add a guide or blog article** — add an entry to `GUIDE_ARTICLES`
(`src/features/marketing/articles/guideArticles.ts`) or `BLOG_ARTICLES`
(`blogArticles.ts`) with a `slug`, a localized `frSlug`, an `updated` ISO date,
and bilingual body blocks. The route, metadata, breadcrumb, sitemap entry
(including `lastmod`, from `updated`), and index card are all derived — no
other file needs editing. Bump `updated` only when the substance changes.
Every article also renders a fixed call-to-action into `/templates` and
`/pricing` (`ArticlePage.tsx`): article bodies are plain text by design, so
that block is the only link out of the editorial corpus into the commercial
pages, and removing it makes the corpus a dead end. Which of the two files an
article goes in is decided by purpose, not freshness — `guideArticles.ts` for
the documents and decisions an employer produces, `blogArticles.ts` for the
regimes and obligations that apply to them before anything is drafted; neither
collection is dated. Keep the two collections
disjoint in topic: a title appearing in both would mint duplicate competing
pages, and `seo.test.ts` fails the build if they converge. Articles follow the editorial
rules in `articleModel.ts` — concepts and decision points, no published
statutory figures, never legal advice.

**Add a policy document** — add the content files
(`src/features/marketing/legal/content/<slug>.{en,fr}.ts`), a row (with
`frSlug`) in `legalHubData.ts`, and its `legalHub_row*` strings. Everything
else (route, metadata, sitemap, dates) is derived.

**Mark a route noindex** — set `indexable: false` in its registry entry; it
drops out of the sitemap/llms.txt and gets `noindex, nofollow`
automatically. For a dynamic page, pass `indexable: false` in `<Seo page>`.

**Update a policy date** — edit `lastUpdated`/`effectiveDate` in the
document's content file. The visible page, JSON-LD, and sitemap `lastmod`
all follow. Change it only when the substantive content changes.

**Change the canonical origin** — set `VITE_SITE_ORIGIN` at build time (or
change the default in `src/seo/site.ts`).

## Commands

| Command                         | What it does                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run check`                 | typecheck + lint + tests (includes the SEO registry/head/JSON-LD suites)                       |
| `npm run build`                 | full production build + prerender + SEO crawl validation                                       |
| `node scripts/validate-seo.mjs` | re-run the dist validation alone (needs an existing `dist/` + `dist-ssr/`, i.e. after a build) |

## Post-deployment actions (not automatable from the repo)

- Verify domain-level config in Vercel: `dutiva.ca` production domain,
  `www.dutiva.ca` assigned so the apex redirect applies.
- Verify ownership in Google Search Console and Bing Webmaster Tools
  (set the env vars above, or use DNS verification), then submit
  `https://dutiva.ca/sitemap.xml` to both.
- After the first production deploy: spot-check `curl -I` for `/`,
  `/app/anything` (X-Robots-Tag), an unknown URL (404 status), and
  `/about/` (308 → `/about`); run Google's Rich Results test on `/`,
  `/pricing`, `/faq`, and one policy page; request indexing for the key
  pages and monitor Coverage/Pages reports.
- Business-profile and third-party directory listings should use the exact
  positioning line in `src/seo/site.ts` (`ORG_DESCRIPTION`) for consistency.
  The listing targets, ready-to-paste copy, and the outreach queue live in
  [SEO_AUTHORITY_PLAYBOOK.md](./SEO_AUTHORITY_PLAYBOOK.md) — the off-site half
  of this work, none of which the build can do.
