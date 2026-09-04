import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Brain, Briefcase, History, Info, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { Disclaimer } from '@/components/Disclaimer'
import { statusChipClass } from '@/components/chips'
import type { ChipTone } from '@/components/chips'
import { cases, employees, memoryCases, memoryPeople } from '@/data'
import type { MemoryFact } from '@/data'
import type { AdvisorSearchNavState } from '@/features/app/search/searchCorpus'
import { memoryCaseContent } from './memoryCaseContent'
import type { MemoryCaseChip } from './memoryCaseContent'
import { KnowFact } from './KnowFact'
import { memoryScenarioTodayISO } from '@/data'
import { MemoryFactRow } from './MemoryFactRow'
import { useMemoryStore } from './memoryStore'

/**
 * Case memory (`Advisor Memory.dc.html` CASE surface): the "Picking up where
 * you left off" resume banner, the running case-memory summary with what
 * changed while away, the held facts, the session timeline with dashed gaps,
 * and the "What I know" rail with the memory ≠ this-turn's-analysis note.
 *
 * Production mode uses CaseMemoryProductionView (persisted narratives +
 * timeline from migration 0087, plus governed facts).
 */

const CHIP_TONE: Record<MemoryCaseChip['tone'], ChipTone> = {
  ok: 'success',
  warn: 'warning',
  risk: 'risk',
  neutral: 'neutral',
}

/** Northgate fixtures — demo workspace and public `/demo` only. */
export function CaseMemoryDemoView() {
  const { x, lang } = useI18n()
  const navigate = useNavigate()
  const { caseId } = useParams()
  const { facts } = useMemoryStore()

  const memoryCase = memoryCases.find((c) => c.id === caseId)
  const content = caseId !== undefined ? memoryCaseContent[caseId] : undefined
  if (!memoryCase || !content) return <Navigate to="/app/settings/memory" replace />

  const person = memoryPeople.find((p) => p.id === memoryCase.personId)
  const employee = employees.find((e) => e.id === memoryCase.personId)
  const fixtureCase = cases.find((c) => c.id === memoryCase.id)
  const caseTitle = fixtureCase ? pick(fixtureCase.title, lang) : memoryCase.code

  const caseFacts = facts.filter((f) => f.scope === 'case' && f.entityId === memoryCase.id)
  const byId = (id: string) => facts.find((f) => f.id === id)
  const knowPerson = content.personFactIds.map(byId).filter((f): f is MemoryFact => f !== undefined)
  const knowCase = content.caseFactIds.map(byId).filter((f): f is MemoryFact => f !== undefined)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-[16px] pt-[24px] pb-[40px] md:px-[28px]">
        {/* Case header */}
        <div className="mb-[16px] flex flex-wrap items-start gap-[14px]">
          <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-gold-bg text-gold-fg">
            <Briefcase size={16} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-[10px]">
              <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em] text-text">
                {caseTitle}
              </h1>
              {content.chips.map((chip) => (
                <span key={chip.label.en} className={statusChipClass(CHIP_TONE[chip.tone])}>
                  {pick(chip.label, lang)}
                </span>
              ))}
            </div>
            <div className="mt-[4px] text-[12.5px] text-text-faint">
              {memoryCase.code} · {x(M.memory_case_opened)} {pick(memoryCase.opened, lang)} ·{' '}
              {x(M.memory_case_owner)} · {memoryCase.owner}
            </div>
          </div>
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
              {x(M.memory_case_resume_last)}{' '}
              <strong className="text-text">{pick(content.resume.last, lang)}</strong>,{' '}
              {pick(content.resume.ago, lang)}. {x(M.memory_case_resume_since)}{' '}
              {pick(content.resume.since, lang)}
            </div>
            <div className="mt-[11px] flex flex-wrap gap-[8px]">
              <button
                type="button"
                onClick={() =>
                  person?.threadId != null
                    ? navigate('/app/advisor', {
                        state: { chatId: person.threadId } satisfies AdvisorSearchNavState,
                      })
                    : navigate('/app/advisor')
                }
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
              <button
                type="button"
                onClick={() => navigate(`/app/cases/${memoryCase.id}`)}
                className="cursor-pointer rounded-[8px] border border-border bg-surface px-[13px] py-[8px] font-sans text-[12.5px] font-semibold text-text-2"
              >
                {x(M.memory_case_view_history)}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-[20px]">
          <div className="min-w-[300px] flex-1">
            {/* Case memory summary */}
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
                {pick(content.summary, lang)}
              </div>
              <div className="mt-[13px] border-t border-inset pt-[11px]">
                <div className="mb-[7px] text-[11px] font-bold tracking-[0.04em] text-gold-fg uppercase">
                  {x(M.memory_case_changed)}
                </div>
                {content.changed.map((change) => (
                  <div key={change.en} className="mb-[6px] flex items-start gap-[8px]">
                    <span className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-gold-dot" />
                    <span className="text-[12.5px] leading-normal text-text-muted">
                      {pick(change, lang)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Case facts */}
            <div className="flex items-center gap-[8px] px-[2px] pt-[2px] pb-[8px]">
              <span className="text-[11px] font-bold tracking-wider text-gold-fg uppercase">
                {x(M.memory_case_facts)}
              </span>
              <span className="h-px flex-1 bg-border-soft" />
            </div>
            <div className="mb-[20px] overflow-hidden rounded-[13px] border border-border-soft bg-surface">
              {caseFacts.map((fact) => (
                <MemoryFactRow
                  key={fact.id}
                  fact={fact}
                  dateReferenceISO={memoryScenarioTodayISO}
                />
              ))}
              {caseFacts.length === 0 && (
                <div className="px-[20px] py-[24px] text-center text-[13px] text-text-faint">
                  {x(M.memory_mgr_empty)}
                </div>
              )}
            </div>

            {/* Memory timeline */}
            <div className="flex items-center gap-[8px] px-[2px] pt-[2px] pb-[8px]">
              <span className="text-[11px] font-bold tracking-wider text-gold-fg uppercase">
                {x(M.memory_case_timeline)}
              </span>
              <span className="h-px flex-1 bg-border-soft" />
            </div>
            <div className="rounded-[13px] border border-border-soft bg-surface px-[16px] pt-[4px] pb-[12px]">
              {content.timeline.map((entry) =>
                entry.kind === 'gap' ? (
                  <div
                    key={`${entry.kind}-${entry.label.en}`}
                    className="flex items-center gap-[12px] py-[6px] pl-px"
                  >
                    <div className="flex w-[11px] justify-center">
                      <div className="memory-timeline-gap-line h-[22px] w-[2px]" />
                    </div>
                    <span className="text-[11.5px] font-semibold text-text-faint">
                      {pick(entry.label, lang)}
                    </span>
                  </div>
                ) : (
                  <div
                    key={`${entry.kind}-${entry.label.en}`}
                    className="flex gap-[13px] border-t border-inset py-[11px] first:border-t-0"
                  >
                    <div className="flex w-[11px] flex-none justify-center">
                      <span
                        className={`mt-[3px] h-[11px] w-[11px] rounded-full border-2 ${
                          entry.current === true
                            ? 'border-gold-fg bg-gold-dot'
                            : 'border-ink bg-surface'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-[5px] flex flex-wrap items-center gap-[8px]">
                        <span className="text-[13px] font-bold text-text">
                          {pick(entry.label, lang)}
                        </span>
                        <span className="text-[11.5px] text-text-faint">
                          {pick(entry.date, lang)}
                        </span>
                        {entry.current === true && (
                          <span className="rounded-[100px] bg-gold-bg px-[8px] py-px text-[9.5px] font-extrabold tracking-wider text-gold-fg uppercase">
                            {x(M.memory_case_now)}
                          </span>
                        )}
                      </div>
                      {entry.events.map((event) => (
                        <div key={event.en} className="mb-[3px] flex items-start gap-[7px]">
                          <span className="mt-[7px] h-[4px] w-[4px] shrink-0 rounded-full bg-ink" />
                          <span className="text-[12.5px] leading-normal text-text-muted">
                            {pick(event, lang)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>

            <Disclaimer className="mt-[18px]" />
          </div>

          {/* What-I-know rail */}
          <aside className="flex w-full flex-none flex-col gap-[14px] lg:w-[320px]">
            <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
              <div className="flex items-center gap-[9px] border-b border-inset bg-surface-2 px-[15px] py-[13px]">
                <Brain size={16} strokeWidth={1.7} className="text-gold-fg" aria-hidden="true" />
                <div>
                  <div className="text-[12.5px] font-bold text-text">{x(M.memory_know_title)}</div>
                  <div className="text-[11px] text-text-faint">{x(M.memory_know_sub_case)}</div>
                </div>
              </div>
              <div className="px-[15px] py-[13px]">
                <div className="mb-[9px] text-[10.5px] font-bold tracking-wider text-gold-fg uppercase">
                  {employee?.name ?? memoryCase.personId}
                </div>
                {knowPerson.map((fact) => (
                  <KnowFact key={fact.id} fact={fact} />
                ))}
              </div>
              {knowCase.length > 0 && (
                <div className="border-t border-inset px-[15px] py-[13px]">
                  <div className="mb-[9px] text-[10.5px] font-bold tracking-wider text-gold-fg uppercase">
                    {x(M.memory_know_this_case)}
                  </div>
                  {knowCase.map((fact) => (
                    <KnowFact key={fact.id} fact={fact} />
                  ))}
                </div>
              )}
              <div className="border-t border-inset px-[15px] py-[13px]">
                <div className="mb-[9px] text-[10.5px] font-bold tracking-wider text-gold-fg uppercase">
                  {x(M.memory_know_next_steps)}
                </div>
                {content.nextSteps.map((step) => (
                  <div
                    key={step.en}
                    className="mb-[7px] flex gap-[8px] text-[12.5px] leading-normal text-text-muted"
                  >
                    <span className="font-bold text-gold-fg">→</span>
                    <span>{pick(step, lang)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[13px] border border-support-border bg-support-bg px-[14px] py-[12px]">
              <div className="mb-[6px] flex items-center gap-[7px]">
                <Info size={13} strokeWidth={1.7} className="text-support-fg" aria-hidden="true" />
                <div className="text-[12px] font-bold text-support-fg">
                  {x(M.memory_know_not_turn_title)}
                </div>
              </div>
              <div className="text-[11.5px] leading-[1.55] text-support-text">
                {x(M.memory_know_not_turn_note)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/app/settings/memory')}
              className="flex cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-border bg-surface p-[11px] font-sans text-[13px] font-bold text-text-2"
            >
              <Brain size={16} strokeWidth={1.7} aria-hidden="true" />
              {x(M.memory_manage_this)}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
