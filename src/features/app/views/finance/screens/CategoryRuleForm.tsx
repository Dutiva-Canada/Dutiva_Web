import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import { CATEGORY_MATCH_TYPE_LABEL } from '../financeLabels'
import type { FinanceCategoryMatchType, FinanceWorkspaceState } from '../data/types'

export function CategoryRuleForm({
  state,
  onAdd,
  onCancel,
}: {
  state: FinanceWorkspaceState
  onAdd: (rule: Omit<import('../data/types').FinanceCategoryRule, 'id'>) => Promise<unknown>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const [pattern, setPattern] = useState('')
  const [matchType, setMatchType] = useState<FinanceCategoryMatchType>('contains')
  const [ledgerAccountId, setLedgerAccountId] = useState('')
  const [direction, setDirection] = useState<'debit' | 'credit'>('debit')
  const [priority, setPriority] = useState('50')

  const entityId = state.entities[0]?.id ?? ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pattern || !ledgerAccountId) return
    void onAdd({
      entityId,
      pattern,
      matchType,
      ledgerAccountId,
      direction,
      priority: Number.parseInt(priority, 10) || 0,
      active: true,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[8px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="flex flex-wrap gap-[8px]">
        <input
          type="text"
          placeholder={x(M.finance_rules_pattern)}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="flex-1 rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[12px] text-text"
          required
        />
        <select
          value={matchType}
          onChange={(e) => setMatchType(e.target.value as FinanceCategoryMatchType)}
          className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[12px] text-text"
        >
          {(Object.keys(CATEGORY_MATCH_TYPE_LABEL) as FinanceCategoryMatchType[]).map((mt) => (
            <option key={mt} value={mt}>
              {x(CATEGORY_MATCH_TYPE_LABEL[mt])}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-[8px]">
        <select
          value={ledgerAccountId}
          onChange={(e) => setLedgerAccountId(e.target.value)}
          className="flex-1 rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[12px] text-text"
          required
        >
          <option value="">—</option>
          {state.ledgerAccounts.map((la) => (
            <option key={la.id} value={la.id}>
              {la.code} — {la.name.en}
            </option>
          ))}
        </select>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as 'debit' | 'credit')}
          className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[12px] text-text"
        >
          <option value="debit">{x(M.finance_accounting_debit)}</option>
          <option value="credit">{x(M.finance_accounting_credit)}</option>
        </select>
        <input
          type="number"
          placeholder={x(M.finance_rules_priority)}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-[80px] rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[12px] text-text"
        />
      </div>
      <div className="flex gap-[6px]">
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[10px] py-[4px] text-[12px] font-semibold text-white hover:opacity-90"
        >
          {x(M.finance_rules_add)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-surface px-[10px] py-[4px] text-[12px] font-semibold text-text-2 hover:bg-inset border border-border"
        >
          {x(M.finance_cancel)}
        </button>
      </div>
    </form>
  )
}
