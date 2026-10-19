import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { investMessages as IM } from '@/i18n/messages/invest'
import type { InvestSignal } from '@/features/invest/data/types'
import { relTimeLabel } from './relTime'
import { SIGNAL_KIND_LABEL, mentionedSymbols } from './strategyUi'

/**
 * One signal row, one renderer — the inbox (triage surface) and the
 * Signals tab (history) draw the same card so the two views can never
 * drift: same kind pill, same linked symbol chips, same relative stamp.
 * The `side` slot carries each surface's verbs; chips always route a
 * held symbol to the book (a watchlist-only symbol stays plain — no
 * position to land on).
 */
export function SignalCard({
  signal: s,
  heldSymbols,
  side,
}: {
  signal: InvestSignal
  heldSymbols: ReadonlySet<string>
  /** Right-hand verbs — triage buttons, a status pill, a route link. */
  side?: ReactNode
}) {
  const { x, lang } = useI18n()
  const sym = s.symbol.toUpperCase()
  const held = sym.length > 0 && heldSymbols.has(sym)
  /* Other held symbols the text mentions get link chips — the scan runs
     over the raw EN fields so the same row wears the same chips in both
     locales. */
  const mentioned = mentionedSymbols(`${s.title} ${s.body}`, [...heldSymbols]).filter(
    (m) => m !== sym,
  )
  const title = lang === 'fr' && s.titleFr ? s.titleFr : s.title
  const body = lang === 'fr' && s.bodyFr ? s.bodyFr : s.body
  const when = relTimeLabel(s.createdAt, x)
  return (
    <li className="sb-card sb-card-pad">
      <div className="sb-sig">
        <div style={{ minWidth: 0 }}>
          <div className="sb-sig-head">
            <span className={`sb-pill ${s.kind === 'alert' ? 'sb-pill-warn' : 'sb-pill-draft'}`}>
              {x(IM[SIGNAL_KIND_LABEL[s.kind]])}
            </span>
            {s.symbol &&
              (held ? (
                <Link
                  to={`/invest/portfolio?symbol=${s.symbol}`}
                  className="sb-pill sb-pill-link"
                >
                  {s.symbol}
                </Link>
              ) : (
                <span className="sb-pill">{s.symbol}</span>
              ))}
            {mentioned.map((m) => (
              <Link key={m} to={`/invest/portfolio?symbol=${m}`} className="sb-pill sb-pill-link">
                {m}
              </Link>
            ))}
            {s.score !== null && (
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {x(IM.invest_score)} {Math.round(s.score)}
              </span>
            )}
            {when && <span>{when}</span>}
          </div>
          <p className="sb-sig-title" style={{ marginTop: 8 }}>{title}</p>
          {body && <p className="sb-sig-body">{body}</p>}
        </div>
        {side && <div className="sb-sig-side">{side}</div>}
      </div>
    </li>
  )
}
