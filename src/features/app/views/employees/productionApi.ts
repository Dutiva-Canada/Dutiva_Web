import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import type { TablesUpdate } from '@/lib/supabase/types'
import { fetchAllPages } from '@/lib/supabasePagination'
import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'

/**
 * Real persistence for the Employees roster (production mode) — reads and
 * writes `public.employees`, org-scoped by RLS (see migration 0006). Unlike
 * the workspaceMode api (which degrades silently because it runs for every
 * visitor), these throw on failure: they only ever run for the signed-in
 * admin in production mode, where an error must surface, not vanish.
 */

export type ProductionEmployeeStatus = 'active' | 'on_leave' | 'terminated'

export interface ProductionEmployee {
  id: string
  name: string
  title: string | null
  email: string | null
  /** Employment jurisdiction — full English name stored in DB column `jurisdiction`. */
  jurisdiction: string
  startDate: string | null
  status: ProductionEmployeeStatus
  /** Contractual probation end (YYYY-MM-DD), entered per employee — never derived. */
  probationEndDate: string | null
  /** Date employment ended; null for pre-0066 terminations. */
  terminationDate: string | null
}

export interface NewEmployee {
  name: string
  title: string
  email: string
  jurisdiction: string
  startDate: string
}

const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().nullable(),
  email: z.string().nullable(),
  jurisdiction: z.string(),
  start_date: z.string().nullable(),
  status: z.enum(['active', 'on_leave', 'terminated']),
  /* Lifecycle dates (0066). Optional-tolerant so pre-0066 row shapes in
     tests keep parsing; the live SELECT always includes them. */
  probation_end_date: z.string().nullable().optional(),
  termination_date: z.string().nullable().optional(),
})

const SELECT_COLUMNS =
  'id, name, title, email, jurisdiction, start_date, status, probation_end_date, termination_date'

function toEmployee(row: z.infer<typeof rowSchema>): ProductionEmployee {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    email: row.email,
    jurisdiction: row.jurisdiction,
    startDate: row.start_date,
    status: row.status,
    probationEndDate: row.probation_end_date ?? null,
    terminationDate: row.termination_date ?? null,
  }
}

export async function listEmployees(organizationId: string): Promise<ProductionEmployee[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const client = supabase
  const data = await fetchAllPages((from, to) =>
    client
      .from('employees')
      .select(SELECT_COLUMNS)
      .eq('organization_id', organizationId)
      .order('name')
      .order('id')
      .range(from, to),
  )
  return z.array(rowSchema).parse(data).map(toEmployee)
}

export async function addEmployee(
  organizationId: string,
  fields: NewEmployee,
): Promise<ProductionEmployee> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('employees')
    .insert({
      organization_id: organizationId,
      name: fields.name,
      title: fields.title || null,
      email: fields.email || null,
      jurisdiction: fields.jurisdiction,
      start_date: fields.startDate || null,
    })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw error
  return toEmployee(rowSchema.parse(data))
}

export async function removeEmployee(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw error
}

/* ── Employee profile (Phase 12): single fetch, status, notes thread ────── */

export interface ProductionEmployeeNote {
  id: string
  body: string
  /** ISO timestamp — displayed date-only. */
  createdAt: string
}

const noteRowSchema = z.object({
  id: z.string(),
  body: z.string(),
  created_at: z.string(),
})

export async function getEmployee(id: string): Promise<ProductionEmployee | null> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('employees')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toEmployee(rowSchema.parse(data))
}

export async function updateEmployeeStatus(
  id: string,
  status: ProductionEmployeeStatus,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('employees')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/**
 * Set or clear the lifecycle dates (probation end / termination). Only the
 * keys present are written, so callers can update one without the other.
 */
export async function updateEmployeeDates(
  id: string,
  dates: { probationEndDate?: string | null; terminationDate?: string | null },
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const patch: TablesUpdate<'employees'> = { updated_at: new Date().toISOString() }
  if ('probationEndDate' in dates) patch.probation_end_date = dates.probationEndDate ?? null
  if ('terminationDate' in dates) patch.termination_date = dates.terminationDate ?? null
  const { error } = await supabase.from('employees').update(patch).eq('id', id)
  if (error) throw error
}

/* ── Expiry records: certifications & dated documents (0064) ────────────── */

export type ExpiryRecordKind = 'certification' | 'document'

export interface ProductionExpiryRecord {
  id: string
  employeeId: string
  /** Joined from the employee row; null if the relation is unreadable. */
  employeeName: string | null
  employeeJurisdiction: string | null
  kind: ExpiryRecordKind
  name: string
  /** YYYY-MM-DD. */
  expiryDate: string
}

const expiryRowSchema = z.object({
  id: z.string(),
  employee_id: z.string(),
  kind: z.enum(['certification', 'document']),
  name: z.string(),
  expiry_date: z.string(),
  employees: z.object({ name: z.string(), jurisdiction: z.string() }).nullable().optional(),
})

const EXPIRY_SELECT = 'id, employee_id, kind, name, expiry_date, employees ( name, jurisdiction )'

function toExpiryRecord(row: z.infer<typeof expiryRowSchema>): ProductionExpiryRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employees?.name ?? null,
    employeeJurisdiction: row.employees?.jurisdiction ?? null,
    kind: row.kind,
    name: row.name,
    expiryDate: row.expiry_date,
  }
}

export async function listExpiryRecords(organizationId: string): Promise<ProductionExpiryRecord[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_expiry_records')
    .select(EXPIRY_SELECT)
    .eq('organization_id', organizationId)
    .order('expiry_date')
  if (error) throw error
  return z.array(expiryRowSchema).parse(data).map(toExpiryRecord)
}

export async function listEmployeeExpiryRecords(
  employeeId: string,
): Promise<ProductionExpiryRecord[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_expiry_records')
    .select(EXPIRY_SELECT)
    .eq('employee_id', employeeId)
    .order('expiry_date')
  if (error) throw error
  return z.array(expiryRowSchema).parse(data).map(toExpiryRecord)
}

export async function addExpiryRecord(
  organizationId: string,
  employeeId: string,
  fields: { kind: ExpiryRecordKind; name: string; expiryDate: string },
): Promise<ProductionExpiryRecord> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_expiry_records')
    .insert({
      organization_id: organizationId,
      employee_id: employeeId,
      kind: fields.kind,
      name: fields.name,
      expiry_date: fields.expiryDate,
    })
    .select(EXPIRY_SELECT)
    .single()
  if (error) throw error
  return toExpiryRecord(expiryRowSchema.parse(data))
}

export async function removeExpiryRecord(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('hr_expiry_records').delete().eq('id', id)
  if (error) throw error
}

/* ── Leave records (0065) — status only, never medical detail ───────────── */

export interface ProductionLeave {
  id: string
  employeeId: string
  employeeName: string | null
  leaveType: string
  isProtected: boolean
  startDate: string | null
  expectedReturnDate: string | null
  /** Null while the leave is current. */
  endedOn: string | null
}

const leaveRowSchema = z.object({
  id: z.string(),
  employee_id: z.string(),
  leave_type: z.string(),
  is_protected: z.boolean(),
  start_date: z.string().nullable(),
  expected_return_date: z.string().nullable(),
  ended_on: z.string().nullable(),
  employees: z.object({ name: z.string() }).nullable().optional(),
})

const LEAVE_SELECT =
  'id, employee_id, leave_type, is_protected, start_date, expected_return_date, ended_on, employees ( name )'

function toLeave(row: z.infer<typeof leaveRowSchema>): ProductionLeave {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employees?.name ?? null,
    leaveType: row.leave_type,
    isProtected: row.is_protected,
    startDate: row.start_date,
    expectedReturnDate: row.expected_return_date,
    endedOn: row.ended_on,
  }
}

export async function listLeaves(organizationId: string): Promise<ProductionLeave[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_leaves')
    .select(LEAVE_SELECT)
    .eq('organization_id', organizationId)
    .order('expected_return_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return z.array(leaveRowSchema).parse(data).map(toLeave)
}

export async function listEmployeeLeaves(employeeId: string): Promise<ProductionLeave[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_leaves')
    .select(LEAVE_SELECT)
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return z.array(leaveRowSchema).parse(data).map(toLeave)
}

export async function addLeave(
  organizationId: string,
  employeeId: string,
  fields: {
    leaveType: string
    isProtected: boolean
    startDate: string | null
    expectedReturnDate: string | null
  },
): Promise<ProductionLeave> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_leaves')
    .insert({
      organization_id: organizationId,
      employee_id: employeeId,
      leave_type: fields.leaveType,
      is_protected: fields.isProtected,
      start_date: fields.startDate,
      expected_return_date: fields.expectedReturnDate,
    })
    .select(LEAVE_SELECT)
    .single()
  if (error) throw error
  return toLeave(leaveRowSchema.parse(data))
}

/** Mark a leave over as of `endedOn` (YYYY-MM-DD). */
export async function endLeave(id: string, endedOn: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('hr_leaves')
    .update({ ended_on: endedOn, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function listEmployeeNotes(employeeId: string): Promise<ProductionEmployeeNote[]> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_employee_notes')
    .select('id, body, created_at')
    .eq('employee_id', employeeId)
    .order('created_at')
  if (error) throw error
  return z
    .array(noteRowSchema)
    .parse(data)
    .map((r) => ({ id: r.id, body: r.body, createdAt: r.created_at }))
}

export async function addEmployeeNote(
  organizationId: string,
  employeeId: string,
  body: string,
): Promise<ProductionEmployeeNote> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('hr_employee_notes')
    .insert({ organization_id: organizationId, employee_id: employeeId, body })
    .select('id, body, created_at')
    .single()
  if (error) throw error
  const row = noteRowSchema.parse(data)
  return { id: row.id, body: row.body, createdAt: row.created_at }
}

/**
 * Employment jurisdiction options — stored in `employees.jurisdiction` as the
 * English jurisdiction name; the form displays the active language.
 */
export const EMPLOYMENT_JURISDICTIONS: readonly Bi[] = [
  bi('Alberta', 'Alberta'),
  bi('British Columbia', 'Colombie-Britannique'),
  bi('Manitoba', 'Manitoba'),
  bi('New Brunswick', 'Nouveau-Brunswick'),
  bi('Newfoundland and Labrador', 'Terre-Neuve-et-Labrador'),
  bi('Northwest Territories', 'Territoires du Nord-Ouest'),
  bi('Nova Scotia', 'Nouvelle-Écosse'),
  bi('Nunavut', 'Nunavut'),
  bi('Ontario', 'Ontario'),
  bi('Prince Edward Island', 'Île-du-Prince-Édouard'),
  bi('Quebec', 'Québec'),
  bi('Saskatchewan', 'Saskatchewan'),
  bi('Yukon', 'Yukon'),
]
