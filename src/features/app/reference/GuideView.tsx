import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Circle, FileText, Route, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { Disclaimer } from '@/components/Disclaimer'
import { referenceMessages as M } from '@/i18n/messages/reference'
import { jurisdictionInfo, templateByTid } from '@/features/app/documents/data'
import { customTemplateByTid } from '@/features/app/documents/customTemplates'
import { flowBySlug } from '@/features/app/flows/data'
import { guideBySlug } from './data'
import { groupGuideBlocks } from './guideModel'
import type { GuideSection, ReferenceGuide } from './guideModel'
import { AppPage } from '@/features/app/shell/AppPage'

/**
 * Renders an in-product reference guide (docs/FOUR_RING_FRAMEWORK.md).
 *
 * Two things this does that the public article pages deliberately do not: it
 * shows the jurisdiction notes, because the reader has a jurisdiction, and it
 * links out to the templates and flows the guide is background reading for,
 * because the reader is mid-task rather than browsing.
 */

const templateFor = (tid: string) => templateByTid.get(tid) ?? customTemplateByTid.get(tid)

export function GuideView() {
  const { x } = useI18n()
  const { slug } = useParams<{ slug: string }>()
  const guide = slug === undefined ? undefined : guideBySlug.get(slug)

  if (!guide) {
    return (
      <AppPage width="narrow">
        <p className="text-[14px] text-text-2">{x(M.reference_not_found)}</p>
        <BackLink />
      </AppPage>
    )
  }

  return (
    <AppPage width="narrow">
      <article>
        <BackLink />
        <div className="mt-[14px] text-[11.5px] font-bold tracking-[0.04em] text-gold-dot uppercase">
          {x(guide.tag)}
        </div>
        <h1 className="mt-[6px] font-display text-[24px] leading-[1.28] font-bold text-text">
          {x(guide.title)}
        </h1>
        <p className="mt-[8px] text-[14px] leading-[1.6] text-text-2">{x(guide.summary)}</p>
        <div className="mt-[8px] text-[12px] text-text-muted">
          {guide.readingMinutes} {x(M.reference_minutes)}
        </div>

        {guide.sections.map((section, i) => (
          <Section key={i} section={section} />
        ))}

        <JurisdictionNotes guide={guide} />
        <Related guide={guide} />

        <Disclaimer variant="block" className="mt-[22px]" />
      </article>
    </AppPage>
  )
}

function BackLink() {
  const { x } = useI18n()
  return (
    <Link
      to="/app/knowledge"
      className="inline-flex items-center gap-[6px] text-[12.5px] font-semibold text-text-muted"
    >
      <ArrowLeft size={13} strokeWidth={2} aria-hidden="true" />
      {x(M.reference_back)}
    </Link>
  )
}

function Section({ section }: { readonly section: GuideSection }) {
  const { x } = useI18n()
  const groups = groupGuideBlocks(section.blocks)

  return (
    <section className="mt-[26px]">
      <h2 className="font-display text-[17px] leading-[1.35] font-bold text-text">
        {x(section.heading)}
      </h2>
      {groups.map((group, i) => {
        if (group.kind === 'p') {
          return (
            <p key={i} className="mt-[10px] text-[13.5px] leading-[1.65] text-text-2">
              {x(group.text)}
            </p>
          )
        }
        if (group.kind === 'list') {
          return (
            <ul key={i} className="mt-[10px] flex flex-col gap-[7px]">
              {group.items.map((item, j) => (
                <li
                  key={j}
                  className="flex items-start gap-[9px] text-[13.5px] leading-[1.6] text-text-2"
                >
                  <Circle
                    size={5}
                    strokeWidth={0}
                    fill="currentColor"
                    className="mt-[8px] shrink-0 text-gold-dot"
                    aria-hidden="true"
                  />
                  <span>{x(item)}</span>
                </li>
              ))}
            </ul>
          )
        }
        return <Contrast key={i} instead={group.instead} notThis={group.notThis} />
      })}
    </section>
  )
}

/**
 * The do/don't pair. Rendered as two labelled rows rather than a table so it
 * reflows on a narrow screen instead of scrolling sideways.
 */
function Contrast({ instead, notThis }: { readonly instead: Bi; readonly notThis: Bi }) {
  const { x } = useI18n()
  return (
    <div className="mt-[12px] overflow-hidden rounded-[11px] border border-border">
      <div className="flex items-start gap-[9px] border-b border-inset bg-ok-bg px-[14px] py-[11px]">
        <Check
          size={14}
          strokeWidth={2.2}
          className="mt-[2px] shrink-0 text-ok-fg"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold tracking-[0.05em] text-ok-fg uppercase">
            {x(M.reference_instead)}
          </div>
          <div className="mt-[3px] text-[13px] leading-[1.55] text-text-2">{x(instead)}</div>
        </div>
      </div>
      <div className="flex items-start gap-[9px] bg-risk-bg px-[14px] py-[11px]">
        <X
          size={14}
          strokeWidth={2.2}
          className="mt-[2px] shrink-0 text-risk-fg"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold tracking-[0.05em] text-risk-fg uppercase">
            {x(M.reference_not_this)}
          </div>
          <div className="mt-[3px] text-[13px] leading-[1.55] text-text-2">{x(notThis)}</div>
        </div>
      </div>
    </div>
  )
}

function JurisdictionNotes({ guide }: { readonly guide: ReferenceGuide }) {
  const { x } = useI18n()
  const entries = jurisdictionInfo.filter((j) => guide.jurisdictionNotes[j.code] !== undefined)
  if (entries.length === 0) return null

  return (
    <section className="mt-[28px]">
      <h2 className="font-display text-[17px] leading-[1.35] font-bold text-text">
        {x(M.reference_by_jurisdiction)}
      </h2>
      <div className="mt-[12px] flex flex-col gap-[10px]">
        {entries.map((info) => {
          const note = guide.jurisdictionNotes[info.code]
          if (!note) return null
          return (
            <div
              key={info.code}
              className="rounded-[11px] border border-border bg-surface px-[16px] py-[13px]"
            >
              <div className="text-[12px] font-bold text-text">{x(info.name)}</div>
              <div className="mt-[4px] text-[13px] leading-[1.6] text-text-2">{x(note)}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** Where the reader goes next — the whole reason this lives in-product. */
function Related({ guide }: { readonly guide: ReferenceGuide }) {
  const { x } = useI18n()
  const templates = (guide.relatedTemplates ?? []).map(templateFor).filter((t) => t !== undefined)
  const relatedFlows = (guide.relatedFlows ?? [])
    .map((s) => flowBySlug.get(s))
    .filter((f) => f !== undefined)
  if (templates.length === 0 && relatedFlows.length === 0) return null

  return (
    <section className="mt-[28px] rounded-[12px] border border-border bg-bg-soft px-[18px] py-[16px]">
      {relatedFlows.length > 0 && (
        <>
          <div className="text-[11.5px] font-bold tracking-[0.04em] text-text-muted uppercase">
            {x(M.reference_related_flows)}
          </div>
          <div className="mt-[9px] mb-[14px] flex flex-col gap-[7px]">
            {relatedFlows.map((flow) => (
              <Link
                key={flow.slug}
                to={`/app/workflows/${flow.slug}`}
                className="flex items-center gap-[9px] text-[13px] font-semibold text-text"
              >
                <Route
                  size={14}
                  strokeWidth={1.9}
                  className="shrink-0 text-gold-fg"
                  aria-hidden="true"
                />
                <span className="flex-1">{x(flow.title)}</span>
                <span className="text-[12px] text-accent">{x(M.reference_open)}</span>
              </Link>
            ))}
          </div>
        </>
      )}
      {templates.length > 0 && (
        <>
          <div className="text-[11.5px] font-bold tracking-[0.04em] text-text-muted uppercase">
            {x(M.reference_related_templates)}
          </div>
          <div className="mt-[9px] flex flex-col gap-[7px]">
            {templates.map((template) => (
              <Link
                key={template.tid}
                to={`/app/documents/templates/${template.tid}`}
                className="flex items-center gap-[9px] text-[13px] font-semibold text-text"
              >
                <FileText
                  size={14}
                  strokeWidth={1.9}
                  className="shrink-0 text-gold-fg"
                  aria-hidden="true"
                />
                <span className="flex-1">{x(template.name)}</span>
                <span className="text-[12px] text-accent">{x(M.reference_open)}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
