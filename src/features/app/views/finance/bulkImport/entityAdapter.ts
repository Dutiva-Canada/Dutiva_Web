import type { FinanceLegalEntity } from '../data/types'
import type { BulkImportAdapter, BulkImportField } from '@/features/app/bulkImport/types'
import { financeMessages as M } from '@/i18n/messages/finance'
import { bulkImportMessages as B } from '@/i18n/messages/bulkImport'

const LEGAL_FORMS = ['corporation', 'partnership', 'sole_proprietor', 'nonprofit'] as const
const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP'] as const
const JURISDICTIONS = ['CA-AB', 'CA-BC', 'CA-MB', 'CA-NB', 'CA-NL', 'CA-NS', 'CA-NT', 'CA-NU', 'CA-ON', 'CA-PE', 'CA-QC', 'CA-SK', 'CA-YT']

function parseJurisdictions(value: string): string[] {
  if (!value) return []
  return value
    .split(/[,;]/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => JURISDICTIONS.includes(s))
}

function parseDate(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return trimmed
  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slash) {
    const [a, b, year] = [Number(slash[1]), Number(slash[2]), slash[3]]
    if (a > 12) return `${year}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`
    return `${year}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`
  }
  return undefined
}

function validateLegalForm(value: unknown): string | undefined {
  if (typeof value !== 'string' || !LEGAL_FORMS.includes(value as typeof LEGAL_FORMS[number])) {
    return 'must be corporation, partnership, sole_proprietor, or nonprofit'
  }
  return undefined
}

function validateCurrency(value: unknown): string | undefined {
  if (typeof value !== 'string' || !CURRENCIES.includes(value as typeof CURRENCIES[number])) {
    return 'must be CAD, USD, EUR, or GBP'
  }
  return undefined
}

export const entityBulkImportFields: BulkImportField<FinanceLegalEntity>[] = [
  {
    key: 'legalName',
    label: M.finance_entity_legal_name,
    required: true,
    headerHints: ['legal name', 'company name', 'name', 'entity name'],
  },
  {
    key: 'legalForm',
    label: M.finance_entity_legal_form,
    required: true,
    parse: (v) => v.trim().toLowerCase().replace(/ /g, '_'),
    validate: validateLegalForm,
    headerHints: ['legal form', 'form', 'entity type', 'type'],
  },
  {
    key: 'fiscalYearStart',
    label: M.finance_entity_fiscal_year_start,
    required: true,
    parse: parseDate,
    validate: (v) => (v ? undefined : 'invalid date'),
    headerHints: ['fiscal year start', 'fiscal start', 'year start', 'start date'],
  },
  {
    key: 'functionalCurrency',
    label: M.finance_entity_functional_currency,
    required: true,
    parse: (v) => v.trim().toUpperCase(),
    validate: validateCurrency,
    headerHints: ['currency', 'functional currency', 'reporting currency'],
  },
  {
    key: 'jurisdictions',
    label: M.finance_entity_jurisdictions,
    parse: parseJurisdictions,
    validate: (v) => (Array.isArray(v) && v.length > 0 ? undefined : 'at least one jurisdiction required'),
    headerHints: ['jurisdictions', 'provinces', 'territories', 'locations'],
  },
  {
    key: 'accountingSourceId',
    label: M.finance_entity_accounting_source_id,
    headerHints: ['accounting source', 'accounting id', 'quickbooks id'],
  },
  {
    key: 'payrollSourceId',
    label: M.finance_entity_payroll_source_id,
    headerHints: ['payroll source', 'payroll id', 'payroll provider'],
  },
  {
    key: 'active',
    label: M.finance_entity_active,
    parse: (v) => {
      const s = v.trim().toLowerCase()
      return s === '' ? true : ['1', 'true', 'yes', 'y', 'active'].includes(s)
    },
    headerHints: ['active', 'status'],
  },
]

export function createEntityBulkImportAdapter(
  addEntity: (item: Omit<FinanceLegalEntity, 'id'>) => Promise<FinanceLegalEntity | null>,
): BulkImportAdapter<FinanceLegalEntity> {
  return {
    name: B.bulk_import_legal_entities,
    fields: entityBulkImportFields,
    import: async (rows) => {
      let created = 0
      const errors: string[] = []
      for (const [index, row] of rows.entries()) {
        try {
          const entity = row as Omit<FinanceLegalEntity, 'id'>
          const result = await addEntity(entity)
          if (result) created++
          else errors.push(`Row ${index + 1}: addEntity returned null`)
        } catch (err) {
          errors.push(`Row ${index + 1}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      return { created, failed: rows.length - created, errors }
    },
    sampleTemplate: entityBulkImportFields.map((f) => String(f.key)),
  }
}
