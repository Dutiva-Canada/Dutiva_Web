import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { supportMessages as M } from '@/i18n/messages/support'
import {
  SERVICE_COMPONENTS,
  STATUS_DOT_CLASS,
  STATUS_LEVEL_LABELS,
  getServiceStatus,
  setServiceStatus,
} from '@/features/support/statusApi'
import type {
  ServiceComponent,
  ServiceStatusLevel,
  ServiceStatusRow,
} from '@/features/support/statusApi'

const LEVELS: ServiceStatusLevel[] = ['operational', 'degraded', 'maintenance', 'outage']
const selectClass =
  'rounded-[7px] border border-border bg-surface px-[8px] py-[6px] text-[12.5px] text-text'

/** Founder control for the public /status board (rendered inside the admin-only
    Support dashboard). Reads the current statuses and posts changes through the
    admin-gated set-service-status edge function. */
export function ServiceStatusControl() {
  const { x } = useI18n()
  const [rows, setRows] = useState<ServiceStatusRow[] | null>(null)
  const [savingId, setSavingId] = useState<ServiceComponent | null>(null)
  const [savedId, setSavedId] = useState<ServiceComponent | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getServiceStatus()
      .then(setRows)
      .catch(() => setError(true))
  }, [])

  function patch(component: ServiceComponent, next: Partial<ServiceStatusRow>) {
    setRows((rs) => rs?.map((r) => (r.component === component ? { ...r, ...next } : r)) ?? rs)
    setSavedId(null)
  }

  async function save(row: ServiceStatusRow) {
    setSavingId(row.component)
    setSavedId(null)
    setError(false)
    try {
      await setServiceStatus(row.component, row.status, row.message ?? '')
      setSavedId(row.component)
    } catch (e) {
      console.error('status: update failed', e)
      setError(true)
    } finally {
      setSavingId(null)
    }
  }

  if (!rows) return null
  const label = (id: ServiceComponent) => x(SERVICE_COMPONENTS.find((c) => c.id === id)!.label)

  return (
    <section className="mb-[20px] rounded-[12px] border border-border bg-inset px-[16px] py-[14px]">
      <h2 className="m-0 mb-[10px] text-[13px] font-semibold text-text-2">
        {x(M.status_admin_title)}
      </h2>
      <div className="grid gap-[8px]">
        {rows.map((row) => (
          <div key={row.component} className="flex flex-wrap items-center gap-[8px]">
            <span className="flex w-[120px] flex-none items-center gap-[7px] text-[13px] text-text">
              <span aria-hidden="true" className={`status-dot ${STATUS_DOT_CLASS[row.status]}`} />
              {label(row.component)}
            </span>
            <select
              aria-label={`${label(row.component)} — ${x(M.status_admin_title)}`}
              value={row.status}
              onChange={(e) =>
                patch(row.component, { status: e.target.value as ServiceStatusLevel })
              }
              className={selectClass}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {x(STATUS_LEVEL_LABELS[l])}
                </option>
              ))}
            </select>
            <input
              type="text"
              aria-label={`${label(row.component)} — ${x(M.status_admin_message_ph)}`}
              placeholder={x(M.status_admin_message_ph)}
              value={row.message ?? ''}
              maxLength={500}
              onChange={(e) => patch(row.component, { message: e.target.value })}
              className={`${selectClass} min-w-[180px] flex-1`}
            />
            <button
              type="button"
              onClick={() => void save(row)}
              disabled={savingId === row.component}
              className="cursor-pointer rounded-[7px] border border-border bg-surface px-[12px] py-[6px] text-[12.5px] font-semibold text-text-2 disabled:opacity-60"
            >
              {savingId === row.component
                ? x(M.support_admin_working)
                : savedId === row.component
                  ? x(M.status_admin_saved)
                  : x(M.status_admin_save)}
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="m-0 mt-[8px] text-[12.5px] text-risk-fg">
          {x(M.support_admin_action_error)}
        </p>
      )}
    </section>
  )
}
