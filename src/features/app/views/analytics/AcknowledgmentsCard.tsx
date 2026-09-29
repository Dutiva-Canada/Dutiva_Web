import { useI18n } from '@/i18n/context'
import { analyticsMessages as M } from '@/i18n/messages/analytics'
import { AnalyticsCard, CardEmpty } from './AnalyticsCard'

/**
 * Policy acknowledgments — no tracking data source in production yet; the
 * card states that plainly instead of hiding.
 */
export function AcknowledgmentsCard({ hidden }: { readonly hidden: boolean }) {
  const { x } = useI18n()
  return (
    <AnalyticsCard title={x(M.analytics_ack_title)} hidden={hidden}>
      <CardEmpty text={x(M.analytics_ack_empty)} />
    </AnalyticsCard>
  )
}
