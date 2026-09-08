import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type {
  OperationsProject,
  OperationsVendor,
  OperationsQualityCheck,
  OperationsTechnology,
  OperationsLogistics,
} from './types'

const projectRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  owner_id: z.string().nullable(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  start_date: z.string().nullable(),
  target_date: z.string().nullable(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const vendorRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  finance_party_id: z.string().nullable(),
  name: z.string(),
  vendor_type: z.enum(['supplier', 'logistics', 'technology', 'professional_service']).nullable(),
  status: z.enum(['active', 'inactive', 'under_review']),
  contract_expiry: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const qualityRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  assigned_to: z.string().nullable(),
  reviewer_id: z.string().nullable(),
  checklist: z.unknown(),
  due_date: z.string().nullable(),
  completed_date: z.string().nullable(),
  status: z.enum(['pending', 'passed', 'failed', 'overdue']),
  non_conformance: z.string().nullable(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const technologyRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  system_type: z.enum(['internal', 'customer_facing', 'integration', 'infrastructure']).nullable(),
  owner_id: z.string().nullable(),
  status: z.enum(['active', 'deprecated', 'planned']),
  renewal_date: z.string().nullable(),
  integration_notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const logisticsRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  owner_id: z.string().nullable(),
  assigned_to: z.string().nullable(),
  status: z.enum(['in_transit', 'delivered', 'delayed', 'returned']),
  expected_date: z.string().nullable(),
  delivered_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

function toProject(row: z.infer<typeof projectRowSchema>): OperationsProject {
  return { ...row }
}

function toVendor(row: z.infer<typeof vendorRowSchema>): OperationsVendor {
  return { ...row }
}

function toQualityCheck(row: z.infer<typeof qualityRowSchema>): OperationsQualityCheck {
  return { ...row }
}

function toTechnology(row: z.infer<typeof technologyRowSchema>): OperationsTechnology {
  return { ...row }
}

function toLogistics(row: z.infer<typeof logisticsRowSchema>): OperationsLogistics {
  return { ...row }
}

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function listOperationsProjects(organizationId: string): Promise<OperationsProject[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('operations_projects')
      .select('*')
      .eq('organization_id', organizationId)
      .order('status')
      .order('title')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(projectRowSchema).parse(data)
  return parsed.map(toProject)
}

export async function listOperationsVendors(organizationId: string): Promise<OperationsVendor[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('operations_vendors')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(vendorRowSchema).parse(data)
  return parsed.map(toVendor)
}

export async function listOperationsQualityChecks(
  organizationId: string,
): Promise<OperationsQualityCheck[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('operations_quality_checks')
      .select('*')
      .eq('organization_id', organizationId)
      .order('due_date')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(qualityRowSchema).parse(data)
  return parsed.map(toQualityCheck)
}

export async function listOperationsTechnology(organizationId: string): Promise<OperationsTechnology[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('operations_technology')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(technologyRowSchema).parse(data)
  return parsed.map(toTechnology)
}

export async function listOperationsLogistics(organizationId: string): Promise<OperationsLogistics[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('operations_logistics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('status')
      .order('expected_date')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(logisticsRowSchema).parse(data)
  return parsed.map(toLogistics)
}
