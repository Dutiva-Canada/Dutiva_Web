import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { statusChipClass } from '@/components/chips'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCommsData } from '../data/useCommsData'
import type { CommsApprovalDecision, CommsBrandClaim, CommsContentItem } from '../data/types'

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

const BRAND_CLAIM_STATUSES: CommsBrandClaim['status'][] = ['active', 'expired', 'rejected']
const APPROVAL_DECISIONS: CommsApprovalDecision[] = ['approved', 'rejected', 'changes_requested']

const decisionTone = (decision: CommsApprovalDecision) => {
  switch (decision) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'risk'
    case 'changes_requested':
      return 'warning'
  }
}

function ContentItemOption({ item, x }: { item: CommsContentItem; x: (b: import('@/i18n/core').Bi) => string }) {
  return <option value={item.id}>{x(item.title)}</option>
}

function RolesAndApprovals() {
  const { x, lang } = useI18n()
  const { state, canWrite, addApproval, removeApproval } = useCommsData()
  const [open, setOpen] = useState(false)
  const [contentItemId, setContentItemId] = useState('')
  const [approver, setApprover] = useState('')
  const [decision, setDecision] = useState<CommsApprovalDecision>('approved')
  const [rationale, setRationale] = useState('')

  const pending = useMemo(
    () =>
      state.contentItems.filter(
        (c) => c.status !== 'approved' && c.status !== 'superseded' && c.status !== 'withdrawn',
      ),
    [state.contentItems],
  )

  const itemTitle = (id: string) => state.contentItems.find((c) => c.id === id)

  const reset = () => {
    setOpen(false)
    setContentItemId(pending[0]?.id ?? '')
    setApprover('')
    setDecision('approved')
    setRationale('')
  }

  const startApproval = (id: string) => {
    setContentItemId(id)
    setApprover('')
    setDecision('approved')
    setRationale('')
    setOpen(true)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!contentItemId || !approver) return
    const text = rationale.trim()
    const rationaleBi = text
      ? lang === 'fr'
        ? { en: `[EN review] ${text}`, fr: text }
        : { en: text, fr: `[FR review] ${text}` }
      : undefined
    addApproval({
      contentItemId,
      approver,
      decision,
      rationale: rationaleBi,
      decidedAt: new Date().toISOString(),
    })
    reset()
  }

  return (
    <section className="rounded-[12px] border border-border bg-surface p-[16px]">
      <div className="mb-[12px] flex items-center justify-between gap-[12px]">
        <h3 className="text-[15px] font-semibold text-text">{x(M.comms_roles)}</h3>
        {canWrite && !open && pending.length > 0 && (
          <button
            type="button"
            onClick={() => startApproval(pending[0]!.id)}
            className="flex items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} aria-hidden="true" />
            {x(M.comms_approval_record)}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mb-[16px] rounded-[10px] border border-border bg-inset p-[14px]">
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_approval_content_item)}</label>
              <select
                value={contentItemId}
                onChange={(e) => setContentItemId(e.target.value)}
                className={inputClass}
                required
              >
                {pending.map((item) => (
                  <ContentItemOption key={item.id} item={item} x={x} />
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_approval_approver)}</label>
              <input
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_approval_decision)}</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value as CommsApprovalDecision)}
                className={inputClass}
              >
                {APPROVAL_DECISIONS.map((d) => (
                  <option key={d} value={d}>{x(M[`comms_approval_decision_${d}` as keyof typeof M])}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_approval_rationale)}</label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={3}
                className={`${inputClass} resize-y`}
              />
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

      {pending.length === 0 && state.approvals.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.comms_settings_empty)}</p>
      ) : (
        <div className="flex flex-col gap-[14px]">
          {pending.length > 0 && (
            <div>
              <h4 className="mb-[8px] text-[13px] font-semibold text-text-2">{x(M.comms_approval_pending)}</h4>
              <ul className="m-0 flex flex-col gap-[8px] p-0">
                {pending.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-[12px] rounded-[8px] bg-inset p-[10px]">
                    <div>
                      <div className="text-[13.5px] font-semibold text-text">{x(item.title)}</div>
                      <div className="text-[12px] text-text-muted">
                        {x(M[`comms_content_status_${item.status}` as keyof typeof M])}
                      </div>
                    </div>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => startApproval(item.id)}
                        className="rounded-[6px] border-none bg-navy px-[10px] py-[5px] font-sans text-[12px] font-semibold text-white"
                      >
                        {x(M.comms_approval_record)}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.approvals.length > 0 && (
            <div>
              <h4 className="mb-[8px] text-[13px] font-semibold text-text-2">{x(M.comms_approval_history)}</h4>
              <ul className="m-0 flex flex-col gap-[8px] p-0">
                {state.approvals.map((approval) => {
                  const item = itemTitle(approval.contentItemId)
                  return (
                    <li key={approval.id} className="rounded-[8px] bg-inset p-[10px]">
                      <div className="flex items-start justify-between gap-[12px]">
                        <div className="text-[13.5px] font-semibold text-text">
                          {item ? x(item.title) : approval.contentItemId}
                        </div>
                        <div className="flex items-center gap-[8px]">
                          <span className={statusChipClass(decisionTone(approval.decision))}>
                            {x(M[`comms_approval_decision_${approval.decision}` as keyof typeof M])}
                          </span>
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => removeApproval(approval.id)}
                              aria-label={x(M.comms_remove)}
                              className="text-text-muted hover:text-risk-fg"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-[4px] text-[12px] text-text-muted">
                        {approval.approver} · {new Date(approval.decidedAt).toLocaleDateString()}
                      </div>
                      {approval.rationale && (
                        <div className="mt-[6px] text-[12px] text-text-2">{x(approval.rationale)}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

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

      <RolesAndApprovals />

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
