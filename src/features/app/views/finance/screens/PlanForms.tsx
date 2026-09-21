import { useState } from 'react'
import { useI18n } from '@/i18n/context'
import { financeMessages as M } from '@/i18n/messages/finance'
import type { FinanceCurrency, FinanceScenarioType } from '../data/types'

/* Create-forms for budgets, scenarios and forecasts — extracted from
   Plans.tsx to keep the screen file under the size budget. */
export function BudgetForm({
  onSubmit,
  onCancel,
  entities,
}: {
  onSubmit: (bud: Omit<import('../data/types').FinanceBudget, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [label, setLabel] = useState('')
  const [owner, setOwner] = useState('')
  const [currency] = useState<FinanceCurrency>('CAD')
  const [lines, setLines] = useState<import('../data/types').FinanceBudgetLine[]>([
    {
      id: `bl-${Date.now()}`,
      department: '',
      period: new Date().toISOString().slice(0, 7),
      amount: '0.00',
      currency: 'CAD',
      actualAmount: '0.00',
      committedAmount: '0.00',
    },
  ])

  const updateLine = (idx: number, patch: Partial<import('../data/types').FinanceBudgetLine>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }
  const addLine = () =>
    setLines((prev) => [
      ...prev,
      {
        id: `bl-${Date.now()}-${prev.length}`,
        department: '',
        period: new Date().toISOString().slice(0, 7),
        amount: '0.00',
        currency: 'CAD',
        actualAmount: '0.00',
        committedAmount: '0.00',
      },
    ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      label: { en: label, fr: label },
      status: 'draft',
      currency,
      lines,
      owner: owner || 'Workspace user',
      version: 1,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.legalName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_budget_label)}</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_budget_owner)}</span>
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Workspace user"
          className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
        />
      </label>
      <div>
        <div className="mb-[6px] text-[12px] font-semibold text-text-muted">
          {x(M.finance_budget_lines)}
        </div>
        <div className="flex flex-col gap-[6px]">
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_100px] items-center gap-[6px]">
              <input
                value={line.department ?? ''}
                onChange={(e) => updateLine(idx, { department: e.target.value })}
                placeholder={x(M.finance_budget_department)}
                className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]"
              />
              <input
                value={line.period}
                onChange={(e) => updateLine(idx, { period: e.target.value })}
                placeholder={x(M.finance_budget_period)}
                className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]"
              />
              <input
                value={line.amount}
                onChange={(e) => updateLine(idx, { amount: e.target.value })}
                placeholder={x(M.finance_budget_amount)}
                className="rounded-[6px] border border-border bg-surface px-[6px] py-[3px] text-[12px]"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLine}
          className="mt-[6px] text-[12px] font-semibold text-accent"
        >
          + {x(M.finance_budget_add_line)}
        </button>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border"
        >
          {x(M.finance_cancel)}
        </button>
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white"
        >
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}

export function ScenarioForm({
  onSubmit,
  onCancel,
  entities,
}: {
  onSubmit: (scn: Omit<import('../data/types').FinanceScenario, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [label, setLabel] = useState('')
  const [type, setType] = useState<FinanceScenarioType>('baseline')
  const [assumptions, setAssumptions] = useState('')
  const [cutoffDate, setCutoffDate] = useState(new Date().toISOString().slice(0, 10))
  const [currency] = useState<FinanceCurrency>('CAD')
  const [projectedRevenue, setProjectedRevenue] = useState('0.00')
  const [projectedExpense, setProjectedExpense] = useState('0.00')
  const [projectedCashFlow, setProjectedCashFlow] = useState('0.00')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      label: { en: label, fr: label },
      type,
      assumptions: { en: assumptions, fr: assumptions },
      cutoffDate,
      currency,
      projectedRevenue: Number(projectedRevenue).toFixed(2),
      projectedExpense: Number(projectedExpense).toFixed(2),
      projectedCashFlow: Number(projectedCashFlow).toFixed(2),
      status: 'draft',
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.legalName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_scenario_type)}</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FinanceScenarioType)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            <option value="baseline">{x(M.finance_scenario_type_baseline)}</option>
            <option value="hiring">{x(M.finance_scenario_type_hiring)}</option>
            <option value="capital_purchase">{x(M.finance_scenario_type_capital_purchase)}</option>
            <option value="financing">{x(M.finance_scenario_type_financing)}</option>
            <option value="operating_change">{x(M.finance_scenario_type_operating_change)}</option>
            <option value="tax">{x(M.finance_scenario_type_tax)}</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_scenario_label)}</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
        />
      </label>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_scenario_assumptions)}</span>
        <input
          value={assumptions}
          onChange={(e) => setAssumptions(e.target.value)}
          className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
        />
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_scenario_cutoff)}</span>
          <input
            type="date"
            value={cutoffDate}
            onChange={(e) => setCutoffDate(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_scenario_revenue)}</span>
          <input
            value={projectedRevenue}
            onChange={(e) => setProjectedRevenue(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_scenario_expense)}</span>
          <input
            value={projectedExpense}
            onChange={(e) => setProjectedExpense(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_scenario_cashflow)}</span>
          <input
            value={projectedCashFlow}
            onChange={(e) => setProjectedCashFlow(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border"
        >
          {x(M.finance_cancel)}
        </button>
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white"
        >
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}

export function ForecastForm({
  onSubmit,
  onCancel,
  entities,
  scenarios,
}: {
  onSubmit: (fc: Omit<import('../data/types').FinanceForecast, 'id'>) => void
  onCancel: () => void
  entities: import('../data/types').FinanceLegalEntity[]
  scenarios: import('../data/types').FinanceScenario[]
}) {
  const { x } = useI18n()
  const [entityId, setEntityId] = useState(entities[0]?.id ?? '')
  const [label, setLabel] = useState('')
  const [type, setType] =
    useState<import('../data/types').FinanceForecast['type']>('monthly_operating')
  const [baselineScenarioId, setBaselineScenarioId] = useState('')
  const [currency] = useState<FinanceCurrency>('CAD')
  const [owner, setOwner] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      entityId,
      label: { en: label, fr: label },
      type,
      baselineScenarioId: baselineScenarioId || undefined,
      currency,
      periods: [],
      owner: owner || 'Workspace user',
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-[12px] flex flex-col gap-[10px] rounded-[10px] bg-inset p-[12px]"
    >
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_invoice_entity)}</span>
          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.legalName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_forecast_type)}</span>
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as import('../data/types').FinanceForecast['type'])
            }
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            <option value="monthly_operating">
              {x(M.finance_forecast_type_monthly_operating)}
            </option>
            <option value="13_week_cash">{x(M.finance_forecast_type_13_week_cash)}</option>
            <option value="custom">{x(M.finance_forecast_type_custom)}</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-[4px]">
        <span className="text-[12px] text-text-muted">{x(M.finance_forecast_label)}</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
        />
      </label>
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">{x(M.finance_forecast_owner)}</span>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Workspace user"
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          />
        </label>
        <label className="flex flex-col gap-[4px]">
          <span className="text-[12px] text-text-muted">Baseline scenario</span>
          <select
            value={baselineScenarioId}
            onChange={(e) => setBaselineScenarioId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] text-[13px]"
          >
            <option value="">—</option>
            {scenarios.map((scn) => (
              <option key={scn.id} value={scn.id}>
                {scn.label.en}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-[8px]">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] bg-inset px-[12px] py-[5px] text-[12px] font-semibold text-text-2 border border-border"
        >
          {x(M.finance_cancel)}
        </button>
        <button
          type="submit"
          className="rounded-[6px] bg-navy px-[12px] py-[5px] text-[12px] font-semibold text-white"
        >
          {x(M.finance_save)}
        </button>
      </div>
    </form>
  )
}
