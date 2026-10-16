import '@/features/invest/portal/strategies.css'
import './health.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Download, FileText, Loader2, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import {
  deleteAllHealthData,
  exportHealthData,
  journalToMarkdown,
  listAllJournalEntries,
} from '@/features/health/data/api'
import {
  loadReminderPref,
  remindersAvailable,
  setReminderPref,
} from '@/lib/notifications/notifyPrefs'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useHealthHead } from './useHealthHead'

/**
 * /health/data — the trust surface. Three honest verbs: take a copy of
 * everything (paged in full, not the dashboard's capped window), opt in
 * to one evening email on unchecked days, or delete every Health row.
 * The delete copy names what stays — account, access, email settings —
 * so "everything" never overpromises.
 */

function downloadFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function HealthDataPage() {
  const { x, lang } = useI18n()
  const { refresh } = useHealthData()
  const { showToast } = useToasts()
  useHealthHead(HM.health_seo_title_data, HM.health_data_sub)

  const [exporting, setExporting] = useState<'json' | 'md' | null>(null)
  const [deleteArmed, setDeleteArmed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  /* null = the reminder card stays hidden — either the migration hasn't
     landed (probe failed) or the pref is still loading. */
  const [remindOn, setRemindOn] = useState<boolean | null>(null)
  const [remindBusy, setRemindBusy] = useState(false)

  useEffect(() => {
    let live = true
    void (async () => {
      try {
        if (!(await remindersAvailable())) return
        const on = await loadReminderPref('health')
        if (live) setRemindOn(on)
      } catch {
        /* a failed probe/pref read hides the card rather than offering a
           switch that can't save */
      }
    })()
    return () => {
      live = false
    }
  }, [])

  const exportJson = async () => {
    setExporting('json')
    try {
      const data = await exportHealthData()
      downloadFile(
        `dutiva-health-${data.exportedAt.slice(0, 10)}.json`,
        JSON.stringify(data, null, 2),
        'application/json',
      )
      showToast(HM.health_data_export_done)
    } catch {
      showToast(HM.health_data_export_failed)
    } finally {
      setExporting(null)
    }
  }

  const exportJournal = async () => {
    setExporting('md')
    try {
      const entries = await listAllJournalEntries()
      if (entries.length === 0) {
        showToast(HM.health_data_export_empty_journal)
        return
      }
      const day = new Date().toISOString().slice(0, 10)
      downloadFile(
        `dutiva-journal-${day}.md`,
        journalToMarkdown(entries, lang),
        'text/markdown',
      )
      showToast(HM.health_data_export_done)
    } catch {
      showToast(HM.health_data_export_failed)
    } finally {
      setExporting(null)
    }
  }

  const toggleReminder = async (on: boolean) => {
    setRemindBusy(true)
    try {
      await setReminderPref('health', on)
      setRemindOn(on)
      showToast(on ? HM.health_data_remind_saved_on : HM.health_data_remind_saved_off)
    } catch {
      showToast(HM.health_data_remind_failed)
    } finally {
      setRemindBusy(false)
    }
  }

  const doDelete = async () => {
    if (!deleteArmed) {
      setDeleteArmed(true)
      return
    }
    setDeleting(true)
    try {
      await deleteAllHealthData()
      /* Refetch so every other page's cached state empties with the
         tables — the Overview should meet the person as a fresh account. */
      await refresh()
      showToast(HM.health_data_delete_done)
    } catch {
      showToast(HM.health_data_delete_failed)
    } finally {
      setDeleting(false)
      setDeleteArmed(false)
    }
  }

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_data_title)}</h1>
      </div>
      <p className="sb-sub">{x(HM.health_data_sub)}</p>

      <section className="sb-card sb-card-pad" aria-labelledby="hb-data-export">
        <h2 id="hb-data-export" className="m-0 text-[16px]">
          {x(HM.health_data_export_title)}
        </h2>
        <p className="sb-body-text">{x(HM.health_data_export_sub)}</p>
        <div className="flex flex-wrap items-center gap-[10px]">
          <button
            type="button"
            className="sb-btn sb-btn-primary"
            disabled={exporting !== null}
            onClick={() => void exportJson()}
          >
            {exporting === 'json' ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Download size={14} aria-hidden="true" />
            )}
            {x(HM.health_data_export_json)}
          </button>
          <button
            type="button"
            className="sb-btn sb-btn-secondary"
            disabled={exporting !== null}
            onClick={() => void exportJournal()}
          >
            {exporting === 'md' ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <FileText size={14} aria-hidden="true" />
            )}
            {x(HM.health_data_export_md)}
          </button>
        </div>
      </section>

      {remindOn !== null && (
        <section className="sb-card sb-card-pad" aria-labelledby="hb-data-remind">
          <h2 id="hb-data-remind" className="m-0 text-[16px]">
            {x(HM.health_data_remind_title)}
          </h2>
          <p className="sb-body-text">{x(HM.health_data_remind_sub)}</p>
          <label className="hb-check">
            <input
              type="checkbox"
              checked={remindOn}
              disabled={remindBusy}
              onChange={(e) => void toggleReminder(e.target.checked)}
            />
            <Bell size={13} aria-hidden="true" />
            {x(HM.health_data_remind_toggle)}
          </label>
        </section>
      )}

      <section className="sb-card sb-card-pad" aria-labelledby="hb-data-delete">
        <h2 id="hb-data-delete" className="m-0 text-[16px]">
          {x(HM.health_data_delete_title)}
        </h2>
        <p className="sb-body-text">{x(HM.health_data_delete_sub)}</p>
        <button
          type="button"
          className={`sb-btn sb-btn-danger${deleteArmed ? ' sb-armed' : ''}`}
          disabled={deleting}
          onClick={() => void doDelete()}
          onBlur={() => setDeleteArmed(false)}
        >
          {deleting ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={14} aria-hidden="true" />
          )}
          {x(deleteArmed ? HM.health_data_delete_armed : HM.health_data_delete_btn)}
        </button>
      </section>

      <p className="mt-[20px]">
        <Link className="hb-quiet-link" to="/wellness">
          {x(HM.health_data_back)}
        </Link>
      </p>
    </div>
  )
}

export default HealthDataPage
