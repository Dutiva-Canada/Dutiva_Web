import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCommsData } from '../data/useCommsData'
import { statusChipClass } from '@/components/chips'

export function Settings() {
  const { x } = useI18n()
  const { state } = useCommsData()

  return (
    <div className="flex flex-col gap-[16px]">
      <h2 className="text-[18px] font-semibold text-text">{x(M.comms_settings_title)}</h2>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h3 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_brand_claims)}</h3>
        {state.brandClaims.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_settings_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {state.brandClaims.map((claim) => (
              <li key={claim.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="text-[14px] font-semibold text-text">{x(claim.text)}</div>
                  <span
                    className={statusChipClass(
                      claim.status === 'active' ? 'success' : claim.status === 'expired' ? 'warning' : 'risk',
                    )}
                  >
                    {x(M[`comms_claim_status_${claim.status}` as keyof typeof M])}
                  </span>
                </div>
                <div className="mt-[6px] text-[12px] text-text-muted">
                  {x(M.comms_claim_evidence)}: {x(claim.evidence)} · {claim.owner}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h3 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_roles)}</h3>
        <p className="text-[13px] text-text-muted">{x(M.comms_settings_empty)}</p>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h3 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_integrations)}</h3>
        <p className="text-[13px] text-text-muted">{x(M.comms_settings_empty)}</p>
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h3 className="mb-[12px] text-[15px] font-semibold text-text">{x(M.comms_usage_controls)}</h3>
        <p className="text-[13px] text-text-muted">{x(M.comms_settings_empty)}</p>
      </section>
    </div>
  )
}
