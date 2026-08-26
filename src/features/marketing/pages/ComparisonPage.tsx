import { useI18n } from '@/i18n/context'
import { Seo } from '@/seo/Seo'
import {
  comparisonPage,
  type ComparisonCompetitorId,
} from '../comparison/comparisonPages'
import { MarketingPageShell, PageCta, PageHero, PageSection } from './MarketingPage'
import { usePublicPath } from '@/seo/usePublicPath'

interface ComparisonPageProps {
  readonly competitorId: ComparisonCompetitorId
}

/** Shared layout for /vs/hrdownloads and /vs/sixfifty. */
export function ComparisonPage({ competitorId }: ComparisonPageProps) {
  const { t, x } = useI18n()
  const { p } = usePublicPath()
  const page = comparisonPage(competitorId)
  const faqEntries = page.faq.map((item) => ({
    question: x(item.question),
    answer: x(item.answer),
  }))

  return (
    <MarketingPageShell>
      <Seo route={page.seoRouteId} faq={faqEntries} />
      <PageHero eyebrow={x(page.competitorDisplayName)} title={x(page.h1)} intro={x(page.intro)} />

      <PageSection title={t('comparison_col_dimension')}>
        <p className="-mt-3 mb-6 max-w-[68ch] text-sm leading-6 text-text-2">{x(page.competitorNote)}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 pr-4 font-semibold text-text">
                  {t('comparison_col_dimension')}
                </th>
                <th scope="col" className="py-3 px-4 font-semibold text-text">
                  {t('comparison_col_dutiva')}
                </th>
                <th scope="col" className="py-3 pl-4 font-semibold text-text">
                  {x(page.competitorDisplayName)}
                </th>
              </tr>
            </thead>
            <tbody>
              {page.dimensions.map((row) => (
                <tr key={row.id} className="border-b border-border align-top">
                  <th scope="row" className="py-4 pr-4 font-semibold text-text">
                    {x(row.label)}
                  </th>
                  <td className="py-4 px-4 leading-6 text-text-2">{x(row.dutiva)}</td>
                  <td className="py-4 pl-4 leading-6 text-text-2">{x(row.competitor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection title={t('comparison_faq_title')}>
        <div className="grid gap-4">
          {page.faq.map((item) => (
            <div key={item.question.en} className="premium-card-soft p-5">
              <div className="text-sm font-semibold text-text">{x(item.question)}</div>
              <p className="mt-2 text-sm leading-6 text-text-2">{x(item.answer)}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageCta
        title={t('comparison_cta_t')}
        body={t('comparison_cta_p')}
        action={t('comparison_cta_btn')}
        to={p('pricing')}
      />
    </MarketingPageShell>
  )
}

export function VsHrdownloadsPage() {
  return <ComparisonPage competitorId="hrdownloads" />
}

export function VsSixfiftyPage() {
  return <ComparisonPage competitorId="sixfifty" />
}
