# SEO route matrix

Every route in the application, classified. Derived from the router
(`src/app/routes.tsx`, `src/app/appViews.tsx`) and the SEO registry
(`src/seo/routes.ts`); the build validator (`scripts/validate-seo.mjs`)
enforces the PUBLIC_INDEXABLE rows and the absence of everything else from
the sitemap. See [SEO_GEO_IMPLEMENTATION.md](./SEO_GEO_IMPLEMENTATION.md)
for the policies behind the classifications.

Classifications: `PUBLIC_INDEXABLE` · `PUBLIC_NOINDEX` ·
`AUTHENTICATION_NOINDEX` · `PRIVATE_APPLICATION_NOINDEX` ·
`ADMIN_INTERNAL_NOINDEX` · `API_NON_DOCUMENT` · `REDIRECT` · `NOT_FOUND`.

## Public marketing surface — PUBLIC_INDEXABLE (134 URLs)

Prerendered, self-canonical, reciprocal en-CA/fr-CA/x-default hreflang, in
sitemap.xml. Purpose/intent notes double as the content matrix.

67 pages × 2 locales: 17 static routes, the 26 policy documents, the 13 Help
Centre articles, and the 12 editorial articles (6 guides + 6 blog posts).
`scripts/validate-seo.mjs` compares `dist/` against the route registry entry
by entry, so this count cannot drift from the build.

| EN path                  | FR path                              | Purpose / primary intent                                                      | Schema                                   | Conversion                  |
| ------------------------ | ------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------- | --------------------------- |
| `/`                      | `/fr`                                | What Dutiva is: AI-assisted HR compliance software for Canadian employers     | WebPage + WebApplication                 | Start free → `/app/welcome` |
| `/about`                 | `/fr/a-propos`                       | Who builds Dutiva; mission; built in Canada                                   | AboutPage                                | Start free                  |
| `/faq`                   | `/fr/faq`                            | Common questions: legal-advice limits, jurisdictions, data, pricing           | FAQPage (13 visible Q&A)                 | Contact support             |
| `/blog`                  | `/fr/blogue`                         | HR-compliance-in-practice article listing                                     | CollectionPage                           | Start free                  |
| `/blog/:slug` (×6)       | `/fr/blogue/:frSlug` (×6)            | One blog article — jurisdiction scope, policies, records, leaves, harassment  | WebPage + BreadcrumbList (visible trail) | Start free                  |
| `/pricing`               | `/fr/tarifs`                         | Plans + visible CAD prices; Stripe checkout                                   | WebPage + WebApplication w/ Offers       | Checkout / start free       |
| `/templates`             | `/fr/modeles`                        | Catalogue of the real HR document templates (ON/QC/FED badges)                | CollectionPage                           | Start free                  |
| `/guides`                | `/fr/guides`                         | Practical guidance index for Canadian employers                               | CollectionPage                           | Start free                  |
| `/guides/template-usage` | `/fr/guides/utilisation-des-modeles` | How template generation works; best practices                                 | WebPage + BreadcrumbList (visible trail) | Start free                  |
| `/guides/:slug` (×6)     | `/fr/guides/:frSlug` (×6)            | One evergreen guide — notice, probation, documents, contracts, accommodation  | WebPage + BreadcrumbList (visible trail) | Start free                  |
| `/known-limitations`     | `/fr/limites-connues`                | Transparency: what Dutiva is not; AI limits                                   | WebPage                                  | Contact support             |
| `/legal`                 | `/fr/juridique`                      | Index of the 26 policy documents                                              | CollectionPage                           | —                           |
| `/legal/:slug` (×26)     | `/fr/juridique/:frSlug` (×26)        | One policy document; visible last-updated/effective dates                     | WebPage w/ dates + BreadcrumbList        | —                           |
| `/help`                  | `/fr/aide`                           | Help Centre index; articles grouped by category                               | CollectionPage                           | Contact support             |
| `/help/:slug` (×13)      | `/fr/aide/:frSlug` (×13)             | One self-service help article; related articles in the same category          | WebPage + BreadcrumbList (visible trail) | Contact support             |
| `/contact`               | `/fr/contact`                        | Account-free support request form (product, privacy, security, accessibility) | WebPage                                  | Submit request              |
| `/status`                | `/fr/etat`                           | Self-reported service status: platform, Advisor, documents, support           | WebPage                                  | Contact support             |
| `/changelog`             | `/fr/journal-des-modifications`      | Dated public product updates; founder byline; sitemap lastmod from entries   | WebPage                                  | Start free / read changelog |
| `/vs/hrdownloads`        | `/fr/vs/hrdownloads`                 | Dutiva vs HRdownloads — pricing, risk flags, bilingual, statutes, self-serve | FAQPage (visible Q&A on page)            | Start free                  |
| `/vs/sixfifty`           | `/fr/vs/sixfifty`                    | Dutiva vs SixFifty — same comparison dimensions for Canadian employers       | FAQPage (visible Q&A on page)            | Start free                  |
| `/tools/jurisdiction-check` | `/fr/outils/verification-juridiction` | Free scoping tool: Ontario vs Quebec vs federal employment standards        | WebPage                                  | Try Dutiva free             |

The 26 policy slugs and their French equivalents live in
`src/features/marketing/legal/legalHubData.ts` (`slug` / `frSlug` per row);
the 13 Help Centre articles live in
`src/features/support/help/helpCenterData.ts` (`slug` / `frSlug` per article);
the 12 editorial articles live in `src/features/marketing/articles/`
(`guideArticles.ts` and `blogArticles.ts`).

The guides and blog collections must stay **disjoint in topic**. Both indexes
previously listed the same six titles, so giving each a URL under both
prefixes would have shipped duplicate pages competing with one another in
search. `src/seo/seo.test.ts` asserts the collections never converge again.

They are also disjoint in **purpose**, which is what decides where a new
article goes: `/guides` covers the documents and decisions an employer
_produces_ (contracts, probation, accommodation, termination files), and
`/blog` covers the regimes and obligations that _apply_ to them before
anything is drafted (which jurisdiction governs, which policies are required,
which records to keep). Neither is dated and neither is the "news" collection.
The rule is stated in full in `src/features/marketing/articles/articleModel.ts`,
and each index carries a `PageAside` pointing at the other so a reader who
landed on the wrong one can cross over.

## Authentication — AUTHENTICATION_NOINDEX

| Route          | Notes                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/app/welcome` | Sign-in gate (invite-only). Served from noindex `app.html`; `X-Robots-Tag: noindex, nofollow`; robots-disallowed; not in sitemap. |

## Private application — PRIVATE_APPLICATION_NOINDEX

All served from the noindex `app.html` shell behind `RequireAdminSession`;
same header/robots/sitemap treatment as above.

`/app/home` · `/app/advisor` · `/app/workflows` · `/app/cases` ·
`/app/cases/:caseId` · `/app/employees` · `/app/employees/:employeeId` ·
`/app/compliance` · `/app/policies` · `/app/templates` · `/app/tasks` ·
`/app/calendar` · `/app/reports` · `/app/knowledge` · `/app/communications` ·
`/app/compensation` · `/app/wellbeing` · `/app/memory` ·
`/app/memory/people/:personId` · `/app/memory/cases/:caseId` ·
`/app/memory/conversations/:threadId` · `/app/documents` ·
`/app/documents/studio` · `/app/documents/templates/:tid` ·
`/app/documents/generate/:templateId` · `/app/documents/:docId`

## Admin/internal — ADMIN_INTERNAL_NOINDEX

| Route           | Notes                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/app/settings` | Hosts the admin-only workspace-mode toggle; same noindex treatment as the rest of `/app`. There is no separate `/admin` surface. |

## API — API_NON_DOCUMENT

No API routes are served from this origin. Backend endpoints are Supabase
Edge Functions on the Supabase project host (`advisor-chat`,
`create-checkout-session`, `create-portal-session`, `stripe-webhook`) and
are not crawlable site URLs.

## Redirects — REDIRECT

| From                                           | To                    | Mechanism                                                   |
| ---------------------------------------------- | --------------------- | ----------------------------------------------------------- |
| `https://www.dutiva.ca/*`                      | `https://dutiva.ca/*` | 308, `vercel.json` (requires the www domain on the project) |
| `/path/` (trailing slash)                      | `/path`               | 308, `"trailingSlash": false`                               |
| `/app`                                         | `/app/home`           | client-side index redirect                                  |
| `/legal/<unknown>` , `/fr/juridique/<unknown>` | locale legal hub      | client-side `<Navigate replace>`                            |

## Not found — NOT_FOUND

| Route         | Notes                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| anything else | Static hosting serves `dist/404.html` (noindex, bilingual links home) with a real **404 status**; client-side navigation renders the router catch-all `NotFoundPage`. |

## Non-production deployments

Any `*.vercel.app` host gets `X-Robots-Tag: noindex, nofollow` on every
path via `vercel.json` — previews, branch deployments, and the default
production alias can never be indexed, and production `dutiva.ca` can never
be noindexed by a missing env var.
