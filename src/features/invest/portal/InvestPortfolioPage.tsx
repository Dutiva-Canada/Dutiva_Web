import './strategies.css'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Loader2, Plus, RefreshCw, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import {
  ASSET_CLASSES,
  type AccountKind,
  type AssetClass,
  type InvestPosition,
} from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import {
  addWatchSymbol,
  createAccount,
  createPosition,
  deletePosition,
  removeWatchSymbol,
  syncPrices,
  updatePosition,
  upsertSnapshot,
} from '@/features/invest/data/api'
import { sendInvestReaction } from '@/features/invest/data/chatApi'
import { TallyNote } from './TallyNote'
import { useInvestHead } from './useInvestHead'

const cardClass = 'sb-card sb-card-pad'
const fieldClass = 'sb-input'
const labelClass = 'sb-flabel'
const btnClass = 'sb-btn sb-btn-primary'

const assetLabel: Record<AssetClass, keyof typeof IM> = {
  equity: 'invest_asset_equity',
  etf: 'invest_asset_etf',
  crypto: 'invest_asset_crypto',
  bond: 'invest_asset_bond',
  cash: 'invest_asset_cash',
  other: 'invest_asset_other',
}

const kindLabel: Record<AccountKind, keyof typeof IM> = {
  paper: 'invest_kind_paper',
  live: 'invest_kind_live',
  external: 'invest_kind_external',
}
const kindHelp: Record<AccountKind, keyof typeof IM> = {
  paper: 'invest_kind_help_paper',
  live: 'invest_kind_help_live',
  external: 'invest_kind_help_external',
}

type PosSortKey = 'symbol' | 'price' | 'value' | 'pnl'

/* A quote older than this reads stale rather than current — the sync runs
   daily, so past ~3 days means the symbol fell out of the feed. */
const STALE_MS = 3 * 86_400_000

/** Portfolios tab — accounts, positions, manual price updates. */
export function InvestPortfolioPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useInvestData()
  useInvestHead(IM.invest_seo_title_portfolio, IM.invest_seo_desc_portfolio)
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: 'CAD',
      }),
    [lang],
  )
  const fmtQty = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { maximumFractionDigits: 4 }),
    [lang],
  )
  const fmtDay = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' }),
    [lang],
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [syncNote, setSyncNote] = useState<string | undefined>()
  const [tallyLine, setTallyLine] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: PosSortKey; dir: 1 | -1 }>({ key: 'symbol', dir: 1 })

  const syncNow = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const r = await syncPrices()
      setSyncNote(
        r.failed.length > 0
          ? x(IM.invest_sync_partial).replace('{symbols}', r.failed.join(', '))
          : x(IM.invest_sync_done).replace('{count}', String(r.synced)),
      )
      await refresh()
    } catch {
      setError(x(IM.invest_error_generic))
    } finally {
      setBusy(false)
    }
  }

  /* A just-added symbol would sit at '—' until the next scheduled sync —
     pull quotes in the background, then reload shared state when they land.
     Best-effort: a failed pull leaves the honest dash, never a fake price. */
  const priceSyncInflight = useRef(false)
  const priceInBackground = () => {
    if (priceSyncInflight.current) return
    priceSyncInflight.current = true
    void syncPrices()
      .then(() => refresh())
      .catch(() => {})
      .finally(() => {
        priceSyncInflight.current = false
      })
  }

  /* Real quotes only — a position with no snapshot and no synced last_price
     renders '—', never its cost basis dressed up as a market price. */
  const rows = useMemo(
    () =>
      state.positions.map((p) => {
        const snap = state.snapshots.find(
          (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
        )
        const px = snap?.price ?? p.lastPrice ?? null
        const pxAt = snap?.asOf ?? p.lastPriceAt
        return {
          p,
          px,
          pxAt,
          stale: pxAt !== null && Date.now() - Date.parse(pxAt) > STALE_MS,
          value: px === null ? null : p.quantity * px,
          pnl: px === null ? null : (px - p.avgCost) * p.quantity,
          pnlPct: px === null || p.avgCost === 0 ? null : (px / p.avgCost - 1) * 100,
        }
      }),
    [state.positions, state.snapshots],
  )

  const sorted = useMemo(() => {
    const val = (r: (typeof rows)[number]): string | number | null =>
      sort.key === 'symbol' ? r.p.symbol : sort.key === 'price' ? r.px : sort.key === 'value' ? r.value : r.pnl
    return [...rows].sort((a, b) => {
      const av = val(a)
      const bv = val(b)
      if (av === null) return bv === null ? 0 : 1
      if (bv === null) return -1
      const cmp = typeof av === 'string' ? av.localeCompare(String(bv)) : av - (bv as number)
      return cmp * sort.dir
    })
  }, [rows, sort])

  const totals = useMemo(() => {
    let cost = 0
    let pricedCost = 0
    let value = 0
    let unpriced = 0
    for (const r of rows) {
      const basis = r.p.quantity * r.p.avgCost
      cost += basis
      if (r.value === null || r.pnl === null) {
        unpriced++
      } else {
        pricedCost += basis
        value += r.value
      }
    }
    const pnl = value - pricedCost
    return { cost, value, pnl, unpriced, pnlPct: pricedCost === 0 ? null : (pnl / pricedCost) * 100 }
  }, [rows])

  const toggleSort = (key: PosSortKey) =>
    setSort((s) => ({
      key,
      dir: s.key === key ? ((-s.dir) as 1 | -1) : key === 'symbol' ? 1 : -1,
    }))

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      await refresh()
    } catch {
      setError(x(IM.invest_error_generic))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="sb sb-page flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--sb-muted)' }} aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="sb sb-page">
      <div className="sb-head-row">
        <h1>{x(IM.invest_tab_portfolios)}</h1>
        <button
          type="button"
          disabled={busy}
          onClick={() => void syncNow()}
          className="sb-btn sb-btn-secondary sb-btn-sm"
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw size={14} aria-hidden="true" />
          )}
          {busy ? x(IM.invest_syncing) : x(IM.invest_sync_prices)}
        </button>
      </div>
      {error && (
        <p role="alert" className="sb-helper" style={{ color: 'var(--sb-danger)' }}>
          {error}
        </p>
      )}
      {syncNote && !error && (
        <p role="status" className="sb-helper">
          {syncNote}
        </p>
      )}

      <section className={cardClass} style={{ marginTop: 18 }}>
        <h2 style={{ margin: '0 0 14px' }}>{x(IM.invest_accounts_title)}</h2>
        <AccountForm
          busy={busy}
          onCreate={(input) =>
            run(async () => {
              await createAccount(input)
              /* Tally notices — best-effort; a throttled or failed reaction
                 never disturbs the save. */
              sendInvestReaction(
                { type: 'account_added', name: input.name, kind: input.kind },
                lang,
                setTallyLine,
              )
                .then((r) => {
                  if (r.reply) setTallyLine(r.reply)
                })
                .catch(() => {})
            })
          }
        />
        {state.accounts.length === 0 ? (
          <p className="sb-empty">{x(IM.invest_accounts_empty)}</p>
        ) : (
          <ul className="sb-tiles">
            {state.accounts.map((a) => (
              <li key={a.id} className="sb-tile">
                <p className="t-name" style={{ margin: 0 }}>{a.name}</p>
                <p className="t-sub" style={{ margin: '3px 0 0' }}>
                  {x(IM[kindLabel[a.kind]])} · {fmt.format(a.cashBalance)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass} style={{ marginTop: 16 }}>
        <h2 style={{ margin: 0 }}>{x(IM.invest_positions_title)}</h2>
        {/* Positions are manual tracking records — say so up front so the
            section never reads as a brokerage sync. */}
        <p className="sb-helper" style={{ margin: '4px 0 14px' }}>{x(IM.invest_positions_manual)}</p>
        {state.accounts.length > 0 ? (
          <PositionForm
            busy={busy}
            accounts={state.accounts}
            onCreate={(input) =>
              run(async () => {
                await createPosition(input)
                priceInBackground()
                sendInvestReaction(
                  { type: 'position_logged', symbol: input.symbol, quantity: input.quantity },
                  lang,
                  setTallyLine,
                )
                  .then((r) => {
                    if (r.reply) setTallyLine(r.reply)
                  })
                  .catch(() => {})
              })
            }
          />
        ) : (
          <p className="sb-helper" style={{ marginTop: 10 }}>
            {x(IM.invest_positions_need_account)}
          </p>
        )}
        {state.positions.length === 0 ? (
          <p className="sb-empty">{x(IM.invest_positions_empty)}</p>
        ) : (
          <div className="sb-table-wrap" style={{ marginTop: 14 }}>
            <table className="sb-table sb-table-positions">
              <thead>
                <tr>
                  <SortTh label={x(IM.invest_field_symbol)} k="symbol" num={false} sort={sort} onToggle={toggleSort} />
                  <th>{x(IM.invest_field_asset_class)}</th>
                  <th className="num">{x(IM.invest_field_quantity)}</th>
                  <th className="num">{x(IM.invest_field_avg_cost)}</th>
                  <SortTh label={x(IM.invest_field_last_price)} k="price" sort={sort} onToggle={toggleSort} />
                  <SortTh label={x(IM.invest_field_value)} k="value" sort={sort} onToggle={toggleSort} />
                  <SortTh label={x(IM.invest_field_pnl)} k="pnl" sort={sort} onToggle={toggleSort} />
                  <th />
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ p, px, pxAt, stale, value, pnl, pnlPct }) => (
                  <tr key={p.id}>
                    <td>
                      <span className="strong">{p.symbol}</span>
                      <span className="dim" style={{ marginLeft: 6 }}>{p.name}</span>
                      {p.currency && p.currency !== 'CAD' && (
                        <span className="dim" style={{ marginLeft: 6 }}>{p.currency}</span>
                      )}
                    </td>
                    <td>{x(IM[assetLabel[p.assetClass]])}</td>
                    <td className="num">{fmtQty.format(p.quantity)}</td>
                    <td className="num">{fmt.format(p.avgCost)}</td>
                    <td className="num">
                      {px === null ? (
                        <span className="dim">—</span>
                      ) : (
                        <>
                          {fmt.format(px)}
                          {stale && pxAt !== null && (
                            <span className="dim" style={{ marginLeft: 4, fontSize: 11 }}>
                              · {x(IM.invest_price_asof)} {fmtDay.format(Date.parse(pxAt))}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="num strong">
                      {value === null ? <span className="dim">—</span> : fmt.format(value)}
                    </td>
                    <td
                      className="num"
                      style={
                        pnl === null
                          ? undefined
                          : { color: pnl >= 0 ? 'var(--sb-ok)' : 'var(--sb-danger)' }
                      }
                    >
                      {pnl === null ? (
                        <span className="dim">—</span>
                      ) : (
                        <>
                          {pnl >= 0 ? '+' : ''}
                          {fmt.format(pnl)}{' '}
                          <span className="dim">
                            ({pnlPct !== null && pnlPct >= 0 ? '+' : ''}
                            {pnlPct?.toFixed(1)}%)
                          </span>
                        </>
                      )}
                    </td>
                    <td>
                      {/* nowrap — three stacked pills would blow the row
                          height out; the table already scrolls sideways. */}
                      <span className="sb-row-actions sb-row-actions-nowrap">
                        <PositionEditor
                          busy={busy}
                          position={p}
                          onSave={(input) => run(() => updatePosition(p.id, input))}
                        />
                        <PriceEditor
                          busy={busy}
                          buttonLabel={`${x(IM.invest_set_price)} ${p.symbol}`}
                          onSave={(price) =>
                            run(() =>
                              upsertSnapshot({
                                assetClass: p.assetClass,
                                symbol: p.symbol,
                                price,
                              }),
                            )
                          }
                        />
                        <RemovePosition
                          busy={busy}
                          ariaLabel={`${x(IM.invest_rule_remove)} ${p.symbol}`}
                          onRemove={() => run(() => deletePosition(p.id))}
                        />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="strong">{x(IM.invest_positions_total)}</td>
                  <td />
                  <td />
                  <td className="num">{fmt.format(totals.cost)}</td>
                  <td />
                  <td className="num strong">{fmt.format(totals.value)}</td>
                  <td
                    className="num"
                    style={{ color: totals.pnl >= 0 ? 'var(--sb-ok)' : 'var(--sb-danger)' }}
                  >
                    {totals.pnl >= 0 ? '+' : ''}
                    {fmt.format(totals.pnl)}{' '}
                    <span className="dim">
                      ({totals.pnlPct !== null && totals.pnlPct >= 0 ? '+' : ''}
                      {totals.pnlPct?.toFixed(1)}%)
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
            {totals.unpriced > 0 && (
              <p className="sb-helper" style={{ margin: '8px 0 0' }}>
                {x(IM.invest_positions_no_quote)}
              </p>
            )}
          </div>
        )}
      </section>

      <section className={cardClass} style={{ marginTop: 16 }}>
        <h2 style={{ margin: 0 }}>{x(IM.invest_watchlist_title)}</h2>
        <p className="sb-helper" style={{ margin: '4px 0 14px' }}>{x(IM.invest_watchlist_sub)}</p>
        <WatchForm
          busy={busy}
          onAdd={(input) =>
            run(async () => {
              await addWatchSymbol(input)
              priceInBackground()
              /* Tally notices — best-effort: a throttled or failed reaction
                 returns null and never disturbs the save. Her line also
                 lands in the chat thread. */
              sendInvestReaction({ type: 'watch_added', symbol: input.symbol }, lang, setTallyLine)
                .then((r) => {
                  if (r.reply) setTallyLine(r.reply)
                })
                .catch(() => {})
            })
          }
        />
        {tallyLine && <TallyNote line={tallyLine} />}
        {state.watchlist.length === 0 ? (
          <p className="sb-empty">{x(IM.invest_watchlist_empty)}</p>
        ) : (
          <ul className="sb-chips">
            {state.watchlist.map((w) => (
              <li key={w.id} className="sb-chip-sym">
                {w.symbol}
                {w.name && w.name !== w.symbol && (
                  <span className="dim" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.name}
                  </span>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => removeWatchSymbol(w.id))}
                  aria-label={`${x(IM.invest_rule_remove)} ${w.symbol}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function WatchForm({
  busy,
  onAdd,
}: {
  busy: boolean
  onAdd: (input: { assetClass: AssetClass; symbol: string; name?: string }) => Promise<void>
}) {
  const { x } = useI18n()
  const [assetClass, setAssetClass] = useState<AssetClass>('equity')
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!symbol.trim()) return
    void onAdd({
      assetClass,
      symbol: symbol.trim(),
      name: name.trim() || undefined,
    }).then(() => {
      setSymbol('')
      setName('')
    })
  }

  return (
    <form onSubmit={submit} className="sb-form-grid">
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-watch-class">
          {x(IM.invest_field_asset_class)}
        </label>
        <select
          id="inv-watch-class"
          value={assetClass}
          onChange={(e) => setAssetClass(e.target.value as AssetClass)}
          className={fieldClass}
        >
          {ASSET_CLASSES.map((cls) => (
            <option key={cls} value={cls}>
              {x(IM[assetLabel[cls]])}
            </option>
          ))}
        </select>
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-watch-symbol">
          {x(IM.invest_field_symbol)}
        </label>
        <input
          id="inv-watch-symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="SHOP.TO, BTC…"
          className={fieldClass}
          required
        />
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-watch-name">
          {x(IM.invest_field_name)}
        </label>
        <input
          id="inv-watch-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="sb-form-actions">
        <button type="submit" disabled={busy || !symbol.trim()} className={btnClass}>
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          {x(IM.invest_watchlist_add)}
        </button>
      </div>
    </form>
  )
}

function AccountForm({
  busy,
  onCreate,
}: {
  busy: boolean
  onCreate: (input: { name: string; kind: AccountKind; cashBalance?: number }) => Promise<void>
}) {
  const { x } = useI18n()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<AccountKind>('paper')
  const [cash, setCash] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    void onCreate({
      name: name.trim(),
      kind,
      cashBalance: cash ? Number(cash) : 0,
    }).then(() => {
      setName('')
      setCash('')
    })
  }

  return (
    <form onSubmit={submit} className="sb-form-grid">
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-acc-name">
          {x(IM.invest_account_name)}
        </label>
        <input
          id="inv-acc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-acc-kind">
          {x(IM.invest_account_kind)}
        </label>
        <select
          id="inv-acc-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as AccountKind)}
          className={fieldClass}
          aria-describedby="inv-acc-kind-help"
        >
          {(['paper', 'live', 'external'] as const).map((k) => (
            <option key={k} value={k}>
              {x(IM[kindLabel[k]])}
            </option>
          ))}
        </select>
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-acc-cash">
          {x(IM.invest_ov_cash)}
        </label>
        <input
          id="inv-acc-cash"
          type="number"
          min="0"
          step="0.01"
          value={cash}
          onChange={(e) => setCash(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="sb-form-actions">
        <button type="submit" disabled={busy || !name.trim()} className={btnClass}>
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          {x(IM.invest_add_account)}
        </button>
      </div>
      <p
        id="inv-acc-kind-help"
        aria-live="polite"
        className="sb-helper"
        style={{ gridColumn: '1 / -1', margin: 0 }}
      >
        {x(IM[kindHelp[kind]])}
      </p>
    </form>
  )
}

function PositionForm({
  busy,
  accounts,
  onCreate,
}: {
  busy: boolean
  accounts: { id: string; name: string }[]
  onCreate: (input: {
    accountId: string
    assetClass: AssetClass
    symbol: string
    name: string
    quantity: number
    avgCost: number
  }) => Promise<void>
}) {
  const { x } = useI18n()
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [assetClass, setAssetClass] = useState<AssetClass>('equity')
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [avgCost, setAvgCost] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!accountId || !symbol.trim() || !quantity || !avgCost) return
    void onCreate({
      accountId,
      assetClass,
      symbol: symbol.trim(),
      name: name.trim() || symbol.trim().toUpperCase(),
      quantity: Number(quantity),
      avgCost: Number(avgCost),
    }).then(() => {
      setSymbol('')
      setName('')
      setQuantity('')
      setAvgCost('')
    })
  }

  return (
    <form onSubmit={submit} className="sb-form-grid">
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-pos-acc">
          {x(IM.invest_accounts_title)}
        </label>
        <select
          id="inv-pos-acc"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className={fieldClass}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-pos-class">
          {x(IM.invest_field_asset_class)}
        </label>
        <select
          id="inv-pos-class"
          value={assetClass}
          onChange={(e) => setAssetClass(e.target.value as AssetClass)}
          className={fieldClass}
        >
          {ASSET_CLASSES.map((cls) => (
            <option key={cls} value={cls}>
              {x(IM[assetLabel[cls]])}
            </option>
          ))}
        </select>
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-pos-symbol">
          {x(IM.invest_field_symbol)}
        </label>
        <input
          id="inv-pos-symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-pos-name">
          {x(IM.invest_field_name)}
        </label>
        <input
          id="inv-pos-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-pos-qty">
          {x(IM.invest_field_quantity)}
        </label>
        <input
          id="inv-pos-qty"
          type="number"
          min="0"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-pos-cost">
          {x(IM.invest_field_avg_cost)}
        </label>
        <input
          id="inv-pos-cost"
          type="number"
          min="0"
          step="any"
          value={avgCost}
          onChange={(e) => setAvgCost(e.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="sb-form-actions">
        <button type="submit" disabled={busy || !accountId || !symbol.trim()} className={btnClass}>
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          {x(IM.invest_add_position)}
        </button>
      </div>
    </form>
  )
}

function SortTh({
  label,
  k,
  num = true,
  sort,
  onToggle,
}: {
  label: string
  k: PosSortKey
  num?: boolean
  sort: { key: PosSortKey; dir: 1 | -1 }
  onToggle: (k: PosSortKey) => void
}) {
  const active = sort.key === k
  return (
    <th
      className={num ? 'num' : undefined}
      aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
    >
      <button type="button" className="sb-th-sort" onClick={() => onToggle(k)}>
        {label}
        {active &&
          (sort.dir === 1 ? (
            <ArrowUp size={10} aria-hidden="true" />
          ) : (
            <ArrowDown size={10} aria-hidden="true" />
          ))}
      </button>
    </th>
  )
}

function PositionEditor({
  busy,
  position,
  onSave,
}: {
  busy: boolean
  position: InvestPosition
  onSave: (input: { name: string; quantity: number; avgCost: number }) => Promise<void>
}) {
  const { x } = useI18n()
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [avgCost, setAvgCost] = useState('')
  const [name, setName] = useState('')

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setQuantity(String(position.quantity))
          setAvgCost(String(position.avgCost))
          setName(position.name)
          setOpen(true)
        }}
        className="sb-btn sb-btn-secondary sb-btn-sm"
        aria-label={`${x(IM.invest_edit)} ${position.symbol}`}
      >
        {x(IM.invest_edit)}
      </button>
    )
  }
  return (
    <span className="sb-row-actions">
      <input
        type="number"
        min="0"
        step="any"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="sb-input sb-input-sm"
        style={{ width: 82 }}
        aria-label={x(IM.invest_field_quantity)}
      />
      <input
        type="number"
        min="0"
        step="any"
        value={avgCost}
        onChange={(e) => setAvgCost(e.target.value)}
        className="sb-input sb-input-sm"
        style={{ width: 96 }}
        aria-label={x(IM.invest_field_avg_cost)}
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="sb-input sb-input-sm"
        style={{ width: 130 }}
        aria-label={x(IM.invest_field_name)}
      />
      <button
        type="button"
        disabled={busy || !quantity || !avgCost}
        onClick={() =>
          void onSave({
            name: name.trim() || position.name,
            quantity: Number(quantity),
            avgCost: Number(avgCost),
          }).then(() => setOpen(false))
        }
        className="sb-btn sb-btn-primary sb-btn-sm"
      >
        {x(IM.invest_save)}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="sb-btn sb-btn-secondary sb-btn-sm"
        aria-label={x(IM.invest_cancel)}
      >
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  )
}

function RemovePosition({
  busy,
  ariaLabel,
  onRemove,
}: {
  busy: boolean
  ariaLabel: string
  onRemove: () => Promise<void>
}) {
  const { x } = useI18n()
  const [confirming, setConfirming] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])
  return (
    <button
      type="button"
      disabled={busy}
      aria-label={ariaLabel}
      onClick={() => {
        if (!confirming) {
          setConfirming(true)
          timer.current = setTimeout(() => setConfirming(false), 3000)
          return
        }
        if (timer.current) clearTimeout(timer.current)
        void onRemove()
      }}
      className="sb-btn sb-btn-secondary sb-btn-sm"
    >
      {confirming ? x(IM.invest_remove_confirm) : x(IM.invest_rule_remove)}
    </button>
  )
}

function PriceEditor({
  busy,
  buttonLabel,
  onSave,
}: {
  busy: boolean
  buttonLabel: string
  onSave: (price: number) => Promise<void>
}) {
  const { x } = useI18n()
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState('')

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sb-btn sb-btn-secondary sb-btn-sm"
        aria-label={buttonLabel}
      >
        {x(IM.invest_set_price)}
      </button>
    )
  }
  return (
    <span className="sb-row-actions">
      <input
        type="number"
        min="0"
        step="any"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="sb-input sb-input-sm"
        aria-label={x(IM.invest_field_last_price)}
      />
      <button
        type="button"
        disabled={busy || !price}
        onClick={() =>
          void onSave(Number(price)).then(() => {
            setOpen(false)
            setPrice('')
          })
        }
        className="sb-btn sb-btn-primary sb-btn-sm"
      >
        {x(IM.invest_save)}
      </button>
    </span>
  )
}
