import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { revenueMessages as M } from '@/i18n/messages/revenue'
import { statusChipClass } from '@/components/chips'
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormField'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useCrmData } from '@/features/app/views/crm/useCrmData'
import { loadCommsState } from '@/features/app/views/comms/data/productionApi'
import { initialCommsState } from '@/features/app/views/comms/data/fixtures'
import { listSpecialists } from '@/features/app/views/specialists/data/productionApi'
import { specialists } from '@/features/app/views/specialists/data/fixtures'
import type { Specialist } from '@/features/app/views/specialists/data/types'
import { listCases } from '@/features/app/views/cases/productionApi'
import { cases } from '@/data/cases'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import { EntityLinksPanel } from '@/features/app/entityLinks/EntityLinksPanel'
import type { LinkCandidate } from '@/features/app/entityLinks/data/types'
import { useRevenueData } from '../RevenueDataContext'
import type {
  RevenueStream,
  RevenueStreamStatus,
  RevenueStreamType,
  RevenueStreamFrequency,
  RevenueCurrency,
} from '../data/types'
import { formatCurrency } from '../data/format'

const STATUSES: RevenueStreamStatus[] = ['active', 'paused', 'completed', 'cancelled']
const TYPES: RevenueStreamType[] = ['recurring', 'one_time']
const FREQUENCIES: RevenueStreamFrequency[] = ['monthly', 'quarterly', 'annually']
const CURRENCIES: RevenueCurrency[] = ['CAD', 'USD', 'EUR', 'GBP']

const STATUS_LABELS: Record<RevenueStreamStatus, keyof typeof M> = {
  active: 'rev_stream_status_active',
  paused: 'rev_stream_status_paused',
  completed: 'rev_stream_status_completed',
  cancelled: 'rev_stream_status_cancelled',
}

const STATUS_TONE: Record<RevenueStreamStatus, 'success' | 'warning' | 'neutral' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  completed: 'neutral',
  cancelled: 'neutral',
}

const TYPE_LABELS: Record<RevenueStreamType, keyof typeof M> = {
  recurring: 'rev_stream_type_recurring',
  one_time: 'rev_stream_type_one_time',
}

const FREQUENCY_LABELS: Record<RevenueStreamFrequency, keyof typeof M> = {
  monthly: 'rev_frequency_monthly',
  quarterly: 'rev_frequency_quarterly',
  annually: 'rev_frequency_annually',
}

const CURRENCY_LABELS: Record<RevenueCurrency, keyof typeof M> = {
  CAD: 'rev_currency_CAD',
  USD: 'rev_currency_USD',
  EUR: 'rev_currency_EUR',
  GBP: 'rev_currency_GBP',
}

function generateId() {
  return `rev-stream-${Math.random().toString(36).slice(2, 9)}`
}

function emptyStream(): RevenueStream {
  return {
    id: generateId(),
    organization_id: '',
    name: '',
    stream_type: 'recurring',
    status: 'active',
    amount: 0,
    currency: 'CAD',
    frequency: 'monthly',
    start_date: null,
    end_date: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function StreamRow({
  stream,
  onEdit,
  onRemove,
}: {
  readonly stream: RevenueStream
  readonly onEdit: (stream: RevenueStream) => void
  readonly onRemove: (id: string) => void
}) {
  const { x } = useI18n()
  return (
    <div className="flex items-start justify-between gap-[12px] border-t border-inset px-[14px] py-[12px] first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="mb-[2px] truncate text-[13.5px] font-semibold text-text">{stream.name}</div>
        <div className="text-[12px] text-text-muted">
          {x(M[TYPE_LABELS[stream.stream_type]])}
          {stream.stream_type === 'recurring' && stream.frequency
            ? ` · ${x(M[FREQUENCY_LABELS[stream.frequency]])}`
            : null}
          {` · ${formatCurrency(stream.amount, stream.currency)}`}
          {stream.start_date ? ` · ${stream.start_date}` : null}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        <span className={statusChipClass(STATUS_TONE[stream.status])}>
          {x(M[STATUS_LABELS[stream.status]])}
        </span>
        <button
          type="button"
          onClick={() => onEdit(stream)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.rev_edit)}
        </button>
        <button
          type="button"
          onClick={() => onRemove(stream.id)}
          className="rounded-[6px] p-[4px] text-text-muted hover:bg-inset hover:text-text"
        >
          {x(M.rev_remove)}
        </button>
      </div>
    </div>
  )
}

export function Streams() {
  const { x } = useI18n()
  const { mode, organizationId } = useWorkspaceMode()
  const { streams, addStream, updateStream, removeStream } = useRevenueData()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<RevenueStream | null>(null)

  const crm = useCrmData(mode, organizationId ?? undefined)
  const commsState = useMemo(
    () =>
      mode === 'production' && organizationId ? loadCommsState(organizationId) : initialCommsState,
    [mode, organizationId],
  )

  const [specialistList, setSpecialistList] = useState<Specialist[]>([])
  const [caseList, setCaseList] = useState<ProductionCase[]>([])

  useEffect(() => {
    if (mode !== 'production' || !organizationId) return
    const orgId = organizationId
    let cancelled = false
    async function load() {
      try {
        const [specialistsData, casesData] = await Promise.all([
          listSpecialists(orgId),
          listCases(orgId),
        ])
        if (!cancelled) {
          setSpecialistList(specialistsData)
          setCaseList(casesData)
        }
      } catch {
        /* ignore — link candidates simply stay empty until data loads */
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [mode, organizationId])

  const caseRecords = useMemo(
    () =>
      mode === 'production'
        ? caseList.map((c) => ({ id: c.id, title: c.title }))
        : cases.map((c) => ({ id: c.id, title: x(c.title) })),
    [mode, caseList, x],
  )

  const linkCandidates: LinkCandidate[] = useMemo(
    () => [
      {
        table: 'crm_deals',
        label: M.rev_links_crm_deals,
        records: crm.state.deals.map((d) => ({ id: d.id, title: d.title })),
        view: 'crm',
      },
      {
        table: 'comms_initiatives',
        label: M.rev_links_comms_initiatives,
        records: commsState.initiatives.map((i) => ({ id: i.id, title: x(i.title) })),
        view: 'comms/initiatives',
      },
      {
        table: 'specialists',
        label: M.rev_links_specialists,
        records: (mode === 'production' ? specialistList : specialists).map((s) => ({
          id: s.id,
          title: s.name,
        })),
        view: 'specialists/directory',
      },
      {
        table: 'cases',
        label: M.rev_links_cases,
        records: caseRecords,
        view: 'cases',
      },
    ],
    [crm.state.deals, commsState.initiatives, x, caseRecords, mode, specialistList],
  )

  const initial = editing ?? emptyStream()
  const [name, setName] = useState(initial.name)
  const [streamType, setStreamType] = useState<RevenueStreamType>(initial.stream_type)
  const [status, setStatus] = useState<RevenueStreamStatus>(initial.status)
  const [amount, setAmount] = useState(String(initial.amount))
  const [currency, setCurrency] = useState<RevenueCurrency>(initial.currency)
  const [frequency, setFrequency] = useState<RevenueStreamFrequency | null>(initial.frequency)
  const [startDate, setStartDate] = useState(initial.start_date ?? '')
  const [endDate, setEndDate] = useState(initial.end_date ?? '')
  const [notes, setNotes] = useState(initial.notes ?? '')

  useEffect(() => {
    const base = editing ?? emptyStream()
    setName(base.name)
    setStreamType(base.stream_type)
    setStatus(base.status)
    setAmount(String(base.amount))
    setCurrency(base.currency)
    setFrequency(base.frequency)
    setStartDate(base.start_date ?? '')
    setEndDate(base.end_date ?? '')
    setNotes(base.notes ?? '')
  }, [editing])

  const reset = () => {
    setShow(false)
    setEditing(null)
    const base = emptyStream()
    setName(base.name)
    setStreamType(base.stream_type)
    setStatus(base.status)
    setAmount(String(base.amount))
    setCurrency(base.currency)
    setFrequency(base.frequency)
    setStartDate(base.start_date ?? '')
    setEndDate(base.end_date ?? '')
    setNotes(base.notes ?? '')
  }

  const onSubmit = async () => {
    const now = new Date().toISOString()
    const value: RevenueStream = {
      ...(editing ?? emptyStream()),
      name,
      stream_type: streamType,
      status,
      amount: Number(amount) || 0,
      currency,
      frequency: streamType === 'recurring' ? frequency : null,
      start_date: startDate || null,
      end_date: endDate || null,
      notes: notes || null,
      updated_at: now,
    }
    if (editing) {
      await updateStream(value)
    } else {
      await addStream({ ...value, created_at: now })
    }
    reset()
  }

  const openCreate = () => {
    setEditing(null)
    setShow(true)
  }

  return (
    <div className="space-y-[14px]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => (show ? reset() : openCreate())}
          className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] font-medium text-text hover:bg-inset"
        >
          {x(show && !editing ? M.rev_cancel : M.rev_add_stream)}
        </button>
      </div>

      {show ? (
        <div className="grid grid-cols-1 gap-[14px] rounded-[12px] border border-border bg-surface p-[16px] sm:grid-cols-2">
          <FormField label={x(M.rev_name)} className="sm:col-span-2">
            <FormInput value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>

          <FormField label={x(M.rev_type)}>
            <FormSelect
              value={streamType}
              onChange={(e) => setStreamType(e.target.value as RevenueStreamType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {x(M[TYPE_LABELS[t]])}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label={x(M.rev_status)}>
            <FormSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as RevenueStreamStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {x(M[STATUS_LABELS[s]])}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label={x(M.rev_amount)}>
            <FormInput
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </FormField>

          <FormField label={x(M.rev_currency)}>
            <FormSelect
              value={currency}
              onChange={(e) => setCurrency(e.target.value as RevenueCurrency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {x(M[CURRENCY_LABELS[c]])}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label={x(M.rev_frequency)}>
            <FormSelect
              value={frequency ?? ''}
              onChange={(e) => setFrequency((e.target.value as RevenueStreamFrequency) || null)}
              disabled={streamType !== 'recurring'}
            >
              <option value="">{x(M.rev_frequency_none)}</option>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {x(M[FREQUENCY_LABELS[f]])}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label={x(M.rev_start_date)}>
            <FormInput
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>

          <FormField label={x(M.rev_end_date)}>
            <FormInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>

          <FormField label={x(M.rev_notes)} className="sm:col-span-2">
            <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>

          {editing ? (
            <div className="sm:col-span-2">
              <EntityLinksPanel
                fromTable="revenue_streams"
                fromId={editing.id}
                candidates={linkCandidates}
              />
            </div>
          ) : null}

          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] text-[13px] text-text-muted hover:text-text"
            >
              {x(M.rev_cancel)}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-[8px] bg-accent px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-accent/90"
            >
              {x(editing ? M.rev_save_changes : M.rev_save)}
            </button>
          </div>
        </div>
      ) : null}

      {streams.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface px-[16px] py-[24px] text-center">
          <p className="m-0 text-[13.5px] text-text-muted">{x(M.rev_empty_streams)}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {streams.map((stream) => (
            <StreamRow
              key={stream.id}
              stream={stream}
              onEdit={(s) => {
                setEditing(s)
                setShow(true)
              }}
              onRemove={(id) => removeStream(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
