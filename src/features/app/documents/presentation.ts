/**
 * User-facing presentation mappers for the Documents area.
 *
 * Backend / catalogue values stay as `low|medium|high` and engine
 * applicability kinds (`required|applies|below|union`). This module maps
 * those to review-level and applicability copy without inventing legal claims.
 */
import type { Bi } from '@/i18n/core'
import { doclibMessages as M } from '@/i18n/messages/doclib'
import { applicability } from './engine'
import type { Applicability, ApplicabilityKind } from './engine'
import { jurisdictionInfo, riskLevelInfo, sectors, sizeTiers } from './data'
import type {
  DocChipTone,
  DocRiskLevel,
  DocTemplate,
  Jurisdiction,
  OrgProfile,
  RiskLevelInfo,
} from './data'

export type ReviewLevelId = DocRiskLevel

/** Stable filter order for review-level select options. */
export const REVIEW_LEVEL_ORDER: ReviewLevelId[] = ['low', 'medium', 'high']

/**
 * Map stored risk (`low|medium|high`) to review-level presentation.
 * Labels live on `riskLevelInfo` in meta.ts (low → Standard review, etc.).
 */
export function reviewLevelInfo(level: DocRiskLevel): RiskLevelInfo {
  return riskLevelInfo[level]
}

export type PresentApplicabilityKind = 'required' | 'recommended' | 'available' | 'not_matched'

export interface PresentApplicability {
  kind: PresentApplicabilityKind
  /** Underlying engine kind when jurisdiction matched; null when overridden. */
  engineKind: ApplicabilityKind | null
  label: Bi
  reason: Bi
  tone: DocChipTone
}

const PRESENT_LABEL: Record<PresentApplicabilityKind, Bi> = {
  required: M.doclib_applic_required,
  recommended: M.doclib_applic_recommended,
  available: M.doclib_applic_available,
  not_matched: M.doclib_applic_not_matched,
}

const PRESENT_TONE: Record<PresentApplicabilityKind, DocChipTone> = {
  required: 'gold',
  recommended: 'ok',
  available: 'info',
  not_matched: 'neutral',
}

/** Effective regulation jurisdiction from org sector + primary province. */
export function effectiveJurisdiction(org: OrgProfile): Jurisdiction {
  const sector = sectors.find((s) => s.key === org.sector)
  if (sector?.federallyRegulated) return 'FED'
  return org.primaryJurisdiction
}

export function isOrgProfileComplete(org: OrgProfile): boolean {
  return (
    org.headcount >= 1 &&
    org.sector.trim().length > 0 &&
    (org.primaryJurisdiction === 'ON' ||
      org.primaryJurisdiction === 'QC' ||
      org.primaryJurisdiction === 'FED')
  )
}

export function orgProfileSummaryParts(org: OrgProfile): {
  jurisdictionName: Bi
  headcount: number
  sectorName: Bi | null
  unionLabel: Bi
  complete: boolean
} {
  const jurisCode = effectiveJurisdiction(org)
  const juris = jurisdictionInfo.find((j) => j.code === jurisCode)
  const sector = sectors.find((s) => s.key === org.sector)
  return {
    jurisdictionName: juris?.name ?? { en: jurisCode, fr: jurisCode },
    headcount: org.headcount,
    sectorName: sector?.name ?? null,
    unionLabel: org.unionized ? M.doclib_profile_union : M.doclib_profile_nonunion,
    complete: isOrgProfileComplete(org),
  }
}

/**
 * Present applicability for the Templates UI. Only surfaces "Required" when
 * the engine returns `required` with an explicit size/threshold reason.
 */
export function presentApplicability(template: DocTemplate, org: OrgProfile): PresentApplicability {
  const juris = effectiveJurisdiction(org)
  const jurisMatch = template.jurisdictions.includes(juris)
  const engine: Applicability = applicability(template, org)

  if (!jurisMatch) {
    return {
      kind: 'not_matched',
      engineKind: null,
      label: PRESENT_LABEL.not_matched,
      reason: {
        en: `This template is written for ${template.jurisdictions.join(', ')}, which does not match your organization’s current jurisdiction.`,
        fr: `Ce modèle est rédigé pour ${template.jurisdictions.join(', ')}, ce qui ne correspond pas au territoire de compétence actuel de votre organisation.`, // [FR self-authored]
      },
      tone: PRESENT_TONE.not_matched,
    }
  }

  if (engine.kind === 'required') {
    return {
      kind: 'required',
      engineKind: 'required',
      label: PRESENT_LABEL.required,
      reason: engine.reason,
      tone: PRESENT_TONE.required,
    }
  }

  if (engine.kind === 'union') {
    return {
      kind: 'not_matched',
      engineKind: 'union',
      label: PRESENT_LABEL.not_matched,
      reason: engine.reason,
      tone: PRESENT_TONE.not_matched,
    }
  }

  if (engine.kind === 'below') {
    return {
      kind: 'available',
      engineKind: 'below',
      label: PRESENT_LABEL.available,
      reason: engine.reason,
      tone: PRESENT_TONE.available,
    }
  }

  return {
    kind: 'recommended',
    engineKind: 'applies',
    label: PRESENT_LABEL.recommended,
    reason: profileMatchReason(org),
    tone: PRESENT_TONE.recommended,
  }
}

function profileMatchReason(org: OrgProfile): Bi {
  const parts = orgProfileSummaryParts(org)
  const sectorEn = parts.sectorName?.en ?? org.sector
  const sectorFr = parts.sectorName?.fr ?? org.sector
  const unionEn = parts.unionLabel.en.toLowerCase()
  const unionFr = parts.unionLabel.fr.toLowerCase()
  const tier = sizeTiers.find(
    (t) => org.headcount >= t.min && (t.max === null || org.headcount <= t.max),
  )
  const sizeEn = tier ? tier.label.en.toLowerCase() : `${org.headcount} employees`
  const sizeFr = tier ? tier.label.fr.toLowerCase() : `${org.headcount} employés`
  return {
    en: `Matches your profile: ${parts.jurisdictionName.en}, ${sizeEn}, ${sectorEn}, ${unionEn}.`,
    fr: `Correspond à votre profil : ${parts.jurisdictionName.fr}, ${sizeFr}, ${sectorFr}, ${unionFr}.`, // [FR self-authored]
  }
}

const APPLIC_RANK: Record<PresentApplicabilityKind, number> = {
  required: 0,
  recommended: 1,
  available: 2,
  not_matched: 3,
}

/** Rank templates for initial selection and recommendation-first ordering. */
export function compareTemplatesForOrg(a: DocTemplate, b: DocTemplate, org: OrgProfile): number {
  const rankA = APPLIC_RANK[presentApplicability(a, org).kind]
  const rankB = APPLIC_RANK[presentApplicability(b, org).kind]
  if (rankA !== rankB) return rankA - rankB
  if (a.core !== b.core) return a.core ? -1 : 1
  if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount
  return a.tid.localeCompare(b.tid)
}

/**
 * Strip trailing jurisdiction parentheticals from template titles when the
 * same jurisdiction is shown as structured metadata beside the name.
 */
export function displayTemplateTitle(name: string, jurisdictions: Jurisdiction[]): string {
  let next = name.trim()
  const patterns: { code: Jurisdiction; re: RegExp }[] = [
    { code: 'ON', re: /\s*\(Ontario\)\s*$/i },
    { code: 'QC', re: /\s*\((?:Québec|Quebec)\)\s*$/i },
    { code: 'FED', re: /\s*\((?:Federal|Fédéral)\)\s*$/i },
  ]
  for (const { code, re } of patterns) {
    if (jurisdictions.includes(code)) next = next.replace(re, '')
  }
  return next.trim()
}

export function filterTemplates(
  templates: readonly DocTemplate[],
  opts: {
    query: string
    category: string
    jurisdiction: Jurisdiction | 'all'
    reviewLevel: DocRiskLevel | 'all'
  },
): DocTemplate[] {
  const q = opts.query.trim().toLowerCase()
  return templates.filter((tpl) => {
    if (opts.category !== 'all' && tpl.category !== opts.category) return false
    if (opts.jurisdiction !== 'all' && !tpl.jurisdictions.includes(opts.jurisdiction)) return false
    if (opts.reviewLevel !== 'all' && tpl.risk !== opts.reviewLevel) return false
    if (q !== '') {
      const hay =
        `${tpl.tid} ${tpl.name.en} ${tpl.name.fr} ${tpl.desc.en} ${tpl.desc.fr}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
