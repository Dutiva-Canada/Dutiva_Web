import { Check, Globe } from 'lucide-react'
import { SectionIntro } from '../SectionIntro'
import { useLanding } from '../useLanding'
import type { LandingMessageKey } from '../useLanding'

interface Region {
  name: LandingMessageKey
  stat: LandingMessageKey
  items: LandingMessageKey[]
}

const REGIONS: Region[] = [
  {
    name: 'landing_cov_on_name',
    stat: 'landing_cov_on_stat',
    items: [
      'landing_cov_on_1',
      'landing_cov_on_2',
      'landing_cov_on_3',
      'landing_cov_on_4',
      'landing_cov_on_5',
    ],
  },
  {
    name: 'landing_cov_qc_name',
    stat: 'landing_cov_qc_stat',
    items: ['landing_cov_qc_1', 'landing_cov_qc_2', 'landing_cov_qc_3', 'landing_cov_qc_4'],
  },
  {
    name: 'landing_cov_fed_name',
    stat: 'landing_cov_fed_stat',
    items: ['landing_cov_fed_1', 'landing_cov_fed_2', 'landing_cov_fed_3', 'landing_cov_fed_4'],
  },
]

export function Coverage() {
  const { lt } = useLanding()
  return (
    <section id="coverage" className="lp-col scroll-mt-20 py-8 sm:py-10">
      <SectionIntro
        badge={lt('landing_cov_badge')}
        title={lt('landing_cov_title')}
        sub={lt('landing_cov_sub')}
      />
      <div className="marketing-auto-grid marketing-auto-grid--240 gap-3">
        {REGIONS.map((region) => (
          <div key={region.name} className="lp-card lp-card-pad">
            <div className="flex items-center gap-2">
              <Globe size={15} className="text-gold-strong" aria-hidden="true" />
              <span className="text-[0.9375rem] font-semibold text-text">{lt(region.name)}</span>
            </div>
            <div className="mt-0.5 text-xs font-medium text-text-3">{lt(region.stat)}</div>
            <ul className="lp-mini-list m-0 mt-3 p-0">
              {region.items.map((item) => (
                <li key={item} className="lp-check-row py-2">
                  <Check size={13} aria-hidden="true" />
                  {lt(item)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-text-3">{lt('landing_cov_soon')}</p>
    </section>
  )
}
