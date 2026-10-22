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
    <section id="guides" className="lp-col scroll-mt-20 py-8 sm:py-10">
      <SectionIntro
        badge={lt('landing_guides_badge')}
        title={lt('landing_guides_title')}
        sub={lt('landing_guides_sub')}
      />
      {/* Cards link to the guide itself. The teaser copy is the article's own
          title/summary from the article registry, so the landing page, the
          /guides index, and the article can never drift apart. Article
          JSON-LD in LandingPage.tsx is coupled to these cards staying
          visible — see LandingPage.test.tsx. */}
      <div className="lp-card">
        <ul className="lp-mini-list m-0 p-0">
          {GUIDE_ARTICLES.map((guide) => (
            <li key={guide.slug}>
              <Link
                to={articlePath(guide, lang)}
                className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[rgba(127,127,127,0.05)] sm:px-5"
              >
                <BookOpen size={15} className="mt-0.5 flex-none text-gold-strong" />
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] font-semibold text-text group-hover:underline group-hover:underline-offset-2">
                    {x(guide.title)}
                  </span>
                  <span className="mt-0.5 block text-sm leading-[1.5] text-text-2">
                    {x(guide.summary)}
                  </span>
                </span>
                <ArrowRight
                  size={15}
                  className="mt-1 ml-auto flex-none text-text-3"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-5 flex flex-wrap gap-5">
        <a href={p('guides')} className="lp-link">
          {lt('landing_guides_browse')}
          <ArrowRight size={15} aria-hidden="true" />
        </a>
        <Link to={p('blog')} className="lp-link">
          {lt('landing_guides_blog')}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
