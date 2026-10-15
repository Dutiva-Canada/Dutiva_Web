import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthData } from '../data/HealthDataContext'

/* Full-page failure state — rendered when the initial load produced neither
   data nor a cached snapshot to fall back on. role="alert" announces it;
   Retry re-runs the provider's own refresh. */
export function HealthDataError() {
  const { x } = useI18n()
  const { refresh } = useHealthData()
  const [busy, setBusy] = useState(false)
  return (
    <section className="sb-page">
      <div className="sb-empty" role="alert">
        <CircleAlert size={20} aria-hidden="true" />
        <p>{x(HM.health_load_error)}</p>
        <button
          type="button"
          className="sb-btn"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            void refresh().finally(() => setBusy(false))
          }}
        >
          {x(HM.health_retry)}
        </button>
      </div>
    </section>
  )
}
