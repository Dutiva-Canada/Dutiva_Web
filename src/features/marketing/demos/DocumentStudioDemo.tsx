import { Link } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { DocPaper } from '@/features/app/documents/components'
import { useI18n } from '@/i18n/context'
import { usePublicPath } from '@/seo/usePublicPath'
import {
  buildTemplatePreview,
  compactDocPaperProps,
  demoAnswerDisplay,
  templateByTid,
} from '../demos/templatePreviewModel'
import { useLanding } from '../useLanding'

const STUDIO_DEMO_TID = 'T01'
const WIZARD_QUESTION_IDS = ['employee_name', 'position_title', 'start_date'] as const

/** Static Document Studio frame on the landing `#product` section. */
export function DocumentStudioDemo() {
  const { lt } = useLanding()
  const { x, lang } = useI18n()
  const { p } = usePublicPath()
  const preview = buildTemplatePreview(STUDIO_DEMO_TID, lang)
  const template = templateByTid(STUDIO_DEMO_TID)
  if (!preview || !template) return null

  const docPreview = compactDocPaperProps(preview, lang)

  const wizardSteps = WIZARD_QUESTION_IDS.map((id) => template.questions.find((q) => q.id === id)).filter(
    (question): question is NonNullable<typeof question> => question !== undefined,
  )

  return (
    <div className="mt-10 rounded-[22px] border border-border bg-bg-elevated p-4 sm:p-6">
      <div className="mb-5">
        <div className="text-sm font-semibold text-text">{lt('landing_studio_demo_title')}</div>
        <p className="mt-1.5 text-sm leading-[1.55] text-text-2">{lt('landing_studio_demo_intro')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="rounded-xl border border-border bg-bg-soft p-4">
          <div className="mb-3 text-xs font-bold tracking-[0.14em] text-text-muted uppercase">
            {lt('landing_studio_demo_wizard')}
          </div>
          <ol className="grid gap-3">
            {wizardSteps.map((question, index) => (
              <li
                key={question.id}
                className="rounded-lg border border-border bg-bg-elevated px-3.5 py-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
                  <CircleCheck size={12} className="text-ok-fg" aria-hidden="true" />
                  {lt('landing_studio_demo_step')} {index + 1}
                  <span className="font-normal normal-case tracking-normal text-text-faint">
                    · {x(question.section)}
                  </span>
                </div>
                <div className="text-sm font-semibold text-text">{x(question.label)}</div>
                <div className="mt-1 text-sm text-text-2">
                  {demoAnswerDisplay(STUDIO_DEMO_TID, question.id, lang) ?? '—'}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.14em] text-text-muted uppercase">
            <span>{lt('landing_studio_demo_output')}</span>
            {docPreview.showBilingualBadge && (
              <span className="rounded-full border border-border bg-inset px-2 py-0.5 text-xs font-semibold tracking-[0.08em] text-text-faint normal-case">
                {lt('landing_studio_demo_bilingual_badge')}
              </span>
            )}
          </div>
          <DocPaper
            blocks={preview.blocks}
            values={docPreview.values}
            bilingual={docPreview.bilingual}
            docLang={docPreview.docLang}
            className="max-h-[480px] overflow-y-auto"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="m-0 text-xs leading-normal text-text-faint">{lt('landing_studio_demo_note')}</p>
        <div className="flex flex-wrap gap-4">
        <Link
          to={`${p('demoWorkspace')}/documents/studio`}
          className="text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
        >
          {lt('landing_open_in_demo')}
        </Link>
        <Link
          to={p('templates')}
          className="text-sm font-semibold text-text-2 transition-opacity hover:text-gold-strong hover:opacity-80"
        >
          {lt('landing_studio_demo_samples_link')}
        </Link>
        </div>
      </div>
    </div>
  )
}
