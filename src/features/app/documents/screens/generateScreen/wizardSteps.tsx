import { ProgressFill } from '@/components/ProgressFill'
import { useI18n } from '@/i18n/context'
import { DocChip, JurisdictionPill, SegButton } from '../../components'
import { reviewStatusInfo, riskLevelInfo } from '../../data'
import { appliesToNoticeField, assessNoticeFloor } from '../../statutoryFloor'
import type { DocCase, DocEmployee, DocTemplate, Jurisdiction, TemplateQuestion } from '../../data'
import type { fillProgress } from '../../engine'
import {
  FieldLabel,
  QuestionField,
  SegRow,
  cardClass,
  inputClass,
  jurisdictionLabel,
  sectionHeadingClass,
  type SectionGroup,
  type Translator,
  type WizardState,
} from './wizardUi'

export function ContextStep({
  subject,
  jurisdictions,
  employeeId,
  caseId,
  jurisdiction,
  language,
  employees,
  employeeCases,
  employeeRequired,
  onEmployeeChange,
  onCaseChange,
  onJurisdictionChange,
  onLanguageChange,
  t,
  x,
}: {
  readonly subject: DocTemplate['subject']
  readonly jurisdictions: DocTemplate['jurisdictions']
  readonly employeeId?: string
  readonly caseId?: string
  readonly jurisdiction: Jurisdiction
  readonly language: WizardState['language']
  readonly employees: DocEmployee[]
  readonly employeeCases: DocCase[]
  readonly employeeRequired: boolean
  readonly onEmployeeChange: (id: string) => void
  readonly onCaseChange: (id: string) => void
  readonly onJurisdictionChange: (jurisdiction: Jurisdiction) => void
  readonly onLanguageChange: (language: WizardState['language']) => void
  readonly t: Translator
  readonly x: ReturnType<typeof useI18n>['x']
}) {
  const showsPeoplePickers = subject === 'employee' || subject === 'candidate'

  return (
    <section className={cardClass} aria-label={t('doclib_gen_context')}>
      <h2 className={sectionHeadingClass}>{t('doclib_gen_context')}</h2>
      <div className="flex flex-col gap-4">
        {showsPeoplePickers ? (
          <>
            <div>
              <FieldLabel
                htmlFor="gen-employee"
                required={employeeRequired}
                requiredTitle={t('doclib_gen_required')}
              >
                {employeeRequired ? t('doclib_gen_employeeReq') : t('doclib_gen_candLink')}
              </FieldLabel>
              <select
                id="gen-employee"
                aria-label={
                  employeeRequired ? t('doclib_gen_employeeReq') : t('doclib_gen_candLink')
                }
                value={employeeId ?? ''}
                onChange={(event) => onEmployeeChange(event.target.value)}
                className={inputClass}
              >
                <option value="">{t('doclib_gen_none')}</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-[11px] text-text-faint">
                {employeeRequired ? t('doclib_gen_empRequired') : t('doclib_gen_candHint')}
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="gen-case" requiredTitle={t('doclib_gen_required')}>
                {t('doclib_gen_case')}
              </FieldLabel>
              <select
                id="gen-case"
                aria-label={t('doclib_gen_case')}
                value={caseId ?? ''}
                onChange={(event) => onCaseChange(event.target.value)}
                className={inputClass}
              >
                <option value="">{t('doclib_gen_none')}</option>
                {employeeCases.map((docCase) => (
                  <option key={docCase.id} value={docCase.id}>
                    {x(docCase.title)}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-(--accent-soft-border) bg-accent-soft px-3 py-2 text-[12px] text-text-muted">
            {subject === 'org' ? t('doclib_gen_orgWideNote') : t('doclib_gen_extNote')}
          </div>
        )}

        <div>
          <FieldLabel requiredTitle={t('doclib_gen_required')}>
            {t('doclib_gen_jurisdiction')}
          </FieldLabel>
          <SegRow>
            {jurisdictions.map((code) => (
              <SegButton
                key={code}
                active={jurisdiction === code}
                onClick={() => onJurisdictionChange(code)}
              >
                {code}
              </SegButton>
            ))}
          </SegRow>
        </div>

        <div>
          <FieldLabel requiredTitle={t('doclib_gen_required')}>
            {t('doclib_gen_language')}
          </FieldLabel>
          <SegRow>
            {(['en', 'fr'] as const).map((docLang) => (
              <SegButton
                key={docLang}
                active={language === docLang}
                onClick={() => onLanguageChange(docLang)}
              >
                {docLang.toUpperCase()}
              </SegButton>
            ))}
          </SegRow>
        </div>
      </div>
    </section>
  )
}

export function QuestionsStep({
  sections,
  answers,
  selectedEmployee,
  nameQuestion,
  jurisdiction,
  fieldIds,
  setAnswer,
  x,
}: {
  readonly sections: SectionGroup[]
  readonly answers: WizardState['answers']
  readonly selectedEmployee: DocEmployee | undefined
  readonly nameQuestion: TemplateQuestion | undefined
  /** Drives the statutory floor — the schedule is jurisdiction-specific. */
  readonly jurisdiction: Jurisdiction
  /** Every field on this template; distinguishes individual from group notice. */
  readonly fieldIds: readonly string[]
  readonly setAnswer: (id: string, value: string) => void
  readonly x: ReturnType<typeof useI18n>['x']
}) {
  return sections.map((group) => (
    <section key={group.key} className={cardClass} aria-label={x(group.section)}>
      <h2 className={sectionHeadingClass}>{x(group.section)}</h2>
      <div className="flex flex-col gap-4">
        {group.questions.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            value={answers[question.id] ?? ''}
            autofilled={
              question === nameQuestion &&
              selectedEmployee !== undefined &&
              answers[question.id] === selectedEmployee.name
            }
            noticeFloor={
              appliesToNoticeField(question.id, fieldIds)
                ? assessNoticeFloor(jurisdiction, answers.tenure_years, answers[question.id])
                : undefined
            }
            onChange={(value) => setAnswer(question.id, value)}
          />
        ))}
      </div>
    </section>
  ))
}

export function ReviewStep({
  risk,
  review,
  requiresLawyerReview,
  progress,
  progressPct,
  jurisdiction,
  language,
  t,
  x,
}: {
  readonly risk: DocTemplate['risk']
  readonly review: DocTemplate['review']
  readonly requiresLawyerReview: boolean
  readonly progress: ReturnType<typeof fillProgress>
  readonly progressPct: number
  readonly jurisdiction: Jurisdiction
  readonly language: WizardState['language']
  readonly t: Translator
  readonly x: ReturnType<typeof useI18n>['x']
}) {
  const riskInfo = riskLevelInfo[risk]
  const reviewInfo = reviewStatusInfo[review]

  return (
    <section className={cardClass} aria-label={t('doclib_gen_review')}>
      <h2 className={sectionHeadingClass}>{t('doclib_gen_review')}</h2>

      {/* Fill progress */}
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-semibold text-text">
          {`${progress.filled}/${progress.total}`}{' '}
          <span className="font-medium text-text-muted">{t('doclib_gen_mergeFilled')}</span>
        </span>
        <span className="text-[12px] text-text-muted">
          {progress.total - progress.filled > 0
            ? `${progress.total - progress.filled} ${t('doclib_gen_mergeRemaining')}`
            : `${progressPct}%`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-inset" aria-hidden="true">
        <ProgressFill pct={progressPct} className="h-full w-full rounded-full text-navy" />
      </div>

      {/* Risk & review posture + context summary */}
      <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2.5 text-[12.5px]">
        <dt className="font-semibold text-text-muted">{t('doclib_gen_riskLine')}</dt>
        <dd>
          <DocChip tone={riskInfo.tone}>{x(riskInfo.label)}</DocChip>
        </dd>
        <dt className="font-semibold text-text-muted">{t('doclib_gen_reviewLine')}</dt>
        <dd>
          <DocChip tone={reviewInfo.tone}>{x(reviewInfo.label)}</DocChip>
        </dd>
        <dt className="font-semibold text-text-muted">{t('doclib_gen_jurisdiction')}</dt>
        <dd className="flex items-center gap-2 text-text">
          <JurisdictionPill code={jurisdiction} />
          {jurisdictionLabel(jurisdiction, x)}
        </dd>
        <dt className="font-semibold text-text-muted">{t('doclib_gen_language')}</dt>
        <dd className="font-semibold text-text">{language.toUpperCase()}</dd>
      </dl>

      {(requiresLawyerReview || review === 'hr_review_required') && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-[12px] ${
            requiresLawyerReview
              ? 'border-risk-border bg-risk-bg text-risk-fg'
              : 'border-border bg-warn-bg text-warn-fg'
          }`}
        >
          {requiresLawyerReview ? t('doclib_gen_lawyerWarn') : t('doclib_gen_hrWarn')}
        </div>
      )}
    </section>
  )
}
