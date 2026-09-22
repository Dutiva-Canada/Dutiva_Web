import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { bi } from '@/i18n/core'
import { WORKSPACE_NAME, WORKSPACE_USER } from '@/features/app/shell/navConfig'
import { useAuth } from '@/features/app/auth/authContext'
import {
  bootstrapOrganization,
  checkIsAdmin,
  claimOrgInvitations,
  fetchAdminProfile,
  fetchOrganizationMembership,
  fetchOrganizationSettings,
  fetchStoredMode,
  saveStoredMode,
} from './api'
import type { WorkspaceOrganizationSettings } from './api'
import { resetAdvisorSession } from '@/features/app/views/advisor/advisorSession'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { resolveContactDisplayName } from './contactDisplayName'
import { WorkspaceModeContext } from './workspaceModeContext'
import type { AdmissionStatus, WorkspaceIdentity, WorkspaceMode } from './workspaceModeContext'
import type { OrgMemberRole } from './roles'
import { isAdminRole } from './roles'

const DEMO_IDENTITY: WorkspaceIdentity = { companyName: WORKSPACE_NAME, user: WORKSPACE_USER }

const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

/** Sidebar role label — platform admins say Admin; members get their org role. */
function memberRoleLabel(role: OrgMemberRole | null, isAdmin: boolean) {
  if (isAdmin) return bi('Admin', 'Administrateur')
  switch (role) {
    case 'owner':
    case 'admin':
      return bi('Admin', 'Administrateur')
    case 'manager':
      return bi('Manager', 'Gestionnaire')
    case 'viewer':
      return bi('Viewer', 'Observateur')
    case 'consultant':
      return bi('Consultant', 'Consultant·e')
    case 'professional':
      return bi('Professional', 'Professionnel·le')
    default:
      return bi('Member', 'Membre')
  }
}

interface AdminState {
  isAdmin: boolean
  storedMode: WorkspaceMode
  identity: WorkspaceIdentity | null
  organizationId: string | null
  organization: WorkspaceOrganizationSettings | null
  memberRole: OrgMemberRole | null
  admissionStatus: AdmissionStatus
}

const SIGNED_OUT_STATE: AdminState = {
  isAdmin: false,
  storedMode: 'demo',
  identity: null,
  organizationId: null,
  organization: null,
  memberRole: null,
  admissionStatus: 'idle',
}

/**
 * Resolves the workspace mode: 'production' for a signed-in platform admin or
 * any signed-in org member (an invited teammate's pending invitation is
 * claimed into a membership first, so they land in production directly).
 * Everyone else — signed out, non-member, Supabase not configured, still
 * resolving — stays 'demo'.
 */
export function WorkspaceModeProvider({ children }: { readonly children: ReactNode }) {
  const { status, session } = useAuth()
  const { isPublicDemo } = useWorkspaceRoot()
  const [admin, setAdmin] = useState<AdminState>(SIGNED_OUT_STATE)

  useEffect(() => {
    if (status !== 'signed-in' || !session) {
      setAdmin(SIGNED_OUT_STATE)
      return
    }
    const userId = session.user.id
    const email = session.user.email ?? ''
    const authFullName =
      typeof session.user.user_metadata?.full_name === 'string'
        ? session.user.user_metadata.full_name
        : null
    let cancelled = false

    async function load() {
      /* Convert pending invitations addressed to this email into memberships
         before resolving — an invited teammate's first sign-in must already
         see the org they were invited to (migration 0168). */
      const claimed = await claimOrgInvitations()
      if (cancelled) return

      const [isAdmin, storedMode0, profile, membership] = await Promise.all([
        checkIsAdmin(),
        fetchStoredMode(userId),
        fetchAdminProfile(userId),
        fetchOrganizationMembership(userId),
      ])
      if (cancelled) return

      /* Production is for platform admins and org members. Everyone else
         stays in demo — a non-member can still create an org via the
         /employer onboarding door (create_organization is self-serve). */
      const canUseProduction = isAdmin || membership !== null
      if (!canUseProduction) {
        setAdmin(SIGNED_OUT_STATE)
        return
      }

      /* A freshly claimed invite implies intent to work in the real org —
         flip a default 'demo' preference to production so they land there. */
      let storedMode = storedMode0
      if (claimed > 0 && storedMode === 'demo' && membership !== null) {
        const saved = await saveStoredMode(userId, 'production')
        if (cancelled) return
        if (saved) storedMode = 'production'
      }
      /* An admin already in production without an org (e.g. the preference
         predates the org feature) gets provisioned on load; otherwise the
         org is created the first time they switch (see setMode). The RPC
         inserts the caller as the org's active owner. */
      let organizationId = membership?.organizationId ?? null
      let memberRole = membership?.role ?? null
      let organization: WorkspaceOrganizationSettings | null = null
      let admissionStatus: AdmissionStatus = 'idle'
      if (storedMode === 'production' && organizationId === null) {
        const result = await bootstrapOrganization(
          profile?.companyName ?? 'Dutiva Canada Inc.',
          profile?.companyName ?? 'Dutiva Canada Inc.',
        )
        if (cancelled) return
        if (result.status === 'success') {
          organizationId = result.organizationId
          memberRole = result.memberRole ?? 'owner'
          admissionStatus = 'idle'
        } else if (result.status === 'capacity') {
          admissionStatus = 'capacity'
        } else if (result.status === 'waitlist') {
          admissionStatus = 'waitlist'
        } else {
          admissionStatus = 'error'
        }
      }
      if (organizationId && !cancelled) {
        organization = await fetchOrganizationSettings(organizationId)
      }

      /* The workspace's company name is the org's name (the tenant), not the
         member's own profile company — an invited teammate's profile row may
         name a different employer entirely. */
      const companyName =
        organization?.name ?? profile?.companyName ?? 'Dutiva Canada Inc.'

      const contactName = resolveContactDisplayName({
        contactName: profile?.contactName,
        email,
        authFullName,
        fallback: email.split('@')[0] ?? 'Member',
      })
      setAdmin({
        isAdmin,
        storedMode,
        organizationId,
        organization,
        memberRole,
        admissionStatus,
        identity: {
          companyName,
          province: profile?.province ?? 'Ontario',
          city: profile?.city ?? 'Ottawa',
          user: {
            name: contactName,
            initials: initialsOf(contactName),
            role: memberRoleLabel(memberRole, isAdmin),
            email,
          },
        },
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [status, session])

  const setMode = useCallback(
    async (next: WorkspaceMode) => {
      /* Members can toggle once their org exists; only platform admins may
         bootstrap a brand-new org through the mode switch — non-admin org
         creation goes through the /employer onboarding door. */
      if (!session || (!admin.isAdmin && admin.organizationId === null)) return
      const userId = session.user.id
      /* First switch to production provisions the real organization (the
         RPC also inserts the caller as its active owner). */
      let organizationId = admin.organizationId
      let memberRole = admin.memberRole
      let admissionStatus: AdmissionStatus = admin.admissionStatus

      if (next === 'production' && organizationId === null) {
        const companyName = admin.identity?.companyName ?? 'Dutiva Canada Inc.'
        const result = await bootstrapOrganization(companyName, companyName)
        if (!session) return
        if (result.status === 'success') {
          organizationId = result.organizationId
          memberRole = result.memberRole ?? 'owner'
          admissionStatus = 'idle'
        } else if (result.status === 'capacity') {
          admissionStatus = 'capacity'
          setAdmin((prev) => ({ ...prev, admissionStatus: 'capacity' }))
          return
        } else if (result.status === 'waitlist') {
          admissionStatus = 'waitlist'
          setAdmin((prev) => ({ ...prev, admissionStatus: 'waitlist' }))
          return
        } else {
          admissionStatus = 'error'
          setAdmin((prev) => ({ ...prev, admissionStatus: 'error' }))
          return
        }
      }

      const ok = await saveStoredMode(userId, next)
      if (!session) return
      if (!ok) {
        // The organization was already created; keep its id/role in state so a
        // retry does not provision a duplicate tenant.
        setAdmin((prev) => ({ ...prev, organizationId, memberRole, admissionStatus: 'error' }))
        return
      }
      let organization: WorkspaceOrganizationSettings | null = null
      if (organizationId) {
        organization = await fetchOrganizationSettings(organizationId)
      }
      resetAdvisorSession()
      setAdmin((prev) => ({
        ...prev,
        storedMode: next,
        organizationId,
        organization,
        memberRole,
        admissionStatus,
      }))
    },
    [
      admin.isAdmin,
      admin.organizationId,
      admin.memberRole,
      admin.admissionStatus,
      admin.identity,
      session,
    ],
  )

  const clearAdmissionStatus = useCallback(() => {
    setAdmin((prev) => ({ ...prev, admissionStatus: 'idle' }))
  }, [])

  const refreshOrganization = useCallback(async () => {
    if (!admin.organizationId) return
    const organization = await fetchOrganizationSettings(admin.organizationId)
    if (!organization) return
    setAdmin((prev) => ({ ...prev, organization }))
  }, [admin.organizationId])

  const refreshIdentity = useCallback(async () => {
    if (!session || (!admin.isAdmin && admin.organizationId === null)) return
    const profile = await fetchAdminProfile(session.user.id)
    if (!profile) return
    const email = session.user.email ?? ''
    const authFullName =
      typeof session.user.user_metadata?.full_name === 'string'
        ? session.user.user_metadata.full_name
        : null
    const contactName = resolveContactDisplayName({
      contactName: profile.contactName,
      email,
      authFullName,
      fallback: email.split('@')[0] ?? 'Member',
    })
    setAdmin((prev) => ({
      ...prev,
      identity: {
        companyName: prev.organization?.name ?? profile.companyName,
        province: profile.province,
        city: profile.city,
        user: {
          name: contactName,
          initials: initialsOf(contactName),
          role: memberRoleLabel(prev.memberRole, prev.isAdmin),
          email,
        },
      },
    }))
  }, [admin.isAdmin, admin.organizationId, session])

  const value = useMemo(() => {
    if (isPublicDemo) {
      return {
        mode: 'demo' as const,
        isAdmin: false,
        canUseProduction: false,
        identity: DEMO_IDENTITY,
        companyName: WORKSPACE_NAME,
        organizationId: null,
        organization: null,
        memberRole: null,
        isOrgAdmin: false,
        setMode: async () => {},
        refreshIdentity: async () => {},
        refreshOrganization: async () => {},
        admissionStatus: 'idle' as const,
        clearAdmissionStatus: () => {},
      }
    }
    /* Production mode is only exposed when an organization actually exists;
       otherwise a failed/capacity-blocked bootstrap keeps the UI in demo so
       the user sees the capacity state instead of a broken production shell. */
    const mode: WorkspaceMode =
      admin.storedMode === 'production' && admin.organizationId !== null
        ? 'production'
        : 'demo'
    const memberRole = mode === 'production' ? admin.memberRole : null
    return {
      mode,
      isAdmin: admin.isAdmin,
      /* Platform admin or any org member — the mode switch and production
         surfaces render for either; RLS still scopes what each can write. */
      canUseProduction: admin.isAdmin || admin.organizationId !== null,
      identity: mode === 'production' && admin.identity ? admin.identity : DEMO_IDENTITY,
      companyName: admin.identity?.companyName ?? 'Dutiva Canada Inc.',
      organizationId: mode === 'production' ? admin.organizationId : null,
      organization: mode === 'production' ? admin.organization : null,
      memberRole,
      /* Mirrors RLS's is_org_admin: platform admin, or owner/admin role. */
      isOrgAdmin: mode === 'production' && (admin.isAdmin || isAdminRole(memberRole)),
      setMode,
      refreshIdentity,
      refreshOrganization,
      admissionStatus: admin.admissionStatus,
      clearAdmissionStatus,
    }
  }, [admin, setMode, refreshIdentity, refreshOrganization, clearAdmissionStatus, isPublicDemo])

  return <WorkspaceModeContext.Provider value={value}>{children}</WorkspaceModeContext.Provider>
}
