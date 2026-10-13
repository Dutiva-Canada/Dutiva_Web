import './strategies.css'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, DollarSign, Loader2, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import {
  ASSET_CLASSES,
  type AccountKind,
  type AssetClass,
  type InvestAccount,
  type InvestPosition,
} from '@/features/invest/data/types'
import { useInvestData } from '@/features/invest/data/InvestDataContext'
import {
  addWatchSymbol,
  createAccount,
  createPosition,
  deleteAccount,
  deletePosition,
  removeWatchSymbol,
  syncPrices,
  updateAccount,
  updatePosition,
  upsertSnapshot,
} from '@/features/invest/data/api'
import { sendInvestReaction } from '@/features/invest/data/chatApi'
import { convertFx, loadFxRates, type FxTable } from '@/features/invest/data/fx'
import { pl } from './strategyUi'
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
/* The currencies a book can be denominated in — covers Canadian + US books
   plus the occasional European holding. */
const CURRENCIES = ['CAD', 'USD', 'EUR'] as const

const kindHelp: Record<AccountKind, keyof typeof IM> = {
  paper: 'invest_kind_help_paper',
  live: 'invest_kind_help_live',
  external: 'invest_kind_help_external',
}

type PosSortKey = 'symbol' | 'account' | 'price' | 'value' | 'pnl'

/* A quote older than this reads stale rather than current — the sync runs
   daily, so past ~3 days means the symbol fell out of the feed. */
const STALE_MS = 3 * 86_400_000

/** Portfolios tab — accounts, positions, manual price updates. */
export function InvestPortfolioPage() {
  const { x, lang } = useI18n()
  const { state, loading, refresh } = useInvestData()
  useInvestHead(IM.invest_seo_title_portfolio, IM.invest_seo_desc_portfolio)
  /* Positions carry their own currency — a USD row must format and total
     as USD, not silently as CAD. */
  const fmtFor = useMemo(() => {
    const cache = new Map<string, Intl.NumberFormat>()
    return (cur: string) => {
      let f = cache.get(cur)
      if (!f) {
        f = new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
          style: 'currency',
          currency: cur,
        })
        cache.set(cur, f)
      }
      return f
    }
  }, [lang])
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
  /* The add form collapses so the positions table leads the section —
     a data page shouldn't open on a wall of empty inputs. */
  const [showPosForm, setShowPosForm] = useState(false)
  /* Paste-import mode — re-entering a lost book row by row was the pain
     point the cascade incident exposed. */
  const [showBulk, setShowBulk] = useState(false)
  /* Removing an account cascades to its positions — the table shows the
     owning account on every row so the blast radius is visible before
     the delete, not discovered after. The column only earns its width
     once a second account exists; with one, every row reads identically
     and the delete confirm already names the cascade. */
  const accountName = useMemo(
    () => new Map(state.accounts.map((a) => [a.id, a.name])),
    [state.accounts],
  )
  const multiAccount = state.accounts.length > 1
  /* Symbol → quote currency, so the add form can suggest the book
     currency that matches the feed instead of defaulting to CAD. */
  const snapCur = useMemo(
    () => new Map(state.snapshots.map((s) => [`${s.assetClass}|${s.symbol}`, s.currency])),
    [state.snapshots],
  )
  /* The newest quote timestamp on the page — freshness should be stated,
     not only implied by the absence of a stale tag. */
  const pricesAsOf = useMemo(
    () =>
      state.snapshots.reduce<string | undefined>(
        (max, s) => (max === undefined || s.asOf > max ? s.asOf : max),
        undefined,
      ),
    [state.snapshots],
  )
  /* ECB reference rates, loaded once — null means 'no rate on file', and
     cross-currency figures stay '—' rather than print a wrong number. */
  const [fx, setFx] = useState<FxTable | null>(null)
  useEffect(() => {
    let live = true
    void loadFxRates().then((t) => {
      if (live) setFx(t)
    })
    return () => {
      live = false
    }
  }, [])

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
     renders '—', never its cost basis dressed up as a market price. A quote
     denominated in another currency converts at the ECB reference rate and
     carries an '≈' marker; with no rate on file it renders '—' too. */
  const rows = useMemo(
    () =>
      state.positions.map((p) => {
        const snap = state.snapshots.find(
          (s) => s.assetClass === p.assetClass && s.symbol === p.symbol,
        )
        const pxNative = snap?.price ?? p.lastPrice ?? null
        const pxAt = snap?.asOf ?? p.lastPriceAt
        const pxCur = snap?.currency ?? p.currency
        const px = pxNative === null ? null : convertFx(pxNative, pxCur, p.currency, fx)
        return {
          p,
          px,
          pxAt,
          pxCur,
          converted: pxNative !== null && px !== null && pxCur !== p.currency,
          noFx: pxNative !== null && px === null,
          stale: pxAt !== null && Date.now() - Date.parse(pxAt) > STALE_MS,
          value: px === null ? null : p.quantity * px,
          pnl: px === null ? null : (px - p.avgCost) * p.quantity,
          pnlPct: px === null || p.avgCost === 0 ? null : (px / p.avgCost - 1) * 100,
        }
      }),
    [state.positions, state.snapshots, fx],
  )

  const sorted = useMemo(() => {
    const val = (r: (typeof rows)[number]): string | number | null =>
      sort.key === 'symbol'
        ? r.p.symbol
        : sort.key === 'account'
          ? (accountName.get(r.p.accountId) ?? '')
          : sort.key === 'price'
            ? r.px
            : sort.key === 'value'
              ? r.value
              : r.pnl
    return [...rows].sort((a, b) => {
      const av = val(a)
      const bv = val(b)
      if (av === null) return bv === null ? 0 : 1
      if (bv === null) return -1
      const cmp = typeof av === 'string' ? av.localeCompare(String(bv)) : av - (bv as number)
      return cmp * sort.dir
    })
  }, [rows, sort, accountName])

  /* Summing across currencies is meaningless — group the totals by the
     position's own currency and render each group's figures. */
  const totals = useMemo(() => {
    const byCur = new Map<string, { cost: number; pricedCost: number; value: number }>()
    const pairs = new Map<string, string>()
    let unpriced = 0
    let noFx = 0
    for (const r of rows) {
      const cur = r.p.currency || 'CAD'
      const t = byCur.get(cur) ?? { cost: 0, pricedCost: 0, value: 0 }
      const basis = r.p.quantity * r.p.avgCost
      t.cost += basis
      if (r.value === null || r.pnl === null) {
        if (r.noFx) noFx++
        else unpriced++
      } else {
        t.pricedCost += basis
        t.value += r.value
        if (r.converted) {
          const rate = convertFx(1, r.pxCur, cur, fx)
          if (rate !== null) pairs.set(`${r.pxCur}→${cur}`, rate.toFixed(4))
        }
      }
      byCur.set(cur, t)
    }
    const groups = [...byCur.entries()].map(([currency, t]) => ({
      currency,
      ...t,
      pnl: t.value - t.pricedCost,
      pnlPct: t.pricedCost === 0 ? null : ((t.value - t.pricedCost) / t.pricedCost) * 100,
    }))
    return {
      groups,
      unpriced,
      noFx,
      pairList: [...pairs.entries()].map(([pair, rate]) => `${pair} ${rate}`).join(' · '),
    }
  }, [rows, fx])

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
      <div className="sb sb-page sb-page-wide flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--sb-muted)' }} aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="sb sb-page sb-page-wide">
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
            {state.accounts.map((a) => {
              const held = state.positions.filter((p) => p.accountId === a.id)
              return (
                <AccountTile
                  key={a.id}
                  account={a}
                  positions={held}
                  busy={busy}
                  balance={fmtFor(a.baseCurrency).format(a.cashBalance)}
                  onSave={(input) => run(() => updateAccount(a.id, input))}
                  onRemove={() =>
                    run(async () => {
                      await deleteAccount(a.id)
                      /* The cascade already fired — say out loud how many
                         positions went with the account, not just 'done'. */
                      setSyncNote(
                        held.length > 0
                          ? x(IM.invest_account_removed_cascade)
                              .replace('{name}', a.name)
                              .replace(
                                '{count}',
                                pl(lang, held.length, IM.invest_position_one, IM.invest_position_many),
                              )
                          : x(IM.invest_account_removed).replace('{name}', a.name),
                      )
                    })
                  }
                />
              )
            })}
          </ul>
        )}
      </section>

      <section className={cardClass} style={{ marginTop: 16 }}>
        <div className="sb-head-row">
          <h2 style={{ margin: 0 }}>{x(IM.invest_positions_title)}</h2>
          {state.accounts.length > 0 && !showPosForm && !showBulk && (
            <span style={{ display: 'inline-flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowPosForm(true)}
                className="sb-btn sb-btn-secondary sb-btn-sm"
              >
                <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
                {x(IM.invest_add_position)}
              </button>
              <button
                type="button"
                onClick={() => setShowBulk(true)}
                className="sb-btn sb-btn-secondary sb-btn-sm"
              >
                {x(IM.invest_bulk_add)}
              </button>
            </span>
          )}
        </div>
        {/* Positions are manual tracking records — say so up front so the
            section never reads as a brokerage sync. */}
        <p className="sb-helper" style={{ margin: '4px 0 14px' }}>{x(IM.invest_positions_manual)}</p>
        {state.accounts.length === 0 ? (
          <p className="sb-helper" style={{ marginTop: 10 }}>
            {x(IM.invest_positions_need_account)}
          </p>
        ) : showBulk ? (
          <BulkAddForm
            busy={busy}
            accounts={state.accounts}
            onCancel={() => setShowBulk(false)}
            onCreate={async ({ accountId, assetClass, currency, lines }) => {
              /* 'SYMBOL, qty, cost[, CUR]' per line. Bad lines (unparseable,
                 dup against the book or within the batch) go back into the
                 box untouched so the person fixes them in place. */
              const held = new Set(
                state.positions.map((p) => `${p.accountId}|${p.assetClass}|${p.symbol}`),
              )
              const batch = new Set<string>()
              const bad: string[] = []
              const good: Parameters<typeof createPosition>[0][] = []
              for (const raw of lines) {
                const t = raw.trim()
                if (!t) continue
                const [symS, qtyS, costS, curS] = t.split(',').map((s) => s.trim())
                const sym = (symS ?? '').toUpperCase()
                const qty = Number(qtyS)
                const cost = Number(costS)
                const cur = curS ? curS.toUpperCase() : currency
                const key = `${accountId}|${assetClass}|${sym}`
                if (
                  !sym ||
                  !qtyS ||
                  !costS ||
                  !(qty > 0) ||
                  !(cost >= 0) ||
                  (curS !== undefined && !/^[A-Za-z]{3}$/.test(curS)) ||
                  held.has(key) ||
                  batch.has(key)
                ) {
                  bad.push(raw)
                  continue
                }
                batch.add(key)
                good.push({
                  accountId,
                  assetClass,
                  symbol: sym,
                  name: sym,
                  quantity: qty,
                  avgCost: cost,
                  currency: cur,
                })
              }
              if (good.length > 0) {
                await run(async () => {
                  for (const input of good) await createPosition(input)
                  /* Stay open when lines were skipped — closing would
                     drop the very lines the note says are still there. */
                  if (bad.length === 0) setShowBulk(false)
                  priceInBackground()
                })
                setSyncNote(
                  x(IM.invest_bulk_done).replace(
                    '{count}',
                    pl(lang, good.length, IM.invest_position_one, IM.invest_position_many),
                  ) +
                    (bad.length > 0
                      ? ' ' + x(IM.invest_bulk_skipped).replace('{count}', String(bad.length))
                      : ''),
                )
              } else if (bad.length > 0) {
                setError(x(IM.invest_bulk_skipped).replace('{count}', String(bad.length)))
              }
              return bad
            }}
          />
        ) : (
          showPosForm && (
            <PositionForm
              busy={busy}
              accounts={state.accounts}
              quoteCurrency={(cls, sym) =>
                snapCur.get(`${cls}|${sym.trim().toUpperCase()}`)
              }
              onCancel={() => setShowPosForm(false)}
              onCreate={async (input) => {
                /* The unique key is (account, class, symbol) — re-adding an
                   existing row would silently overwrite its numbers, so the
                   form refuses and points at the Edit control instead. */
                const sym = input.symbol.toUpperCase()
                const dup = state.positions.some(
                  (p) =>
                    p.accountId === input.accountId &&
                    p.assetClass === input.assetClass &&
                    p.symbol === sym,
                )
                if (dup) {
                  setError(x(IM.invest_position_exists).replace('{symbol}', sym))
                  return false
                }
                let created = false
                await run(async () => {
                  await createPosition(input)
                  created = true
                  setSyncNote(x(IM.invest_position_added).replace('{symbol}', sym))
                  setShowPosForm(false)
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
                return created
              }}
            />
          )
        )}
        {state.positions.length === 0 ? (
          <p className="sb-empty">{x(IM.invest_positions_empty)}</p>
        ) : (
          <div className="sb-table-wrap" style={{ marginTop: 14 }}>
            <table className="sb-table sb-table-positions">
              <thead>
                <tr>
                  <SortTh label={x(IM.invest_field_symbol)} k="symbol" num={false} sort={sort} onToggle={toggleSort} />
                  {multiAccount && (
                    <SortTh label={x(IM.invest_field_account)} k="account" num={false} sort={sort} onToggle={toggleSort} />
                  )}
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
                {sorted.map(({ p, px, pxAt, stale, converted, value, pnl, pnlPct }) => (
                  <tr key={p.id}>
                    <td>
                      <span className="strong">{p.symbol}</span>
                      <span className="dim" style={{ marginLeft: 6 }}>{p.name}</span>
                      {p.currency && p.currency !== 'CAD' && (
                        <span className="dim" style={{ marginLeft: 6 }}>{p.currency}</span>
                      )}
                    </td>
                    {multiAccount && (
                      <td className="dim">{accountName.get(p.accountId) ?? '—'}</td>
                    )}
                    <td>{x(IM[assetLabel[p.assetClass]])}</td>
                    <td className="num">{fmtQty.format(p.quantity)}</td>
                    <td className="num">{fmtFor(p.currency).format(p.avgCost)}</td>
                    <td className="num">
                      {px === null ? (
                        <span className="dim">—</span>
                      ) : (
                        <>
                          {converted && <span className="dim">≈ </span>}
                          {fmtFor(p.currency).format(px)}
                          {stale && pxAt !== null && (
                            <span className="dim" style={{ marginLeft: 4, fontSize: 11 }}>
                              · {x(IM.invest_price_asof)} {fmtDay.format(Date.parse(pxAt))}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="num strong">
                      {value === null ? (
                        <span className="dim">—</span>
                      ) : (
                        <>
                          {converted && <span className="dim">≈ </span>}
                          {fmtFor(p.currency).format(value)}
                        </>
                      )}
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
                          {converted && <span className="dim">≈ </span>}
                          {pnl >= 0 ? '+' : ''}
                          {fmtFor(p.currency).format(pnl)}{' '}
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
                                /* A hand-entered price is in the position's
                                   book currency — tagging it 'CAD' always
                                   would feed the FX conversion a lie. */
                                currency: p.currency,
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
                  {multiAccount && <td />}
                  <td />
                  <td />
                  {/* Currency groups stack one per line — inline '·'
                      separators read as a single blended figure. */}
                  <td className="num">
                    {totals.groups.map((g) => (
                      <div key={g.currency}>{fmtFor(g.currency).format(g.cost)}</div>
                    ))}
                  </td>
                  <td />
                  <td className="num strong">
                    {totals.groups.map((g) => (
                      <div key={g.currency}>{fmtFor(g.currency).format(g.value)}</div>
                    ))}
                  </td>
                  <td className="num">
                    {totals.groups.map((g) => (
                      <div
                        key={g.currency}
                        style={{ color: g.pnl >= 0 ? 'var(--sb-ok)' : 'var(--sb-danger)' }}
                      >
                        {g.pnl >= 0 ? '+' : ''}
                        {fmtFor(g.currency).format(g.pnl)}{' '}
                        <span className="dim">
                          ({g.pnlPct !== null && g.pnlPct >= 0 ? '+' : ''}
                          {g.pnlPct?.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
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
            {totals.noFx > 0 && (
              <p className="sb-helper" style={{ margin: '4px 0 0' }}>
                {x(IM.invest_positions_no_fx)}
              </p>
            )}
            {totals.pairList && fx && (
              <p className="sb-helper" style={{ margin: '4px 0 0' }}>
                {x(IM.invest_fx_note)
                  .replace('{pairs}', totals.pairList)
                  .replace('{date}', fx.date)}
              </p>
            )}
            {pricesAsOf && (
              <p className="sb-helper" style={{ margin: '4px 0 0' }}>
                {x(IM.invest_prices_as_of).replace(
                  '{time}',
                  new Date(pricesAsOf).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA'),
                )}
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
  onCreate: (input: {
    name: string
    kind: AccountKind
    cashBalance?: number
    baseCurrency?: string
  }) => Promise<void>
}) {
  const { x } = useI18n()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<AccountKind>('paper')
  const [cash, setCash] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('CAD')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    void onCreate({
      name: name.trim(),
      kind,
      cashBalance: cash ? Number(cash) : 0,
      baseCurrency,
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
          placeholder="Paper book"
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
          placeholder="25000"
          className={fieldClass}
        />
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-acc-cur">
          {x(IM.invest_field_currency)}
        </label>
        <select
          id="inv-acc-cur"
          value={baseCurrency}
          onChange={(e) => setBaseCurrency(e.target.value)}
          className={fieldClass}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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

function AccountTile({
  account,
  positions,
  busy,
  balance,
  onSave,
  onRemove,
}: {
  account: InvestAccount
  positions: InvestPosition[]
  busy: boolean
  balance: string
  onSave: (input: {
    name: string
    kind: AccountKind
    cashBalance: number
    baseCurrency: string
  }) => Promise<void>
  onRemove: () => Promise<void>
}) {
  const { x, lang } = useI18n()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<AccountKind>('paper')
  const [cash, setCash] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('CAD')

  if (editing) {
    return (
      <li className="sb-tile">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sb-input sb-input-sm"
          aria-label={x(IM.invest_account_name)}
        />
        <span className="sb-row-actions" style={{ marginTop: 8 }}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as AccountKind)}
            className="sb-input sb-input-sm"
            aria-label={x(IM.invest_account_kind)}
          >
            {(['paper', 'live', 'external'] as const).map((k) => (
              <option key={k} value={k}>
                {x(IM[kindLabel[k]])}
              </option>
            ))}
          </select>
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="sb-input sb-input-sm"
            style={{ width: 76 }}
            aria-label={x(IM.invest_field_currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={cash}
          onChange={(e) => setCash(e.target.value)}
          className="sb-input sb-input-sm"
          style={{ marginTop: 8 }}
          aria-label={x(IM.invest_ov_cash)}
        />
        <span className="sb-row-actions" style={{ marginTop: 8 }}>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() =>
              void onSave({
                name: name.trim(),
                kind,
                cashBalance: cash ? Number(cash) : 0,
                baseCurrency,
              }).then(() => setEditing(false))
            }
            className="sb-btn sb-btn-primary sb-btn-sm"
          >
            {x(IM.invest_save)}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="sb-btn sb-btn-secondary sb-btn-sm"
          >
            {x(IM.invest_cancel)}
          </button>
        </span>
      </li>
    )
  }
  return (
    <li className="sb-tile">
      <p className="t-name" style={{ margin: 0 }}>{account.name}</p>
      <p className="t-sub" style={{ margin: '3px 0 0' }}>
        {x(IM[kindLabel[account.kind]])} · {balance}
      </p>
      <span className="sb-row-actions" style={{ marginTop: 8 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setName(account.name)
            setKind(account.kind)
            setCash(String(account.cashBalance))
            setBaseCurrency(account.baseCurrency || 'CAD')
            setEditing(true)
          }}
          className="sb-btn sb-btn-secondary sb-btn-sm"
          aria-label={`${x(IM.invest_edit)} ${account.name}`}
        >
          {x(IM.invest_edit)}
        </button>
        <RemovePosition
          busy={busy}
          ariaLabel={`${x(IM.invest_rule_remove)} ${account.name}`}
          confirmLabel={x(IM.invest_account_remove_confirm)}
          confirmDetail={
            positions.length > 0 ? (
              <span
                role="note"
                className="sb-helper"
                style={{ margin: 0, alignSelf: 'center', flexBasis: '100%' }}
              >
                {x(IM.invest_account_remove_detail)
                  .replace(
                    '{count}',
                    pl(lang, positions.length, IM.invest_position_one, IM.invest_position_many),
                  )
                  .replace(
                    '{symbols}',
                    positions
                      .slice(0, 3)
                      .map((p) => p.symbol)
                      .join(', ') +
                      (positions.length > 3 ? ` +${positions.length - 3}` : ''),
                  )}
              </span>
            ) : undefined
          }
          onRemove={onRemove}
        />
      </span>
    </li>
  )
}

function PositionForm({
  busy,
  accounts,
  quoteCurrency,
  onCreate,
  onCancel,
}: {
  busy: boolean
  accounts: { id: string; name: string }[]
  /* The symbol's quote currency when one is already on file — the form
     pre-selects it and says why, so a USD feed doesn't get booked as CAD. */
  quoteCurrency: (assetClass: AssetClass, symbol: string) => string | undefined
  /* Returns false when the row wasn't created (dup guard, save error) —
     the form keeps its fields so the person doesn't retype. */
  onCreate: (input: {
    accountId: string
    assetClass: AssetClass
    symbol: string
    name: string
    quantity: number
    avgCost: number
    currency: string
  }) => Promise<boolean>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [assetClass, setAssetClass] = useState<AssetClass>('equity')
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [avgCost, setAvgCost] = useState('')
  const [currency, setCurrency] = useState('CAD')
  /* Once the person picks a currency by hand, a later suggestion doesn't
     override their choice. */
  const [currencyTouched, setCurrencyTouched] = useState(false)
  const suggested = symbol.trim() ? quoteCurrency(assetClass, symbol) : undefined
  useEffect(() => {
    if (suggested && !currencyTouched) setCurrency(suggested)
  }, [suggested, currencyTouched])

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
      currency,
    }).then((ok) => {
      if (!ok) return
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
          {x(IM.invest_field_account)}
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
          placeholder="SHOP.TO, BTC…"
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
          placeholder="Shopify Inc."
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
          placeholder="10"
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
          placeholder="123.45"
          className={fieldClass}
          required
        />
      </div>
      <div className="sb-field">
        <label className={labelClass} htmlFor="inv-pos-cur">
          {x(IM.invest_field_currency)}
        </label>
        <select
          id="inv-pos-cur"
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value)
            setCurrencyTouched(true)
          }}
          className={fieldClass}
          aria-describedby="inv-pos-cur-hint"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {/* Cost basis is self-declared — the quote side converts, but a
            USD statement number entered as CAD silently corrupts P&L, so
            the field says what it's asking for and flags the feed's own
            currency when we know it. */}
        <p id="inv-pos-cur-hint" className="sb-helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
          {suggested
            ? x(IM.invest_currency_hint_quote)
                .replace('{symbol}', symbol.trim().toUpperCase())
                .replace('{cur}', suggested)
            : x(IM.invest_currency_hint)}
        </p>
      </div>
      <div className="sb-form-actions">
        <button
          type="submit"
          disabled={
            busy ||
            !accountId ||
            !symbol.trim() ||
            !(Number(quantity) > 0) ||
            !(avgCost !== '' && Number(avgCost) >= 0)
          }
          className={btnClass}
        >
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          {x(IM.invest_add_position)}
        </button>
        <button type="button" onClick={onCancel} className="sb-btn sb-btn-secondary">
          {x(IM.invest_cancel)}
        </button>
      </div>
    </form>
  )
}

/* Paste-import — 'SYMBOL, quantity, average cost[, CUR]' per line against
   one account/class. Returns the lines it couldn't use; they stay in the
   box so typos get fixed instead of retyped. */
function BulkAddForm({
  busy,
  accounts,
  onCreate,
  onCancel,
}: {
  busy: boolean
  accounts: { id: string; name: string }[]
  onCreate: (input: {
    accountId: string
    assetClass: AssetClass
    currency: string
    lines: string[]
  }) => Promise<string[]>
  onCancel: () => void
}) {
  const { x } = useI18n()
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [assetClass, setAssetClass] = useState<AssetClass>('equity')
  const [currency, setCurrency] = useState('CAD')
  const [text, setText] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!accountId || !text.trim()) return
    void onCreate({ accountId, assetClass, currency, lines: text.split('\n') }).then(
      (left) => setText(left.join('\n')),
    )
  }

  return (
    <form onSubmit={submit}>
      <div className="sb-form-grid">
        <div className="sb-field">
          <label className={labelClass} htmlFor="inv-bulk-acc">
            {x(IM.invest_field_account)}
          </label>
          <select
            id="inv-bulk-acc"
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
          <label className={labelClass} htmlFor="inv-bulk-class">
            {x(IM.invest_field_asset_class)}
          </label>
          <select
            id="inv-bulk-class"
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
          <label className={labelClass} htmlFor="inv-bulk-cur">
            {x(IM.invest_field_currency)}
          </label>
          <select
            id="inv-bulk-cur"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={fieldClass}
            aria-describedby="inv-bulk-cur-hint"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p id="inv-bulk-cur-hint" className="sb-helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
            {x(IM.invest_currency_hint)}
          </p>
        </div>
      </div>
      <div className="sb-field" style={{ marginTop: 10 }}>
        <label className={labelClass} htmlFor="inv-bulk-lines">
          {x(IM.invest_bulk_lines)}
        </label>
        <textarea
          id="inv-bulk-lines"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'SHOP.TO, 10, 141.12\nMSFT, 0.79, 527, USD'}
          rows={5}
          className={fieldClass}
          style={{ fontFamily: 'monospace' }}
          aria-describedby="inv-bulk-hint"
          required
        />
        <p id="inv-bulk-hint" className="sb-helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
          {x(IM.invest_bulk_hint)}
        </p>
      </div>
      <div className="sb-form-actions" style={{ marginTop: 10 }}>
        <button type="submit" disabled={busy || !accountId || !text.trim()} className={btnClass}>
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          {x(IM.invest_bulk_submit)}
        </button>
        <button type="button" onClick={onCancel} className="sb-btn sb-btn-secondary">
          {x(IM.invest_cancel)}
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
  onSave: (input: { name: string; quantity: number; avgCost: number; currency: string }) => Promise<void>
}) {
  const { x } = useI18n()
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [avgCost, setAvgCost] = useState('')
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('CAD')

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setQuantity(String(position.quantity))
          setAvgCost(String(position.avgCost))
          setName(position.name)
          setCurrency(position.currency || 'CAD')
          setOpen(true)
        }}
        className="sb-btn sb-btn-secondary sb-btn-sm"
        aria-label={`${x(IM.invest_edit)} ${position.symbol}`}
        title={x(IM.invest_edit)}
      >
        <Pencil size={15} aria-hidden="true" />
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
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="sb-input sb-input-sm"
        style={{ width: 76 }}
        aria-label={x(IM.invest_field_currency)}
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={busy || !quantity || !avgCost}
        onClick={() =>
          void onSave({
            name: name.trim() || position.name,
            quantity: Number(quantity),
            avgCost: Number(avgCost),
            currency,
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
  confirmLabel,
  confirmDetail,
  onRemove,
}: {
  busy: boolean
  ariaLabel: string
  /** Overrides the two-tap confirm text — e.g. accounts warn that their
      positions go with them. */
  confirmLabel?: string
  /** Extra line shown only while the confirm is armed — the cascade's
      blast radius in numbers, not just 'positions'. */
  confirmDetail?: ReactNode
  onRemove: () => Promise<void>
}) {
  const { x } = useI18n()
  const [confirming, setConfirming] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])
  return (
    <>
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
        title={x(IM.invest_rule_remove)}
      >
        {/* The armed second tap stays text — 'Remove?' is the explicit
            affordance; the icon alone can't carry that state. */}
        {confirming ? (
          confirmLabel ?? x(IM.invest_remove_confirm)
        ) : (
          <Trash2 size={15} aria-hidden="true" />
        )}
      </button>
      {confirming && confirmDetail}
    </>
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
        title={x(IM.invest_set_price)}
      >
        <DollarSign size={15} aria-hidden="true" />
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
