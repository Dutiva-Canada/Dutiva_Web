import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { bi } from '@/i18n/core'
import { doclibMessages } from '@/i18n/messages/doclib'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useDoclib } from '../../doclibContext'
import { createDocument } from '../../productionApi'
import {
  answerLabels,
  applicability,
  can,
  computedTokens,
  fillProgress,
  resolveBlocks,
} from '../../engine'
import type { ApplicabilityKind } from '../../engine'
import { ActBtn, DocChip, DocPaper, JurisdictionPill, StepDots } from '../../components'
import { sizeTiers } from '../../data'
import type { DocCase, DocChipTone, DocEmployee, DocTemplate } from '../../data'
import {
  AutosaveIndicator,
  REPOSITORY_PATH,
  STUDIO_PATH,
  groupQuestions,
  initialWizardState,
  scheduleAutosave,
  selectEmployee,
  wizardSubtitle,
  type WizardState,
} from './wizardUi'
import { ContextStep, QuestionsStep, ReviewStep } from './wizardSteps'

const APPLIC_TONE: Record<ApplicabilityKind, DocChipTone> = {
  required: 'gold',
  applies: 'ok',
  below: 'neutral',
  union: 'info',
}

export function GenerateWizard({
  template,
  employees,
  cases,
}: {
  readonly template: DocTemplate
  readonly employees: DocEmployee[]
  readonly cases: DocCase[]
}) {
  const { t, x, lang } = useI18n()
  const { org, role } = useDoclib()
  const { showToast } = useToasts()
  const navigate = useNavigate()
  const {
    mode: workspaceMode,
    organizationId,
    isOrgAdmin,
    identity,
  } = useWorkspaceMode()
  const [saving, setSaving] = useState(false)

  const [wiz, setWiz] = useState<WizardState>(() =>
    initialWizardState(template, org.primaryJurisdiction, lang),
  )

  /* Simulated autosave timers — cleared on every change and on unmount. */
  const timersRef = useRef<number[]>([])
  useEffect(
    () => () => {
      for (const id of timersRef.current) window.clearTimeout(id)
    },
    [],
  )

  const setAnswer = (id: string, value: string) => {
    setWiz((w) => ({ ...w, answers: { ...w.answers, [id]: value }, saveState: 'unsaved' }))
    scheduleAutosave(timersRef, setWiz)
  }

  /* The name question this template prefills from the chosen employee. */
  const nameQuestion = template.questions.find(
    (q) => q.id === 'employee_name' || q.id === 'candidate_name',
  )

  const selectedEmployee = employees.find((e) => e.id === wiz.employeeId)

  const goStep = (step: number) => {
    const clamped = Math.max(0, Math.min(2, step)) as 0 | 1 | 2
    setWiz((w) => ({ ...w, step: clamped }))
  }

  const employeeRequired = template.subject === 'employee'
  const contextReady = !employeeRequired || wiz.employeeId !== undefined
  /* A question marked `required` was only ever decorated with an asterisk —
     the wizard advanced and created regardless, so a document could be saved
     with its required merge fields blank and render as unfilled placeholders
     in the customer's copy. Gate on it, and say which ones are missing rather
     than disabling a button for no visible reason. */
  const missingRequired = template.questions.filter(
    (q) => q.required && (wiz.answers[q.id] ?? '').trim() === '',
  )
  const questionsReady = missingRequired.length === 0
  const employeeCases = cases.filter(
    (c) => wiz.employeeId === undefined || c.employeeId === wiz.employeeId,
  )

  const sections = useMemo(() => groupQuestions(template), [template])
  /* Which fields this template collects — `tenure_years` is what separates an
     individual termination (ESA s.57, tenure-based) from a group one
     (s.58, headcount-based). See statutoryFloor.ts. */
  const templateFieldIds = useMemo(
    () => sections.flatMap((group) => group.questions.map((question) => question.id)),
    [sections],
  )
  const blocks = useMemo(
    () =>
      resolveBlocks(template, {
        jurisdiction: wiz.jurisdiction,
        headcount: org.headcount,
        unionized: org.unionized,
        answers: wiz.answers,
      }),
    [template, wiz.jurisdiction, org.headcount, org.unionized, wiz.answers],
  )
  /* Merge values: computed tokens (in the chosen DOCUMENT language) under the
     wizard answers. Caveat: DocPaper renders block copy in the UI language, so
     the document-language toggle only affects the computed tokens (today /
     jurisdiction / statute wording) — acceptable for the demo. */
  const todayString = useMemo(
    () =>
      new Date().toLocaleDateString(wiz.language === 'fr' ? 'fr-CA' : 'en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [wiz.language],
  )
  const values = useMemo(
    () => ({
      ...computedTokens(wiz.jurisdiction, wiz.language, todayString),
      ...answerLabels(template, wiz.answers, wiz.language),
    }),
    [template, wiz.jurisdiction, wiz.language, todayString, wiz.answers],
  )

  const progress = fillProgress(template, wiz.answers)
  const progressPct =
    progress.total === 0 ? 100 : Math.round((progress.filled / progress.total) * 100)

  const applic = applicability(template, org)
  const sizeTier = sizeTiers.find(
    (tier) => org.headcount >= tier.min && (tier.max === null || org.headcount <= tier.max),
  )

  const saveToRepository = () => {
    if (workspaceMode === 'production') {
      void saveProductionDocument()
      return
    }
    if (!can(role, 'generate')) {
      showToast(doclibMessages.doclib_toast_denied, 'info')
      return
    }
    /* Demo mode has no write path — surface the created toast and return to
       the repository without persisting anything. */
    showToast(doclibMessages.doclib_toast_created, 'ok')
    navigate(REPOSITORY_PATH)
  }

  const saveProductionDocument = async () => {
    if (!organizationId || !isOrgAdmin) {
      showToast(doclibMessages.doclib_prod_create_denied, 'info')
      return
    }
    if (saving) return
    setSaving(true)
    try {
      const created = await createDocument(organizationId, {
        title: bi(
          `${template.name.en} — ${template.tid}`,
          `${template.name.fr} — ${template.tid}`,
        ),
        templateTid: template.tid,
        templateKey: template.key,
        templateVersion: template.version,
        employeeId: wiz.employeeId,
        caseId: wiz.caseId,
        jurisdiction: wiz.jurisdiction,
        language: wiz.language,
        reviewStatus: template.review,
        risk: template.risk,
        answers: wiz.answers,
        content: { blocks, values },
        actorLabel: identity.user.name || identity.user.email || 'Admin',
      })
      showToast(doclibMessages.doclib_toast_created, 'ok')
      navigate(`/app/documents/${created.id}`)
    } catch {
      showToast(doclibMessages.doclib_prod_create_failed, 'info')
    } finally {
      setSaving(false)
    }
  }

  const subtitle = wizardSubtitle(wiz.step, t)

  return (
    <div>
      {/* Header: title + step-appropriate subtitle */}
      <header className="mb-4">
        <h1 className="font-display text-[19px] font-bold tracking-[-0.01em] text-text">
          {`${t('doclib_gen_title')} · ${x(template.name)}`}
        </h1>
        <p className="mt-0.5 text-[13px] text-text-muted">{subtitle}</p>
      </header>

      {/* Cancel · step dots · autosave */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-2.5">
        <Link
          to={STUDIO_PATH}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-text-muted hover:text-text"
        >
          <ChevronLeft size={15} strokeWidth={1.8} aria-hidden="true" />
          {t('doclib_gen_cancel')}
        </Link>
        <div className="flex-1">
          <StepDots
            step={wiz.step}
            labels={[t('doclib_gen_context'), t('doclib_gen_questions'), t('doclib_gen_review')]}
            onJump={goStep}
          />
        </div>
        <AutosaveIndicator state={wiz.saveState} />
      </div>

      {/* Org compliance strip (screenshot: size tier · union status · applicability) */}
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.25 max-[640px]:px-2.5">
        {sizeTier && (
          <span className="inline-flex items-center rounded-full border border-border bg-inset px-2.5 py-0.75 text-[12px] font-semibold text-text-muted">
            {`${x(sizeTier.label)} · ${org.headcount}`}
          </span>
        )}
        <span className="inline-flex items-center rounded-full border border-border bg-inset px-2.5 py-0.75 text-[12px] font-semibold text-text-muted">
          {org.unionized ? t('doclib_profile_union') : t('doclib_profile_nonunion')}
        </span>
        <DocChip tone={APPLIC_TONE[applic.kind]}>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
              aria-hidden="true"
            />
            {x(applic.label)}
          </span>
        </DocChip>
      </div>

      {/* Two-column: wizard step + sticky live preview (stacks below 1024px) */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)] items-start gap-6 max-[1023px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-4">
          {wiz.step === 0 && (
            <ContextStep
              subject={template.subject}
              jurisdictions={template.jurisdictions}
              employeeId={wiz.employeeId}
              caseId={wiz.caseId}
              jurisdiction={wiz.jurisdiction}
              language={wiz.language}
              employees={employees}
              employeeCases={employeeCases}
              employeeRequired={employeeRequired}
              onEmployeeChange={(id) => selectEmployee(id, employees, nameQuestion, setWiz)}
              onCaseChange={(id) => setWiz((w) => ({ ...w, caseId: id || undefined }))}
              onJurisdictionChange={(jurisdiction) => setWiz((w) => ({ ...w, jurisdiction }))}
              onLanguageChange={(language) => setWiz((w) => ({ ...w, language }))}
              t={t}
              x={x}
            />
          )}

          {wiz.step === 1 && (
            <QuestionsStep
              sections={sections}
              answers={wiz.answers}
              selectedEmployee={selectedEmployee}
              nameQuestion={nameQuestion}
              jurisdiction={wiz.jurisdiction}
              fieldIds={templateFieldIds}
              setAnswer={setAnswer}
              x={x}
            />
          )}

          {wiz.step === 2 && (
            <ReviewStep
              risk={template.risk}
              review={template.review}
              requiresLawyerReview={template.requiresLawyerReview}
              progress={progress}
              progressPct={progressPct}
              jurisdiction={wiz.jurisdiction}
              language={wiz.language}
              t={t}
              x={x}
            />
          )}

          {wiz.step > 0 && !questionsReady && (
            <div
              className="rounded-[10px] border border-warn-border bg-warn-bg px-3 py-2.25 text-[12px] text-warn-fg"
              aria-live="polite"
            >
              <span className="font-semibold">{t('doclib_gen_missing_required')}</span>{' '}
              {missingRequired.map((q) => x(q.label)).join(', ')}
            </div>
          )}

          {/* Back / Next / Save */}
          <div className="flex items-center justify-between gap-3">
            <div>
              {wiz.step > 0 && (
                <ActBtn onClick={() => goStep(wiz.step - 1)}>{t('doclib_gen_back')}</ActBtn>
              )}
            </div>
            {wiz.step < 2 ? (
              <button
                type="button"
                disabled={(wiz.step === 0 && !contextReady) || (wiz.step === 1 && !questionsReady)}
                onClick={() => goStep(wiz.step + 1)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] bg-navy px-3 py-1.75 text-[12.5px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t('doclib_gen_next')}
              </button>
            ) : (
              <ActBtn
                variant="primary"
                onClick={saveToRepository}
                disabled={!questionsReady || saving}
              >
                {saving ? t('doclib_prod_saving') : t('doclib_gen_createDoc')}
              </ActBtn>
            )}
          </div>
        </div>

        {/* Sticky live-preview rail */}
        <aside className="sticky top-4 min-w-0 self-start max-[1023px]:static">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-[12px] font-bold tracking-wider uppercase text-text-muted">
              {t('doclib_gen_livePreview')}
            </h2>
            <div className="flex items-center gap-1.5">
              <JurisdictionPill code={wiz.jurisdiction} />
              <span className="inline-flex items-center rounded-md border border-border bg-inset px-1.5 py-px text-[10.5px] font-bold tracking-[0.04em] text-text-muted">
                {wiz.language.toUpperCase()}
              </span>
            </div>
          </div>
          <DocPaper blocks={blocks} values={values} docLang={wiz.language} />
          <p className="mt-2 text-[11px] text-text-faint">{t('doclib_disc_short')}</p>
        </aside>
      </div>
    </div>
  )
}
