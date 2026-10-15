import { Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'

/* Shared loading block — the spinner is decorative; role="status" + the
   sr-only label carry the state to screen readers. */
export function HealthLoading() {
  const { x } = useI18n()
  return (
    <div className="flex items-center justify-center py-[80px]" role="status">
      <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      <span className="sr-only">{x(HM.health_loading)}</span>
    </div>
  )
}
