import { createClient } from 'npm:@supabase/supabase-js@2'
import type { AdvisorAttachment } from '../_shared/modelUpstream.ts'

/**
 * Shared types for the advisor-chat handler and its extracted modules —
 * request/response shapes, the model route tables' row shapes, and the
 * conversation/completion records the turn pipeline passes between stages.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type SupabaseClient = ReturnType<typeof createClient>

export interface ServerConfig {
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
}

export interface AuthenticatedRequest {
  adminClient: SupabaseClient
  user: { id: string; email?: string }
}

export interface ChatRequest {
  message: string
  conversationId: string | null
  organizationId: string | null
  timezone: string | null
  attachments: AdvisorAttachment[]
}

export interface ModelProvider {
  id: string
  provider_key: string
  base_url: string
  secret_ref: string | null
  status: string
}

export interface ModelRoute {
  model_name: string
  config: {
    max_tokens?: number
    temperature?: number
    /** Modalities the routed model accepts (e.g. ["text","image"]). Absent →
     *  text-only; attachments needing more get refused before metering. */
    modalities?: unknown
    /** Per-route override for the upstream fetch timeout (local models are
     *  slow to warm). */
    timeout_ms?: number
  } | null
}

export interface ActiveModelRoute {
  route: ModelRoute
  provider: ModelProvider
}

export interface Conversation {
  id: string
  messages: ChatMessage[]
}

export interface Completion {
  choices?: { message?: { content?: string } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

export interface GuidanceChunk {
  title: string
  content: string
  source_url: string
  source_name: string
  jurisdiction: string
  effective_note: string | null
  topic?: string
  review_status?: string
  /** Set when the law monitor saw the chunk's jurisdiction change (0071). */
  source_changed_at?: string | null
}

export interface RetrievalResult {
  chunks: GuidanceChunk[]
  /** True when the RPC errored — distinct from a genuine zero-hit, so the
   *  payload and telemetry can say "retrieval was unavailable" instead of
   *  "nothing matched" (the 0058 tsquery bug hid behind exactly this
   *  conflation for ten days). */
  failed: boolean
}
