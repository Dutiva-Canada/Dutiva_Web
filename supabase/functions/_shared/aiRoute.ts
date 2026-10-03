import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import {
  resolveApiKey,
  type ApiKeyResult,
  type UpstreamProvider,
} from './modelUpstream.ts'

/**
 * Shared model-route lookup for portal AI calls (pr-geo-check, pr-ai,
 * health-ai, pr-mentions-feed tone tagging). Tries each route_key in order —
 * a dedicated key first, `advisor_chat` as the shared fallback — and returns
 * the first active route whose provider is also active.
 *
 * Same contract invest-ai established: routes live in ai_model_routes and
 * point at ai_model_providers; a missing dedicated key quietly falls back
 * rather than failing.
 */
export interface ResolvedRoute {
  routeKey: string
  modelName: string
  provider: UpstreamProvider
  secretRef: string | null
}

interface ProviderRow {
  base_url: string | null
  secret_ref: string | null
  status: string
}

interface RouteRow {
  model_name: string
  provider: ProviderRow | ProviderRow[] | null
}

export async function activeModelRoute(
  admin: SupabaseClient,
  routeKeys: string[],
): Promise<ResolvedRoute | { error: string }> {
  for (const routeKey of routeKeys) {
    const { data: route, error } = await admin
      .from('ai_model_routes')
      .select(
        'id, model_name, config, provider:ai_model_providers(id, provider_key, base_url, secret_ref, status)',
      )
      .eq('route_key', routeKey)
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error) return { error: error.message }
    const row = route as RouteRow | null
    const provider = Array.isArray(row?.provider) ? row.provider[0] : row?.provider
    if (row && provider && provider.status === 'active') {
      return {
        routeKey,
        modelName: row.model_name,
        provider: { base_url: provider.base_url, secret_ref: provider.secret_ref },
        secretRef: provider.secret_ref,
      }
    }
  }
  return { error: 'no_route' }
}

/** Resolve the provider's API key from its secret_ref. Passes the
    three-state result through — `apiKey: null` is a legitimate keyless
    endpoint, `missingSecret` is a broken config — so each caller decides:
    a feature that no-ops without AI (feed tone tagging) skips quietly,
    one whose whole job is AI answers with 503. */
export function routeApiKey(route: ResolvedRoute): ApiKeyResult {
  return resolveApiKey(route.secretRef, (n) => Deno.env.get(n))
}
