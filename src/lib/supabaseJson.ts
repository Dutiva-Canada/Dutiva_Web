/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import type { Json } from '@/lib/supabase/types'

/**
 * Assert a value is JSON-serializable for a jsonb column.
 *
 * The generated row types use `Json` — a recursive union with an index
 * signature — and declared interfaces like `Bi` ({ en, fr }) don't carry an
 * index signature, so a direct `as Json` on them fails TS2352. This helper
 * is the one place that boundary is crossed; the value is inserted verbatim.
 */
export function toJson(value: unknown): Json {
  return value as Json
}
