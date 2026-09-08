import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { fetchAllPages } from '@/lib/supabasePagination'
import type { RevenueStream, RevenueInvoice } from './types'

const streamRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
  stream_type: z.enum(['recurring', 'one_time']),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']),
  amount: z.number(),
  currency: z.enum(['CAD', 'USD', 'EUR', 'GBP']),
  frequency: z.enum(['monthly', 'quarterly', 'annually']).nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

const invoiceRowSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  stream_id: z.string().nullable(),
  customer_name: z.string(),
  amount: z.number(),
  currency: z.enum(['CAD', 'USD', 'EUR', 'GBP']),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  issue_date: z.string().nullable(),
  due_date: z.string().nullable(),
  paid_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

function toStream(row: z.infer<typeof streamRowSchema>): RevenueStream {
  return { ...row }
}

function toInvoice(row: z.infer<typeof invoiceRowSchema>): RevenueInvoice {
  return { ...row }
}

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function listRevenueStreams(organizationId: string): Promise<RevenueStream[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('revenue_streams')
      .select('*')
      .eq('organization_id', organizationId)
      .order('status')
      .order('name')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(streamRowSchema).parse(data)
  return parsed.map(toStream)
}

export async function listRevenueInvoices(organizationId: string): Promise<RevenueInvoice[]> {
  const client = getClient()
  const data = await fetchAllPages((from, to) =>
    client
      .from('revenue_invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .order('issue_date', { ascending: false })
      .order('due_date')
      .order('id')
      .range(from, to),
  )
  const parsed = z.array(invoiceRowSchema).parse(data)
  return parsed.map(toInvoice)
}

const streamInsertSchema = z.object({
  organization_id: z.string(),
  name: z.string().min(1),
  stream_type: z.enum(['recurring', 'one_time']),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']),
  amount: z.number(),
  currency: z.enum(['CAD', 'USD', 'EUR', 'GBP']),
  frequency: z.enum(['monthly', 'quarterly', 'annually']).nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  notes: z.string().nullable(),
})

const streamUpdateSchema = z.object({
  name: z.string().min(1),
  stream_type: z.enum(['recurring', 'one_time']),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']),
  amount: z.number(),
  currency: z.enum(['CAD', 'USD', 'EUR', 'GBP']),
  frequency: z.enum(['monthly', 'quarterly', 'annually']).nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  notes: z.string().nullable(),
})

const invoiceInsertSchema = z.object({
  organization_id: z.string(),
  stream_id: z.string().nullable(),
  customer_name: z.string().min(1),
  amount: z.number(),
  currency: z.enum(['CAD', 'USD', 'EUR', 'GBP']),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  issue_date: z.string().nullable(),
  due_date: z.string().nullable(),
  paid_date: z.string().nullable(),
  notes: z.string().nullable(),
})

const invoiceUpdateSchema = z.object({
  stream_id: z.string().nullable(),
  customer_name: z.string().min(1),
  amount: z.number(),
  currency: z.enum(['CAD', 'USD', 'EUR', 'GBP']),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  issue_date: z.string().nullable(),
  due_date: z.string().nullable(),
  paid_date: z.string().nullable(),
  notes: z.string().nullable(),
})

export type RevenueStreamInsert = z.input<typeof streamInsertSchema>
export type RevenueInvoiceInsert = z.input<typeof invoiceInsertSchema>

export async function createRevenueStream(
  organizationId: string,
  values: Omit<RevenueStreamInsert, 'organization_id'>,
): Promise<RevenueStream> {
  const client = getClient()
  const insert = streamInsertSchema.parse({ ...values, organization_id: organizationId })
  const { data, error } = await client.from('revenue_streams').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const parsed = streamRowSchema.parse(data)
  return toStream(parsed)
}

export async function createRevenueInvoice(
  organizationId: string,
  values: Omit<RevenueInvoiceInsert, 'organization_id'>,
): Promise<RevenueInvoice> {
  const client = getClient()
  const insert = invoiceInsertSchema.parse({ ...values, organization_id: organizationId })
  const { data, error } = await client.from('revenue_invoices').insert(insert).select().single()
  if (error) throw new Error(error.message)
  const parsed = invoiceRowSchema.parse(data)
  return toInvoice(parsed)
}

export async function updateRevenueStream(
  id: string,
  values: Omit<RevenueStreamInsert, 'organization_id'>,
): Promise<RevenueStream> {
  const client = getClient()
  const update = streamUpdateSchema.parse(values)
  const { data, error } = await client
    .from('revenue_streams')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  const parsed = streamRowSchema.parse(data)
  return toStream(parsed)
}

export async function updateRevenueInvoice(
  id: string,
  values: Omit<RevenueInvoiceInsert, 'organization_id'>,
): Promise<RevenueInvoice> {
  const client = getClient()
  const update = invoiceUpdateSchema.parse(values)
  const { data, error } = await client
    .from('revenue_invoices')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  const parsed = invoiceRowSchema.parse(data)
  return toInvoice(parsed)
}

export async function deleteRevenueStream(id: string): Promise<void> {
  const client = getClient()
  const { error } = await client.from('revenue_streams').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteRevenueInvoice(id: string): Promise<void> {
  const client = getClient()
  const { error } = await client.from('revenue_invoices').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
