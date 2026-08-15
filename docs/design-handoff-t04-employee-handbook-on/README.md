# Handoff: T04 — Employee Handbook (Ontario)

## Overview

Source content for `T04` in the Document Studio template catalogue
(`src/features/app/documents/data/templates/t04-employee-handbook.ts`): a
fully drafted, English-only Ontario employee handbook — who we are & respect/
human rights, raising a concern, hours/pay/timekeeping, vacation & public
holidays, statutory leaves & sick time, remote work & disconnecting from
work, electronic monitoring, health/safety/wellbeing, harassment &
discrimination prevention, confidentiality & information security, employee
privacy, technology use, conflicts of interest, performance & discipline,
ending employment, protected reporting, and an acknowledgement/signature
block.

## Source file

- [`source/T04_Employee_Handbook_ON_EN_polished.docx.md`](source/T04_Employee_Handbook_ON_EN_polished.docx.md)
  — as supplied, unedited (Markdown, `{{snake_case}}` merge-field convention,
  English only).

## How it was applied

Ported into `t04-employee-handbook.ts`'s `preview` clause blocks (one per
numbered section) and a rebuilt `questions` wizard covering every merge
field. Departures from a literal transcription:

- **Jurisdiction narrowed to Ontario only** (`jurisdictions: ['ON']`), same
  approach as T01/T02 — Québec and federally regulated employers get their
  own jurisdiction-specific handbook templates rather than this one carrying
  conditional Ontario-only clauses.
- **No French source was supplied.** Every French string is **[FR
  self-authored]** — translated for this port, not machine-translated, and
  not yet checked against the English by a French-speaking legal reviewer.
- **`{{employer_legal_name}}` → `{{org}}`**, mapped onto the catalogue's
  existing computed token, consistent with T01/T02. `{{handbook_effective_date}}`
  was **kept as its own wizard question** rather than mapped to `{{today}}`:
  unlike an offer letter's or agreement's signing date, a handbook's
  effective date is a deliberate policy date (e.g. start of a fiscal year),
  not necessarily the day it is generated.
- **Acknowledgement block uses `ack` + a two-party `sig`** (Employer,
  Employee), not the single-party `ack`-only pattern used by the catalogue's
  other stand-alone policy templates (e.g. `T39`) — the source's own
  signature table shows both an employer and an employee signature line, so
  it was kept bilateral rather than narrowed to employee-only.

## Legal status

**This content has not been reviewed by counsel as part of this port.** As
with every template in the catalogue (see
`docs/design-handoff-hr-documents-library/README.md`'s "Fidelity" section),
clause text and statutory references are illustrative and must go through
qualified Canadian employment-law review — including the self-authored
French — before being used to generate a real document a customer can send.
