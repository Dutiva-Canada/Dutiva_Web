import { createContext, useContext } from 'react'
import type { Bi } from '@/i18n/core'
import type { OrgMemberRole } from './roles'

export type WorkspaceMode = 'demo' | 'production'

export type AdmissionStatus = 'idle' | 'capacity' | 'waitlist' | 'error'

export interface WorkspaceIdentity {
  companyName: string
  /** Real operating region — set only on the production identity (from `profiles`). */
  province?: string
  city?: string
  user: {
    name: string
    initials: string
    role: Bi
    email: string
  }
}

export interface WorkspaceModeContextValue {
  mode: WorkspaceMode
  /** True for platform admins (`@dutiva.ca` or `is_admin_user()`). */
  isAdmin: boolean
  /** Northgate Logistics Inc. fixture identity in demo; the admin's real profile in production. */
  identity: WorkspaceIdentity
  /**
   * The real company name of the signed-in admin, regardless of whether the
   * workspace is currently in demo or production mode. Used for flows such as
   * the capacity waitlist where the production identity is not yet exposed.
   */
  companyName: string
  /**
   * The admin's real organization (auto-provisioned on first switch to
   * production via the create_organization() RPC). Always null in demo mode
   * — production modules scope every real read/write to this id.
   */
  organizationId: string | null
  /**
   * The signed-in user's organization_members.role — null in demo mode or
   * before the membership resolves. Today's only real membership is the
   * provisioning owner; the field exists so views can gate per role when
   * the workspace opens to more members.
   */
  memberRole: OrgMemberRole | null
  /**
   * Client mirror of RLS's is_org_admin (platform admin, or owner/admin
   * membership): whether write surfaces should render at all. RLS stays
   * the enforcement — this only keeps the UI from offering writes the
   * database would refuse.
   */
  isOrgAdmin: boolean
  /** No-op for non-admins — the toggle is only ever rendered for isAdmin. */
  setMode: (mode: WorkspaceMode) => Promise<void>
  /**
   * Set when an attempted switch to production is rejected by the server-side
   * capacity gate, so the UI can show the dedicated capacity/waitlist state.
   */
  admissionStatus: AdmissionStatus
  /** Clear the capacity admission state (e.g. when the user dismisses the alert). */
  clearAdmissionStatus: () => void
}

export const WorkspaceModeContext = createContext<WorkspaceModeContextValue | null>(null)

export function useWorkspaceMode(): WorkspaceModeContextValue {
  const ctx = useContext(WorkspaceModeContext)
  if (!ctx) throw new Error('useWorkspaceMode must be used within WorkspaceModeProvider')
  return ctx
}
