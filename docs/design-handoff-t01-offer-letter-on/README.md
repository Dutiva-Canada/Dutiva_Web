# Handoff: T01 — Offer of Employment Letter (Ontario, bilingual)

## Overview

Source content for `T01` in the Document Studio template catalogue
(`src/features/app/documents/data/templates/t01-offer-letter.ts`): a fully
drafted, bilingual (EN/FR) Ontario offer-of-employment letter, covering
employer information, role/start date/reporting, hours & overtime,
compensation & pay administration, variable compensation, benefits, vacation
& public holidays, statutory leaves & required workplace policies,
probationary period, confidentiality & IP, ending employment, temporary
layoff, conditions of the offer, governing documents & law, acceptance, and a
Schedule A job description.

## Source file

- [`source/T01_Offer_Letter_ON_Bilingual_EN_FR_polished.md`](source/T01_Offer_Letter_ON_Bilingual_EN_FR_polished.md)
  — as supplied, unedited (Markdown, `{{snake_case}}` merge-field convention).

## How it was applied

The full text was ported into `t01-offer-letter.ts`'s bilingual `preview`
clause blocks (one block per numbered section, EN/FR kept in lockstep) and
its `questions` wizard was rebuilt to cover every merge field in the letter.
Notable departures from a literal transcription:

- **Jurisdiction narrowed to Ontario only** (`jurisdictions: ['ON']`). The
  source is Ontario-specific (ESA references, Ontario overtime/vacation
  thresholds, `O. Reg.` citations); rather than have T01 carry conditional
  Ontario-only clauses, Québec and federally regulated employers get their
  own jurisdiction-specific offer-letter templates (see `T09` for Québec).
- **`{{employer_legal_name}}` → `{{org}}`, `{{document_date}}` → `{{today}}`**
  — mapped onto the catalogue's existing computed tokens
  (`engine.ts#computedTokens`) instead of adding new wizard questions, for
  consistency with every other template.
- **The disconnecting-from-work / electronic-monitoring policy disclosure**
  (source section 8's second paragraph) was split into its own clause block
  gated on `min_headcount: 25`, matching the ESA's actual 25-employee
  threshold for that written-policy duty (ESA s. 21.1.2 / s. 41.1.1), rather
  than always rendering it regardless of employer size.

## Legal status

**This content has not been reviewed by counsel as part of this port.** As
with every template in the catalogue (see
`docs/design-handoff-hr-documents-library/README.md`'s "Fidelity" section),
clause text and statutory references are illustrative and must go through
qualified Canadian employment-law review before being used to generate a
real document a customer can send.
