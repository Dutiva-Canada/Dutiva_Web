# Law-change monitoring

How Dutiva notices when Canadian employment legislation changes, how to verify
it is actually running, and what to do when it isn't.

## What it does

`supabase/functions/monitor-law-changes/` sweeps **19 legislation pages across
all 14 Canadian jurisdictions** once a day and records what it finds:

| Event        | Meaning                                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `first_seen` | Page added to monitoring; baseline hash captured.                                                                                                                                      |
| `change`     | Extracted text hash differs from the last sweep — with a plain-English summary of what it means for employers.                                                                         |
| `redirect`   | Page moved permanently; monitoring auto-follows to the new URL.                                                                                                                        |
| `broken`     | Page unreachable for 3 consecutive sweeps. Past that threshold the function asks the model for a replacement URL and accepts it only if it passes the host allowlist **and** resolves. |

Two tables carry the state, both created directly on the project rather than by
a migration in this repo (the `0003` / `0011` / `0026` policy migrations guard
their statements with `to_regclass` for exactly this reason):

- `law_page_hashes` — one row per monitored page: content hash, redirect target, failure count, `last_checked`.
- `law_updates` — the append-only event log the product reads.

The customer-facing surface is the **Knowledge view** → "Live legal sources"
panel (`src/features/app/guidance/`), which reads `law_updates` via
`fetchRecentLawUpdates()`.

### Why 14 jurisdictions when the product supports 3

Monitoring is deliberately wider than coverage. Dutiva supports ON, QC and FED
(`docs/CANONICAL_FACTS.md`); watching the rest costs nothing extra and builds
history ahead of the AB/BC expansion. **The panel is what filters, not the
monitor** — do not let a monitored jurisdiction imply supported coverage.

## How change is detected

Two strategies, chosen per source by `PageConfig.source`:

| Strategy      | Used for                                      | How it decides "changed"                                                 |
| ------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `html`        | Everything except federal                     | SHA-256 over the extracted page text, gated by the content-sanity check. |
| `justice-xml` | Canada Labour Code, Canadian Human Rights Act | Reads `lims:lastAmendedDate` from the root `<Statute>` element.          |

**Prefer `justice-xml` wherever a jurisdiction offers equivalent data.** Hashing
asks "did these bytes move?", which is a proxy for the real question and wrong
in both directions: a publisher reformats and the hash cries wolf; a page turns
into a JavaScript shell and the hash goes quiet forever. Reading a stated
amendment date asks the real question directly.

Three details worth knowing:

- **Range requests.** Only the `<Identification>` block at the top is needed,
  so each check asks for the first 16 KB rather than a multi-megabyte Act. A
  server that ignores `Range` returns the whole file, which still parses.
- **Identity is verified.** `<ConsolidatedNumber>` is checked against the
  expected code, so a URL that starts serving a different Act is reported
  rather than silently tracked. This is not hypothetical — the Saskatchewan
  fallback pointed at a 2015 Gazette issue for months because nothing checked.
- **`content_hash` holds `amended:YYYY-MM-DD`** for these rows rather than a
  SHA-256, deliberately prefixed so the column is self-describing when read by
  hand.

Only the English file is monitored; the French text is published alongside it
and carries the same amendment date, so watching one detects changes to both.

## How it is scheduled

A `pg_cron` job in the database, `monitor-law-changes-daily`, runs at **07:00
UTC** and calls `public.trigger_law_monitor()`, which reads a service key from
Vault and `POST`s to the edge function via `pg_net`
(`supabase/migrations/0035_schedule_law_monitor.sql`).

### Why in the database

It used to be a Vercel cron, defined in the retired `Dutiva-Website` repo as
`api/trigger-law-monitor.js` plus a `crons` block in its `vercel.json`. When the
Vercel project was re-pointed at this repo — which has no `api/` directory and
no crons — **the schedule silently ceased to exist**. Nothing failed. Nothing
alerted. The monitor simply stopped after **2026-06-08**, and the Knowledge
view kept serving those rows as current for 52 days.

Scheduling in Postgres puts the schedule beside the data it writes, where a
hosting or repository move cannot take it away.

## Setup: the one manual step

The job needs a service-role key, which must never be committed. Add it once
in the Supabase SQL editor:

```sql
select vault.create_secret(
  '<service-role or secret key>',
  'law_monitor_service_key',
  'Service key used by the monitor-law-changes cron job'
);
```

Until that secret exists the job runs, logs a warning and returns — a missing
secret is a deliberate no-op, not a nightly error.

## Verifying it is running

One query, service-role (SQL editor):

```sql
select * from public.law_monitor_status();
```

| Column              | Healthy value                                        |
| ------------------- | ---------------------------------------------------- |
| `secret_configured` | `true`                                               |
| `job_scheduled`     | `true`                                               |
| `hours_since_check` | `< 48`                                               |
| `broken_pages`      | ideally `0`; a few is normal — governments move URLs |

`hours_since_check` is the number that matters. If it climbs past ~48, the
monitor is not running.

Recent activity:

```sql
select jurisdiction, law_name, event_type, detected_at
from public.law_updates order by detected_at desc limit 20;
```

Cron history (including failures):

```sql
select status, return_message, start_time
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'monitor-law-changes-daily')
order by start_time desc limit 10;
```

Trigger a sweep by hand:

```sql
select public.trigger_law_monitor();
```

## What the panel shows

The Knowledge panel reads `law_updates` through two filters, both in
`fetchRecentLawUpdates()`:

- **`event_type = 'change'` only.** `first_seen`, `redirect` and `broken` are
  records about _Dutiva's own monitoring_, not legal news. `broken` matters
  most: a sweep after the content-sanity guard produces a burst of them, and
  "a Dutiva scraper failed" is alarming and useless in a customer's panel.
- **Supported jurisdictions only** (ON/QC/FED, by the monitor's display names).

Both were added on 2026-07-31 after an audit of what the panel actually
rendered. Of the ten newest rows at that moment, **none** were from a supported
jurisdiction and **six were `redirect` notices** — "the Act has permanently
moved, old URL to new URL" — shown under the heading "Recent law changes",
directly beneath the block stating that Ontario and Québec are not monitored.

Monitoring stays wider than coverage on purpose; **the panel is what filters.**

## In-product freshness

The panel states its own currency rather than letting undated rows imply they
are current:

- every entry renders its `detected_at` date;
- if the newest entry is more than **7 days** old, the panel shows a warning
  telling the reader to check the official source (`updatesAreStale`,
  `GuidanceSourcesPanel.tsx`).

This is the backstop for the failure above: if scheduling breaks again, the
product says so on its own instead of going quiet.

## Deploy checklist

Per `AGENTS.md`, a merged migration is not an applied migration. After merging
changes here, confirm all four:

1. `0034_cron_locks.sql` applied — `select public.acquire_cron_lock('x','y',1);` returns `true`.
2. `0035_schedule_law_monitor.sql` applied — `job_scheduled` is `true`.
3. `monitor-law-changes` edge function deployed (deploying a function is separate from merging it).
4. `law_monitor_service_key` present in Vault — `secret_configured` is `true`.

## Source health — audit of 2026-07-30

After restoring the schedule, all 19 primary URLs were probed from Supabase
infrastructure (roughly the same network position as the edge function). The
result is materially worse than `law_page_hashes` reported, because the old
success test was "HTTP 200" and that test cannot see three of the four failure
modes below.

**`is_broken` said 5 of 19. The real number of pages returning usable
legislation was far lower.**

| Jurisdiction                     | Observed                                           | Why it matters                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ontario** (ESA, HRC, WSIA)     | HTTP 200, JavaScript app shell                     | **The worst case.** After tag-stripping, all three statutes reduce to the _same_ 422 characters of boilerplate with no statute text. The hash is stable, so an ESA amendment can never trigger a change — while a routine redeploy of ontario.ca would fire a false one. Ontario detection was structurally non-functional and reporting "no change" the whole time. |
| **Quebec** (LNT, Charter)        | HTTP 403, CloudFront                               | Datacenter IPs are blocked. Verified that User-Agent makes no difference — the honest bot UA, a `Mozilla/5.0 (compatible; …)` UA and a full browser UA all return the identical 919-byte block.                                                                                                                                                                      |
| **Nova Scotia**                  | **HTTP 200** + 244-byte F5 "Request Rejected" body | Served the WAF rejection _with a success status_, so it recorded as healthy.                                                                                                                                                                                                                                                                                         |
| **Yukon, Nunavut**               | HTTP 403, Cloudflare "Just a moment…"              | A JS challenge; no server-side fetch can solve it.                                                                                                                                                                                                                                                                                                                   |
| **Saskatchewan**                 | DNS failure — `qp.gov.sk.ca` no longer resolves    | Worse, the documented fallback (`publications.saskatchewan.ca` product 73330) resolves to **"Gazette Part II, June 5, 2015"** — the wrong document entirely, not the Employment Act.                                                                                                                                                                                 |
| **PEI / NL / Alberta**           | 404 / 500 / 400                                    | Ordinary URL rot.                                                                                                                                                                                                                                                                                                                                                    |
| **Manitoba, New Brunswick, NWT** | HTTP 200, real content                             | Genuinely working.                                                                                                                                                                                                                                                                                                                                                   |
| **Federal, BC**                  | Connection-level error from the probe client       | **Inconclusive.** `pg_net` is not the edge function's `fetch`, and both were succeeding as of 2026-06-08. Re-verify from a real sweep before drawing a conclusion.                                                                                                                                                                                                   |

Status codes and response bodies above are reliable; connection-level failures
are not, for the reason in the last row.

### What was done about it

The success test is no longer "HTTP 200". `contentSanity.ts` requires the
extracted text to be long enough to be a statute and free of block-page
signatures; anything else records as broken with a reason. This does not make
the blocked sources reachable — it makes their failure **visible** instead of
silent, which is the part that was dangerous.

Expect a burst of `broken` events on the first sweep after this ships. That is
the correction, not a regression.

### Official feeds — investigated 2026-07-30

Before spending anything on a proxy or a licence, we checked whether these
jurisdictions publish legislation in a form _meant_ to be consumed by software.
Scraping rendered HTML is the worst available option; an official feed is more
accurate, cheaper, and cannot be bot-blocked because consumption is the point.

**Federal: solved, and now shipped** — see "How change is detected" below. The Department of
Justice publishes every consolidated Act and regulation as XML at
[github.com/justicecanada/laws-lois-xml](https://github.com/justicecanada/laws-lois-xml),
bilingual (`eng/` and `fra/`), under the
[Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada),
mirrored on the Open Government Portal as a bulk dataset. Verified by direct
fetch:

| File               | Act                       | Last amended (in the document) |
| ------------------ | ------------------------- | ------------------------------ |
| `eng/acts/L-2.xml` | Canada Labour Code        | 2025-12-12                     |
| `eng/acts/H-6.xml` | Canadian Human Rights Act | 2024-08-19                     |

Three things make this strictly better than hashing HTML:

1. **No blocking.** `raw.githubusercontent.com` serves plain files — no WAF, no
   JS shell, no IP reputation check.
2. **The amendment date is _in the document_.** We can read "last amended"
   directly instead of inferring change from a hash diff, which removes both
   false positives (site redesigns) and false negatives entirely.
3. **Git history is amendment history.** The commit that touched `L-2.xml` _is_
   the amendment event, with a date and a diff of the actual legal text.

**Ontario: no official machine-readable feed found.** e-Laws publishes currency
dates and sitemap files, but no documented XML export, bulk download or API.
The site refused every client we tried, from two different networks. Absence of
evidence here is not proof — worth one direct question to Ontario's legislative
services before concluding it doesn't exist.

**Québec: no free feed found; a paid official one exists.** LégisQuébec refused
requests from both networks tried. The _Gazette officielle du Québec_ Part 2
(laws and regulations) publishes every Wednesday and is the official channel
for enacted legislation; Publications du Québec sells a subscription — reported
around $685/yr for Part 2, which should be confirmed directly rather than taken
from a search result. That is a legitimate, purchasable, official feed rather
than a way around a block.

### What still needs a decision

Federal is now answerable for free (above), so what remains is **Ontario and
Québec** — and these are not URL rot. They are sites refusing non-browser
clients outright, which no URL or User-Agent change fixes. The realistic
options each carry a trade-off worth a deliberate choice:

1. **Fetch through a residential/commercial proxy.** Works against IP blocks,
   but check each site's terms first — deliberately evading a block is a
   different posture from being politely refused.
2. **Licensed data source.** CanLII has an API with terms permitting
   programmatic use (their public web front end blocks bots — verified 403).
   Costs money; solves Ontario, Quebec, Nova Scotia and Yukon at once.
3. **Headless browser** for the JS-rendered and challenge-protected sites.
   Solves Ontario and possibly Cloudflare; heavier to run and to keep working.
4. **Narrow the promise.** Monitor only what is reliably reachable and say so.
   Cheapest and most honest, but Ontario and Quebec are two of the three
   supported jurisdictions, so it materially narrows what the feature claims.

**Superseded 2026-08-04, then built 2026-08-05 — see below.** This section
(2026-07-30) treated the proxy/licence/headless-browser/narrow-the-promise
choice as blocking. It no longer is: the sourcing evaluation right below
found real, free, official machine-readable sources for both, and the fetch
and change-detection code is now written (`ontarioApi.ts`, `quebecCkan.ts`).
Left in place as a record of what was ruled out and why a proxy or a licence
is no longer the live question.

## Sourcing evaluation for Ontario and Québec — 2026-08-04

**Headline: the "Ontario and Québec are unmonitorable" conclusion does not
survive contact with the sources.** Both jurisdictions have a machine-readable
official artifact that clears the same bar Federal already meets — a change in
it is evidence of an amendment, not merely evidence that a web server answered.
This section is the evaluation, including what was rejected and why, so the next
session does not re-probe any of it.

**Update 2026-08-05 — implemented.** The fetch and change-detection code
described below is now built: `MONITORED_PAGES` carries Ontario's three
statutes on the `ontario-api` source and Quebec's two on `quebec-ckan` (see
`supabase/functions/monitor-law-changes/ontarioApi.ts` and `quebecCkan.ts`).
**Still open:** the two health checks (`versions.length > 0`, polling
`currency-date`) are implemented as part of the per-fetch verdict but not as
independent liveness alarms; the Quebec side watches the dataset's "Lois"
resource at the whole-resource level, not yet the per-statute drill into the
zip's `Statutes_EN_Status.txt`; and — most importantly — **no live sweep has
run**, so `monitoringCoverage.ts` still correctly tells customers ON/QC are
not monitored. Don't flip that claim until a real scheduled run proves the
code against the live APIs, the same discipline OA2 already applies to
Federal.

Everything below was probed live, and every candidate was **fetched twice and
diffed** to rule out sources that churn on every request — the failure mode that
turns a monitor into a daily false-alarm generator.

### Ontario — the e-Laws act-versions API clears the bar

```text
https://www.ontario.ca/laws/api/v2/legislation/en/act-versions/statute/{id}
```

Byte-stable across six fetches including three cache-busted. Confirmed statute
ids: `00e41` (ESA 2000), `90o01` (OHSA), `90h19` (Human Rights Code), `05a11`
(AODA). Monitor a **normalized projection** — take
`aggregations.all.versions.hits.hits.hits[]._source`, drop the response envelope
(`took`, `_shards`, `timed_out`), sort deterministically, then hash. Alert on a
new object with `state=current`, or a change to the current `dateFrom`: that is a
coming-into-force event, which is what a compliance customer actually needs.

Corroborate with `2_public_statutes_e.csv`, diffing the Legislation History cell
per tracked statute. It is byte-stable and independent enough that agreement
between the two means something — it catches _enactment_ of an amending act,
which can precede coming into force, while the API catches the in-force event.

**Two health checks, both non-optional.** Assert `versions.length > 0` for every
tracked statute on every run — without it the monitor can go silently dead, and a
zero-version result must be treated as an outage, never as "no change". And poll
`/laws/api/v2/legislation/en/currency-date`, alarming if it fails to advance over
a plausible window; it cannot say what changed, but it says the upstream is alive.

**Rejected, with reasons:** the Ontario Gazette (rotating token, published weekly
regardless of amendments, prose); `data.ontario.ca` (zero resources — the
legislation entry is just a pointer); the statute HTML pages (SPA shell, which is
the original EF2 finding and remains correct); the annotations ZIP (12 MB of
binary `.doc` at whole-archive granularity — keep only as a manual research aid).

### Québec — two sources clear the bar, and the premise was wrong twice over

First, the blocking premise. **LégisQuébec is reachable**; the refusal is a
CloudFront WAF rule keyed on `User-Agent`, not a policy of refusing automation.
The earlier "verified UA-independent" finding does not reproduce — a 403/200 split
was observed on identical URLs seconds apart.

Preferred source: **Données Québec's CKAN API**, a first-party machine-readable
legislative corpus that no previous pass on this item found.

```text
https://www.donneesquebec.ca/recherche/api/3/action/package_show?id=<lois-et-reglements-quebec>
```

~19.5 KB of JSON, byte-stable, no bot filter. Watch `resources[].last_modified`
and the dated resource filename (e.g. `20260720_lois.zip`). When either moves,
fetch the zip and read `Statutes_FR_Status.txt` / `Statutes_EN_Status.txt`, which
**name the exact statutes whose status changed**, with an ISO date and a `J`
(à jour) / `A` (abrogée) code — a named list of changed acts rather than a diff to
interpret. Per-section `date-eev` attributes in the XML localize a change to the
individual section. Release cadence looks roughly monthly with irregular interim
releases.

A cheaper leading signal, usable alongside it: a weekly **HEAD probe** of the
Gazette officielle Part 2 PDF, where a 404→200 transition means a new issue. The
signal is an HTTP status code, so there is no markup to churn and nothing to
parse. Issues land Tuesdays (observed 21 Jul, 28 Jul, 4 Aug 2026), so probe
Wednesday mornings.

> **Guardrail — do not hash the LégisQuébec document HTML.** The page embeds a
> request-date-derived `historique=YYYYMMDD` value hundreds of times; it was
> observed flipping from `20260803` to `20260804` with no amendment. Whole-page
> hashing guarantees a daily false alert, and the apparent stability of the plain
> URL is only CloudFront caching. If LégisQuébec is used at all, store the
> `integrity:Digest` and the "À jour au" date **per chapter** (N-1.1, S-2.1,
> C-27, A-3.001, P-39.1) rather than hashing a page.

**Rejected, with reasons:** the Tableau des modifications (frozen since 2020);
the entrées-en-vigueur and non-en-vigueur tables (frozen since 2008 and 2016);
any RSS feed (none exists for this purpose).

## Known gaps

- **Nobody is told.** Events land in `law_updates` and wait to be read. There is
  no email or in-app notification when a change lands in ON/QC/FED. Groundwork,
  the CASL analysis and the open decisions are in
  [docs/LAW_CHANGE_NOTIFICATIONS.md](LAW_CHANGE_NOTIFICATIONS.md); the relevance
  filter it depends on is built and tested.
- **Detection is page-level.** A hash change says _something_ on the page moved,
  not which section. `raw_diff` holds the first 2000 characters for triage.
- **Summaries are model-generated** and unreviewed. They orient a reader; they
  are not legal advice and must not be presented as authoritative.
- **Advisor coupling is flag-level, not content-level** (0071, 2026-08-08 —
  previously no coupling at all). A `change` event in Ontario, Québec or
  Federal trips a database trigger that stamps `source_changed_at` on every
  active corpus chunk in that jurisdiction: the chunk keeps retrieving, but
  its citation demotes to needs-review and the Advisor warns that a law
  behind a cited source changed. Granularity is deliberately the
  jurisdiction — the monitor knows _that_ a law changed, not which corpus
  topic the amendment touches, so it over-flags and errs safe. A human
  clears the flag on re-verification
  (`docs/advisor-corpus-review-pack-ontario.md`). The corpus _content_ still
  updates only through reviewed amendment tranches, never automatically.
