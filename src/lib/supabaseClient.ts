import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './supabase/types'

/**
 * Browser Supabase client for the real backend (auth + guidance/law tables).
 * Same optional-env pattern as the doclib read layer
 * (`src/features/app/documents/api.ts`): without VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY set, `supabase` is null and auth-gated features
 * degrade to their signed-out state instead of throwing.
 *
 * Schema types: `npm run db:types` regenerates src/lib/supabase/database.types.ts
 * and the edge-function copy under supabase/functions/_shared/.
 */

const SUPA_URL: string | undefined = import.meta.env.VITE_SUPABASE_URL
const SUPA_KEY: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase: SupabaseClient<Database> | null =
  SUPA_URL && SUPA_KEY ? createClient<Database>(SUPA_URL, SUPA_KEY) : null
