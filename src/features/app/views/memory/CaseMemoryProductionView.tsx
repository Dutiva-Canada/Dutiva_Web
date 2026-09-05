import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useWorkspaceNavigate, useWorkspaceRoot, workspacePath } from '@/features/app/workspaceRoot/workspaceRootContext'
import { Briefcase, History, Info, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { Disclaimer } from '@/components/Disclaimer'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceContext } from '@/features/app/workspaceContext/workspaceContextStore'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { getCase, listCaseNotes } from '@/features/app/views/cases/productionApi'
import type { ProductionCase } from '@/features/app/views/cases/productionApi'
import type { MemoryFact } from '@/data'
import { MemoryFactRow } from './MemoryFactRow'
import {
  getCaseNarrative,
  listCaseTimeline,
  relativeAgo,
  timelineFromNotes,
  upsertCaseNarrative,
} from './caseNarrativeApi'
import type { BiLine, CaseNarrative, CaseTimelineEvent } from './caseNarrativeApi'
import { confirmFact, correctFact, forgetFact, listFactsByEntity } from './productionApi'

/**
 * Case memory in production — governed facts plus persisted resume summary
 * and timeline (migration 0087). When no narrative/timeline rows exist yet,
 * a synthetic timeline is built from case opened + case notes.
 */

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function CaseMemoryProductionView() {
  const { x, lang } = useI18n()
  const navigate = useWorkspaceNavigate()
  const { root } = useWorkspaceRoot()
  const { caseId } = useParams()
  const { showToast } = useToasts()
  const { organizationId, isOrgAdmin } = useWorkspaceMode()
  const { setContext } = useWorkspaceContext()

  const [caseRow, setCaseRow] = useState<ProductionCase | null | undefined>(undefined)
  const [facts, setFacts] = useState<MemoryFact[] | null>(null)
  const [narrative, setNarrative] = useState<CaseNarrative | null>(null)
  const [timeline, setTimeline] = useState<CaseTimelineEvent[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    summaryEn: '',
    summaryFr: '',
    resumeSinceEn: '',
    resumeSinceFr: '',
    changedText: '',
    nextStepsText: '',
  })

  const load = useCallback(async () => {
    if (!organizationId || !caseId) return
    setLoadFailed(false)
    try {
      const [c, factRows, narr, events, notes] = await Promise.all([
        getCase(caseId),
        listFactsByEntity(organizationId, 'case', caseId),
        getCaseNarrative(organizationId, caseId),
        listCaseTimeline(organizationId, caseId),
        listCaseNotes(caseId).catch(() => []),
      ])
      setCaseRow(c)
      setFacts(factRows)
      setNarrative(narr)
      if (events.length > 0) {
        setTimeline(events)
      } else if (c) {
        setTimeline(timelineFromNotes(caseId, notes, c.createdAt))
      } else {
        setTimeline([])
      }
      if (narr) {
        setForm({
          summaryEn: narr.summary.en,
          summaryFr: narr.summary.fr,
          resumeSinceEn: narr.resumeSince.en,
          resumeSinceFr: narr.resumeSince.fr,
          changedText: narr.changed.map((l) => l.en).join('\n'),
          nextStepsText: narr.nextSteps.map((l) => l.en).join('\n'),
        })
      }
    } catch {
      setCaseRow(null)
      setFacts([])
      setNarrative(null)
      setTimeline([])
      setLoadFailed(true)
    }
  }, [organizationId, caseId])

  useEffect(() => {
    void load()
  }, [load])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.memory_prod_empty_title)} />
  }
  if (!caseId) return <Navigate to={workspacePath(root, 'settings/memory')} replace />
  if (caseRow === undefined || facts === null) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-[28px] pt-[28px] text-[13px] text-text-faint">
        …
      </div>
    )
  }
  if (caseRow === null) return <Navigate to={workspacePath(root, 'settings/memory')} replace />

  const onConfirm = async (id: string) => {
    try {
      const updated = await confirmFact(organizationId, id)
      setFacts((prev) => (prev ?? []).map((f) => (f.id === id ? updated : f)))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }
  const onCorrect = async (id: string, statement: string) => {
    try {
      const updated = await correctFact(organizationId, id, statement)
      setFacts((prev) => (prev ?? []).map((f) => (f.id === id ? updated : f)))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }
  const onForget = async (id: string) => {
    try {
      await forgetFact(organizationId, id)
      setFacts((prev) => (prev ?? []).filter((f) => f.id !== id))
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    }
  }

  const linesToBi = (text: string): BiLine[] =>
    text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => ({ en: l, fr: l }))

  const onSaveNarrative = async (e: SubmitEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const saved = await upsertCaseNarrative(organizationId, caseId, {
        summaryEn: form.summaryEn,
        summaryFr: form.summaryFr,
        resumeSinceEn: form.resumeSinceEn,
        resumeSinceFr: form.resumeSinceFr,
        changed: linesToBi(form.changedText),
        nextSteps: linesToBi(form.nextStepsText),
      })
      setNarrative(saved)
      setEditing(false)
      showToast(M.memory_prod_narrative_saved, 'ok')
    } catch {
      showToast(M.memory_prod_action_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const activityAt = narrative?.lastActivityAt ?? caseRow.createdAt
  const lastLabel = new Date(activityAt).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-[16px] pt-[24px] pb-[40px] md:px-[28px]">
        {loadFailed && (
          <div className="mb-[14px] rounded-[10px] border border-risk-border bg-surface px-[14px] py-[10px] text-[13px] text-risk-dot">
            {x(M.memory_prod_load_failed)}
          </div>
        )}

        <div className="mb-[16px] flex flex-wrap items-start gap-[14px]">
          <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-gold-bg text-gold-fg">
            <Briefcase size={16} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <div className="min-w-[220px] flex-1">
            <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
              {caseRow.title}
            </h1>
            <div className="mt-[4px] text-[12.5px] text-text-faint">
              {caseRow.caseType} · {caseRow.status} · {caseRow.jurisdiction}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/app/cases/${caseRow.id}`)}
            className="cursor-pointer rounded-[9px] border border-border bg-surface px-[12px] py-[8px] font-sans text-[12.5px] font-semibold text-text-2"
          >
            {x(M.memory_case_view_history)}
          </button>
        </div>

        {/* Resume banner */}
        <div className="mb-[18px] flex items-start gap-[12px] rounded-[14px] border border-gold-border bg-gold-bg px-[17px] py-[15px]">
          <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[9px] bg-navy text-gold-on-navy">
            <History size={14} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-[2px] text-[14.5px] font-bold text-text">
              {x(M.memory_case_resume_title)}
            </div>
            <div className="text-[13px] leading-[1.55] text-text-muted">
              {x(M.memory_case_resume_last)} <strong className="text-text">{lastLabel}</strong>,{' '}
              {relativeAgo(activityAt, lang)}.
              {narrative && (narrative.resumeSince.en || narrative.resumeSince.fr) ? (
                <>
                  {' '}
                  {x(M.memory_case_resume_since)} {pick(narrative.resumeSince, lang)}
                </>
              ) : null}
            </div>
            <div className="mt-[11px] flex flex-wrap gap-[8px]">
              <button
                type="button"
                onClick={() => {
                  const parts = caseRow.title.split(/\s+/).filter(Boolean)
                  const initials = parts
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  setContext({
                    subject: caseRow.title,
                    entityType: 'case',
                    empId: caseRow.employeeId ?? undefined,
                    initials: initials || 'C',
                    meta: [
                      { en: caseRow.caseType, fr: caseRow.caseType },
                      { en: caseRow.jurisdiction, fr: caseRow.jurisdiction },
                    ],
                  })
                  navigate('/app/advisor')
                }}
                className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border-none bg-navy px-[13px] py-[8px] font-sans text-[12.5px] font-bold text-white"
              >
                <Sparkle
                  size={14}
                  className="fill-gold-on-navy"
                  strokeWidth={0}
                  aria-hidden="true"
                />
                {x(M.memory_case_resume_chat)}
              </button>
              {isOrgAdmin && (
                <button
                  type="button"
                  onClick={() => setEditing((o) => !o)}
                  className="cursor-pointer rounded-[8px] border border-border bg-surface px-[13px] py-[8px] font-sans text-[12.5px] font-semibold text-text-2"
                >
                  {x(M.memory_prod_edit_narrative)}
                </button>
              )}
            </div>
          </div>
        </div>

        {editing && isOrgAdmin && (
          <form
            onSubmit={(e) => void onSaveNarrative(e)}
            className="mb-[18px] rounded-[14px] border border-border-soft bg-surface px-[16px] py-[14px]"
          >
            <div className="grid gap-[12px]">
              <div>
                <label className={labelClass} htmlFor="case-sum-en">
                  {x(M.memory_prod_summary_en)}
                </label>
                <textarea
                  id="case-sum-en"
                  value={form.summaryEn}
                  onChange={(e) => setForm((f) => ({ ...f, summaryEn: e.target.value }))}
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="case-sum-fr">
                  {x(M.memory_prod_summary_fr)}
                </label>
                <textarea
                  id="case-sum-fr"
                  value={form.summaryFr}
                  onChange={(e) => setForm((f) => ({ ...f, summaryFr: e.target.value }))}
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="case-resume-en">
                  {x(M.memory_prod_resume_since_en)}
                </label>
                <input
                  id="case-resume-en"
                  value={form.resumeSinceEn}
                  onChange={(e) => setForm((f) => ({ ...f, resumeSinceEn: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="case-changed">
                  {x(M.memory_prod_changed_lines)}
                </label>
                <textarea
                  id="case-changed"
                  value={form.changedText}
                  onChange={(e) => setForm((f) => ({ ...f, changedText: e.target.value }))}
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="case-next">
                  {x(M.memory_prod_next_steps_lines)}
                </label>
                <textarea
                  id="case-next"
                  value={form.nextStepsText}
                  onChange={(e) => setForm((f) => ({ ...f, nextStepsText: e.target.value }))}
                  rows={3}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-fit cursor-pointer rounded-[9px] border-none bg-navy px-[14px] py-[9px] font-sans text-[13px] font-bold text-white disabled:opacity-60"
              >
                {x(M.memory_prod_save_narrative)}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap items-start gap-[20px]">
          <div className="min-w-[300px] flex-1">
            {(narrative?.summary.en || narrative?.summary.fr) && (
              <div className="mb-[18px] rounded-[14px] border border-border-soft bg-surface px-[17px] py-[15px]">
                <div className="mb-[9px] flex items-center gap-[9px]">
                  <Sparkle size={14} className="fill-gold-dot" strokeWidth={0} aria-hidden="true" />
                  <div>
                    <div className="text-[13.5px] font-bold text-text">
                      {x(M.memory_case_summary_title)}
                    </div>
                    <div className="text-[11.5px] text-text-faint">
                      {x(M.memory_case_summary_sub)}
                    </div>
                  </div>
                </div>
                <div className="text-[13.5px] leading-[1.6] text-text-2">
                  {pick(narrative!.summary, lang)}
                </div>
                {narrative!.changed.length > 0 && (
                  <div className="mt-[13px] border-t border-inset pt-[11px]">
                    <div className="mb-[7px] text-[11px] font-bold tracking-[0.04em] text-gold-fg uppercase">
                      {x(M.memory_case_changed)}
                    </div>
                    {narrative!.changed.map((change) => (
                      <div key={change.en} className="mb-[6px] flex items-start gap-[8px]">
                        <span className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-gold-dot" />
                        <span className="text-[12.5px] leading-normal text-text-muted">
                          {lang === 'fr' ? change.fr || change.en : change.en}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!narrative && (
              <div className="mb-[16px] flex items-start gap-[10px] rounded-[12px] border border-border-soft bg-inset px-[14px] py-[12px]">
                <Info
                  size={15}
                  strokeWidth={1.7}
                  className="mt-[2px] shrink-0 text-text-muted"
                  aria-hidden="true"
                />
                <p className="m-0 text-[12.5px] leading-normal text-text-muted">
                  {x(M.memory_prod_narrative_empty)}
                </p>
              </div>
            )}

            <div className="flex items-center gap-[8px] px-[2px] pt-[2px] pb-[8px]">
              <span className="text-[11px] font-bold tracking-wider text-gold-fg uppercase">
                {x(M.memory_case_facts)}
              </span>
              <span className="h-px flex-1 bg-border-soft" />
            </div>
            <div className="mb-[20px] overflow-hidden rounded-[13px] border border-border-soft bg-surface">
              {facts.map((fact) => (
                <MemoryFactRow
                  key={fact.id}
                  fact={fact}
                  onConfirm={(id) => void onConfirm(id)}
                  onCorrect={(id, s) => void onCorrect(id, s)}
                  onForget={(id) => void onForget(id)}
                />
              ))}
              {facts.length === 0 && (
                <div className="px-[20px] py-[24px] text-center text-[13px] text-text-faint">
                  {x(M.memory_prod_case_empty)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-[8px] px-[2px] pt-[2px] pb-[8px]">
              <span className="text-[11px] font-bold tracking-wider text-gold-fg uppercase">
                {x(M.memory_case_timeline)}
              </span>
              <span className="h-px flex-1 bg-border-soft" />
            </div>
            <div className="mb-[16px] rounded-[14px] border border-border-soft bg-surface px-[16px] py-[14px]">
              {timeline.length === 0 && (
                <div className="text-[13px] text-text-faint">{x(M.memory_prod_timeline_empty)}</div>
              )}
              {timeline.map((ev) => (
                <div key={ev.id} className="mb-[12px] border-l-2 border-border-soft pl-[12px]">
                  <div className="text-[11px] font-bold text-text-faint">
                    {new Date(ev.occurredAt).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}
                    {ev.sessionLabel.en ? ` · ${pick(ev.sessionLabel, lang)}` : ''}
                  </div>
                  <div className="mt-[3px] text-[13px] leading-normal text-text-2">
                    {pick(ev.body, lang)}
                  </div>
                </div>
              ))}
            </div>

            {narrative && narrative.nextSteps.length > 0 && (
              <div className="mb-[16px] rounded-[14px] border border-border-soft bg-surface px-[16px] py-[14px]">
                <div className="mb-[8px] text-[12.5px] font-bold text-text">
                  {x(M.memory_know_next_steps)}
                </div>
                <ul className="m-0 list-disc pl-[16px] text-[12.5px] leading-normal text-text-muted">
                  {narrative.nextSteps.map((step) => (
                    <li key={step.en}>{lang === 'fr' ? step.fr || step.en : step.en}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <Disclaimer className="mt-[18px]" />
      </div>
    </div>
  )
}
