/**
 * The monitored-page registry for monitor-law-changes — what to watch, where,
 * and which detection strategy applies to each source. Data only, no I/O.
 */

/**
 * How a page's "has it changed?" question gets answered.
 *
 * `html` hashes the extracted text — the original strategy, and the only one
 * available for sources that publish nothing machine-readable.
 *
 * `justice-xml` reads `lims:lastAmendedDate` straight out of Justice Canada's
 * consolidated XML. Strictly better where it applies: no hashing, so a
 * publisher reformatting cannot fake a change and a JavaScript shell cannot
 * hide one. Only federal law is published this way today.
 *
 * `ontario-api` and `quebec-ckan` read structured JSON from e-Laws' and
 * Données Québec's machine-readable APIs respectively — see ontarioApi.ts
 * and quebecCkan.ts. Same rationale as `justice-xml`: the underlying HTML is
 * either a JS shell (Ontario) or WAF-flaky and full of request-derived noise
 * (Québec), so a hash over it is worse than useless.
 */
export type PageSource =
  | { kind: 'html' }
  | { kind: 'justice-xml'; consolidatedNumber: string }
  | { kind: 'ontario-api'; expectedActEn: string }
  | { kind: 'quebec-ckan'; resourceName: string; statuteCode: string }

export interface PageConfig {
  jurisdiction: string
  law_name: string
  url: string
  fallbacks: string[]
  /** Defaults to `html` when omitted. */
  source?: PageSource
  /**
   * The human-facing official page for this Act — where a reader goes to
   * actually look at the law. Optional: `html` pages ARE their reference,
   * so this only carries a value for API/XML sources whose `url` is a
   * machine endpoint nobody should be asked to open.
   */
  referenceUrl?: string
}

// ── All 14 Canadian jurisdictions ─────────────────────────────────────────────
// Primary source: official government legislation repositories.
// Stable / canonical URLs are preferred; avoid deep-linked PDFs where possible.
export const MONITORED_PAGES: PageConfig[] = [
  // ── Federal ──────────────────────────────────────────────────────────────
  /* Federal law comes from Justice Canada's own XML publication rather than
     the Justice Laws website's HTML. Same authority, published under the Open
     Government Licence – Canada, and it states its own amendment date — so
     federal change detection reads a fact instead of inferring one from a
     hash. See docs/LAW_MONITORING.md. */
  {
    jurisdiction: 'Federal',
    law_name: 'Canada Labour Code',
    url: 'https://raw.githubusercontent.com/justicecanada/laws-lois-xml/main/eng/acts/L-2.xml',
    fallbacks: [],
    source: { kind: 'justice-xml', consolidatedNumber: 'L-2' },
    referenceUrl: 'https://laws-lois.justice.gc.ca/eng/acts/L-2/',
  },
  {
    jurisdiction: 'Federal',
    law_name: 'Canadian Human Rights Act',
    url: 'https://raw.githubusercontent.com/justicecanada/laws-lois-xml/main/eng/acts/H-6.xml',
    fallbacks: [],
    source: { kind: 'justice-xml', consolidatedNumber: 'H-6' },
    referenceUrl: 'https://laws-lois.justice.gc.ca/eng/acts/H-6/',
  },
  // ── Ontario ───────────────────────────────────────────────────────────────
  /* e-Laws' statute pages (www.ontario.ca/laws/statute/{id}) are a JavaScript
     app shell — after tag-stripping, every Ontario statute reduces to the
     same ~422 characters of boilerplate, so hashing that page can never
     detect an amendment (docs/LAW_MONITORING.md § Source health — audit of
     2026-07-30). The act-versions API those pages are built from is real,
     byte-stable JSON with no bot filter; see ontarioApi.ts and
     docs/LAW_MONITORING.md § Sourcing evaluation for Ontario and Québec. */
  {
    jurisdiction: 'Ontario',
    law_name: 'Employment Standards Act, 2000',
    url: 'https://www.ontario.ca/laws/api/v2/legislation/en/act-versions/statute/00e41',
    fallbacks: [],
    source: { kind: 'ontario-api', expectedActEn: 'Employment Standards Act' },
    referenceUrl: 'https://www.ontario.ca/laws/statute/00e41',
  },
  {
    jurisdiction: 'Ontario',
    law_name: 'Ontario Human Rights Code',
    url: 'https://www.ontario.ca/laws/api/v2/legislation/en/act-versions/statute/90h19',
    fallbacks: [],
    source: { kind: 'ontario-api', expectedActEn: 'Human Rights Code' },
    referenceUrl: 'https://www.ontario.ca/laws/statute/90h19',
  },
  {
    jurisdiction: 'Ontario',
    law_name: 'Workplace Safety and Insurance Act, 1997',
    url: 'https://www.ontario.ca/laws/api/v2/legislation/en/act-versions/statute/97w16',
    fallbacks: [],
    source: { kind: 'ontario-api', expectedActEn: 'Workplace Safety and Insurance Act' },
    referenceUrl: 'https://www.ontario.ca/laws/statute/97w16',
  },
  // ── British Columbia ──────────────────────────────────────────────────────
  {
    jurisdiction: 'British Columbia',
    law_name: 'Employment Standards Act (BC)',
    url: 'https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96113_01',
    fallbacks: ['https://www.bclaws.ca/civix/document/id/complete/statreg/96113_01'],
  },
  {
    jurisdiction: 'British Columbia',
    law_name: 'Workers Compensation Act (BC)',
    url: 'https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96492_01',
    fallbacks: [],
  },
  // ── Alberta ───────────────────────────────────────────────────────────────
  {
    jurisdiction: 'Alberta',
    law_name: 'Employment Standards Code (AB)',
    url: 'https://www.qp.alberta.ca/documents/Acts/E09.pdf',
    fallbacks: ['https://kings-printer.alberta.ca/documents/Acts/E09.pdf'],
  },
  // ── Quebec ────────────────────────────────────────────────────────────────
  /* LégisQuébec itself is reachable, but its CloudFront WAF rule keyed on
     User-Agent flips between 403 and 200 on identical URLs seconds apart —
     whole-page hashing there guarantees false alerts, on top of an embedded
     historique=YYYYMMDD value that changes on every request regardless of
     any amendment (docs/LAW_MONITORING.md § Sourcing evaluation). Données
     Québec's CKAN API publishes the same codified corpus as a first-party,
     byte-stable, no-bot-filter dataset instead; see quebecCkan.ts.

     Both LNT and Charter live in that dataset's single "Lois" resource, but
     detection is per-statute: a moved dataset triggers a drill-down into the
     zip (zipRange.ts) that reads the Act's own XML and compares its
     section→in-force-date map — a corpus refresh that did not touch the Act
     files nothing. The two rows share one API response but need distinct
     `url` values to key their own law_page_hashes/law_updates rows — the
     #LNT / #Charter fragment is never sent to the server (fragments are
     client-side only), so both fetch the identical endpoint. */
  {
    jurisdiction: 'Quebec',
    law_name: 'Act respecting labour standards (LNT)',
    url: 'https://www.donneesquebec.ca/recherche/api/3/action/package_show?id=c8433300-f752-4815-8ea2-69cad416dd80#LNT',
    fallbacks: [],
    source: { kind: 'quebec-ckan', resourceName: 'Lois', statuteCode: 'N-1.1' },
    referenceUrl: 'https://www.legisquebec.gouv.qc.ca/en/document/cs/N-1.1',
  },
  {
    jurisdiction: 'Quebec',
    law_name: 'Charter of Human Rights and Freedoms (Quebec)',
    url: 'https://www.donneesquebec.ca/recherche/api/3/action/package_show?id=c8433300-f752-4815-8ea2-69cad416dd80#Charter',
    fallbacks: [],
    source: { kind: 'quebec-ckan', resourceName: 'Lois', statuteCode: 'C-12' },
    referenceUrl: 'https://www.legisquebec.gouv.qc.ca/en/document/cs/C-12',
  },
  // ── Manitoba ──────────────────────────────────────────────────────────────
  {
    jurisdiction: 'Manitoba',
    law_name: 'Employment Standards Code (MB)',
    url: 'https://web2.gov.mb.ca/laws/statutes/ccsm/e110e.php',
    fallbacks: ['https://www.manitoba.ca/cca/elaws/statutes/es_employment_standards_code/'],
  },
  // ── Saskatchewan ─────────────────────────────────────────────────────────
  {
    jurisdiction: 'Saskatchewan',
    law_name: 'Saskatchewan Employment Act',
    url: 'https://www.qp.gov.sk.ca/documents/English/Statutes/Statutes/S15-1.pdf',
    fallbacks: [
      'https://publications.saskatchewan.ca/api/v1/products/73330/formats/82807/download',
    ],
  },
  // ── Nova Scotia ───────────────────────────────────────────────────────────
  {
    jurisdiction: 'Nova Scotia',
    law_name: 'Labour Standards Code (NS)',
    url: 'https://nslegislature.ca/sites/default/files/legc/statutes/labour%20standards%20code.htm',
    fallbacks: ['https://novascotia.ca/lae/employmentrights/docs/labourstandardscode.pdf'],
  },
  // ── New Brunswick ─────────────────────────────────────────────────────────
  {
    jurisdiction: 'New Brunswick',
    law_name: 'Employment Standards Act (NB)',
    url: 'https://laws.gnb.ca/en/showdoc/cs/E-7.2',
    fallbacks: ['https://gnb.ca/0062/acts/acts/e-07-2.htm'],
  },
  // ── Prince Edward Island ──────────────────────────────────────────────────
  {
    jurisdiction: 'Prince Edward Island',
    law_name: 'Employment Standards Act (PEI)',
    url: 'https://www.princeedwardisland.ca/sites/default/files/legislation/e-6_2-employment_standards_act.pdf',
    fallbacks: ['https://www.princeedwardisland.ca/en/legislation/employment-standards-act'],
  },
  // ── Newfoundland and Labrador ─────────────────────────────────────────────
  {
    jurisdiction: 'Newfoundland and Labrador',
    law_name: 'Labour Standards Act (NL)',
    url: 'https://www.assembly.nl.ca/legislation/sr/statutes/l00-2.htm',
    fallbacks: ['https://assembly.nl.ca/legislation/sr/statutes/l00-2.htm'],
  },
  // ── Northwest Territories ─────────────────────────────────────────────────
  {
    jurisdiction: 'Northwest Territories',
    law_name: 'Employment Standards Act (NWT)',
    url: 'https://www.justice.gov.nt.ca/en/files/legislation/employment-standards/employment-standards.a.pdf',
    fallbacks: ['https://www.ntassembly.ca/sites/default/files/EmploymentStandardsAct.pdf'],
  },
  // ── Nunavut ───────────────────────────────────────────────────────────────
  {
    jurisdiction: 'Nunavut',
    law_name: 'Labour Standards Act (NU)',
    url: 'https://www.nunavutlegislation.ca/en/consolidated-law/current/chapter-l-1',
    fallbacks: ['https://nunavutlegislation.ca/en/consolidated-law/current/chapter-l-1'],
  },
  // ── Yukon ─────────────────────────────────────────────────────────────────
  {
    jurisdiction: 'Yukon',
    law_name: 'Employment Standards Act (YK)',
    url: 'https://legislation.yukon.ca/acts/esta_c.pdf',
    fallbacks: ['https://www.yukon.ca/en/employment-standards'],
  },
]
