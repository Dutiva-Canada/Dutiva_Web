import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

/**
 * Platform-admin customer directory. Both RPCs exist in the production schema
 * (supabase/schema.sql) and are SECURITY DEFINER gated by is_admin(auth.uid())
 * — the same gate the support console uses — so a non-admin caller receives an
 * error, not rows. Migration 0158 grants EXECUTE to `authenticated` so an
 * admin's browser session can call them; anon stays revoked.
 *
 * `plan`/`subscription_status` come from public.profiles, which only has a row
 * once an account has touched Stripe checkout — absence means the account is on
 * the free plan (the convention documented in migration 0013). The view layer
 * renders that null as 'free'/'inactive'.
 */

export interface AdminDirectoryUser {
  userId: string
  email: string | null
  companyName: string | null
  plan: string | null
  subscriptionStatus: string | null
  billingPeriod: string | null
  roles: string[]
  createdAt: string
  lastSignInAt: string | null
}

export interface AdminDirectoryOrganization {
  organizationId: string
  name: string
  legalName: string | null
  plan: string | null
  subscriptionStatus: string | null
  billingPeriod: string | null
  memberCount: number
  createdAt: string
}

const userSchema = z.object({
  user_id: z.string(),
  email: z.string().nullable(),
  company_name: z.string().nullable(),
  plan: z.string().nullable(),
  subscription_status: z.string().nullable(),
  billing_period: z.string().nullable(),
  roles: z.array(z.string()).nullable(),
  created_at: z.string(),
  last_sign_in_at: z.string().nullable(),
})

const organizationSchema = z.object({
  organization_id: z.string(),
  name: z.string(),
  legal_name: z.string().nullable(),
  plan: z.string().nullable(),
  subscription_status: z.string().nullable(),
  billing_period: z.string().nullable(),
  member_count: z.number(),
  created_at: z.string(),
})

export async function adminListUsers(): Promise<AdminDirectoryUser[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw error
  return z
    .array(userSchema)
    .parse(data ?? [])
    .map((r) => ({
      userId: r.user_id,
      email: r.email,
      companyName: r.company_name,
      plan: r.plan,
      subscriptionStatus: r.subscription_status,
      billingPeriod: r.billing_period,
      roles: r.roles ?? [],
      createdAt: r.created_at,
      lastSignInAt: r.last_sign_in_at,
    }))
}

export async function adminListOrganizations(): Promise<AdminDirectoryOrganization[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('admin_list_organizations')
  if (error) throw error
  return z
    .array(organizationSchema)
    .parse(data ?? [])
    .map((r) => ({
      organizationId: r.organization_id,
      name: r.name,
      legalName: r.legal_name,
      plan: r.plan,
      subscriptionStatus: r.subscription_status,
      billingPeriod: r.billing_period,
      memberCount: r.member_count,
      createdAt: r.created_at,
    }))
}
