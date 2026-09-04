import { z } from 'zod'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { supabase } from '@/lib/supabaseClient'
import type { WorkspaceMode } from './workspaceModeContext'
import type { OrgMemberRole } from './roles'
import { isOrgMemberRole } from './roles'

export interface AdminProfile {
  companyName: string
  contactName: string
  province: string
  city: string
}

const preferenceRowSchema = z.object({ mode: z.enum(['demo', 'production']) })

const profileRowSchema = z.object({
  legal_name: z.string().nullable(),
  company_name: z.string().nullable(),
  primary_contact: z.string().nullable(),
  province: z.string().nullable(),
  city: z.string().nullable(),
})

/**
 * Real backend reads behind the workspace mode toggle. Every function
 * degrades to the safe "demo"/non-admin answer when Supabase isn't
 * configured, the call fails, or the client doesn't implement a method
 * (e.g. a test double stubbing only the auth surface) — this feature must
 * never throw and strand the app, so each call is wrapped defensively.
 */

/**
 * True for platform admins. Prefers the session email domain check so
 * `@dutiva.ca` staff get admin surfaces even before/without an `admin_users`
 * row; the `is_admin_user` RPC (JWT role, admin_users, and the same domain)
 * remains the server source of truth for RLS.
 */
export async function checkIsAdmin(): Promise<boolean> {
  if (!supabase) return false
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (isInternalDutivaAccount(session?.user?.email)) return true
    const { data, error } = await supabase.rpc('is_admin_user')
    return !error && data === true
  } catch {
    return false
  }
}

export async function fetchStoredMode(userId: string): Promise<WorkspaceMode> {
  if (!supabase) return 'demo'
  try {
    const { data, error } = await supabase
      .from('workspace_preferences')
      .select('mode')
      .eq('user_id', userId)
      .maybeSingle()
    if (error || !data) return 'demo'
    return preferenceRowSchema.parse(data).mode
  } catch {
    return 'demo'
  }
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

export interface OrganizationMembership {
  organizationId: string
  /** Null when the row predates role reads or carries an unknown value. */
  role: OrgMemberRole | null
}

/** The user's active organization membership, if one has been provisioned. */
export async function fetchOrganizationMembership(
  userId: string,
): Promise<OrganizationMembership | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations!inner(created_at)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { referencedTable: 'organizations', ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    const row = z
      .object({ organization_id: z.string(), role: z.string().nullable().optional() })
      .parse(data)
    return {
      organizationId: row.organization_id,
      role: isOrgMemberRole(row.role) ? row.role : null,
    }
  } catch {
    return null
  }
}

export type OrganizationAdmissionResult =
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

export async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('legal_name, company_name, primary_contact, province, city')
      .eq('id', userId)
      .maybeSingle()
    if (error || !data) return null
    return profileFromRow(profileRowSchema.parse(data))
  } catch {
    return null
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
