/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import type { FullConfig } from '@playwright/test'

/**
 * Seeds a dedicated e2e admin (auth user + workspace membership + admin_users)
 * and mints a Playwright storageState without sending email:
 * Admin generateLink → anon verifyOtp → localStorage session for the SPA origin.
 */

const E2E_EMAIL = (process.env.E2E_ADMIN_EMAIL || 'e2e-playwright@dutiva.ca').toLowerCase()
const AUTH_STATE_PATH = join(dirname(fileURLToPath(import.meta.url)), '../.auth/admin.json')

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `e2e-auth globalSetup: missing ${name}. Set Supabase URL, anon key, and SUPABASE_SERVICE_ROLE_KEY.`,
    )
  }
  return value
}

function authStorageKey(supabaseUrl: string): string {
  const host = new URL(supabaseUrl).hostname.split('.')[0]
  return `sb-${host}-auth-token`
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const supabaseUrl = requireEnv(
    'VITE_SUPABASE_URL or SUPABASE_URL',
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  )
  const anonKey = requireEnv(
    'VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY',
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  )
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const user = await ensureAuthUser(admin)
  await ensureWorkspaceMembership(admin, user.id)
  await ensureAdminUsersRow(admin, user.id)
  await cleanupE2eEmployees(admin, user.id)

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: E2E_EMAIL,
  })
  if (linkError) throw new Error(`e2e-auth: generateLink failed — ${linkError.message}`)
  const tokenHash = linkData.properties?.hashed_token
  if (!tokenHash) throw new Error('e2e-auth: generateLink returned no hashed_token')

  const { data: otpData, error: otpError } = await anon.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  })
  if (otpError) throw new Error(`e2e-auth: verifyOtp failed — ${otpError.message}`)
  if (!otpData.session) throw new Error('e2e-auth: verifyOtp returned no session')

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://127.0.0.1:4173'
  mkdirSync(dirname(AUTH_STATE_PATH), { recursive: true })
  writeFileSync(
    AUTH_STATE_PATH,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: String(baseURL).replace(/\/$/, ''),
          localStorage: [
            {
              name: authStorageKey(supabaseUrl),
              value: JSON.stringify(otpData.session),
            },
          ],
        },
      ],
    }),
  )
}

async function ensureAuthUser(
  admin: ReturnType<typeof createClient>,
): Promise<{ id: string; email?: string }> {
  /* auth-js in this lockfile has no getUserByEmail — page listUsers instead. */
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`e2e-auth: listUsers failed — ${error.message}`)
    const found = data.users.find((u) => (u.email ?? '').toLowerCase() === E2E_EMAIL)
    if (found) return found
    if (data.users.length < 200) break
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: E2E_EMAIL,
    email_confirm: true,
    user_metadata: { full_name: 'E2E Playwright' },
  })
  if (createError) {
    /* Race: user created between list and create — re-list once. */
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (!error) {
      const found = data.users.find((u) => (u.email ?? '').toLowerCase() === E2E_EMAIL)
      if (found) return found
    }
    throw new Error(`e2e-auth: createUser failed — ${createError.message}`)
  }
  if (!created.user) throw new Error('e2e-auth: createUser returned no user')
  return created.user
}

async function ensureWorkspaceMembership(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  const { data: existing, error: selectError } = await admin
    .from('admin_beta_access')
    .select('id, status')
    .ilike('user_email', E2E_EMAIL)
    .limit(1)
    .maybeSingle()
  if (selectError) {
    throw new Error(`e2e-auth: admin_beta_access select failed — ${selectError.message}`)
  }

  if (existing) {
    const { error } = await admin
      .from('admin_beta_access')
      .update({ user_id: userId, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error(`e2e-auth: admin_beta_access update failed — ${error.message}`)
    return
  }

  const { error } = await admin.from('admin_beta_access').insert({
    user_id: userId,
    user_email: E2E_EMAIL,
    status: 'active',
    notes: 'Playwright critical-path e2e (auto-seeded)',
  })
  if (error) throw new Error(`e2e-auth: admin_beta_access insert failed — ${error.message}`)
}

async function ensureAdminUsersRow(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  const { data: existing, error: selectError } = await admin
    .from('admin_users')
    .select('id, revoked_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (selectError) throw new Error(`e2e-auth: admin_users select failed — ${selectError.message}`)

  if (existing) {
    if (existing.revoked_at) {
      const { error } = await admin
        .from('admin_users')
        .update({
          revoked_at: null,
          revoked_by: null,
          email: E2E_EMAIL,
          reason: 'Playwright critical-path e2e',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      if (error) throw new Error(`e2e-auth: admin_users un-revoke failed — ${error.message}`)
    }
    return
  }

  const { error } = await admin.from('admin_users').insert({
    user_id: userId,
    email: E2E_EMAIL,
    role: 'admin',
    reason: 'Playwright critical-path e2e',
  })
  if (error) throw new Error(`e2e-auth: admin_users insert failed — ${error.message}`)
}

/** Drop leftover employees on the e2e org so the suite can assert an empty roster. */
async function cleanupE2eEmployees(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  const { data: membership } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (!membership?.organization_id) return

  /* Dedicated e2e org only — wipe roster so "No employees yet" is stable. */
  const { error } = await admin
    .from('employees')
    .delete()
    .eq('organization_id', membership.organization_id)
  if (error) {
    console.warn(`e2e-auth: employee cleanup warning — ${error.message}`)
  }
}
