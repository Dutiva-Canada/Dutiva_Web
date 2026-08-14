# Bilingual Requirements

## Principle

English and French are first-class product languages. Every user-facing string ships as an `{ en, fr }` pair. No feature ships with English-only copy. French legal terminology SHALL be reviewed for Québec appropriateness; word-for-word translation of English legal content is not sufficient.

---

## Translation strategy

`BIL-REQ-003`: The source of truth for user-facing strings SHALL be a bilingual message catalogue (`{ en, fr }`) defined in a single place, not duplicated inline.

`BIL-REQ-004`: French translations SHALL come from:

1. a design handoff or product spec that includes French content; or
2. a human-reviewed translation workflow led by a French-speaking content owner; or
3. in the absence of either, be marked `[FR self-authored]` at the definition site and flagged for review.

`BIL-REQ-005`: Machine translation SHALL NOT be silently applied over an existing prototype or reviewed string.

`BIL-REQ-006`: Bilingual parity SHALL be enforced structurally: a key SHALL have both `en` and `fr` values, and type checks SHALL fail if either is missing.

---

## Source language handling

`BIL-REQ-007`: The user-facing application SHALL support two locale modes:

- `en-CA` — Canadian English;
- `fr-CA` — Canadian French.

`BIL-REQ-008`: Marketing pages SHOULD be language-scoped by URL (e.g., English at root, French under `/fr`) for SEO, similar to Dutiva's `src/seo/routes.ts` pattern.

`BIL-REQ-009`: The authenticated application surface SHALL follow a persisted language preference (`dutiva-lang` or equivalent) and SHALL update `<html lang>` accordingly.

`BIL-REQ-010`: The language toggle SHALL be available on every screen and SHALL persist the choice.

`BIL-REQ-011`: Deep links to content SHALL preserve language state.

---

## French legal terminology

`BIL-REQ-012`: French legal and administrative terminology SHALL be accurate for a Canadian French audience, with particular attention to Québec civil-law and administrative-law terms.

`BIL-REQ-013`: Statute names SHALL be presented in their official French form when referencing Québec or federal French texts (e.g., *Loi sur les normes du travail*, *Code du travail*, *Charte québécoise des droits et libertés de la personne*).

`BIL-REQ-014`: Terms with no direct equivalent SHALL be handled by a controlled glossary and SHALL NOT be invented by machine translation.

`BIL-REQ-015`: A French terminology review SHALL be part of the definition of done for any feature touching legal, jurisdictional, or document-generation content.

---

## Québec-specific terminology

`BIL-REQ-016`: Where a term differs between Canadian French and international French, the Québec usage SHALL be preferred for Canadian users.

`BIL-REQ-017`: Government agency names SHALL use their official Québec/Canadian French names (e.g., CNESST, Régie du logement/ Tribunal administratif du logement, Service Canada, ARC/CRA).

`BIL-REQ-018`: The system SHALL avoid assuming that a term or phrase acceptable in European French is appropriate for Canadian legal contexts.

---

## Bilingual document generation

`BIL-REQ-019`: Every document template SHALL have a French-language version.

`BIL-REQ-020`: The language of a generated document SHALL be selectable at generation time and SHALL default to the user's current language preference.

`BIL-REQ-021`: A generated document SHALL be entirely in one language; mixing English and French within a document SHALL be avoided except for bilingual proper names, official titles, or statutory references.

`BIL-REQ-022`: Jurisdiction-specific clauses in French SHALL be reviewed by a French-speaking legal reviewer where they reference statutes or procedural requirements.

`BIL-REQ-023`: Document metadata (filename, export watermark, disclaimer) SHALL be localized to the document's language.

---

## Language consistency

`BIL-REQ-024`: The active language SHALL be consistent within a screen, a message, a document, and an AI response, except where deliberately presenting a bilingual proper name or citation.

`BIL-REQ-025`: The system SHALL NOT switch languages automatically based on detected content (e.g., a document mentioning a French name) unless the user explicitly changes language.

`BIL-REQ-026`: Error messages, empty states, loading states, and confirmation dialogs SHALL be fully bilingual.

---

## Locale handling

`BIL-REQ-027`: Date formats SHALL follow the active locale:

- `en-CA`: "August 14, 2026" or "2026-08-14";
- `fr-CA`: "14 août 2026".

`BIL-REQ-028`: First day of the week, calendar formats, and number formats SHALL follow Canadian conventions for the active locale.

`BIL-REQ-029`: Currency SHALL be displayed in Canadian dollars with the appropriate symbol and formatting:

- `en-CA`: "$1,234.56 CAD";
- `fr-CA`: "1 234,56 $ CA" or "1 234,56 $".

`BIL-REQ-030`: The system SHALL not hardcode locale assumptions in business logic (e.g., deadline arithmetic SHALL use Canadian statutory holidays for the relevant jurisdiction, not U.S. holidays).

---

## Government terminology

`BIL-REQ-031`: Federal government program and agency names SHALL be presented bilingually or in the official language of the relevant statute, with the other language available on demand where appropriate.

`BIL-REQ-032`: Provincial/territorial agency names SHALL be presented in the official language(s) of that jurisdiction.

---

## Document templates and knowledge base

`BIL-REQ-033`: Document templates, knowledge items, and workflow copy SHALL be authored as bilingual pairs from the start; retrofitting French after the fact is not acceptable.

`BIL-REQ-034`: Template updates SHALL be applied to both languages simultaneously to prevent drift.

`BIL-REQ-035`: A bilingual review SHALL be required before marking any template or knowledge item as `approved_for_use` or equivalent.

---

## Quality assurance

`BIL-REQ-036`: Automated tests SHALL verify that every user-facing string key has both `en` and `fr` values and that no untranslated keys are shipped.

`BIL-REQ-037`: Screens and generated documents SHALL be reviewed in both languages and both light/dark themes before release.

`BIL-REQ-038`: Any string marked `[FR self-authored]` SHALL be flagged for human review before launch.
