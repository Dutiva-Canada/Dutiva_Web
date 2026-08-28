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
      className="mx-auto max-w-[840px] scroll-mt-[80px] px-4 py-12 sm:px-6 sm:py-16"
    >
      <span className="badge">{lt('landing_faq_badge')}</span>
      <div className="mt-6 grid gap-8">
        {HOME_FAQ_ITEMS.map((item) => (
          <div key={item.q}>
            <h2 className="font-display text-[clamp(1.25rem,2.2vw,1.625rem)] font-semibold tracking-[-0.02em] text-text">
              {lt(item.q)}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-[1.65] text-text-2">{lt(item.a)}</p>
          </div>
        ))}
      </div>
      <Link
        to={p('faq')}
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-strong transition-opacity hover:opacity-80"
      >
        {lt('landing_faq_more')}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  )
}
