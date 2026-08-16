import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/context'
import { capacityMessages as M } from '@/i18n/messages/capacity'
import type { Bi } from '@/i18n/core'
import {
  getCapacityStatus,
  updateCapacityConfig,
} from '@/features/support/capacityAdminApi'
import type { CapacityStatus } from '@/features/support/capacityAdminApi'

const MODE_ORDER: Array<'unlimited' | 'capped' | 'waitlist'> = [
  'unlimited',
  'capped',
  'waitlist',
]

const MODE_LABELS: Record<'unlimited' | 'capped' | 'waitlist', Bi> = {
  unlimited: M.capacity_admin_mode_unlimited,
  capped: M.capacity_admin_mode_capped,
  waitlist: M.capacity_admin_mode_waitlist,
}

const THRESHOLD_LABELS: Record<string, Bi> = {
  normal: M.capacity_threshold_normal,
  approaching: M.capacity_threshold_approaching,
  near: M.capacity_threshold_near,
  full: M.capacity_threshold_full,
  unlimited: M.capacity_threshold_unlimited,
  monitoring_disabled: M.capacity_threshold_monitoring_disabled,
}

const selectClass =
  'rounded-[8px] border border-border bg-surface px-[10px] py-[7px] text-[13px] text-text'

export function CapacityAdminControl() {
  const { x } = useI18n()
  const [status, setStatus] = useState<CapacityStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  const [limit, setLimit] = useState(100)
  const [enforcementEnabled, setEnforcementEnabled] = useState(false)
  const [mode, setMode] = useState<'unlimited' | 'capped' | 'waitlist'>('unlimited')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(false)
      const next = await getCapacityStatus()
      setStatus(next)
      if (next) {
        setLimit(next.limit)
        setEnforcementEnabled(next.enforcementEnabled)
        setMode(next.mode)
      }
      setLoading(false)
    }
    void load()
  }, [])

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(false)
    const ok = await updateCapacityConfig({ limit, enforcementEnabled, mode })
    if (ok) {
      const next = await getCapacityStatus()
      setStatus(next)
      if (next) {
        setLimit(next.limit)
        setEnforcementEnabled(next.enforcementEnabled)
        setMode(next.mode)
      }
      setSaved(true)
    } else {
      setError(true)
    }
    setSaving(false)
  }

  if (loading) return null
  if (!status) {
    return (
      <section className="mb-[20px] rounded-[12px] border border-border bg-inset px-[16px] py-[14px]">
        <h2 className="m-0 text-[13px] font-semibold text-text-2">{x(M.capacity_admin_title)}</h2>
        <p role="alert" className="m-0 mt-[10px] text-[13px] text-risk-fg">
          {x(M.capacity_admin_load_error)}
        </p>
      </section>
    )
  }

  return (
    <section className="mb-[20px] rounded-[12px] border border-border bg-inset px-[16px] py-[14px]">
      <h2 className="m-0 mb-[12px] text-[13px] font-semibold text-text-2">{x(M.capacity_admin_title)}</h2>

      <div className="grid gap-[12px] sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[8px] border border-border bg-surface px-[12px] py-[10px]">
          <div className="text-[11.5px] text-text-muted">{x(M.capacity_admin_current)}</div>
          <div className="text-[18px] font-semibold text-text">{status.current}</div>
        </div>
        <div className="rounded-[8px] border border-border bg-surface px-[12px] py-[10px]">
          <div className="text-[11.5px] text-text-muted">{x(M.capacity_admin_remaining)}</div>
          <div className="text-[18px] font-semibold text-text">
            {status.remaining === null ? '—' : status.remaining}
          </div>
        </div>
        <div className="rounded-[8px] border border-border bg-surface px-[12px] py-[10px]">
          <div className="text-[11.5px] text-text-muted">{x(M.capacity_admin_utilization)}</div>
          <div className="text-[18px] font-semibold text-text">
            {status.utilization}% — {x(THRESHOLD_LABELS[status.thresholdStatus] ?? M.capacity_threshold_normal)}
          </div>
        </div>
        <div className="rounded-[8px] border border-border bg-surface px-[12px] py-[10px]">
          <div className="text-[11.5px] text-text-muted">{x(M.capacity_admin_waitlist_count)}</div>
          <div className="text-[18px] font-semibold text-text">{status.waitlistCount}</div>
        </div>
      </div>

      <div className="mt-[14px] flex flex-wrap items-end gap-[12px]">
        <label className="flex flex-col gap-[4px] text-[13px] text-text-2">
          {x(M.capacity_admin_limit)}
          <input
            type="number"
            min={0}
            value={limit}
            onChange={(e) => {
              setLimit(Number.parseInt(e.target.value, 10) || 0)
              setSaved(false)
            }}
            className={`${selectClass} w-[140px]`}
          />
        </label>

        <label className="flex items-center gap-[8px] text-[13px] text-text-2">
          <input
            type="checkbox"
            checked={enforcementEnabled}
            onChange={(e) => {
              setEnforcementEnabled(e.target.checked)
              setSaved(false)
            }}
            className="h-4 w-4 accent-navy"
          />
          {x(M.capacity_admin_enforcement)}
        </label>

        <label className="flex flex-col gap-[4px] text-[13px] text-text-2">
          {x(M.capacity_admin_mode)}
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as 'unlimited' | 'capped' | 'waitlist')
              setSaved(false)
            }}
            className={selectClass}
          >
            {MODE_ORDER.map((m) => (
              <option key={m} value={m}>
                {x(MODE_LABELS[m])}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[7px] text-[13px] font-semibold text-text-2 disabled:opacity-60"
        >
          {saving ? x(M.capacity_admin_saving) : saved ? x(M.capacity_admin_saved) : x(M.capacity_admin_save)}
        </button>
      </div>

      {error && (
        <p role="alert" className="m-0 mt-[10px] text-[13px] text-risk-fg">
          {x(M.capacity_admin_error)}
        </p>
      )}
    </section>
  )
}
