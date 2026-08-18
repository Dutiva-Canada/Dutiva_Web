# Legal review inventory — every document a reviewer must see, counted

**Compiled 2026-08-07** from the repository state on that date. Written to be
handed to a lawyer, a legal clinic, or an HR consultant as the basis for a
fixed-fee quote — it counts and sizes every reviewable document so nobody has
to bill hours just to discover the scope.

**Precedence.** [CANONICAL_FACTS.md](CANONICAL_FACTS.md) outranks this file on
any question of fact, and the code outranks both. Counts below are derived
from the code (`legalHubData.ts`, `catalogue.ts`, the template `review` flags)
and go stale the way any snapshot does; the files named in each section are
the authority on their own current state.

**What "review" means here.** Dutiva's own positioning is
compliance-oriented, never compliant, and never legal advice
(CANONICAL_FACTS § Positioning). Nothing below changes that boundary. Review
is about the company's own exposure: the public legal pages bind Dutiva to
its users; the templates are legal-adjacent documents customers will actually
issue to employees; the corpus states statutory figures the Advisor repeats.
Every legal error found so far in this content was caught by human review and
none by CI ([FOUR_RING_FRAMEWORK.md](FOUR_RING_FRAMEWORK.md) — "budget for
review, not just writing").

---

## 1. Headline numbers

| # | Bucket | Items | Languages | Source volume (words)¹ | Reviewer needed |
| --- | --- | --- | --- | --- | --- |
| 1 | Public legal pages (`dutiva.ca/legal/*`) | **26** | EN + FR = **52 files** | ~33,000 EN + ~39,000 FR | Lawyer (privacy / commercial / tech) |
| 2 | Templates flagged `lawyer_review_recommended` | **12** | bilingual per template | ~21,000 | Employment lawyer |
| 3 | Templates flagged `hr_review_required` or `not_reviewed` | **38** | bilingual per template | ~67,000 | HR professional (CHRP/CRHA); lawyer spot-checks |
| 4 | Notice-bands review pack (QC + FED statutory tables) | **1** | EN (statutes quoted bilingually) | ~4,500 | Employment lawyer — pack is built for a ~1-hour sign-off |
| 5 | Advisor grounding corpus rows (`advisor_guidance_chunks`) | **42** | EN + FR per row | — | Employment lawyer or supervised paralegal |
| 6 | Public articles (`/blog` 6 + `/guides` 6) | **12** | EN + FR = 24 pages | ~27,000 | Editorial legal pass (deferrable) |
| 7 | In-app reference guides (`/app/knowledge/*`) | **8** | bilingual | ~23,000 | Editorial legal pass (deferrable) |
| 8 | In-app flows & checklists (`/app/workflows/*`) | **4** | bilingual | ~11,000 | Editorial legal pass (deferrable) |
| 9 | Small compliance copy (CASL consent string, signup emails, FAQ, known-limitations page, jurisdiction tool) | ~6 surfaces | bilingual | ~5,000 | Quick lawyer pass alongside bucket 1 |

¹ Word counts are of the source files (TypeScript string content plus a
10–20% markup overhead), measured 2026-08-07. They are sizing aids for
quotes, not billing units.

**Totals: 143 discrete documents/rows/pages carry reviewable legal content.**
The core that genuinely needs a licensed lawyer is **81 items**
(26 legal pages + 12 high-risk templates + 1 review pack + 42 corpus rows);
the remaining 62 can go to an HR professional or be deferred.

**Nothing has counsel sign-off today.** Zero of the 50 templates are
`approved_for_use`, all 42 corpus rows are `machine_curated` (the human
`reviewed` gate has never been exercised — TODO.md L5), and no legal page
records a review by counsel.

---

## 2. Bucket 1 — the 26 public legal pages

Source: `src/features/marketing/legal/content/` (26 documents × EN + FR = 52
files), registered in `legalHubData.ts`, served at `/legal/<slug>` and
`/fr/juridique/<frSlug>`. Have counsel review the **rendered pages on
dutiva.ca**, not the TypeScript — the prose is identical and the pages are
what a court or regulator would read.

| Hub section | Documents |
| ----------- | --------- |
| Core (5) | terms · privacy · disclaimer · cookies · accessibility |
| Privacy & compliance (4) | pipeda-compliance · quebec-law-25 · casl-compliance · cross-border-transfer |
| AI transparency (4) | ai-technology · ai-usage-disclosure · ai-risk-disclosure · human-review-escalation |
| Data handling (6) | data-processing-agreement · data-retention · data-deletion · incident-response-policy · security · subprocessors |
| Commercial (3) | subscription-agreement · refund-policy · support-policy |
| IP & acceptable use (4) | acceptable-use · copyright · trademark-policy · dmca-takedown |

Two things a reviewer must know going in:

- **Five of these are provisionally worded pending a vendor confirmation.**
  `privacy`, `data-processing-agreement`, `subprocessors`, `ai-technology`
  and `cookies` name the AI inference vendor, and the processing-location
  claim rests on a July 2026 confirmation that covered the _previous_ model
  (TODO.md OA9, [do-residency-confirmation-request.md](do-residency-confirmation-request.md)).
  Send that ticket and get the answer **before** paying for review of those
  five, or they get reviewed twice.
- **The French versions are full documents, not summaries** (~39,000 words —
  longer than the English). A bilingual reviewer, ideally Québec-called,
  covers the FR conformance check and the civil-law/Law 25 angle in one pass.

## 3. Buckets 2–3 — the 50 document templates

Source: `src/features/app/documents/data/templates/` (T01–T16, T21–T50) and
`customTemplates.ts` (T17–T20), catalogued in `catalogue.ts`. Every template
is bilingual and ships with the standing disclaimer; none is
`approved_for_use`. The product's own `review` flag is the triage:

**12 flagged `lawyer_review_recommended` — the priority set.** These are the
documents where a customer acting on a bad clause gets sued or breaches a
statute:

| tid | Template | Why it is in this tier |
| --- | -------- | ---------------------- |
| T03 | Termination letter | wrongful dismissal exposure |
| T07 | Contractor agreement | misclassification exposure |
| T08 | Restrictive covenants | enforceability turns on drafting |
| T15 | Group termination notice | statutory mass-termination duties |
| T17 | Full & final release | releases are classic counsel documents |
| T19 | Accommodation documentation | human-rights process record |
| T20 | Medical information request letter | privacy + human-rights limits |
| T22 | Accommodation response | refusals invite complaints |
| T24 | Undue hardship assessment | statutory test differs by jurisdiction |
| T31 | Investigation report | procedural-fairness record |
| T32 | Layoff notice | deemed-termination traps |
| T41 | Investigation notice | procedural fairness; only `high`-risk Ring 3 doc |

**36 flagged `hr_review_required` + 2 `not_reviewed` (T47 candidate
rejection letter, T49 onboarding package).** Full roster: T01 offer letter,
T02 employment agreement, T04 employee handbook, T05 confidentiality
agreement, T06 written warning, T09 Québec offer letter, T10 remote work
policy, T11 vacation & leave policy, T12 code of conduct, T13
harassment/respectful workplace policy, T14 resignation acceptance, T16
performance improvement plan, T18 offboarding checklist, T21 accommodation
request form, T23 accommodation plan, T25 probationary period review, T26
promotion & salary adjustment, T27 return from leave confirmation, T28
attendance policy, T29 ROE preparation guide, T30 reference letter, T33
leave request form, T34 sick leave policy, T35 layoff announcement script,
T36 restructuring announcement, T37 restructuring FAQ, T38 policy
introduction memo, T39 policy acknowledgement form, T40 policy update
notification, T42 departure announcement, T43 incident communication, T44
wellness action plan, T45 total compensation summary, T46 salary review
letter, T48 expense reimbursement policy, T50 policy template.

A freelance HR professional (CHRP in ON, CRHA in QC) can carry this tier,
flagging anything that needs counsel. A few sit close to the line and are
worth a lawyer's spot-check even though the flag says HR: **T02** (employment
agreement), **T04** (employee handbook), **T13** (harassment policy — Québec
and federal prescribe policy content by regulation), **T05** (confidentiality).

Each template's jurisdiction clauses (`when.juris`) mean the reviewer checks
ON, QC and FED variants — three jurisdictions, not one document each.

## 4. Buckets 4–5 — statutory content behind the Advisor

- **[notice-bands-review-pack.md](notice-bands-review-pack.md)** — already
  built as a self-contained sign-off package for a qualified reviewer: LNT
  s. 82 and CLC s. 230(1.1) quoted verbatim in both languages, proposed band
  arrays with derivations, the carve-outs, and a sign-off block. TODO.md L6
  calls it "a one-hour reading job rather than a research project", and L7's
  ESA severance options (§3 of the pack) ride along in the same read. This is
  the cheapest lawyer engagement in the whole inventory and it unblocks
  shipped functionality (`NOTICE_SCHEDULES` QC/FED stay `bands: null` until a
  reviewer signs).
- **42 corpus rows** in `advisor_guidance_chunks` — statutory figures with
  official source URLs and retrieval dates, all `review_status:
  machine_curated`, none ever flipped to `reviewed` (TODO.md L5). The review
  aids already exist and make this fast: the four corpus snapshot docs
  (2026-07-26 / 07-27 / 07-29 / 08-04) and
  [advisor-corpus-verification-2026-08-02.md](advisor-corpus-verification-2026-08-02.md)
  carry per-figure citation tables with double-fetch provenance. A reviewer
  verifies citations rather than researching from scratch.
- Not lawyer work, for contrast: the **22 unreviewed `law_updates` rows** are
  the internal weekly digest gate (TODO.md OA13) — founder/HR review by
  design.

## 5. Buckets 6–9 — legal-adjacent content (deferrable)

Lower priority because the editorial rules already strip the dangerous part —
public articles state **no statutory figures** (enforced by
`articles.test.ts`), and the in-app guides follow the same no-figures rule by
authoring decision. The review here is a conformance pass: is the statute
characterised correctly, is nothing implied beyond the three jurisdictions.

- **12 public articles** (bilingual → 24 rendered pages): blog —
  quebec-employment-standards, federally-regulated-workplaces,
  workplace-policies-canada, employment-record-keeping, job-protected-leaves,
  harassment-prevention-obligations; guides — ontario-termination-notice,
  probation-clauses-ontario, employer-document-checklist,
  employment-contract-clauses, duty-to-accommodate, termination-documentation.
- **8 in-app reference guides**: bystander-intervention, eap-referral,
  functional-limitations, manager-conversations, parental-leave,
  pay-statement, retirement-savings, return-after-mental-health-leave.
- **4 in-app flows**: duty-to-accommodate, leave-of-absence,
  mental-health-response, psychological-safety-check (the CSA Z1003-13
  copyright posture is already documented in FOUR_RING_FRAMEWORK.md — keep
  it true, nothing to review beyond that).
- **Jurisdiction-check tool** (`/tools/jurisdiction-check` + FR) — names
  statutes, states no figures.
- **Small compliance copy**: the CASL consent string (pinned server-side in
  `supabase/functions/_shared/caslConsent.ts` with the proof-of-consent
  record already built), the beta signup/notification emails, the
  known-limitations page, and the FAQ's capability claims. Small enough to
  ride along with the bucket-1 engagement.

## 6. Legal matters that are not document review

These need a professional but are outside the review-the-repo scope, and two
of them should be resolved **before** money is spent on review:

1. **CIPO trademark application 2465617 has an open objection** — a
   Pre-Assessment Letter of 2026-04-09, "Goods or Services Not Acceptable",
   with a response deadline (CANONICAL_FACTS § Company and legal; TODO.md
   L8b). A registered trademark agent handles this; it is a discrete,
   typically flat-fee matter. It is the only item in this file with a
   **deadline attached**.
2. **The DigitalOcean residency ticket (TODO.md OA9)** — drafted, unsent.
   Its answer settles the wording of the five bucket-1 documents above and
   the PIPEDA claim in CANONICAL_FACTS §2. Send it first; it costs nothing.
3. **Drive hygiene (TODO.md L9)** — T01/T02/T04 have sat in the Drive
   `Legal Review` folder as `_polished` drafts since June 2026, and the Drive
   HR template tree exists in duplicate. The repo (`catalogue.ts` and the
   template files) is the single source of truth — point every reviewer at
   the repo/rendered output and dedupe Drive, so nobody bills hours on stale
   copies.

## 7. Sizing and sequencing

A defensible sequence, cheapest-first within each dependency:

1. Send the residency ticket (free; unblocks five documents' final wording).
2. Trademark agent responds to the CIPO letter (deadline risk).
3. Employment lawyer signs the notice-bands pack (~1–2 hours; unblocks
   shipped product behaviour).
4. Same or second lawyer verifies the 42 corpus rows against the citation
   tables (roughly half a day to a day).
5. Privacy/commercial review of the 26 legal pages, bundled, EN first with a
   FR conformance pass by a bilingual (ideally Québec-called) reviewer.
6. Employment lawyer reviews the 12 flagged templates (all three jurisdiction
   variants each).
7. Freelance HR professional sweeps the other 38 templates, escalating
   edge cases; lawyer spot-checks T02/T04/T05/T13.
8. Deferrable: editorial legal pass over articles, guides, flows, tool.

When requesting quotes, hand over this file plus the word counts in §1 and
ask for **fixed-fee bundle pricing** per bucket rather than open hourly —
every bucket above is bounded and sized, which is exactly what makes a flat
fee quotable.
