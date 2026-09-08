import { homeMessages as M } from '@/i18n/messages/home'
import type { Bi } from '@/i18n/core'
import type { OrgMemberRole } from '@/features/app/workspaceMode/roles'

/**
 * Role-aware Home cockpit chrome. This is a Phase 0 seam: it swaps the header
 * and, for non-operational roles, replaces the full dashboard with a scoped
 * empty state. As the new modules get real data, this config will grow into
 * role-specific stat tiles, queues, and module cards.
 */

export interface HomeRoleProfile {
  /** The title shown in the production Home header. */
  title: Bi
  /** The subtitle under the title. */
  sub: Bi
  /** Whether the full executive/operational dashboard should render. */
  showDashboard: boolean
  /** Optional empty-state title/body when the workspace has no records for this role. */
  emptyTitle: Bi
  emptyBody: Bi
}

const EXEC: HomeRoleProfile = {
  title: M.home_prod_greeting,
  sub: M.home_prod_sub,
  showDashboard: true,
  emptyTitle: M.home_production_title,
  emptyBody: M.home_production_body,
}

const profiles: Record<OrgMemberRole, HomeRoleProfile> = {
  owner: EXEC,
  admin: EXEC,
  manager: {
    title: M.home_role_title_manager,
    sub: M.home_role_sub_manager,
    showDashboard: true,
    emptyTitle: M.home_role_empty_title,
    emptyBody: M.home_role_empty_body,
  },
  professional: {
    title: M.home_role_title_professional,
    sub: M.home_role_sub_professional,
    showDashboard: true,
    emptyTitle: M.home_role_empty_title,
    emptyBody: M.home_role_empty_body,
  },
  member: {
    title: M.home_role_title_member,
    sub: M.home_role_sub_member,
    showDashboard: false,
    emptyTitle: M.home_role_empty_title,
    emptyBody: M.home_role_empty_body,
  },
  consultant: {
    title: M.home_role_title_consultant,
    sub: M.home_role_sub_consultant,
    showDashboard: false,
    emptyTitle: M.home_role_empty_title,
    emptyBody: M.home_role_empty_body,
  },
  viewer: {
    title: M.home_role_title_viewer,
    sub: M.home_role_sub_viewer,
    showDashboard: false,
    emptyTitle: M.home_role_empty_title,
    emptyBody: M.home_role_empty_body,
  },
}

export function homeRoleProfile(role: OrgMemberRole | null): HomeRoleProfile {
  if (role == null) return EXEC
  return profiles[role] ?? EXEC
}
