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
    <section
      id="testimonials"
      className="mx-auto max-w-[1200px] scroll-mt-[80px] px-4 py-8 sm:px-6 sm:py-10"
    >
      <SectionIntro
        badge={lt('landing_testimonials_badge')}
        title={lt('landing_testimonials_title')}
        sub={lt('landing_testimonials_sub')}
      />
      <div className="marketing-auto-grid marketing-auto-grid--260 gap-4">
        {entries.map((entry) => (
          <figure key={entry.id} className="premium-card-soft flex flex-col p-6">
            <blockquote className="flex-1 text-[0.9375rem] leading-[1.6] text-text">
              &ldquo;{x(entry.quote)}&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              {entry.photoSrc ? (
                <img
                  src={entry.photoSrc}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 place-items-center rounded-full bg-gold-subtle text-sm font-semibold text-gold-strong"
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
