import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { usePublicPath } from '@/seo/usePublicPath'
import { HOME_FAQ_ITEMS } from '../homeFaq'
import { useLanding } from '../useLanding'

/**
 * Buyer-question headings with the answer in the next paragraph. That
 * adjacency is the pattern answer engines lift; do not wrap these in
 * <details> or put chrome between the heading and the answer.
 */
export function HomeFaq() {
  const { lt } = useLanding()
  const { p } = usePublicPath()
  return (
    <section
      id="questions"
      aria-label={lt('landing_faq_badge')}
      className="lp-col scroll-mt-20 py-8 sm:py-10"
    >
      <div className="lp-card lp-card-pad">
        <span className="lp-eyebrow">{lt('landing_faq_badge')}</span>
        <ul className="lp-mini-list m-0 mt-3 p-0">
          {HOME_FAQ_ITEMS.map((item) => (
            <li key={item.q} className="py-4 first:pt-2 last:pb-0">
              <h2 className="text-[1.25rem] leading-[1.25]">{lt(item.q)}</h2>
              <p className="mt-2 text-[0.9375rem] leading-[1.65] text-text-2">{lt(item.a)}</p>
            </li>
          ))}
        </ul>
        <Link to={p('faq')} className="lp-link mt-5">
          {lt('landing_faq_more')}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
