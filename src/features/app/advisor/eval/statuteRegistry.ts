import type { Bi } from '@/i18n/core'

/**
 * § Advisor golden-eval — the canonical statute-section registry.
 *
 * The citation verifier resolves every `requiredCitations` ref in
 * goldenCases.ts against this table. Two confidence levels, both deliberate:
 *
 * - `corpus-cited` — the live grounding corpus names this section in its
 *   title, content or effective_note (verified against the snapshot). The
 *   verifier requires the section's aliases to appear in the chunk that
 *   grounds the case — a missing alias is a hard failure, because the
 *   Advisor's legal-basis surface would cite the chunk without backing the
 *   section the answer leans on.
 * - `canonical` — a well-known section of the governing statute (ESA s.57,
 *   LNT art. 82, CLC s. 230/235/240). The corpus may not name it; when the
 *   grounding chunk doesn't, the eval records a *coverage gap* (the answer
 *   is right but cites at statute level only) rather than failing.
 *
 * `aliases` are matched against `normalizeText` output — "s. 57" and
 * "s.57" both normalize to "s 57"; list each plausible written form.
 * Sections are added only where the rule is unambiguous; the registry is
 * the source of record for what this harness vouches for — not legal
 * advice, not a substitute for the consolidated statute.
 */

export interface StatuteEntry {
  /** Unique ref cited by golden cases — `<statute>:<section>`. */
  ref: string
  statute: string
  /** Section number, or null for statute-level entries (absence chunks,
   *  whole-Act propositions). */
  section: string | null
  citation: Bi
  /** Short canonical proposition the section encodes — the fact a correct
   *  Advisor answer must be consistent with. */
  rule: string
  /** Written forms to look for in chunk text after normalizeText(). */
  aliases: readonly string[]
  confidence: 'corpus-cited' | 'canonical'
  /** Official source for the section text. */
  sourceUrl: string
}

const ELAWS_ESA = 'https://www.ontario.ca/laws/statute/00e41'
const LEGIS_LNT = 'https://www.legisquebec.gouv.qc.ca/en/document/cs/N-1.1'
const JUSTICE_CLC = 'https://laws-lois.justice.gc.ca/eng/acts/L-2/'
const ELAWS_HRC = 'https://www.ontario.ca/laws/statute/90h19'
const JUSTICE_CHRA = 'https://laws-lois.justice.gc.ca/eng/acts/H-6/'
const LEGIS_CHARTER = 'https://www.legisquebec.gouv.qc.ca/en/document/cs/C-12'
const LEGIS_LATMP = 'https://www.legisquebec.gouv.qc.ca/en/document/cs/A-3.001'
const ELAWS_WSIA = 'https://www.ontario.ca/laws/statute/97w16a'
const LEGIS_N11R6 = 'https://www.legisquebec.gouv.qc.ca/en/document/rc/N-1.1,%20r.%206'
const JUSTICE_CLSR = 'https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._986/'
const JUSTICE_GECA = 'https://laws-lois.justice.gc.ca/eng/acts/G-5/'
const LEGIS_FETE = 'https://www.legisquebec.gouv.qc.ca/en/document/cs/F-1.1'

function entry(e: StatuteEntry): StatuteEntry {
  return e
}

export const STATUTE_REGISTRY: readonly StatuteEntry[] = [
  /* ── Ontario — Employment Standards Act, 2000 ─────────────────────────── */
  entry({
    ref: 'ON_ESA:54',
    statute: 'ON_ESA',
    section: '54',
    citation: {
      en: 'Employment Standards Act, 2000, s. 54',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 54',
    },
    rule: 'No employer shall terminate without written notice once the employee has the required service.',
    aliases: ['s. 54', 's.54', 'art. 54', 'section 54'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:57',
    statute: 'ON_ESA',
    section: '57',
    citation: {
      en: 'Employment Standards Act, 2000, s. 57',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 57',
    },
    rule: 'Individual termination notice ladder: 1 week (<1 yr, ≥3 mo) rising to 8 weeks at 8+ years.',
    aliases: ['s. 57', 's.57', 'art. 57', 'section 57'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:56',
    statute: 'ON_ESA',
    section: '56',
    citation: {
      en: 'Employment Standards Act, 2000, s. 56',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 56',
    },
    rule: 'What constitutes termination — includes constructive dismissal and extended layoff.',
    aliases: ['s.56(1)(b)', 's. 56(1)(b)', 's.56(2)-(3.6)', 's. 56(2)-(3.6)', 's.56', 's. 56', 'art. 56'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:58',
    statute: 'ON_ESA',
    section: '58',
    citation: {
      en: 'Employment Standards Act, 2000, s. 58',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 58',
    },
    rule: 'Mass-termination notice when 50+ employees are let go at an establishment within four weeks: 8/12/16 weeks.',
    aliases: ['s. 58', 's.58', 'art. 58'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:61',
    statute: 'ON_ESA',
    section: '61',
    citation: {
      en: 'Employment Standards Act, 2000, s. 61',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 61',
    },
    rule: 'Pay instead of notice — lump-sum termination pay equal to notice-period wages, plus maintained benefit-plan contributions.',
    aliases: ['s. 61', 's.61', 'art. 61', 'section 61'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:63-64',
    statute: 'ON_ESA',
    section: '63-64',
    citation: {
      en: 'Employment Standards Act, 2000, ss. 63–64',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 63-64',
    },
    rule: 'Severance pay: 5+ years AND payroll ≥ $2.5M or 50+ severed on closure; one week per year up to 26.',
    aliases: ['s. 63', 's.63', 'ss. 63', 'art. 63', 's. 64', 's.64'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:22',
    statute: 'ON_ESA',
    section: '22',
    citation: {
      en: 'Employment Standards Act, 2000, s. 22',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 22',
    },
    rule: 'Overtime begins after 44 hours in a work week at 1.5× the regular rate.',
    aliases: ['s. 22', 's.22', 'art. 22'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:17-20',
    statute: 'ON_ESA',
    section: '17-20',
    citation: {
      en: 'Employment Standards Act, 2000, ss. 17–20',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 17-20',
    },
    rule: 'Daily/weekly hour limits (8/day, 48/week) and the 30-minute eating period per 5 hours.',
    aliases: ['s. 17', 's.17', 's. 20', 's.20', 'ss. 17', 'art. 17'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:11-13',
    statute: 'ON_ESA',
    section: '11-13',
    citation: {
      en: 'Employment Standards Act, 2000, ss. 11–13',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 11-13',
    },
    rule: 'Payment of wages, wage statements and permitted deductions only.',
    aliases: ['ss. 11', 'ss.11', 's. 11', 's.11', 'art. 11'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:15-16',
    statute: 'ON_ESA',
    section: '15-16',
    citation: {
      en: 'Employment Standards Act, 2000, ss. 15–16',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 15-16',
    },
    rule: 'Employer record-keeping — three-year general retention, five years for vacation records.',
    aliases: ['ss.15–16', 'ss. 15', 'ss.15', 's. 15', 's.15', 'part vi'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:24-32',
    statute: 'ON_ESA',
    section: '24-32',
    citation: {
      en: 'Employment Standards Act, 2000, ss. 24–32 (Part X)',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 24-32',
    },
    rule: 'Nine public holidays with public-holiday-pay rules.',
    aliases: ['s. 24', 's.24', 'part x', 'art. 24'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:33-41',
    statute: 'ON_ESA',
    section: '33-41',
    citation: {
      en: 'Employment Standards Act, 2000, ss. 33–41 (Part XI)',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 33-41',
    },
    rule: 'Annual vacation: 2 weeks < 5 years, 3 weeks at 5+; vacation pay 4%/6% of gross wages.',
    aliases: ['s. 33', 's.33', 'part xi', 'art. 33'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:46',
    statute: 'ON_ESA',
    section: '46',
    citation: {
      en: 'Employment Standards Act, 2000, s. 46',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 46',
    },
    rule: 'Pregnancy leave — up to 17 weeks of job-protected leave.',
    aliases: ['s. 46', 's.46', 'art. 46'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:48',
    statute: 'ON_ESA',
    section: '48',
    citation: {
      en: 'Employment Standards Act, 2000, s. 48',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 48',
    },
    rule: 'Parental leave — up to 61 weeks (63 when no pregnancy leave taken).',
    aliases: ['s. 48', 's.48', 'art. 48'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:50',
    statute: 'ON_ESA',
    section: '50',
    citation: {
      en: 'Employment Standards Act, 2000, s. 50',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 50',
    },
    rule: 'Sick leave — 3 unpaid days per calendar year after 2 weeks’ employment; no medical note required.',
    aliases: ['s. 50', 's.50', 'art. 50'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:50.0.1',
    statute: 'ON_ESA',
    section: '50.0.1',
    citation: {
      en: 'Employment Standards Act, 2000, s. 50.0.1',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 50.0.1',
    },
    rule: 'Family responsibility leave — 3 unpaid days per year.',
    aliases: ['s. 50.0.1', 's.50.0.1'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:50.0.2',
    statute: 'ON_ESA',
    section: '50.0.2',
    citation: {
      en: 'Employment Standards Act, 2000, s. 50.0.2',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 50.0.2',
    },
    rule: 'Bereavement leave — 2 unpaid days per year.',
    aliases: ['s. 50.0.2', 's.50.0.2'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:49.7',
    statute: 'ON_ESA',
    section: '49.7',
    citation: {
      en: 'Employment Standards Act, 2000, s. 49.7',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 49.7',
    },
    rule: 'Domestic or sexual violence leave — job-protected leave for the employee or their child.',
    aliases: ['s. 49.7', 's.49.7'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),
  entry({
    ref: 'ON_ESA:23.1',
    statute: 'ON_ESA',
    section: '23.1',
    citation: {
      en: 'Employment Standards Act, 2000, s. 23.1',
      fr: 'Loi de 2000 sur les normes d’emploi, art. 23.1',
    },
    rule: 'Minimum wage reviewed annually and indexed; rate set by regulation.',
    aliases: ['s. 23.1', 's.23.1', 'part ix'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_ESA,
  }),

  /* ── Ontario — Human Rights Code ──────────────────────────────────────── */
  entry({
    ref: 'ON_HRC:5',
    statute: 'ON_HRC',
    section: '5',
    citation: { en: 'Ontario Human Rights Code, s. 5', fr: 'Code des droits de la personne de l’Ontario, art. 5' },
    rule: 'Freedom from discrimination in employment on protected grounds.',
    aliases: ['s. 5', 's.5', 'art. 5'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_HRC,
  }),
  entry({
    ref: 'ON_HRC:17',
    statute: 'ON_HRC',
    section: '17',
    citation: { en: 'Ontario Human Rights Code, s. 17', fr: 'Code des droits de la personne de l’Ontario, art. 17' },
    rule: 'Duty to accommodate to the point of undue hardship.',
    aliases: ['s. 17', 's.17', 'art. 17'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_HRC,
  }),

  /* ── Ontario — WSIA (statute-level) ───────────────────────────────────── */
  entry({
    ref: 'ON_WSIA:*',
    statute: 'ON_WSIA',
    section: null,
    citation: {
      en: 'Workplace Safety and Insurance Act, 1997',
      fr: 'Loi de 1997 sur la sécurité professionnelle et l’assurance contre les accidents du travail',
    },
    rule: 'WSIB coverage for workplace injury; 85% loss-of-earnings benefit; 3-business-day employer reporting.',
    aliases: ['workplace safety and insurance act', 'wsib', 'wsia'],
    confidence: 'corpus-cited',
    sourceUrl: ELAWS_WSIA,
  }),

  /* ── Québec — Loi sur les normes du travail ───────────────────────────── */
  entry({
    ref: 'QC_LNT:82',
    statute: 'QC_LNT',
    section: '82',
    citation: { en: 'Act respecting labour standards, s. 82', fr: 'Loi sur les normes du travail, art. 82' },
    rule: 'Written notice of termination: 1 wk (3 mo–1 yr), 2 wks (1–5 yr), 4 wks (5–10 yr), 8 wks (10+ yr).',
    aliases: ['ss. 82', 'ss.82', 's. 82', 's.82', 'art. 82', '82–84', '82-84'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),
  entry({
    ref: 'QC_LNT:83',
    statute: 'QC_LNT',
    section: '83',
    citation: { en: 'Act respecting labour standards, s. 83', fr: 'Loi sur les normes du travail, art. 83' },
    rule: 'Compensatory indemnity equal to regular wages for the missing notice period.',
    aliases: ['s. 83', 's.83', 'art. 83', '82–84', '82-84'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),
  entry({
    ref: 'QC_LNT:124',
    statute: 'QC_LNT',
    section: '124',
    citation: { en: 'Act respecting labour standards, s. 124', fr: 'Loi sur les normes du travail, art. 124' },
    rule: 'CNESST complaint for dismissal without good and sufficient cause (2+ years continuous service).',
    aliases: ['ss.124-135', 'ss. 124', 's.124', 's. 124', 'art. 124'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),
  entry({
    ref: 'QC_LNT:52',
    statute: 'QC_LNT',
    section: '52',
    citation: { en: 'Act respecting labour standards, s. 52', fr: 'Loi sur les normes du travail, art. 52' },
    rule: 'Standard work week is 40 hours for most workers.',
    aliases: ['s. 52', 's.52', 'art. 52'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),
  entry({
    ref: 'QC_LNT:55',
    statute: 'QC_LNT',
    section: '55',
    citation: { en: 'Act respecting labour standards, s. 55', fr: 'Loi sur les normes du travail, art. 55' },
    rule: 'Work beyond the regular workweek carries a 50% premium; replaceable by equivalent paid leave.',
    aliases: ['s. 55', 's.55', 'art. 55'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),
  entry({
    ref: 'QC_LNT:60',
    statute: 'QC_LNT',
    section: '60',
    citation: { en: 'Act respecting labour standards, s. 60', fr: 'Loi sur les normes du travail, art. 60' },
    rule: 'Eight paid statutory holidays under the LNT and the National Holiday Act.',
    aliases: ['s. 60', 's.60', 'art. 60'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),
  entry({
    ref: 'QC_LNT:66-77',
    statute: 'QC_LNT',
    section: '66-77',
    citation: { en: 'Act respecting labour standards, ss. 66–77', fr: 'Loi sur les normes du travail, art. 66-77' },
    rule: 'Annual vacation by uninterrupted service; indemnity 4% (<3 yrs) / 6% (3+ yrs).',
    aliases: ['ss. 66–77', 'ss. 66', 'ss.66', '66–77', '66-77'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),
  entry({
    ref: 'QC_LNT:79.1',
    statute: 'QC_LNT',
    section: '79.1',
    citation: { en: 'Act respecting labour standards, s. 79.1', fr: 'Loi sur les normes du travail, art. 79.1' },
    rule: 'Job-protected absence for non-work sickness, organ/tissue donation, accident or domestic/sexual violence — up to 26 weeks over 12 months.',
    aliases: ['s. 79.1', 's.79.1', 'art. 79.1'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),
  entry({
    ref: 'QC_LNT:40',
    statute: 'QC_LNT',
    section: '40',
    citation: { en: 'Act respecting labour standards, s. 40', fr: 'Loi sur les normes du travail, art. 40' },
    rule: 'General minimum wage set by regulation; $16.60/hour since 2026-05-01.',
    aliases: ['s. 40', 's.40', 'art. 40'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),
  entry({
    ref: 'QC_LNT:43-51',
    statute: 'QC_LNT',
    section: '43-51',
    citation: { en: 'Act respecting labour standards, ss. 43–51', fr: 'Loi sur les normes du travail, art. 43-51' },
    rule: 'Wage payment intervals, pay slips and permitted deductions.',
    aliases: ['arts. 43-51', 'art. 43', '43-51', 'arts.43-51'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),
  entry({
    ref: 'QC_LNT:parental',
    statute: 'QC_LNT',
    section: null,
    citation: {
      en: 'Act respecting labour standards — parental leave division (ss. 81.1–81.17)',
      fr: 'Loi sur les normes du travail — section des congés parentaux (art. 81.1-81.17)',
    },
    rule: 'Maternity (18 wks), paternity (5 wks) and parental (up to 65 wks shared) job-protected leaves.',
    aliases: ['maternity', 'paternity', 'parental', 'maternite', 'paternite'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LNT,
  }),

  /* ── Québec — Charter / LATMP / register regulation / National Holiday ── */
  entry({
    ref: 'QC_CHARTER:10-16',
    statute: 'QC_CHARTER',
    section: '10-16',
    citation: {
      en: 'Charter of human rights and freedoms, ss. 10 & 16',
      fr: 'Charte des droits et libertés de la personne, art. 10 et 16',
    },
    rule: 'Prohibited discrimination grounds incl. employment; duty to accommodate short of undue hardship.',
    aliases: ['charter of human rights', 'charte des droits', 'cdpdj'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_CHARTER,
  }),
  entry({
    ref: 'QC_LATMP:*',
    statute: 'QC_LATMP',
    section: null,
    citation: {
      en: 'Act respecting industrial accidents and occupational diseases',
      fr: 'Loi sur les accidents du travail et les maladies professionnelles',
    },
    rule: 'CNESST income-replacement indemnity (90% net income); 14-day employer-paid period.',
    aliases: ['latmp', 'industrial accidents', 'accidents du travail'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_LATMP,
  }),
  entry({
    ref: 'QC_N11R6:2',
    statute: 'QC_N11R6',
    section: '2',
    citation: {
      en: 'Regulation respecting a registration system or the keeping of a register, s. 2',
      fr: 'Règlement sur un système d’enregistrement ou sur la tenue d’un registre, art. 2',
    },
    rule: 'Employer payroll register kept at least 3 years.',
    aliases: ['n-1.1, r. 6', 's.2', 's. 2', 'r. 6'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_N11R6,
  }),
  entry({
    ref: 'QC_FETE:*',
    statute: 'QC_FETE',
    section: null,
    citation: { en: 'National Holiday Act', fr: 'Loi sur la fête nationale' },
    rule: 'June 24 is a statutory holiday for all Québec workers.',
    aliases: ['national holiday act', 'fete nationale', 'loi sur la fete'],
    confidence: 'corpus-cited',
    sourceUrl: LEGIS_FETE,
  }),

  /* ── Federal — Canada Labour Code Part III ────────────────────────────── */
  entry({
    ref: 'FED_CLC:230',
    statute: 'FED_CLC',
    section: '230',
    citation: { en: 'Canada Labour Code, s. 230', fr: 'Code canadien du travail, art. 230' },
    rule: 'Individual termination: 2 weeks’ written notice minimum; 1 week per completed year at 3+ years, max 8.',
    aliases: ['s. 230', 's.230', 's.230(1)', 'part iii'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:235',
    statute: 'FED_CLC',
    section: '235',
    citation: { en: 'Canada Labour Code, s. 235', fr: 'Code canadien du travail, art. 235' },
    rule: 'Severance pay at 12+ months: greater of 2 days’ wages per completed year or 5 days’ wages.',
    aliases: ['s. 235', 's.235'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:240',
    statute: 'FED_CLC',
    section: '240',
    citation: { en: 'Canada Labour Code, s. 240', fr: 'Code canadien du travail, art. 240' },
    rule: 'Unjust dismissal complaint — includes constructive dismissal (IPG-033).',
    aliases: ['s.240', 's. 240'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:239',
    statute: 'FED_CLC',
    section: '239',
    citation: { en: 'Canada Labour Code, s. 239', fr: 'Code canadien du travail, art. 239' },
    rule: 'Paid medical leave — up to 10 days per year (in force 2022-12-01); unpaid medical leave up to 27 weeks.',
    aliases: ['s. 239', 's.239'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:210',
    statute: 'FED_CLC',
    section: '210',
    citation: { en: 'Canada Labour Code, s. 210', fr: 'Code canadien du travail, art. 210' },
    rule: 'Bereavement leave — 10 days, first 3 paid after 3 months’ employment.',
    aliases: ['s. 210', 's.210'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:184-185',
    statute: 'FED_CLC',
    section: '184-185',
    citation: { en: 'Canada Labour Code, ss. 184–185', fr: 'Code canadien du travail, art. 184-185' },
    rule: 'Annual vacation: 2 wks after 1 yr, 3 wks after 5 yrs, 4 wks after 10 yrs.',
    aliases: ['s. 184', 's.184', 's. 185', 's.185'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:holidays',
    statute: 'FED_CLC',
    section: null,
    citation: {
      en: 'Canada Labour Code — general holidays (Part III, ss. 192–201)',
      fr: 'Code canadien du travail — jours fériés (partie III, art. 192-201)',
    },
    rule: '10 paid general holidays incl. National Day for Truth and Reconciliation and Boxing Day.',
    aliases: ['general holidays', 'jours feries'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:178.1',
    statute: 'FED_CLC',
    section: '178.1',
    citation: { en: 'Canada Labour Code, s. 178.1', fr: 'Code canadien du travail, art. 178.1' },
    rule: 'Federal minimum wage indexed each April 1 ($18.15/h effective 2026-04-01).',
    aliases: ['s. 178.1', 's.178.1', '178.1(2)', '178.1(2)-(4)'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:169-174',
    statute: 'FED_CLC',
    section: '169-174',
    citation: { en: 'Canada Labour Code, ss. 169–174', fr: 'Code canadien du travail, art. 169-174' },
    rule: 'Standard hours 8/day and 40/week (s.169); 48/wk maximum in most cases (s.171); overtime premium at 1.5× (s.174).',
    aliases: ['s. 169', 's.169', 's. 171', 's.171', 's. 174', 's.174'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:254',
    statute: 'FED_CLC',
    section: '254',
    citation: { en: 'Canada Labour Code, s. 254', fr: 'Code canadien du travail, art. 254' },
    rule: 'Permitted wage deductions only — statutory, court-ordered, collectively agreed or employee-authorized.',
    aliases: ['s.254', 's. 254'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:252-253.2',
    statute: 'FED_CLC',
    section: '252-253.2',
    citation: { en: 'Canada Labour Code, ss. 252(2), 253.2(3)', fr: 'Code canadien du travail, art. 252(2), 253.2(3)' },
    rule: 'Employment and payroll records kept at least 36 months.',
    aliases: ['s.252(2)', 's.253.2(3)', 's. 252', 's.252'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLC:247.5',
    statute: 'FED_CLC',
    section: '247.5(1.1)',
    citation: { en: 'Canada Labour Code, s. 247.5(1.1)', fr: 'Code canadien du travail, art. 247.5(1.1)' },
    rule: 'Reserve force leave — up to 24 months in a 60-month period.',
    aliases: ['s. 247.5', 's.247.5', '247.5(1.1)'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLC,
  }),
  entry({
    ref: 'FED_CLSR:30',
    statute: 'FED_CLSR',
    section: '30',
    citation: { en: 'Canada Labour Standards Regulations, s. 30', fr: 'Règlement du Canada sur les normes du travail, art. 30' },
    rule: 'Temporary layoff not a termination in the listed cases (≤3 months, fixed recall date, strike/lockout).',
    aliases: ['s.30', 's. 30', 's.30(1)'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CLSR,
  }),

  /* ── Federal — CHRA / GECA ────────────────────────────────────────────── */
  entry({
    ref: 'FED_CHRA:7-15',
    statute: 'FED_CHRA',
    section: '7-15',
    citation: { en: 'Canadian Human Rights Act, ss. 7 & 15', fr: 'Loi canadienne sur les droits de la personne, art. 7 et 15' },
    rule: 'Employment discrimination prohibited on protected grounds; undue-hardship defence.',
    aliases: ['canadian human rights act', 'loi canadienne sur les droits'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_CHRA,
  }),
  entry({
    ref: 'FED_GECA:*',
    statute: 'FED_GECA',
    section: null,
    citation: { en: 'Government Employees Compensation Act', fr: 'Loi sur l’indemnisation des agents de l’État' },
    rule: 'Federal government employees’ work-injury compensation; private-sector federal workers use provincial WCBs.',
    aliases: ['government employees compensation act', 'geca'],
    confidence: 'corpus-cited',
    sourceUrl: JUSTICE_GECA,
  }),
]

const registryByRef = new Map(STATUTE_REGISTRY.map((e) => [e.ref, e]))

/** Resolve a golden-case citation ref, or undefined when it isn't registered. */
export function statuteByRef(ref: string): StatuteEntry | undefined {
  return registryByRef.get(ref)
}
