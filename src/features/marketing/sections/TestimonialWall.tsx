import { useI18n } from '@/i18n/context'
import { SectionIntro } from '../SectionIntro'
import { useLanding } from '../useLanding'
import { publishedTestimonials } from '../testimonials/testimonialEntries'

/**
 * Beta testimonial wall — photo cards with quote, name, and role. Renders
 * nothing until {@link TESTIMONIALS} has published entries (same pattern as
 * review directory links).
 */
export function TestimonialWall() {
  const { lt } = useLanding()
  const { x } = useI18n()
  const entries = publishedTestimonials()

  if (entries.length === 0) return null

  return (
    <section id="testimonials" className="lp-col scroll-mt-20 py-8 sm:py-10">
      <SectionIntro
        badge={lt('landing_testimonials_badge')}
        title={lt('landing_testimonials_title')}
        sub={lt('landing_testimonials_sub')}
      />
      <div className="marketing-auto-grid marketing-auto-grid--260 gap-3">
        {entries.map((entry) => (
          <figure key={entry.id} className="lp-card lp-card-pad flex flex-col">
            <blockquote className="flex-1 text-[0.9375rem] leading-[1.6] text-text">
              &ldquo;{x(entry.quote)}&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              {entry.photoSrc ? (
                <img
                  src={entry.photoSrc}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 place-items-center rounded-full bg-bg-soft text-sm font-semibold text-gold-strong"
                >
                  {entry.firstName.charAt(0)}
                </span>
              )}
              <div>
                <div className="text-sm font-semibold text-text">{entry.firstName}</div>
                <div className="text-xs text-text-3">{x(entry.role)}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
