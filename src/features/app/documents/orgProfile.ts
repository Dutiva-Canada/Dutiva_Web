import type { WorkspaceIdentity } from '@/features/app/workspaceMode/workspaceModeContext'
import type { Jurisdiction, OrgProfile } from './data'

/** Production starts from identity — never Northgate's demo headcount/sector. */
export function orgProfileForIdentity(identity: WorkspaceIdentity): OrgProfile {
  const province = identity.province?.trim().toUpperCase()
  const primaryJurisdiction: Jurisdiction =
    province === 'QC' || province === 'QUÉBEC' || province === 'QUEBEC' ? 'QC' : 'ON'
  return {
    name: identity.companyName,
    headcount: 1,
    unionized: false,
    sector: 'prof_services',
    primaryJurisdiction,
  }
}

/** Active + on-leave roster size for Documents applicability; at least 1. */
export function activeHeadcount(
  employees: readonly { status: 'active' | 'on_leave' | 'terminated' }[],
): number {
  const count = employees.filter((e) => e.status !== 'terminated').length
  return Math.max(1, count)
}
