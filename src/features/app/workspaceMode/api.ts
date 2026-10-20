import { z } from 'zod'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { supabase } from '@/lib/supabaseClient'
import type { Json } from '@/lib/supabase/database.types'
import type { WorkspaceMode } from './workspaceModeContext'
import type { OrgMemberRole } from './roles'
import { isOrgMemberRole } from './roles'

interface AdminProfile {
  companyName: string
  contactName: string
  province: string
  city: string
}

const preferenceRowSchema = z.object({
  mode: z.enum(['demo', 'production']),
  active_organization_id: z.string().nullable().optional(),
})

const profileRowSchema = z.object({
  legal_name: z.string().nullable(),
  company_name: z.string().nullable(),
  primary_contact: z.string().nullable(),
  province: z.string().nullable(),
  city: z.string().nullable(),
})

/**
 * Result of a resolution read: `ok: false` means the backend call failed —
 * distinct from a confirmed absent row, so the provider can retry instead of
 * committing a degraded identity. (A failed membership/mode read must never
 * silently downgrade a signed-in user to the demo persona.)
 */
export type ReadResult<T> = { ok: true; value: T } | { ok: false }

const ok = <T>(value: T): ReadResult<T> => ({ ok: true, value })
const READ_FAILED: ReadResult<never> = { ok: false }

/**
 * Real backend reads behind the workspace mode toggle. Identity-shaping
 * reads (session mode, membership, admin flag, profile, invite claims)
 * return `ReadResult` so a failed call is distinguishable from "row does
 * not exist" — callers retry failures rather than committing the wrong
 * workspace. Other helpers still degrade to the safe "demo"/empty answer
 * when Supabase isn't configured, the call fails, or the client doesn't
 * implement a method (e.g. a test double stubbing only the auth surface) —
 * this feature must never throw and strand the app, so each call is
 * wrapped defensively.
 */

/**
 * True for platform admins. Prefers the session email domain check so
 * `@dutiva.ca` staff get admin surfaces even before/without an `admin_users`
 * row; the `is_admin_user` RPC (JWT role, admin_users, and the same domain)
 * remains the server source of truth for RLS.
 */
export async function checkIsAdmin(): Promise<ReadResult<boolean>> {
  if (!supabase) return READ_FAILED
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (isInternalDutivaAccount(session?.user?.email)) return ok(true)
    const { data, error } = await supabase.rpc('is_admin_user')
    if (error) return READ_FAILED
    return ok(data === true)
  } catch {
    return READ_FAILED
  }
}

export interface WorkspacePrefs {
  mode: WorkspaceMode
  /** The member's chosen org when they hold more than one membership (0244). */
  activeOrganizationId: string | null
}

export async function fetchWorkspacePrefs(userId: string): Promise<ReadResult<WorkspacePrefs>> {
  if (!supabase) return READ_FAILED
  try {
    const { data, error } = await supabase
      .from('workspace_preferences')
      .select('mode, active_organization_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) return READ_FAILED
    if (!data) return ok({ mode: 'demo', activeOrganizationId: null })
    const parsed = preferenceRowSchema.parse(data)
    return ok({ mode: parsed.mode, activeOrganizationId: parsed.active_organization_id ?? null })
  } catch {
    return READ_FAILED
  }
}

export async function fetchStoredMode(userId: string): Promise<ReadResult<WorkspaceMode>> {
  const res = await fetchWorkspacePrefs(userId)
  return res.ok ? ok(res.value.mode) : READ_FAILED
}

export async function saveStoredMode(userId: string, mode: WorkspaceMode): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('workspace_preferences')
      .upsert({ user_id: userId, mode, updated_at: new Date().toISOString() })
    return !error
  } catch {
    return false
  }
}

/** Persist the member's active organization for multi-org memberships (0244). */
export async function saveActiveOrganization(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('workspace_preferences').upsert({
      user_id: userId,
      active_organization_id: organizationId,
      updated_at: new Date().toISOString(),
    })
    return !error
  } catch {
    return false
  }
}

/**
 * Server-side onboarding marks (migration 0169): the `onboarding` jsonb
 * column on workspace_preferences, keyed by organization id. Marks are
 * monotonic — a visit or dismissal never un-happens — so reads merge with
 * OR semantics and writes carry the union back.
 */
const onboardingMarksSchema = z.object({
  studioVisited: z.boolean().optional(),
  workflowVisited: z.boolean().optional(),
  setupCardDismissed: z.boolean().optional(),
})

type OnboardingMarks = z.infer<typeof onboardingMarksSchema>

const onboardingMapSchema = z.record(z.string(), onboardingMarksSchema)

export async function fetchOnboardingMarks(
  userId: string,
): Promise<Record<string, OnboardingMarks>> {
  if (!supabase) return {}
  try {
    const { data, error } = await supabase
      .from('workspace_preferences')
      .select('onboarding')
      .eq('user_id', userId)
      .maybeSingle()
    if (error || !data) return {}
    /* Column missing (migration not applied) or unexpected shape → no marks. */
    return onboardingMapSchema.parse(data.onboarding ?? {})
  } catch {
    return {}
  }
}

/**
 * Merge `marks` into the caller's onboarding entry for `organizationId`.
 * Resolves the session itself so call sites (Studio, Workflows, Home) only
 * pass what they know. Returns false when unauthenticated/unconfigured —
 * callers keep their localStorage write either way.
 */
export async function saveOnboardingMarks(
  organizationId: string,
  marks: OnboardingMarks,
): Promise<boolean> {
  if (!supabase) return false
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return false
    const existing = await fetchOnboardingMarks(userId)
    const merged = {
      ...existing,
      [organizationId]: { ...existing[organizationId], ...marks },
    }
    const { error } = await supabase.from('workspace_preferences').upsert({
      user_id: userId,
      onboarding: merged as Json,
      updated_at: new Date().toISOString(),
    })
    return !error
  } catch {
    return false
  }
}

export interface OrganizationMembership {
  organizationId: string
  organizationName: string
  /** Null when the row predates role reads or carries an unknown value. */
  role: OrgMemberRole | null
  /**
   * Consultant/viewer module scope (0244). Empty = unscoped member access;
   * non-empty restricts the member to the listed module keys. RLS enforces
   * via org_member_has_module; the client mirrors it for nav gating.
   */
  grantedModules: string[]
  /** Membership end-of-access timestamp — RLS treats expired rows as absent. */
  accessExpiresAt: string | null
}

const membershipRowSchema = z.object({
  organization_id: z.string(),
  role: z.string().nullable().optional(),
  granted_modules: z.array(z.string()).nullable().optional(),
  access_expires_at: z.string().nullable().optional(),
  organizations: z.object({ name: z.string().nullable() }).nullable().optional(),
})

/**
 * All of the user's active, unexpired organization memberships — newest org
 * first. A consultant or staff member may hold several; callers pick the
 * active one via workspace_preferences.active_organization_id (0244).
 */
export async function fetchOrganizationMemberships(
  userId: string,
): Promise<ReadResult<OrganizationMembership[]>> {
  if (!supabase) return READ_FAILED
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select(
        'organization_id, role, granted_modules, access_expires_at, organizations!inner(name, created_at)',
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`access_expires_at.is.null,access_expires_at.gt.${new Date().toISOString()}`)
      /* Order the parent rows by the org's created_at — `organizations(…)`
         targets the parent table; `referencedTable` only sorts the embedded
         rows and would silently no-op here. */
      .order('organizations(created_at)', { ascending: false })
    if (error) return READ_FAILED
    const rows = z.array(membershipRowSchema).parse(data ?? [])
    return ok(
      rows.map((row) => ({
        organizationId: row.organization_id,
        organizationName: row.organizations?.name ?? '',
        role: isOrgMemberRole(row.role) ? row.role : null,
        grantedModules: row.granted_modules ?? [],
        accessExpiresAt: row.access_expires_at ?? null,
      })),
    )
  } catch {
    return READ_FAILED
  }
}

/** The user's active organization membership, if one has been provisioned. */
export async function fetchOrganizationMembership(
  userId: string,
): Promise<ReadResult<OrganizationMembership | null>> {
  const res = await fetchOrganizationMemberships(userId)
  if (!res.ok) return READ_FAILED
  return ok(res.value[0] ?? null)
}

type OrganizationAdmissionResult =
  | { status: 'success'; organizationId: string; memberRole: OrgMemberRole }
  | { status: 'capacity' }
  | { status: 'waitlist' }
  | { status: 'error' }

const createOrganizationResultSchema = z.union([
  z.object({ id: z.string(), member_role: z.string().optional() }),
  z.object({ error: z.enum(['CAPACITY_REACHED', 'WAITLIST']) }),
])

/**
 * First-run provisioning: the create_organization() RPC inserts the org and
 * the caller as its active owner atomically (SECURITY DEFINER, backend-owned).
 *
 * The RPC now returns a jsonb result so the caller can distinguish success
 * from capacity/waitlist states without parsing raw PostgreSQL exceptions.
 */
export async function bootstrapOrganization(
  name: string,
  legalName: string,
): Promise<OrganizationAdmissionResult> {
  if (!supabase) return { status: 'error' }
  try {
    const { data, error } = await supabase.rpc('create_organization', {
      org_name: name,
      org_legal_name: legalName,
    })
    if (error || !data) return { status: 'error' }
    const result = createOrganizationResultSchema.parse(data)
    if ('error' in result) {
      if (result.error === 'CAPACITY_REACHED') return { status: 'capacity' }
      if (result.error === 'WAITLIST') return { status: 'waitlist' }
      return { status: 'error' }
    }
    return {
      status: 'success',
      organizationId: result.id,
      memberRole: isOrgMemberRole(result.member_role) ? result.member_role : 'owner',
    }
  } catch {
    return { status: 'error' }
  }
}

export async function joinOrganizationWaitlist(
  requestedName: string,
): Promise<'waiting' | 'already_waiting' | 'error'> {
  if (!supabase) return 'error'
  try {
    const { data, error } = await supabase.rpc('join_organization_waitlist', {
      requested_org_name: requestedName,
    })
    if (error || !data) return 'error'
    const parsed = z.object({ status: z.enum(['waiting', 'already_waiting']) }).safeParse(data)
    if (!parsed.success) return 'error'
    return parsed.data.status
  } catch {
    return 'error'
  }
}

export interface WorkspaceOrganizationSettings {
  id: string
  name: string
  industry: string | null
  jurisdictions: string[]
  /** Workspace-wide module enable/disable. Missing keys default to enabled. */
  enabledModules: Record<string, boolean>
  /** Deprecated: finance tab flags, kept for back-fill. Prefer enabledModules. */
  financeFeatures: Record<string, boolean>
}

const organizationRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string().nullable(),
  jurisdictions: z.array(z.string()),
  enabled_modules: z.record(z.string(), z.boolean()).nullable().optional(),
  finance_features: z.record(z.string(), z.boolean()).nullable().optional(),
})

function orgSettingsFromRow(
  row: z.infer<typeof organizationRowSchema>,
): WorkspaceOrganizationSettings {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    jurisdictions: row.jurisdictions,
    enabledModules: row.enabled_modules ?? {},
    financeFeatures: row.finance_features ?? {},
  }
}

/**
 * Materialize the caller's pending organization_invitations into active
 * memberships (SECURITY DEFINER RPC — migration 0168). Called once per
 * signed-in load before membership resolution so an invited teammate lands
 * in production on first sign-in. Returns the number of invites claimed.
 */
export async function claimOrgInvitations(): Promise<ReadResult<number>> {
  if (!supabase) return READ_FAILED
  try {
    const { data, error } = await supabase.rpc('claim_org_invitations')
    /* A hard error is a failed read (callers retry); a null/empty payload is
       "nothing to claim" — invite claiming is a best-effort first pass and
       the membership read below is what actually decides identity. */
    if (error) return READ_FAILED
    return ok(typeof data === 'number' ? data : 0)
  } catch {
    return READ_FAILED
  }
}

export interface OrgDirectoryMember {
  memberId: string
  userId: string
  email: string
  displayName: string
  role: OrgMemberRole | null
  status: string
  accessExpiresAt: string | null
  /** Consultant/viewer module scope (0244); empty = unscoped. */
  grantedModules: string[]
}

const directoryRowSchema = z.object({
  member_id: z.string(),
  user_id: z.string(),
  email: z.string().nullable(),
  display_name: z.string().nullable(),
  role: z.string().nullable(),
  status: z.string(),
  access_expires_at: z.string().nullable(),
  granted_modules: z.array(z.string()).nullable().optional(),
})

/** Org-admin-only member list with emails (SECURITY DEFINER — migration 0168). */
export async function listOrgMembers(organizationId: string): Promise<OrgDirectoryMember[]> {
  if (!supabase) return []
  try {
    const { data, error } = await supabase.rpc('org_member_directory', { p_org: organizationId })
    if (error || !data) return []
    return z
      .array(directoryRowSchema)
      .parse(data)
      .map((row) => ({
        memberId: row.member_id,
        userId: row.user_id,
        email: row.email ?? '',
        displayName: row.display_name ?? '',
        role: isOrgMemberRole(row.role) ? row.role : null,
        status: row.status,
        accessExpiresAt: row.access_expires_at,
        grantedModules: row.granted_modules ?? [],
      }))
  } catch {
    return []
  }
}

export interface OrgInvitation {
  id: string
  email: string
  role: OrgMemberRole | null
  status: string
  expiresAt: string
}

const invitationRowSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.string(),
  expires_at: z.string(),
})

/** Scope carried on an invite so the claimed membership starts scoped (0244). */
export interface InviteScope {
  grantedModules?: string[]
  accessExpiresAt?: string | null
}

/** Pending invitations for the org (admin-only via RLS — migration 0168). */
export async function listOrgInvitations(organizationId: string): Promise<OrgInvitation[]> {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('organization_invitations')
      .select('id, email, role, status, expires_at')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return z
      .array(invitationRowSchema)
      .parse(data)
      .map((row) => ({
        id: row.id,
        email: row.email,
        role: isOrgMemberRole(row.role) ? row.role : null,
        status: row.status,
        expiresAt: row.expires_at,
      }))
  } catch {
    return []
  }
}

/**
 * Invite an email to the org: insert the pending invitation (admin-only RLS),
 * then ask the send-org-invite edge function to deliver it. A mail failure
 * never blocks the invite — claim_org_invitations() still admits the address
 * on sign-in. Returns the invitation id on success, null on failure.
 */
export async function inviteOrgMember(
  organizationId: string,
  email: string,
  role: OrgMemberRole,
  scope: InviteScope = {},
): Promise<{ id: string; emailed: boolean } | { error: string }> {
  if (!supabase) return { error: 'offline' }
  const normalized = email.trim().toLowerCase()
  try {
    const { data, error } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: organizationId,
        email: normalized,
        role,
        status: 'pending',
        granted_modules: scope.grantedModules ?? [],
        access_expires_at: scope.accessExpiresAt ?? null,
      })
      .select('id')
      .single()
    if (error || !data) return { error: error?.message ?? 'insert failed' }
    const invitationId = (data as { id: string }).id

    let emailed = false
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('send-org-invite', {
        body: { invitationId },
      })
      emailed = !fnError && (fnData as { emailed?: boolean } | null)?.emailed === true
    } catch {
      emailed = false
    }
    return { id: invitationId, emailed }
  } catch {
    return { error: 'offline' }
  }
}

/** Revoke a pending invitation (hard delete — no revoked status is needed). */
export async function revokeOrgInvitation(invitationId: string): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId)
    return !error
  } catch {
    return false
  }
}

/** Change a member's role (admin-only RLS on organization_members). */
export async function updateMemberRole(memberId: string, role: OrgMemberRole): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId)
    return !error
  } catch {
    return false
  }
}

/**
 * Update a member's module scope and access expiry (admin-only RLS). Pass an
 * empty grantedModules to restore unscoped member access; null expiry for
 * open-ended access (0244).
 */
export async function updateMemberScope(
  memberId: string,
  scope: { grantedModules: string[]; accessExpiresAt: string | null },
): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('organization_members')
      .update({
        granted_modules: scope.grantedModules,
        access_expires_at: scope.accessExpiresAt,
      })
      .eq('id', memberId)
    return !error
  } catch {
    return false
  }
}

/** Remove a member row entirely (admin-only RLS). */
export async function removeOrgMember(memberId: string): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('organization_members').delete().eq('id', memberId)
    return !error
  } catch {
    return false
  }
}

export async function fetchOrganizationSettings(
  organizationId: string,
): Promise<WorkspaceOrganizationSettings | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, industry, jurisdictions, enabled_modules, finance_features')
      .eq('id', organizationId)
      .maybeSingle()
    if (error || !data) return null
    return orgSettingsFromRow(organizationRowSchema.parse(data))
  } catch {
    return null
  }
}

export async function updateOrganizationSettings(
  organizationId: string,
  patch: Partial<
    Pick<
      WorkspaceOrganizationSettings,
      'name' | 'industry' | 'jurisdictions' | 'enabledModules' | 'financeFeatures'
    >
  >,
): Promise<WorkspaceOrganizationSettings | null> {
  if (!supabase) return null
  /* Unset/blank keys serialize as `undefined` and drop out of the JSON body —
     a patch that only names `name` must not wipe industry or jurisdictions. */
  const name = patch.name?.trim()
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: name || undefined,
        industry: patch.industry,
        jurisdictions: patch.jurisdictions,
        enabled_modules: patch.enabledModules as unknown as Json,
        finance_features: patch.financeFeatures as unknown as Json,
      })
      .eq('id', organizationId)
      .select('id, name, industry, jurisdictions, enabled_modules, finance_features')
      .maybeSingle()
    if (error || !data) return null
    return orgSettingsFromRow(organizationRowSchema.parse(data))
  } catch {
    return null
  }
}
function profileFromRow(row: z.infer<typeof profileRowSchema>): AdminProfile {
  const rawContact = row.primary_contact?.trim() || null
  return {
    companyName: row.legal_name ?? row.company_name ?? 'Dutiva Canada Inc.',
    /* Keep the raw DB value; WorkspaceModeProvider resolves a display name so
       email-shaped primary_contact does not appear as the sidebar label. */
    contactName: rawContact ?? 'Martin Constantineau',
    province: row.province ?? 'Ontario',
    city: row.city ?? 'Ottawa',
  }
}

export async function fetchAdminProfile(
  userId: string,
): Promise<ReadResult<AdminProfile | null>> {
  if (!supabase) return READ_FAILED
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('legal_name, company_name, primary_contact, province, city')
      .eq('id', userId)
      .maybeSingle()
    if (error) return READ_FAILED
    if (!data) return ok(null)
    return ok(profileFromRow(profileRowSchema.parse(data)))
  } catch {
    return READ_FAILED
  }
}

/** Persist company / region fields on the signed-in user's own `profiles` row. */
export async function updateAdminProfile(
  userId: string,
  patch: { companyName: string; province: string; city: string },
): Promise<AdminProfile | null> {
  if (!supabase) return null
  const companyName = patch.companyName.trim()
  const province = patch.province.trim()
  const city = patch.city.trim()
  if (!companyName || !province || !city) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        legal_name: companyName,
        company_name: companyName,
        province,
        city,
      })
      .eq('id', userId)
      .select('legal_name, company_name, primary_contact, province, city')
      .maybeSingle()
    if (error || !data) return null
    return profileFromRow(profileRowSchema.parse(data))
  } catch {
    return null
  }
}
