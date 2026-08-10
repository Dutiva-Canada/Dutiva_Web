# Canonical facts — Dutiva Canada

**Version 2026-07** · compiled 30 July 2026 · source of record

A July 2026 audit of the company Google Drive found seven load-bearing facts about
Dutiva each recorded several different ways across the business plans, the media kit
and the launch brief, with no document marked as authoritative. This file is the
resolution, and it lives in the repo deliberately: the facts below are _derived from
this codebase_, so keeping them next to the code is what stops them drifting again.

**The rule.** Where any Dutiva document disagrees with this file, this file wins.
Where this file disagrees with the code, **the code wins** and this file gets
corrected. When you change one of the values below, update this file in the same PR.

**Most of the rule is enforced.** `npm run check` derives these rows from the
code and fails when the two disagree, so they cannot quietly decay the way the
Drive documents they replaced did:

- **Templates shipped**, **Jurisdictions**, **Pricing**, **Annual billing**,
  **Beta state**, **Beta capacity** (the doc row, the SQL gate and the edge
  function all carrying the same number), **Law-change monitoring** (both
  the audit date and the "not confirmed working" claim itself) —
  `src/canonicalFacts.test.ts`.
- **Brand gold**, **Brand navy** — `scripts/check-canonical-facts.mjs`
  (`npm run check:facts`), separate because their values live in CSS that
  Vitest cannot read.
- **Contact address** — partly. The retired addresses in §6 are enforced; that
  `support@` is the published one is not.

**Rings live** and **Languages** are maintained by hand — no check would catch
them drifting. Treat them the way you treat the "Company and legal" table
below: true because someone confirmed it, not because CI did. Adding a
code-backed fact here means adding its check to one of the two files above,
and adding it to this list.

A mirror of this document lives in Drive as `Dutiva_Canonical_Facts_2026-07` for
people who don't read the repo. Re-export it when this file changes.

## Verified against the product

| Fact                  | Value                                                                          | Source of truth                                                         |
| --------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Templates shipped     | **50** — T01…T50                                                               | `src/features/app/documents/catalogue.ts`                               |
| Jurisdictions         | **3** — ON (ESA 2000), QC (LNT), FED (Canada Labour Code Part III)             | jurisdiction codes `ON`, `QC`, `FED`                                    |
| Pricing               | Free · Starter **$24** · Growth **$49** · Pro **$99** CAD/mo                   | `src/config/plans.ts` → `PLANS`                                         |
| Annual billing        | 10 of 12 months charged (two months free)                                      | `ANNUAL_MONTHS_BILLED`                                                  |
| Beta state            | Paid plans **shown but not sold**                                              | `PAID_PLANS_DISABLED_DURING_BETA`                                       |
| Beta capacity         | **15** individuals/organizations to begin; signup stays open as a waiting list | `src/config/beta.ts` `BETA_COHORT_LIMIT`; gate in migration `0067`      |
| Rings live            | **All four rings complete.**                                                   | `docs/FOUR_RING_FRAMEWORK.md`                                           |
| Law-change monitoring | **Federal (FED), Ontario (ON) and Québec (QC) confirmed working** (audit 2026-08-10) | `src/features/app/guidance/monitoringCoverage.ts`                       |
| Contact address       | **support@dutiva.ca**                                                          | the published support address; retired ones stay retired (§6, enforced) |
| Languages             | EN + FR, both surfaces, prerendered per locale                                 | `src/i18n/` — EN unprefixed, FR under `/fr`                             |
| Brand gold            | `#b98512 → #d4af37 → #f4c54b → #ffe37a`; on dark `#e9c877`                     | `tokens.css` `--gold-gradient`, `--gold-on-dark`                        |
| Brand navy            | `#0d1b2a` ground, `#081019` deep                                               | `tokens.css` `--dutiva-navy`; `surfaces.css` `.surface-marketing --bg`  |

## Company and legal

Confirmed by the founder, July 2026. The three rows that were **unverified** were
checked against the actual registries on **2026-08-04** — see the provenance notes
below the table, which carry the identifiers that let anyone re-check each in one
lookup.

| Fact              | Value                                                                 | Confidence                                      |
| ----------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| Legal name        | Dutiva Canada Inc.                                                    | confirmed — Corporations Canada, 2026-08-04     |
| Registered office | 2967 Dundas St. W., Suite 1485, Toronto, ON M6P 1Z2                   | confirmed — matches the registry record         |
| Operating city    | Ottawa, Ontario                                                       | confirmed — use in marketing/press contexts     |
| Founder           | Martin Constantineau, Founder & CEO — always full name                | confirmed — sole director of record             |
| Incorporation     | Federal (CBCA), 27 March 2026 — corporation no. **1780679-5**, Active | confirmed — Certificate of Incorporation        |
| Trademark         | CIPO **application** no. **2465617**, classes 009/035/041/042/044     | confirmed — application, **not** a registration |
| Business phone    | 1 (800) 349-0297                                                      | **unverified** — no public source attributes it |

**Incorporation — confirmed.** Corporations Canada's Federal Corporation Search
records a _Certificate of Incorporation_ dated **2026-03-27**, which confirms the
claimed date directly rather than by inference. Corporation number **1780679-5**;
business number 792875577RC0001; governing legislation "Canada Business
Corporations Act – 2026-03-27"; status **Active**; annual filings not in default
(2027 not yet due). The anniversary date of 03-27 is a second, independent
confirmation — Corporations Canada defines it as the date the corporation was
created under the CBCA. Corporate name history shows a single row with no prior
name. Identity is not in doubt: the federal search for "dutiva" returns exactly
one corporation, its registered office matches the row above, and its sole
director is the founder named above. The French record corroborates
("Certificat de constitution en société, 2026-03-27").

**Trademark — confirmed, and the distinction matters.** CIPO application
**2465617** for the word mark _Dutiva_ (standard characters), **filed
2026-03-27**. CIPO Status **FORMALIZED**; TM5 status LIVE/APPLICATION/Awaiting
Examination. There is **no registration number and no registration date** — the
mark is an application, not a registered trademark, and public copy must never
imply otherwise. The recorded classes **009/035/041/042/044 match CIPO exactly**
(CIPO displays them unpadded as 9, 35, 41, 42, 44). Dutiva Canada Inc. holds
exactly one trademark record — there is no separate logo or design-mark filing.

> **Not previously recorded anywhere, and worth knowing:** CIPO's Action History
> shows a **Pre-Assessment Letter sent 2026-04-09 with the comment "Goods or
> Services Not Acceptable."** As of the last action on the file, the goods and
> services wording has been objected to and the application is not clean. That
> does not change what may be claimed today — an application is an application
> either way — but it is a live prosecution issue with a response deadline, and
> nothing in this repo or the business plan mentions it.

A sweep for confusingly similar third-party marks found no conflict that is both
close in sound or appearance **and** in an overlapping field. A copy audit of the
working tree found no overclaim: there is no `®` character anywhere in the repo
(ts/tsx/md/json) and no "registered trademark" / "marque déposée" in shipped copy.

**Business phone — still unverified, and probably unverifiable.** No public
authoritative source lists 1 (800) 349-0297, and no source of any kind attributes
it to Dutiva; dutiva.ca publishes no phone number at all, and the Corporations
Canada record has no telephone field. Searched 2026-08-04: the number itself in
three formats, `site:dutiva.ca` for it, a general Dutiva-contact search, and the
live contact page. A toll-free number is registered to a carrier rather than
published in a public registry, so this may not be confirmable from outside — the
founder is the authority on whether it is provisioned and answered. It remains
blocking for any directory listing that requires a phone number
(SEO playbook item 2).

## Launch status

May 2026 and September 2026 have both been published as launch dates and both have
passed. **Do not publish a new calendar date.** Tie the language to product state:
Dutiva is _in beta, and launches when paid plans open_. That stays true until
`PAID_PLANS_DISABLED_DURING_BETA` is flipped, at which point it becomes true in the
other direction by itself.

## Claims to stop making

Each of these appears in at least one Drive document and is contradicted by the
product as built. Most consequential first.

### 1. "Sensitive employee data is never stored on Dutiva servers"

**This is a privacy representation and it is wrong.** Both business plans and the
April media kit state that sensitive data is processed browser-side and never reaches
Dutiva servers. The schema stores it: `employees`, `hr_cases`, `hr_case_notes`,
`hr_employee_notes`, `hr_policies`, `doclib`, `profiles`.

The claim was likely true of an earlier browser-only build. The architecture moved;
the documents didn't. Remove the claim and describe what is actually true — Postgres
with row-level security, 180-day telemetry retention (`0031_ai_telemetry_retention`),
first-party privacy-scrubbed error reporting (`docs/ERROR_REPORTING.md`).

### 2. "PIPEDA-compliant by design"

Don't assert compliance as settled. Data residency for AI inference was still being
confirmed with the provider as of 2026-07-26 — see
`docs/do-residency-confirmation-request.md`, which notes the serverless endpoint has
no region selector and that failover outside Canada is unconfirmed. Describe the work,
not the outcome, until that resolves.

### 3. Counts

**50** templates — not 47, and no longer 16 either: the count has moved, so state
it from `catalogue.ts` rather than from memory or from any Drive document. **3**
jurisdictions — not 4 or 14. Federally regulated remote work is a supported
_scenario_ under `FED`, not a fourth jurisdiction. Alberta and BC stay labelled
roadmap.

### 4. Rings 2–4 as shipped

Ring 1 exists, and as of August 2026 covers every tool the April framework
listed for it (T25–T32 closed the last eight gaps). **Ring 2 is complete** —
all four pillars:

- **Pillar A, Mental Health & EAP readiness** — the mental health response
  checklist at `/app/workflows/mental-health-response`, and three guides at
  `/app/knowledge/`: `eap-referral`, `manager-conversations`, and
  `return-after-mental-health-leave`.
- **Pillar B, Accommodation** — the accommodation documents (T21–T24, plus the
  ported T19/T20) in Document Studio's Accommodation category, the
  duty-to-accommodate flow at `/app/workflows/duty-to-accommodate`, and the
  functional limitations guide at `/app/knowledge/functional-limitations`.
- **Pillar D, Leave Management** — the leave request form (T33) and sick leave
  policy (T34), the leave of absence checklist at
  `/app/workflows/leave-of-absence`, and the parental leave guide at
  `/app/knowledge/parental-leave`.

- **Pillar C, Psychological Safety** — the self-check at
  `/app/workflows/psychological-safety-check`, the respectful workplace policy
  (T13, widened to cover inclusion), the bystander intervention guide at
  `/app/knowledge/bystander-intervention`, and the wellness action plan (T44).

None of Pillar A is clinical, and it must not be described as though it were.
The flow triages what an employer should do next; it does not screen, assess
or diagnose anyone, and it says so.

That self-check is **not** an audit against CSA Z1003-13 and not a measure of
conformance with it. It is an original self-assessment organised around the
thirteen psychosocial factors the Standard names. Never describe it as
CSA-certified, CSA-compliant, or an assessment against the Standard.

The parental leave guide states no durations, notice periods or benefit
amounts, by design (§6). The same applies to the two Ring 4 guides: the pay
statement guide states no rates, maximums or thresholds, and the RRSP/TFSA
guide states no contribution limits, penalty rates or ages. Do not add figures
to any of the three.

The wellness action plan (T44) **requests no diagnosis and is not an
accommodation** — that is the claim to make, and it is narrower than it looks.
The template asks nothing about a condition and issues blank for the employee
to complete, but nothing stops someone volunteering health information in free
text, so a completed plan must not be described as guaranteed non-medical.
Treat every returned plan as sensitive personal information. It is filed under
`wellbeing` rather than `accommodation` because completing one implies neither
a disability nor a request.

**Ring 3, Internal Communications, is complete** — nine templates (T35–T43) in
Document Studio's Internal communications category, covering layoff and
restructuring, policy rollout, and crisis communications.

**Ring 4, Compensation & Financial Literacy, is complete** — the total
compensation summary (T45) and salary review letter (T46) in Document Studio's
Compensation category, the pay statement guide at `/app/knowledge/pay-statement`,
and the RRSP/TFSA guide at `/app/knowledge/retirement-savings`.

The RRSP/TFSA guide is **educational, not financial advice**, and that is the
claim to make about it. It explains how the two accounts are taxed and what a
group plan commits an employer to; it does not recommend an account, an amount
or an investment, and it says in its own copy that the employer is not the
reader's adviser. Never describe it, or the product, as offering financial
advice or financial planning.

The Compensation, Communications and Wellbeing modules are now on real
persistence (migrations 0039–0041) and are no longer gated. **They are still
not Rings 3 and 4** — a module and a ring share a name and nothing else. The
rings are the templates, guides and flows; the modules are org-scoped registers
in the app. Describe them separately, and `docs/FOUR_RING_FRAMEWORK.md` holds
the tool-by-tool state of the rings.

**Each production module is narrower than the demo it replaced, and the
differences are claims, not omissions.** State them plainly rather than letting
the old prototype set expectations:

- **Compensation states no market rate.** Dutiva has no salary-survey source.
  Comparison is against a band midpoint the employer enters themselves, and a
  record without one shows no comparison at all — never a 0%. Do not describe
  the product as benchmarking pay against market.
- **Communications performs no review of a message.** The prototype's
  tone / legal / clarity / policy chips are demo-only and are not persisted:
  nothing analyses a draft, so a stored "passed legal review" would be false.
  Marking a message sent **records** that the employer sent it — Dutiva has no
  delivery path and must never be described as sending communications.
- **Wellbeing records no information about individuals.** The prototype's
  per-person "support signals" with confidence and sensitivity ratings do not
  exist in production: `hr_wellbeing_initiatives` has no employee reference by
  design, and one must not be added. The module is a register of the support an
  employer offers. Never describe Dutiva as detecting, inferring or monitoring
  employee wellbeing, distress or health — it does none of those, and Ring 2 is
  built on the opposite commitment (see the non-clinical note above).

### 5. "Dutiva monitors the law and tells you when it changes"

**By severity this belongs second, right after the privacy claim** — it is kept
here only so the §2 cross-reference in Open items stays valid.

The monitoring exists and now runs on a schedule. A 2026-08-06 audit found
that **Federal change detection is confirmed working** — the first successful
sweep fetched both Justice Canada XML pages and baselined them. Ontario's
source serves a JavaScript shell whose statute text never reaches a
server-side fetch; Québec's refuses automated requests. Both remain
unavailable. The monitor sweeps 19 pages, but sweeping a page is not detecting
an amendment on it — and until 2026-07-30 the health data could not tell the
difference, because a blocked page answering HTTP 200 recorded as healthy.

Say what is true: Dutiva tracks official sources and surfaces changes **where
detection is confirmed**, and the product names which jurisdictions those are.
Do not say Dutiva will notify anyone of a change — nothing notifies; entries
land in a panel and wait to be read. Coverage is stated in
`monitoringCoverage.ts` and the audit is in `docs/LAW_MONITORING.md`; update
both in the same change when a source strategy lands.

### 6. Contact and brand

Publish **support@dutiva.ca** only; retire `info@`, `hello@`, `DutivaCanada@`. The
accent is **gold `#d4af37`**, not amber `#E8A020` — the Drive logo kit is already
correct, only its written description drifted.

## Positioning that holds up

From the **Beta Launch Brief (2026-07-20)** — decided 2026-08-06 (D5) as the
plan of record among the Drive business documents:

- **Differentiator:** Dutiva names the statute, not just the province.
- **Credibility:** built by a Canadian HR and payroll operator who has processed
  payroll, prepared ROEs and drafted termination letters across federal and
  provincial standards.
- **The boundary, never softened:** compliance-oriented workflow support, not legal
  advice.
- **Vocabulary:** "compliance-oriented", "jurisdiction-specific", "review-ready".
- **Never:** "legally compliant", "guaranteed compliant", "legal advice"; fabricated
  metrics; customer names without written permission; implied provincial coverage
  that doesn't exist.

CASL governs any outbound campaign — opt-in, burden of proving consent on the sender,
penalties to $10M. Follow the Beta Launch Brief on this.

## Open items

1. Confirm incorporation date, trademark status and business phone against filings.
2. Resolve the DigitalOcean residency ticket; update "Claims to stop making" §2.
3. ~~Decide the plan of record — two business plans are live, neither marked superseded.~~
   **Done 2026-08-10 (D5).** The Beta Launch Brief (2026-07-20) is the plan
   of record. The replacement privacy wording from §"Claims to stop making" 1
   was pasted into the Beta Launch Brief, and the other business plans in Drive
   were marked superseded.
4. Return T01/T02/T04 to the Drive `ON/EN` template folder, or flag them as out for
   legal review.
5. Deduplicate the Drive HR template tree — every template exists twice from two
   uploads on 2026-06-16.
