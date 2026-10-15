import '@/features/invest/portal/strategies.css'
import './health.css'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  HeartHandshake,
  HeartPulse,
  Info,
  Leaf,
  MessageCircle,
  Phone,
  Siren,
  Stethoscope,
} from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useHealthHead } from './useHealthHead'

interface ResLink {
  href: string
  label: string
}

function ResLinks({ links }: { links: ResLink[] }) {
  return (
    <p className="hb-res-links">
      {links.map((l) => {
        const external = l.href.startsWith('http')
        /* The icon names the channel — a text line isn't a phone call. */
        const Icon = external
          ? ExternalLink
          : l.href.startsWith('sms:')
            ? MessageCircle
            : Phone
        return (
          <a
            key={l.href + l.label}
            href={l.href}
            className="hb-res-link"
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            <Icon size={12} aria-hidden="true" />
            {l.label}
          </a>
        )
      })}
    </p>
  )
}

function ResourceItem({
  icon,
  name,
  body,
  links,
  urgent,
}: {
  icon: React.ReactNode
  name: string
  body: string
  links?: ResLink[]
  urgent?: boolean
}) {
  return (
    <div className={`hb-res-item${urgent ? ' is-urgent' : ''}`}>
      <span className="hb-res-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="hb-res-name">{name}</p>
        <p className="hb-res-body">{body}</p>
        {links && links.length > 0 && <ResLinks links={links} />}
      </div>
    </div>
  )
}

/**
 * Resources — real support services only. Nothing here presents Dutiva as a
 * provider: the page exists to route users to services that actually respond,
 * with the crisis options physically first. Every number and chat line is a
 * live link — on a phone, in a hard moment, nothing here should need
 * retyping.
 */
export function HealthResourcesPage() {
  const { x, lang } = useI18n()
  useHealthHead(HM.health_res_title, HM.health_res_sub)

  const call = (num: string) => `${x(HM.health_res_call)} ${num}`
  const text = (num: string) => `${x(HM.health_res_text)} ${num}`

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_res_title)}</h1>
      </div>
      <p className="sb-sub">{x(HM.health_res_sub)}</p>

      {/* #crisis — chat's distress note deep-links straight here. */}
      <section id="crisis" aria-labelledby="hb-res-crisis-h" style={{ scrollMarginTop: 80 }}>
        <div className="sb-section-head">
          <h2 id="hb-res-crisis-h">{x(HM.health_res_crisis_title)}</h2>
        </div>
        <div className="hb-crisis">
          <span className="hb-crisis-icon">
            <HeartPulse size={17} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div>
            <p className="hb-crisis-title">{x(HM.health_res_988_name)}</p>
            <p className="hb-crisis-body">{x(HM.health_res_988_body)}</p>
            <ResLinks
              links={[
                { href: 'tel:988', label: call('9-8-8') },
                { href: 'sms:988', label: text('9-8-8') },
              ]}
            />
          </div>
        </div>
        <div className="hb-res" style={{ marginTop: 12 }}>
          <ResourceItem
            urgent
            icon={<Siren size={17} strokeWidth={1.9} />}
            name={x(HM.health_res_911_name)}
            body={x(HM.health_res_911_body)}
            links={[{ href: 'tel:911', label: call('911') }]}
          />
        </div>
      </section>

      <section aria-labelledby="hb-res-talk-h">
        <div className="sb-section-head">
          <h2 id="hb-res-talk-h">{x(HM.health_res_talk_title)}</h2>
        </div>
        <div className="hb-res">
          <ResourceItem
            icon={<HeartHandshake size={17} strokeWidth={1.9} />}
            name={x(HM.health_res_khp_name)}
            body={x(HM.health_res_khp_body)}
            links={[
              { href: 'tel:1-800-668-6868', label: call('1-800-668-6868') },
              { href: 'sms:686868', label: text('686868') },
              /* Live chat is the contact method the under-29 audience
                 actually uses — it gets a link, not just a mention. */
              {
                href:
                  lang === 'fr'
                    ? 'https://jeunessejecoute.ca'
                    : 'https://kidshelpphone.ca/live-chat',
                label: `${x(HM.health_res_chat_online)} — ${
                  lang === 'fr' ? 'jeunessejecoute.ca' : 'kidshelpphone.ca'
                }`,
              },
            ]}
          />
          <ResourceItem
            icon={<Leaf size={17} strokeWidth={1.9} />}
            name={x(HM.health_res_hope_name)}
            body={x(HM.health_res_hope_body)}
            links={[
              { href: 'tel:1-855-242-3310', label: call('1-855-242-3310') },
              {
                href: 'https://www.hopeforwellness.ca',
                label: `${x(HM.health_res_chat_online)} — hopeforwellness.ca`,
              },
            ]}
          />
          <ResourceItem
            icon={<MessageCircle size={17} strokeWidth={1.9} />}
            name={x(HM.health_res_qc_name)}
            body={x(HM.health_res_qc_body)}
            links={[
              { href: 'tel:1-866-277-3553', label: call('1-866-277-3553') },
              { href: 'https://suicide.ca', label: `${x(HM.health_res_chat_online)} — suicide.ca` },
            ]}
          />
          <ResourceItem
            icon={<Stethoscope size={17} strokeWidth={1.9} />}
            name={x(HM.health_res_811_name)}
            body={x(HM.health_res_811_body)}
            links={[{ href: 'tel:811', label: call('8-1-1') }]}
          />
        </div>
      </section>

      <section aria-labelledby="hb-res-prof-h">
        <div className="sb-section-head">
          <h2 id="hb-res-prof-h">{x(HM.health_res_prof_title)}</h2>
        </div>
        <div className="sb-card sb-card-pad">
          <p className="hb-row-body" style={{ margin: 0 }}>
            {x(HM.health_res_prof_body)}
          </p>
        </div>
      </section>

      <div className="sb-note">
        <Info size={16} aria-hidden="true" />
        <span>{x(HM.health_res_note)}</span>
      </div>

      {/* The off-ramp — for the visitor who isn't in crisis and needs the
          thing Dutiva actually is. */}
      <p className="hb-res-mira">
        {x(HM.health_res_mira_line)}{' '}
        <Link to="/health/chat">{x(HM.health_res_mira_link)}</Link>
      </p>
    </div>
  )
}
