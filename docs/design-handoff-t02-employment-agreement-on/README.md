# Handoff: T02 — Employment Agreement (Ontario)

## Overview

Source content for `T02` in the Document Studio template catalogue
(`src/features/app/documents/data/templates/t02-employment-agreement.ts`): a
fully drafted, English-only Ontario employment agreement — probationary
period, place of work/hours/overtime, compensation, vacation, benefits,
statutory leaves & accommodation, confidentiality, intellectual property,
policies, restrictive covenants, ending employment (resignation, without-cause
termination, statutory-misconduct termination, release, plans), temporary
layoff, human rights/health & safety, entire agreement, severability,
governing law, independent legal advice, a Schedule A job description and a
conditional Schedule B enhanced-termination schedule.

## Source file

- [`source/T02_Employment_Agreement_ON_EN_polished.docx.md`](source/T02_Employment_Agreement_ON_EN_polished.docx.md)
  — as supplied, unedited (Markdown, `{{snake_case}}` merge-field convention,
  English only).

## How it was applied

Ported into `t02-employment-agreement.ts`'s `preview` clause blocks (one per
numbered section) and a rebuilt `questions` wizard covering every merge
field. Departures from a literal transcription:

- **Jurisdiction narrowed to Ontario only** (`jurisdictions: ['ON']`), same
  approach as T01 — Québec and federally regulated employers get their own
  jurisdiction-specific agreement templates rather than this one carrying
  conditional Ontario-only clauses.
- **No French source was supplied.** Every French string in the template is
  **[FR self-authored]** — translated for this port, not machine-translated,
  and it has not been checked against the English by a French-speaking legal
  reviewer. Flag this alongside the English for review.
- **`{{employer_legal_name}}` → `{{org}}`, `{{agreement_date}}` → `{{today}}`**
  — mapped onto the catalogue's existing computed tokens
  (`engine.ts#computedTokens`), consistent with T01 and the rest of the
  catalogue.
- **Two internal cross-reference numbers in the source were corrected**
  rather than transcribed as errors:
  - Section 1 (probationary period) told the reader that post-probation
    termination entitlements are "governed entirely by the termination
    provisions set out in Section 12" — but Section 12 in the source is
    Temporary Layoff, not Ending Employment (Section 11). Corrected to
    "Section 11".
  - Section 14 (entire agreement) exempted "policy amendments made in
    accordance with Section 10" from the writing/signature requirement — but
    Section 10 in the source is Restrictive Covenants; policy amendments are
    Section 9 (Policies). Corrected to "Section 9".
  - Section 12 (temporary layoff) itself also referenced "section 12" for a
    layoff-that-becomes-termination's entitlements; corrected to the section
    that actually sets them out (11).
- **Schedule B (additional contractual termination entitlement) is
  conditionally gated**, not always rendered: a new wizard question
  (`has_enhanced_termination`, yes/no) drives an `answer` gate on the
  Schedule B block, using the same conditional-clause pattern as `T40`'s
  acknowledgement gate — the source's own instruction ("complete this
  schedule only if...") is a gate, not prose to render unconditionally.
- **No case-law citations were added.** The source cites only statutes (ESA,
  Ontario Human Rights Code, Occupational Health and Safety Act); unlike the
  template this replaced, no *Waksdale*/*McKinley*/*Meiorin* citations were
  carried over, since they were not part of the supplied content.
- **Sample fixture updated**: `src/features/app/documents/data/documents.ts`'s
  `doc_002` previously depicted a Québec employee (Léa Tremblay) receiving a
  T02 document; since T02 is now Ontario-only, the fixture was moved to an
  Ontario employee (Grace Osei) with jurisdiction `ON` and answer keys
  matching the new question schema.

## Legal status

**This content has not been reviewed by counsel as part of this port.** As
with every template in the catalogue (see
`docs/design-handoff-hr-documents-library/README.md`'s "Fidelity" section),
clause text and statutory references are illustrative and must go through
qualified Canadian employment-law review — including the self-authored
French — before being used to generate a real document a customer can send.
