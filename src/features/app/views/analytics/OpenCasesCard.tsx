import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { casesMessages } from '@/i18n/messages/cases'
import { fill } from '@/lib/format'
import type { ProductionCase, ProductionCaseType } from '@/features/app/views/cases/productionApi'
import { AnalyticsCard, CardEmpty } from './AnalyticsCard'
import { CardData } from './CardData'
import type { ModuleDep } from './moduleRows'
import { OpenCaseRows } from './OpenCaseRows'
import { StatTile } from './StatTile'
import { formatDayISO, intlLocale } from './format'

const TYPE_LABEL: Record<ProductionCaseType, (typeof casesMessages)[keyof typeof casesMessages]> = {
  Termination: casesMessages.cases_prod_type_termination,
  Performance: casesMessages.cases_prod_type_performance,
  Accommodation: casesMessages.cases_prod_type_accommodation,
  Onboarding: casesMessages.cases_prod_type_onboarding,
}

type ProductionCaseWithOpened = ProductionCase & { openedISO: string }

/** Open cases — count / average age / oldest, then the aging rows. */
export function OpenCasesCard({
  hidden,
  deps,
  aging,
}: {
  readonly hidden: boolean
  readonly deps: readonly ModuleDep[]
  readonly aging: {
    readonly openCount: number
    readonly avgDays: number
    readonly oldestDays: number
    readonly rows: readonly { caseRow: ProductionCaseWithOpened; daysOpen: number }[]
  } | null
}) {
  const { x, lang } = useI18n()
  const locale = intlLocale(lang)
  return (
    <AnalyticsCard title={x(M.analytics_cases_title)} hidden={hidden}>
      <CardData deps={deps} skeletonLines={4}>
        {() =>
          aging === null ? (
            <CardEmpty text={x(M.analytics_cases_empty)} />
          ) : (
            <>
              <div className="mb-[12px] flex gap-[10px]">
                <StatTile value={String(aging.openCount)} label={x(M.analytics_cases_open_now)} />
                <StatTile value={String(aging.avgDays)} label={x(M.analytics_cases_avg_age)} />
                <StatTile
                  value={String(aging.oldestDays)}
                  label={x(M.analytics_cases_oldest)}
                  alert={aging.oldestDays > 14}
                />
              </div>
              <OpenCaseRows
                rows={aging.rows.map(({ caseRow, daysOpen }) => ({
                  key: caseRow.id,
                  href: `/app/cases/${caseRow.id}`,
                  typeLabel: x(TYPE_LABEL[caseRow.caseType]),
                  jurisdiction: caseRow.jurisdiction,
                  openedLabel: fill(x(M.analytics_cases_opened), {
                    date: formatDayISO(caseRow.openedISO, locale),
                  }),
                  daysOpen,
                  daysLabel:
                    daysOpen === 1
                      ? x(M.analytics_cases_day_one)
                      : fill(x(M.analytics_cases_days), { n: daysOpen }),
                }))}
              />
            </>
          )
        }
      </CardData>
    </AnalyticsCard>
  )
}
