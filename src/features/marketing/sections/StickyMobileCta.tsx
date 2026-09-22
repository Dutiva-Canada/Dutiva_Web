import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { usePublicPath } from '@/seo/usePublicPath'
import { useLanding } from '../useLanding'
import { trackMarketingEvent } from '../analytics/track'

/* Sections where the bar would compete with a conversion surface it points at. */
const CONVERSION_ZONE_IDS = ['pricing', 'start']

/**
 * Sticky bottom CTA for mobile — a single "See plans" bar that appears once
 * the hero has scrolled away and hides while the pricing or signup sections
 * are on screen (they carry their own plan CTAs). Desktop keeps the header
 * CTA instead; the bar never mounts there.
 */
export function StickyMobileCta() {
  const { lt } = useLanding()
  const { p } = usePublicPath()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let pastHero = false
    /* Entries only carry sections whose state changed — tracking each target
       separately keeps the flag true while any zone remains on screen. */
    const visibleZones = new Set<string>()
    const update = () => setVisible(pastHero && visibleZones.size === 0)

    const onScroll = () => {
      pastHero = window.scrollY > window.innerHeight * 0.75
      update()
    }
    /* IntersectionObserver is absent in jsdom and very old browsers — without
       it the bar simply never hides inside conversion sections. */
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) visibleZones.add(entry.target.id)
              else visibleZones.delete(entry.target.id)
            }
            update()
          })
    if (observer) {
      for (const id of CONVERSION_ZONE_IDS) {
        const el = document.getElementById(id)
        if (el) observer.observe(el)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-(--topbar-bg) px-4 pt-2.5 pb-[calc(0.625rem_+_env(safe-area-inset-bottom))] backdrop-blur-[18px] transition-transform duration-200 ease-in-out motion-reduce:transition-none min-[901px]:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <Link
        to={p('pricing')}
        tabIndex={visible ? 0 : -1}
        className="gold-button gold-button-block"
        onClick={() =>
          trackMarketingEvent('cta_click', { cta: 'see_plans', location: 'sticky_bar' })
        }
      >
        {lt('landing_start_free')}
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
