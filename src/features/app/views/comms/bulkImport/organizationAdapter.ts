import type { BulkImportAdapter, BulkImportField } from '@/features/app/bulkImport/types'
import { bulkImportMessages as B } from '@/i18n/messages/bulkImport'
import type { Bi } from '@/i18n/core'
import type { CommsOrganization } from '../data/types'

export interface OrganizationImportRow {
  name?: string
  type?: string
  jurisdiction?: string
  notes?: string
}

function biFromString(value: string, lang: 'en' | 'fr'): Bi | undefined {
  const text = value.trim()
  if (!text) return undefined
  return lang === 'fr'
    ? { en: `[EN review] ${text}`, fr: text }
    : { en: text, fr: `[FR review] ${text}` }
}

export function createOrganizationBulkImportAdapter(
  lang: 'en' | 'fr',
  addOrganization: (item: Omit<CommsOrganization, 'id'>) => CommsOrganization | null,
): BulkImportAdapter<OrganizationImportRow> {
  const fields: BulkImportField<OrganizationImportRow>[] = [
    {
      key: 'name',
      label: B.bulk_field_organization_name,
      required: true,
      headerHints: ['name', 'organization name', 'company', 'nom', 'organisation'],
    },
    {
      key: 'type',
      label: B.bulk_field_organization_type,
      required: true,
      headerHints: ['type', 'organization type', 'company type', 'type d’organisation'],
    },
    {
      key: 'jurisdiction',
      label: B.bulk_field_organization_jurisdiction,
      headerHints: ['jurisdiction', 'location', 'territory', 'territoire'],
    },
    {
      key: 'notes',
      label: B.bulk_field_organization_notes,
      headerHints: ['notes', 'comments', 'description', 'remarques'],
    },
  ]

  return {
    name: B.bulk_import_organizations,
    fields,
    inferMapping: (headers) => {
      const mapping: Record<string, keyof OrganizationImportRow> = {}
      headers.forEach((h) => {
        const raw = h.trim().toLowerCase()
        if (raw.includes('name') || raw === 'nom' || raw === 'company' || raw === 'organisation') mapping[h] = 'name'
        else if (raw.includes('type')) mapping[h] = 'type'
        else if (raw.includes('jurisdiction') || raw === 'location' || raw === 'territory' || raw === 'territoire') mapping[h] = 'jurisdiction'
        else if (raw.includes('note') || raw === 'comments' || raw === 'description' || raw === 'remarques') mapping[h] = 'notes'
      })
      return mapping
    },
    import: (rows) => {
      let created = 0
      let failed = 0
      const errors: string[] = []
      for (const row of rows) {
        try {
          const name = row.name?.trim() ?? ''
          const type = row.type?.trim() ?? ''
          if (!name || !type) {
            failed++
            errors.push('Missing name or type')
            continue
          }
          addOrganization({
            name,
            type: biFromString(type, lang) ?? { en: type, fr: `[FR review] ${type}` },
            jurisdiction: biFromString(row.jurisdiction ?? '', lang),
            notes: biFromString(row.notes ?? '', lang),
          })
          created++
        } catch (err) {
          failed++
          errors.push(err instanceof Error ? err.message : String(err))
        }
      }
      return Promise.resolve({ created, failed, errors })
    },
    sampleTemplate: ['name', 'type', 'jurisdiction', 'notes'],
  }
}
