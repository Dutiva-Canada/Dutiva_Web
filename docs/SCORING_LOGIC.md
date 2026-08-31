# Scoring logic — how Dutiva's scores and derived numbers are computed

This is the reference for the product's scoring systems: the compliance
score in both of its modes, the flow-assessment scoring, the Advisor's
risk and confidence figures, and the aggregation rules behind the
Analytics cards, with pointer-level coverage of the adjacent numeric
logic (§9). It exists so the reasoning is written down in one place
rather than reconstructed from the code each time.

Standing rule, same as everywhere in this repo: **where this document
disagrees with the code, the code wins** and this file gets corrected in
the same PR. Load-bearing public facts stay governed by
[CANONICAL_FACTS.md](CANONICAL_FACTS.md); this document explains
mechanisms, not marketing claims. Adversarially verified against the
code on 2026-08-07 (every §2–§7 claim checked by independent review
agents); formula v2 landed the same day, and v3 — plus the fixes that
review pass confirmed against v2 — on 2026-08-08.

## 1. The two data worlds

Every number below has to be read against which world it lives in:

- **Demo workspace** (the diorama every visitor and trial user sees):
  numbers are hand-authored fixtures in `src/data/`, transcribed from
  the design prototype. Where a demo view shows a derived figure (the
  Analytics cards), it is computed from those fixtures by the same pure
  aggregation functions production uses, against the fixed demo date —
  nothing is computed from live data, and nothing pretends to be.
- **Production workspace** (a signed-in organization on Supabase):
  numbers are computed live from the org's real rows through each
  module's `productionApi` boundary, with row-level security scoping
  everything to the organization.

The same views render both worlds; `workspaceMode` decides which
(production requires a signed-in, confirmed admin who stored that
preference — everyone else sees the demo). A number that is a constant
in the demo can therefore be genuine arithmetic in production — the
compliance score is exactly that case.

## 2. The compliance score

### 2.1 Demo mode — authored fixtures

The demo's headline `82/100` is a constant: `complianceScore` in
`src/data/compliance.ts`. Around it:

- The five **category scores** (Termination & notice 61 · Leave &
  accommodation 84 · Policies & documentation 72 · Language &
  jurisdiction 96 · Data & privacy 90) are fixtures with authored tones
  and open-item counts. They do not average to 82 and are not meant to —
  they exist so the diorama shows a healthy company with one visibly
  weak area.
- The six-month **score trend** in `src/data/analytics.ts` is
  74 → 76 → 79 → 78 → 81 → `complianceScore`: the trend's last point
  imports the constant, so Analytics and every other surface that shows
  the overall score (the Home compliance panel's 82/100 and the Advisor
  home tile) can never disagree. The Compliance view itself shows the
  category posture bars, not the overall number.
- The **per-jurisdiction scores** are authored so their
  headcount-weighted blend returns approximately the overall score, with
  Quebec deliberately sitting well below it — the weak jurisdiction a
  strong overall number would otherwise hide.
- The demo's "today" is fixed (`demoTodayISO`, derived from the July
  2026 calendar fixture) so every date-relative number in the diorama is
  stable and testable.

### 2.2 Production mode — formula v3

Production Analytics computes the score in
`src/features/app/views/analytics/AnalyticsProductionView.tsx` from pure
functions in `aggregation.ts` (unit-tested in `aggregation.test.ts`).
The formula is versioned — `SCORE_FORMULA_VERSION`, currently **3** —
and every snapshot row records the version that produced it (§8 has the
history).

1. Four **components**:
   - **Policies** — policies with status `up_to_date`, over all policies
     (`needs_review` and `missing` count against). Raw ratio.
   - **Tasks** — tasks completed, over all **provenanced, non-cancelled**
     tasks. Provenanced (`isProvenancedTask`) means the row carries a
     category other than the `'general'` default or an app-written
     `metadata.kind` linkage — i.e. the pipeline or a module created it.
     A hand-added to-do is real work but not compliance posture; it
     still counts in the Tasks view, the nav badge and the attention
     queue, just not in the score. Cancelled tasks leave the
     denominator — the same exclusion the backend's own overdue count
     applies.
   - **Findings** — compliance findings closed (status `resolved` or
     `dismissed`), over all findings, **weighted by severity**:
     info 1 · low 2 · medium 3 · high 5 · critical 8
     (`FINDING_SEVERITY_WEIGHTS`). The percentage is closed-weight over
     total-weight, so a critical exposure moves the score more than a
     note; the meter's "1 of 2" text stays a raw count.
   - **Obligations** — obligation-register rows with status `ok`
     (evidence on file), over all obligations (`hr_obligations`, §2.5).
     `in_progress` and `needs_evidence` count against; "overdue" is not
     a status but derived from the due date at read time.
2. Each component yields a rounded 0–100 percentage — `null` when it has
   no rows yet, so absence of data is never scored.
3. `blendScore` takes the **unweighted mean of the components that have
   data**, rounded. No component has rows → no score; the card shows an
   empty state instead of a number.
4. **The open-critical ceiling**: while the org has an open `critical`
   finding, the blend is capped at `CRITICAL_SCORE_CEILING` (**69**,
   below any healthy reading) — a strong average must not hide a
   critical exposure. The card prints why ("Capped at 69 while a
   critical finding is open…"); resolving or dismissing the finding
   lifts it. The cap never _raises_ a lower score — a blend already at
   or below 69 passes through unchanged, with no "capped" note.

Worked example: 3/4 policies current (75), 8 completed of 10 provenanced
non-cancelled tasks (80), findings medium-resolved + high-dismissed +
info-open = 8 of 9 weight closed (89), 2 of 3 obligations evidenced (67)
→ blend (75 + 80 + 89 + 67) / 4 = **78**. The ceiling, illustrated with
numbers where it actually engages: 4/4 policies (100), 9/10 tasks (90),
one open critical + five resolved low findings = 10 of 18 weight closed
(56) → blend 82 → **capped at 69** while the critical stays open. (An
open critical does not always trigger the cap — its weight already drags
the findings component, and if the blend lands at or under 69 on its
own, the ceiling has nothing to do.)

The breakdown meters under the hero figure flag the **lowest** component
(only once two or more components have data) — the same "a strong
average hides a weak factor" honesty rule the flow assessments and the
demo's jurisdiction breakdown apply.

### 2.3 History — snapshots

The score is a function of _current_ rows, so last quarter's score is
gone unless it was written down at the time. That is the reason
`public.compliance_score_snapshots` exists (migrations 0062/0063/0068):
one row per organization per month with the blended score, the
per-component breakdown (jsonb — done/total, plus weighted numbers for
findings), the active headcount, and `formula_version`.

History is written two ways:

- **Write-on-read** (0062): whenever production Analytics computes a
  live score, it attempts to upsert the current month's row — once per
  page view, fire-and-forget, a failed write never degrades the
  dashboard. Under RLS the write only succeeds when the viewer is an
  org owner/admin; non-admin visits leave history untouched.
- **The scheduled snapshot job** (0068/0069): `record-score-snapshots`,
  a pg_cron-scheduled edge function, upserts every org's current-month
  row with the service role using the same formula
  (`supabase/functions/record-score-snapshots/scoring.ts`, drift-tested
  against the app's copy). Two schedules share it: a daily run at 05:30
  UTC keeps the current month fresh, and a month-close run — three
  idempotent attempts at 00:05/00:25/00:45 UTC on the 1st (0070; pg_cron
  does not backfill a missed run, so one shot was one transient failure
  away from silently losing a close) — also freezes the month that just
  ended. The frozen value is the state within the first UTC hour after
  the month boundary (the boundary every monthISO in this system is
  defined by), so up to ~an hour of post-boundary skew is possible by
  design; if every attempt in that hour fails, the month stays at its
  last daily-run state, and `score_snapshot_status()` makes that visible
  (`orgs_with_closed_prev_month` vs the total). Outside that first hour
  the previous month is never touched, so a manual or late fire cannot
  rewrite frozen history. Every read — the job's and the app's list
  boundaries alike — is paginated (`fetchAllPages` /
  `src/lib/supabasePagination.ts`: PostgREST silently caps un-ranged
  selects at 1,000 rows, which would score a large org on a truncated
  slice and let a visit persist that wrong number over the job's correct
  one). Orgs with no scoreable rows are skipped, same as the view.
  Scheduling lives in the database for the same reason the law
  monitor's does: a hosting or repo move can't silently kill it. Check
  it in one query: `select * from public.score_snapshot_status();` —
  and note that pg_cron reporting a successful run only proves the HTTP
  request was queued; whether rows are actually landing is what the
  status query shows.

Past months freeze by construction. The trend chart shows the most
recent **6 monthly points** — frozen snapshots plus the live current
month (pre-0068 gap months mean these can span more than 6 calendar
months). The **delta chip** ("+8 vs February") is the current score
minus the oldest charted point; it needs at least two. When any charted
past month was frozen under an older formula, the card says so
("Earlier months were computed under a previous score formula") instead
of silently mixing formulas.

### 2.4 What v2 and v3 fixed, and what deliberately remains

Formula v2 (2026-08-07) closed four of v1's known gaps: findings are no
longer severity-blind, an open critical finding can no longer hide
inside a good average, cancelled tasks no longer count against the
score, and score history no longer depends on an admin remembering to
open Analytics. Formula v3 (2026-08-08) closed the two that were left:
the tasks component is scoped to provenanced rows, and the obligation
register exists in production as the fourth component. Still true, on
purpose:

- **Equal component weighting.** The four components blend as an
  unweighted mean — a workspace with 1 finding and 40 policies weighs
  that finding's component as a full quarter of the score. Absence of a
  component's data drops it from the blend rather than scoring it.
- **Obligation statuses score flat.** An overdue obligation counts
  against the component exactly like any other unevidenced one — it is
  surfaced through the attention queue and the derived overdue chip,
  not through extra score weight.
- **No judgment bands.** Production renders the score neutrally — no
  "good above X" coloring; the ceiling note and the lowest-component
  flag are the only judgments. The demo's tones are authored fixtures.

### 2.5 The production obligation register

`public.hr_obligations` (0069) tracks recurring statutory duties —
reviews, filings, training — each with an owner, area/statute,
jurisdiction, due date, recurrence and an evidence note, managed from
the production Compliance view alongside the findings register. Two
deliberate choices:

- **Status is evidence-centric** (`ok` · `in_progress` ·
  `needs_evidence`), and **"overdue" is not a status** — it is derived
  from `due_on` against today at read time, so it can never go stale by
  someone forgetting to flip a flag.
- Free-text area/jurisdiction, same reasoning as `hr_leaves.leave_type`:
  obligation taxonomies are jurisdiction-specific (the product's whole
  subject), and a wrong enum is worse than none.

Unevidenced obligations with a due date feed the Analytics attention
queue, exactly as the demo's register feeds its demo card.

## 3. Flow assessments

Guided flows can end in a scored result (e.g. the psychological-safety
assessment). Scoring is `scoreRun` in
`src/features/app/flows/flowEngine.ts`:

- Each rated question's chosen option carries a point value; the
  question's available maximum is its highest-valued option.
- The percent is total over **the maximum available on the path actually
  answered** — a flow that branches past some rated questions must not
  report a percentage the reader could never have reached, which would
  read as a failing grade for taking a different route.
- Zero is a real score (a completed run scoring nothing reports 0%, not
  an absence).
- Results land in **bands** authored per flow (psychological safety:
  ≥70% "largely established", ≥40% "real in places, informal in
  others", else "early — start with the obligations", whose body — not
  title — directs readers to the legally required pieces first), each
  with its own guidance and recommended templates.
- A **per-domain breakdown** aggregates questions sharing a domain and
  is rendered weakest-first — the single number says how you are doing,
  the breakdown says what to do.

## 4. Analytics aggregation rules

The pure computations live in
`src/features/app/views/analytics/aggregation.ts` — deliberately no
`Date.now()` anywhere; callers inject "today" (the demo passes the fixed
diorama date, production passes the real one), so the demo is stable and
every path is unit-testable. The card-level wiring — what feeds the
attention pool, the top-5 cap, the oldest-case alert threshold, the
turnover denominator — lives in `AnalyticsView.tsx` /
`AnalyticsProductionView.tsx`.

- **Needs attention** (`rankAttention`): sorted ascending by due date,
  which puts most overdue first, then soonest-due; ties break on id.
  Status: overdue (past due), due soon (≤14 days), upcoming. The card
  shows the top 5. In production the pool is open tasks and unresolved
  cases with due dates, dated obligations without evidence on file
  (v3), plus expiry escalations (expired certifications; documents
  expired or due within 30 days — an expiring work permit is a
  compliance event). The demo card feeds the same ranking from its own
  pool: dated compliance obligations and unresolved compliance items,
  plus the same expiry escalations.
- **Expiry buckets** (`expiryBuckets`): expired · ≤30 · 31–60 · 61–90
  days, soonest first; records more than 90 days out are excluded — the
  cards look one quarter ahead.
- **Case aging** (`caseAging`): open cases with days-open (clamped at
  0), oldest first; average rounded. The "oldest" tile alerts when the
  oldest case exceeds 14 days.
- **Turnover** (`turnoverRatePct`): rolling 12 months — terminations in
  the window over the average headcount in it, as a percentage to one
  decimal. The current window's denominator is the mean of the charted
  headcount series (snapshots plus the live current month), falling
  back to the live headcount when no history exists; the prior window
  averages all snapshot headcounts inside its 12 months. Returns `null`
  when the denominator is missing or zero: _no rate is better than a
  fictional one_.
- **Acknowledgment progress** (`ackProgress`): signed/total with
  clamping, rounded percent, 0 when the denominator is 0. In production
  the acknowledgments card is an honest empty state — no tracking data
  source exists yet, and the card says so instead of hiding.
- **Axis windowing** (`windowAxis`): trend axes window to the data
  instead of zero — pad the range, snap to clean ticks (5s for narrow
  ranges, 10s for wide), clamp to the scale (data 74–82 → axis 70–85).
  A score axis clamps at 100.
- A few thresholds live in the view only: probation endings within 0–30
  days (flagged with whether a review task exists), leave returns
  "imminent" within 0–14 days plus a bare fallback row for roster
  `on_leave` statuses with no leave record, headcount ranked by count
  then name.

All modules load once at page level through per-module loaders with
independent retry; each card declares its dependencies and renders its
own skeleton/empty/error states, so a failing module degrades only the
cards that depend on it, never the page. (One deliberate looseness: the
needs-attention card gates on tasks, cases and obligations — expiry
escalations drop out silently while the expiry-records module is
loading or failed.)

## 5. Advisor risk and confidence

The structured panel around every Advisor reply — risk, jurisdiction,
legal basis, confidence — is built by
`supabase/functions/advisor-chat/responsePayload.ts`, and it is
**entirely deterministic**: the builder never even reads the model's
prose. The model writes prose; rules decide consequences
([AI_USAGE_STRATEGY.md](AI_USAGE_STRATEGY.md) §4/§6 — which also owns
the crisis-intercept and gating mechanics; only the scoring-shaped
pieces are restated here).

- **Compliance risk** is keyword-classified from the user's message:
  high-exposure topics (termination, discipline, accommodation, and all
  escalation terms) → `high`; everyday entitlements (overtime,
  vacation, leave, pay…) → `medium`; otherwise `low`. English and
  French terms both match.
- **Escalation terms** (third-party safety/rights: harassment,
  violence, discrimination, retaliation/représailles, threat, weapon,
  assault, human-rights complaint, whistleblow, unsafe) force
  escalation mode and set safety risk to `watch`; a crisis signal sets
  it to `critical` and shuts every surface (both the server detector
  and the client's mirrored phrase list can raise it — the union wins).
  Escalation or high compliance risk recommends employment counsel; a
  crisis suggests the EAP instead.
- **Jurisdiction** is detected from explicit mentions (ON/QC/Federal
  patterns; bare two-letter codes are deliberately excluded — "on" is a
  common word, and a false jurisdiction read is worse than an unknown
  one). It defaults to `unknown` and is never assumed.
- **The legal-basis gate is fail-safe-closed**: citations render only
  when jurisdiction is confirmed AND curated corpus chunks actually
  grounded the turn. A citation is marked _valid_ only once its chunk
  is human-reviewed; machine-curated rows honestly read as "needs
  review".
- **Confidence is a formula, not a feeling**:
  `min(88, 20 + 30·(jurisdiction confirmed) + 10·min(chunks, 4))` —
  labeled High at ≥70, Moderate at ≥45, else Low. It tracks what
  grounded the answer (jurisdiction certainty, corpus coverage) and is
  capped at 88 so the product can never claim near-certainty. The
  chunks it counts are the top-k of the corpus retrieval (§9), which
  asks for 4 — retrieval depth and the confidence saturation point are
  one decision, not two.

## 6. Smaller scoring surfaces

- **Help-centre search** (`src/features/support/help/helpSearch.ts`):
  per-term field weights — title 3, summary 2, everything else
  (keywords, category label, body) 1 — with each term counting only its
  strongest field, summed across terms. `all` mode (the search box)
  disqualifies an article missing any term; `any` mode (first-line
  assist over whole-sentence questions) requires one match and ignores
  terms shorter than 3 characters. Ties keep the authored category
  order.
- **Wellbeing deliberately has no score.** Inferred per-person "support
  signals" with confidence levels are not persisted, because inferred
  health data about identifiable people is a liability, not a feature
  (`views/wellbeing/productionApi.ts`).

## 7. The through-line

Four principles show up in every system above; new numeric features
should hold to them.

1. **Deterministic and injectable.** Every screenshot-able number is
   computed by a pure function from injected inputs — no clock reads or
   randomness inside the math, no model-originated figures. This is
   what makes the demo stable and the logic unit-testable.
2. **Honest nulls.** Missing data yields `null` and an empty state that
   says so — never a fabricated number, never a hidden card. "No rate
   is better than a fictional one."
3. **The weak component is surfaced,** not averaged away: lowest score
   component flagged, weakest flow domain first, the weak jurisdiction
   made visible, the open-critical ceiling printed with its reason.
4. **The two worlds never blur.** Demo numbers are honest fixtures;
   production numbers are honest arithmetic; a fixture never leaks into
   a signed-in workspace.

## 8. Formula history

Recorded per row as `compliance_score_snapshots.formula_version`; the
app and the snapshot job both stamp `SCORE_FORMULA_VERSION`. A charted
window mixing versions is labeled in the UI. Changing the formula —
including the severity weights or the ceiling — means bumping the
version in **both** copies (`aggregation.ts` and the edge function's
`scoring.ts`; the drift test fails if they diverge).

- **v1** (0062, 2026-08): unweighted done/total for policies, all
  tasks, and findings; no ceiling; write-on-read history only.
- **v2** (0068, 2026-08-07): findings weighted by severity
  (1/2/3/5/8), closed = resolved or dismissed; cancelled tasks excluded
  from the denominator; open-critical ceiling of 69; daily scheduled
  snapshots; formula versioning itself.
- **v3** (0069, 2026-08-08): the obligation register as a fourth
  component (status `ok` over all rows); tasks scoped to provenanced
  rows (`isProvenancedTask` — category beyond the `'general'` default,
  or an app-written `metadata.kind`); the month-close snapshot run; the
  job's reads paginated.

Deploy-gap honesty: the app deploys from main immediately while
migrations are a manual owner step, so every scoring path degrades
rather than breaks in the gap — snapshot reads fall back to the legacy
column shape; a write rejected for the missing `formula_version` column
retries without it (the missing label self-heals when the job next
re-stamps the month); and a missing `hr_obligations` table (pre-0069)
reads as an empty register on both the app boundary and the snapshot
job, so the score blends three components instead of erroring the card
or failing the sweep. A stale pre-deploy browser tab can briefly write
an old-formula score onto a row the job stamped; the next daily run
overwrites it. Version labels are therefore trustworthy to within one
day, not to the minute.

## 9. Adjacent numeric logic — pointers

Derived numbers that live outside the scoring systems above, listed so
this document's scope line is honest. Each pointer names the owning
code; go there for the mechanism.

- **Advisor corpus retrieval** — which chunks ground a turn (and feed
  §5's confidence count): the `match_advisor_guidance` RPC, lexeme-quoted
  FTS over EN and FR columns, ranked by the greater of the two
  `ts_rank`s, top-k with k=4 requested (migrations 0023/0029/0058).
- **Statutory notice figures** — the one place the product states a
  statutory quantity: `statutoryNotice.ts` walks ascending Ontario ESA
  tenure bands (0 weeks under 3 months → 8-week maximum); Québec and
  Federal are deliberately `null` pending legal review, and `null`
  means "hedge and cite the source", never zero. Two detectors with
  opposite tuning gate model prose around it (`statutoryFigures.ts`,
  `safetyBackstop.ts`).
- **Support triage** — suggested priority by rank arithmetic (impact
  rank vs category floor, max wins, urgency +1 only when impact is
  non-zero, clamped at `high` — `critical` is a human decision), and
  response due dates counted in Ontario business days against a
  computed statutory-holiday calendar (`triage.ts`,
  `src/config/support.ts`).
- **Document studio** — applicability precedence (collective agreement
  > template size trigger > clause-level headcount gates > default)
  > with legal-facing thresholds at 25 and 50 headcount, flagged in code
  > as pending counsel verification; and the generate wizard's
  > fill-progress meter (`documents/engine.ts`, `documents/data/meta.ts`).
- **Billing** — annual price = 10 of 12 months billed; the yearly total
  is derived from the already-rounded per-month figure so the two
  displayed numbers always reconcile; plan gating is ordinal with
  unknown plans collapsing to `free` (`src/config/plans.ts`).
- **Beta cohort** — workspace membership is itself a ranking: first 15
  eligible signups by `created_at asc nulls first, id asc`; a declined
  row frees its seat; the signup endpoint never reveals list membership
  (migration 0067, `src/config/beta.ts`).
- **Operational ceilings** — AI usage budgets (per-user burst and
  rolling-24h request/token caps, platform-wide cap, fail-safe
  over-counting) and export velocity limits (server caps deliberately
  tighter than the client's) — `_shared/aiUsage.ts`,
  `_shared/exportGuard.ts`, migrations 0027/0049.
- **Law-monitor judgments** — updates stale after 7 days of silence, a
  source broken on its 3rd consecutive failed sweep, and a fetch counts
  only past content-sanity thresholds (`GuidanceSourcesPanel.tsx`,
  `monitor-law-changes/`; see [LAW_MONITORING.md](LAW_MONITORING.md)).

## 10. Keeping this document true

When scoring logic changes, the same PR updates this file — the
enforcement pattern is the same as CANONICAL_FACTS.md, minus the
automated check. The tests that pin the behaviors described here:
`aggregation.test.ts`, `AnalyticsView.test.tsx`,
`record-score-snapshots/scoring.test.ts` (the v2 drift test — the two
formula copies may not diverge), `flowEngine.test.ts`,
`FlowRunner.test.tsx`, `responsePayload.test.ts`, and for §6
`helpSearch.test.ts` and the wellbeing view/productionApi tests. If a
change passes those tests but contradicts this file, this file is
what's wrong.
