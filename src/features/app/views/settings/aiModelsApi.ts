import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { Json } from '@/lib/supabase/types'

/**
 * Admin surface for the model route table — the same `ai_model_providers` /
 * `ai_model_routes` rows every dutiva-* edge function resolves at request
 * time. Registering a provider + repointing a route IS installing a model:
 * no deploy, no migration — the next turn reads it (docs/LOCAL_INFERENCE.md,
 * "the route table is the extension point").
 *
 * Schema shape that decides this API: `route_key` is UNIQUE — there is one
 * `advisor_chat` route, one `candidate_ai`, etc. A provider can host many
 * models; a route points at one of them. So the flow is: register the
 * provider once, then point a route at provider+model (and back, to roll
 * off it).
 *
 * RLS does the real gating (`is_admin` on writes; non-admin reads limited to
 * active/fallback routes). Functions throw on failure — silent no-ops are
 * how a misconfigured provider looks "installed" while nothing reaches it.
 */

const providerRowSchema = z.object({
  id: z.string(),
  provider_key: z.string(),
  display_name: z.string(),
  provider_type: z.string(),
  base_url: z.string().nullable(),
  secret_ref: z.string().nullable(),
  status: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
})

const routeRowSchema = z.object({
  id: z.string(),
  route_key: z.string(),
  operation: z.string(),
  model_name: z.string(),
  priority: z.number(),
  status: z.string(),
  provider_id: z.string().nullable(),
  config: z.record(z.string(), z.unknown()).nullable(),
})

export type ModelProviderRow = z.infer<typeof providerRowSchema>
export type ModelRouteRow = z.infer<typeof routeRowSchema>

function notConfigured(): never {
  throw new Error('Supabase is not configured in this environment.')
}

export async function listProviders(): Promise<ModelProviderRow[]> {
  if (!supabase) notConfigured()
  const { data, error } = await supabase
    .from('ai_model_providers')
    .select('id, provider_key, display_name, provider_type, base_url, secret_ref, status, metadata')
    .order('display_name')
  if (error) throw new Error(error.message)
  return z.array(providerRowSchema).parse(data ?? [])
}

export async function listRoutes(): Promise<ModelRouteRow[]> {
  if (!supabase) notConfigured()
  const { data, error } = await supabase
    .from('ai_model_routes')
    .select('id, route_key, operation, model_name, priority, status, provider_id, config')
    .order('route_key')
  if (error) throw new Error(error.message)
  return z.array(routeRowSchema).parse(data ?? [])
}

export interface RegisterProviderInput {
  displayName: string
  baseUrl: string
  /** Env var NAME holding the API key on the edge runtime — blank for
   *  keyless local servers (Ollama / LM Studio / llama.cpp). */
  secretRef: string
  modalities: string[]
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'provider'
  )
}

/** Insert a provider row (typically `provider_type` 'local' — a LAN or
 *  self-hosted OpenAI-compatible endpoint). Returns the new row. */
export async function registerProvider(input: RegisterProviderInput): Promise<ModelProviderRow> {
  if (!supabase) notConfigured()
  const providerKey = `${slugify(input.displayName)}-${Date.now().toString(36)}`
  const { data, error } = await supabase
    .from('ai_model_providers')
    .insert({
      provider_key: providerKey,
      display_name: input.displayName,
      provider_type: 'local',
      status: 'active',
      base_url: input.baseUrl.replace(/\/+$/, ''),
      secret_ref: input.secretRef.trim() || null,
      metadata: { modalities: input.modalities },
    })
    .select('id, provider_key, display_name, provider_type, base_url, secret_ref, status, metadata')
    .single()
  if (error) throw new Error(error.message)
  return providerRowSchema.parse(data)
}

/** Point a route at provider+model and declare what it accepts. This is the
 *  "switch to local" / "roll back to cloud" action — the next turn uses it. */
export async function assignRoute(options: {
  routeId: string
  providerId: string
  modelName: string
  modalities: string[]
  status?: 'active' | 'inactive'
  timeoutMs?: number
}): Promise<void> {
  if (!supabase) notConfigured()
  const config: { [key: string]: Json | undefined } = { modalities: options.modalities }
  if (typeof options.timeoutMs === 'number') config.timeout_ms = options.timeoutMs
  const { error } = await supabase
    .from('ai_model_routes')
    .update({
      provider_id: options.providerId,
      model_name: options.modelName,
      status: options.status ?? 'active',
      config,
    })
    .eq('id', options.routeId)
  if (error) throw new Error(error.message)
}

export async function setProviderStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
  if (!supabase) notConfigured()
  const { error } = await supabase.from('ai_model_providers').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

/** Read-back probe an admin can run against a provider row: `GET {base}/models`
 *  (the OpenAI-compatible list endpoint every local server ships). Runs from
 *  the browser, so CORS can block a server the edge function could still
 *  reach — the caller frames the result accordingly. */
export async function probeProvider(baseUrl: string): Promise<{ ok: boolean; models: string[] }> {
  const url = `${baseUrl.replace(/\/+$/, '')}/models`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return { ok: false, models: [] }
  const body = (await res.json().catch(() => null)) as { data?: { id?: string }[] } | null
  const models = (body?.data ?? [])
    .map((m) => m?.id)
    .filter((id): id is string => typeof id === 'string')
  return { ok: true, models }
}
