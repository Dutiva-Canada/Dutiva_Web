import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link as LinkIcon, Pencil, Plus, Send, Sparkle, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { communicationsMessages as M } from '@/i18n/messages/communications'
import { statusChipClass } from '@/components/chips'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ModuleEmptyBlock } from '@/features/app/workspaceMode/ModuleEmptyBlock'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { docTemplates, templateByTid } from '@/features/app/documents/data'
import {
  PRODUCTION_COMMUNICATION_CHANNELS,
  PRODUCTION_COMMUNICATION_STATUSES,
  addCommunication,
  listCommunications,
  markCommunicationSent,
  removeCommunication,
  updateCommunication,
} from './productionApi'
import type {
  ProductionCommunication,
  ProductionCommunicationChannel,
  ProductionCommunicationStatus,
} from './productionApi'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Internal communications in production mode — real persistence on
 * public.hr_communications (migration 0040).
 *
 * **The demo's four Advisor review chips are gone.** Tone / Legal / Clarity /
 * Policy rendered as passed or needs-review on every message, and nothing in
 * the product performs that analysis — a green "Legal ✓" on a message nobody
 * reviewed is the claim CANONICAL_FACTS §4 forbids. They return when an
 * Advisor pass over a draft actually exists.
 *
 * "Mark as sent" records that the employer sent something. It does not send:
 * Dutiva has no delivery path, the demo's Send button never had one either,
 * and the note at the foot of the list says so rather than leaving it implied.
 *
 * The template link is the Ring 3 connection — a logged message can name the
 * template it was drafted from (T35–T43) and link back to it.
 */

const CHANNEL_LABEL: Record<ProductionCommunicationChannel, (typeof M)[keyof typeof M]> = {
  email: M.comms_prod_channel_email,
  meeting: M.comms_prod_channel_meeting,
  intranet: M.comms_prod_channel_intranet,
  letter: M.comms_prod_channel_letter,
  other: M.comms_prod_channel_other,
}

const STATUS_LABEL: Record<ProductionCommunicationStatus, (typeof M)[keyof typeof M]> = {
  draft: M.comms_prod_status_draft,
  scheduled: M.comms_prod_status_scheduled,
  sent: M.comms_prod_status_sent,
}

const STATUS_TONE: Record<ProductionCommunicationStatus, 'neutral' | 'warning' | 'success'> = {
  draft: 'neutral',
  scheduled: 'warning',
  sent: 'success',
}

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const EMPTY_FORM = {
  title: '',
  audience: '',
  channel: 'email' as ProductionCommunicationChannel,
  status: 'draft' as ProductionCommunicationStatus,
  scheduledFor: '',
  templateTid: '',
  note: '',
}

/** Today as YYYY-MM-DD (local) — the stamp a "mark as sent" writes. */
const today = (): string => new Date().toISOString().slice(0, 10)

/** Ring 3's category is where a communications draft comes from. */
const commsTemplates = docTemplates.filter((t) => t.category === 'communications')

function commToForm(comm: ProductionCommunication) {
  return {
    title: comm.title,
    audience: comm.audience ?? '',
    channel: comm.channel,
    status: comm.status,
    scheduledFor: comm.scheduledFor ?? '',
    templateTid: comm.templateTid ?? '',
    note: comm.note ?? '',
  }
}

export function CommunicationsProductionView() {
  const { x, lang } = useI18n()
  const { showToast } = useToasts()
  const { organizationId } = useWorkspaceMode()

  const [rows, setRows] = useState<ProductionCommunication[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoadFailed(false)
    try {
      setRows(await listCommunications(organizationId))
    } catch {
      setRows([])
      setLoadFailed(true)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.comms_prod_empty_title)} />
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!form.title.trim() || saving) return
    setSaving(true)
    try {
      if (editingId) {
        const updated = await updateCommunication(editingId, {
          ...form,
          title: form.title.trim(),
        })
        setRows((prev) => (prev ?? []).map((r) => (r.id === editingId ? updated : r)))
        showToast(M.comms_prod_updated, 'ok')
      } else {
        const added = await addCommunication(organizationId, { ...form, title: form.title.trim() })
        setRows((prev) => [added, ...(prev ?? [])])
        showToast(M.comms_prod_added, 'ok')
      }
      closeForm()
    } catch {
      showToast(editingId ? M.comms_prod_update_failed : M.comms_prod_add_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (comm: ProductionCommunication) => {
    setPendingDeleteId(null)
    setEditingId(comm.id)
    setForm(commToForm(comm))
    setFormOpen(true)
  }

  const onMarkSent = async (comm: ProductionCommunication) => {
    const sentOn = today()
    try {
      await markCommunicationSent(comm.id, sentOn)
      setRows((prev) =>
        (prev ?? []).map((r) => (r.id === comm.id ? { ...r, status: 'sent', sentOn } : r)),
      )
      showToast(M.comms_prod_marked_sent, 'ok')
    } catch {
      showToast(M.comms_prod_mark_sent_failed, 'info')
    }
  }

  const onRemove = async (comm: ProductionCommunication) => {
    try {
      await removeCommunication(comm.id)
      setRows((prev) => (prev ?? []).filter((r) => r.id !== comm.id))
      setPendingDeleteId(null)
      showToast(M.comms_prod_removed, 'ok')
    } catch {
      showToast(M.comms_prod_remove_failed, 'info')
    }
  }

  const list = rows ?? []
  const count = list.length
  const countLabel = `${count} ${x(count === 1 ? M.comms_prod_count_one : M.comms_prod_count_many)}`

  return (
    <AppPage width="comfort">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[16px]">
        <div className="text-[13px] text-text-muted">
          {rows === null ? x(M.comms_prod_loading) : countLabel}
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(EMPTY_FORM)
              setFormOpen(true)
            }}
            className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            {x(M.comms_prod_add)}
          </button>
        )}
      </div>

      {loadFailed && (
        <div className="mb-[14px] flex items-center justify-between gap-[12px] rounded-[11px] border border-risk-border bg-risk-bg px-[16px] py-[12px]">
          <span className="text-[13px] text-risk-fg">{x(M.comms_prod_error)}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="cursor-pointer rounded-[8px] border-none bg-surface px-[12px] py-[6px] font-sans text-[12px] font-bold text-text"
          >
            {x(M.comms_prod_retry)}
          </button>
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mb-[18px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]"
        >
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="comm-title" className={labelClass}>
                {x(M.comms_prod_title)}
              </label>
              <input
                id="comm-title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="comm-audience" className={labelClass}>
                {x(M.comms_prod_audience)}
              </label>
              <input
                id="comm-audience"
                value={form.audience}
                onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="comm-channel" className={labelClass}>
                {x(M.comms_prod_channel)}
              </label>
              <select
                id="comm-channel"
                value={form.channel}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    channel: e.target.value as ProductionCommunicationChannel,
                  }))
                }
                className={inputClass}
              >
                {PRODUCTION_COMMUNICATION_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {x(CHANNEL_LABEL[c])}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="comm-status" className={labelClass}>
                {x(M.comms_prod_status)}
              </label>
              <select
                id="comm-status"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as ProductionCommunicationStatus,
                  }))
                }
                className={inputClass}
              >
                {PRODUCTION_COMMUNICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {x(STATUS_LABEL[s])}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="comm-scheduled" className={labelClass}>
                {x(M.comms_prod_scheduled_for)}
              </label>
              <input
                id="comm-scheduled"
                type="date"
                value={form.scheduledFor}
                onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="comm-template" className={labelClass}>
                {x(M.comms_prod_template)}
              </label>
              <select
                id="comm-template"
                value={form.templateTid}
                onChange={(e) => setForm((f) => ({ ...f, templateTid: e.target.value }))}
                className={inputClass}
              >
                <option value="">{x(M.comms_prod_template_none)}</option>
                {commsTemplates.map((t) => (
                  <option key={t.tid} value={t.tid}>
                    {t.name[lang]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="comm-note" className={labelClass}>
                {x(M.comms_prod_note)}
              </label>
              <input
                id="comm-note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-[16px] flex gap-[8px]">
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {x(M.comms_prod_save)}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="cursor-pointer rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
            >
              {x(M.comms_prod_cancel)}
            </button>
          </div>
        </form>
      )}

      {rows !== null && count === 0 && !loadFailed && !formOpen && (
        <ModuleEmptyBlock
          icon={Send}
          title={x(M.comms_prod_empty_title)}
          body={x(M.comms_prod_empty_body)}
        />
      )}

      {count > 0 && (
        <div className="flex flex-col gap-[12px]">
          {list.map((comm) => {
            const template = comm.templateTid ? templateByTid.get(comm.templateTid) : undefined
            return (
              <div
                key={comm.id}
                className="flex flex-col gap-[10px] rounded-[12px] border border-border bg-surface px-[18px] py-[16px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-[12px]">
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-semibold text-text">{comm.title}</div>
                    <div className="mt-[3px] text-[12px] text-text-muted">
                      {comm.audience ? `${comm.audience} · ` : ''}
                      {x(CHANNEL_LABEL[comm.channel])}
                      {comm.sentOn ? ` · ${x(M.comms_prod_sent_prefix)}${comm.sentOn}` : ''}
                      {!comm.sentOn && comm.scheduledFor
                        ? ` · ${x(M.comms_prod_scheduled_prefix)}${comm.scheduledFor}`
                        : ''}
                    </div>
                  </div>
                  <span className={statusChipClass(STATUS_TONE[comm.status])}>
                    {x(STATUS_LABEL[comm.status])}
                  </span>
                </div>

                {template && (
                  <Link
                    to={`/app/documents/generate/${template.tid}`}
                    className="flex items-center gap-[6px] text-[12px] text-accent no-underline"
                  >
                    <LinkIcon size={12} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
                    {template.name[lang]}
                  </Link>
                )}

                {comm.note && (
                  <div className="text-[12.5px] leading-normal text-text-3">{comm.note}</div>
                )}

                {pendingDeleteId === comm.id ? (
                  <div className="flex flex-wrap items-center gap-[10px] rounded-[8px] bg-inset px-[12px] py-[10px]">
                    <span className="text-[12.5px] text-text-2">
                      {x(M.comms_prod_delete_confirm)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      className="cursor-pointer rounded-[8px] border border-border bg-surface px-[12px] py-[6px] font-sans text-[12px] font-semibold text-text"
                    >
                      {x(M.comms_prod_delete_cancel)}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRemove(comm)}
                      className="cursor-pointer rounded-[8px] border-none bg-risk-dot px-[12px] py-[6px] font-sans text-[12px] font-semibold text-white"
                    >
                      {x(M.comms_prod_confirm_delete)}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-[8px]">
                    {comm.status !== 'sent' && (
                      <button
                        type="button"
                        onClick={() => void onMarkSent(comm)}
                        className="cursor-pointer rounded-[8px] border-none bg-accent-soft px-[13px] py-[7px] font-sans text-[12.5px] font-bold text-accent"
                      >
                        {x(M.comms_prod_mark_sent)}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(comm)}
                      aria-label={`${x(M.comms_prod_edit)} — ${comm.title}`}
                      className="flex cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-surface px-[10px] py-[6px] font-sans text-[12px] font-semibold text-text-2"
                    >
                      <Pencil size={13} strokeWidth={1.7} aria-hidden="true" />
                      {x(M.comms_prod_edit)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(comm.id)}
                      aria-label={`${x(M.comms_prod_remove)} — ${comm.title}`}
                      className="cursor-pointer border-none bg-transparent p-[6px] text-text-muted hover:text-risk-fg"
                    >
                      <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-[14px] text-[11px] leading-normal text-text-faint">
        {x(M.comms_prod_record_note)}
      </div>

      <details className="group mt-[18px] rounded-[12px] border border-border bg-inset opacity-70">
        <summary className="flex cursor-not-allowed list-none items-center gap-[8px] px-[16px] py-[12px] font-sans text-[13px] font-semibold text-text-muted [&::-webkit-details-marker]:hidden">
          <Sparkle
            size={14}
            className="shrink-0 text-text-faint"
            strokeWidth={1.7}
            aria-hidden="true"
          />
          {x(M.comms_prod_review_rail_title)}
        </summary>
        <p className="m-0 border-t border-border px-[16px] py-[12px] text-[12px] leading-normal text-text-faint">
          {x(M.comms_prod_review_rail_body)}
        </p>
      </details>
    </AppPage>
  )
}
