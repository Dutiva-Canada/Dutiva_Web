# Jurisdiction Model

## Purpose

The products must never assume that a Canadian rule applies nationally merely because it applies in one province or territory. This document establishes a jurisdiction hierarchy and a resolution strategy for determining which legal and administrative rules apply to a user's situation.

---

## Jurisdiction hierarchy

```text
Canada
├── Federal
├── Ontario (ON)
├── Québec (QC)
├── British Columbia (BC)
├── Alberta (AB)
├── Saskatchewan (SK)
├── Manitoba (MB)
├── New Brunswick (NB)
├── Nova Scotia (NS)
├── Prince Edward Island (PE)
├── Newfoundland and Labrador (NL)
├── Yukon (YT)
├── Northwest Territories (NT)
└── Nunavut (NU)
```

For many situations, the hierarchy continues:

```text
Federal
→ Province / Territory
→ Municipality / Local authority
→ Regulator or tribunal with situation-specific authority
→ Employer / landlord / service-provider contractual rules
```

---

## Jurisdiction types

| Type | Examples | Role in the product |
|---|---|---|
| **Federal** | Parliament, Government of Canada, Service Canada, CRA, federally regulated industries | Employment, tax, immigration, bankruptcy, telecommunications, banking, transportation, criminal law, some consumer matters. |
| **Province / Territory** | Ontario, Québec, British Columbia, Nunavut | Employment standards, tenancy, most consumer protection, family law, estate administration basics, motor vehicles, health care. |
| **Municipality / Local authority** | City, regional municipality, band council | Property tax, zoning, transit, noise bylaws, landlord licensing, business permits. |
| **Regulator / Tribunal** | LTB, CNESST, Employment Standards office, CRTC, CCTS | Complaint handling, dispute resolution, licensing, enforcement. |
| **Contractual / Organizational** | Lease, employment contract, union agreement, service terms | May override or supplement statutory defaults; product must flag "check your specific contract." |

---

## Jurisdiction resolution strategy

`SHARED-REQ-001`: The system SHALL start from the assumption that jurisdiction is **unknown** and SHALL NOT infer a province/territory or federal scope from a single clue.

`SHARED-REQ-002`: The system SHALL ask the user to confirm the jurisdiction relevant to the situation.

`SHARED-REQ-003`: The system MAY suggest a jurisdiction based on:

- the user's profile home jurisdiction;
- the address of the other party (employer, landlord, service provider);
- the location where the event took place;
- explicit keywords (e.g., "I work for a bank" may suggest federal, but must be confirmed).

Any suggestion SHALL be presented for confirmation, not applied silently.

`SHARED-REQ-004`: When a situation may involve more than one jurisdiction, the system SHALL:

- list the possibly relevant jurisdictions;
- explain the difference briefly;
- ask the user to confirm which applies or flag the matter as multi-jurisdiction.

`SHARED-REQ-005`: The system SHALL NOT present province/territory-specific statutory figures, deadlines, or rights until jurisdiction has been confirmed or the user has acknowledged the limitation.

`SHARED-REQ-006`: When jurisdiction cannot be determined, the system SHALL provide only jurisdiction-neutral guidance and direct the user to the relevant official source.

---

## Federal vs provincial overlap

The product must handle overlapping authority carefully. Common overlaps include:

| Area | Federal | Provincial/Territorial |
|---|---|---|
| Employment | Federally regulated industries (banking, interprovincial transport, telecom, grain, certain Crown corporations) | Most private-sector employment, construction, retail, restaurants, etc. |
| Tax | Income tax (CRA), GST/HST | Provincial income tax, PST/RST/QST, property tax |
| Consumer protection | Telecommunications (CRTC/CCTS), banking complaints (FCAC), anti-spam (CRTC) | Most consumer contracts, door-to-door sales, warranties, tenancy |
| Housing | Indigenous housing on reserve, CMHC programs | Residential tenancies, landlord-tenant boards, rent control |
| Transportation | Air, rail, interprovincial trucking | Highway traffic, driver's licences, vehicle registration |
| Health | Health Canada, drug regulation | Hospitals, health insurance cards, long-term care |
| Family | Divorce under Divorce Act | Separation, property division, child support under provincial/territorial law |

`SHARED-REQ-007`: For employment matters, the system SHALL help the user determine whether the employer is federally regulated or provincially regulated before presenting jurisdiction-specific guidance.

`SHARED-REQ-008`: For consumer matters, the system SHALL identify whether a federal regulator (e.g., CCTS for telecom, FCAC for banking) may be the appropriate complaint body before directing the user to a provincial/territorial consumer protection office.

---

## Municipality coverage

`SHARED-RE-009`: The product MAY support municipality-level rules where they significantly affect a situation (e.g., tenant protection bylaws, business licensing, noise complaints, zoning). Where municipality-specific rules are not modeled, the system SHALL:

- name the relevant level of government;
- direct the user to the official municipal website or bylaw office;
- not fabricate municipal rules.

---

## Jurisdiction uncertainty handling

`SHARED-REQ-010`: When the system is uncertain about jurisdiction, it SHALL:

1. State the uncertainty clearly.
2. Provide jurisdiction-neutral information only.
3. Suggest official sources for the possible jurisdictions.
4. Recommend confirming with a qualified professional or the relevant agency.

`SHARED-REQ-011`: The system SHALL maintain a `jurisdiction.status` concept with at least the following states:

- `unknown` — not yet determined;
- `suggested` — system has proposed a jurisdiction, awaiting confirmation;
- `confirmed` — user has confirmed;
- `assumed` — system is proceeding on a stated assumption and will reconfirm if new facts change it;
- `multi` — multiple jurisdictions may apply;
- `not_applicable` — the guidance is jurisdiction-neutral.

`SHARED-REQ-012`: Jurisdiction SHALL be re-confirmed when the user provides new facts that may change it.

---

## Jurisdiction in document generation

`CDG-REQ-026`: A document template SHALL declare the jurisdictions it supports.

`CDG-REQ-027`: The document wizard SHALL confirm the user's jurisdiction before showing jurisdiction-specific clauses.

`CDG-REQ-028`: If a template does not support the user's confirmed jurisdiction, the system SHALL not generate the document with mismatched clauses; it SHALL offer an alternative template or a neutral fallback plus a professional-referral notice.

---

## Jurisdiction in evidence

`PEL-REQ-034`: The jurisdiction associated with a case or situation SHALL be recorded with the evidence and timeline so that exported packages preserve the legal/administrative context.

---

## Bilingual jurisdiction naming

`BIL-REQ-001`: Jurisdiction names SHALL be presented bilingually where they have distinct official names (e.g., Ontario / Ontario; Québec / Québec; New Brunswick / Nouveau-Brunswick; Canada / Canada). For provinces without distinct French forms, the same name is acceptable.

`BIL-REQ-002`: Statute names SHALL be presented in the official language of the jurisdiction's legal tradition (e.g., *Employment Standards Act, 2000* in English for Ontario; *Loi sur les normes du travail* in French for Québec) and, where helpful, translated or referenced bilingually.
