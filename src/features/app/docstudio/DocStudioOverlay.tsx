import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Check, ChevronDown, PenTool, Sparkle, TriangleAlert, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Disclaimer } from '@/components/Disclaimer'
import { pickL } from '@/i18n/core'
import { useEscapeToClose } from '@/lib/escapeStack'
import { docstudioMessages as M } from '@/i18n/messages/docstudio'
import { PlanGate } from '@/features/app/billing/PlanGate'
import { useDocStudio } from './docStudioContext'

const chipBase =
  'inline-flex whitespace-nowrap rounded-full px-[10px] py-[3px] text-[12px] font-semibold'

/**
 * Document Studio overlay — right-hand drawer with the AI draft preview,
 * per-section editing, document details, high-risk review gate, and export /
 * e-signature actions. Markup transcribed from the App v2 prototype's
 * `docStudioView` block. Renders nothing while closed.
 */
export function DocStudioOverlay() {
  const {
    studio,
    closeDocStudio,
    toggleEditAll,
    updateSection,
    applyRevision,
    exportDoc,
    sendForSignature,
    confirmGate,
    cancelGate,
    requestLegalReview,
    toggleMeta,
  } = useDocStudio()
  const { x, lang } = useI18n()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const gateRef = useRef<HTMLDivElement>(null)

  const { open } = studio
  const gateOpen = studio.gate !== null

  /* Focus the dialog when it opens (the provider restores focus on close). */
  useEffect(() => {
    if (open) dialogRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (gateOpen) gateRef.current?.focus()
  }, [gateOpen])

  const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  /* Prototype keydown handling: Escape cancels the gate first, then closes.
     Registered on the shared stack so overlays opened on top (e.g. search)
     receive Escape first. */
  useEscapeToClose(open, () => {
    if (gateOpen) cancelGate()
    else closeDocStudio()
  })

  if (!open) return null

  const { meta } = studio
  const showSections = !studio.editingAll && !studio.generating
  const showEditors = studio.editingAll && !studio.generating

  /* Prototype `buildDocStudioView()` metaRows. */
  const metaRows: { key: string; value: string }[] = [
    { key: x(M.docstudio_meta_linked), value: x(meta.link) },
    { key: x(M.docstudio_meta_jur), value: x(meta.jur) },
    { key: x(M.docstudio_meta_governing), value: x(meta.governing) },
    { key: x(M.docstudio_meta_template), value: meta.template },
    { key: x(M.docstudio_meta_created), value: `${x(meta.created)} · ${x(meta.createdBy)}` },
    {
      key: x(M.docstudio_meta_modified),
      value: studio.lastModified ? x(M.docstudio_just_now) : x(meta.created),
    },
    { key: x(M.docstudio_meta_reviewed), value: x(meta.reviewedBy) },
    { key: x(M.docstudio_meta_legal), value: x(meta.legalReview) },
    { key: x(M.docstudio_meta_retention), value: x(meta.retention) },
    {
      key: x(M.docstudio_meta_export),
      value: studio.exportStatus
        ? x(M.docstudio_exported_as) + studio.exportStatus
        : x(M.docstudio_not_exported),
    },
    {
      key: x(M.docstudio_meta_signature),
      value: studio.signatureSent
        ? x(M.docstudio_signature_sent)
        : x(M.docstudio_signature_not_sent),
    },
  ]

  return (
    <>
      <button
        type="button"
        onClick={closeDocStudio}
        aria-label={x(M.docstudio_close_aria)}
        className="fixed inset-0 z-300 cursor-default border-none bg-overlay-scrim-mid"
      />
      <dialog
        ref={dialogRef}
        open
        aria-modal="true"
        aria-label={x(M.docstudio_dialog_aria)}
        onKeyDown={trapFocus}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-310 m-0 flex w-[min(560px,100%)] animate-[slideInRight_0.22s_ease] flex-col bg-surface font-sans shadow-[-20px_0_50px_rgba(0,0,0,0.2)]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-5.5 py-4.5">
          <div className="min-w-0">
            <div className="text-[11px] font-bold tracking-[.04em] text-gold-dot uppercase">
              {x(studio.category)} · {x(M.docstudio_ai_draft)}
            </div>
            <div className="truncate font-display text-[19px] font-semibold text-text">
              {x(studio.title)}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleEditAll}
              className="cursor-pointer rounded-lg bg-accent-soft px-3.25 py-2 font-sans text-[12.5px] font-bold text-accent"
            >
              {studio.editingAll ? x(M.docstudio_done_editing) : x(M.docstudio_edit_draft)}
            </button>
            <button
              type="button"
              onClick={closeDocStudio}
              aria-label={x(M.docstudio_close_aria)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[9px] bg-inset"
            >
              <X size={15} strokeWidth={2} className="text-text-3" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* AI revision note */}
        {studio.aiNote && (
          <div className="mx-5.5 mt-3.5 flex shrink-0 items-center gap-1.75 rounded-[9px] border border-gold-border bg-gold-bg px-3.25 py-2.25 text-[12.5px] font-semibold text-gold-fg">
            <Sparkle
              size={14}
              fill="currentColor"
              strokeWidth={1.7}
              className="shrink-0"
              aria-hidden="true"
            />
            <span>{x(studio.aiNote)}</span>
          </div>
        )}

        {/* Risk chip · jurisdiction · document details */}
        <div className="mx-5.5 mt-3.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`${chipBase} ${studio.highRisk ? 'bg-risk-bg text-risk-fg' : 'bg-accent-soft text-accent'}`}
            >
              {x(studio.highRisk ? M.docstudio_chip_high_risk : M.docstudio_chip_standard)}
            </span>
            <span className="text-[11.5px] text-text-muted">
              {x(meta.jur)} · {meta.template}
            </span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={toggleMeta}
              aria-controls="docstudio-details"
              aria-expanded={studio.metaOpen}
              className="flex cursor-pointer items-center gap-1.25 px-0.5 py-1 font-sans text-[12px] font-semibold text-accent"
            >
              {x(studio.metaOpen ? M.docstudio_meta_hide : M.docstudio_meta_show)}
              <ChevronDown size={12} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
          {studio.metaOpen && (
            <div
              id="docstudio-details"
              className="mt-2.5 max-h-70 overflow-y-auto rounded-[10px] border border-border-soft bg-surface-2 px-4 py-1.5"
            >
              {metaRows.map((row) => (
                <div key={row.key} className="flex gap-3 border-b border-inset py-2">
                  <span className="flex-[0_0_150px] text-[12px] font-semibold text-text-muted">
                    {row.key}
                  </span>
                  <span className="text-[12.5px] leading-normal text-text-2">{row.value}</span>
                </div>
              ))}
              <div className="flex flex-col gap-2 pt-2.5 pb-3">
                <div className="rounded-lg border border-(--accent-soft-border) bg-accent-soft px-3 py-2.25 text-[12px] leading-normal text-text-2">
                  <span className="font-bold text-accent">{x(M.docstudio_assumptions)} · </span>
                  {x(meta.assumptions)}
                </div>
                <div className="rounded-lg border border-gold-border bg-gold-bg px-3 py-2.25 text-[12px] leading-normal text-gold-fg">
                  <span className="font-bold">{x(M.docstudio_missing)} · </span>
                  {x(meta.missing)}
                </div>
                <div className="text-[10.5px] text-text-faint">{x(M.docstudio_audit_note)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Document preview */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5.5 py-5">
          <div className="flex flex-col gap-4.5 rounded-[10px] border border-border-soft bg-surface-2 px-7 py-6.5">
            {studio.generating && (
              <output className="flex flex-col gap-3" aria-label={x(M.docstudio_generating_aria)}>
                <div className="text-[12px] font-semibold text-text-muted">
                  {x(M.docstudio_generating)}
                </div>
                <div className="h-3 w-[40%] rounded-md bg-inset" />
                <div className="h-3 w-full rounded-md bg-inset" />
                <div className="h-3 w-[92%] rounded-md bg-inset" />
                <div className="h-3 w-[78%] rounded-md bg-inset" />
                <div className="h-3 w-[55%] rounded-md bg-inset" />
              </output>
            )}
            {showSections &&
              studio.sections.map((section) => (
                <div
                  key={pickL(section, 'en')}
                  className="font-display text-[14.5px] leading-[1.75] whitespace-pre-wrap text-text"
                >
                  {pickL(section, lang)}
                </div>
              ))}
            {showEditors &&
              studio.sections.map((section, idx) => (
                <textarea
                  key={pickL(section, 'en')}
                  value={pickL(section, lang)}
                  onChange={(e) => updateSection(idx, e.target.value)}
                  aria-label={`${x(M.docstudio_section_edit_aria)} ${idx + 1}`}
                  className="min-h-22.5 w-full resize-y rounded-lg border border-(--accent-soft-border) p-2.5 font-sans text-[14px] leading-[1.65] text-text"
                />
              ))}
          </div>
        </div>

        {/* Footer — revise chips, disclaimer, gate, export & signature */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-border-soft px-5.5 pt-4 pb-5">
          {!gateOpen && (
            <div>
              <div className="mb-2 text-[11px] font-bold tracking-[.04em] text-text-muted uppercase">
                {x(M.docstudio_revise_label)}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyRevision('formal')}
                  className="cursor-pointer rounded-full border border-(--accent-soft-border) bg-accent-soft px-3.25 py-1.75 font-sans text-[12.5px] font-semibold text-accent"
                >
                  {x(M.docstudio_revise_formal)}
                </button>
                <button
                  type="button"
                  onClick={() => applyRevision('shorten')}
                  className="cursor-pointer rounded-full border border-(--accent-soft-border) bg-accent-soft px-3.25 py-1.75 font-sans text-[12.5px] font-semibold text-accent"
                >
                  {x(M.docstudio_revise_shorten)}
                </button>
                <button
                  type="button"
                  onClick={() => applyRevision('compassionate')}
                  className="cursor-pointer rounded-full border border-(--accent-soft-border) bg-accent-soft px-3.25 py-1.75 font-sans text-[12.5px] font-semibold text-accent"
                >
                  {x(M.docstudio_revise_compassionate)}
                </button>
              </div>
            </div>
          )}

          <Disclaimer variant="block" />

          {gateOpen && (
            <div
              ref={gateRef}
              role="alertdialog"
              aria-label={x(M.docstudio_gate_title)}
              tabIndex={-1}
              className="rounded-[10px] border border-gold-border bg-gold-bg px-4 py-3.5"
            >
              <div className="flex items-start gap-2">
                <TriangleAlert
                  size={15}
                  strokeWidth={1.8}
                  className="mt-px shrink-0 text-gold-fg"
                  aria-hidden="true"
                />
                <div>
                  <div className="text-[13px] font-bold text-gold-fg">
                    {x(M.docstudio_gate_title)}
                  </div>
                  <div className="mt-1 text-[12.5px] leading-[1.55] text-gold-fg opacity-90">
                    {x(M.docstudio_gate_body)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={confirmGate}
                  className="cursor-pointer rounded-[9px] bg-navy px-3.5 py-2.25 font-sans text-[12.5px] font-bold text-white"
                >
                  {x(M.docstudio_gate_confirm)}
                </button>
                <button
                  type="button"
                  onClick={cancelGate}
                  className="cursor-pointer rounded-[9px] border border-border bg-surface px-3.5 py-2.25 font-sans text-[12.5px] font-semibold text-text"
                >
                  {x(M.docstudio_gate_cancel)}
                </button>
                <button
                  type="button"
                  onClick={requestLegalReview}
                  className="cursor-pointer px-1.5 py-2.25 font-sans text-[12.5px] font-semibold text-gold-fg underline"
                >
                  {x(M.docstudio_gate_legal)}
                </button>
              </div>
            </div>
          )}

          {!gateOpen && (
            <>
              <PlanGate required="growth">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => exportDoc('PDF')}
                    className="flex-1 cursor-pointer rounded-[9px] bg-navy p-2.5 font-sans text-[13.5px] font-bold text-white"
                  >
                    {x(M.docstudio_export_pdf)}
                  </button>
                  <button
                    type="button"
                    onClick={() => exportDoc('Word')}
                    className="flex-1 cursor-pointer rounded-[9px] border border-border bg-surface p-2.5 font-sans text-[13.5px] font-semibold text-text"
                  >
                    {x(M.docstudio_export_word)}
                  </button>
                  <button
                    type="button"
                    onClick={() => exportDoc('link')}
                    className="cursor-pointer rounded-[9px] border border-border bg-surface px-3.5 py-2.5 font-sans text-[13.5px] font-semibold text-text"
                  >
                    {x(M.docstudio_copy_link)}
                  </button>
                </div>
              </PlanGate>
              {studio.signatureSent ? (
                <output className="flex items-center gap-2 rounded-[9px] border border-ok-border bg-ok-bg px-3.25 py-2.5 text-[12.5px] font-semibold text-ok-fg">
                  <Check size={15} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                  <span>{x(M.docstudio_esign_pending)}</span>
                </output>
              ) : (
                <button
                  type="button"
                  onClick={sendForSignature}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-gold-border bg-gold-bg p-2.75 font-sans text-[13.5px] font-bold text-gold-fg"
                >
                  <PenTool size={15} strokeWidth={1.8} aria-hidden="true" />
                  {x(M.docstudio_esign_send)}
                </button>
              )}
            </>
          )}
        </div>
      </dialog>
    </>
  )
}
