# SEO authority playbook — listings, citations, and links

The companion to [SEO_GEO_IMPLEMENTATION.md](./SEO_GEO_IMPLEMENTATION.md).
That document covers everything the build controls: prerendering, metadata,
structured data, sitemap, robots. **This one covers the part the repository
cannot do**, and says so plainly rather than pretending otherwise.

## Why this document is not code

As of this writing, a live search for the brand plus its core category returns
Dutiva's **legal pages** — privacy, terms, Quebec Law 25, PIPEDA, cookies, AI
usage disclosure — and not the homepage, `/pricing`, `/guides`, or `/blog`.
The commercial terms are held by established competitors with large content
libraries and years of accumulated links.

That result is diagnostic. It proves crawling, indexing, and rendering all
work correctly — the technical layer is not the problem. It also shows what
is missing: the policy documents rank because they are long, unique, and
substantive, while the site as a whole has close to no external authority.
Two levers move that, and neither is a code change:

1. **Depth on the pages meant to rank.** Partly addressed — the twelve
   editorial articles were expanded from roughly 550 to 850–1,600 English
   words each, bilingually, and every article now links into `/templates`
   and `/pricing`.
2. **Links and citations from sites that already have authority.** Entirely
   human outreach. That is what follows.

Nothing here can be shipped by an agent. Treat it as a work queue for a
person, ordered so the cheapest, highest-certainty items come first.

## Tier 1 — Owned listings (do these first)

These are free, fully within your control, and each produces a citation that
search engines and answer engines both read. None requires anyone's approval.

| Listing                 | Notes                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Google Business Profile | Use the Ottawa operating city. Verification is by mail or phone — start early, it is slow. |
| Bing Places             | Feeds Bing, and Bing grounds several answer engines including Copilot.                     |
| LinkedIn company page   | Live at https://www.linkedin.com/company/dutiva-canada — wired into Organization `sameAs` and `/about`. |
| Crunchbase              | Frequently cited by AI answers when asked what a company is.                               |
| Apple Business Connect  | Low effort, feeds Apple Maps and Siri.                                                     |

Use the **exact positioning line** from `src/seo/site.ts` (`ORG_DESCRIPTION`)
so every listing agrees with the site and with the JSON-LD. Consistency across
listings is itself a ranking and trust signal — divergent descriptions are
worse than a shorter one repeated verbatim.

### Ready-to-paste copy

Derived from `ORG_DESCRIPTION` and `docs/CANONICAL_FACTS.md`. Do not improve
these ad hoc; change `site.ts` and re-derive, or the listings drift the way
the Drive documents did.

#### Short (under 100 characters), EN

> AI-assisted HR compliance software for Canadian employers.

#### Short, FR

> Logiciel de conformité RH assisté par l'IA pour les employeurs canadiens.

#### Medium (about 250 characters), EN

> Dutiva Canada Inc. provides AI-assisted HR compliance software for Canadian
> employers — practical, jurisdiction-specific guidance and workplace
> documentation across the employee lifecycle. Dutiva does not provide legal
> advice.

#### Long, EN

> Dutiva is compliance-oriented HR software built for Canadian employers, HR
> teams, and business operators. It provides jurisdiction-specific guidance and
> review-ready workplace documentation across Ontario, Quebec, and the federal
> labour regime, covering the employee lifecycle from hiring through
> termination. Dutiva names the statute, not just the province. It supports HR
> workflows and documentation; it does not provide legal advice and does not
> make employment decisions for its customers.

**Category selections.** Where a directory asks for a category, prefer "HR
software" or "compliance software" over "legal services" — the latter
misrepresents the product and cuts against the boundary the site maintains
everywhere else.

**Phone.** 1 (800) 349-0297 is the confirmed business number
(CANONICAL_FACTS, founder 2026-08-23). Use it on directory listings that
require a phone. The marketing site still publishes **<support@dutiva.ca>**
only — `info@`, `hello@`, and `DutivaCanada@` are retired — unless a product
decision later adds the number to public copy.

**Address.** Ottawa for marketing and press contexts; the Toronto registered
office for legal and corporate contexts. Pick per the directory's purpose and
keep it consistent within that category.

## Tier 2 — Canadian associations and business bodies

Higher authority than generic directories and far more relevant to the
audience. Most charge membership; verify current cost and eligibility before
committing, and treat the directory listing as one benefit among several
rather than the reason to join.

- **Invest Ottawa** — regional ecosystem directory, relevant to the operating city.
- **Ottawa Board of Trade** and the **Ontario Chamber of Commerce** — local and provincial business listings.
- **Canadian Chamber of Commerce** — national.
- **HRPA** (Human Resources Professionals Association, Ontario), **CPHR Canada**, and the **Ordre des CRHA** in Quebec — the professional bodies your buyers belong to. Vendor or partner directories where they exist; their publications are also the best guest-post targets.
- **National Payroll Institute** — adjacent audience with real overlap on record-keeping and termination documentation.
- **BetaKit**, **Communitech**, **MaRS** — Canadian tech ecosystem coverage and directories.

The Quebec bodies matter disproportionately. Genuine French-language HR
content is scarce, the site already ships a full French corpus under `/fr`,
and a citation from a Quebec professional body is both easier to earn and less
contested than the equivalent in English.

## Tier 3 — Software review directories

G2, Capterra, GetApp, Software Advice, and TrustRadius rank extremely well for
comparison and alternatives queries, and answer engines lean on them heavily.

**The honest constraint:** these are review-driven, and paid plans are shown
but not sold during beta (`PAID_PLANS_DISABLED_DURING_BETA`). A profile with
no reviews ranks poorly and converts worse. Create the profiles now so they
are indexed and claimed, then pursue reviews once there are paying customers
with something real to say. **Never** solicit or write reviews from people who
have not used the product — fabricated social proof is both a policy violation
on every one of these platforms and squarely against the "no fabricated
metrics" rule in CANONICAL_FACTS.

## Tier 4 — Earned coverage and guest contributions

The highest-value and slowest category. Publications worth approaching:
**Canadian HR Reporter**, **HRD Canada**, **Benefits Canada**, regional
business press in Ottawa and Toronto, and the association publications above.

What makes a pitch land here is a specific, useful angle rather than a company
announcement. The expanded articles are the raw material — each already
represents a defensible point of view:

| Article                          | Pitch angle                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `ontario-termination-notice`     | Why termination clauses fail in Ontario, and the drafting habits behind it        |
| `employment-contract-clauses`    | The clauses Canadian employers borrow from US agreements that do not survive here |
| `quebec-employment-standards`    | Why an Ontario HR playbook misprices Quebec departures                            |
| `federally-regulated-workplaces` | The jurisdiction question most employers have never actually confirmed            |
| `duty-to-accommodate`            | Process failures, not accommodation costs, drive most adverse findings            |
| `employment-record-keeping`      | Retention obligations that pull in two directions at once                         |

The founder's operating background — a Canadian HR and payroll operator who
has processed payroll, prepared ROEs, and drafted termination letters across
federal and provincial standards — is the credibility hook, and it is real.
Attribute as **Martin Constantineau, Founder & CEO**, always in full.

## What is deliberately not on this list

**A public termination-notice calculator.** An earlier version of this advice
proposed one as a linkable asset. It is barred: publishing notice periods
would violate the editorial rule in `articleModel.ts`, which is enforced at
build time by `articles.test.ts` and exists precisely because a wrong
statutory figure on an answer-engine-indexed page gets quoted onward without
the disclaimer beside it. Any **public** linkable tool has to work without
publishing figures — a decision checklist or a jurisdiction-scoping
questionnaire would qualify; a figure-emitting calculator would not.

**Workspace entitlement calculators — eng complete (TODO.md EF11, 2026-08-24).**
Ontario notice, severance eligibility + amount, QC/FED hedge notice flows,
ROE / layoff / leave-return trackers ship under `/app/workflows/`. Public
figure-emitting calculators on `/tools/*` remain barred. Remaining EF11 items
need L6 sign-off or a product data decision — not unattended eng (see TODO.md
EF11 “Blocked” table).

**A jurisdiction-scoping questionnaire — built (D6, 2026-08-06).** Three
questions determine whether Ontario (ESA), Quebec (LNT), or federal (Canada
Labour Code) employment standards likely apply to an employee. No statutory
figures — it names the statute and links to the official text. Live at
`/tools/jurisdiction-check` (EN) and `/fr/outils/verification-juridiction`
(FR), prerendered and in the sitemap. This is the non-figure linkable asset
the playbook called for.

**Paid links and link exchanges.** Against Google's guidelines, and the risk
sits on the domain you are trying to build.

**Cold outbound at volume.** CASL governs any outbound campaign — opt-in
required, the burden of proving consent sits with the sender, penalties reach
into the millions. Individual, researched outreach to a named editor is a
different activity from a campaign and is what this playbook contemplates.

**Claims the product does not support.** Never "legally compliant" or
"guaranteed compliant"; never a launch date (both previously published dates
have passed — tie language to product state instead); never customer names
without written permission; never implied provincial coverage beyond Ontario,
Quebec, and the federal regime. Alberta and BC stay labelled roadmap.

## Measuring whether any of it worked

Search Console is the prerequisite and is verified (see `docs/TODO.md`
OA8). Bing Webmaster currently holds a `www.dutiva.ca` property — after the
apex redirect is confirmed live, add/verify the apex property and prefer it.

Once listings and articles are live, the metrics that matter are, in order:
number of distinct referring domains; impressions and average position for
the article URLs specifically, separated from the legal pages that currently
absorb the brand queries; and whether the commercial pages (`/`, `/pricing`,
`/templates`) begin surfacing for non-brand terms at all. Expect the first
movement in months, not weeks.

### Quarterly AI-answer probe (four engines)

Run this once a quarter. Query **ChatGPT**, **Claude**, **Perplexity**, and
**Microsoft Copilot** with the same prompts (incognito / no personalization).
Score each cell: mentioned / recommended / competitor-only / absent, and note
the category label the engine uses (HR software vs legal services).

| Buying stage | Prompt (EN) | Prompt (FR) |
| --- | --- | --- |
| Problem aware | What software helps Canadian employers with HR compliance? | Quel logiciel aide les employeurs canadiens avec la conformité RH ? |
| Solution aware | Best AI HR compliance tools for Ontario employers | Meilleurs outils IA de conformité RH pour employeurs ontariens |
| Category | HR compliance software Canada comparison | Comparaison logiciels conformité RH Canada |
| Consideration | Dutiva vs HRdownloads | Dutiva vs HRdownloads |
| Decision | Is Dutiva good for Quebec employment standards documentation? | Dutiva convient-il pour la documentation des normes du travail au Québec ? |

Log results in a private sheet (date, engine, prompt, outcome, cited URL,
competitor named). Do not invent scores in the repo.

### Citation → session attribution

When a listing or guest post can take a link, use:

`https://dutiva.ca/<path>?utm_source=<publisher>&utm_medium=referral&utm_campaign=authority_<yyyyqq>`

GA4 (`VITE_GA_MEASUREMENT_ID`, consent-gated) is the session sink. CRM
attribution for inbound demos stays manual until a CRM is wired — paste the
landing URL + `utm_*` into the opportunity notes.

## Open items

1. Confirm `www.dutiva.ca` → `https://dutiva.ca` 308 after the next production
   deploy (Vercel Domains: www assigned, not primary without redirect). Then
   prefer the apex property in Bing Webmaster Tools.
2. Create remaining Tier-1 owned listings (GBP, Bing Places, Crunchbase,
   Apple Business Connect) using the ready-to-paste copy above. Company
   LinkedIn is live at `https://www.linkedin.com/company/dutiva-canada` and
   already wired into Organization `sameAs` + `/about`.
3. Run the quarterly four-engine probe and store scores outside the repo.
