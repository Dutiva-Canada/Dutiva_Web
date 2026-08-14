# Source and Citation Requirements

## Purpose

The products must never fabricate Canadian law, regulations, government requirements, deadlines, or rights. This document defines how the AI and deterministic systems retrieve, cite, and present authoritative sources.

---

## Source hierarchy

See also `architecture/knowledge-architecture.md`. The hierarchy, from most to least authoritative:

1. Government legislation and regulations.
2. Official government agencies.
3. Courts and tribunals.
4. Official regulatory bodies.
5. Official public guidance.
6. Other authoritative sources.
7. Secondary sources (clearly labeled).

`SOURCE-REQ-001`: The AI SHALL prefer sources 1–5 for any factual claim about Canadian law, rights, deadlines, or procedures.

`SOURCE-REQ-002`: Secondary sources SHALL be labeled as such and SHALL NOT be presented as legal basis.

---

## Retrieval requirements

`SOURCE-REQ-003`: The AI SHALL retrieve vetted knowledge items by ID rather than recalling facts from its parametric memory.

`SOURCE-REQ-004`: Retrieved items SHALL be checked for:

- jurisdiction match;
- effective date currency;
- review status (`valid`, `needs_review`, `superseded`);
- topic alignment.

`SOURCE-REQ-005`: Items marked `needs_review` or `superseded` SHALL NOT be presented as authoritative legal basis. They MAY be surfaced as "under review" or "superseded."

`SOURCE-REQ-006`: If no vetted item is available for a question, the AI SHALL say so rather than generate a plausible answer.

---

## Citation format

`SOURCE-REQ-007`: Citations SHALL be readable by non-lawyers and SHALL include:

- source title (statute, regulation, agency, court);
- jurisdiction;
- section or reference where applicable;
- URL or identifier where available;
- effective date or last-reviewed date.

`SOURCE-REQ-008`: Statute names SHALL be presented in the official language of the jurisdiction's legal tradition:

- Ontario English text: *Employment Standards Act, 2000*, S.O. 2000, c. 41.
- Québec French text: *Loi sur les normes du travail*, RLRQ c. N-1.1.
- Federal bilingual: Canada Labour Code, Part III / *Code canadien du travail, partie III*.

`SOURCE-REQ-009`: Citations in French SHALL use French legal citation conventions.

`SOURCE-REQ-010`: URLs SHALL be stable and point to official government sources where possible.

---

## What may be cited

`SOURCE-REQ-011`: The AI and deterministic systems MAY cite:

- general procedural requirements (e.g., notice must be in writing);
- the name of the statute that governs a matter;
- the existence of a government agency or tribunal;
- the shape of a rule (e.g., "the statute sets minimum notice based on length of service");
- where to find official figures or deadlines (e.g., "the amount is indexed annually — check the official table on [agency website]").

`SOURCE-REQ-012`: The AI and deterministic systems SHALL NOT cite:

- specific statutory figures, deadlines, or dollar amounts unless they are in a vetted lookup table with an effective date;
- unverified secondary sources as authoritative;
- a statute section the system has not verified exists and is current;
- invented or hallucinated sources.

---

## Presenting uncertainty

`SOURCE-REQ-013`: When a source is ambiguous, conflicting, or incomplete, the system SHALL:

- state the ambiguity;
- present the competing interpretations if they are sourced;
- recommend verifying with the official source or a qualified professional;
- not choose an interpretation silently.

`SOURCE-REQ-014`: When the law is unsettled or varies by municipality, the system SHALL name the level of government and direct the user to the local authority.

---

## Web sources (current-info mode)

`SOURCE-REQ-015`: For questions about recent changes ("what changed this year"), the system MAY retrieve live web sources but SHALL:

- rank them by authority;
- present them as provisional, not as legal basis;
- tell the user to verify against the official statute before acting;
- carry a lower confidence label.

`SOURCE-REQ-016`: Live web sources SHALL NOT be used as a substitute for vetted knowledge when the vetted knowledge is available.

---

## Citation in generated documents

`SOURCE-REQ-017`: Generated documents MAY include a statutory references section if the template provides one.

`SOURCE-REQ-018`: Any statutory reference in a generated document SHALL be drawn from the vetted knowledge base and SHALL include the source identifier and effective date.

`SOURCE-REQ-019`: If a citation in a generated document becomes outdated, the system SHALL mark the document version as referencing a superseded source and SHALL NOT auto-update the rendered document.

---

## Human review

`SOURCE-REQ-020`: Knowledge items involving statutory figures, deadlines, or rights SHALL be reviewed by a qualified Canadian lawyer or the relevant authority before being marked `valid`.

`SOURCE-REQ-021`: A regular review cadence SHALL be established, and outdated items SHALL be flagged for re-review.

`SOURCE-REQ-022`: Disputes about source interpretation SHALL be escalated to the legal reviewer or knowledge owner.

---

## Provenance metadata

`SOURCE-REQ-023`: Every citation used in a user-facing answer, document, or workflow SHALL be recorded with:

- knowledge item ID;
- source title and URL;
- jurisdiction;
- effective date;
- last-reviewed date;
- review status.

`SOURCE-REQ-024`: Provenance metadata SHALL be available for internal review and, where appropriate, surfaced to the user as "Source: ..." links.
