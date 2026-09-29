import { useMemo, useState, type FormEvent } from 'react'
import { FlaskConical, Plus, TriangleAlert, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import { testScan } from '@/features/invest/data/api'
import {
  cadenceMismatch,
  defaultSignalRule,
  estimateFrequency,
  ruleFireCount,
  scopeIsEmpty,
} from '@/features/invest/data/strategyRules'
import type { InvestStrategy, StrategyCadence, StrategyRule } from '@/features/invest/data/types'
import { RuleCard } from './RuleCard'

const cardClass = 'rounded-[14px] border border-border bg-surface p-[18px]'
const fieldClass =
  'h-[38px] w-full rounded-[9px] border border-border bg-bg px-[11px] text-[13px] text-text outline-none focus:border-navy'
const labelClass = 'mb-[4px] block text-[11.5px] font-semibold text-text-2'
const btnClass =
  'inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-[6px] rounded-[9px] border-none bg-navy px-[14px] text-[13px] font-semibold text-white disabled:opacity-50'
const ghostBtnClass =
  'inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-[6px] rounded-[8px] border border-border bg-transparent px-[11px] text-[12px] font-semibold text-text-2 hover:bg-inset disabled:opacity-50'
const chipClass = (active: boolean) =>
  `cursor-pointer rounded-full px-[11px] py-[5px] text-[11.5px] font-semibold ${
    active
      ? 'border border-navy bg-navy text-white'
      : 'border border-border bg-transparent text-text-2 hover:bg-inset'
  }`

const cadenceLabel: Record<StrategyCadence, keyof typeof IM> = {
  daily: 'invest_cadence_daily',
  weekly: 'invest_cadence_weekly',
  monthly: 'invest_cadence_monthly',
}

export function StrategyForm({
  initial,
  seed,
  drafted,
  busy,
  onSave,
  onCancel,
}: {
  initial: InvestStrategy | null
  seed: Omit<InvestStrategy, 'id'> | null
  drafted: boolean
  busy: boolean
  onSave: (s: Omit<InvestStrategy, 'id'> & { id?: string }) => Promise<void>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const { state } = useInvestData()
  const base = initial ?? seed
  const [name, setName] = useState(base?.name ?? '')
  const [scope, setScope] = useState<InvestStrategy['scope']>(
    base?.scope ?? { watchlist: false, symbols: [] },
  )
  const [cadence, setCadence] = useState<StrategyCadence>(base?.cadence ?? 'daily')
  const [notify, setNotify] = useState<InvestStrategy['notify']>(
    base?.notify ?? { inApp: true, email: false },
  )
  const [enabled, setEnabled] = useState(base?.enabled ?? true)
  const [rules, setRules] = useState<StrategyRule[]>(
    base?.rules && base.rules.length > 0 ? base.rules : [defaultSignalRule()],
  )
  const [scopeError, setScopeError] = useState(false)
  const [symbolInput, setSymbolInput] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  /* Symbols the user already tracks — the pool the scope picks from, and
     the universe a "watchlist" scope resolves to. */
  const trackedSymbols = useMemo(
    () =>
      [
        ...new Set(
          [...state.positions.map((p) => p.symbol), ...state.watchlist.map((w) => w.symbol)].map(
            (s) => s.toUpperCase(),
          ),
        ),
      ].sort(),
    [state.positions, state.watchlist],
  )

  const resolvedSymbols = useMemo(
    () =>
      [
        ...new Set(
          [...(scope.watchlist ? trackedSymbols : []), ...scope.symbols].map((s) =>
            s.toUpperCase(),
          ),
        ),
      ].sort(),
    [scope, trackedSymbols],
  )

  const now = useMemo(() => new Date(), [])
  const warnings = useMemo(() => {
    const w: string[] = []
    if (scopeIsEmpty(scope)) w.push(x(IM.invest_scope_required))
    for (const r of rules) {
      if (cadenceMismatch(r, cadence))
        w.push(
          `${r.title || r.metric}: ${x(IM.invest_cadence_mismatch).replace('{cadence}', x(IM[cadenceLabel[cadence]]).toLowerCase())}`,
        )
    }
    return w
  }, [scope, rules, cadence, x])

  const frequency = useMemo(
    () => estimateFrequency(rules, initial?.id ?? null, state.runs, state.signals, now),
    [rules, initial, state.runs, state.signals, now],
  )

  const addSymbol = (sym: string) => {
    const s = sym.trim().toUpperCase()
    if (!s || scope.symbols.includes(s)) return
    setScope((prev) => ({ ...prev, symbols: [...prev.symbols, s] }))
    setSymbolInput('')
  }

  const setRule = (i: number, rule: StrategyRule) =>
    setRules((prev) => prev.map((r, idx) => (idx === i ? rule : r)))

  const runTestScan = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await testScan({ rules, symbols: resolvedSymbols })
      setTestResult(
        x(IM.invest_test_scan_result)
          .replace('{symbols}', String(res.symbolsScanned.length))
          .replace('{signals}', String(res.signals))
          .replace('{proposals}', String(res.proposals)),
      )
    } catch {
      setTestResult(x(IM.invest_error_generic))
    } finally {
      setTesting(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || rules.length === 0) return
    if (scopeIsEmpty(scope)) {
      setScopeError(true)
      return
    }
    void onSave({
      id: initial?.id,
      name: name.trim(),
      enabled,
      scope,
      rules,
      notify,
      cadence,
      template: seed?.template ?? initial?.template ?? '',
    })
  }

  return (
    <form onSubmit={submit} className={`${cardClass} flex flex-col gap-[14px]`}>
      {drafted && (
        <p className="m-0 rounded-[9px] border border-border bg-inset px-[11px] py-[8px] text-[12px] text-text-2">
          {x(IM.invest_ai_review)}
        </p>
      )}

      <div className="flex flex-wrap gap-[10px]">
        <div className="min-w-[200px] flex-1">
          <label className={labelClass} htmlFor="inv-str-name">
            {x(IM.invest_strategy_name)}
          </label>
          <input
            id="inv-str-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            required
          />
        </div>
        <div className="w-[160px]">
          <label className={labelClass} htmlFor="inv-str-cadence">
            {x(IM.invest_cadence_label)}
          </label>
          <select
            id="inv-str-cadence"
            value={cadence}
            onChange={(e) => setCadence(e.target.value as StrategyCadence)}
            className={fieldClass}
          >
            {(['daily', 'weekly', 'monthly'] as const).map((c) => (
              <option key={c} value={c}>
                {x(IM[cadenceLabel[c]])}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scope — required, directly under the name. */}
      <div>
        <span className={labelClass}>{x(IM.invest_scope_title)}</span>
        <div className="flex flex-wrap items-center gap-[6px]">
          <button
            type="button"
            aria-pressed={scope.watchlist}
            onClick={() => {
              setScope((prev) => ({ ...prev, watchlist: !prev.watchlist }))
              setScopeError(false)
            }}
            className={chipClass(scope.watchlist)}
          >
            {x(IM.invest_scope_watchlist)}
          </button>
          <span className="flex items-center gap-[6px] text-[11.5px] font-semibold text-text-2">
            {x(IM.invest_scope_symbols)}
          </span>
        </div>
        <div className="mt-[8px] flex flex-wrap items-center gap-[6px]">
          {scope.symbols.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-[5px] rounded-full border border-border bg-inset px-[9px] py-[3px] text-[11.5px] font-semibold text-text-2"
            >
              {s}
              <button
                type="button"
                aria-label={`${x(IM.invest_delete)} ${s}`}
                onClick={() =>
                  setScope((prev) => ({ ...prev, symbols: prev.symbols.filter((v) => v !== s) }))
                }
                className="inline-flex cursor-pointer items-center border-none bg-transparent p-0 text-text-muted hover:text-risk-fg"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSymbol(symbolInput)
              }
            }}
            placeholder={x(IM.invest_scope_add_placeholder)}
            aria-label={x(IM.invest_scope_symbols)}
            className="h-[30px] w-[170px] rounded-[8px] border border-border bg-bg px-[9px] text-[11.5px] text-text outline-none focus:border-navy"
            list="inv-tracked-symbols"
          />
          <datalist id="inv-tracked-symbols">
            {trackedSymbols
              .filter((s) => !scope.symbols.includes(s))
              .map((s) => (
                <option key={s} value={s} />
              ))}
          </datalist>
        </div>
        {scopeError && (
          <p
            role="alert"
            className="m-0 mt-[6px] flex items-center gap-[5px] text-[11.5px] font-semibold text-risk-fg"
          >
            <TriangleAlert size={12} aria-hidden="true" />
            {x(IM.invest_scope_required)}
          </p>
        )}
      </div>

      {/* Rules — stacked cards, each one reads as a sentence. */}
      <div>
        <span className={labelClass}>{x(IM.invest_strategy_rules)}</span>
        <div className="flex flex-col gap-[8px]">
          {rules.map((r, i) => (
            <RuleCard
              key={i}
              rule={r}
              cadence={cadence}
              fireCount={ruleFireCount(r, initial?.id ?? null, state.runs, state.signals, now)}
              canRemove={rules.length > 1}
              onChange={(rule) => setRule(i, rule)}
              onRemove={() => setRules((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRules((prev) => [...prev, defaultSignalRule()])}
          className={`${ghostBtnClass} mt-[8px]`}
        >
          <Plus size={13} aria-hidden="true" />
          {x(IM.invest_rule_add)}
        </button>
        <p className="m-0 mt-[8px] text-[11.5px] leading-normal text-text-muted">
          {x(IM.invest_proposal_guarantee)}
        </p>
      </div>

      {/* Notify via — per-strategy delivery destinations. */}
      <div>
        <span className={labelClass}>{x(IM.invest_notify_via)}</span>
        <div className="flex flex-wrap gap-[6px]">
          <button
            type="button"
            aria-pressed={notify.inApp}
            onClick={() => setNotify((prev) => ({ ...prev, inApp: !prev.inApp }))}
            className={chipClass(notify.inApp)}
          >
            {x(IM.invest_notify_in_app)}
          </button>
          <button
            type="button"
            aria-pressed={notify.email}
            onClick={() => setNotify((prev) => ({ ...prev, email: !prev.email }))}
            className={chipClass(notify.email)}
          >
            {x(IM.invest_notify_email)}
          </button>
        </div>
      </div>

      {/* Health — estimated firing, warnings, dry-run scan. */}
      <div className="rounded-[10px] border border-border bg-inset p-[12px]">
        <p className="m-0 text-[12px] font-semibold text-text">{x(IM.invest_health_title)}</p>
        <p className="m-0 mt-[4px] text-[11.5px] text-text-2">
          {frequency === null
            ? x(IM.invest_health_no_history)
            : x(IM.invest_health_frequency).replace('{count}', String(frequency.perWeek))}
        </p>
        {warnings.length > 0 && (
          <ul className="m-0 mt-[6px] flex list-none flex-col gap-[3px] p-0">
            {warnings.map((w, i) => (
              <li
                key={i}
                className="flex items-center gap-[5px] text-[11.5px] font-semibold text-risk-fg"
              >
                <TriangleAlert size={12} aria-hidden="true" />
                {w}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
          <button
            type="button"
            disabled={busy || testing || scopeIsEmpty(scope)}
            onClick={() => void runTestScan()}
            className={ghostBtnClass}
          >
            <FlaskConical size={13} aria-hidden="true" />
            {x(IM.invest_test_scan)}
          </button>
          {testResult && <p className="m-0 text-[11.5px] text-text-2">{testResult}</p>}
        </div>
      </div>

      <label className="flex items-center gap-[8px] text-[12.5px] font-semibold text-text-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-[16px] w-[16px] accent-navy"
        />
        {x(IM.invest_enabled_hint)}
      </label>

      <div className="flex gap-[8px]">
        <button
          type="submit"
          disabled={busy || !name.trim() || rules.length === 0}
          className={btnClass}
        >
          {x(IM.invest_save)}
        </button>
        <button type="button" onClick={onCancel} className={ghostBtnClass}>
          {x(IM.invest_cancel_order)}
        </button>
      </div>
    </form>
  )
}
