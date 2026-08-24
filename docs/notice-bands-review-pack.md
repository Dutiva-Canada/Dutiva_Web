# Statutory notice bands — legal review pack (QC and FED)

**Purpose.** `NOTICE_SCHEDULES` in
`src/features/app/advisor/safety/statutoryNotice.ts` is the table the Advisor and
Document Studio read so that a notice figure comes from a lookup rather than from
a model's memory. Ontario is populated from ESA s. 57. **Québec and Federal are
`bands: null`**, which makes the product hedge and point at the primary source
instead of stating a number.

This pack exists so that deciding whether to populate them is a reading job, not
a research project. **It does not populate them.** A qualified reviewer signs
that off — not an agent, and not the owner reading a summary. Sign-off blocks are
at the end.

**Read §1.6 and §2.3 — "what the table cannot express" — before the proposed
tables in §1.4 and §2.2.** The tables are the least important thing here. What a
flat `{ minMonths, weeks }` array _cannot_ express is where the risk lives, and in
Québec's case it is serious enough that "populate the table" may be the wrong
answer even though the bands themselves are perfectly clear.

**Provenance.** Every quotation below was read off the fetched official page,
never off a search snippet. Fetched 2026-08-04 from a workstation; the hosts that
refuse an automated user-agent (`legisquebec.gouv.qc.ca`) were fetched with a
browser UA. Whitespace introduced by HTML tag-stripping was normalized
(`82 .` → `82.`, `( 1 )` → `(1)`, `1 °` → `1°`); LégisQuébec renders each
amendment citation twice, and those were collapsed to the conventional single
form. **No word, number or punctuation mark was added, removed or reordered.**

---

## 1. Québec — Act respecting labour standards, s. 82

**Source.** `https://www.legisquebec.gouv.qc.ca/fr/document/lc/N-1.1` (French) and
the same document with `?langCont=en` (English). Both editions are stamped
**« À jour au 1er avril 2026 »** and **« Ce document a valeur officielle. »**
Fetched 2026-08-04.

> **Currency gap — confirm before signing.** The consolidation is ~4 months old
> at the date of this pack. A reviewer must confirm no amendment between
> 2026-04-01 and the sign-off date.

### 1.1 Which language edition governs

Worth stating precisely, because the common shorthand is wrong. The N-1.1 page
itself says **nothing** about French prevailing — it stamps _both_ editions
« Ce document a valeur officielle. » The rule lives in the Charter of the French
language (C-11):

> **C-11, s. 7(3):** "the French and English versions of the texts referred to in
> paragraphs 1 and 2 are **equally authoritative**"
>
> **C-11, s. 7.1:** "In the case of a discrepancy between the French and English
> versions of a statute … that cannot be properly resolved using the ordinary
> rules of interpretation, the French text shall prevail."

So: **equally authoritative, with French as a last-resort tiebreaker.** This
matters for §1.5 below — the ambiguity there is present _identically in both
editions_, so the tiebreaker cannot resolve it.

### 1.2 Section 82, verbatim

**English:**

> 82\. The employer must give written notice to an employee before terminating the
> employee's contract of employment or laying the employee off for six months or
> more.
>
> The notice shall be of one week if the employee is credited with less than one
> year of uninterrupted service, two weeks if the employee is credited with one
> year to five years of uninterrupted service, four weeks if the employee is
> credited with five years to ten years of uninterrupted service and eight weeks
> if the employee is credited with ten years or more of uninterrupted service.
>
> A notice of termination of employment given to an employee during the period
> when the employee is laid off is absolutely null, except in the case of
> employment that usually lasts for not more than six months each year due to the
> influence of the seasons.
>
> This section does not deprive an employee of a right granted to the employee
> under another Act.

**French:**

> 82\. Un employeur doit donner un avis écrit à une personne salariée avant de
> mettre fin à son contrat de travail ou de la mettre à pied pour six mois ou
> plus.
>
> Cet avis est d'une semaine si la personne salariée justifie de moins d'un an de
> service continu, de deux semaines si elle justifie d'un an à cinq ans de service
> continu, de quatre semaines si elle justifie de cinq à dix ans de service
> continu et de huit semaines si elle justifie de dix ans ou plus de service
> continu.
>
> L'avis de cessation d'emploi donné à une personne salariée pendant la période où
> elle a été mise à pied est nul de nullité absolue, sauf dans le cas d'un emploi
> dont la durée n'excède habituellement pas six mois à chaque année en raison de
> l'influence des saisons.
>
> Le présent article n'a pas pour effet de priver une personne salariée d'un droit
> qui lui est conféré par une autre loi.

**Note the fourth paragraph.** It is the hinge of §1.6.

### 1.3 Section 82.1 — the exclusions, verbatim

**This is the most important provision in the Québec half.** A band table that
omits it does not merely under-inform; it **affirmatively asserts an entitlement
in cases where the statute grants none.**

**English:**

> 82.1. Section 82 does not apply to an employee
>
> (1) who has less than three months of uninterrupted service;
>
> (2) whose contract for a fixed term or for a specific undertaking expires;
>
> (3) who has committed a serious fault;
>
> (4) for whom the end of the contract of employment or the layoff is a result of
> superior force.

**French:**

> 82.1. L'article 82 ne s'applique pas à l'égard d'une personne salariée:
>
> 1° qui ne justifie pas de trois mois de service continu;
>
> 2° dont le contrat pour une durée déterminée ou pour une entreprise déterminée
> expire;
>
> 3° qui a commis une faute grave;
>
> 4° dont la fin du contrat de travail ou la mise à pied résulte d'un cas de force
> majeure.

Only exclusion (1) is expressible as a tenure threshold. **(2), (3) and (4) are
facts about the termination, not about the employee's tenure, and no
`{ minMonths, weeks }` array can represent them.**

### 1.4 Proposed band table

```ts
// Québec — LNT s. 82, read with s. 82.1(1).
const QUEBEC_BANDS: NoticeBand[] = [
  { minMonths: 3, weeks: 1 }, // 3 months to < 1 year
  { minMonths: 12, weeks: 2 }, // 1 year to < 5 years
  { minMonths: 60, weeks: 4 }, // 5 years to < 10 years
  { minMonths: 120, weeks: 8 }, // 10 years or more
]
```

**Derivation, step by step:**

1. **Isolate the operative sentence.** Only the _second_ paragraph of s. 82 sets
   bands. Paragraphs 1, 3 and 4 set the trigger, a nullity rule and a savings
   clause.
2. **Four bands as drafted:** under 1 year → 1 week; 1–5 years → 2 weeks; 5–10
   years → 4 weeks; 10 years or more → 8 weeks.
3. **Years → months.** The statute uses whole years only (1, 5, 10), so the
   conversion is exact and lossless at ×12: 12, 60, 120. No rounding decision
   arises. (Contrast provinces that mix months and years in one ladder, where the
   conversion is where the bugs live — that hazard is absent here.)
4. **Below the lowest band — where s. 82 read alone gives the wrong answer.** On
   its face the first band applies from month 0: an employee with two weeks'
   service is "credited with less than one year" and would appear owed 1 week.
   **s. 82.1(1) removes them entirely.** So the lowest band starts at
   `minMonths: 3`, and tenure below 3 months must yield **zero weeks, not the
   lowest band**.

**The array is only correct under three preconditions it cannot state itself:**

1. The lookup rule is "highest band whose `minMonths` ≤ tenure".
2. Tenure below the lowest `minMonths` yields **0 weeks**, never the first band.
   Defaulting to the first band would be wrong under s. 82.1(1).
3. The output is labelled a statutory **floor**, not the entitlement — see §1.6.
   **Absent this, the table is affirmatively misleading in Québec in a way it is
   not in a common-law province.**

### 1.5 The statute is ambiguous at exactly 5 and 10 years

Flagged rather than smoothed over. "one year to **five** years" and "**five**
years to ten years" both literally include the 5-year point; "five years to
**ten** years" and "**ten** years or more" both literally include the 10-year
point.

The French is identically overlapping (« d'un an à cinq ans » / « de cinq à dix
ans » / « de dix ans ou plus »), so **the C-11 s. 7.1 tiebreaker does not help** —
there is no divergence between editions; the ambiguity sits in both.

The overlap is resolved only by CNESST's administrative interpretation, which
gives the **higher** band at each boundary:

> **CNESST Interpretation Guide, s. 82 — "Length of notice":** "less than three
> months – no prior notice; three months to less than one year – one week; one
> year to less than five years – two weeks; five years to less than 10 years –
> four weeks; ten years or more – eight weeks."

This is an **administrative interpretation, not binding law**, and the CNESST
guide reproduces the pre-2022 wording of s. 82. The proposed table adopts its
resolution. **A reviewer unwilling to rest a product output on a non-binding
administrative reading should refuse the table at the boundary values**, or
require the product to hedge at exactly 5 and 10 years.

### 1.6 What the table cannot express — read this before section 1.4

**(a) Civil Code art. 2091 sits on top, and it is non-renounceable.** This is the
biggest practical gap in any Québec band table. s. 82 ¶4 expressly preserves
rights under other Acts, and the Act that matters is the Civil Code:

> **CCQ 2091:** "Either party to a contract for an indeterminate term may
> terminate it by giving notice of termination to the other party. The notice of
> termination shall be given in **reasonable time**, taking into account, in
> particular, the nature of the employment, the specific circumstances in which
> it is carried on and the duration of the period of work."

---

> **CCQ 2092:** "The employee **may not renounce** his right to obtain an
> indemnity for any injury he suffers where insufficient notice of termination is
> given…"

Reasonable notice is routinely **far longer** than the 8-week statutory ceiling
for a long-service or senior employee, and CNESST's own guide states s. 82 is not
an exclusive recourse. **Presenting the s. 82 band as "the notice a Québec
employee gets" is materially misleading.** It is a floor.

**(b) Senior managerial personnel have no s. 82 entitlement at all, and s. 82
does not say so.** LNT s. 3 removes whole classes from the Act with a carve-back
list of standards that still apply. **Division VI (ss. 82–84) is not in that
carve-back list.** So s. 3(6) _senior managerial personnel_ (cadres supérieurs)
and s. 3(3) construction-industry employees under R-20 are outside s. 82
entirely. Nothing in s. 82 or s. 82.1 signposts this.

**(c) "Uninterrupted service" is a defined term, not elapsed tenure.**

> **s. 1(12):** "'uninterrupted service' means the uninterrupted period during
> which the employee is bound to the employer by a contract of employment, **even
> if the performance of work has been interrupted without cancellation of the
> contract**, and the period during which fixed term contracts succeed one another
> without an interruption that would … give cause to conclude that the contract
> was not renewed."

A naïve `today − hire_date` can **understate** the entitlement. And **s. 97**
preserves service across a sale, concession or restructuring — so a tenure figure
read from a post-transaction HRIS record may be wrong.

**(d) The indemnity is not simply "weeks × weekly wage".** s. 83 measures it as
the "regular wage **excluding overtime**", and its third paragraph imposes a
special averaging rule for commission-remunerated employees (average weekly wage
over the complete pay periods in the three preceding months). A weeks-only table
cannot express that.

**(e) Recall privileges displace the outcome.** s. 83.1: where a collective
agreement gives recall privileges beyond six months, the indemnity is deferred to
the earlier of expiry of recall privileges or one year after layoff — and in two
cases the employee gets **nothing**.

**(f) Collective dismissal can exceed the band.** Division VI.0.1
(ss. 84.0.1–84.0.15): 10+ employees of one establishment in two consecutive
months. Employer notice to the Minister is 8/12/16 weeks by headcount and is
**separate from and additional to** s. 82. s. 84.0.2 carries **its own exclusion
list, which differs from s. 82.1** (drops "superior force"; adds Public Service
Act s. 83 employees). s. 84.0.14 forbids cumulating the s. 83 and s. 84.0.13
indemnities and gives the employee the **greater**. So in a collective dismissal
a table showing only the s. 82 band **understates** what is owed.

---

## 2. Federal — Canada Labour Code, s. 230

**Source.** `https://laws-lois.justice.gc.ca/eng/acts/L-2/section-230.html` and
`.../fra/lois/L-2/section-230.html`. **Act current to 2026-06-14, last amended
2025-12-12.** Section history: R.S., 1985, c. L-2, s. 230; 2018, c. 27, s. 485;
2024, c. 17, s. 249. The band table appears in the consolidated body and **not**
on the "Amendments not in force" page, so it is in force. Fetched 2026-08-04.

### 2.1 Section 230(1.1), verbatim — the actual band table

A previous automated read summarized this as "two to eight weeks with incremental
increases", which obscured both the three-month floor and the **gap between three
months and three years**. The real text:

**English:**

> (1.1) The applicable number of weeks for the purposes of subsections (1) and (2)
> is
>
> (a) two weeks, if the employee has completed at least three consecutive months
> of continuous employment with the employer;
>
> (b) three weeks, if the employee has completed at least three consecutive years
> of continuous employment with the employer;
>
> (c) four weeks, if the employee has completed at least four consecutive years of
> continuous employment with the employer;
>
> (d) five weeks, if the employee has completed at least five consecutive years of
> continuous employment with the employer;
>
> (e) six weeks, if the employee has completed at least six consecutive years of
> continuous employment with the employer;
>
> (f) seven weeks, if the employee has completed at least seven consecutive years
> of continuous employment with the employer;
>
> (g) eight weeks, if the employee has completed at least eight consecutive years
> of continuous employment with the employer.

**French:**

> (1.1) Pour l'application des paragraphes (1) et (2), le nombre de semaines est
> de :
>
> a) deux, dans le cas où l'employé travaille sans interruption pour l'employeur
> depuis au moins trois mois;
>
> b) trois, dans le cas où l'employé travaille sans interruption pour l'employeur
> depuis au moins trois ans;
>
> c) quatre, … depuis au moins quatre ans;
>
> d) cinq, … depuis au moins cinq ans;
>
> e) six, … depuis au moins six ans;
>
> f) sept, … depuis au moins sept ans;
>
> g) huit, … depuis au moins huit ans.

**Drafting note for a bilingual reviewer.** The French uses a present-continuous
formula ("travaille sans interruption … depuis au moins X") where the English uses
a completed-tenure formula ("has completed at least X consecutive …"). Both
editions are equally authoritative; **the English "completed" wording is the one
that maps directly onto a minimum-completed-tenure field**, which is what
`minMonths` is.

### 2.2 Proposed band table

```ts
// Federal — Canada Labour Code s. 230(1.1).
const FEDERAL_BANDS: NoticeBand[] = [
  { minMonths: 3, weeks: 2 }, // at least 3 consecutive months
  { minMonths: 36, weeks: 3 }, // at least 3 consecutive years
  { minMonths: 48, weeks: 4 },
  { minMonths: 60, weeks: 5 },
  { minMonths: 72, weeks: 6 },
  { minMonths: 84, weeks: 7 },
  { minMonths: 96, weeks: 8 }, // 8+ years (statutory maximum)
]
```

**Derivation:** (a) is already in months → `{3, 2}`. (b)–(g) are whole years →
×12 → 36, 48, 60, 72, 84, 96. No rounding decision arises.

**This one is materially cleaner than Québec's.** Every threshold is drafted as
"at least X", so there is **no boundary ambiguity** — the 5-and-10-year problem in
§1.5 has no federal counterpart. Below 3 months the section simply does not
apply, yielding 0 weeks.

**Note the shape:** there is no band between 3 months and 3 years (an employee at
2 years 11 months gets 2 weeks, the same as at 3 months), and none above 8 years.

### 2.3 What the table cannot express

**(a) The only Division X exclusion is just cause.**

> **s. 229.1:** "This Division does not apply to an employee whose termination of
> employment is by way of dismissal for just cause."
> **[FR]** "La présente section ne s'applique pas en cas de congédiement justifié."

Nothing else in Division X excludes any class of employee — a much simpler picture
than Québec's s. 3 / s. 82.1 pair.

**(b) Severance (s. 235) is cumulative with notice, not an alternative.** Separate
Division, separate threshold (**12** consecutive months vs 3), separate unit:

> **s. 235(1):** "An employer who terminates the employment of an employee who has
> completed twelve consecutive months of continuous employment … shall, except
> where the termination is by way of dismissal for just cause, pay to the employee
> the greater of (a) **two days wages** … in respect of **each completed year of
> employment** …, and (b) **five days wages** …"

**s. 235 has no ceiling.** It keeps growing at two days per completed year
indefinitely, where notice caps at 8 weeks. Nothing offsets one against the other,
and s. 230(2.2) requires the termination statement to itemise "vacation benefits,
wages, **severance pay** and any other benefits and pay" as distinct heads.
**A product that reports only the s. 230 band understates the federal exposure for
anyone past 12 months.**

**(c) Group termination currently ADDS to individual notice.**

> **s. 212(1):** "… shall, **in addition to any notice required to be given under
> section 230**, give notice to the Head, in writing, … at least 16 weeks before …"
>
> **[FR, more explicit still]** "La transmission de cet avis **ne dispense pas** de
> l'obligation de donner le préavis mentionné à l'article 230."

Trigger: 50+ employees in one industrial establishment, simultaneously or within
any period not exceeding four weeks.

> ### ⚠ The highest-value finding in this pack, and the easiest to miss
>
> **2018, c. 27, ss. 479–484 are enacted but NOT YET IN FORCE** as of the
> 2026-06-14 consolidation. When they come into force they would:
>
> 1. create a new **s. 212.1** giving each redundant employee in a group
>    termination an individual entitlement of **at least eight weeks** (or longer,
>    to the end of the group notice period); and
> 2. **replace s. 229.1** so that Division X — and therefore **the entire
>    s. 230(1.1) band table** — _does not apply_ to a redundant employee to whom
>    s. 212.1(1) applies:
>
> > **2018, c. 27, s. 484:** "Section 229.1 of the Act is replaced by the
> > following: **229.1** This Division does not apply to an employee (a) who is a
> > **redundant employee to whom subsection 212.1(1) applies**; or (b) whose
> > termination of employment is by way of dismissal for just cause."
>
> In other words the current rule — _group notice adds to individual notice_ —
> **flips to** _group termination displaces the individual band table, with an
> 8-week floor_. Any federal band table shipped today will become wrong for group
> terminations on the day those provisions are proclaimed, **silently**, because
> nothing in the in-force consolidated text will change shape.
>
> **If the federal table is approved, this needs a monitoring commitment attached
> to it**, not just a sign-off.

**(d) Regulation deferrals.** Every one is to the **Canada Labour Standards
Regulations, C.R.C., c. 986** (current to 2026-06-14). Division X defers via
s. 230(3) ("Except where otherwise prescribed by regulation") and s. 233;
Division XI via s. 235(2)(a) and s. 236; Division IX via s. 212(1), s. 212(3)(c),
s. 212(4) and s. 227. Notably **CLSR s. 28 exempts seasonal and irregular-basis
employees from Division IX only** (group termination) — it does **not** exempt
them from Division X notice or Division XI severance, which is easy to get wrong.

---

## 3. L7 — Ontario ESA s. 64 severance: flagged, not computed

Document Studio flags ESA severance rather than computing it, because eligibility
turns on a payroll threshold the wizard does not collect and there is no reviewed
severance schedule to read against.

> **Sourcing caveat, stated plainly.** Unlike §1 and §2, the operative statutory
> text below **could not be quoted verbatim from the consolidated statute.**
> Ontario's e-Laws serves statute text through a client-side application: a plain
> fetch of `ontario.ca/laws/statute/00e41` returns a shell, and `/print`, a
> version-pinned URL and an `Accept: application/xml` request all return the same
> shell with zero occurrences of "severance". (This independently confirms the
> sourcing finding behind TODO.md EF2.) The substance below is from **ontario.ca's
> own official ESA guide** — a Government of Ontario page, not a secondary
> commentator — page _Updated March 18, 2026_. **A reviewer must confirm the
> wording against ss. 63–65 of the statute itself before relying on it.**

### 3.1 The eligibility test

Two conditions, both required:

1. **Five or more years** of employment with the employer; **and**
2. one of two employer conditions — "a **global payroll of at least $2.5
   million**", **or** the employer "severed the employment of **50 or more
   employees in a six-month period** because all or part of the business
   permanently closed".

**Calculation:** "the employee's regular wages for a regular work week" ×
(completed years of employment + completed months in the incomplete final year ÷
12). **Maximum: 26 weeks.**

**Exclusions** (each a fact about the termination or the role, not about tenure):
refusing reasonable alternative employment; retiring on a full pension; employment
in construction or on-site building maintenance; wilful misconduct; and where
performance of the contract becomes impossible.

### 3.2 Why this does not fit `NOTICE_SCHEDULES` at all

The `{ minMonths, weeks }` shape encodes _tenure → weeks_. ESA severance is not
that function:

- **It is not banded.** It is continuous and proportional — years plus months/12 —
  so there is no ladder to encode. A faithful representation is a **formula**, not
  a table.
- **The gate is not tenure.** The $2.5M payroll test is a property of the
  _employer_, and the 50-employees-in-six-months test is a property of the
  _event_. Neither is derivable from an employee's tenure.
- **The 26-week cap** is a ceiling on the computed figure, which the existing
  shape has no field for.

Adding it to `NOTICE_SCHEDULES` would therefore mean changing the type, not
adding a row.

### 3.3 The three options, concretely

**Option A — collect the payroll figure and compute.**

- _Field:_ employer global annual payroll, in CAD, as a single organization-level
  value. It belongs in **organization settings, not the termination wizard** — it
  is a property of the employer that is identical for every termination, and
  asking it per-document invites inconsistent answers to the same question.
- _Also needed:_ a rolling count of employments severed in the trailing six months
  due to a permanent closure, to evaluate the second limb. This one is genuinely
  hard — the product does not track terminations it did not generate.
- _Type change:_ a `SeveranceFormula` alongside `NoticeBand`, carrying
  `weeksPerYear: 1`, `prorateIncompleteYear: true`, `maxWeeks: 26`.
- _Risk:_ a wrong payroll figure silently produces a wrong entitlement with no
  visible failure. The current flag has no such failure mode.

**Option B — collect payroll, gate eligibility only, still do not compute.**
Answers "does this employee likely qualify?" without stating a number. Strictly
more useful than today at a fraction of Option A's risk.

**Option C — severance stays a flag.** _This is a defensible answer, not a
failure._ The wizard says severance may be owed, states the two conditions in
plain language, and points at the ESA. **What stays true:** the product never
states a severance figure, so it can never state a wrong one; the 26-week cap and
the payroll threshold never need maintaining; and the Ontario notice table
(s. 57) is unaffected either way, since notice and severance are separate
entitlements.

**Recommendation for the reviewer to accept or reject:** **B**, with A deferred
until the second limb (50 employees / permanent closure) can be answered from real
data rather than a self-report. C remains correct if the review budget is better
spent elsewhere — per `FOUR_RING_FRAMEWORK.md`, legal content costs review time,
not just engineering time.

---

## 4. Sign-off

Populating a jurisdiction requires an explicit **yes** below. Absent a yes, the
code stays `bands: null` and the product keeps hedging, which is the correct
failure mode.

**Reviewer:** ______________________ **Qualification:** ______________________

**Date:** ______________________

### Québec (LNT s. 82)

- [ ] **Yes** — populate `QUEBEC_BANDS` as proposed in §1.4.
- [x] **No** — leave `bands: null`. Reason: **Interim product decision (2026-08-23)** — CCQ art. 2091 reasonable notice makes a flat band table misleading; qualified legal reviewer has not signed. Hard UI hedges remain — see [notice-bands-decision.md](notice-bands-decision.md).

### Federal (CLC s. 230)

- [ ] **Yes** — populate `FEDERAL_BANDS` as proposed in §2.2.
- [x] **No** — leave `bands: null`. Reason: **Interim product decision (2026-08-23)** — s. 235 severance and pending 2018 c. 27 proclamation; qualified legal reviewer has not signed. Hard UI hedges remain — see [notice-bands-decision.md](notice-bands-decision.md).

### Ontario severance (ESA s. 64) — L7

- [ ] **A** — collect payroll and compute
- [ ] **B** — collect payroll, gate eligibility only _(recommended)_
- [ ] **C** — severance stays a flag

_Confirm:_ the §3 sourcing caveat — the statutory wording was taken from
ontario.ca's official ESA guide, **not** quoted from ss. 63–65, and needs checking
against the statute.

---

### What this pack does not do

- **It does not change any code.** `NOTICE_SCHEDULES` is untouched; QC and FED
  remain `bands: null`, and the test asserting the product never reports "below"
  in those jurisdictions still passes.
- **It is not legal advice** and does not substitute for the reviewer's own read
  of the primary sources, all of which are linked above.
- **It does not resolve the Québec boundary ambiguity** — it surfaces it and
  adopts CNESST's reading provisionally, for the reviewer to accept or refuse.
- **It does not quote ESA ss. 63–65** — see the §3 caveat.
- **It does not cover common-law reasonable notice** for the federal or Ontario
  jurisdictions, nor Québec's art. 2091 beyond flagging that it exists and
  displaces the significance of the statutory floor.
