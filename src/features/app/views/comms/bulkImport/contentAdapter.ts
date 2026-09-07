import type { BulkImportAdapter, BulkImportField } from '@/features/app/bulkImport/types'
import { bulkImportMessages as B } from '@/i18n/messages/bulkImport'
import { commsMessages as C } from '@/i18n/messages/comms'
import type { Bi } from '@/i18n/core'
import type {
  CommsChannel,
  CommsContentItem,
  CommsContentStatus,
  CommsDeliveryStatus,
  CommsInitiative,
} from '../data/types'

export interface ContentImportRow {
  title?: string
  body?: string
  language?: 'en' | 'fr' | 'bilingual'
  channel?: CommsChannel
  status?: CommsContentStatus
  deliveryStatus?: CommsDeliveryStatus
  dueDate?: string
  scheduledFor?: string
  owner?: string
  initiative?: string
  timeZone?: string
}

const CHANNELS: CommsChannel[] = ['email', 'intranet', 'social_linkedin', 'social_x', 'press_release', 'website', 'newsletter', 'meeting', 'other']
const STATUSES: CommsContentStatus[] = ['draft', 'in_review', 'changes_requested', 'approved', 'superseded', 'withdrawn', 'rejected']
const DELIVERY_STATUSES: CommsDeliveryStatus[] = ['not_queued', 'ready', 'scheduled', 'paused', 'sending', 'confirmed', 'failed', 'unknown', 'cancelled']

function biFromString(value: string, lang: 'en' | 'fr'): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? { en: `[EN review] ${text}`, fr: text }
    : { en: text, fr: `[FR review] ${text}` }
}

function parseDate(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const iso = trimmed.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const slash = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (slash) {
    const [a, b, year] = [Number(slash[1]), Number(slash[2]), slash[3]]
    if (a > 12) return `${year}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`
    return `${year}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`
  }
  return undefined
}

function parseChannel(value: string): CommsChannel | undefined {
  const v = value.trim().toLowerCase()
  if (!v) return undefined
  return (
    CHANNELS.find((c) => c === v) ??
    CHANNELS.find((c) => {
      const label = C[`comms_channel_${c}` as keyof typeof C]
      return typeof label === 'object' && label.en.toLowerCase() === v
    })
  )
}

function parseStatus(value: string): CommsContentStatus | undefined {
  const v = value.trim().toLowerCase().replace(/\s+/g, '_')
  if (!v) return undefined
  return (
    STATUSES.find((s) => s === v) ??
    STATUSES.find((s) => {
      const label = C[`comms_content_status_${s}` as keyof typeof C]
      return typeof label === 'object' && label.en.toLowerCase().replace(/\s+/g, '_') === v
    })
  )
}

function parseLanguage(value: string): ContentImportRow['language'] | undefined {
  const v = value.trim().toLowerCase()
  if (!v) return undefined
  if (['en', 'english', 'anglais'].includes(v)) return 'en'
  if (['fr', 'french', 'français'].includes(v)) return 'fr'
  if (['bilingual', 'bilingue', 'both', 'en/fr', 'fr/en'].includes(v)) return 'bilingual'
  return undefined
}

function parseDeliveryStatus(value: string): CommsDeliveryStatus | undefined {
  const v = value.trim().toLowerCase().replace(/\s+/g, '_')
  if (!v) return undefined
  return (
    DELIVERY_STATUSES.find((s) => s === v) ??
    DELIVERY_STATUSES.find((s) => {
      const label = C[`comms_delivery_status_${s}` as keyof typeof C]
      return typeof label === 'object' && label.en.toLowerCase().replace(/\s+/g, '_') === v
    })
  )
}

export function createContentBulkImportAdapter(
  lang: 'en' | 'fr',
  addContentItem: (item: Omit<CommsContentItem, 'id'>) => CommsContentItem | null,
  initiatives: CommsInitiative[],
): BulkImportAdapter<ContentImportRow> {
  const fields: BulkImportField<ContentImportRow>[] = [
    {
      key: 'initiative',
      label: B.bulk_field_content_initiative,
      required: true,
      headerHints: ['initiative', 'initiative name', 'campaign', 'programme', 'initiative title'],
    },
    {
      key: 'title',
      label: B.bulk_field_content_title,
      required: true,
      headerHints: ['title', 'content title', 'headline', 'titre'],
    },
    {
      key: 'body',
      label: B.bulk_field_content_body,
      headerHints: ['body', 'content', 'text', 'message', 'corps'],
    },
    {
      key: 'language',
      label: B.bulk_field_content_language,
      required: true,
      parse: parseLanguage,
      validate: (v) => (v === 'en' || v === 'fr' || v === 'bilingual' ? undefined : 'invalid language'),
      headerHints: ['language', 'lang', 'langue'],
    },
    {
      key: 'channel',
      label: B.bulk_field_content_channel,
      required: true,
      parse: parseChannel,
      validate: (v) => (CHANNELS.includes(v as CommsChannel) ? undefined : 'invalid channel'),
      headerHints: ['channel', 'medium', 'canal', 'channel name'],
    },
    {
      key: 'status',
      label: B.bulk_field_content_status,
      required: true,
      parse: parseStatus,
      validate: (v) => (STATUSES.includes(v as CommsContentStatus) ? undefined : 'invalid status'),
      headerHints: ['status', 'content status', 'approval status', 'statut'],
    },
    {
      key: 'deliveryStatus',
      label: B.bulk_field_content_delivery_status,
      parse: parseDeliveryStatus,
      validate: (v) => (v === undefined || DELIVERY_STATUSES.includes(v as CommsDeliveryStatus) ? undefined : 'invalid delivery status'),
      headerHints: ['delivery status', 'delivery', 'publish status', 'statut de diffusion'],
    },
    {
      key: 'dueDate',
      label: B.bulk_field_content_due_date,
      parse: parseDate,
      validate: (v) => (v === undefined || v ? undefined : 'invalid due date'),
      headerHints: ['due date', 'due', 'deadline', 'échéance'],
    },
    {
      key: 'scheduledFor',
      label: B.bulk_field_content_scheduled_for,
      parse: parseDate,
      validate: (v) => (v === undefined || v ? undefined : 'invalid scheduled date'),
      headerHints: ['scheduled for', 'schedule date', 'publish date', 'planifié pour'],
    },
    {
      key: 'owner',
      label: B.bulk_field_content_owner,
      required: true,
      headerHints: ['owner', 'author', 'responsible', 'responsable'],
    },
    {
      key: 'timeZone',
      label: B.bulk_field_content_time_zone,
      headerHints: ['time zone', 'timezone', 'tz', 'fuseau horaire'],
    },
  ]

  return {
    name: B.bulk_import_content,
    fields,
    inferMapping: (headers) => {
      const mapping: Record<string, keyof ContentImportRow> = {}
      headers.forEach((h) => {
        const raw = h.trim().toLowerCase()
        if (raw.includes('initiative') || raw === 'campaign' || raw === 'programme' || raw === 'program') mapping[h] = 'initiative'
        else if (raw.includes('title') || raw === 'headline' || raw === 'titre') mapping[h] = 'title'
        else if (raw === 'body' || raw === 'content' || raw === 'text' || raw === 'message' || raw === 'corps') mapping[h] = 'body'
        else if (raw === 'language' || raw === 'lang' || raw === 'langue') mapping[h] = 'language'
        else if (raw.includes('channel') || raw === 'canal' || raw === 'medium') mapping[h] = 'channel'
        else if (raw === 'status' || raw === 'statut') mapping[h] = 'status'
        else if (raw.includes('delivery') || raw === 'publish status') mapping[h] = 'deliveryStatus'
        else if (raw.includes('due') || raw === 'deadline' || raw === 'échéance') mapping[h] = 'dueDate'
        else if (raw.includes('schedule') || raw.includes('scheduled') || raw === 'planifié') mapping[h] = 'scheduledFor'
        else if (raw === 'owner' || raw === 'author' || raw === 'responsable' || raw === 'responsible') mapping[h] = 'owner'
        else if (raw.includes('time zone') || raw === 'timezone' || raw === 'tz' || raw === 'fuseau') mapping[h] = 'timeZone'
      })
      return mapping
    },
    import: (rows) => {
      let created = 0
      let failed = 0
      const errors: string[] = []
      for (const row of rows) {
        try {
          const title = row.title?.trim() ?? ''
          const initiativeName = row.initiative?.trim() ?? ''
          const language = row.language
          const channel = row.channel
          const status = row.status
          const owner = row.owner?.trim() ?? ''
          if (!title || !initiativeName || !language || !channel || !status || !owner) {
            failed++
            errors.push('Missing required content field')
            continue
          }
          const initiative = initiatives.find(
            (i) => i.title.en.toLowerCase() === initiativeName.toLowerCase() || i.title.fr.toLowerCase() === initiativeName.toLowerCase(),
          )
          if (!initiative) {
            failed++
            errors.push(`Initiative not found: ${initiativeName}`)
            continue
          }
          addContentItem({
            initiativeId: initiative.id,
            title: biFromString(title, lang) ?? { en: title, fr: `[FR review] ${title}` },
            body: biFromString(row.body ?? '', lang),
            language,
            channel,
            status,
            deliveryStatus: row.deliveryStatus ?? 'not_queued',
            dueDate: row.dueDate,
            scheduledFor: row.scheduledFor,
            owner,
            timeZone: row.timeZone?.trim() || 'America/Toronto',
          })
          created++
        } catch (err) {
          failed++
          errors.push(err instanceof Error ? err.message : String(err))
        }
      }
      return Promise.resolve({ created, failed, errors })
    },
    sampleTemplate: ['initiative', 'title', 'body', 'language', 'channel', 'status', 'deliveryStatus', 'dueDate', 'scheduledFor', 'owner', 'timeZone'],
  }
}
