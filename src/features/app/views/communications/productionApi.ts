import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

/**
 * Real persistence for the Internal communications log (production mode) —
 * public.hr_communications, org-scoped by RLS (migration 0040). Same boundary
 * contract as the other productionApis: zod-validated rows, throws on
 * failure.
 *
 * **No Advisor review dimensions** — see the migration header. The demo's
 * tone/legal/clarity/policy chips assert a review the product never performs,
 * so they are not stored and not rendered. What is stored is what the
 * employer knows: what was sent, to whom, how, and when.
 *
 * `templateTid` links a logged message to the Ring 3 template it was drafted
 * from (T35–T43). The catalogue lives in the repo, so this is a string rather
 * than a foreign key; the view resolves it against `templateByTid` and simply
 * shows nothing when it does not resolve.
 */

export type ProductionCommunicationStatus = 'draft' | 'scheduled' | 'sent'
export type ProductionCommunicationChannel = 'email' | 'meeting' | 'intranet' | 'letter' | 'other'

export const PRODUCTION_COMMUNICATION_STATUSES: readonly ProductionCommunicationStatus[] = [
  'draft',
  'scheduled',
  'sent',
]

export const PRODUCTION_COMMUNICATION_CHANNELS: readonly ProductionCommunicationChannel[] = [
  'email',
  'meeting',
  'intranet',
  'letter',
  'other',
]

export interface ProductionCommunication {
  id: string
  title: string
  audience: string | null
  channel: ProductionCommunicationChannel
  status: ProductionCommunicationStatus
  scheduledFor: string | null
  sentOn: string | null
  templateTid: string | null
  note: string | null
}

export interface UpdateCommunication {
  title: string
  audience: string
  channel: ProductionCommunicationChannel
  status: ProductionCommunicationStatus
  scheduledFor: string
  templateTid: string
  note: string
}

export interface NewCommunication {
  title: string
  audience: string
  channel: ProductionCommunicationChannel
  status: ProductionCommunicationStatus
  scheduledFor: string
  templateTid: string
  note: string
}

const rowSchema = z.object({
  id: z.string(),
  title: z.string(),
  audience: z.string().nullable(),
  channel: z.enum(['email', 'meeting', 'intranet', 'letter', 'other']),
  status: z.enum(['draft', 'scheduled', 'sent']),
  scheduled_for: z.string().nullable(),
  sent_on: z.string().nullable(),
  template_tid: z.string().nullable(),
  note: z.string().nullable(),
})

const SELECT_COLUMNS =
  'id, title, audience, channel, status, scheduled_for, sent_on, template_tid, note'

function toCommunication(row: z.infer<typeof rowSchema>): ProductionCommunication {
  return {
    id: row.id,
    title: row.title,
    audience: row.audience,
    channel: row.channel,
    status: row.status,
    scheduledFor: row.scheduled_for,
    sentOn: row.sent_on,
    templateTid: row.template_tid,
    note: row.note,
  }
}

export async function listCommunications(
  organizationId: string,
): Promise<ProductionCommunication[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_communications')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return z.array(rowSchema).parse(data).map(toCommunication)
}

export async function addCommunication(
  organizationId: string,
  fields: NewCommunication,
): Promise<ProductionCommunication> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_communications')
    .insert({
      organization_id: organizationId,
      title: fields.title,
      audience: fields.audience.trim() || null,
      channel: fields.channel,
      status: fields.status,
      scheduled_for: fields.scheduledFor || null,
      template_tid: fields.templateTid || null,
      note: fields.note.trim() || null,
    })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toCommunication(rowSchema.parse(data))
}

/**
 * Marks a logged message as sent. **This records that a send happened; it
 * does not perform one** — Dutiva has no send path, and the demo's "Send"
 * button never had one either. The caller passes the date so tests stay
 * deterministic.
 */
export async function markCommunicationSent(id: string, sentOn: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('hr_communications')
    .update({ status: 'sent', sent_on: sentOn, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function updateCommunication(
  id: string,
  fields: UpdateCommunication,
): Promise<ProductionCommunication> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_communications')
    .update({
      title: fields.title,
      audience: fields.audience.trim() || null,
      channel: fields.channel,
      status: fields.status,
      scheduled_for: fields.scheduledFor || null,
      template_tid: fields.templateTid || null,
      note: fields.note.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toCommunication(rowSchema.parse(data))
}

export async function removeCommunication(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('hr_communications').delete().eq('id', id)
  if (error) throw error
}
