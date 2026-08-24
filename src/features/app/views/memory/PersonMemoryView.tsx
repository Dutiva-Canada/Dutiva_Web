import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Brain, Briefcase, Clock, Eye, ShieldCheck, Sparkle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { memoryMessages as M } from '@/i18n/messages/memory'
import { Disclaimer } from '@/components/Disclaimer'
import { statusChipClass } from '@/components/chips'
import type { ChipTone } from '@/components/chips'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { employees, memoryPeople } from '@/data'
import type { MemoryPersonChip } from '@/data'
import { CATEGORY_LABELS, PERSON_CATEGORY_ORDER } from './memoryModel'
import { MemoryFactRow } from './MemoryFactRow'
import { PersonMemoryProductionView } from './PersonMemoryProductionView'
import { useMemoryStore } from './memoryStore'

/**
 * Person memory (`Advisor Memory.dc.html` PERSON surface): profile header
 * (initials tile, name, status chips, Ask Advisor / Open case), the "What
 * Advisor remembers" intro, memory grouped by category, and the governance
 * rail (confidence legend, who-can-see, retention, lawful basis).
 *
 * Production mode uses PersonMemoryProductionView (real employees + facts).
 */

const CHIP_TONE: Record<MemoryPersonChip['tone'], ChipTone> = {
  ok: 'success',
  warn: 'warning',
  risk: 'risk',
  neutral: 'neutral',
}

export function PersonMemoryView() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <PersonMemoryProductionView />
  return <PersonMemoryDemoView />
}

function PersonMemoryDemoView() {
  const { x, lang } = useI18n()
  const navigate = useNavigate()
  const { personId } = useParams()
  const { facts } = useMemoryStore()

  const person = memoryPeople.find((p) => p.id === personId)
  const employee = employees.find((e) => e.id === personId)
  if (!person || !employee) return <Navigate to="/app/settings/memory" replace />

  const first = pick(person.firstName, lang)
  const meta = [employee.role, employee.dept, employee.province, employee.tenure]
    .map((part) => pick(part, lang))
    .join(' · ')

  const mine = facts.filter((f) => f.scope === 'person' && f.entityId === person.id)
  const inferredCount = mine.filter((f) => f.confidence === 'inferred').length
  const groups = PERSON_CATEGORY_ORDER.map((category) => ({
    category,
    items: mine.filter((f) => f.category === category),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1080px] px-[16px] pt-[26px] pb-[40px] md:px-[28px]">
        {/* Profile header */}
        <div className="mb-[22px] flex flex-wrap items-start gap-[16px]">
          <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[16px] bg-navy font-display text-[20px] font-semibold text-gold-on-navy">
            {employee.initials}
          </div>
          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-[10px]">
              <h1 className="m-0 font-display text-[23px] font-semibold tracking-[-0.01em] text-text">
                {employee.name}
              </h1>
              {person.chips.map((chip) => (
                <span key={chip.label.en} className={statusChipClass(CHIP_TONE[chip.tone])}>
                  {pick(chip.label, lang)}
                </span>
              ))}
            </div>
            <div className="mt-[4px] text-[13.5px] text-text-muted">{meta}</div>
          </div>
          <div className="flex gap-[9px]">
            <button
              type="button"
              onClick={() =>
                person.threadId !== null
                  ? navigate(`/app/settings/memory/conversations/${person.threadId}`)
                  : navigate('/app/advisor')
              }
              className="flex cursor-pointer items-center gap-[7px] rounded-[9px] border-none bg-navy px-[14px] py-[9px] font-sans text-[13px] font-bold text-white"
            >
              <Sparkle size={15} className="fill-gold-on-navy" strokeWidth={0} aria-hidden="true" />
              {x(M.memory_person_ask)} {first}
            </button>
            {person.caseId !== null && (
              <button
                type="button"
                onClick={() =>
                  person.memoryCaseId !== null
                    ? navigate(`/app/settings/memory/cases/${person.memoryCaseId}`)
                    : navigate(`/app/cases/${person.caseId}`)
                }
                className="flex cursor-pointer items-center gap-[7px] rounded-[9px] border border-border bg-surface px-[14px] py-[9px] font-sans text-[13px] font-bold text-text-2"
              >
                <Briefcase size={16} strokeWidth={1.7} aria-hidden="true" />
                {x(M.memory_person_open_case)}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-[20px]">
          {/* Memory list */}
          <div className="min-w-[300px] flex-1">
            <div className="mb-[18px] flex items-start gap-[11px] rounded-[14px] border border-gold-border bg-gold-bg px-[16px] py-[14px]">
              <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-navy">
                <Sparkle size={14} className="fill-gold-on-navy" strokeWidth={0} aria-hidden="true" />
              </div>
              <div>
                <div className="mb-[2px] text-[14px] font-bold text-text">
                  {x(M.memory_person_remembers)} {first}
                </div>
                <div className="text-[12.5px] leading-[1.55] text-text-muted">
                  {x(M.memory_person_intro)}
                  {inferredCount > 0 && (
                    <>
                      {' '}
                      {inferredCount}{' '}
                      {x(
                        inferredCount === 1
                          ? M.memory_person_review_one
                          : M.memory_person_review_many,
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {groups.map((group) => (
              <div key={group.category} className="mb-[8px]">
                <div className="flex items-center gap-[8px] px-[2px] pb-[6px] pt-[2px]">
                  <span className="text-[11px] font-bold tracking-wider text-gold-fg uppercase">
                    {pick(CATEGORY_LABELS[group.category], lang)}
                  </span>
                  <span className="h-px flex-1 bg-border-soft" />
                </div>
                <div className="overflow-hidden rounded-[13px] border border-border-soft bg-surface">
                  {group.items.map((fact) => (
                    <MemoryFactRow key={fact.id} fact={fact} />
                  ))}
                </div>
              </div>
            ))}

            <Disclaimer className="mt-[18px]" />
          </div>

          {/* Governance rail */}
          <aside className="flex w-full flex-none flex-col gap-[14px] lg:w-[312px]">
            <div className="rounded-[13px] border border-border-soft bg-surface px-[15px] py-[14px]">
              <div className="mb-[10px] text-[12.5px] font-bold text-text">
                {x(M.memory_rail_confidence)}
              </div>
              <div className="mb-[9px] flex items-start gap-[9px]">
                <span className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full bg-ok-fg" />
                <div>
                  <div className="text-[12.5px] font-semibold text-text">
                    {x(M.memory_confirmed)}
                  </div>
                  <div className="text-[11.5px] leading-snug text-text-faint">
                    {x(M.memory_rail_confirmed_note)}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-[9px]">
                <span className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full bg-gold-dot" />
                <div>
                  <div className="text-[12.5px] font-semibold text-text">
                    {x(M.memory_inferred)}
                  </div>
                  <div className="text-[11.5px] leading-snug text-text-faint">
                    {x(M.memory_rail_inferred_note)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[13px] border border-border-soft bg-surface px-[15px] py-[14px]">
              <div className="mb-[9px] flex items-center gap-[7px]">
                <Eye size={14} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
                <div className="text-[12.5px] font-bold text-text">{x(M.memory_rail_who)}</div>
              </div>
              <div className="text-[12px] leading-[1.55] text-text-muted">
                {x(M.memory_rail_who_note)}
              </div>
            </div>

            <div className="rounded-[13px] border border-border-soft bg-surface px-[15px] py-[14px]">
              <div className="mb-[9px] flex items-center gap-[7px]">
                <Clock size={14} strokeWidth={1.7} className="text-text-muted" aria-hidden="true" />
                <div className="text-[12.5px] font-bold text-text">
                  {x(M.memory_rail_retention)}
                </div>
              </div>
              <ul className="m-0 list-disc pl-[16px] text-[11.5px] leading-[1.6] text-text-muted">
                <li>{x(M.memory_rail_retention_employment)}</li>
                <li>{x(M.memory_rail_retention_case)}</li>
                <li>{x(M.memory_rail_retention_wellbeing)}</li>
              </ul>
            </div>

            <div className="rounded-[13px] border border-support-border bg-support-bg px-[15px] py-[14px]">
              <div className="mb-[8px] flex items-center gap-[7px]">
                <ShieldCheck
                  size={15}
                  strokeWidth={1.7}
                  className="text-support-fg"
                  aria-hidden="true"
                />
                <div className="text-[12.5px] font-bold text-support-fg">
                  {x(M.memory_rail_lawful)}
                </div>
              </div>
              <div className="text-[11.5px] leading-[1.55] text-support-text">
                {x(M.memory_rail_lawful_note)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/app/settings/memory')}
              className="flex cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-border bg-surface p-[11px] font-sans text-[13px] font-bold text-text-2"
            >
              <Brain size={16} strokeWidth={1.7} aria-hidden="true" />
              {x(M.memory_open_manager)}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
