import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  listRevenueStreams,
  listRevenueInvoices,
  createRevenueStream,
  createRevenueInvoice,
  updateRevenueStream,
  updateRevenueInvoice,
  deleteRevenueStream,
  deleteRevenueInvoice,
} from './data/productionApi'
import { revenueSummary as fixtures } from './data/fixtures'
import { RevenueDataContext } from './RevenueDataContext'
import type { RevenueDataValue } from './RevenueDataContext'
import type { RevenueStream, RevenueInvoice } from './data/types'

const EMPTY: Pick<RevenueDataValue, 'streams' | 'invoices' | 'loading' | 'error'> = {
  streams: [],
  invoices: [],
  loading: false,
  error: null,
}

export function RevenueDataProvider({
  mode,
  children,
}: {
  readonly mode: 'demo' | 'production'
  readonly children: ReactNode
}) {
  const { organizationId } = useWorkspaceMode()
  const [value, setValue] = useState<
    Pick<RevenueDataValue, 'streams' | 'invoices' | 'loading' | 'error'>
  >(() => (mode === 'demo' ? { ...fixtures, loading: false, error: null } : EMPTY))

  useEffect(() => {
    if (mode !== 'production') return
    if (!organizationId) {
      setValue(EMPTY)
      return
    }

    const orgId = organizationId
    let cancelled = false
    async function load() {
      try {
        setValue((prev) => ({ ...prev, loading: true, error: null }))
        const [streams, invoices] = await Promise.all([
          listRevenueStreams(orgId),
          listRevenueInvoices(orgId),
        ])
        if (cancelled) return
        setValue({ streams, invoices, loading: false, error: null })
      } catch (err) {
        if (cancelled) return
        setValue({
          ...EMPTY,
          error: err instanceof Error ? err.message : 'Could not load revenue data.',
        })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [mode, organizationId])

  const addStream = useCallback(
    async (stream: RevenueStream) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, streams: [stream, ...prev.streams] }))
        return
      }
      try {
        const created = await createRevenueStream(organizationId, {
          name: stream.name,
          stream_type: stream.stream_type,
          status: stream.status,
          amount: stream.amount,
          currency: stream.currency,
          frequency: stream.frequency,
          start_date: stream.start_date,
          end_date: stream.end_date,
          notes: stream.notes,
        })
        setValue((prev) => ({ ...prev, streams: [created, ...prev.streams] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save stream.',
        }))
      }
    },
    [mode, organizationId],
  )

  const addInvoice = useCallback(
    async (invoice: RevenueInvoice) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, invoices: [invoice, ...prev.invoices] }))
        return
      }
      try {
        const created = await createRevenueInvoice(organizationId, {
          stream_id: invoice.stream_id,
          customer_name: invoice.customer_name,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          paid_date: invoice.paid_date,
          notes: invoice.notes,
        })
        setValue((prev) => ({ ...prev, invoices: [created, ...prev.invoices] }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not save invoice.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateStream = useCallback(
    async (stream: RevenueStream) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          streams: prev.streams.map((s) => (s.id === stream.id ? stream : s)),
        }))
        return
      }
      try {
        const saved = await updateRevenueStream(stream.id, {
          name: stream.name,
          stream_type: stream.stream_type,
          status: stream.status,
          amount: stream.amount,
          currency: stream.currency,
          frequency: stream.frequency,
          start_date: stream.start_date,
          end_date: stream.end_date,
          notes: stream.notes,
        })
        setValue((prev) => ({
          ...prev,
          streams: prev.streams.map((s) => (s.id === saved.id ? saved : s)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update stream.',
        }))
      }
    },
    [mode, organizationId],
  )

  const updateInvoice = useCallback(
    async (invoice: RevenueInvoice) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({
          ...prev,
          invoices: prev.invoices.map((i) => (i.id === invoice.id ? invoice : i)),
        }))
        return
      }
      try {
        const saved = await updateRevenueInvoice(invoice.id, {
          stream_id: invoice.stream_id,
          customer_name: invoice.customer_name,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          paid_date: invoice.paid_date,
          notes: invoice.notes,
        })
        setValue((prev) => ({
          ...prev,
          invoices: prev.invoices.map((i) => (i.id === saved.id ? saved : i)),
        }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not update invoice.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeStream = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, streams: prev.streams.filter((s) => s.id !== id) }))
        return
      }
      try {
        await deleteRevenueStream(id)
        setValue((prev) => ({ ...prev, streams: prev.streams.filter((s) => s.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove stream.',
        }))
      }
    },
    [mode, organizationId],
  )

  const removeInvoice = useCallback(
    async (id: string) => {
      if (mode !== 'production' || !organizationId) {
        setValue((prev) => ({ ...prev, invoices: prev.invoices.filter((i) => i.id !== id) }))
        return
      }
      try {
        await deleteRevenueInvoice(id)
        setValue((prev) => ({ ...prev, invoices: prev.invoices.filter((i) => i.id !== id) }))
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Could not remove invoice.',
        }))
      }
    },
    [mode, organizationId],
  )

  const stable = useMemo(
    () => ({
      streams: value.streams,
      invoices: value.invoices,
      loading: value.loading,
      error: value.error,
      addStream,
      updateStream,
      removeStream,
      addInvoice,
      updateInvoice,
      removeInvoice,
    }),
    [value, addStream, updateStream, removeStream, addInvoice, updateInvoice, removeInvoice],
  )

  return <RevenueDataContext.Provider value={stable}>{children}</RevenueDataContext.Provider>
}
