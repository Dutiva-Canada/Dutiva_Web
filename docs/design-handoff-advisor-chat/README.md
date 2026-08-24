# Handoff: Dutiva Advisor — chat experience

## Overview
This package covers the **Advisor chat** for Dutiva (Canadian HR-compliance platform): the province-aware compliance chat, its Compliance Workspace, the persistent Advisor Memory layer, and the communication contract that governs how the Advisor talks. It's the design-and-spec half of the feature the Engineering Roadmap turns into a shipped product.

Three prototypes, one behavior spec, one production roadmap, and annotated screenshots. A developer who wasn't in the design conversation should be able to build from this folder alone.

> **Status (2026-08-23): built, memory persisted in production.** The chat, Compliance Workspace, and Memory surfaces are implemented in this repository, with the engine running as the `advisor-chat` Supabase Edge Function. Demo mode still uses session fixtures; production mode persists facts, audit, and case narratives. This folder remains the design source of truth for layout, behavior, and the Advisor's communication contract (`AGENT.md` is still normative). See "Where this landed" for the code map and "Open gates" for what is still outstanding.

---

## About the design files — read this first
The files in `prototypes/` are **design references created in HTML** — prototypes that show intended look and behavior. **They are not production code to copy.** They fake the engine (canned scenario data, regex routing on demo strings, `setInterval` "streaming"); there is no real model, retrieval, or persistence behind them.

**The task was to recreate these designs in the Dutiva codebase, using its established patterns** — not to ship the HTML. That recreation is done. The handoff originally planned two separate repos (`Dutiva--Redesign-` for the app, an Express-based `dutiva-advisor-engine` for the engine); both halves landed in **this repository** instead:
- **Consuming app** — this repo's React app (React 19 + Vite + Tailwind v4). Owns the chat UI, the Compliance Workspace, thread state, the memory surfaces, and i18n.
- **Engine** — `supabase/functions/advisor-chat` (Supabase Edge Function). Owns the model route (DB-configured via `ai_model_routes` / `ai_model_providers` — see `docs/AI_USAGE_STRATEGY.md` for the current provider), retrieval over the curated `advisor_guidance_chunks` corpus, the deterministic workspace payload, usage metering, and telemetry. The app makes one call per turn through `src/features/app/advisor/chatApi.ts`; the roadmap's `POST /api/advisor/respond` contract survives as the `advisor_response` payload that call returns.

The UI binds to the design-system tokens (below); the behavior follows the response contract (`src/features/app/advisor/contract.ts`) and the rules in `AGENT.md`.

## Where this landed in the codebase
| Handoff piece | Implementation |
| --- | --- |
| Chat, thread list, home (`/app/advisor`) | `src/features/app/views/advisor/` — `AdvisorView`, `ChatPane`, `ThreadList`, `AdvisorHome` |
| Compliance Workspace | `src/features/app/views/advisor/ComplianceWorkspace.tsx` — renders the validated payload, gated on `route.*Allowed` |
| Chat primitives (bubbles, composer, streaming, chips) | `src/features/app/advisor/` — `ChatBubble`, `ChatComposer`, `StreamedText`, `TypingDots`, … plus `src/components/advisor/` (Markdown + charts) |
| Response contract (roadmap P0) | `src/features/app/advisor/contract.ts` (zod), built server-side by `supabase/functions/advisor-chat/responsePayload.ts` and validated against the client schema in its tests |
| Engine | `supabase/functions/advisor-chat/index.ts` — model-route lookup, corpus retrieval, turn persistence to `conversations`, telemetry, beta usage guardrails |
| `AGENT.md` safety rules | `src/features/app/advisor/safety/` — deterministic client-side backstop (crisis intercept, statutory-figure and jurisdiction gates) that can only tighten the engine's gates; events logged via the `advisor-safety-event` function |
| Advisor Memory (`/app/memory`, + people / cases / conversations) | **Demo:** `memoryStore.ts` (session). **Production:** `hr_advisor_memory_facts` + audit (`0086`), case narratives/timeline (`0087`), Confirm / Correct / Forget (+ bulk forget for a person), chat injection + auto-extract via `advisor-chat`, Compliance Workspace “Memory used” section. See `productionApi.ts` / `caseNarrativeApi.ts`. |
| Demonstrated modes (signed-out preview + demos) | `src/features/app/views/advisor/advisorScenarios.ts` — kept faithful to the prototype scenarios |
| Bilingual strings | `src/i18n/messages/advisorView.ts`, with `{ en, fr }` pairs enforced by the contract |

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interactions. Recreate the UI to match — but bind to the **Dutiva design system `.surface-app` tokens**, don't hardcode the hex values the prototypes inline (they're literal snapshots of those tokens; see Design Tokens for the mapping). The prototypes are the source of truth for *layout and behavior*; the design system is the source of truth for *values*.

---

## How to integrate cleanly (the "make it intuitive" part)
Priorities, in order:

1. **Bind to the design system, not to prototype hex.** Every literal in the prototypes maps to a `.surface-app` semantic token (`--navy`, `--gold-fg`, `--risk-*`, `--warn-*`, `--ok-*`, `--surface`, `--border`…). Wire components to those so theming, dark mode, and future palette changes flow through automatically. A prototype that says `#1f3a5f` means `var(--navy)`; `#a23b3b`/`#f8e9e7` means the `--risk-*` tier; etc.
2. **The engine owns the contract; the app just renders it.** The app must never compute risk, jurisdiction, or gating itself — it renders `conversationalResponse` in chat and the `workspace` payload in the panel, gated on `route.*Allowed`. Keep that boundary clean.
3. **Obey the gates, always.** Never render workspace / legal basis / retrieval / documents / web results when the matching `route.*Allowed` is false. Build a fresh turn context every time — never carry a prior turn's structured output forward.
4. **`AGENT.md` is the model's contract.** It's not documentation to skim — it's the normative spec the system prompt and routing layer must enforce, and it should be paired with an eval suite (see roadmap gaps). Treat its MUSTs as hard constraints.
5. **Bilingual from day one.** Every user-facing string is a `{ en, fr }` pair; don't retrofit i18n later.
6. **Accessibility & non-happy-path.** The prototypes show the happy path. You own: keyboard nav, focus states, ARIA on the composer/threads/workspace, and real loading / error / empty / offline states.

---

## Screens / views

### A. Advisor chat + Compliance Workspace (`prototypes/Advisor Response Experience.dc.html`)
Screenshots: `01`–`05`. Desktop layout is a four-column shell.

**Layout (desktop, ≥ 820px), left → right:**
- **App icon rail** — 64px fixed. Vertical flex, centered, `#eef1f8` bg, 1px right border `#d8dcea`, 14px vertical padding. Top: 32×32 navy tile (9px radius) with a gold monogram. Nav icons are 40×40, 9px radius; active = gold-fill bg + gold-fg icon. Badges: 14px pill top-right (gold, or risk-red for compliance count). Bottom: 30px round user avatar.
- **Thread list** — 240px fixed. `#f6f8fc` bg, 1px right border `#e6e9f2`, 12px/10px padding. "New conversation" button (navy fill, white, 8px radius). Search row (transparent, 1px border, ⌘K chip). Section eyebrows ("Pinned", "Today"): 11px, 600, uppercase, tracking .04em, `#565f78`. Thread rows: 7px/10px padding, 7px radius; active = gold-fill bg + gold-fg text.
- **Main column** — flex 1. 60px topbar (route title "Advisor" in Montserrat 18/700, "Canadian HR compliance" sub) + a signed-in/signed-out segmented control + EN/FR toggle + bell. Below: a centered jurisdiction pill, the scrolling message thread (max 740px), and a sticky composer with the persistent disclaimer under it.
- **Compliance Workspace** — 384px fixed right panel. `#f6f8fc` bg, 1px left border. Sticky header (shield icon + "Compliance workspace"). Renders the structured payload; each block is a 12px-radius white card with 1px `#e6e9f2` border.

**Message thread components:**
- **User bubble** — navy `#1f3a5f`, white text, radius `14px 14px 3px 14px`, max 72% width, right-aligned, 14.5px/1.55.
- **Advisor bubble** — 26px navy avatar tile + white bubble, 1px `#e6e9f2` border, radius `3px 14px 14px 14px`, 14.5px/1.6, `white-space:pre-wrap`. During generation: a 3-dot `pulseDot` "thinking" row, then char-by-char reveal with a `blinkCursor` caret.
- **Risk / info / support banner** — inline, tone-tinted (risk `#f8e9e7`/`#e7c7c3`/`#8a3030`; info gold; support `#eef4fa`/`#cddbe8`/`#1f3a5f`), icon + bold title + text.
- **Document chips** — file icon tile + name + gold "Generate" button (HR/escalation modes only).
- **Province prompt** — 4 chips (Ontario / Quebec / Federal / Other) shown when jurisdiction is unknown.
- **Follow-up chips** — pill row, 1px border, 12.5px/600.

**Workspace blocks (in order):** Response mode chip · Jurisdiction (status badge Known/Assumed/Unknown/N/A + value + note) · Risk read (two labeled bars: Compliance, Personal safety) · Professional review recommendation (tone-tinted) · Support-mode notice · Legal basis (statute rows, Valid / Needs-review badges) · Retrieved guidance (uppercase tags) · Live web sources (domain + authority-type badge; toggle) · Confidence (labeled bar + note) · Quality warnings · Route rendering gates (5 pill toggles: Workspace, Retrieval, Legal basis, Documents, Web search).

**The five demonstrated modes (screenshots):**
- `01` **Home** — greeting, compliance-digest metrics (tabular-nums), Daily brief callout, Priorities list with expandable "Why", composer, suggestion grid.
- `02` **HR compliance** (termination) — HR mode, jurisdiction Known/ESA 2000, high compliance-risk, counsel recommendation, document chips.
- `03` **High-risk escalation** (harassment) — escalation mode, risk banner, OHSA duties, counsel recommendation.
- `04` **Supportive triage** (burnout) — "Advisor chat only", N/A jurisdiction, **all structured gates off**, EAP suggestion, no disclaimer, 9‑8‑8 resource.
- `05` **Jurisdiction unknown** (notice period) — Unknown status, "Not established", Advisor asks for province first, legal basis / docs withheld, collect-jurisdiction chips.

### B. Advisor Memory (`prototypes/Advisor Memory.dc.html`)
Screenshots: `06`–`09`. Same rail; a 252px memory nav (Memory manager · People · Cases · Conversations) replaces the thread list. Four surfaces:
- `06` **Person** — profile header (56px navy initials tile, name in Montserrat, status chips, "Ask Advisor" + "Open case"), "What Advisor remembers" intro, memory grouped by category (Employment / Compensation / Current matter / Record / Note). Each row: confidence dot + statement + source line (icon · kind · detail) + learned/confirmed dates + visibility + Confirm (inferred only) / Correct / Forget actions + a Confirmed/Inferred badge. Right rail: Confidence legend, Who-can-see, Retention, Lawful basis.
- `07` **Case** — "Picking up where you left off" resume banner (what changed while away), Case memory summary, facts list, a Memory timeline with session nodes + dashed gaps, and a "What I know" rail (person facts / case facts / next steps) + the "memory ≠ this turn's analysis" note.
- `08` **Chat recall** — thread with a "Resumed from…" system pill, inline **memory highlights** (gold underline, hover shows source), a "Memory used in this answer" accordion, and the "What I know" rail. Shows recall is always sourced + correctable.
- `09` **Memory manager** — review banner (N inferred waiting), filter tabs (All / People / Cases / Conversations / Needs review with counts), search, governed memory rows, and a governance rail (Retention policy, Lawful basis & consent, Audit log, Export / Forget-everything).

**Memory model:** three scopes — `person:{id}`, `thread:{id}`, `case:{id}`. Two confidence states only — **Confirmed** (authoritative source) vs **Inferred** (Advisor-derived, never treated as fact until a human confirms). Every fact carries provenance (source + learned/last-confirmed dates) and a visibility scope (HR team / case + counsel / restricted). Memory supplies **facts only** — risk, legal basis, and citations are recomputed fresh every turn.

### C. Engineering Roadmap (`prototypes/Engineering Roadmap.dc.html`)
Screenshots: `10`–`11`. The printable production plan: system context, non-negotiable principles, phased delivery, per-workstream acceptance criteria, the response-contract quick reference, and the memory workstream. **This is the build plan — start here.**

---

## Interactions & behavior
- **Reply lifecycle:** idle → thinking (~600ms, 3-dot pulse) → streaming (char reveal, ~380–1400ms, blink caret) → done. Only render the workspace payload once `done`; show a routing skeleton (`shimmer`) while the engine runs.
- **Routing** (engine-side; demo triggers): terminate/dismiss → HR · harass/violence/complaint → escalation · accommodation/medical/leave → HR · overwhelmed/burnout → supportive · changed/latest/this year → current-info · no jurisdiction cue → jurisdiction-unknown (default).
- **Jurisdiction resolution:** province defaults to `null`; unknown → ask + withhold figures; on reply, mark Assumed and proceed.
- **Signed-in vs signed-out:** signed-out returns a scripted reply only and locks the workspace behind a "Preview mode" state.
- **Web search toggle** (current-info mode): off → bounded, safe answer + "verify at official source".
- **Memory actions:** Confirm (promotes inferred → confirmed, stamps date), Correct (inline edit), Forget (removes the memory; source untouched). All are first-class, audit-logged.
- **Responsive:** < 820px collapses rail + thread list into overlays; the workspace becomes a bottom sheet. Respect `prefers-reduced-motion` (disable all animation).

## State management
App-side: `signedIn`, active thread, `province`, `webOn`, composer drafts, appended turns, per-priority "why" open. Engine-side per turn: `route` (+ `*Allowed` gates) · `jurisdiction` (status + value) · `risk` (compliance, safety) · `professionalReview` · `workspace` payload · `webSearch` · `quality` (warnings, confidence) · `isCrisis`. Memory: a store keyed by scope, each fact `{ statement, confidence, source{type,detail}, learned, confirmed, visibility, sensitive }`. **Never** persist a turn's structured verdict as memory.

---

## Design tokens
The prototypes inline the **`.surface-app`** ramp. The live tokens are in `src/styles/surfaces.css` (light ramp plus a `[data-theme='dark']` ramp the prototypes don't show) — that file wins over the snapshot literals below, and the brand rows are enforced by `npm run check:facts` (`docs/CANONICAL_FACTS.md`). Map literals → semantic tokens; don't hardcode. Where the app has drifted from the snapshot, the token is authoritative — e.g. light `--gold-fg` resolves to `#7d600f` in the app, not the prototypes' `#8a6a12`/`#a87f2e`.

**Surfaces / borders:** page `#e7eaf2` · card/white `#ffffff` · rail `#eef1f8` · nav `#f6f8fc` · main `#f3f5fa` · inset `#eef1f8` · border `#d8dcea` · border-soft `#e6e9f2` · hairline `#f0f2f8`.
**Brand:** app navy `#1f3a5f` (→ `--navy`) · deep navy hero `#0d1b2a`/`#132437` · gold-on-navy text `#F2D9A8` · gold `#d4af37` · gold-fg `#8a6a12` / `#a87f2e` · gold-fill `rgba(212,175,55,.1)` · gold-border `rgba(212,175,55,.28)`.
**Text ramp:** `#0c1020` · `#424d66` · `#565f78` · `#636d82` · `#7d8596` · `#8b93a5`.
**Status tiers:** risk `#a23b3b`/`#8a3030` on `#f8e9e7` border `#e7c7c3` · warn `#8a5a22`/`#a87f2e` on `#fceedd` border `#e9cb99` · ok `#2f6a4f` on `#e7f1ec` border `#b7d9c7` · info/support `#1f3a5f`/`#2f5488` on `#eef4fa` border `#cddbe8`.
**Type:** Montserrat (600/700/800) — wordmark, route titles, display headings, eyebrows. Inter (400–800) — all UI/body. Route title 17–18px · h1 22–27px · body 13.5–14.5px · meta 11–12.5px · eyebrow 10.5–11px uppercase, tracking .04–.14em. Metrics use `tabular-nums`.
**Radius:** buttons/inputs 7–10px · cards 11–14px · rail icons 9px · pills 100px/999px.
**Shadow:** card `0 12px 40px rgba(20,28,45,.08)` · composer `0 10px 30px -14px rgba(27,36,48,.18)`.
**Motion:** house 160ms `cubic-bezier(.4,0,.2,1)` · `fadeInUp` .4s · `pulseDot` 1.1s · `blinkCursor` .9s · `slideInRight` .32s · `shimmer` 1.4s. All gated by `prefers-reduced-motion`.

## Assets
- **Icons:** lucide (`lucide-react`) throughout — the prototypes inline equivalent SVG paths so they survive re-renders; the app uses `lucide-react`. No emoji.
- **Brand mark:** the geometric maple-leaf tile + Montserrat "Duti**va**" wordmark — use the brand components (`LeafTile` and `Wordmark` in `src/features/marketing/Brand.tsx`; assets in `public/brand/`), never redraw. The prototypes use a placeholder monogram tile.
- **Fonts:** Montserrat + Inter (Google Fonts) — loaded by the preconnect + stylesheet links in the root `index.html`.

## Files
- `AGENT.md` — **normative communication spec for the Advisor** (identity, response modes, jurisdiction discipline, answer structure, hedging, escalation, disclaimer contract, supportive mode, citations, memory-in-answer, bilingual, hard don'ts). Pair with an eval suite.
- `prototypes/Advisor Response Experience.dc.html` — chat + Compliance Workspace reference.
- `prototypes/Advisor Memory.dc.html` — memory (person / case / chat / manager) reference.
- `prototypes/Engineering Roadmap.dc.html` — production plan, contract, workstreams, acceptance criteria. **Build from this.**
- `prototypes/support.js` — the prototype runtime (co-located so the `.dc.html` files open directly in a browser). Not part of the product; ignore when implementing.
- `screenshots/01`–`11` — annotated states referenced above.

## Open gates flagged in the handoff — status as of 2026-08-23
1. **Legal content validation** — **still open; highest risk.** The guidance corpus is real (`advisor_guidance_chunks`, snapshots in `docs/advisor-guidance-corpus-*.md`) but every row is `review_status: machine_curated`, pending counsel/SME sign-off (TODO.md L5). Until a human flips a row to `reviewed`, the engine honestly badges its legal basis "needs review" rather than "valid".
2. **Eval suite for safety-critical rules** — **partially closed.** The rules are now deterministic code with regression tests (`src/features/app/advisor/safety/` — crisis intercept incl. drift test, statutory-figure and jurisdiction gates; `responsePayload.test.ts` server-side). A labeled eval set grading model prose against `AGENT.md` is still open.
3. **FR parity** — **closed.** Real EN/FR i18n (`src/i18n/`), `{en,fr}` pairs enforced by the zod contract, French corpus bodies on all rows (TODO.md resolved ledger). Keep verifying both languages on every user-facing change (AGENTS.md).
4. **Privacy/governance enforcement** — **largely closed for eng.** Production Memory persists facts + durable audit (`0086`), case narratives/timeline (`0087`), Confirm / Correct / Forget (including bulk forget for a person), PIPEDA-style JSON export via `exportProtection`, retention copy on the manager rail, chat injection, and gold in-answer highlights when memory phrases appear in the reply. Demo Memory chat-recall and scenario s1 also show gold highlights. Still open: inference-provider residency confirmation (`docs/do-residency-confirmation-request.md`, TODO.md OA9) that blocks final PIPEDA wording.
5. **Machine-readable contract + non-happy-path** — **closed.** `src/features/app/advisor/contract.ts` (zod) is the formal contract, validated on both sides; error, engine-unavailable, malformed-payload (degrade to prose — never render an unvalidated workspace), and usage-limit (429 scopes) states are implemented in `chatApi.ts` / `useAdvisorEngine.ts`. Optional `memory` on the workspace payload surfaces facts used this turn.

> Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice.
