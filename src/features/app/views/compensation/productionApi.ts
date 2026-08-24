import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

/**
 * Real persistence for the Compensation module (production mode) —
 * public.hr_compensation_records, org-scoped by RLS (migration 0039). Same
 * boundary contract as the other productionApis: zod-validated rows, throws
 * on failure.
 *
 * **There is no market rate here, deliberately** — see the migration header.
 * The comparison is against `bandMidpoint`, a number the employer enters for
 * their own band. `deltaFromMidpoint` returns null when they have not, and
 * the view renders nothing rather than a misleading 0%.
 *
 * Money is stored as numeric and arrives from PostgREST as a string; parsing
 * it here rather than in the view keeps the string off the rest of the app.
 */

export interface ProductionCompensationRecord {
  id: string
  employeeId: string
  employeeName: string
  baseSalary: number
  band: string | null
  bandMidpoint: number | null
  effectiveDate: string | null
  note: string | null
}

export interface UpdateCompensationRecord {
  baseSalary: number
  band: string
  /** Empty string when the employer has no band midpoint to compare against. */
  bandMidpoint: string
  effectiveDate: string
  note: string
}

export interface NewCompensationRecord {
  employeeId: string
  baseSalary: number
  band: string
  /** Empty string when the employer has no band midpoint to compare against. */
  bandMidpoint: string
  effectiveDate: string
  note: string
}

/** numeric(12,2) arrives as a string over PostgREST; null stays null. */
const numeric = z.union([z.string(), z.number()]).transform((v) => Number(v))

const rowSchema = z.object({
  id: z.string(),
  employee_id: z.string(),
  base_salary: numeric,
  band: z.string().nullable(),
  band_midpoint: numeric.nullable(),
  effective_date: z.string().nullable(),
  note: z.string().nullable(),
  /* Embedded employee — an object when the row has one, and PostgREST can
     return an array shape depending on how it infers the relationship. */
  employees: z
    .union([z.object({ name: z.string() }), z.array(z.object({ name: z.string() }))])
    .nullable(),
})

const SELECT_COLUMNS =
  'id, employee_id, base_salary, band, band_midpoint, effective_date, note, employees(name)'

function toRecord(row: z.infer<typeof rowSchema>): ProductionCompensationRecord {
  const employee = Array.isArray(row.employees) ? row.employees[0] : row.employees
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: employee?.name ?? '',
    baseSalary: row.base_salary,
    band: row.band,
    bandMidpoint: row.band_midpoint,
    effectiveDate: row.effective_date,
    note: row.note,
  }
}

/**
 * Percent above or below the employer's own band midpoint, or null when they
 * did not supply one. **Null is not zero** — a record with no midpoint has no
 * comparison, and rendering it as 0% would read as "exactly at midpoint".
 */
export function deltaFromMidpoint(record: ProductionCompensationRecord): number | null {
  if (record.bandMidpoint === null || record.bandMidpoint <= 0) return null
  return Math.round(((record.baseSalary - record.bandMidpoint) / record.bandMidpoint) * 100)
}

export async function listCompensationRecords(
  organizationId: string,
): Promise<ProductionCompensationRecord[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_compensation_records')
    .select(SELECT_COLUMNS)
    .eq('organization_id', organizationId)
    .order('created_at')
  if (error) throw error
  return z.array(rowSchema).parse(data).map(toRecord)
}

export async function addCompensationRecord(
  organizationId: string,
  fields: NewCompensationRecord,
): Promise<ProductionCompensationRecord> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_compensation_records')
    .insert({
      organization_id: organizationId,
      employee_id: fields.employeeId,
      base_salary: fields.baseSalary,
      band: fields.band.trim() || null,
      band_midpoint: fields.bandMidpoint.trim() ? Number(fields.bandMidpoint) : null,
      effective_date: fields.effectiveDate || null,
      note: fields.note.trim() || null,
    })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toRecord(rowSchema.parse(data))
}

export async function updateCompensationRecord(
  id: string,
  fields: UpdateCompensationRecord,
): Promise<ProductionCompensationRecord> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_compensation_records')
    .update({
      base_salary: fields.baseSalary,
      band: fields.band.trim() || null,
      band_midpoint: fields.bandMidpoint.trim() ? Number(fields.bandMidpoint) : null,
      effective_date: fields.effectiveDate || null,
      note: fields.note.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toRecord(rowSchema.parse(data))
}

export async function removeCompensationRecord(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('hr_compensation_records').delete().eq('id', id)
  if (error) throw error
}
