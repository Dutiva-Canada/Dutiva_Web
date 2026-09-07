import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCommsData } from '../data/useCommsData'
import type { CommsBrandClaim } from '../data/types'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const BRAND_CLAIM_STATUSES: CommsBrandClaim['status'][] = ['active', 'expired', 'rejected']

export function Settings() {
  const { x } = useI18n()
  const { state, canWrite, addBrandClaim, removeBrandClaim } = useCommsData()
  const [open, setOpen] = useState(false)
  const [textEn, setTextEn] = useState('')
  const [textFr, setTextFr] = useState('')
  const [evidenceEn, setEvidenceEn] = useState('')
  const [evidenceFr, setEvidenceFr] = useState('')
  const [owner, setOwner] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  const [status, setStatus] = useState<CommsBrandClaim['status']>('active')

  const reset = () => {
    setOpen(false)
    setTextEn('')
    setTextFr('')
    setEvidenceEn('')
    setEvidenceFr('')
    setOwner('')
    setReviewDate('')
    setStatus('active')
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!textEn && !textFr) return
    const text = { en: textEn, fr: textFr || (textEn ? `[FR review] ${textEn}` : '') }
    const evidence = {
      en: evidenceEn,
      fr: evidenceFr || (evidenceEn ? `[FR review] ${evidenceEn}` : ''),
    }
    addBrandClaim({ text, evidence, owner, reviewDate: reviewDate || undefined, status })
    reset()
  }

  const sortedClaims = useMemo(
    () => [...state.brandClaims].sort((a, b) => a.status.localeCompare(b.status)),
    [state.brandClaims],
  )

  return (
    <div className="flex flex-col gap-[16px]">
      <h2 className="text-[18px] font-semibold text-text">{x(M.comms_settings_title)}</h2>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] flex items-center justify-between gap-[12px]">
          <h3 className="text-[15px] font-semibold text-text">{x(M.comms_brand_claims)}</h3>
          {canWrite && !open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
            >
              <Plus size={14} aria-hidden="true" />
              {x(M.comms_brand_claim_add)}
            </button>
          )}
        </div>

        {open && (
          <form onSubmit={onSubmit} className="mb-[16px] rounded-[10px] border border-border bg-inset p-[14px]">
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>{x(M.comms_brand_claim_text)} — {x(M.comms_language_en)}</label>
                <input
                  value={textEn}
                  onChange={(e) => setTextEn(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{x(M.comms_brand_claim_text)} — {x(M.comms_language_fr)}</label>
                <input
                  value={textFr}
                  onChange={(e) => setTextFr(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{x(M.comms_brand_claim_evidence)} — {x(M.comms_language_en)}</label>
                <input value={evidenceEn} onChange={(e) => setEvidenceEn(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{x(M.comms_brand_claim_evidence)} — {x(M.comms_language_fr)}</label>
                <input value={evidenceFr} onChange={(e) => setEvidenceFr(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{x(M.comms_content_owner)}</label>
                <input value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{x(M.comms_brand_claim_review_date)}</label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{x(M.comms_brand_claim_status)}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CommsBrandClaim['status'])}
                  className={inputClass}
                >
                  {BRAND_CLAIM_STATUSES.map((s) => (
                    <option key={s} value={s}>{x(M[`comms_claim_status_${s}` as keyof typeof M])}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-[14px] flex gap-[8px]">
              <button
                type="submit"
                className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white"
              >
                {x(M.comms_create)}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text"
              >
                {x(M.comms_cancel)}
              </button>
            </div>
          </form>
        )}

        {sortedClaims.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.comms_settings_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {sortedClaims.map((claim) => (
              <li key={claim.id} className="rounded-[8px] bg-inset p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="text-[14px] font-semibold text-text">{x(claim.text)}</div>
                  <div className="flex items-center gap-[8px]">
                    <span
                      className={statusChipClass(
                        claim.status === 'active' ? 'success' : claim.status === 'expired' ? 'warning' : 'risk',
                      )}
                    >
                      {x(M[`comms_claim_status_${claim.status}` as keyof typeof M])}
                    </span>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => removeBrandClaim(claim.id)}
                        aria-label={x(M.comms_remove)}
                        className="text-text-muted hover:text-risk-fg"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-[6px] text-[12px] text-text-muted">
                  {x(M.comms_claim_evidence)}: {x(claim.evidence)} · {claim.owner}
                  {claim.reviewDate ? ` · ${claim.reviewDate}` : ''}
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
