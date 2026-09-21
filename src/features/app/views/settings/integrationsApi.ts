import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { Json } from '@/lib/supabase/types'

/**
 * Client for `workspace_integrations` (migration 0161; in generated
 * `database.types.ts`). Rows are still zod-parsed at the boundary — the
 * generated types describe columns, not the contract this module exposes.
 *
 * Credentials never pass through this file: the only call that carries a
 * secret is `runIntegrationAction('connect', …, secret)` → the
 * `workspace-integration` edge function → Vault. Everything here reads or
 * writes metadata only (`secret_ref` is a Vault *name*, not a value).
 */

const rowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  provider: z.enum([
    'github',
    'gitlab',
    'gmail',
    'outlook',
    'smtp_email',
    'inbound_webhook',
    'inbound_email',
  ]),
  display_name: z.string(),
  status: z.enum(['pending', 'connected', 'error', 'disconnected']),
  config: z.record(z.string(), z.unknown()).nullable(),
  secret_ref: z.string().nullable(),
  last_checked_at: z.string().nullable(),
  created_at: z.string(),
})

export type WorkspaceIntegrationRow = z.infer<typeof rowSchema>

function notConfigured(): never {
  throw new Error('Supabase is not configured in this environment.')
}

export async function listIntegrations(orgId: string): Promise<WorkspaceIntegrationRow[]> {
  if (!supabase) notConfigured()
  const { data, error } = await supabase
    .from('workspace_integrations')
    .select(
      'id, organization_id, provider, display_name, status, config, secret_ref, last_checked_at, created_at',
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return z.array(rowSchema).parse(data ?? [])
}

export async function createIntegration(input: {
  organizationId: string
  provider: string
  displayName: string
  config?: Record<string, unknown>
}): Promise<WorkspaceIntegrationRow> {
  if (!supabase) notConfigured()
  const { data, error } = await supabase
    .from('workspace_integrations')
    .insert({
      organization_id: input.organizationId,
      provider: input.provider,
      display_name: input.displayName,
      config: (input.config ?? {}) as Json,
      status: 'pending',
    })
    .select(
      'id, organization_id, provider, display_name, status, config, secret_ref, last_checked_at, created_at',
    )
    .single()
  if (error) throw new Error(error.message)
  return rowSchema.parse(data)
}

export async function deleteIntegration(id: string): Promise<void> {
  if (!supabase) notConfigured()
  const { error } = await supabase.from('workspace_integrations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

const eventRowSchema = z.object({
  id: z.string(),
  event_type: z.string().nullable(),
  payload: z.unknown(),
  received_at: z.string(),
  processed_at: z.string().nullable(),
})

export type IntegrationEventRow = z.infer<typeof eventRowSchema>

/**
 * Recent deliveries for one integration — org members can already read
 * integration_events (0162 RLS), this is the same read the "recent
 * events" block on the webhook card makes.
 */
export async function listIntegrationEvents(
  integrationId: string,
  limit = 10,
): Promise<IntegrationEventRow[]> {
  if (!supabase) notConfigured()
  const { data, error } = await supabase
    .from('integration_events')
    .select('id, event_type, payload, received_at, processed_at')
    .eq('integration_id', integrationId)
    .order('received_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return z.array(eventRowSchema).parse(data ?? [])
}

const mailRowSchema = z.object({
  id: z.string(),
  from_address: z.string(),
  subject: z.string().nullable(),
  attachments: z.unknown(),
  received_at: z.string(),
  processed_at: z.string().nullable(),
})

export type InboundEmailRow = z.infer<typeof mailRowSchema>

/** Recent deliveries for one inbound_email integration — same RLS read. */
export async function listInboundEmails(
  integrationId: string,
  limit = 10,
): Promise<InboundEmailRow[]> {
  if (!supabase) notConfigured()
  const { data, error } = await supabase
    .from('inbound_emails')
    .select('id, from_address, subject, attachments, received_at, processed_at')
    .eq('integration_id', integrationId)
    .order('received_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return z.array(mailRowSchema).parse(data ?? [])
}

export type IntegrationAction = 'connect' | 'test' | 'disconnect'

export interface IntegrationActionResult {
  status: string
  account?: string
  providerStatus?: number
  stored?: boolean
  /** inbound_webhook connect only — minted endpoint + secret, shown once. */
  webhookUrl?: string
  signingSecret?: string
  /** inbound_email connect only — the minted workspace address. */
  inboundAddress?: string
  error?: string
}

/**
 * The only path that touches a credential: the edge function probes the
 * provider (github/gitlab), stores the secret in Vault, and updates status —
 * 'connected' is never written client-side.
 */
export async function runIntegrationAction(
  action: IntegrationAction,
  integrationId: string,
  secret?: string,
): Promise<IntegrationActionResult> {
  if (!supabase) notConfigured()
  const { data, error } = await supabase!.functions.invoke('workspace-integration', {
    body: { action, integrationId, ...(secret ? { secret } : {}) },
  })
  if (error) {
    // FunctionsHttpError carries the function's own JSON body when it
    // answered non-2xx — surface its status fields rather than the generic
    // invoke error so 'error'/'pending' states still land correctly.
    const body = (error as { context?: { json?: () => Promise<unknown> } }).context
    const parsed = body?.json ? await body.json().catch(() => null) : null
    if (parsed && typeof parsed === 'object') return parsed as IntegrationActionResult
    throw new Error(error.message)
  }
  return (data ?? {}) as IntegrationActionResult
}
