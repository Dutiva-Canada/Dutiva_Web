# Devin prompt pack — every remaining item in TODO.md

Fourteen ready-to-paste prompts that between them cover every open item in
[TODO.md](TODO.md) that an autonomous coding agent can actually close, plus an
honest list of what it cannot.

**How to use this file.** One prompt is one Devin session is one PR. Paste the
[Standing brief](#standing-brief) and then the task prompt into the same
message — Devin sessions start cold and the brief carries the repo's
non-negotiables. Run Wave 1 prompts in any order or all at once; they touch
disjoint files. Wave 2 prompts each open with a decision block that has to be
filled in before the session starts, because building them without the decision
means deciding them by accident.

**Precedence, as everywhere else here.**
[CANONICAL_FACTS.md](CANONICAL_FACTS.md) outranks this file and the code
outranks both. If a prompt describes a file's state and the file disagrees, the
file is right and the prompt is stale — tell Devin to say so rather than force
the described change.

---

## Coverage

Every ID in TODO.md, and where it goes.

| Item                                | Prompt                    | Note                                       |
| ----------------------------------- | ------------------------- | ------------------------------------------ |
| L1, L2, L3, L4                      | **DP-1**                  | Time-sensitive — L3 goes stale 2026-10-01  |
| EF2, OA2 (build half)               | **DP-2**                  |                                            |
| L8                                  | **closed**                | Founder 2026-08-23; DP-3 retired           |
| L6, L7                              | **DP-4**                  | Research pack only; a human flips the code |
| EF6a                                | **DP-5**                  |                                            |
| EF4, EF5                            | **DP-6**                  |                                            |
| V1 (repo half), V2, V3              | **DP-7**                  |                                            |
| D4, D7, EF10                        | **DP-8**                  | Decision block                             |
| D1                                  | **DP-9**                  | Decision block — five questions            |
| EF3                                 | **DP-10**                 | Decision block — RLS posture               |
| EF8                                 | **DP-11**                 | Decision block — what a plan gates         |
| EF7                                 | **DP-12**                 | Decision block — author or drop five       |
| D3                                  | **DP-13**                 | Decision block — calendar vendor           |
| D2                                  | **DP-14**                 | Decision block — privacy model             |
| OA1, OA3–OA11                       | [Owner only](#owner-only) | Secret, dashboard, filing or vendor        |
| L5, L9, EF1, D5, D6, V1 (live half) | [Owner only](#owner-only) |                                            |
| EF6, EF6b, EF9                      | —                         | Already done; TODO keeps them as markers   |
| EF11                                | —                         | Built — Option A amount + leave-return shipped; numeric QC/FED deferred |

---

## Standing brief

Paste this above every task prompt.

```text
You are working in the Dutiva Web repository (dutiva.ca marketing site + the
AI-Advisor product workspace). React 19, TypeScript strict, Vite, Tailwind v4,
react-router v7, Supabase.

Read these before writing code, in this order: AGENTS.md, CONVENTIONS.md,
docs/README.md, and docs/CANONICAL_FACTS.md. They are short and they are
binding.

The rules that get violated most often, restated so you cannot miss them:

1. Dutiva is a compliance product. A wrong fact is a product defect, not a
   typo. docs/CANONICAL_FACTS.md is the source of record for every
   load-bearing number, capability claim and company detail. Where it
   disagrees with the code, the code wins and the file gets corrected in the
   same PR.
2. Never state a statutory figure in public editorial content — no notice-week
   tables, dollar thresholds or deadline counts anywhere under /guides or
   /blog. Name the statute, describe the shape of the rule, link the official
   text. See src/features/marketing/articles/articleModel.ts; enforced by
   articles.test.ts.
3. Do not upgrade a hedge into a claim. "Compliance-oriented" is not
   "compliant". "Monitored" is not "covered". Where the product states a
   limitation, the wording is deliberate.
4. Bilingual everything. Every user-facing string ships as an { en, fr } pair
   via Bi / defineMessages. French comes from the design handoff's own French
   content when it exists; otherwise mark it [FR self-authored] at the
   definition site. Never machine-translate over an existing prototype string.
5. Design tokens, not hex values. lucide-react icons only. No emoji anywhere
   in the app or its content.
6. Data fixtures live in src/data/ and are imported, never inlined into a
   component. Tests are colocated as *.test.ts(x) next to the unit.
7. The standing legal disclaimer ships via the shared Disclaimer component,
   never re-typed.

Quality gate: `npm run check` (typecheck + lint + vitest + migration filename
discipline + canonical facts) must pass before every commit. If you touch the
build graph, run `npm run build` too — it additionally runs prerender, SEO
validation, the eager-entry-graph budget and the service-worker generator, and
any of those can fail on a change that `npm run check` waves through.

What you cannot do, and must not fake:
- You cannot apply a migration or deploy an edge function. A migration merged
  is not a migration applied. Author the SQL, and state plainly in the PR body
  that it is unapplied and who has to apply it.
- You have no production secrets and should not go looking for any. If a task
  appears to need one, stop and say so.
- You cannot read the live Supabase project. Anything you believe about live
  data is a hypothesis; label it as one.

PR discipline, which this repo takes seriously: one prompt is one PR. Write a
body that explains what changed and why, and end it with a section that says
what you did NOT do — the open questions, the deferred halves, anything a
reviewer would otherwise assume was handled. Then update docs/TODO.md: delete
the entry you closed (do not strike it through), and add an entry for anything
you opened, in the same shape as its neighbours — what, why it is open, where
the authority lives, and which PR left it.

Open the PR as a draft. If you finish and the change is smaller than the task
described, say so in the PR rather than padding it.
```

---

## Wave 1 — ready now

No decision, no credential, no owner action in the way.

## DP-1 — Run the blocked corpus amendment tranche

**Closes L1, L2, L3, L4.** Do this one first: L3 has a dated expiry.

```text
The Advisor's grounding corpus (public.advisor_guidance_chunks, 42 rows) has
three verification work items that have been blocked since 2026-08-02 because
the session that raised them could not reach any official government host —
every one was refused at its egress proxy with a 403 on CONNECT. Read
docs/advisor-corpus-verification-2026-08-02.md end to end before starting; it
is the complete brief, including a correction you need (this table has no
embeddings — fts and fts_fr are stored generated columns, so there is nothing
to regenerate by hand).

First, confirm you can actually reach the primary sources. Fetch these and
report the result before doing anything else:
  www.canada.ca, www.ontario.ca, www.cnesst.gouv.qc.ca,
  www.legisquebec.gouv.qc.ca
If any is refused, stop and report which. Do not fall back to CanLII, law-firm
commentary, search snippets or web.archive.org to produce a figure. Shipping an
unverified statutory figure into legal guidance is a worse outcome than
shipping nothing, and that judgement has already been made here once.

The corpus standard, which is not negotiable:
- Every figure comes from a direct fetch of the official page, fetched twice —
  once to author, once to verify independently.
- title_fr and content_fr are mandatory and must be authored from the LIVE
  FRENCH official page (ontario.ca /fr/, cnesst.gouv.qc.ca /fr/, canada.ca
  /fr/). Not translated from your English row. A row written with a null
  content_fr silently disappears from the entire French retrieval path while
  looking healthy on English queries.
- Never hand-write fts or fts_fr; they are generated.
- review_status stays 'machine_curated'. Only a human flips a row to
  'reviewed'.
- Record the in-force/effective date and the page's own "Date modified" value.

Work items, all three specified in full in the verification doc:

WI3 (do this first — it expires) — [ON] Ontario general minimum wage rate and
effective dates. The chunk carries the general rate correctly but gives
special-category rates only for the period ending 2026-09-30, so it goes stale
on 2026-10-01. Verify and add the post-2026-10-01 special-category rates from
ontario.ca. While on that page, re-verify the whole minimum-wage cluster from
primary sources — ON, federal, and QC general and tipped. It is the
highest-churn part of the corpus and the last check on it was snippet-based.

WI1 — [FED] Canada Labour Code statutory leaves. The concern is omission, not
error. Pregnancy Loss Leave and Leave for the Placement of a Child are both
reported by secondary sources and neither is in the chunk. Confirm existence,
exact duration, which days if any are paid, the service threshold, the claim
window and the in-force date, from the official page. Then re-read the whole
page for anything else added or amended since 2026-07-27.

WI2 — CNESST URL normalization. Two competing path forms cite the same two
CNESST pages across four rows (the short .../termination-employment/... form
and the long .../work-schedule-and-termination-employment/... form). Follow the
live redirects to see which form CNESST serves canonically, then normalize the
affected rows — 4 of the 12 CNESST-citing rows, not all of them; the other 8
sit on unrelated paths and must not be touched. Keep the snapshot docs and the
SQL in sync.

Deliverables:
1. A new dated snapshot at docs/advisor-guidance-corpus-<YYYY-MM-DD>.md, in the
   shape of the three existing ones. Do not edit the 07-26 / 07-27 / 07-29
   snapshots — they are point-in-time records.
2. One migration under supabase/migrations/ containing the inserts and updates,
   numbered after the highest existing file, with a header comment stating what
   it changes and that it is unapplied.
3. A per-figure citation table: figure, official URL fetched, both fetch times,
   the page's "Date modified", the in-force date.
4. If a figure cannot be confirmed from a primary source, leave the row alone
   and record it as still open. A partial tranche is a good outcome.

Then update docs/TODO.md: L1 closes if primary-source access worked; L2, L3, L4
close only for the work items you actually verified.
```

## DP-2 — Find monitorable sources for Ontario and Québec

**Closes EF2, and the build half of OA2.**

```text
Law-change monitoring covers Federal only. Ontario and Québec are unmonitorable
for a sourcing reason, not a code reason: Ontario's source loads statute text in
the browser, so a fetch returns a shell; Québec's refuses automated requests,
verified independent of user agent. Retrying either is not the fix — Federal was
solved by switching data sources entirely, to Justice Canada XML. These two need
the same treatment.

Read docs/LAW_MONITORING.md, then
src/features/app/knowledge/monitoringCoverage.ts and
supabase/functions/monitor-law-changes/. Migration
0036_retire_federal_html_sources.sql shows the shape of a source swap.

Task 1 — evaluate replacement sources, and write down what you found even for
the ones you reject. Candidates worth probing: Ontario's e-Laws XML/bulk
download and its "current consolidated law" endpoints; the Ontario Gazette;
LégisQuébec's own download/export surfaces and the Gazette officielle du
Québec; any official RSS/Atom or API either government publishes for
consolidated statute amendments. The bar is the one Federal already meets: a
machine-readable official artifact whose change is evidence of an amendment,
not a page whose HTTP 200 proves only that a web server answered.

Task 2 — implement whichever source clears the bar, following the Justice
Canada XML path as the pattern: the fetch, the change detection, the schedule
entry, and the coverage record in monitoringCoverage.ts. Test it the way the
federal source is tested.

Task 3 — OA2's build half. monitoringCoverage.ts currently states Federal as
'unverified' because no sweep has proven the Justice Canada source in
production. There is a test asserting the all-unconfirmed state, which is
supposed to fail the day someone flips it. Leave that flip to the owner — the
sweep needs a Vault secret you do not have — but make sure the code path and
the test comment say exactly what the owner has to change and where. If you can
prove the source works by fetching it yourself, put that evidence in the PR
body; it is what the owner will act on.

If neither jurisdiction clears the bar, that is a legitimate result. Say so,
record the sources you rejected and why in LAW_MONITORING.md, and leave
monitoringCoverage.ts telling customers the truth. Do not weaken the coverage
wording to make the gap smaller — that wording is load-bearing and appears on
the Knowledge panel signed out.
```

## DP-3 — ~~Verify the four unverified canonical facts~~ (closed)

**Closed L8 (2026-08-04 registries + founder 2026-08-23).** Incorporation and
trademark filing confirmed against Corporations Canada / CIPO. Business phone
1 (800) 349-0297 confirmed by the founder. CIPO pre-assessment objection on
application 2465617 addressed; the mark is still an application, not a
registration. See [CANONICAL_FACTS.md](CANONICAL_FACTS.md). Do not re-run this
prompt.

## DP-4 — Build the legal-review pack for QC and FED notice bands

**Closes L6 and L7 to the point a qualified reviewer can act.** Devin does not
flip the code here; that boundary is the item.

```text
src/features/app/advisor/safety/statutoryNotice.ts holds NOTICE_SCHEDULES, the
lookup table the Advisor and Document Studio read so that a notice figure comes
from a table rather than from a model's memory. Ontario is populated from ESA
s. 57. Québec (LNT s. 82) and Federal (CLC Part III s. 230) are bands: null,
pending qualified legal review. null means "hedge", never zero, and a test
asserts the product never reports "below the statutory floor" in those two
jurisdictions — which is the correct failure mode and also the reason this gap
is easy to forget about.

Do NOT populate bands for QC or FED. A qualified reviewer signs that off, not
an agent, and not the owner reading your summary. What you are building is the
pack that makes that review a one-hour job instead of a research project.

Deliverable 1 — docs/notice-bands-review-pack.md, containing for each of QC and
FED:
- The operative text of the section, quoted, in English and French, from the
  official consolidated statute (legisquebec.gouv.qc.ca for LNT;
  laws-lois.justice.gc.ca for the CLC). URL and fetch date for each.
- The proposed bands in exactly the NoticeBand shape the file already uses
  ({ minMonths, weeks }), derived from the quoted text, with the derivation
  shown step by step.
- Every carve-out and interaction the flat band table cannot express: who the
  section does not apply to, what displaces it, group-termination rules, pay in
  lieu, and anything the section defers to a regulation. This section matters
  more than the table. Ontario's table is safe because s. 57 is unambiguous;
  if QC or FED is not, saying so is the finding.
- A sign-off block: reviewer name, date, and an explicit yes/no per
  jurisdiction.

Deliverable 2 — L7, ESA s. 64 severance, which the Document Studio wizard flags
rather than computes. Eligibility turns on a payroll threshold the wizard does
not collect, and there is no reviewed severance schedule to read against. Write
the options up in the same doc, concretely enough to decide between: what field
would have to be collected and where it would sit in the wizard, what a
reviewed severance schedule would look like in the NOTICE_SCHEDULES shape, and
what stays true if the answer is "severance stays a flag" — which is a
defensible answer, not a failure.

Deliverable 3 — a code comment in statutoryNotice.ts pointing at the pack, so
the next person to open the file finds it. No behaviour change, no test change.
```

## DP-5 — Make the message-catalogue split possible with surface-scoped keys

**Closes EF6a.** The largest remaining engineering item, and the one with the
clearest spec.

```text
The i18n catalogue is one 232kB chunk, fully eager on every page including
marketing landings. Usage splits cleanly — of the 42 modules under
src/i18n/messages/, roughly 27 are read only by the workspace, 10 only by
marketing, 5 by both — and the provider seam already exists (ForcedLangProvider
is the public surface, LangProvider the app), so buildLangContextValue could
take the catalogue as an argument with no mutable registry anywhere.

The blocker is not chunking. It is that t() is called with computed keys, so
what a marketing page can reach is not a set anyone can enumerate. Three known
offenders: src/config/plans.ts types plan copy as MessageKey and points at
landing_* keys which the workspace's PlanGate resolves through t();
LegalHubPage and AboutPage resolve row.titleKey / value.bodyKey out of data
structures. And t() on a missing key throws rather than degrading, so a wrong
split is a runtime crash, not a blank string.

The suggested guard — "a test that every MessageKey resolves" — cannot be
written for a split catalogue, because the reachable set is the whole union by
construction. Do not write it.

The fix is to make the constraint a type. The shape already exists:
src/features/marketing/useLanding.ts exports LandingMessageKey =
keyof typeof landing and an lt() narrowed to it. Read that file first,
including its comment explaining why it is a convenience and not an isolation
boundary — that comment is the spec for this task.

Do this in order, and stop at any step where the type work stops being
mechanical:

1. Define surface-scoped key types (a marketing key union, a workspace key
   union, a shared union) derived from the module groupings, not hand-listed.
2. Push those types through every data structure that carries a key — plans.ts,
   the legal-hub rows, the about rows, and anything else the compiler surfaces.
   Where a structure legitimately spans surfaces, the shared union is the
   answer; where it spans by accident, moving the module into shared is the
   answer. Both are fine. Guessing is not.
3. Only once the compiler proves the boundary, change buildLangContextValue to
   take the catalogue as an argument and give the two providers their own
   catalogues.
4. Verify with the build's own budget: npm run build runs
   scripts/check-entry-graph.mjs, which reads chunk membership from the source
   maps. Report the before/after eager-graph bytes and preload count from that
   script's output, not from a guess. Add the message modules to what it bars
   by name, the way EF6b did for the three content modules.

This is a per-feature migration of call sites, not a chunking change, and it is
allowed to land as a type-only PR with no chunking if step 2 turns out to be
larger than one session. That outcome is worth more than a rushed split — say
so in the PR and leave EF6a open with the narrowed scope.
```

## DP-6 — Wire annual billing and fix the webhook's plan resolution

**Closes EF4 and EF5.**

```text
Two billing items, both currently invisible because
PAID_PLANS_DISABLED_DURING_BETA is true in src/config/plans.ts and nothing on
/pricing is purchasable. Both become blocking the day paid plans are
re-enabled, which is the reason to do them while they are cheap and untestable
in production either way. Read docs/BILLING_BETA_AUDIT.md § Remaining work and
§ Still open first.

EF4 — supabase/functions/create-checkout-session/index.ts knows only
STRIPE_PRICE_STARTER_MONTHLY, STRIPE_PRICE_GROWTH_MONTHLY and
STRIPE_PRICE_PRO_MONTHLY, and hardcodes metadata[billing_interval] to
'monthly'. src/config/plans.ts already has BillingPeriod = 'monthly' | 'annual'
plus annualPerMonth() and annualTotal() implementing the two-months-free
convention (charge 10 of 12). Wire the annual path end to end: the annual price
env vars per plan, the interval reaching the function, the interval reaching
Stripe's line item and the subscription metadata, and the client toggle — which
stays hidden while paid plans are disabled; do not un-hide it. Add the new env
var names to .env.example with the same commenting style as their monthly
siblings. Confirm the two-months-free convention still matches what plans.ts
computes, and if it does not, the code wins and the doc gets corrected.

EF5 — supabase/functions/stripe-webhook/billing-event.ts: inferCheckoutPrice()
reads session.line_items, which webhook payloads never carry. This is not an
active bug — this repo's own checkout always sets metadata.plan server-side, so
the fallback is what actually resolves the plan every time — and the audit
records it as short-of-intent rather than broken. The real fix is retrieving
the session with line_items expanded from inside the webhook, which is an extra
Stripe API call. Either implement that, or delete the dead branch and make the
metadata path the documented single source. Pick one and justify it in the PR;
leaving a branch that has never executed and never can is the thing to avoid.
Extend billing-event.test.ts either way.

Nothing here can be verified against live Stripe from your environment. Do not
claim otherwise. The PR body should list, precisely, which secrets and which
Stripe dashboard objects the owner must create before any of this executes —
that list is what makes OA11 actionable when the beta ends.
```

## DP-7 — Three hygiene items with dated evidence

**Closes V2, V3, and the repo half of V1.**

```text
Three small independent items. One PR is fine; they are all repo hygiene.

V2 — supabase/migrations/0021_drop_doclib_demo_schema.sql carries a
"STATUS: not yet applied" banner and an APPLY ORDER note, staged deliberately
for deploy-then-drop sequencing. The fixtures-only read layer it was waiting
for has long since shipped (src/features/app/documents/api.ts serves from
bundled fixtures). You cannot apply the migration. What you can do is establish
which of the two states is true and make the file say it: either it is still
genuinely staged and the banner needs a date and a reason that survives the
next reader, or the precondition is met and the banner should say "ready to
apply, precondition met on <commit>, awaiting owner". A stale banner is how the
last round of applied-or-not confusion started; leaving it ambiguous is the one
outcome to avoid.

V3 — PR #101, "Expand the grounding corpus; polish crisis-turn framing", was
closed without merging and with an empty description. Find out whether its
crisis-turn framing changes were superseded by later work or simply lost. Read
the PR's diff, then check whether each change is present on main today —
crisis-turn handling lives in the Advisor safety path. Write the answer into
docs/TODO.md as a resolved note either way. If something was lost and is still
worth having, do not silently re-apply it: describe it and open it as a new
TODO entry with its own scope. (For context, three other PRs were closed
unmerged and correctly so: #60 and #61 as duplicates of #59, and #86 as
review-only for commits already on main. Those need no investigation.)

V1 — scripts/check-migrations.mjs compares the repo against the live project
only when SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are set; without them
it enforces filename discipline alone. Migrations 0033 through 0041 are in the
repo and whether all are applied has never been verified in-session. You cannot
check the live project, and the script already prints "drift check skipped" when
it degrades, so the local half is fine. What is unverified is whether that line
survives where it matters: check .github/workflows/ci.yml, and if CI runs
without both variables, make the skip visible in the CI result rather than only
in a log nobody opens — a green required check that means "drift unchecked" is
the failure mode here. If CI does set them, say so and close the item. Either
way the live comparison itself remains an owner action.
```

---

## Wave 2 — decision first, then build

Each prompt opens with a decision block. Fill it in, delete the alternatives,
then hand the whole thing over. The recommendation is a starting point, not a
constraint.

## DP-8 — Three small changes that are decisions, not engineering

**Closes D4, D7, EF10.** Each is minutes of work behind a call only the owner
can make.

```text
DECISION BLOCK — fill in before starting.

(a) Training-crawler policy. scripts/prerender.mjs emits Disallow: / for GPTBot
    and ClaudeBot. This does not affect citation in ChatGPT or Claude search
    results — those crawlers are separate and already allowed — but it does
    keep Dutiva out of future foundation-model training corpora.
    DECISION: [ allow training crawlers / keep them disallowed ]
    Recommended: allow. The content is public marketing and editorial with no
    statutory figures in it by rule, and the asymmetry favours being in the
    corpus. Whichever you pick, the reason gets written down this time.

(b) /guides vs /blog positioning. ~~The current copy is one session's read of
    what the twelve articles already are. If a real publishing cadence is
    planned, a dated blog becomes viable and the strings should change.~~
    DECISION: no cadence — keep the current framing. Decided 2026-08-06.

(c) The raised "Ask" tab in src/features/app/shell/MobileNav.tsx renders a
    filled Star where the brief card elsewhere uses a sparkle. It was flagged
    rather than changed because the design handoff specifies a star and
    handoffs are the source of truth for pixels.
    DECISION: [ keep the star (handoff wins) / switch to Sparkles (match the
                brief card) ]

TASK. Implement the decisions above, one PR.

(a) is a change to the robots block in scripts/prerender.mjs plus the comment
above it explaining the choice, and an update to
docs/SEO_AUTHORITY_PLAYBOOK.md § Open items. Verify by running npm run build
and reading the generated robots.txt.

(b) if the answer is a dated blog: the strings are the cheapest thing in that
area to change, but the route metadata, the SEO route matrix
(docs/SEO_ROUTE_MATRIX.md) and the article model's date handling all have to
agree, and both languages have to change together. If the answer is to keep the
current framing, change nothing and close the item in docs/TODO.md with the
reason.

(c) is one icon import and one JSX element, plus whatever the handoff docs
under docs/design-handoff-*/ need so the next reader sees a settled decision
rather than a discrepancy.

Delete the closed entries from docs/TODO.md — D4, D7 and EF10 all go.
```

## DP-9 — Ship law-change notifications

**Closes D1.**

```text
DECISION BLOCK — five questions, all five needed before any code.
docs/LAW_CHANGE_NOTIFICATIONS.md § 4 is the brief; read it before answering.

1. Recipients: [ everyone / paid plans only / opt-in / internal-only pilot ]
   Recommended: internal-only pilot first. Nothing has ever sent, and the first
   outbound message from a compliance product is not the place to discover a
   jurisdiction-matching bug.
2. Cadence: [ immediate per change / weekly digest ]
3. Jurisdiction tiebreak, when profiles.province and
   organizations.default_jurisdiction disagree: [ profile wins / org wins /
   send both / suppress and ask ]
4. Human review before a model-written summary is PUSHED (as opposed to shown
   in a panel, where it already appears): [ required / not required ]
   Recommended: required. docs/AI_USAGE_STRATEGY.md's rule is that the LLM
   proposes and deterministic code disposes; pushing unreviewed model prose
   about a legal change to a customer inbox is the exact case that rule exists
   for.
5. Where the standing disclaimer sits on an outbound email: [ above the fold /
   in the footer / both ]

TASK. The groundwork is merged and nothing sends. Read
docs/LAW_CHANGE_NOTIFICATIONS.md, migration 0018_notification_delivery.sql, and
supabase/functions/support-notify/ — the last is the working example of an
email-sending function in this repo, including how it handles a missing
RESEND_API_KEY (it no-ops rather than failing, and rows sit pending rather than
dropping; do the same).

Build the delivery path implied by the five answers: recipient resolution
including the tiebreak, the schedule, the message template in both languages,
the review gate if question 4 says required, unsubscribe handling, and the
delivery-receipt path. Every user-facing string is an { en, fr } pair. The
standing disclaimer ships via the shared component's wording, not retyped.

It must be inert until an owner sets secrets and schedules the job — same shape
as everything else here. Say exactly which secrets and which pg_cron entry, in
the PR body and in the doc.

CASL is not optional in this jurisdiction and this is commercial-adjacent email
to Canadian recipients: consent is recorded at signup (migration
0037_beta_signups_consent_record). Read what it actually stores before deciding
who is mailable, and if the recorded consent does not cover this message type,
that is a finding to report, not a gap to route around.
```

## DP-10 — Build the export-events admin viewer

**Closes EF3.**

```text
DECISION BLOCK.

Migration 0033_export_audit.sql enables RLS on public.export_events with no
policies at all — deliberately, so it is service-role only and nothing
signed-in can read a row today. A viewer needs one of two postures, and this is
a decision about the audit table's security, not an implementation detail:
  [ A ] An admin select policy on the table, the shape 0011 already uses for
        guidance and law_updates.
  [ B ] An admin-gated edge function, table stays policy-free.
DECISION: [ A / B ]
Recommended: B. The audit trail's value is that it is hard to read casually,
and an edge function keeps the "no signed-in session can read this table"
property literally true while adding one audited door. A is less code.

TASK. Read docs/EXPORT_PROTECTION.md, particularly the runbook for tracing a
leak — the viewer exists to make that runbook doable without service-role
tooling, so build for that use, not for a generic table browser.

1. The viewer itself, admin-only, following the workspace-mode conventions in
   CONVENTIONS.md (admin means the is_admin_user() RPC and the real admin_users
   table, not a client-side flag). It needs to answer the runbook's questions:
   which user exported what, when, from which surface, and what the artifact's
   footer id maps to.
2. The access path per the decision above. If A, the migration is unapplied
   when you are done and the PR must say so.
3. Update EXPORT_PROTECTION.md's follow-ups section.

Two related follow-ups in that same section are deliberately NOT in scope, and
the PR should say why they are still open. The Advisor chat "Copy" button and
on-screen text are unwatermarked — that is by design, screen content is the
analog hole and watermarking starts at export. And downloads should move to
short-lived signed URLs if Supabase Storage ever holds real files, which it
does not yet.
```

## DP-11 — Gate the paid area by plan

**Closes EF8.**

```text
DECISION BLOCK.

/app is gated by invite, not by plan (src/features/app/auth/
RequireAdminSession.tsx, and the entry stage). The pricing page and the Stripe
plumbing are real but nothing anywhere reads a plan to decide access. This is
dormant while the beta is open to the invite list, and a prerequisite for
selling anything.

What does a plan actually gate? Fill this in per tier — free, starter, growth,
pro — before any code. The feature bullets in src/config/plans.ts are marketing
copy, not an entitlements model, and turning copy into enforcement by
inference is how a customer gets locked out of something they were sold.
  free:    [                                                    ]
  starter: [                                                    ]
  growth:  [                                                    ]
  pro:     [                                                    ]
Also decide: what happens to an existing beta user when gating turns on
[ grandfathered to <tier> / prompted to choose / unaffected while
PAID_PLANS_DISABLED_DURING_BETA is true ]
Recommended for the last one: unaffected while the flag is true. Build the
mechanism, keep it dark, and let re-enabling paid plans be the single switch.

TASK.
1. An entitlements model that is data, not conditionals scattered through
   views — one place that answers "may this org do X", read by the surfaces
   that need it.
2. Wire it to the real plan on the organization, whatever the billing tables
   already record; read them before minting a new column.
3. Gate the surfaces the decision block names, with a real upgrade path in
   both languages, not a dead end.
4. It stays inert while PAID_PLANS_DISABLED_DURING_BETA is true, and the tests
   cover both states.

Read the Workspace mode section of CONVENTIONS.md first. Access decisions here
interact with demo versus production mode, and demo must keep working for
everyone signed out — that is the marketing experience, and it is not a plan
that gates it.
```

## DP-12 — Retire the legacy document fixture

**Closes EF7.**

```text
DECISION BLOCK.

src/data/documents.ts still exists alongside the doclib catalogue and holds
five templates with no doclib equivalent. It is a live fallback, not dead
weight: DocStudioProvider and resolveDocTitle both try doclib by tid and fall
back to documentTemplatesByKey when there is no match, which is exactly what
keeps those five reachable. Deleting the file removes five templates from
Document Studio.

So the decision is per template, and it is a product call: author it into the
doclib catalogue, or drop it. Authoring means legal content in a compliance
product — per docs/FOUR_RING_FRAMEWORK.md that needs review budget, not just
engineering time. List the five (Devin: enumerate them in the session and
report back before proceeding if this block is blank) and mark each:
  [ author into doclib / drop ]

TASK. Whatever the decision, the end state is one source for one concept —
which is the shape of drift this repo corrects everywhere else.

For each template marked author: add it to the doclib catalogue in the
established shape, both languages, with the metadata the other entries carry.
The doclib headers say hand-maintained — generate-doclib.mjs does not run, per
PR #128 — so hand-author it and do not try to regenerate.

For each marked drop: remove it and check every reference, including chats,
employee files and followup replies, which key off the prototype EN titles.

Then remove the fallback path itself and delete src/data/documents.ts. Two
consumers were explicitly left out of the original unification and have to come
along now: PoliciesView.tsx and searchCorpus.ts. If either turns out to need
the legacy shape for a reason that is not just inertia, stop and report it
rather than forcing the deletion — a documented fallback beats a broken view.
```

## DP-13 — Build scheduled-call booking

**Closes D3.**

```text
DECISION BLOCK.

The intake forms already offer a scheduled call and support triage can move a
ticket to scheduled_call. The appointment itself is arranged by hand today.
Availability, invitations and reminders are unbuilt because the calendar choice
is upstream of the code.
CALENDAR: [ Google Calendar API / Cal.com / Calendly embed / Microsoft 365 /
            other: ________ ]
Recommended: Cal.com or a Calendly embed if the goal is to stop doing this by
hand this month; the Google Calendar API if bookings must live inside the
product's own data model and appear on the workspace calendar view. The second
is materially more work and needs OAuth consent handling.
WHO can be booked, and what availability window: [                          ]
REMINDERS: [ none / email at T-24h / email at T-24h and T-1h ]

TASK. Read docs/SUPPORT_ARCHITECTURE.md and the support triage path
(supabase/functions/support-agent-action/ and the scheduled_call status) before
starting — the ticket already carries the state, so this is completing a path,
not inventing one.

Build: availability display, booking, confirmation, and the reminder cadence
chosen above, in both languages. The booking has to write back to the ticket so
triage sees a booked call rather than a promised one. Reminders follow the
support-notify pattern: inert without secrets, rows pending rather than
dropped.

If the choice is an embed, the work is smaller and mostly integration — say so
and do not inflate it. Note in the PR what personal data the vendor receives,
since that is the question the privacy policy will have to answer next.
```

## DP-14 — Wire support analytics behind a stated privacy model

**Closes D2.**

```text
DECISION BLOCK — the privacy model comes first, and it is the whole item.

recordHelpfulness is the single seam a sink would hook. Nothing is transmitted
today. Before it transmits anything:
WHAT is collected: [ helpfulness vote only / vote + article id / vote +
                     article id + query text / other: ________ ]
SCOPE: [ anonymous / user-scoped ]
RETENTION: [ ____ days ]
Recommended: vote + article id, anonymous, 90 days. It answers "which help
content is failing" — the question the feature exists for — without creating a
record of what an individual employee was researching, which in an HR-
compliance product is a category of data worth not holding.

TASK. Read docs/SUPPORT_ARCHITECTURE.md § Staged first.

Implement the sink to exactly the decision above and no wider. Specifically: if
the decision says anonymous, there is no user id on the row and no join that
reconstructs one; if it says 90 days, the retention job ships in the same PR
rather than being noted as future work — docs/ERROR_REPORTING.md records what
happens when a retention job is left unscheduled (OA6), and repeating that
would be a choice, not an accident.

Then update the privacy policy content and docs/SUPPORT_ARCHITECTURE.md to
describe what is now collected, in both languages. A collection this small is
still a collection, and the policy is a public document that has to be true.
```

---

## Owner only

Nothing here can be delegated to a coding agent. Each needs a secret, a
dashboard, a filing, a human reviewer or a vendor. Grouped by what unblocks
them.

### One SQL statement or one dashboard visit

- **OA1** — set `law_monitor_service_key` in Vault. The nightly sweep currently
  finds no key, logs a warning and returns, so monitoring is a deliberate
  no-op. Blocks OA2 and DP-2's flip. [LAW_MONITORING.md § Setup](LAW_MONITORING.md).
- **OA7** — three Supabase Auth settings, especially switching the email
  template to `token_hash`. [AUTH_MAGIC_LINK.md](AUTH_MAGIC_LINK.md).
- **OA2** — after the first successful federal sweep, flip Federal from
  `unverified` to active; the test asserting the all-unconfirmed state fails and
  tells you where.

### Secrets, in sets that must be set together

- **OA3** — support email: verify a Resend domain, set `RESEND_API_KEY`,
  `SUPPORT_EMAIL_FROM`, `SUPPORT_NOTIFY_SECRET`, schedule `support-notify`, and
  set `RESEND_WEBHOOK_SECRET` at the same time or every delivery receipt 503s.
  Pending rows flush on enable. [SUPPORT_RUNBOOK.md](SUPPORT_RUNBOOK.md).
- **OA4** — CAPTCHA: `CAPTCHA_SECRET_KEY` and `VITE_CAPTCHA_SITE_KEY` together,
  then redeploy. The site key is compiled into the bundle, so rotating the
  secret alone breaks the public form.
- **OA5** — attachment scanning: `SUPPORT_ATTACHMENT_SCAN_URL`,
  `SUPPORT_ATTACHMENT_SCAN_KEY`, and the `attachment_scan_service_key` Vault
  secret. Until then every row stays `scan_status: pending`, which is honest —
  `pending` has never meant clean.
- **OA6** — confirm `ERROR_REPORT_SALT` (or the `SUPPORT_NOTIFY_SECRET`
  fallback) is set; `report-error` fails closed with a 500 if neither is. Also
  confirm the hourly `purge-client-error-data` job exists — the migration
  deliberately does not schedule it, so retention is unbounded until someone
  does. [ERROR_REPORTING.md](ERROR_REPORTING.md).
- **OA11** — the six Stripe secrets and the webhook subscription. Deferred, not
  urgent: paid plans are disabled so `create-checkout-session` failing closed is
  invisible. Becomes blocking the day plans re-enable — DP-6's PR will list
  exactly what to create. [BILLING_BETA_AUDIT.md](BILLING_BETA_AUDIT.md).

### Needs a credential this repo does not hold

- **OA10** — `npm run db:snapshot` needs the database password. Until
  `supabase/schema.sql` exists, a reviewer cannot see the real RLS policies or
  function bodies in a diff, because `supabase/migrations/` is a curated subset
  of a history predating this repo. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).
- **V1 (live half)** — set `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF`
  so `check:migrations` compares the repo against the project. Migrations
  0033–0041 are in the repo; whether all are applied is unverified.
- **EF1** — sign in as a beta user and take one real Advisor turn. Expect
  exactly one `ai_telemetry_events` row, `completed`, with a token count. A row
  stranded at `started` means the usage claim landed and finalize did not.

### Outside the repo entirely

- **OA8** — verify Search Console and Bing Webmaster Tools, set
  `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`, submit the sitemap,
  request indexing. Nothing in the SEO playbook is measurable until this
  happens.
- **OA9** — send the drafted DigitalOcean residency ticket
  ([do-residency-confirmation-request.md](do-residency-confirmation-request.md)).
  Five public legal documents state the Advisor's processing location as
  Toronto on the strength of a confirmation covering the _previous_ model; the
  production route moved to `deepseek-3.2` on 2026-07-26. Unblocks the PIPEDA
  wording in CANONICAL_FACTS § 2.
- **L5** — the corpus review gate. Every row is `machine_curated`; only a human
  flips a row to `reviewed`, and that gate has never been exercised once.
- **L9** — Drive template hygiene: T01, T02 and T04 went to `Legal Review` as
  `_polished` drafts in June 2026 and never came back to `ON/EN`; every HR-tree
  template exists twice from two uploads on 2026-06-16. Deferred deliberately
  because it means deleting files.
- **D5** — ~~which business plan is the plan of record.~~ Decided
  2026-08-06: the Beta Launch Brief (2026-07-20). Owner action: mark the
  other plan superseded in Drive and correct the privacy claim in the
  Brief (see CANONICAL_FACTS § Claims to stop making 1).
- **D6** — ~~whether a non-figure linkable asset is worth building.~~ Decided
  2026-08-06: built a jurisdiction-scoping questionnaire at
  `/tools/jurisdiction-check`. The **public** termination-notice calculator
  remains ruled out (publishing notice periods violates the editorial rule).
  Workspace entitlement calculators (EF11): Ontario notice (band or typed
  months), QC/FED hedge flows, severance eligibility + amount, ROE / layoff /
  leave-return trackers are built under `/app/workflows/`; numeric QC/FED
  ladders remain deferred on L6 in TODO.md.
