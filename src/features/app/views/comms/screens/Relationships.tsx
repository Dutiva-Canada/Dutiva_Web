import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCommsData } from '../data/useCommsData'
import { CONTACT_TYPE_LABEL } from '../commsLabels'

export function Relationships() {
  const { x } = useI18n()
  const { state } = useCommsData()

  return (
    <div className="flex flex-col gap-[16px]">
      <h2 className="text-[18px] font-semibold text-text">{x(M.comms_relationships_title)}</h2>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h3 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_contacts)}</h3>
        {state.contacts.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_relationships_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.contacts.map((contact) => (
              <li key={contact.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="flex items-center justify-between gap-[12px]">
                  <span className="text-[14px] font-semibold text-text">{contact.name}</span>
                  <span className="rounded-[100px] bg-accent-soft px-[8px] py-[2px] text-[11px] font-semibold text-accent">
                    {x(CONTACT_TYPE_LABEL[contact.type])}
                  </span>
                </div>
                {contact.role && <div className="mt-[4px] text-[12px] text-text-muted">{x(contact.role)}</div>}
                {contact.purpose && (
                  <div className="mt-[6px] text-[12px] text-text-2">
                    <span className="font-semibold">{x(M.comms_contact_purpose)}:</span> {x(contact.purpose)}
                  </div>
                )}
                {contact.channelPreference && (
                  <div className="text-[12px] text-text-2">
                    <span className="font-semibold">{x(M.comms_contact_preference)}:</span> {x(contact.channelPreference)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h3 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_organizations)}</h3>
        {state.organizations.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_relationships_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.organizations.map((org) => (
              <li key={org.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="text-[14px] font-semibold text-text">{org.name}</div>
                <div className="text-[12px] text-text-muted">
                  {x(org.type)}
                  {org.jurisdiction ? ` · ${x(org.jurisdiction)}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
