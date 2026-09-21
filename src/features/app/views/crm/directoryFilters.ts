import type { CrmCompany, CrmContact, CrmContactStatus } from './types'

/**
 * Customer-directory filter state + saved views.
 *
 * The CRM workspace is intentionally storage-light: production persistence is
 * a single localStorage blob per org (`useCrmData`), and demo mode shares one
 * fixture set. Saved views follow the same shape — a second localStorage key
 * per scope — rather than a new server table the rest of the CRM doesn't have.
 *
 * "Directory" here means the Contacts and Companies tabs; deals and activities
 * keep their own flows.
 */

/** Sentinel for "contact has no company" — a real id could never equal it. */
export const NO_COMPANY = '__none__'

export interface CrmContactFilter {
  /** Free-text match against name, email, phone, role and company name. */
  query: string
  /** Subset of statuses; an empty list means "all statuses". */
  statuses: CrmContactStatus[]
  /** undefined = any company; NO_COMPANY = only unassigned; else a company id. */
  companyId?: string
}

export interface CrmCompanyFilter {
  /** Free-text match against name, domain and industry. */
  query: string
  /** undefined = any industry; otherwise an exact industry string. */
  industry?: string
}

export interface CrmSavedView {
  id: string
  name: string
  filter: CrmContactFilter
}

export function emptyContactFilter(): CrmContactFilter {
  return { query: '', statuses: [] }
}

export function emptyCompanyFilter(): CrmCompanyFilter {
  return { query: '' }
}

export function isContactFilterActive(filter: CrmContactFilter): boolean {
  return filter.query.trim() !== '' || filter.statuses.length > 0 || filter.companyId !== undefined
}

export function isCompanyFilterActive(filter: CrmCompanyFilter): boolean {
  return filter.query.trim() !== '' || filter.industry !== undefined
}

function matchesText(haystack: (string | undefined)[], query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return haystack.some((value) => value?.toLowerCase().includes(q))
}

export function applyContactFilter(
  contacts: readonly CrmContact[],
  filter: CrmContactFilter,
  companyName: (id?: string) => string,
): CrmContact[] {
  return contacts.filter((contact) => {
    if (filter.statuses.length > 0 && !filter.statuses.includes(contact.status)) {
      return false
    }
    if (filter.companyId === NO_COMPANY) {
      if (contact.companyId) return false
    } else if (filter.companyId !== undefined && contact.companyId !== filter.companyId) {
      return false
    }
    return matchesText(
      [contact.name, contact.email, contact.phone, contact.role, companyName(contact.companyId)],
      filter.query,
    )
  })
}

export function applyCompanyFilter(
  companies: readonly CrmCompany[],
  filter: CrmCompanyFilter,
): CrmCompany[] {
  return companies.filter((company) => {
    if (filter.industry !== undefined && company.industry !== filter.industry) {
      return false
    }
    return matchesText([company.name, company.domain, company.industry, company.size], filter.query)
  })
}

/** Distinct non-empty industries across the directory, for the filter select. */
export function companyIndustries(companies: readonly CrmCompany[]): string[] {
  const seen = new Set<string>()
  for (const company of companies) {
    if (company.industry) seen.add(company.industry)
  }
  return [...seen].sort((a, b) => a.localeCompare(b))
}

/* ---------- Saved views ---------- */

const storageKey = (scope: string) => `dutiva-crm-contact-views-${scope}`

/**
 * Scope mirrors useCrmData's keying: demo shares one fixture world, production
 * is per-org. Views are per-user-per-browser, same as the CRM records
 * themselves today.
 */
export function contactViewsScope(
  mode: 'demo' | 'production',
  orgId: string | null | undefined,
): string {
  return mode === 'production' && orgId ? orgId : 'demo'
}

export function loadContactViews(scope: string): CrmSavedView[] {
  try {
    const raw = localStorage.getItem(storageKey(scope))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is CrmSavedView =>
        typeof v === 'object' &&
        v !== null &&
        typeof (v as CrmSavedView).id === 'string' &&
        typeof (v as CrmSavedView).name === 'string' &&
        typeof (v as CrmSavedView).filter === 'object',
    )
  } catch {
    return []
  }
}

export function persistContactViews(scope: string, views: readonly CrmSavedView[]): void {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(views))
  } catch {
    // Storage full or unavailable — views stay in-memory for the session.
  }
}

export function createViewId(): string {
  return `view-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
