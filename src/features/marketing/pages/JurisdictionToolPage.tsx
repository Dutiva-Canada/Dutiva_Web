import { useState } from 'react'
import { Info, RotateCcw, ExternalLink, MapPin } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import { usePublicPath } from '@/seo/usePublicPath'
import { MarketingPageShell, PageHero, PageCta } from './MarketingPage'
import {
  visibleQuestions,
  isComplete,
  determineJurisdiction,
  isSupported,
} from '../tools/jurisdictionLogic'
import type { Answers, QuestionId } from '../tools/jurisdictionLogic'

/**
 * Jurisdiction-scoping questionnaire — a free, public, linkable tool that
 * helps an employer determine which Canadian employment standards
 * jurisdiction likely applies to an employee. Three questions, no
 * statutory figures, links to the official statute text.
 *
 * Decided 2026-08-06 (D6): a non-figure linkable asset is worth building,
 * and a jurisdiction-scoping questionnaire is the one that qualifies under
 * the editorial rule in `articleModel.ts` (no notice periods, thresholds,
 * or deadline counts). See docs/SEO_AUTHORITY_PLAYBOOK.md § Open items 3.
 */
export function JurisdictionToolPage() {
  const { t, x } = useI18n()
  const { p } = usePublicPath()
  const [answers, setAnswers] = useState<Answers>({})

  const visible = visibleQuestions(answers)
  const complete = isComplete(answers)
  const result = determineJurisdiction(answers)
  const supported = isSupported(answers)

  function answer(questionId: QuestionId, optionId: string) {
    setAnswers((prev) => {
      // When the employer type or work province changes, clear downstream
      // answers that may no longer be relevant (e.g., switching from QC to
      // ON should clear the qcLanguage answer).
      const next: Answers = { ...prev, [questionId]: optionId }
      if (questionId === 'employerType' || questionId === 'workProvince') {
        delete next.qcLanguage
      }
      return next
    })
  }

  function reset() {
    setAnswers({})
  }

  return (
    <MarketingPageShell>
      <Seo route="jurisdictionTool" pageType="WebPage" />
      <PageHero
        eyebrow={t('jur_tool_eyebrow')}
        title={t('jur_tool_h1')}
        intro={t('jur_tool_intro')}
      />

      <section className="mx-auto max-w-[720px] px-6 pb-12">
        {/* Questions */}
        <div className="flex flex-col gap-[24px]">
          {visible.map((q, i) => (
            <fieldset
              key={q.id}
              className="rounded-[12px] border border-border bg-inset px-[20px] py-[18px]"
            >
              <legend className="mb-[12px] flex items-center gap-[8px]">
                <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-gold-fg text-[12px] font-semibold text-surface">
                  {i + 1}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  {t('jur_tool_step')} {i + 1} {t('jur_tool_of')} {visible.length}
                </span>
              </legend>
              <p className="mb-[14px] text-[15px] leading-[1.55] text-text">{x(q.prompt)}</p>
              <div className="flex flex-col gap-[8px]">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.id
                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center gap-[10px] rounded-[8px] border px-[14px] py-[10px] text-[14px] transition-colors ${
                        selected
                          ? 'border-gold-fg bg-gold-fg/10 text-text'
                          : 'border-border bg-surface text-text-2 hover:border-text-faint'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={selected}
                        onChange={() => answer(q.id, opt.id)}
                        className="h-[16px] w-[16px] accent-gold-fg"
                      />
                      <span className="font-medium">{x(opt.label)}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {/* Result */}
        {complete && result && (
          <div className="mt-[24px] rounded-[12px] border border-gold-fg/40 bg-gold-fg/5 px-[24px] py-[20px]">
            <div className="mb-[16px] flex items-center gap-[10px]">
              <MapPin size={20} className="text-gold-strong" aria-hidden="true" />
              <h2 className="m-0 text-[16px] font-semibold text-text">
                {t('jur_tool_result_heading')}
              </h2>
            </div>
            <dl className="m-0 flex flex-col gap-[14px]">
              <div>
                <dt className="mb-[4px] text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  {t('jur_tool_result_statute')}
                </dt>
                <dd className="m-0 text-[15px] font-medium text-text">{x(result.statute)}</dd>
              </div>
              <div>
                <dt className="mb-[4px] text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  {t('jur_tool_result_explanation')}
                </dt>
                <dd className="m-0 text-[14px] leading-[1.6] text-text-2">
                  {x(result.explanation)}
                </dd>
              </div>
              <div>
                <dt className="mb-[4px] text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  {t('jur_tool_result_source')}
                </dt>
                <dd className="m-0">
                  <a
                    href={result.officialSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-[6px] text-[14px] font-semibold text-gold-strong hover:underline"
                  >
                    {x(result.officialSource.label)}
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Unsupported jurisdiction */}
        {complete && !supported && (
          <div className="mt-[24px] rounded-[12px] border border-border bg-inset px-[24px] py-[20px]">
            <h2 className="mb-[8px] text-[16px] font-semibold text-text">
              {t('jur_tool_unsupported_heading')}
            </h2>
            <p className="m-0 text-[14px] leading-[1.6] text-text-2">
              {t('jur_tool_unsupported_body')}
            </p>
          </div>
        )}

        {/* Reset + disclaimer */}
        {complete && (
          <div className="mt-[20px] flex flex-col gap-[16px]">
            <button
              onClick={reset}
              className="inline-flex items-center gap-[6px] self-start text-[13px] font-semibold text-text-muted hover:text-text"
            >
              <RotateCcw size={14} aria-hidden="true" />
              {t('jur_tool_reset')}
            </button>
            <div className="flex items-start gap-2.5 border-t border-border pt-5">
              <Info size={14} className="mt-0.5 flex-none text-gold-strong" aria-hidden="true" />
              <span className="text-[12.5px] leading-[1.6] text-text-3">{t('disclaimer_full')}</span>
            </div>
          </div>
        )}
      </section>

      <PageCta
        title={t('jur_tool_cta_title')}
        body={t('jur_tool_cta_body')}
        action={t('jur_tool_cta_btn')}
        to={p('pricing')}
      />
    </MarketingPageShell>
  )
}

// Re-export for the route table's lazy import
export default JurisdictionToolPage
