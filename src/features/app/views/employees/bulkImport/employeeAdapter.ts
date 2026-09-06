import type { NewEmployee, ProductionEmployee } from '../productionApi'
import type { BulkImportAdapter, BulkImportField } from '@/features/app/bulkImport/types'
import { bulkImportMessages as B } from '@/i18n/messages/bulkImport'

const JURISDICTION_ENS = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
]

function parseJurisdiction(value: string): string | undefined {
  const trimmed = value.trim()
  const found = JURISDICTION_ENS.find((j) => j.toLowerCase() === trimmed.toLowerCase())
  return found
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

export const employeeBulkImportFields: BulkImportField<NewEmployee>[] = [
  {
    key: 'name',
    label: B.bulk_field_employee_name,
    required: true,
    headerHints: ['name', 'full name', 'employee name'],
  },
  {
    key: 'title',
    label: B.bulk_field_employee_role,
    headerHints: ['title', 'role', 'job title', 'position'],
  },
  {
    key: 'email',
    label: B.bulk_field_employee_email,
    validate: (v) => {
      if (typeof v !== 'string' || v === '') return undefined
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : 'invalid email'
    },
    headerHints: ['email', 'email address', 'work email'],
  },
  {
    key: 'jurisdiction',
    label: B.bulk_field_employee_jurisdiction,
    required: true,
    parse: parseJurisdiction,
    validate: (v) => (v ? undefined : 'invalid jurisdiction'),
    headerHints: ['jurisdiction', 'province', 'territory', 'location'],
  },
  {
    key: 'startDate',
    label: B.bulk_field_employee_start_date,
    parse: parseDate,
    validate: (v) => (v === undefined || v ? undefined : 'invalid date'),
    headerHints: ['start date', 'start', 'hire date', 'date of hire'],
  },
  {
    key: 'managerId',
    label: B.bulk_field_employee_manager_id,
    headerHints: ['manager id', 'manager', 'reports to'],
  },
]

export function createEmployeeBulkImportAdapter(
  addEmployee: (fields: NewEmployee) => Promise<ProductionEmployee>,
): BulkImportAdapter<NewEmployee> {
  return {
    name: B.bulk_import_employees,
    fields: employeeBulkImportFields,
    import: async (rows) => {
      let created = 0
      const errors: string[] = []
      for (const [index, row] of rows.entries()) {
        try {
          const fields = row as NewEmployee
          if (!fields.name?.trim()) {
            errors.push(`Row ${index + 1}: name is required`)
            continue
          }
          await addEmployee(fields)
          created++
        } catch (err) {
          errors.push(`Row ${index + 1}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      return { created, failed: rows.length - created, errors }
    },
    sampleTemplate: employeeBulkImportFields.map((f) => String(f.key)),
  }
}
