# AI usage strategy — where Dutiva uses an LLM, and where it deliberately does not

Dutiva is an **AI-assisted** HR-compliance platform, but "AI-assisted" is not the
same as "an LLM does everything". This document is the source of truth for a
single design principle:

> **Use a large language model only for open-ended natural language. Everything
> that can be a rule, a lookup, a template, or a search is a rule, a lookup, a
> template, or a search.**

Put differently: **the LLM proposes, deterministic code disposes.** A generative
model is the right tool for understanding and producing prose in an open
vocabulary. It is the _wrong_ tool for authoring a statutory clause, computing a
notice period, scoring a support ticket, or deciding whether a safety gate
fires — those must be exact, reproducible, testable, and auditable, which a
model is not.

This is not aspirational; it is how the code is already built. The sections
below map every AI touchpoint to its actual mechanism, cite the file that
implements it, and record _why_ the choice was made — so future features inherit
the same discipline instead of reaching for an LLM by reflex.

Read alongside: [`design-handoff-advisor-chat/AGENT.md`](design-handoff-advisor-chat/AGENT.md)
(how the Advisor communicates), the Engineering Roadmap prototype
(`design-handoff-advisor-chat/prototypes/Engineering Roadmap.dc.html`), the
public **AI & Technology Policy** / **AI Usage Disclosure**
(`src/features/marketing/legal/content/ai-technology.en.ts`,
`ai-usage-disclosure.en.ts`), and [`LOCAL_INFERENCE.md`](LOCAL_INFERENCE.md)
(undecided: on-device / LAN inference vs Gradient, including cost — not a
shipped path).

---

## 1. The map — every AI touchpoint

| Touchpoint                       | Mechanism                                                  |    LLM?    | Why (or why not)                                                                                                                  | Source of truth                                   |
| -------------------------------- | ---------------------------------------------------------- | :--------: | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Advisor chat**                 | Generative completion, server-side, model routed via DB    |  **Yes**   | Open-ended, bilingual, jurisdiction-aware HR dialogue — open vocabulary; nothing deterministic can answer it                      | `supabase/functions/advisor-chat/index.ts`        |
| **Memory fact extraction**       | Per-turn NL → structured facts, `Inferred` until confirmed |  **Yes**   | Messy prose → structure is the canonical LLM job; governance around it is deterministic                                           | Engineering Roadmap §5; `Advisor Memory.dc.html`  |
| **Support first-line (in-app)**  | Grounded short answer from Help Centre excerpts            | **Yes\***  | A convenience _on top of_ retrieval; heavily fenced (auth, metered usage §7, HUMAN_ONLY refusal, grounded-only) — not irreducible | `supabase/functions/support-firstline/index.ts`   |
| **Advisor routing / mode**       | Intent → mode + gates                                      | **Hybrid** | Model classifies; **gates, jurisdiction default, crisis intercept are enforced as a deterministic contract**                      | `AGENT.md` §2; Roadmap "Response contract"        |
| **Document generation**          | `{{merge}}` tokens + `ClauseGate` conditional clauses      |   **No**   | Legal docs must be exact, reproducible, versioned, auditable — never model-authored                                               | `src/features/app/documents/data/types.ts`        |
| **Legal-basis citations**        | Vetted rows, marked `Valid` / `Needs-review`               |   **No**   | Prevents hallucinated statutes; retrieval grounds, humans vet                                                                     | `AGENT.md` §9; `src/features/app/guidance/api.ts` |
| **Guidance retrieval (RAG)**     | Query over `guidance_sources` / `law_updates`              |   **No**   | Retrieval is search, not generation — it is the _reason_ the Advisor can avoid inventing law                                      | `src/features/app/guidance/api.ts`                |
| **Support triage / priority**    | `category + impact + urgency → priority`, capped at `high` |   **No**   | A policy decision, deterministically testable; `critical` is a human call                                                         | `src/features/support/triage.ts`                  |
| **Public first-line deflection** | Help-Centre lexical search only                            |   **No**   | Unauthenticated intake + generated compliance answer = cost/abuse/accuracy risk                                                   | `src/features/support/firstLineAssist.ts`         |
| **Notice / due-date math**       | Business-day + Ontario stat-holiday algorithms             |   **No**   | Arithmetic and calendars are solved; a model only adds error                                                                      | `src/features/support/triage.ts`                  |
| **Crisis resources**             | Maintained list, verbatim                                  |   **No**   | Safety-critical text (9-8-8) must be exact — never generated                                                                      | `AGENT.md` §8                                     |
| **Workspace search**             | Lexical match over `{en, fr}` fields                       |   **No**   | Bounded corpus; no model needed                                                                                                   | `src/features/app/search/searchCorpus.ts`         |

\* _"Yes\*" = uses the LLM but could be removed without losing a core capability._

---

## 2. The irreducible LLM core

These are the uses where **no better alternative exists** — remove the model and
the capability is gone.

### 2.1 The conversational Advisor

Employers type open-vocabulary questions ("do I have to pay out banked vacation
if I let someone go for cause after 7 years in Quebec?"). The set of possible
questions is unbounded, so no decision tree or keyword router can answer them.
The generative model is essential here and nowhere else at this level.

- Served **server-side only** so provider secrets never reach the browser.
- Model is **not hard-coded** — resolved at request time from `ai_model_routes` /
  `ai_model_providers` (currently `deepseek-3.2` via DigitalOcean Gradient AI,
  `route_key = advisor_chat`), so provider/model can change without a deploy.
- Every call is logged to `ai_telemetry_events` (provider, model, tokens,
  latency, status) — never message bodies or PII. The row is claimed _before_
  the model call and stamped when it resolves, so it doubles as the beta usage
  guardrail's ledger (§7).

### 2.2 Natural-language → structured fact extraction (memory)

Turning "we let Marc go on the 5th, he'd been here about 7 years" into sourced,
structured facts is the textbook task an LLM does better than anything else. The
_extraction_ is generative; **everything around it is deterministic**: two states
only (`Confirmed` vs `Inferred`), inferred is never treated as fact until a human
confirms, every fact carries provenance + confidence + visibility + a retention
TTL, and forget/erase honour PIPEDA / Québec Law 25.

> **Memory feeds a turn; it never replays a decision.** `route`, `risk`, legal
> basis and `isCrisis` are recomputed **fresh every turn** — a past session's
> conclusion is never carried forward.

---

## 3. Deterministic by design — and why an LLM would be _worse_

Each of these could naïvely be "done with AI". Each is deliberately not, because
a model would make it less correct, not more.

- **Document generation.** Documents are assembled from ordered `PreviewBlock`s
  with `{{snake_case}}` merge tokens (`org`, `today`, `jurisdiction`, `statute`,
  plus wizard answers) and `ClauseGate` conditions (`juris`, `min_headcount`,
  `union`). A clause either renders or it does not, identically every time, and
  the output diffs cleanly across versions. An LLM free-authoring a termination
  clause would be unreproducible and unauditable — the opposite of what a legal
  document needs.
- **Citations & statutory grounding.** Legal basis is served from vetted rows
  marked `Valid` / `Needs-review`, never presented from the model's parametric
  memory. Statute _names_ already live in a structured table
  (`documents/data/meta.ts` → `JurisdictionInfo.statute`, e.g. _Employment
  Standards Act, 2000_). This is precisely the mechanism that stops the
  hallucinated-citation failure mode your own Known Limitations page warns about.
- **Triage & priority.** `suggestPriority()` is pure `category + impact +
urgency` arithmetic, clamped so customer input can never exceed `high`;
  `critical` is a human triage decision. No side effects, no `Date.now()` in the
  core — every branch is deterministically testable.
- **Calendars & deadlines.** Ontario statutory holidays (incl. Good Friday via
  the Gregorian computus) and business-day math are algorithms. A model here
  would only introduce error.
- **Public support deflection.** `firstLineAssist.ts` is retrieval-only _by
  design_ — the intake is unauthenticated, and a generated compliance "answer"
  there carries cost, abuse, and accuracy risk. The generative tier
  (`support-firstline`) lives strictly **behind auth + rate limits**.
- **Crisis resources.** Maintained from public sources and emitted verbatim.
  Safety-critical text is never model-generated.

---

## 4. The hybrid zone — LLM classifies, rules enforce

Advisor **routing** is the one place a model makes a consequential decision: it
classifies each turn into exactly one mode (HR compliance · high-risk escalation
· supportive triage · jurisdiction-unknown · current-info). That is acceptable
**only because the consequences are enforced deterministically as a contract**,
not left to the model's goodwill (`AdvisorResponse`, Roadmap §04):

- `route.workspaceAllowed`, `legalBasisAllowed`, `retrievalAllowed`,
  `webSearchAllowed` — a false gate **must not paint its section**; contract
  tests assert gate → UI.
- `jurisdiction.status` defaults to **unknown**; the Advisor **must not assume
  Ontario** and **withholds statutory figures until jurisdiction is confirmed**.
- `isCrisis` **intercepts everything**, shows maintained resources, gates all
  else off, and **cannot be overridden** by mode.

This is defense-in-depth. The risk is that all of it currently keys off a single
model classification. §5 closes that gap for the two highest-stakes routes.

---

## 5. The deterministic safety backstop

Goal: no single LLM misclassification can (a) drop the crisis intercept, or (b)
leak statutory figures before jurisdiction is confirmed. The pattern is a cheap,
auditable rule layer that runs around the model and can only ever _tighten_,
never loosen.

> **Status: implemented.** `src/features/app/advisor/safety/` — a pure,
> unit-tested module wired into `advisor/chatApi.ts`, which hardens the engine's
> validated `AdvisorResponse` before it reaches the Compliance Workspace. It is
> client-side **defense-in-depth**, not a replacement for the engine's own
> gating: the engine remains the primary control ("the client gates too").

### 5.1 Crisis intercept — pre-classifier, fail-safe-on

`detectCrisisSignal(userText)` (a maintained, bilingual phrase set in
`crisisSignals.ts`) is OR'd with the engine's `isCrisis` in `safetyBackstop.ts`.
The union wins; the model can escalate to crisis but can never clear a crisis the
rule detected.

```text
isCrisis_final = detectCrisisSignal(userText) OR engine.isCrisis
// if isCrisis_final → maintained resources only; every gate OFF (allowedSurfaces);
// A model that fails to flag crisis cannot suppress the intercept.
```

The phrase set is version-controlled and unit-tested, maintained like the crisis
resource list itself (never model-generated). It is scoped to **first-person**
distress so third-party workplace-violence reports stay in escalation mode, not
supportive/crisis. False positives are acceptable here (worst case: a support
resource is shown unnecessarily); false negatives are not.

### 5.2 Jurisdiction / statutory-figure gate — post-filter, fail-safe-closed

Three deterministic rules, independent of the model:

```text
// 1. Gate: citations withheld until jurisdiction is confirmed (safetyBackstop.ts).
if jurisdiction.status NOT in {known, assumed, not_applicable}
   AND mentionsStatutoryFigure(reply):        // weeks/months, days, $, %
       legalBasisAllowed = false; add verify-warning   // never "assume Ontario"

// 2. Ground: when the turn is an Ontario notice question, the ESA s.57
//    schedule is injected into the prompt as authoritative
//    (advisor-chat/noticeSchedule.ts, drift-tested against statutoryNotice.ts)
//    — the figure is looked up, not generated.

// 3. Verify: when tenure is stated and the schedule is encoded, a notice
//    figure the reply states is cross-checked against the table
//    (statutoryCrossCheck.ts). A mismatch withholds legal basis and warns
//    with both numbers. QC/FED bands are null → 'unverifiable', never a guess.
```

**Honest limitations.** Rules 1 and 3 inspect the model's _prose_, and a client
cannot un-say prose — they gate the structured legal-basis surface off and put
an accurate warning in front of the operator ("verify any figure in the reply"),
rather than rewriting the sentence; a figure the model states can still be
wrong when the tenure is unstated or the topic has no encoded table. Rule 2
grounds only what a table exists for: **Québec (LNT s.82) and Federal (CLC
Part III s.230) are intentionally `null` pending qualified legal review**
(`docs/notice-bands-review-pack.md`) — they fail safe to a hedge. Until
2026-08-08 rule 2's table existed but was wired only into the Document Studio,
not the chat path — the RAG review caught the gap and closed it.

### 5.3 Why this shape

- **Cheap & auditable** — phrase-set + regex + a table lookup, no extra model call.
- **Monotonic** — the backstop can only tighten (raise crisis, withhold a figure);
  it can never open a gate the contract closed. Proven by the pass-through test.
- **Testable** — every rule is a pure function with fixture-driven tests
  (`*.test.ts` beside each file), same discipline as `triage.ts`.

### 5.4 Observability

When a gate fires, `chatApi.ts` records it fire-and-forget via the
`advisor-safety-event` edge function — one `ai_telemetry_events` row per gated
turn with `operation = 'safety_backstop'` and the fired actions in `metadata`
(mirroring advisor-chat's telemetry shape). So "how often does the crisis
intercept or the figure gate actually catch something?" is a query, not a guess.
Telemetry is best-effort: a logging failure never blocks or breaks a reply.

---

## 6. The gate test — for every _new_ AI feature

Before adding an LLM to any feature, it must pass all five:

1. **Open-vocabulary?** Is the input genuinely open-ended natural language? If a
   fixed set of options or a lookup covers it, use those.
2. **Reproducibility.** Does the output need to be identical every time
   (documents, figures, deadlines)? If yes, it is deterministic, not generative.
3. **Grounding.** Are facts/citations retrieved and vetted, never recalled from
   the model? No authoritative statute or number may originate in the model.
4. **Fail-safe gate.** Is there a deterministic guard that fires on the safe side
   regardless of what the model returns (crisis, jurisdiction, human-only)?
5. **Auth + budget.** Is the call authenticated, rate-limited, and logged to
   `ai_telemetry_events` without PII or message bodies?

A feature that cannot answer "yes" to 2–5 should ship deterministic first and
add the model only where step 1 truly requires it.

---

## 7. Beta usage guardrails — the budget half of gate 5

During the beta **every product feature is open to every beta account** and no
plan is sold (`PAID_PLANS_DISABLED_DURING_BETA`, `src/config/plans.ts`;
sign-in opened to the beta list in migration 0026). That makes the AI API the
only surface where a signed-in user turns into a per-request bill, so it is the
only surface that is metered. Everything else in the product is free to use as
hard as you like — it costs the same either way.

**Mechanism.** Limits live in `supabase/functions/_shared/aiUsage.ts`;
enforcement is `claim_ai_usage()` in
`supabase/migrations/0027_ai_usage_guardrails.sql` — the same split as
`report-error` / `ingest_client_error_report`. Every metered call:

1. **Claims** before the model request — one advisory-locked transaction
   checks all four ceilings and inserts the turn's `ai_telemetry_events` row
   with `status = 'started'`. Check-and-reserve together, so a concurrent burst
   cannot race past the limit the way a plain `SELECT`-then-call can.
2. **Finalizes** after it — the same row is stamped with tokens, latency and
   outcome. One row per call, and the token ceiling reads the rows the claims
   created.

| Ceiling        | Default                                          | Scope                                        | Guards against                                         |
| -------------- | ------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------ |
| Burst          | 10 / 5 min (Advisor), 6 / 5 min (support helper) | per user, per surface                        | runaway retry loops, scripted hammering                |
| Daily requests | 120 / rolling 24h                                | per user, **shared across both AI surfaces** | one account's sustained cost                           |
| Daily tokens   | 250,000 / rolling 24h                            | per user, shared                             | long threads, which request count alone does not bound |
| Platform daily | 2,000 / rolling 24h                              | whole project                                | a beta-wide cost surprise, whatever its shape          |

Those four ceilings are **abuse rails**. They are never for sale. A 429 from
burst / daily / platform stays a wait, not a buy path.

A separate **commercial included** budget applies to Advisor `chat` only
(80 replies / calendar month UTC, same for every admitted account —
`src/config/advisorUsage.ts`). After that, prepaid packs (50 / $5 CAD,
200 / $15 CAD) and, for an active paid subscription that opted in, metered
overage ($0.12 CAD / reply, cap 500 / month). `support_firstline` stays on
abuse rails. Paying for a plan still buys support, not extra modules; packs
are an optional AI add-on.

Every value is env-overridable (`AI_DAILY_REQUEST_LIMIT`, `AI_BURST_LIMIT_CHAT`,
`AI_MONTHLY_CHAT_LIMIT`, …), so tuning is a secret change rather than a deploy. The daily
budget is deliberately **one budget per person, not one per surface** — both
functions bill to the same provider account, so per-surface budgets would just
sum. `safety_backstop` events are excluded from every count: being kept safe by
a deterministic gate is not usage and must never spend a user's budget.

**Design choices worth keeping.**

- **Fail closed.** A guardrail that cannot be evaluated (RPC error, DB blip)
  refuses the call rather than waving it through. An unmetered call is the one
  outcome the guardrail exists to prevent.
- **A claim is never refunded**, including on upstream failure. A client
  hammering a broken provider is exactly what the burst ceiling is for, and a
  refund path is a way to spend the budget for free. A claim that is never
  finalized (function timeout) keeps counting — the guardrail over-counts
  rather than leaking.
- **Denials are not stored**, only logged. A denial row would either count
  against someone who has already hit a limit or need excluding from every
  query, and under a hammering client it is unbounded write amplification.
- **A limit is not an outage, and the UI must not say it is.** The Advisor
  answers a 429 as an ordinary reply — when it frees up, and that the rest of
  Dutiva is unaffected — never the red error turn, whose Retry button would
  only earn a second refusal (`src/features/app/advisor/usageLimit.ts`). A
  platform-wide ceiling gets its own wording: the user did nothing to hit it.

**Prerequisite repair (0027).** The CHECK constraints on
`ai_telemetry_events` predated the functions writing to it and rejected
`operation IN ('support_firstline','safety_backstop')` and `status = 'error'`
outright. Consequences, all confirmed against the live project (which held rows
for `('chat','completed')` and nothing else):

- `support-firstline`'s per-user hourly rate limit counted `support_firstline`
  rows that could never be written — **it never fired**, and that endpoint was
  effectively unlimited.
- `advisor-safety-event` returned **500 on every call**, so §5.4's observability
  recorded nothing.
- Upstream failures in both functions went unlogged.

0027 widens both constraints, adds the `(user_id, operation, created_at)` index
the counts need, and the functions now write the canonical `failed` rather than
`error`.

---

## 8. Current LLM surface (summary)

| Route key               | Function            | Provider / model                          | Guardrails                                                                                                       |
| ----------------------- | ------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `advisor_chat`          | `advisor-chat`      | DigitalOcean Gradient AI · `deepseek-3.2` | Server-side secret, invite-only auth, history-bounded, telemetry-logged, **usage guardrails (§7)**               |
| `advisor_chat` (reused) | `support-firstline` | same route                                | Auth + **beta usage guardrails (§7, shared budget)**, HUMAN_ONLY refusal, grounded-only prompt, advisory-only UI |

Everything else in the product is retrieval, templates, rules, or algorithms.
That is the intended steady state: a small, well-fenced generative core, and a
large deterministic surround.

On-device or customer-LAN completion is **not** a current route. If that
changes, it is an owner decision recorded in
[`LOCAL_INFERENCE.md`](LOCAL_INFERENCE.md), not an implicit extra provider.
