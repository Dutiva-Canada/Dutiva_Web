# Advisor corpus verification cycle — 2026-08-02 (BLOCKED, no chunk changes)

**Outcome: no statutory figure was authored, amended, or seeded in this cycle.**
Zero rows in `advisor_guidance_chunks` were inserted or updated. Zero figures in the
`docs/advisor-guidance-corpus-*.md` snapshots were changed.

This file is **not** a corpus snapshot. It is the record of a verification cycle that
was stopped on purpose, plus the engineering findings that came out of it. The
amendment tranche itself will land in a new dated
`docs/advisor-guidance-corpus-<YYYY-MM-DD>.md` once primary-source access exists,
leaving the 07-26 / 07-27 / 07-29 snapshots untouched as point-in-time records.

## Why it stopped

The corpus standard requires every figure to come from a direct fetch of an official
government page, fetched twice (once to author, once to verify independently). In this
sandbox **every** official source is refused at the egress proxy, so that standard
cannot be met for any work item.

Probed 2026-08-02 with `curl` (result is the CONNECT response, not an HTTP status from
the site):

| Host | Result |
| --- | --- |
| `www.canada.ca` | `curl: (56) CONNECT tunnel failed, response 403` |
| `www.ontario.ca` | `curl: (56) CONNECT tunnel failed, response 403` |
| `www.cnesst.gouv.qc.ca` | `curl: (56) CONNECT tunnel failed, response 403` |
| `www.legisquebec.gouv.qc.ca` | `curl: (56) CONNECT tunnel failed, response 403` |
| `www.chrc-ccdp.gc.ca` | `curl: (56) CONNECT tunnel failed, response 403` |
| `www.cdpdj.qc.ca` | `curl: (56) CONNECT tunnel failed, response 403` |
| `web.archive.org` (fallback) | `curl: (56) CONNECT tunnel failed, response 403` |
| `www.canlii.org` (fallback) | `curl: (56) CONNECT tunnel failed, response 403` |
| `example.com` (control) | `curl: (56) CONNECT tunnel failed, response 403` |
| `pypi.org` (infra allowlist) | OK |

The proxy status endpoint records these as
`connect_rejected — gateway answered 403 to CONNECT (policy denial or upstream failure)`.
The agent-proxy README classifies a 403/407 on CONNECT as an organization egress-policy
denial and directs that it be reported rather than retried or routed around.

This is the same condition that made the 2026-08-02 automated drift check
snippet-based. WebSearch remains available, but authoring from search snippets or
law-firm secondary sources is exactly the failure mode this cycle exists to correct, so
it was not used to produce any figure. **Shipping an unverified statutory figure into
legal guidance is a worse outcome than shipping nothing.**

To unblock: the environment's network-access policy must allowlist the domains below,
and a **new session** must be started — the egress policy is fixed when the environment
is created and does not change mid-session.

Required allowlist (note the French hosts — see "Authoring requirements" below):

```text
canada.ca            ontario.ca            cnesst.gouv.qc.ca
legisquebec.gouv.qc.ca   chrc-ccdp.gc.ca   cdpdj.qc.ca
```

## Correction: this corpus has no embeddings

The task brief for this cycle warned that `advisor_guidance_chunks` is queried by vector
similarity and that changing a chunk's text without regenerating its embedding causes
silent retrieval failure. **That premise does not hold for this table**, and acting on it
would have sent the next author looking for an embedding pipeline that does not exist.

Verified against the live database:

- The table has **no vector/embedding column** (`information_schema.columns` reports
  zero columns of type `vector`).
- `match_advisor_guidance(q text, k integer)` is **pure Postgres full-text search**. It
  builds an `english` tsquery and a `french` tsquery from the caller's raw question,
  matches rows where `fts @@ tq_en OR fts_fr @@ tq_fr`, and orders by
  `greatest(ts_rank(fts, tq_en), ts_rank(fts_fr, tq_fr))`. There is no vector operator
  anywhere in the definition.
- `fts` and `fts_fr` are **stored generated columns**:
  - `fts` = `to_tsvector('english', title || ' ' || content)`
  - `fts_fr` = `to_tsvector('french', coalesce(title_fr,'') || ' ' || coalesce(content_fr,''))`

Because both tsvectors are generated, Postgres recomputes them on every INSERT and
UPDATE. **There is nothing to regenerate by hand, and no stale-embedding risk.**

(The `vector` extension is installed in the project, but no column of the corpus table
uses it. Its presence is not evidence of a vector path for this table.)

## The real silent-failure mode: a missing French body

The risk the brief was reaching for is real, but it lives in a different column.

`fts_fr` is generated from `title_fr` / `content_fr`, which are ordinary **nullable**
columns with no default and no trigger backfill. If a row is written with `content_fr`
left NULL, `fts_fr` evaluates to an effectively empty tsvector, the row can never match
the French branch of `match_advisor_guidance`, and it **silently disappears from the
entire French retrieval path** while continuing to look healthy on English queries.

This is easy to walk into, because the house style described in the older snapshots —
English prose carrying inline French terms in parentheses — was the pre-2029-migration
state. All 42 live rows now carry a full French body (`content_fr` is non-null for
42/42). Migration `0029_bilingual_guidance_retrieval.sql` added the columns; migration
`0032_french_corpus_backfill.sql` completed the backfill for the remaining 40 rows.

## Authoring requirements for any new or amended row

1. **English body** — authored from the live English official page, fetched twice
   (author + independent verify).
2. **French body** — `title_fr` and `content_fr` are **mandatory**, and per the standard
   set in migration 0029 and restated in 0032, must be *"authored from a LIVE FRENCH
   official source (ontario.ca /fr/, cnesst.gouv.qc.ca /fr/, canada.ca /fr/), not
   machine-translated from the English row."* This doubles the primary-source
   requirement: the French pages are a separate fetch and are blocked by the same egress
   policy.
3. **Do not hand-write `fts` / `fts_fr`** — they are generated columns and will be
   rejected or overwritten.
4. `review_status` stays `machine_curated`; only a human flips it to `reviewed`.
5. Record the effective/in-force date and the page's "Date modified" value where shown.

## Work items carried forward

Every figure below is **secondary-sourced and unverified**. It is recorded here as a
lead to investigate, never as a value to copy into a chunk.

### WI1 — Federal statutory leaves may be incomplete (primary)

Chunk: `[FED] Canada Labour Code statutory leaves (federally regulated employers)`
(`jurisdiction = 'FED'`, `topic = 'leaves'`, `retrieved_at = 2026-07-27`).
Source: `https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/leaves.html`

The figures the chunk currently states were reported accurate by the last check; the
concern is **omission**. To confirm from the official page:

- **Pregnancy Loss Leave** — reported by secondary sources as ~3 days extending to
  8 weeks for a stillbirth, within a 26-week window, in force 2025-12-12. Confirm
  existence, exact duration, which days (if any) are paid, the service threshold, the
  claim window, and the in-force date.
- **Leave for the Placement of a Child** — reported as up to 16 weeks via a 2026 Order
  in Council. Same fields to confirm. The requesting stakeholder expected at least one
  of these two figures to be wrong.
- Re-read the **whole page** for any other leave added or amended since 2026-07-27. The
  existing source note claims the page was last modified 2026-05-13 — treat that as a
  lower bound and capture the current "Date modified" value.

Any amendment must also update `content_fr` from the French page
(`.../fr/services/emplois/milieu-travail/normes-travail-federales/conges.html`).

### WI2 — CNESST URL-path inconsistency (link rot only, content confirmed accurate)

Two competing path forms for what appear to be the same CNESST pages:

- SHORT — `.../en/working-conditions/termination-employment/...`
- LONG — `.../en/working-conditions/work-schedule-and-termination-employment/termination-employment/...`

**Scope is narrower than "every CNESST citation."** Of the 12 CNESST-citing rows, only
4 are in the termination-employment family where the two forms compete; the other 8 sit
on unrelated CNESST paths (`/leave`, `/wage-and-pay`, `/procedures-and-forms`,
`/client-services`) and need no change. Two page identities are each cited under both
forms across the corpus:

| Page identity | Cited SHORT | Cited LONG |
| --- | --- | --- |
| `termination-layoff-dismissal-and-resignation` | yes (07-29) | yes (07-26) |
| `notice-termination-employment-and-indemnity` | yes (07-29) | yes (07-26) |

Row-level split in the live table: 3 rows LONG
(`individual notice of termination`, `no separate statutory severance pay`,
`standard work week / overtime / breaks`), 1 row SHORT (`Layoff (mise à pied) and recall
rules`).

Resolving this **requires following the live redirects** to see which form CNESST
serves canonically. It cannot be settled offline, and guessing would bake link rot into
the citations rather than remove it. Once determined, normalize the affected rows in
both the table and the snapshot docs, keeping doc and table in sync.

### WI3 — Ontario minimum wage, special categories (time-sensitive)

Chunk: `[ON] Ontario — General minimum wage rate and effective dates`. It correctly
carries the current $17.60 general rate and the announced $17.95 rate effective
2026-10-01, but gives special-category rates only for the Oct 2025 – Sep 2026 period, so
it goes stale on 2026-10-01.

To verify against ontario.ca and add if confirmed — reported as student $16.90,
homeworkers $19.70, guides $89.75 / $179.50 effective 2026-10-01.

While on that page, re-verify the whole minimum-wage cluster from primary sources, since
it is the highest-churn part of the corpus and this cycle's check was snippet-based:
ON $17.60 → $17.95 (Oct 1), federal $18.15 (Apr 1 2026), QC $16.60 general / $13.30
tipped (May 1 2026).

## Not done this cycle

- No retrieval smoke test through `match_advisor_guidance` was recorded. The smoke-test
  table at the end of the 2026-07-29 snapshot exists to demonstrate that *newly added or
  amended* chunks retrieve correctly; with no chunk changes there is nothing new to
  exercise, and re-running it against an unchanged corpus would only restate the
  2026-07-29 result.
- No `review_status` values were changed.
