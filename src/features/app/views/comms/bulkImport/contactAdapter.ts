import type { BulkImportAdapter, BulkImportField } from '@/features/app/bulkImport/types'
import { bulkImportMessages as B } from '@/i18n/messages/bulkImport'
import { commsMessages as C } from '@/i18n/messages/comms'
import type { Bi } from '@/i18n/core'
import type { CommsContact, CommsContactType, CommsOrganization } from '../data/types'

const CONTACT_TYPES: CommsContactType[] = ['media', 'institutional', 'partner', 'creator', 'audience']

export interface ContactImportRow {
  name?: string
  type?: CommsContactType
  organizationName?: string
  role?: string
  purpose?: string
  preferredChannel?: string
  source?: string
  active?: boolean
}

function parseType(value: string): CommsContactType | undefined {
  const v = value.trim().toLowerCase()
  if (!v) return undefined
  return CONTACT_TYPES.find((t) => t === v || C[`comms_contact_type_${t}` as keyof typeof C].en.toLowerCase() === v)
}

function parseActive(value: string): boolean | undefined {
  const v = value.trim().toLowerCase()
  if (!v) return undefined
  if (['yes', 'y', 'true', '1', 'active'].includes(v)) return true
  if (['no', 'n', 'false', '0', 'inactive'].includes(v)) return false
  return undefined
}

function biFromString(value: string, lang: 'en' | 'fr'): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? { en: `[EN review] ${text}`, fr: text }
    : { en: text, fr: `[FR review] ${text}` }
}

export function createContactBulkImportAdapter(
  addContact: (item: Omit<CommsContact, 'id'>) => Promise<CommsContact | null>,
  organizations: CommsOrganization[],
  lang: 'en' | 'fr',
): BulkImportAdapter<ContactImportRow> {
  const fields: BulkImportField<ContactImportRow>[] = [
    {
      key: 'name',
      label: B.bulk_field_contact_name,
      required: true,
      headerHints: ['name', 'contact name', 'full name', 'nom'],
    },
    {
      key: 'type',
      label: B.bulk_field_contact_type,
      required: true,
      parse: parseType,
      validate: (v) => (v && CONTACT_TYPES.includes(v as CommsContactType) ? undefined : 'invalid type'),
      headerHints: ['type', 'contact type', 'role type', 'type de contact'],
    },
    {
      key: 'organizationName',
      label: B.bulk_field_contact_organization,
      headerHints: ['organization', 'org', 'company', 'organization name', 'organisation'],
    },
    {
      key: 'role',
      label: B.bulk_field_contact_role,
      headerHints: ['role', 'job title', 'title', 'rôle'],
    },
    {
      key: 'purpose',
      label: B.bulk_field_contact_purpose,
      headerHints: ['purpose', 'notes', 'remarques'],
    },
    {
      key: 'preferredChannel',
      label: B.bulk_field_contact_preferred_channel,
      headerHints: ['preferred channel', 'channel', 'canal préféré'],
    },
    {
      key: 'source',
      label: B.bulk_field_contact_source,
      headerHints: ['source', 'origin', 'provenance'],
    },
    {
      key: 'active',
      label: B.bulk_field_contact_active,
      parse: parseActive,
      validate: (v) => (v === undefined && typeof v !== 'boolean' ? 'invalid active value' : undefined),
      headerHints: ['active', 'status', 'actif'],
    },
  ]

  return {
    name: B.bulk_import_contacts,
    fields,
    inferMapping: (headers) => {
      const mapping: Record<string, keyof ContactImportRow> = {}
      headers.forEach((h) => {
        const raw = h.trim().toLowerCase()
        if (raw.includes('name') || raw === 'nom' || raw === 'contact') mapping[h] = 'name'
        else if (raw.includes('type')) mapping[h] = 'type'
        else if (raw.includes('org') || raw === 'company' || raw === 'organisation' || raw === 'organization') mapping[h] = 'organizationName'
        else if (raw.includes('role') || raw === 'title' || raw === 'rôle' || raw === 'job title') mapping[h] = 'role'
        else if (raw.includes('purpose') || raw === 'notes' || raw === 'remarques') mapping[h] = 'purpose'
        else if (raw.includes('channel') || raw === 'canal') mapping[h] = 'preferredChannel'
        else if (raw.includes('source') || raw === 'origin' || raw === 'provenance') mapping[h] = 'source'
        else if (raw === 'active' || raw === 'status' || raw === 'actif') mapping[h] = 'active'
      })
      return mapping
    },
    import: async (rows) => {
      let created = 0
      let failed = 0
      const errors: string[] = []
      for (const row of rows) {
        try {
          const org = organizations.find((o) => o.name.toLowerCase() === (row.organizationName ?? '').trim().toLowerCase())
          const name = row.name?.trim() ?? ''
          if (!name || !row.type) {
            failed++
            errors.push(`Missing name or type`)
            continue
          }
          const active = row.active ?? true
          const ok = await addContact({
            name,
            type: row.type,
            organizationId: org?.id,
            role: biFromString(row.role ?? '', lang),
            purpose: biFromString(row.purpose ?? '', lang),
            channelPreference: biFromString(row.preferredChannel ?? '', lang),
            source: biFromString(row.source ?? '', lang),
            active,
          })
          if (ok) created++
          else failed++
        } catch (err) {
          failed++
          errors.push(err instanceof Error ? err.message : String(err))
        }
      }
      return { created, failed, errors }
    },
    sampleTemplate: ['name', 'type', 'organizationName', 'role', 'purpose', 'preferredChannel', 'source', 'active'],
  }
}
