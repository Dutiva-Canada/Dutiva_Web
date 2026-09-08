import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Calendar,
  Check,
  Clock,
  FileUp,
  Pause,
  Play,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react'
import { MarkdownBody, MarkdownToolbar } from '@/components/MarkdownEditor'
import { statusChipClass } from '@/components/chips'
import type { Bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useContentItems } from '../data/useContentItems'
import { useExecutionEvents } from '../data/useExecutionEvents'
import { useInitiatives } from '../data/useInitiatives'
import { createContentBulkImportAdapter } from '../bulkImport/contentAdapter'
import { BulkImportWizard } from '@/features/app/bulkImport/BulkImportWizard'
import type {
  CommsChannel,
  CommsContentItem,
  CommsContentStatus,
  CommsExecutionAction,
  CommsExecutionEvent,
} from '../data/types'
import {
  ACTION_LABEL,
  CHANNEL_LABEL,
  CONTENT_STATUS_LABEL,
  DELIVERY_STATUS_LABEL,
} from '../commsLabels'

const CHANNELS: CommsChannel[] = [
  'email',
  'intranet',
  'social_linkedin',
  'social_x',
  'press_release',
  'website',
  'newsletter',
  'meeting',
  'other',
]
const STATUSES: CommsContentStatus[] = [
  'draft',
  'in_review',
  'changes_requested',
  'approved',
  'superseded',
  'withdrawn',
  'rejected',
]
const TIME_ZONES = [
  'America/Vancouver',
  'America/Edmonton',
  'America/Winnipeg',
  'America/Toronto',
  'America/Halifax',
  'America/St_Johns',
  'UTC',
]

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

function deliveryTone(status: CommsContentItem['deliveryStatus']) {
  switch (status) {
    case 'confirmed':
      return 'success'
    case 'failed':
    case 'cancelled':
      return 'risk'
    case 'paused':
    case 'unknown':
      return 'warning'
    case 'scheduled':
    case 'sending':
      return 'info'
    default:
      return 'neutral'
  }
}

function formatTimestamp(iso: string, lang: 'en' | 'fr'): string {
  try {
    return new Date(iso).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function ExecutionLog({ events, lang }: { events: CommsExecutionEvent[]; lang: 'en' | 'fr' }) {
  const { x } = useI18n()
  const sorted = useMemo(
    () => [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [events],
  )
  if (sorted.length === 0) {
    return <p className="text-[13px] text-text-muted">{x(M.comms_execution_empty)}</p>
  }
  return (
    <div className="flex flex-col gap-[8px]">
      {sorted.slice(0, 20).map((event) => (
        <div key={event.id} className="flex flex-col gap-[2px] rounded-[8px] border border-border bg-inset p-[10px]">
          <div className="flex flex-wrap items-center gap-[8px] text-[12.5px] text-text">
            <span className="font-semibold">{x(ACTION_LABEL[event.action])}</span>
            {event.previousStatus && event.newStatus && (
              <span className="text-text-muted">
                {x(DELIVERY_STATUS_LABEL[event.previousStatus])} → {x(DELIVERY_STATUS_LABEL[event.newStatus])}
              </span>
            )}
          </div>
          <div className="text-[11px] text-text-muted">
            {event.actor} · {formatTimestamp(event.timestamp, lang)}
          </div>
          {event.note && <div className="text-[12px] text-text-2">{x(event.note)}</div>}
        </div>
      ))}
    </div>
  )
}

function ScheduleForm({
  item,
  onSchedule,
  onCancel,
}: {
  item: CommsContentItem
  onSchedule: (scheduledFor: string, timeZone: string) => Promise<void>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const [dateTime, setDateTime] = useState(
    item.scheduledFor ? item.scheduledFor.slice(0, 16) : '',
  )
  const [timeZone, setTimeZone] = useState(item.timeZone ?? 'America/Toronto')
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!dateTime) return
        await onSchedule(`${dateTime}:00`, timeZone)
      }}
      className="mt-[8px] flex flex-wrap items-end gap-[8px] rounded-[8px] border border-border bg-inset p-[10px]"
    >
      <div className="flex-1 min-w-[180px]">
        <label className={labelClass}>{x(M.comms_content_schedule_date)}</label>
        <input
          type="datetime-local"
          required
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="w-[180px]">
        <label className={labelClass}>{x(M.comms_content_time_zone)}</label>
        <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className={inputClass}>
          {TIME_ZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-[6px]">
        <button type="submit" className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] font-sans text-[11.5px] font-semibold text-text hover:bg-inset">
          {x(M.comms_content_schedule)}
        </button>
        <button type="button" onClick={onCancel} className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] font-sans text-[11.5px] font-semibold text-text hover:bg-inset">
          {x(M.comms_cancel)}
        </button>
      </div>
    </form>
  )
}

function DeliveryActions({ item }: { item: CommsContentItem }) {
  const { x } = useI18n()
  const { canWrite, transitionDeliveryStatus, updateContentItem } = useContentItems()
  const [scheduling, setScheduling] = useState(false)

  if (!canWrite) return null

  const doAction = (action: CommsExecutionAction) => {
    transitionDeliveryStatus(item.id, action)
  }

  const isApproved = item.status === 'approved'
  const buttons: { action: CommsExecutionAction; label: Bi; icon?: ReactNode }[] = []

  if (isApproved && (item.deliveryStatus === 'not_queued' || item.deliveryStatus === 'ready' || item.deliveryStatus === 'paused')) {
    buttons.push({ action: 'schedule', label: M.comms_content_schedule, icon: <Calendar size={12} /> })
  }
  if (item.deliveryStatus === 'scheduled') {
    buttons.push({ action: 'unschedule', label: M.comms_content_unschedule })
    buttons.push({ action: 'mark_sent', label: M.comms_content_mark_sent, icon: <Check size={12} /> })
    buttons.push({ action: 'mark_failed', label: M.comms_content_mark_failed, icon: <X size={12} /> })
    buttons.push({ action: 'cancel', label: M.comms_content_cancel, icon: <X size={12} /> })
  }
  if (item.deliveryStatus === 'ready' || item.deliveryStatus === 'sending' || item.deliveryStatus === 'paused') {
    if (item.deliveryStatus !== 'paused') {
      buttons.push({ action: 'pause', label: M.comms_content_pause, icon: <Pause size={12} /> })
    }
  }
  if (item.deliveryStatus === 'paused') {
    buttons.push({ action: 'resume', label: M.comms_content_resume, icon: <Play size={12} /> })
    buttons.push({ action: 'cancel', label: M.comms_content_cancel, icon: <X size={12} /> })
  }
  if (isApproved && (item.deliveryStatus === 'ready' || item.deliveryStatus === 'sending' || item.deliveryStatus === 'paused')) {
    buttons.push({ action: 'mark_sent', label: M.comms_content_mark_sent, icon: <Check size={12} /> })
  }
  if (item.deliveryStatus === 'failed' || item.deliveryStatus === 'unknown') {
    buttons.push({ action: 'retry', label: M.comms_content_retry, icon: <RefreshCw size={12} /> })
  }
  if (item.deliveryStatus === 'unknown') {
    buttons.push({ action: 'reconcile', label: M.comms_content_reconcile, icon: <Check size={12} /> })
  }

  return (
    <div className="mt-[8px] flex flex-col gap-[8px]">
      <div className="flex flex-wrap items-center gap-[6px]">
        {buttons.map(({ action, label, icon }) => (
          <button
            key={action}
            type="button"
            onClick={() => {
              if (action === 'schedule') {
                setScheduling(true)
              } else {
                doAction(action)
              }
            }}
            className="flex items-center gap-[4px] rounded-[6px] border border-border bg-surface px-[8px] py-[4px] font-sans text-[11.5px] font-semibold text-text hover:bg-inset"
          >
            {icon}
            {x(label)}
          </button>
        ))}
      </div>
      {scheduling && (
        <ScheduleForm
          item={item}
          onSchedule={async (scheduledFor, timeZone) => {
            await updateContentItem(item.id, { scheduledFor, timeZone })
            await transitionDeliveryStatus(item.id, 'schedule')
            setScheduling(false)
          }}
          onCancel={() => setScheduling(false)}
        />
      )}
    </div>
  )
}

const toolbarMessages = {
  bold: M.comms_format_bold,
  italic: M.comms_format_italic,
  heading: M.comms_format_heading,
  bulletList: M.comms_format_bullet_list,
  numberedList: M.comms_format_numbered_list,
  link: M.comms_format_link,
  hint: M.comms_content_body_hint,
}

export function ContentCalendar() {
  const { x, lang } = useI18n()
  const { executionEvents } = useExecutionEvents()
  const {
    contentItems,
    canWrite,
    addContentItem,
    updateContentItem,
    removeContentItem,
  } = useContentItems()
  const { initiatives } = useInitiatives()
  const [open, setOpen] = useState(false)
  const [bulkImport, setBulkImport] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initiativeId, setInitiativeId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<'en' | 'fr' | 'bilingual'>('en')
  const [channel, setChannel] = useState<CommsChannel>('email')
  const [status, setStatus] = useState<CommsContentStatus>('draft')
  const [dueDate, setDueDate] = useState('')
  const [owner, setOwner] = useState('')
  const [body, setBody] = useState('')
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const reset = () => {
    setOpen(false)
    setEditingId(null)
    setInitiativeId(initiatives[0]?.id ?? '')
    setTitle('')
    setLanguage('en')
    setChannel('email')
    setStatus('draft')
    setDueDate('')
    setOwner('')
    setBody('')
  }

  const startEdit = (item: CommsContentItem) => {
    setEditingId(item.id)
    setInitiativeId(item.initiativeId)
    setTitle(item.title[lang])
    setLanguage(item.language)
    setChannel(item.channel)
    setStatus(item.status)
    setDueDate(item.dueDate ?? '')
    setOwner(item.owner)
    setBody(item.body?.[lang] ?? '')
    setOpen(true)
  }

  const bodyBi = (text: string, itemLanguage: typeof language): Bi => {
    if (itemLanguage === 'en') return { en: text, fr: text ? `[FR review] ${text}` : '' }
    if (itemLanguage === 'fr') return { en: text ? `[EN review] ${text}` : '', fr: text }
    return { en: text, fr: text }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const base = {
      initiativeId,
      title: { en: title, fr: title ? `[FR] ${title}` : '' },
      language,
      channel,
      status,
      deliveryStatus: 'not_queued' as const,
      owner,
      body: bodyBi(body, language),
      dueDate: dueDate || undefined,
    }
    if (editingId) {
      const existing = contentItems.find((c) => c.id === editingId)
      if (existing) {
        const needsTranslationReview =
          language === 'en' && existing.language === 'fr'
            ? true
            : existing.needsTranslationReview
        await updateContentItem(editingId, {
          ...base,
          title:
            existing.title.en !== title
              ? { en: title, fr: title ? `[FR review] ${title}` : '' }
              : existing.title,
          needsTranslationReview,
        })
      }
    } else {
      await addContentItem(base)
    }
    reset()
  }

  const sorted = useMemo(
    () =>
      [...contentItems].sort(
        (a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
      ),
    [contentItems],
  )

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center justify-between gap-[12px]">
        <h2 className="text-[18px] font-semibold text-text">{x(M.comms_content_title)}</h2>
        {canWrite && !open && (
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={() => {
                reset()
                setInitiativeId(initiatives[0]?.id ?? '')
                setOpen(true)
              }}
              className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
            >
              <Plus size={14} aria-hidden="true" />
              {x(M.comms_content_add)}
            </button>
            <button
              type="button"
              onClick={() => setBulkImport(true)}
              className="flex items-center gap-[6px] rounded-[8px] border border-border bg-surface px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-text"
            >
              <FileUp size={14} aria-hidden="true" />
              {x(M.comms_import)}
            </button>
          </div>
        )}
      </div>

      {open && (
        <form onSubmit={onSubmit} className="rounded-[12px] border border-border bg-surface p-[16px]">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_content_item)}</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_initiatives_name)}</label>
              <select value={initiativeId} onChange={(e) => setInitiativeId(e.target.value)} className={inputClass}>
                {initiatives.map((i) => (
                  <option key={i.id} value={i.id}>{x(i.title)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_content_language)}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'fr' | 'bilingual')}
                className={inputClass}
              >
                <option value="en">{x(M.comms_language_en)}</option>
                <option value="fr">{x(M.comms_language_fr)}</option>
                <option value="bilingual">{x(M.comms_language_bilingual)}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_content_channel)}</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value as CommsChannel)} className={inputClass}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{x(CHANNEL_LABEL[c])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_content_status)}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as CommsContentStatus)} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{x(CONTENT_STATUS_LABEL[s])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_content_due)}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_content_owner)}</label>
              <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_content_body)}</label>
              <MarkdownToolbar value={body} textareaRef={bodyRef} setValue={setBody} messages={toolbarMessages} />
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
          <div className="mt-[14px] flex gap-[8px]">
            <button type="submit" className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white">
              {x(editingId ? M.comms_save : M.comms_create)}
            </button>
            <button type="button" onClick={reset} className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text">
              {x(M.comms_cancel)}
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.comms_content_empty)}</p>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {sorted.map((item) => {
            const statusTone =
              item.status === 'approved'
                ? 'success'
                : item.status === 'rejected'
                  ? 'risk'
                  : item.status === 'in_review' || item.status === 'changes_requested'
                    ? 'warning'
                    : 'neutral'
            const initiative = initiatives.find((i) => i.id === item.initiativeId)
            const isInitiativePaused = initiative?.status === 'paused'
            return (
              <div key={item.id} className="rounded-[12px] border border-border bg-surface p-[16px]">
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div>
                    <div className="text-[14px] font-semibold text-text">{x(item.title)}</div>
                    <div className="text-[12px] text-text-muted">
                      {initiative ? x(initiative.title) : item.initiativeId} · {x(CHANNEL_LABEL[item.channel])} · {x(M[`comms_language_${item.language}` as keyof typeof M])} · {item.dueDate ? `${x(M.comms_content_due)} ${item.dueDate}` : x(M.comms_none)}
                    </div>
                  </div>
                  <span className={statusChipClass(statusTone)}>{x(CONTENT_STATUS_LABEL[item.status])}</span>
                </div>
                {item.needsTranslationReview && (
                  <div className="mt-[8px] text-[12px] text-gold-fg">{x(M.comms_needs_translation_review)}</div>
                )}
                {item.scheduledFor && (
                  <div className="mt-[8px] flex items-center gap-[4px] text-[12px] text-text-2">
                    <Clock size={12} aria-hidden="true" />
                    {formatTimestamp(item.scheduledFor, lang)} {item.timeZone ? `(${item.timeZone})` : ''}
                  </div>
                )}
                <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
                  <span className={statusChipClass(deliveryTone(item.deliveryStatus))}>
                    {x(DELIVERY_STATUS_LABEL[item.deliveryStatus])}
                  </span>
                  {canWrite && !isInitiativePaused && (
                    <>
                      <button type="button" onClick={() => startEdit(item)} className="text-[12px] font-semibold text-accent">
                        {x(M.comms_edit)}
                      </button>
                      <button type="button" onClick={() => removeContentItem(item.id)} className="text-[12px] font-semibold text-risk-fg">
                        {x(M.comms_remove)}
                      </button>
                    </>
                  )}
                </div>
                {isInitiativePaused && (
                  <div className="mt-[8px] text-[12px] text-gold-fg">{x(M.comms_initiative_paused_notice)}</div>
                )}
                {!isInitiativePaused && <DeliveryActions item={item} />}
                {item.body && (
                  <div className="mt-[10px] text-[13px] leading-relaxed text-text-2">
                    <MarkdownBody>{x(item.body)}</MarkdownBody>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h3 className="mb-[10px] text-[14px] font-semibold text-text">{x(M.comms_execution_log)}</h3>
        <ExecutionLog events={executionEvents} lang={lang} />
      </div>

      <p className="text-[11px] leading-normal text-text-faint">{x(M.comms_delivery_note)}</p>

      {bulkImport && (
        <BulkImportWizard
          adapter={createContentBulkImportAdapter(lang, addContentItem, initiatives)}
          onClose={() => setBulkImport(false)}
        />
      )}
    </div>
  )
}
