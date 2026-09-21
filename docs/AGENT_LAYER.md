# AGENT_LAYER.md — running business functions through AI agents

Status: **foundation + CRM, communications, tasks, governance, finance,
operations and documents wired end-to-end; engine-proposal ingest closed and
engine-side emission written.** Read together with
[AI_USAGE_STRATEGY.md](AI_USAGE_STRATEGY.md) (the LLM proposes, deterministic
code disposes), [LOCAL_INFERENCE.md](LOCAL_INFERENCE.md) (local models are a
direction, not a shipped capability), and [BRAND.md](BRAND.md) §3 (claim
guardrails).

## Thesis

The platform's BusinessTech surface — CRM, communications, revenue, tasks,
planning, governance, finance, security, operations, specialists, documents,
knowledge — is the product's own operating kit: the functions a business
needs are the functions it sells. The agent layer makes those functions
runnable by AI agents under the same rules a human operator follows, so
"run my business" and "what we sell" are the same surface.

This document is direction plus the shipped foundation — not a public claim
that end-to-end automation exists today.

## Architecture: propose → gate → confirm → execute

```
producer (parser today, Advisor engine / local model later)
        │  AgentToolProposal { toolId, summary, params }
        ▼
AgentActionCard — the human reads and confirms   (no confirm, no execution)
        ▼
executor.executeAgentProposal — the gate, in order:
        tool registered → params validate → role ≥ minRole
        → module context bound → tool.run(module seam) → audit
        ▼
module data seam (CRM: UseCrmDataReturn; comms/tasks: productionApi)
```

**The model never executes.** A proposal is data — `toolId`, a bilingual
human-readable summary, and params. The executor in
`src/features/app/agent/executor.ts` is the only path from proposal to
mutation, and it re-validates everything: registered tool, declared params
only (undeclared input is rejected, not ignored), role floor, mounted
module binding. Refusals are outcomes with bilingual reasons, not
exceptions.

## Risk tiers

| Tier     | Effect                                             | Interactive UX                         | Examples (CRM)                                                  |
| -------- | -------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `read`   | Returns org data, no mutation                      | "Run" button                           | `crm.search_contacts`, `crm.pipeline`, `crm.upcoming_followups` |
| `draft`  | Produces a reviewable artifact, commits nothing    | "Confirm"                              | reserved — comms drafts, staged records                         |
| `commit` | Mutates module state through the module's own seam | "Confirm" + "Writes to workspace" chip | `crm.add_contact`, `crm.log_activity`, `crm.move_deal_stage`    |

There is no fourth tier. **What must not run is never defined as a tool** —
absence is the enforcement, so nothing downstream has to recognize or block
a forbidden call.

### Never-tools

- Sending external communications (the comms module records; tools may
  draft, never transmit).
- Statutory drafting or legal conclusions as authoritative output.
- Anything a module's own UI refuses to do — the tool seam inherits module
  limits, it does not widen them.
- Any action the Advisor's deterministic gates withhold for the turn
  (`actionsAllowed`, supportive mode, crisis intercept).

## Permissions: the agent is the user

`AgentToolExecution` carries `{ mode, role, organizationId }` — built from
`useWorkspaceMode()`, the same context every write surface reads.

- **Demo mode** — `role` is null; tools run as the simulated workspace
  owner so the demo can show the full loop.
- **Production mode** — `role` is the real `organization_members.role`;
  the executor enforces each tool's `minRole` (default: `viewer` for reads,
  `member` for commits) via `roleAtLeast`, the same predicate write
  surfaces use.
- **RLS stays the enforcement.** For Supabase-backed modules the tool calls
  the module's `productionApi` under the user's session, so row-level
  security applies exactly as it does to the UI. The client-side role check
  exists to refuse early and visibly, the same reason write buttons hide —
  not to replace RLS.

## Module context bindings

A tool's `run` receives the module's live data seam through
`bindModuleContext(module, ctx)` (`agent/runtime.ts`), registered by the
mounted workspace — CRM binds its `UseCrmDataReturn` in `CrmWorkspace`;
communications and tasks each bind a normalized context
(`{list, add?, markSent?}` / `{list, create?, setDone?}`) from their demo
and production views — demo bindings omit the write fixtures can't accept.
Governance binds inside `GovernanceDataProvider`, finance inside
`FinanceDataProvider`, operations inside `OperationsDataProvider` — one
site each covers both modes; finance commits additionally check the
context's own `canWrite` flag (its mutators are production-only), so the
demo fails honestly rather than writing nothing. Documents binds **two**
sites on one normalized seam: `DoclibProvider` in demo (fixture reads +
the provider's simulated `sendForSignature`; no `approve` — the demo has
no approve mutator, so the tool fails honestly) and
`RepositoryProductionView` in production (reads off the loaded
`hr_generated_documents` rows, commits through `productionApi` /
`signatureApi` — real envelopes: external signing invites go out).
Bindings unbind on unmount: a proposal confirmed while the module isn't
open fails `module_unavailable` ("open this workspace first") rather than
writing into a stale snapshot. Modules whose `productionApi` is
call-stateless can register a standing binding when their tools land.

## Audit

Every execution attempt — success or refusal — appends an
`AgentAuditRecord` (`agent/audit.ts`): tool, tier, params, mode, role, org,
timestamps, outcome code. Two sinks: the in-memory list is authoritative
for the session, and production attempts also go to the `agent_audit`
table — org-scoped, `actor_id` stamped by the database from the JWT, and
append-only by policy (members insert their own rows, admins read, no
UPDATE/DELETE policies exist). Persist is best-effort: a failed insert
warns and the in-memory record stands — it never changes a tool outcome.
Demo attempts stay in-memory by design — fixture play has no real org to
scope to.

**Surface:** Settings → _Advisor activity_ renders the session's in-memory
list (newest 12, label-resolved through the registry — no raw tool ids in
chrome), with the honest footer that the durable workspace log is on the
roadmap. It's the same read-once pattern as the export trail and becomes
the `agent_audit` table's read view when a durable-read surface lands.

**Deployment:** `0157_agent_audit` is applied on `khtwpxnvziiyplaflwru`
(2026-09-19) — verified: 14 columns, RLS enabled, exactly
`agent_audit_insert` + `agent_audit_select` policies (append-only).
`npm run db:types` regenerated `database.types.ts`, so the persist insert
in `agent/audit.ts` is fully typed. `check:migrations` is green: 157/157.

## Wire contract

`advisor/contract.ts` carries the forward seam:

- `route.actionsAllowed` — optional gate, absent means withheld, crisis and
  supportive turns leave it off via `allowedSurfaces().actions`.
- `proposedActions[]` — `{ toolId, summary, params }`; validated like every
  other block, ids minted client-side on ingest.

**Ingest is live.** `agent/ingest.ts` maps a validated `AdvisorResponse`
into `AgentToolProposal`s — suppressed on crisis turns, in supportive mode,
whenever `actionsAllowed` is off or absent, and for any `toolId` the client
registry doesn't know — and `advisorProductionChat.ts` attaches them to the
turn it pushes. An engine that emits `proposedActions` today lands as
confirm cards; nothing executes until the user confirms.

**Emission is deployed.** `advisor-chat/agentPropose.ts`
runs a second, isolated completion call that extracts workspace actions —
the chat reply is never asked for structured output, so a malformed
proposal can't leak into the answer. A verb/noun heuristic (`looksActionable`)
gates the extra call so plain questions cost nothing. `agentCatalog.ts`
mirrors the client registry (a vitest parity test fails on drift), and the
validator mirrors the executor: unknown toolIds dropped, undeclared params
stripped, missing/ill-typed required params drop the action, enums repaired
to their exact vocabulary. Proposals ride the **wire copy only** — the
persisted `last_advisor_response` never carries them, so a reopened
conversation can't resurface a stale confirm card. The whole path sits
behind `ADVISOR_AGENT_ACTIONS=true` and hr-mode, non-crisis turns.
**Deployed 2026-09-19** — `advisor-chat` v44 live on
`khtwpxnvziiyplaflwru` with `ADVISOR_AGENT_ACTIONS=true` set. Live
emission end-to-end still needs an authenticated app session to confirm —
the function rejects unauthenticated calls by design, so deploy +
flag-set is verified, not a full turn.

Alongside it, the deterministic rail proposer stays live: `agent/intent.ts`
tries each module's parser (operations → tasks → comms → crm → governance
→ finance → documents) over free-text rail messages — "create a task to
review the
policy", "log that we sent the RTO update", "mark the RTO letter as sent",
"record a decision to hire a fractional CFO", "mark invoice INV-0042 as
paid", "request approval to buy laptops for $3600", "add a vendor Groupe
Alimex", "mark the workstation shipment as delivered", "marque le projet
déménagement comme terminé", "approve the offer letter for Chen", "send
the contract to jane@northgate.ca for signature", plus the existing CRM
phrasing and FR equivalents. Ambiguity resolves by connector word and by
noun ownership:
"task **to** X" is a checklist task while "task **with** X" is a CRM
activity; "approve the **decision**" is governance while "approve the
**request**" is finance and "approve the **contract**" is documents; and
"mark the **project** as done" is operations —
it runs first because every one of its patterns requires a literal ops
noun, rescuing project-status phrasing from the tasks parser's generic
mark-done regex. Security also runs before tasks for the same reason —
"mark the **access review** as done" is a security completion, and its
patterns are all noun-guarded (incident, access review) so nothing else
is stolen. Documents runs last — its patterns are noun-guarded too,
so nothing else shadows them and they claim nothing else. The finance
parser refuses to
propose what it can't parameterize — no spend request without an amount,
no obligation without a `YYYY-MM-DD` due date — and the documents parser
won't propose a signature send without a recipient email.

## Provider neutrality and local models

`describeToolsForModel()` (`agent/registry.ts`) emits one descriptor per
tool — name, EN description, JSON-schema-shaped params, module, risk tier —
consumable by any function-calling convention or a constrained local model.
Nothing in the tool layer references a vendor. Local inference remains
undecided per LOCAL_INFERENCE.md; when decided, a local runtime proposes
through this contract unchanged.

## Interactive vs. unattended agents

This round ships the **interactive** path: the signed-in user's session,
the user's own role, a human confirm on every commit.

**Unattended** agents (scheduled jobs, "runs while I sleep") are a
different deployment shape and are not built: they need an explicit agent
identity distinct from the actor, delegated permission grants, a job queue,
an approval inbox for commit-tier work, durable audit rows, and retry
policy. The proposal/executor contract is designed so that executor can
share this same gate — `executeAgentProposal` does not assume a browser —
but none of that infrastructure exists yet.

## Module coverage

| Module                                                    | State                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRM                                                       | **Wired** — 3 reads + 3 commits, rail intent proposer, live binding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Tasks                                                     | **Wired** — `tasks.list`, `tasks.create`, `tasks.complete` through the checklist seam; demo binds list + done-toggle only (fixtures can't accept rows, so `create` reports the demo as read-only rather than writing an invisible row)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Communications                                            | **Wired** — `communications.list`, `communications.log`, `communications.mark_sent` through the register seam; demo binds list + mark-sent only. Records only — `mark_sent` stamps a record, nothing is ever delivered; there is no `send` tool because the module has no send path                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Governance                                                | **Wired** — `governance.records`, `governance.decisions`, `governance.officers` reads plus `governance.add_decision`, `governance.adopt_decision`, `governance.add_record` commits through `GovernanceDataProvider`'s mutators — the same calls the screens make, working in demo and production alike. A record entry is the register row, not the uploaded document — `document_id` stays a UI concern                                                                                                                                                                                                                                                                                                                                                                                                   |
| Finance                                                   | **Wired (weekly-ops slice)** — `finance.invoices`, `finance.spend_requests`, `finance.obligations` reads plus `finance.mark_invoice_paid`, `finance.add_spend_request`, `finance.approve_spend`, `finance.add_obligation` commits through `FinanceDataProvider`'s mutators. Deliberately absent: `add_invoice` (real subtotal/tax decomposition can't be honestly expressed as params), journals, pay runs, close periods, reconciliations, entity/bank/ledger admin — high-blast-radius or structural surfaces stay human. Mutators are production-only; demo commits report the read-only workspace                                                                                                                                                                                                      |
| Operations                                                | **Wired (run-the-business slice)** — `operations.projects`, `operations.vendors`, `operations.logistics` reads plus `operations.add_vendor`, `operations.deliver_shipment`, `operations.update_project` commits through `OperationsDataProvider`'s mutators — working in demo and production alike. Quality checks and the technology register stay read-only-to-humans for now; `deliver_shipment` records arrival — it doesn't book or track a carrier                                                                                                                                                                                                                                                                                                                                                   |
| Documents                                                 | **Wired (repository slice)** — `documents.list`, `documents.templates`, `documents.pending_signatures` reads plus `documents.approve`, `documents.send_for_signature` commits on a normalized row seam (demo binds the Doclib provider's simulated signing; production binds `productionApi`/`signatureApi` from the repository view). Both commits are `minRole: 'admin'` — they change a legal document's posture and, in production, email a real signing invite. Deliberately absent: `create`/generate (the answer set can't be honestly expressed as params — the wizard owns it), multi-recipient envelopes, `archive`, `void`, reminders, `applySignature` (the signer signs — an agent doing it defeats the audit trail), and any content/export read (document text stays out of the transcript) |
| Security                                                  | **Wired (trust-posture slice)** — `security.incidents`, `security.risks`, `security.vendor_reviews`, `security.access_reviews` reads plus `security.report_incident`, `security.resolve_incident`, `security.complete_access_review` commits through `SecurityDataProvider`'s mutators — working in demo and production alike. All three commits are `minRole: 'admin'` — a security register entry is a compliance record, not a sticky note. Deliberately absent: `remove*` (deleting a register row is destructive — humans own it), asset/vendor-review writes (structural admin, not the weekly path), risk-register writes (posture is deliberate strategy — the form owns likelihood/impact/mitigation detail), and incident assignment/remediation fields (rich detail stays in the form)          |
| Specialists, knowledge, comms-workspace, planning, people | Registered seams exist (`productionApi`); tools land in the dogfooding order — what the founder's own business needs weekly first                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Adding a module = `agentTools.ts` beside its data seam + `moduleLabel` and
param copy in `agent.ts` + a binding call in its workspace mount. The
registry, executor, card, contract, and audit are already generic.

## Honest current state

- Shipped: the registry, gate, card, audit, contract seam, **wire→turn
  ingest** (`agent/ingest.ts` → `applyRealChatResult`), and tools for CRM,
  tasks, communications, governance, finance, operations, documents and
  security —
  interactive path only
  (user session, human confirm on every commit). Audit is in-memory plus
  the durable `agent_audit` write path — **applied 2026-09-19**,
  append-only policies verified on the live project.
- Deployed, pending live confirmation: engine-side `proposedActions` —
  `advisor-chat` v44 is live with `ADVISOR_AGENT_ACTIONS=true`
  (2026-09-19). Emission through a real authenticated turn hasn't been
  observed yet — the code path is tested (extraction/validation/parity
  suites), the deploy is verified, the live turn is not.
- Not shipped: server-side/unattended execution; a durable-read audit
  surface (the table exists; nothing renders it yet); tools for the
  remaining modules; local inference.
- Marketing must not claim end-to-end agent operation. The honest phrasing
  pattern per BRAND.md §3: direction, not shipped fact.
