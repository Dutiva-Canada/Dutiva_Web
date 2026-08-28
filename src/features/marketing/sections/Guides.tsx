import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import { SectionIntro } from '../SectionIntro'
import { useI18n } from '@/i18n/context'
import { usePublicPath } from '@/seo/usePublicPath'
import { GUIDE_ARTICLES, articlePath } from '../articles'
import { useLanding } from '../useLanding'

export function Guides() {
  const { lt } = useLanding()
  const { x, lang } = useI18n()
  const { p } = usePublicPath()
  return (
    <section id="guides" className="mx-auto max-w-300 scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16">
      <SectionIntro
        badge={lt('landing_guides_badge')}
        title={lt('landing_guides_title')}
        sub={lt('landing_guides_sub')}
      />
      {/* Cards link to the guide itself. The teaser copy is the article's own
          title/summary from the article registry, so the landing page, the
          /guides index, and the article can never drift apart. */}
      <div className="marketing-auto-grid gap-4">
        {GUIDE_ARTICLES.map((guide) => (
          <Link
            key={guide.slug}
            to={articlePath(guide, lang)}
            className="premium-card-soft block p-5.5"
          >
            <div className="flex items-start gap-3">
              <BookOpen size={16} className="mt-0.5 flex-none text-gold-strong" />
              <div>
                <div className="text-[0.9375rem] font-semibold text-text">{x(guide.title)}</div>
                <p className="mt-1.5 text-sm leading-[1.55] text-text-2">{x(guide.summary)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-5">
        <a
          href={p('guides')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
        >
          {lt('landing_guides_browse')}
          <ArrowRight size={16} />
        </a>
        <Link
          to={p('blog')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-2 transition-opacity hover:opacity-80"
        >
          {lt('landing_guides_blog')}
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
