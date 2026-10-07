import '@/features/invest/portal/strategies.css'
import './pr.css'
import { Link } from 'react-router-dom'
import { Info, Loader2, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import {
  activeCampaigns,
  mentionsInWindow,
  upcomingContent,
} from '@/features/pr/data/prStats'
import { contentKindLabel, fmtDateTime, paigeNoticed, sentimentLabel } from './prUi'
import type { PrConnectionProvider, PrConnectionStatus } from '@/features/pr/data/types'

/** The providers the desk will reach once their OAuth apps clear review —
    order matches the Connections card; status comes from pr_connections and
    defaults to pending until a real connect flow writes a row. */
const CONNECTION_PROVIDERS = [
  'buffer',
  'linkedin',
  'meta',
  'search_console',
] as const satisfies readonly PrConnectionProvider[]

const CONN_PILL: Record<PrConnectionStatus, string> = {
  pending: 'sb-pill sb-pill-draft',
  connected: 'sb-pill prx-sent-pos',
  error: 'sb-pill prx-sent-neg',
  disconnected: 'sb-pill sb-pill-draft',
}
import { usePrHead } from './usePrHead'

const SENT_CLASS = {
  positive: 'prx-sent-pos',
  neutral: 'prx-sent-neu',
  negative: 'prx-sent-neg',
} as const

export function PrHomePage() {
  const { x, lang } = useI18n()
  const { state, loading, error, refresh } = usePrData()
  usePrHead(PM.pr_seo_doc_title, PM.pr_subtitle)

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 size={24} className="animate-spin text-text-muted" aria-hidden="true" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="sb prx sb-page">
        <p role="alert" className="sb-note">{x(PM.pr_load_error)}</p>
        <button type="button" className="sb-btn sb-btn-secondary" onClick={() => void refresh()}>
          {x(PM.pr_retry)}
        </button>
      </div>
    )
  }

  const active = activeCampaigns(state.campaigns).length
  const upcoming = upcomingContent(state.contentItems)
  const recentMentions = mentionsInWindow(state.mentions, 30)
  const citedAnswers = state.geoPrompts.filter((p) => p.result === 'cited').length

  /* Paige's presence outside the chat tab — one noticed thing, built
     locally from the same state the stats read. No model call. */
  const noticed = paigeNoticed(state, lang)

  return (
    <div className="sb prx sb-page">
      <div className="sb-head-row">
        <h1>{x(PM.pr_ov_title)}</h1>
        <Link to="/pr/content" className="sb-btn sb-btn-primary">
          {x(PM.pr_ov_new_content)}
        </Link>
      </div>
      <p className="sb-sub">{x(PM.pr_ov_sub)}</p>

      {noticed && (
        <div className="sb-note" style={{ marginTop: 14, alignItems: 'center' }}>
          <Sparkles size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>
            <strong>{x(PM.pr_home_paige_label)}</strong> — {noticed}{' '}
            <Link to="/pr/chat" style={{ color: 'inherit', fontWeight: 600 }}>
              {x(PM.pr_home_paige_open)}
            </Link>
          </span>
        </div>
      )}

      <div className="sb-stats">
        <div className="sb-stat">
          <div className="k">{x(PM.pr_ov_active)}</div>
          <div className="v">{active}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(PM.pr_ov_scheduled)}</div>
          <div className="v">{upcoming.length}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(PM.pr_ov_contacts)}</div>
          <div className="v">{state.contacts.length}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(PM.pr_ov_mentions_30d)}</div>
          <div className="v">{recentMentions.length}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(PM.pr_ov_answers)}</div>
          <div className="v">{citedAnswers}</div>
        </div>
      </div>

      <div className="sb-duo">
        <section className="sb-card sb-card-pad">
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2 className="m-0 text-[16px]">{x(PM.pr_ov_upcoming)}</h2>
          </div>
          {upcoming.length === 0 ? (
            <div className="sb-empty">{x(PM.pr_ov_empty_upcoming)}</div>
          ) : (
            <ul className="sb-mini-list">
              {upcoming.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <span className="prx-chip">{contentKindLabel(item.kind, lang)}</span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title || x(PM.pr_content_untitled)}
                  </span>
                  <span style={{ color: 'var(--sb-muted)', fontSize: 12.5 }}>
                    {item.scheduledFor ? fmtDateTime(item.scheduledFor, lang) : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sb-card sb-card-pad">
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2 className="m-0 text-[16px]">{x(PM.pr_ov_latest_mentions)}</h2>
            <Link
              to="/pr/mentions"
              className="inline-flex items-center gap-[4px] text-[12.5px] font-semibold no-underline"
              style={{ color: 'var(--sb-accent-ink)' }}
            >
              {x(PM.pr_tab_mentions)}
            </Link>
          </div>
          {recentMentions.length === 0 ? (
            <div className="sb-empty">{x(PM.pr_ov_empty_mentions)}</div>
          ) : (
            <ul className="sb-mini-list">
              {recentMentions.slice(0, 6).map((m) => (
                <li key={m.id}>
                  <span className={`sb-pill ${SENT_CLASS[m.sentiment]}`}>
                    {sentimentLabel(m.sentiment, lang)}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.title}
                  </span>
                  <span style={{ color: 'var(--sb-muted)', fontSize: 12.5 }}>
                    {m.source || fmtDateTime(m.publishedAt, lang)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="sb-card sb-card-pad">
        <div className="sb-section-head" style={{ marginTop: 0 }}>
          <h2 className="m-0 text-[16px]">{x(PM.pr_ov_conn_title)}</h2>
        </div>
        <p className="sb-helper" style={{ marginTop: -6 }}>{x(PM.pr_ov_conn_sub)}</p>
        <ul className="sb-mini-list">
          {CONNECTION_PROVIDERS.map((provider) => {
            const row = state.connections.find((c) => c.provider === provider)
            const status: PrConnectionStatus = row?.status ?? 'pending'
            return (
              <li key={provider}>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
                  {x(PM[`pr_ov_conn_${provider}`])}
                  {row?.accountLabel ? (
                    <span style={{ color: 'var(--sb-muted)', fontWeight: 400 }}>
                      {` — ${row.accountLabel}`}
                    </span>
                  ) : null}
                </span>
                <span className={CONN_PILL[status]}>{x(PM[`pr_ov_conn_${status}`])}</span>
              </li>
            )
          })}
        </ul>
        <p className="sb-helper" style={{ marginBottom: 0 }}>{x(PM.pr_ov_conn_note)}</p>
      </section>

      <div className="sb-note">
        <Info size={16} aria-hidden="true" />
        <span>{x(PM.pr_note)}</span>
      </div>
    </div>
  )
}
