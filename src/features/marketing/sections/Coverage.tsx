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
  {
    name: 'landing_cov_rem_name',
    stat: 'landing_cov_rem_stat',
    items: ['landing_cov_rem_1', 'landing_cov_rem_2', 'landing_cov_rem_3', 'landing_cov_rem_4'],
  },
]

export function Coverage() {
  const { lt } = useLanding()
  return (
    <section
      id="coverage"
      className="mx-auto max-w-[1200px] scroll-mt-[80px] px-4 py-12 sm:px-6 sm:py-16"
    >
      <SectionIntro
        badge={lt('landing_cov_badge')}
        title={lt('landing_cov_title')}
        sub={lt('landing_cov_sub')}
      />
      <div className="marketing-auto-grid marketing-auto-grid--240 gap-4">
        {REGIONS.map((region) => (
          <div key={region.name} className="rounded-[22px] border border-border bg-bg-elevated p-6">
            <div className="inline-flex items-center gap-2">
              <Globe size={16} className="text-gold-strong" />
              <span className="text-base font-semibold text-text">{lt(region.name)}</span>
            </div>
            <div className="mt-1 mb-4 text-xs font-medium text-text-3">{lt(region.stat)}</div>
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {region.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-text-2">
                  <Check size={14} className="mt-[3px] flex-none text-gold-strong" />
                  {lt(item)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm text-text-3">{lt('landing_cov_soon')}</p>
    </section>
  )
}
