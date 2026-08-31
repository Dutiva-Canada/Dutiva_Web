import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { doclibMessages } from '@/i18n/messages/doclib'
import { SegButton } from '../../components'
import { jurisdictionInfo } from '../../data'
import type { NoticeFloorVerdict } from '../../statutoryFloor'
import type { DocEmployee, Jurisdiction, TemplateQuestion } from '../../data'
import type { DocTemplate } from '../../data'

export const STUDIO_PATH = '/app/documents/studio'
export const REPOSITORY_PATH = '/app/documents'

/* Simulated autosave cadence (prototype timing): change → unsaved,
   +800ms → saving, +650ms → saved. */
export const SAVE_DEBOUNCE_MS = 800
export const SAVE_SETTLE_MS = 650

export type SaveState = 'unsaved' | 'saving' | 'saved'

export interface WizardState {
  step: 0 | 1 | 2
  employeeId?: string
  caseId?: string
  jurisdiction: Jurisdiction
  language: 'en' | 'fr'
  answers: Record<string, string>
  saveState: SaveState
}

export const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] text-[13px] text-text placeholder:text-text-faint'

export const cardClass =
  'rounded-[12px] border border-border bg-surface p-[18px] shadow-sm max-[640px]:p-[14px]'

export const sectionHeadingClass =
  'mb-3 text-[11px] font-bold tracking-[0.08em] uppercase text-(--gold-fg)'

export function FieldLabel({
  htmlFor,
  required,
  requiredTitle,
  children,
}: {
  readonly htmlFor?: string
  readonly required?: boolean
  readonly requiredTitle: string
  readonly children: string
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[12.5px] font-semibold text-text">
      {children}
      {required && (
        <span className="ml-0.5 text-risk-fg" title={requiredTitle} aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}

export function SegRow({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex w-fit flex-wrap gap-0.75 rounded-[10px] border border-border bg-inset p-0.75">
      {children}
    </div>
  )
}

/** One guided-questions input, keyed to the wizard answers by question id. */
export function QuestionField({
  question,
  value,
  autofilled,
  noticeFloor,
  onChange,
}: {
  readonly question: TemplateQuestion
  readonly value: string
  readonly autofilled: boolean
  /** Statutory-floor check for this field, when one applies (statutoryFloor.ts). */
  readonly noticeFloor?: NoticeFloorVerdict
  readonly onChange: (value: string) => void
}) {
  const { t, x } = useI18n()
  const inputId = `q-${question.id}`
  const placeholder = question.placeholder ? x(question.placeholder) : undefined

  let control: ReactNode
  switch (question.type) {
    case 'textarea':
      control = (
        <textarea
          id={inputId}
          value={value}
          rows={4}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )
      break
    case 'select':
      control = (
        <select
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        >
          <option value="">—</option>
          {(question.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {x(option.label)}
            </option>
          ))}
        </select>
      )
      break
    case 'radio':
      control = (
        <SegRow>
          {(question.options ?? []).map((option) => (
            <SegButton
              key={option.value}
              active={value === option.value}
              onClick={() => onChange(option.value)}
            >
              {x(option.label)}
            </SegButton>
          ))}
        </SegRow>
      )
      break
    default:
      /* text / date / number map straight onto the input type. */
      control = (
        <input
          id={inputId}
          type={question.type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )
  }

  return (
    <div>
      <FieldLabel
        htmlFor={question.type === 'radio' ? undefined : inputId}
        required={question.required}
        requiredTitle={t('doclib_gen_required')}
      >
        {x(question.label)}
      </FieldLabel>
      {control}
      {autofilled && <div className="mt-1 text-[11px] text-accent">{t('doclib_gen_autofill')}</div>}
      {question.hint && <div className="mt-1 text-[11px] text-text-faint">{x(question.hint)}</div>}
      {noticeFloor && <NoticeFloorNote verdict={noticeFloor} />}
    </div>
  )
}

/**
 * The statutory-floor readout under the notice field.
 *
 * Advisory, never prescriptive: it reports the floor and says plainly when the
 * entered figure is under it, but the "statutory floor only" line rides along
 * with every grounded verdict so the number is never mistaken for a
 * recommended amount. Common-law reasonable notice is routinely much higher.
 */
/** Resolves the floor readout message for the verdict kind (below / meets / info). */
export function floorMessage(kind: NoticeFloorVerdict['kind']) {
  if (kind === 'below') return doclibMessages.doclib_gen_floor_below
  if (kind === 'meets') return doclibMessages.doclib_gen_floor_meets
  return doclibMessages.doclib_gen_floor_info
}

export function NoticeFloorNote({ verdict }: { readonly verdict: NoticeFloorVerdict }) {
  const { t, x } = useI18n()

  if (verdict.kind === 'unknown-tenure') return null

  if (verdict.kind === 'unavailable') {
    return (
      <div className="mt-1 text-[11px] text-text-faint">{t('doclib_gen_floor_unavailable')}</div>
    )
  }

  const weeks = String(verdict.floorWeeks)
  const below = verdict.kind === 'below'
  const message = floorMessage(verdict.kind)

  return (
    <div
      className={`mt-1 flex items-start gap-1.5 text-[11px] ${below ? 'font-semibold text-risk-fg' : 'text-text-faint'}`}
      role={below ? 'alert' : undefined}
    >
      {below && (
        <AlertTriangle size={12} strokeWidth={2} className="mt-px shrink-0" aria-hidden="true" />
      )}
      <span>
        {x(message).replace('{weeks}', weeks)} {t('doclib_gen_floor_common_law')}
      </span>
    </div>
  )
}

export function AutosaveIndicator({ state }: { readonly state: SaveState }) {
  const { t } = useI18n()
  const saveState = {
    saving: { dot: 'bg-accent animate-pulse', label: t('doclib_gen_saving') },
    saved: { dot: 'bg-ok-fg', label: t('doclib_gen_saved') },
    unsaved: { dot: 'bg-gold-dot', label: t('doclib_gen_unsaved') },
  }[state]
  const { dot, label } = saveState
  return (
    <output className="inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap text-text-muted">
      <span className={`h-1.75 w-1.75 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </output>
  )
}

export interface SectionGroup {
  key: string
  section: Bi
  questions: TemplateQuestion[]
}

export function groupQuestions(template: DocTemplate): SectionGroup[] {
  const groups: SectionGroup[] = []
  const byKey = new Map<string, SectionGroup>()
  for (const question of template.questions) {
    const key = question.section.en
    let group = byKey.get(key)
    if (!group) {
      group = { key, section: question.section, questions: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    group.questions.push(question)
  }
  return groups
}

export type Translator = ReturnType<typeof useI18n>['t']

export function wizardSubtitle(step: WizardState['step'], t: Translator): string {
  if (step === 0) return t('doclib_gen_contextSub')
  if (step === 2) return t('doclib_gen_reviewSub')
  return `${t('doclib_gen_step')} 2 ${t('doclib_gen_of')} 3 — ${t('doclib_gen_questions')}`
}

export function prefilledAnswers(
  answers: WizardState['answers'],
  employee: DocEmployee | undefined,
  nameQuestion: TemplateQuestion | undefined,
): WizardState['answers'] {
  if (!employee || !nameQuestion || (answers[nameQuestion.id] ?? '').trim() !== '') return answers
  return { ...answers, [nameQuestion.id]: employee.name }
}

export function jurisdictionLabel(code: Jurisdiction, x: ReturnType<typeof useI18n>['x']): string {
  const info = jurisdictionInfo.find((jurisdiction) => jurisdiction.code === code)
  return info ? x(info.name) : code
}

export function selectEmployee(
  id: string,
  employees: DocEmployee[],
  nameQuestion: TemplateQuestion | undefined,
  setWiz: Dispatch<SetStateAction<WizardState>>,
) {
  const employee = employees.find((candidate) => candidate.id === id)
  setWiz((wizard) => ({
    ...wizard,
    employeeId: id || undefined,
    caseId: undefined,
    answers: prefilledAnswers(wizard.answers, employee, nameQuestion),
  }))
}

export function scheduleAutosave(
  timersRef: { current: number[] },
  setWiz: Dispatch<SetStateAction<WizardState>>,
) {
  for (const id of timersRef.current) window.clearTimeout(id)
  const settle = window.setTimeout(() => {
    setWiz((wizard) => ({ ...wizard, saveState: 'saving' }))
    const done = window.setTimeout(
      () => setWiz((wizard) => ({ ...wizard, saveState: 'saved' })),
      SAVE_SETTLE_MS,
    )
    timersRef.current.push(done)
  }, SAVE_DEBOUNCE_MS)
  timersRef.current = [settle]
}

export function initialWizardState(
  template: DocTemplate,
  primaryJurisdiction: Jurisdiction,
  language: WizardState['language'],
): WizardState {
  const jurisdiction = template.jurisdictions.includes(primaryJurisdiction)
    ? primaryJurisdiction
    : (template.jurisdictions[0] ?? primaryJurisdiction)
  return { step: 0, jurisdiction, language, answers: {}, saveState: 'saved' }
}

/**
 * Map employees.province strings to Document Studio jurisdictions.
 * Production roster stores province names; the wizard needs ON|QC|FED.
 */
export function provinceToJurisdiction(province: string): Jurisdiction {
  const normalized = province.trim().toLowerCase()
  if (
    normalized === 'qc' ||
    normalized === 'quebec' ||
    normalized === 'québec' ||
    normalized.startsWith('québec') ||
    normalized.startsWith('quebec')
  ) {
    return 'QC'
  }
  if (normalized === 'fed' || normalized === 'federal' || normalized.includes('federally')) {
    return 'FED'
  }
  return 'ON'
}
