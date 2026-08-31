import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { knowledgeMessages as M } from '@/i18n/messages/knowledge'
import { referenceMessages as R } from '@/i18n/messages/reference'
import { referenceGuides } from '@/features/app/reference/data'
import { knowledgeItems } from '@/data'
import { useRail } from '@/features/app/rail/railContext'
import { GuidanceSourcesPanel } from '@/features/app/guidance/GuidanceSourcesPanel'
import { AppPage } from '@/features/app/shell/AppPage'

/** Northgate fixtures — demo workspace and public `/demo` only. */
export function KnowledgeDemoView() {
  const { x, lang } = useI18n()
  const { openRail } = useRail()
  const [filter, setFilter] = useState('')

  const q = filter.toLowerCase()
  const guides = referenceGuides.filter(
    (g) =>
      !q ||
      pick(g.title, lang).toLowerCase().includes(q) ||
      pick(g.summary, lang).toLowerCase().includes(q) ||
      pick(g.tag, lang).toLowerCase().includes(q),
  )
  const items = knowledgeItems.filter(
    (a) =>
      !q ||
      pick(a.title, lang).toLowerCase().includes(q) ||
      pick(a.tag, lang).toLowerCase().includes(q),
  )

  return (
    <AppPage width="comfort" responsivePad>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={x(M.knowledge_filter_placeholder)}
        aria-label={x(M.knowledge_filter_placeholder)}
        className="mb-[18px] w-full rounded-[10px] border border-border bg-surface px-[16px] py-[11px] font-sans text-[13.5px] text-text"
      />

      {/* Reference guides — real content with bodies, above the fixture
          titles below, which only summon the Advisor rail. Filtered by the
          same query so one search covers the whole view. */}
      {guides.length > 0 && (
        <div className="mb-[22px]">
          <div className="mb-[8px] text-[11px] font-bold tracking-wider text-text-muted uppercase">
            {x(R.reference_section_label)} · {guides.length}
          </div>
          <p className="mb-[10px] text-[12.5px] text-text-muted">{x(R.reference_section_intro)}</p>
          <div data-testid="reference-guides" className="flex flex-col gap-[10px]">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                to={`/app/knowledge/${guide.slug}`}
                className="flex flex-col gap-[4px] rounded-[11px] border border-border bg-surface px-[16px] py-[14px] font-sans"
              >
                <span className="flex items-center gap-[8px]">
                  <BookOpen
                    size={14}
                    strokeWidth={1.9}
                    className="shrink-0 text-gold-fg"
                    aria-hidden="true"
                  />
                  <span className="text-[14px] font-semibold text-text">{x(guide.title)}</span>
                </span>
                <span className="text-[12.5px] leading-[1.5] text-text-2">{x(guide.summary)}</span>
                <span className="text-[12px] text-text-muted">
                  {x(guide.tag)} · {guide.readingMinutes} {x(R.reference_minutes)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div data-testid="knowledge-articles" className="flex flex-col gap-[10px]">
        {items.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => openRail(a.title, { text: a.summary, citations: [] })}
            className="flex cursor-pointer flex-col gap-[4px] rounded-[11px] border border-border bg-surface px-[16px] py-[14px] text-left font-sans"
          >
            <span className="text-[14px] font-semibold text-text">{x(a.title)}</span>
            <span className="text-[12px] text-text-muted">{x(a.tag)}</span>
          </button>
        ))}
      </div>
      <GuidanceSourcesPanel />
    </AppPage>
  )
}
