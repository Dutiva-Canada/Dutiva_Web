import '@/features/invest/portal/strategies.css'
import './health.css'
import { HeartHandshake, HeartPulse, Info, Phone } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthHead } from './useHealthHead'

function ResourceItem({
  icon,
  name,
  body,
}: {
  icon: React.ReactNode
  name: string
  body: string
}) {
  return (
    <div className="hb-res-item">
      <span className="hb-res-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="hb-res-name">{name}</p>
        <p className="hb-res-body">{body}</p>
      </div>
    </div>
  )
}

/**
 * Resources — real support services only. Nothing here presents Dutiva as a
 * provider: the page exists to route users to services that actually respond,
 * with the crisis options physically first.
 */
export function HealthResourcesPage() {
  const { x } = useI18n()
  useHealthHead(HM.health_res_title, HM.health_res_sub)

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_res_title)}</h1>
      </div>
      <p className="sb-sub">{x(HM.health_res_sub)}</p>

      <div className="sb-section-head">
        <h2>{x(HM.health_res_crisis_title)}</h2>
      </div>
      <div className="hb-crisis" role="note">
        <span className="hb-crisis-icon">
          <HeartPulse size={17} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <div>
          <p className="hb-crisis-title">{x(HM.health_res_988_name)}</p>
          <p className="hb-crisis-body">{x(HM.health_res_988_body)}</p>
        </div>
      </div>
      <section className="hb-res" style={{ marginTop: 12 }}>
        <ResourceItem
          icon={<Phone size={17} strokeWidth={1.9} />}
          name={x(HM.health_res_911_name)}
          body={x(HM.health_res_911_body)}
        />
      </section>

      <div className="sb-section-head">
        <h2>{x(HM.health_res_talk_title)}</h2>
      </div>
      <section className="hb-res">
        <ResourceItem
          icon={<HeartHandshake size={17} strokeWidth={1.9} />}
          name={x(HM.health_res_khp_name)}
          body={x(HM.health_res_khp_body)}
        />
        <ResourceItem
          icon={<HeartHandshake size={17} strokeWidth={1.9} />}
          name={x(HM.health_res_hope_name)}
          body={x(HM.health_res_hope_body)}
        />
        <ResourceItem
          icon={<HeartHandshake size={17} strokeWidth={1.9} />}
          name={x(HM.health_res_qc_name)}
          body={x(HM.health_res_qc_body)}
        />
        <ResourceItem
          icon={<Phone size={17} strokeWidth={1.9} />}
          name={x(HM.health_res_811_name)}
          body={x(HM.health_res_811_body)}
        />
      </section>

      <div className="sb-section-head">
        <h2>{x(HM.health_res_prof_title)}</h2>
      </div>
      <section className="sb-card sb-card-pad">
        <p className="hb-row-body" style={{ margin: 0 }}>
          {x(HM.health_res_prof_body)}
        </p>
      </section>

      <div className="sb-note">
        <Info size={16} aria-hidden="true" />
        <span>{x(HM.health_res_note)}</span>
      </div>
    </div>
  )
}
