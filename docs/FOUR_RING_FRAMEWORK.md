# The four rings — scope, and what is actually built

**In-repo record of the Four-Ring Platform Framework.** Reconciled against
`CANONICAL_FACTS.md` and the code, August 2026.

Dutiva's product scope is organised as four rings. Until now the only
description of them lived in a Drive document,
`Dutiva_FourRing_Platform_Framework_v1.0.docx` (April 2026), and the only
mention in this repo was one line of `CANONICAL_FACTS.md` saying Rings 2–4
were roadmap. That is how a scope document drifts: the plan and the product
had no shared surface, so nobody could tell which tools existed.

This file is that surface. It carries the framework's structure forward and
records, tool by tool, what is built.

**Precedence.** `CANONICAL_FACTS.md` outranks this file, and the code outranks
both. Where this file and the April Drive document disagree, this one wins —
the corrections are listed at the end, and they are not small.

## The rings

| Ring | Pillar                            | The question it answers                     |
| ---- | --------------------------------- | ------------------------------------------- |
| 1    | HR Compliance Core                | What do I legally have to do?               |
| 2    | Workplace Wellness                | How do I support my employees properly?     |
| 3    | Internal Communications           | How do I communicate this to my team?       |
| 4    | Compensation & Financial Literacy | Am I paying fairly, and explaining it well? |

The rings are a sequencing and packaging device: each one is meant to make the
previous rings more useful. They are not tiers of a price list, and no plan in
`src/config/plans.ts` is scoped by ring today.

## What is built

**All four rings are complete.** Every tool the April framework listed now
exists, and this section is the record of where each one lives.

**Ring 1 — the document catalogue** (`catalogue.ts`), covering every tool the
April framework listed for it. The catalogue is 46 templates in total,
T01…T46 — nine of them Ring 3, two of them Ring 4. Plus the Advisor, the
compliance register, cases, employees, policies and tasks. This is the
product.

**Ring 2 — complete.** Six accommodation tools (Pillar B), four
leave-management tools (Pillar D), four mental health tools (Pillar A), and
four psychological safety tools (Pillar C): the self-check, the respectful
workplace policy, the bystander intervention guide and the wellness action
plan.

**Ring 3 — complete.** Nine templates (T35–T43) in the new Internal
communications category: layoff and restructuring, policy rollout, crisis
communications.

**Ring 4 — complete.** Two templates in the new Compensation category — the
total compensation summary (T45) and the salary review letter (T46) — and two
reference guides, `/app/knowledge/pay-statement` and
`/app/knowledge/retirement-savings`.

The `/app/communications`, `/app/compensation` and `/app/wellbeing` modules
are **not** Rings 3, 4 and 2 — they never were, and wiring them did not make
them so. They are now org-scoped registers on real persistence (migrations
0039–0041), no longer `gated(…)` prototypes on demo fixtures, but a module and
a ring share a name and nothing else. The rings are the templates, guides and
flows.

**Every ring has a module whose name matches it, and none of those modules is
the ring.** That was a nuisance when Ring 3 landed and it stays a trap now: the
next person to read "all four rings complete" beside a Compensation module will
be tempted to treat one as evidence for the other. The note on `MODULES` in
`src/features/marketing/sections/Modules.tsx` says the same thing at the place
the mistake would be made.

**Wiring the three modules is where the framework's honesty rules bit hardest**
— see "Wiring the prototype modules" below. Each production view is
deliberately narrower than the demo it replaced, because three of the demo's
features were capabilities the product does not have.

### Where the catalogue puts things

Categories are ordered as the employment lifecycle, not by when they were
added: hiring → changes → agreements → policies → discipline → accommodation
→ termination → wellbeing → compensation, with **internal communications**
last. Five of the ten are authored in-repo.

- **Accommodation** holds Ring 2 Pillar B and the Ring 1 document it produces.
- **Employment changes** exists because the framework's Ring 1 has an
  "Employment Changes" group that had no home in the handoff's five categories
  — part of why its two documents were never built.
- **Wellbeing** holds the wellness action plan, and is separate from
  accommodation because completing a plan implies neither a disability nor a
  request.
- **Compensation** is Ring 4, and the boundary against **changes** is that
  these documents report rather than vary. T26 stays in changes because
  confirming a new title or rate is a variation of the contract.
- **Internal communications** is Ring 3, and it is last because it does not
  sit at a point in the lifecycle at all: it cuts across every one of them.

## Ring 2, Pillar B — Accommodation

The highest legal exposure area, and the pillar the framework marks Critical.
It is also where Ring 1 had a hole: the framework listed an **Accommodation
Response** among Ring 1's tools and called it the document this whole process
produces, and it was not in the catalogue. It is now.

**Pillar B is complete**, and it was the first pillar of Rings 2–4 to be.

| Tool                            | Where                                   | State     |
| ------------------------------- | --------------------------------------- | --------- |
| Accommodation request form      | T21                                     | **Built** |
| Accommodation response (Ring 1) | T22                                     | **Built** |
| Accommodation plan              | T23                                     | **Built** |
| Undue hardship assessment       | T24                                     | **Built** |
| Duty to accommodate workflow    | `/app/workflows/duty-to-accommodate`    | **Built** |
| Functional limitations guide    | `/app/knowledge/functional-limitations` | **Built** |

Two ported legacy documents sit in the same category and complete the
workflow: **Accommodation documentation** (T19) and **Medical information
request letter** (T20), both in `customTemplates.ts`. They were filed under
`discipline`, which misstates what they are; they are now under
`accommodation` with the rest.

Read in process order the category is: request form (T21) → medical
information request (T20) → response (T22) → plan (T23) → record (T19), with
the undue hardship assessment (T24) as the internal worksheet behind a
refusal.

## The two surfaces

Pillar B's last two tools did not fit Document Studio, which renders a linear
question set into merge-field blocks. Finishing the pillar meant building the
surfaces they needed — and those surfaces are what unblocks most of what is
left across Rings 2–4, so they matter well beyond the pillar that prompted
them.

Neither had a design handoff. AGENTS.md says feature work here is driven by
high-fidelity handoffs, so both were designed against the existing system —
tokens, the chip and card patterns already in the app views, the shared
`Disclaimer` — rather than against a prototype. Treat them as the pattern for
the next tool of each shape.

### Guided flows — `src/features/app/flows/`

A flow is a graph of steps: `choice` steps branch, `task` steps instruct,
`outcome` steps end the run. Three shapes fall out of one structure — a
checklist is a chain of tasks, a decision tree is choices, a guided worksheet
mixes them — which is why there is one engine and not three.

- `flowModel.ts` — the content model.
- `flowEngine.ts` — pure: `advance` / `back` / `progress` / `flowRecord`, plus
  the graph checks (`unreachableSteps`, `longestPath`) the tests use.
- `FlowRunner.tsx` — the runner at `/app/workflows/:slug`, ungated.

Two decisions worth keeping. **Flows loop** — "check for funding, then re-test
hardship" is a real step, so the graph is not a tree and `longestPath` walks
with a visited set. **Every outcome hands off to a document, or says why it
does not**: a flow that ends in advice leaves nothing on the file, and the
file is what an employer is asked to produce. `flowEngine.test.ts` enforces
both, plus bilingual copy and reachability, for every shipped flow.

The second half of that rule was added in review on #127, and the exception is
narrow. Pillar A's flow has an ending whose entire content is "nothing changes,
and record nothing about their health" — leading it with a document prompt
asks for exactly the record it just said not to create, and the record in
question is a health record created for someone who requested nothing. So an
outcome may set `noDocument` instead, which renders where the handoff list
would be. It is **exclusive-or**: an outcome carrying both, or neither, fails
the test, so an author still cannot quietly skip the handoff — they have to
write down why there is none, and the reader sees it. Reach for it only when
producing a document would be the wrong instruction.

Nothing is persisted. A run is a thinking tool; the record it produces is
meant to be carried into the template the outcome names.

**Entitlement calculators (EF11)** use the same engine. Workspace tools on
`/app/workflows/`:

| Tool | Route | State |
| --- | --- | --- |
| Ontario statutory notice (ESA s. 57 floor) | `/app/workflows/statutory-notice-ontario` | **Built** — band or typed months → floor weeks; T03 |
| Québec termination notice (hedge) | `/app/workflows/statutory-notice-quebec` | **Built** — no week figures while L6 keeps `bands: null`; T03 |
| Federal termination notice (hedge) | `/app/workflows/statutory-notice-federal` | **Built** — no week figures; T03 |
| Ontario ESA severance eligibility | `/app/workflows/severance-eligibility-ontario` | **Built** — Option B gate only; no amount; T03 |
| ROE filing checklist | `/app/workflows/roe-filing-checklist` | **Built** — process shape; employer records deadline; T29 |
| Temporary layoff awareness | `/app/workflows/temporary-layoff-awareness` | **Built** — contract + statute-cap shape; T32 |

Severance Option A (compute amount) and numeric QC/FED ladders remain open
in TODO.md EF11 until payroll data / L6 sign-off. These must not be published
as figure-emitting `/tools/*` marketing pages.

**Every step shows in every jurisdiction.** The model briefly carried an
`only` field to restrict a step to one, and it was removed: a run has no
jurisdiction to gate on, because the runner never asks for one, so the gate
silently no-opped. Authoring `only: 'QC'` would have shipped Québec-specific
legal content to an Ontario reader with nothing failing. Where the law
differs, name the difference in the copy — as the accommodation flow's
hardship caution does — and send the reader to the template that resolves it
for their jurisdiction.

**Scoring.** A rated question is a `choice` step whose options all carry a
`value` and lead to the same place — no separate step kind, because the only
thing that differs is what the answer is for. `domain` names the factor it
measures, and a `result` step ends the run by banding the total. `scoreRun`
measures against what the answered questions offered rather than against every
rated question in the flow: a run that branched past some would otherwise be
scored out of points it could never have earned.

`result` is its own terminal kind rather than an `outcome` with an optional
`bands` field. The two are reached differently and read differently, and a
single kind whose meaning flips on whether a field is set is the shape that
gets misused later.

One trap worth knowing, because it does not fail — it hangs. `longestPath`
walks _distinct_ successors, not the raw edge list: four options leading to the
same next step are one branch, and exploring them separately is 4^13 for a
thirteen-question assessment. `flowEngine.test.ts` builds exactly that shape.

### Reference guides — `src/features/app/reference/`

Long-form in-product content with per-jurisdiction notes, at
`/app/knowledge/:slug`, listed above the fixture titles on the Knowledge
index.

Deliberately not `articleModel.ts`, though the block structure is similar.
Different reader, different rules: this is behind the app and not indexed, it
carries jurisdiction notes because the reader has a jurisdiction, and it links
out to the templates and flows that act on it because the reader is mid-task.
It also adds a `contrast` block — the do/don't pair that most of this content
naturally takes.

The editorial no-figures rule is not enforced here the way `articles.test.ts`
enforces it for `/guides`. The same caution applies and it is a judgement
call: name the statute, describe the shape of the rule, point at the official
text.

## The pillars and rings, tool by tool

Everything below is built. Each section records where the tools live and what
was learned building them — the reusable part, not a changelog. Counts, where
they appear, are the framework's own.

### Pillar C's respectful workplace policy overlapped T13 — it was built by widening T13

Kept because the reasoning generalises. The framework listed the tool as
"comprehensive policy covering harassment, discrimination, and inclusion", and
most of that was the harassment, discrimination & violence policy already in
the catalogue as **T13** — same subject, same audience, and a policy every
jurisdiction Dutiva covers requires by statute. Only the inclusion dimension
was genuinely missing.

**So it was widened rather than companioned, and that is the rule to keep.**
Two overlapping conduct policies in front of the same employer is the
near-duplicate problem the accommodation category already had once (T19 beside
T23), and an inclusion clause that lives apart from the harassment policy is
the clause nobody reads.

It was also more than an authoring job, which is why it took three PRs to
land. `t13-harassment-policy.ts` carried a
`do not hand-edit / regenerate with scripts/generate-doclib.mjs` header, and
the generator does not run: dead Windows paths, and its source JSON was never
committed. Widening T13 meant first deciding whether it moved to
hand-maintained the way `data/templates/` already is, or the generator was
repaired. **That decision was taken deliberately rather than resolved by
quietly editing a file that says not to** — the generator's own header states
it is a one-shot import, so T01–T16 are hand-maintained now and say so. If
another generated file ever blocks a tool the same way, take the same route:
settle the ownership question in its own commit, then author.

### Ring 2, Pillar A — Mental health & EAP readiness

Complete, and the only pillar built entirely out of the two newer surfaces —
no Document Studio template at all. That was not a shortcut. Every candidate
document already existed: the plan is T23, the return is T27, the leave is
T33. What Pillar A adds is the judgement in front of those, which is why it is
one flow and three guides.

| Tool                                     | Where                                             | State     |
| ---------------------------------------- | ------------------------------------------------- | --------- |
| Mental health support checklist          | `/app/workflows/mental-health-response`           | **Built** |
| EAP referral guide                       | `/app/knowledge/eap-referral`                     | **Built** |
| Manager conversation guide               | `/app/knowledge/manager-conversations`            | **Built** |
| Return to work after mental health leave | `/app/knowledge/return-after-mental-health-leave` | **Built** |

**Two near-duplicates were avoided here, and the reasoning is the reusable
part.** The framework's "support checklist" reads like a second
duty-to-accommodate flow — that flow already starts at "someone tells you they
are struggling" and already branches on a manager who noticed rather than was
told. And "return-to-work after mental health leave" reads like a third
return document, between T27 and T23, repeating both.

So the flow was scoped to the ten minutes **before** any process starts, and
it ends by routing: to an emergency response, to the accommodation process, to
a leave, or to an ordinary performance conversation. Its distinct content is
the triage, because getting it wrong is the harm — a health need managed as
underperformance is how an employer disciplines a disability, and a
performance problem re-labelled as health is how an employee is never told the
truth about their work. And the return-to-work tool was built as a guide,
carrying the judgement a form cannot: that a graduated return is an
accommodation rather than a favour, that a fitness-to-return note means "able
to work under stated conditions" rather than "recovered", that the receiving
manager is told the adjustment and never the reason, and that the relapse path
is decided while everyone is calm.

**When a framework tool sounds like something already shipped, check before
authoring, not in review.** That check has now changed the answer three times
— T13, and both of these.

The manager conversation guide is deliberately written as wording rather than
principles. Managers already know to be supportive and not to pry; what they
lack is the sentence to say when the room goes quiet, so they improvise, and
the improvisation is where the diagnosis gets guessed at and the promise gets
made that cannot be kept. Every `contrast` pair in it is a real sentence
against the real sentence it replaces.

No figures anywhere in the pillar. EAP session counts and coverage are set by
the plan an employer bought; ramp lengths and benefit durations by the plan
and the treating clinician. A guide carrying a "typical four weeks" becomes
the standard someone is measured against.

### Ring 2, Pillar D — Leave management

Complete. The two policies are written as a pair and should be read as one:
the attendance policy (T28) says statutory leave is never an absence and hands
the subject off; the sick leave policy (T34) is where it lands. Splitting them
is what stops an employer either counting protected leave against attendance —
the most common reprisal exposure there is — or having no written sick-leave
terms at all. Each names the other.

| Tool                       | Where                             | State     |
| -------------------------- | --------------------------------- | --------- |
| Leave request form         | T33                               | **Built** |
| Sick leave policy          | T34                               | **Built** |
| Leave of absence checklist | `/app/workflows/leave-of-absence` | **Built** |
| Parental leave guide       | `/app/knowledge/parental-leave`   | **Built** |

**The parental leave guide states no figures, and that is the decision this
doc said to make first.** Durations, notice periods and benefit amounts differ
across the three jurisdictions, differ again between the leave and the benefit
that funds it, and move. The guide teaches the structure instead — that job
protection and income replacement are separate systems with separate
administrators, which is the part that does not go stale — and sends the
reader to the ministry and to Service Canada or QPIP for anything numeric.

The same rule now governs both Ring 4 guides, and it bound harder there —
see below. A figure in a guide is a figure someone has to re-audit annually,
and the year nobody does is the year it misleads.

## Ring 2, Pillar C — Psychological safety

Complete. The self-check came first (see below); the other three landed once
the generator decision unblocked the policy.

| Tool                         | Where                                       | State     |
| ---------------------------- | ------------------------------------------- | --------- |
| Psychological safety check   | `/app/workflows/psychological-safety-check` | **Built** |
| Respectful workplace policy  | T13, widened                                | **Built** |
| Bystander intervention guide | `/app/knowledge/bystander-intervention`     | **Built** |
| Wellness action plan         | T44                                         | **Built** |

**Do not paraphrase a statutory test in copy that renders everywhere.** T13's
prohibited-conduct clause first restated Ontario's "known or ought reasonably
to be known to be unwelcome" for all three jurisdictions — dropping "a course
of vexatious conduct" from the Ontario test in the process, and stating it at
all for Québec and federal workplaces, whose definitions differ materially.
The fix is the T24 pattern: the shared clause says what {{org}} prohibits as
its own standard and says plainly that it is wider than the legal minimum,
and three `when.juris` clauses carry the actual statutory definition. Québec's
single-serious-incident branch requires a lasting harmful effect, and the
federal definition requires neither a course of conduct nor a lasting effect —
those are not paraphrases of one rule.

**A generated document must not certify a step the product cannot see.** The
federal clause said this policy "is developed and reviewed jointly with the
policy committee" — which the wizard never asks about, so generating T13 for
a federal employer produced a false statement of compliance. It states the
requirement now and says issuing the document does not perform it.

**The policy was built by widening T13, as this doc said to.** #126 found the
overlap and #127 recorded why it could not be closed then: T13 is a generated
file whose generator does not run, and the fix needed that decision taken
first. It was taken in #128. Widening it also closed two defects that had
nothing to do with Pillar C — `includes` advertised seven sections against a
two-clause preview, so the template promised a document it did not produce,
and there was no statement of what is _not_ harassment, which is the omission
that makes managers afraid to manage.

**A template that says it is the legally required policy has to be one, or
say what it is missing.** T13's description claimed it was required by law in
every jurisdiction Dutiva covers — true of the obligation, not of the
document. Québec prescribes content beyond it (risk identification and
control, social activities, protection measures, complaint handling and
handler training, two-year record retention) and the federal Regulations
prescribe their own list (the parties' roles, the assessment's risk-factor
summary, emergency procedures, training, Part II recourse). The document lists
those in `when.juris` clauses rather than inventing them, a risk note says not
to publish it as the statutory policy until they are added, and the
description no longer implies completeness. **Before describing any template
as satisfying a statutory requirement, check the prescribed content list —
covering the subject is not the same as meeting the requirement.**

**`required` on a question was decoration.** The wizard rendered an asterisk
and advanced anyway, so a document could be created with its required merge
fields blank and shipped to a customer with unfilled placeholders in it. Next
and Create now gate on it, and the missing fields are named rather than the
button silently disabling. This was catalogue-wide, not a T44 problem.

**A prompt the reader answers needs somewhere to write — `fill`.** Issuing
T44 blank was right; rendering its prompts as `clause` was not, because
`DocPaper` renders a clause as a heading and a paragraph and `PreviewBlock`
had no response area. The delivered form was explanatory prose followed by
signature lines, with nowhere to put an answer. `fill` is a heading, its
guidance in italic, and `lines` ruled rows. Reach for it whenever a generated
document asks its reader for something rather than telling them something.

**A free-text answer merged into a policy needs a floor when the law sets
one.** T13 asks how often the policy is reviewed and merged the answer
verbatim, so "every four years" produced a policy that reads as compliant and
is not — Ontario requires an annual review of the harassment programme and the
federal Regulations require one at least every three years. The hint now names
both, and `when.juris` clauses state the applicable minimum inside the
document. The general form: where a merge field can be filled with an answer
the law forbids, the document says what the law requires beside it.

**T44 generates blank, and that is the design.** Review caught the first
draft asking the wizard for the employee's own answers — `GenerateScreen` is
employer-side, so a field for "what makes work harder" has an owner, HR lead
or manager authoring someone else's health-adjacent data. The three questions
left are the only ones an employer legitimately fills in: whose plan it is,
when to look at it again, who to give it back to. If an employee
self-completion path is ever built, T44 is the template to revisit.

The copy says "no diagnosis is requested" rather than claiming the result is
never a medical record — nothing stops someone volunteering one in free text,
so the manager note says to treat whatever comes back as sensitive personal
information either way. That distinction between what a form asks for and what
it may receive is worth carrying into any future intake document.

**T44 is also not in `accommodation`, deliberately.**
Filing a wellness plan beside the duty-to-accommodate documents asserts that
whoever completed one has a disability and asked for an adjustment. Neither
follows, and it is the same misfiling that once put T19/T20 under
`discipline` — so it has its own `wellbeing` category. The questions ask what
helps at work and never what is wrong: there is no field for a condition, a
diagnosis or a treatment, deliberately, because a box marked "nature of
condition" gets filled in.

**The bystander guide is the only tool in the product written for the
colleague rather than the employer**, and it is written as options rather than
as a duty. A guide that says you must intervene produces either nothing or an
escalation the person was not equipped for; four options, any of which counts,
is what makes the quiet ones usable. It creates no obligation to intervene,
because an employer whose policy disciplines a silent bystander has invented
an offence out of someone else's misconduct and shifted its own duty onto a
witness.

### The psychological safety self-check

Pillar C's scored assessment, at `/app/workflows/psychological-safety-check` —
thirteen rated questions banded into a result with a per-factor breakdown.
Building it is what added scoring to the flow engine, so the last piece of
machinery Rings 2–4 needed now exists.

**Read this before touching its content.** CSA Z1003-13 is a copyrighted
standard published by the CSA Group, and none of its assessment instrument is
reproduced — not in whole, not in paraphrase. What is used is the set of
thirteen psychosocial factors it identifies, which are named and described in
freely published material about it; every question is written from scratch.
The copy never describes a run as an audit against the Standard, a measure of
conformance, or any kind of certification, and a test asserts the disclaimer is
on the page. Keep both of those true.

It also asks the employer what they have put in place — not how their staff
feel. An anonymous employee survey is a different instrument with different
ethics (consent, anonymity, a duty to act on what it surfaces), and shipping
one under this label would be the wrong tool wearing the right name.

The framework asks for fifteen questions; there are thirteen, one per factor.
Padding two factors into four questions would have weighted them double for
the sake of a round number.

## Ring 3 — Internal communications

All nine built, as templates in a new `communications` category. The category
sits last in the lifecycle order because it does not sit at a point in it:
**every other category belongs to a moment in one person's employment, and
these cut across all of them.** That is the distinction to hold when adding
one.

A first draft of this section claimed something sharper — that everything here
is addressed to people who are not its subject — and review showed it false
for two of the nine: T39 is addressed to the employee who signs it, and T41 to
an individual participant. What is true of most of the set, and what drives the
risk, is that these documents are read by an audience wider than the person
they concern. The invariant to actually hold is the narrower one: **nothing
here says anything about a person that its readers do not need.**

| Group                  | Tool                            | tid |
| ---------------------- | ------------------------------- | --- |
| Layoff & restructuring | Layoff announcement script      | T35 |
|                        | Team restructuring announcement | T36 |
|                        | Employee FAQ                    | T37 |
| Policy rollout         | Policy introduction memo        | T38 |
|                        | Policy acknowledgement form     | T39 |
|                        | Policy update notification      | T40 |
| Crisis communications  | Investigation notice            | T41 |
|                        | Departure announcement          | T42 |
|                        | Incident communication          | T43 |

**Four rules run through the set, and they are the reusable part.**

_An announcement is never notice._ T35 and T36 both say so, and T35 refuses to
start until the individual notices are in hand. An employer who treats a
meeting as having discharged a statutory obligation has given no notice at
all, and the group-termination thresholds add obligations to a ministry that
an internal message cannot touch.

_Say nothing about why anyone left._ T42 is three clauses long and most of it
is restraint. A stated or implied reason is published to an audience with no
need for it, by an employer who would have to prove it, about a person who is
not present — and it is written so a resignation and a dismissal read
identically, because an organisation that announces one warmly and the other
tersely has published the difference without meaning to.

_Telling staff is not reporting._ T43's risk note carries this: serious
injuries, fatalities and privacy breaches have notification duties to
regulators with their own deadlines and forms, and a carefully written
all-staff message satisfies none of them. It is an easy mistake precisely
because the internal message feels like the responsible thing to have done.

_A confidentiality request has limits, and they get stated._ T41 asks
participants not to discuss an active investigation among colleagues, and then
says plainly that nothing in it prevents legal advice, a union representative,
a regulator, a human rights complaint, or a doctor. A clause that reads as
barring those is unenforceable and reads as an employer containing something.

**T39 overlaps something already shipped, and the header says so.** Every
policy template — T04, T10, T11, T12, T13, T28, T34 — already ends with its
own `ack` block, so a policy generated here does not need the form and
collecting both produces two records of the same thing with different dates.
It is scoped to what those blocks cannot do: a set rolled out together on one
signature, and policies distributed outside Document Studio.

T38 and T40 are separate for a reason worth keeping: a new policy has to be
explained, an update only has to be diffed, and an update notice that
re-explains the whole policy buries the two lines the reader needed. T40 makes
the author write the before as well as the after, which is deliberate
friction — an employer who cannot state the old position in a sentence has not
established what they are changing.

**Risk is calibrated against the rest of the catalogue, not upward.** Only T41
is `high`: it is the procedural-fairness document, and a notice too vague to
respond to is what costs an employer the finding. The announcements are
`medium` — they create no entitlement, and their risk lives in deviating from
what they say rather than in the documents themselves.

**A block can gate on an answer, and the standing disclaimer is one string.**
Two more from review on #128, both wider than Ring 3. `ClauseGate` gained
`answer` because T40 asks whether a fresh acknowledgement is required and had
no way to honour a "no" — it shipped a signature page to people it had just
told not to sign. And the disclaimer, which `CONVENTIONS.md` says never to
retype, was retyped in all 31 templates: three different wordings had already
drifted apart. It is `DOC_DISCLAIMER_NOTE` now, in a note of its own, with the
template's own guidance in a separate note beside it. That covers the whole
catalogue, including the ported T17–T20 — and T18, which turned out to ship no
disclaimer at all.

**The generator decision, taken rather than deferred.** T01–T16 carried a "do
not hand-edit, regenerate with `scripts/generate-doclib.mjs`" header, and #127
recorded that widening T13 was blocked on deciding what to do about it. It is
decided here: `generate-doclib.mjs` says in its own header that it is a
one-shot import and not runnable, its source JSON was never committed, and it
fails at the first read. The instruction pointed at a process that does not
exist, so those headers now say what is true — the files are hand-maintained
like the rest of the catalogue. Nothing else about them changed in this PR
beyond the disclaimer.

That also unblocks Pillar C: widening T13 into the respectful workplace policy
is now an authoring job rather than a decision.

**A merged `select` renders its label, not its stored value.** Review on #128
found that `mergeSegments` inserts an answer verbatim, so a select merged into
a document rendered `option.value` — an internal key where the value was one
(`no_plans`), and one language's prose everywhere else, which is how a French
document came to say "2 weeks" while the option's own French label said
"2 semaines". That was live in T01, T08, T10, T11, T16, T22 and T23 before
Ring 3 existed, so it is fixed centrally in `engine.answerLabels` rather than
worked around per template. Apply it wherever answers meet `mergeSegments`;
`engine.test.ts` holds every merged select in the catalogue to resolving in
both languages.

## Ring 4 — Compensation & financial literacy

All four built: two templates in a new `compensation` category, and two
reference guides.

| Tool                       | Where                               | State     |
| -------------------------- | ----------------------------------- | --------- |
| Total compensation summary | T45                                 | **Built** |
| Salary review letter       | T46                                 | **Built** |
| Pay stub guide             | `/app/knowledge/pay-statement`      | **Built** |
| RRSP & TFSA guide          | `/app/knowledge/retirement-savings` | **Built** |

**The `compensation` category exists because these report rather than vary.**
That is the whole boundary against `changes`, and it is the test for anything
added here later: a total compensation summary changes nothing, and a salary
review letter frequently reports that nothing changed. T26 stays in `changes`
because confirming a new title or a new rate is a variation of the contract.
The category sits ninth in the lifecycle order, before communications.

**T45 does not total, and that is the design.** A total compensation statement
is normally written to make a number look larger than the salary, and the
usual way there is to add in the employer's own costs — its share of statutory
payroll contributions, its insurance premiums, the cost of the office. None of
that is money the employee receives. Employees compare the headline to their
bank account, and the gap is what they remember, so the document keeps pay,
benefits provided and employer contributions in three separate sections and
sums none of them. The generalisable form: **a number an employee cannot spend
does not go in the same column as one they can.**

**T46 is built around the no-increase letter, because that is the one nobody
writes.** Employers either say nothing and let the silence land in a pay
period, or bury it under a paragraph about business conditions that reads as a
preamble to bad news the reader has already guessed. The document says the
outcome in the first line, gives the actual reason, and says what would change
it. Its risk note carries the part an HR author will not think of unprompted:
a pay decision has to rest on the work, and a pattern of outcomes that tracks a
protected ground is a problem whatever any individual letter says.

**T46 hands off rather than absorbing.** Where a review produces an increase,
T46 reports it and T26 varies the terms — a new title, a new reporting line, a
change to the contract itself. Running a no-increase year through T26 produces
a promotion letter with its fields empty; running an actual promotion through
T46 produces a report of a change that was never documented as one. Reporting
a rate and varying a contract are different acts and stay different documents.

**Both guides are figure-free, under the rule the parental leave guide set** —
and it bound harder here than anywhere. Nearly everything a reader wants a
number for in payroll or registered savings is set annually: contribution
rates, maximums, exemptions, brackets, limits, penalty rates, the age an RRSP
must convert. The pay statement guide teaches the structure instead — which
deductions are required and which need written authorization, what the
statement must contain, and why a taxable benefit lowers net pay — and sends
the reader to the revenue agencies for anything numeric. That structure is
also the part employers actually get wrong.

**The RRSP/TFSA guide is bound by a second rule the others are not: an
employer is not a financial adviser.** Explaining how an account is taxed is
education; telling an employee which account to use, how much to contribute or
what to hold in it is advice, given by the party that signs their pay cheque to
someone who cannot weigh it neutrally. So the guide's longest section is the
one about where the employer's answer ends, and it names a destination for
every question it declines — "I can't advise on that" lands badly alone and
well when it ends with who can. **If any future tool touches an employee's own
money, health or legal position, write the boundary section first and the
content around it.** `CANONICAL_FACTS.md` §4 now carries the claim to make
about this guide, which is that it is educational and not financial advice.

**The two Ring 4 halves point at each other, and that was worth the extra
pass.** The pay statement guide's "your cost is not their deduction" section
exists because T45 is where employer contributions belong and a pay stub is
where they do not — an employer contribution printed on a statement reads as
something taken from the employee. The RRSP/TFSA guide makes the matching
point from the other side: an employer contribution to a group plan is a
taxable benefit, so gaining one can lower net pay in the same period, which is
the most predictable surprise in compensation and the one to disclose when the
benefit is announced rather than when the first person calls.

## Wiring the prototype modules

The `/app/compensation`, `/app/communications` and `/app/wellbeing` surfaces
were ported from the App v2 design handoff, ran on demo fixtures, and rendered
an empty state in a production workspace. They are now on real per-tenant
tables — migrations 0039, 0040 and 0041, following the
employees / hr_cases / hr_policies shape — and each view dispatches on
workspace mode the way `PoliciesView` does.

| Module         | Table                      | Migration |
| -------------- | -------------------------- | --------- |
| Compensation   | `hr_compensation_records`  | 0039      |
| Communications | `hr_communications`        | 0040      |
| Wellbeing      | `hr_wellbeing_initiatives` | 0041      |

**The reusable lesson is what did NOT get wired.** A prototype is a drawing of
a product, and three of the things these ones drew were capabilities Dutiva
does not have. Persisting them would have converted a fixture's decoration
into a stored claim — which is the exact shape of every canonical-facts
violation this repo has had.

_No market salary data._ The compensation fixture carried a `market` figure per
person and rendered a "vs market" percentage from it. There is no
salary-survey source in the product and buying one was not in scope, so the
comparison is against `band_midpoint` — the employer's own number, entered by
them. A record without one shows **no comparison**, never 0%: zero would read
as "exactly at midpoint", which is a claim the employer never made. That
distinction is a test, not a convention.

_No review of a message._ The communications fixture scored every announcement
on tone, legal, clarity and policy. Nothing analyses a draft. A green
"Legal ✓" stored against a message nobody reviewed is worse than no chip at
all, so the dimensions stayed in the demo. They come back when an Advisor pass
over a draft actually exists — with its own columns and its own timestamps, so
a stale review cannot read as a fresh one.

_No send._ The fixture's Send button never sent anything, and neither does the
product. The production action is "Mark as sent", it records that the employer
sent something, and a line under the list says so rather than leaving it
implied.

_And no wellbeing signals — the one that mattered most._ The wellbeing fixture
listed named employees with a source, a confidence level and a sensitivity
rating: inferred health information about identifiable people, held by their
employer, on a score. `hr_wellbeing_initiatives` has **no employee reference,
and must never gain one.** Ring 2 is built on the opposite commitment — the
psychological safety self-check asks the employer what they have put in place
rather than how staff feel, and T44 requests no diagnosis. A signals table
contradicts both, and `CANONICAL_FACTS.md` §4 already says Pillar A is not
clinical. So the production module is a register of the support an employer
**offers**: what is in place, who owns it, when it is next reviewed. Support
for a named person belongs on the accommodation path, where there is a request
and the employee takes part rather than being the subject of an inference.

Both the migration header and a test enforce that last one. The test asserts
the returned rows carry no person-shaped key and that the selected columns
contain no `employee` — so adding the column fails CI rather than review.

**The general rule, worth applying to any future port: a prototype shows what
a product would look like if it could do the thing. Before persisting a field,
ask what would have to be true for it to be filled honestly — and if the
answer is a capability that does not exist, the field is a claim, not data.**

## Grouped by what they cost to build

The ring split describes the product; this split describes the work. **0 tools
remain.** The table is kept as the map of where each shape lives, because the
next tool anyone adds will be one of these three and will go in one of these
three directories.

| Shape                             | Where it goes                                                  |
| --------------------------------- | -------------------------------------------------------------- |
| Generated templates               | `data/templates/`, the shape T21–T46 established               |
| Reference guides / guidance notes | `reference/data/`, the shape the limitations guide established |
| Checklists and decision flows     | `flows/data/`, the shape the accommodation flow established    |

**Every tool had a home and a worked example by the end, and that is what made
the last stretch fast.** Templates, reference guides, decision flows and scored
assessments each have a directory and something shipped to copy from. Before
those surfaces existed, 12 of these tools were blocked on code that did not
exist and the answer to "where would this go?" was nothing. If a future tool
does not fit one of the three shapes, building the surface first was the right
call then and remains it.

The real constraint was never the machinery — it was the authoring. These are
legal-adjacent documents in a compliance product, and across every PR in this
sequence, **every legal error was caught by review and none by CI**: the tests
here check graph shape, merge fields, bilingual completeness and jurisdiction
scoping, and none of them can tell you a statute is characterised correctly.
Budget for review, not just writing. That does not change now the rings are
finished; it applies to the next amendment to any of these files.

## Standing constraints on any ring tool

1. **Three jurisdictions: ON, QC, FED.** Not 14. A tool the framework scopes
   to "all 14" ships for three, and its copy must not imply otherwise
   (`CANONICAL_FACTS.md` §3). The framework's sick-day policy tool names BC —
   BC is out of scope.
2. **EN + FR, both complete.** French with no handoff source is marked
   `[FR self-authored]` at the definition site.
3. **A rule that holds in one jurisdiction is scoped to that jurisdiction.**
   This is the mistake this content keeps making — three times so far, twice
   caught in review on #122 and once in a later audit. Ontario's undue-hardship
   list is statutory and closed; Québec names no list and weighs more; a
   common-law formation rule does not apply in Québec at all. Copy that renders
   for every reader must be true for every reader.

   **Scope it with a `when.juris` clause, not only with a
   `jurisdictionNotes` entry.** Those notes render on the template detail
   screen alone — `GenerateScreen` and a saved document resolve `preview`
   through `resolveBlocks` and nothing else, so a note is absent from the
   artifact the customer keeps. A document that tells its reader to check a
   note it does not carry is pointing at nothing. Where a rule differs, ship
   one gated clause per jurisdiction (T24's "The test that applies here"), and
   make sure the worksheet collects what the wider test needs — a note
   describing factors the questions have no field for is a note the conclusion
   cannot rest on.

   Guarded for T24 by `authoredTemplates.test.ts`; everywhere else it is
   review, because no test can tell you a statute is characterised correctly.

4. **The standing disclaimer** ships with generated documents, via the
   template's `note` block or the shared `Disclaimer` component — never
   retyped.
5. **Compliance-oriented, never compliant.** No "legally compliant",
   "guaranteed compliant", or "legal advice".
6. **Figures.** Public editorial content states no statutory figures
   (AGENTS.md). In-product tools are not covered by that rule, but the three
   inherently figure-heavy guides — parental leave, pay statement, RRSP/TFSA —
   all settled on the same answer: **no figures**, name the statute or the
   agency and send the reader to the current source. Follow it for anything
   whose numbers are set annually. A figure in a guide is one somebody has to
   re-audit every year, and the year nobody does is the year it misleads.
7. **Not an adviser.** The product does not give legal, medical or financial
   advice, and a tool that edges toward one states its own boundary in its own
   copy — see the RRSP/TFSA guide, whose longest section is where the
   employer's answer ends.

## Corrections to the April 2026 Drive document

The framework predates the July canonical-facts audit and contradicts it in
four places. Treat the Drive document as superseded on all four.

| The Drive document says                         | Actually                                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| All 14 jurisdictions, every ring                | Three — ON, QC, FED                                                                                                                    |
| $39/month flat                                  | Free · Starter $24 · Growth $49 · Pro $99, and paid plans are not sold during beta                                                     |
| 47 tools at launch                              | 46 templates ship; the 47 counted a launch state that did not happen                                                                   |
| Month-numbered build schedule off a launch date | Both published launch dates have passed. Tie sequencing to product state, never a calendar date (`CANONICAL_FACTS.md` § Launch status) |

Its Ring 1 inventory did not match what shipped either. Of the 18 tools it
lists, 9 had no template — **"Ring 1 is complete at launch" was not true
against the framework's own list**. Those nine are now built:

| Framework's Ring 1 tool        | tid |
| ------------------------------ | --- |
| Accommodation Response         | T22 |
| Probationary Period Review     | T25 |
| Promotion & Salary Adjustment  | T26 |
| Return from Leave Confirmation | T27 |
| Attendance Policy              | T28 |
| ROE Preparation Guide          | T29 |
| Reference Letter               | T30 |
| Investigation Report           | T31 |
| Layoff Notice                  | T32 |

T32 is the individual temporary layoff. T15, the group termination notice, is
a different document for a different trigger, and treating one as the other is
the mistake that made this look like a duplicate rather than a gap.

T29 is the framework's one Ring 1 reference doc. With no surface for reference
content it is built as a preparation record instead — the shape the ported
offboarding checklist (T18) already uses. It deliberately states no ROE filing
deadline: that depends on the filing method and the pay-period schedule, and a
wrong date in a customer's document is a compliance defect, not a typo.

Seven shipped templates remain absent from the framework's list (employment
agreement, employee handbook, restrictive covenants, Québec offer letter,
vacation & leave policy, code of conduct, group termination notice) — the
Drive document undercounts the product, not the other way round.

## Adding a ring tool

1. Check this file and `CANONICAL_FACTS.md` first.
2. Pick the surface by shape, and follow the worked example already there:
   - **a document** → `data/templates/`, following T21–T46. Numbering
     continues from the highest tid in `catalogue.ts` — **check both
     sources**, because `data/templates/` and `customTemplates.ts` share one
     tid space and doclib silently wins the lookup in `DocStudioProvider`.
     `src/canonicalFacts.test.ts` fails on a duplicate, and
     `authoredTemplates.test.ts` picks up anything from T21 up automatically.
   - **a checklist or decision tree** → `flows/data/`, following
     `dutyToAccommodate.ts`. Register it in `flows/data/index.ts`;
     `flowEngine.test.ts` then holds it to the graph and bilingual rules.
   - **a reference guide** → `reference/data/`, following
     `functionalLimitations.ts`. Register it in `reference/data/index.ts`.
   - **a scored assessment** → `flows/data/`, following
     `psychologicalSafety.ts`. A rated question is a `choice` whose options
     all carry a `value` and share a `to`; give it a `domain` so the result
     can break down by factor, and end at a `result` step whose bands cover
     down to 0.
3. Update the template count row in `CANONICAL_FACTS.md` in the same PR; the
   test derives it from `catalogue.ts` and fails on drift.
4. Update the state tables here.
5. **Check for overlap before authoring, not in review.** When a proposed tool
   sounds like something already shipped, it usually is. That check changed the
   answer five times across this sequence — T13, Pillar A's support checklist,
   the return-to-work document, T39 against the `ack` blocks, and T46 against
   T26 — and every time the right move was to widen, re-scope or hand off
   rather than mint a near-duplicate. Two overlapping documents in front of one
   employer is worse than one imperfect document.
