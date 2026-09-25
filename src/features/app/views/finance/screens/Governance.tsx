import { useMemo } from 'react'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { useFinanceData } from '../data/useFinanceData'
import { LEGAL_FORM_LABEL } from '../financeLabels'

/**
 * Board-oriented finance governance view: the cap table (entities +
 * ownership edges), the capital-partner roster with commitment totals,
 * and the full audit trail. Everything is derived from existing finance
 * state — there is no separate governance table.
 */
export function Governance() {
  const { x } = useI18n()
  const { state } = useFinanceData()

  const capRows = useMemo(() => {
    const byId = new Map(state.entities.map((e) => [e.id, e]))
    return state.entities
      .map((e) => ({
        entity: e,
        parent: e.parentEntityId ? (byId.get(e.parentEntityId) ?? null) : null,
      }))
      .sort((a, b) => {
        const aRoot = a.parent ? 1 : 0
        const bRoot = b.parent ? 1 : 0
        return aRoot - bRoot
      })
  }, [state.entities])

  const partners = useMemo(
    () =>
      state.parties
        .filter((p) => p.type === 'investor' || p.type === 'lender')
        .map((p) => {
          const commitments = state.commitments.filter((c) => c.partyId === p.id)
          const byCurrency = new Map<string, { committed: number; called: number }>()
          for (const c of commitments) {
            const entry = byCurrency.get(c.currency) ?? { committed: 0, called: 0 }
            entry.committed += Number(c.committed)
            entry.called += Number(c.called)
            byCurrency.set(c.currency, entry)
          }
          return { party: p, count: commitments.length, byCurrency }
        })
        .sort((a, b) => b.count - a.count),
    [state.parties, state.commitments],
  )

  const auditEvents = useMemo(
    () => [...state.auditEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [state.auditEvents],
  )

  return (
    <div className="flex flex-col gap-[16px]">
      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">
          {x(M.finance_governance_cap_table)}
        </h2>
        {capRows.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_none)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[8px] p-0">
            {capRows.map(({ entity, parent }) => (
              <li key={entity.id} className="rounded-[8px] bg-inset px-[10px] py-[8px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-text">{entity.legalName}</div>
                    <div className="text-[12px] text-text-muted">
                      {x(LEGAL_FORM_LABEL[entity.legalForm])}
                    </div>
                  </div>
                  {parent && (
                    <span className="shrink-0 text-[11.5px] font-medium text-text-2">
                      {entity.ownershipPct}% · {x(M.finance_governance_parent)}:{' '}
                      {parent.legalName}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">
          {x(M.finance_partners_title)}
        </h2>
        {partners.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_partners_empty)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[10px] p-0">
            {partners.map(({ party, count, byCurrency }) => (
              <li key={party.id} className="rounded-[10px] bg-inset px-[12px] py-[10px]">
                <div className="text-[13px] font-semibold text-text">{party.name}</div>
                <div className="text-[12px] text-text-muted">
                  {x(M[`finance_party_type_${party.type}` as keyof typeof M])}
                  {party.contactName ? ` · ${party.contactName}` : ''}
                  {party.contactEmail ? ` · ${party.contactEmail}` : ''}
                </div>
                {count === 0 ? (
                  <div className="text-[12px] text-text-muted">{x(M.finance_none)}</div>
                ) : (
                  <div className="mt-[4px] flex flex-wrap gap-x-[12px] gap-y-[2px] text-[12px] text-text-muted">
                    {[...byCurrency.entries()].map(([currency, totals]) => (
                      <span key={currency}>
                        {x(M.finance_commitment_committed)} {currency} {totals.committed.toFixed(2)} ·{' '}
                        {x(M.finance_commitment_called)} {currency} {totals.called.toFixed(2)} ·{' '}
                        {x(M.finance_commitment_uncalled)} {currency}{' '}
                        {(totals.committed - totals.called).toFixed(2)}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-border bg-surface p-[16px]">
        <h2 className="mb-[12px] text-[15px] font-semibold text-text">
          {x(M.finance_audit_title)}
        </h2>
        {auditEvents.length === 0 ? (
          <p className="text-[13px] text-text-muted">{x(M.finance_governance_no_audit)}</p>
        ) : (
          <ul className="m-0 flex flex-col gap-[8px] p-0">
            {auditEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex items-start justify-between gap-[12px] rounded-[8px] bg-inset px-[10px] py-[6px]"
              >
                <div className="min-w-0 text-[12px] text-text-muted">
                  <span className="font-semibold text-text">{ev.actor}</span> · {x(ev.action)}
                  {ev.recordType && ` · ${ev.recordType} ${ev.recordId}`}
                  <span className="text-text-2"> · {x(ev.outcome)}</span>
                </div>
                <span className="shrink-0 text-[11px] text-text-muted">
                  {ev.timestamp.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
