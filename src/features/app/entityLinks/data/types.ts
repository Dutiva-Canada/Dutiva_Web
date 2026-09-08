import type { Bi } from '@/i18n/core'
import type { Tables, TablesInsert } from '@/lib/supabase/types'

/**
 * Generic cross-module entity links (`public.entity_links`).
 *
 * A link is a directed pair — `from_table`/`from_id` → `to_table`/`to_id` —
 * scoped to an organization, with `relationship` left open for future kinds
 * beyond the default 'relates_to'.
 */
export type EntityLink = Tables<'entity_links'>
export type EntityLinkInsert = TablesInsert<'entity_links'>

/** Tables the linking UI knows how to offer as targets. */
export type EntityTable =
  | 'revenue_streams'
  | 'revenue_invoices'
  | 'crm_deals'
  | 'comms_initiatives'
  | 'specialists'
  | 'cases'

/**
 * One selectable target module for the add-link form: a bilingual module
 * label, the records that can be linked to, and the workspace-relative route
 * suffix (e.g. 'crm', 'comms/initiatives') used for chip navigation.
 */
export interface LinkCandidate {
  table: EntityTable
  label: Bi
  records: { id: string; title: string }[]
  view: string
}
