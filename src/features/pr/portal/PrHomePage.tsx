import '@/features/invest/portal/strategies.css'
import './pr.css'
import { Link } from 'react-router-dom'
import { Info, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import {
  activeCampaigns,
  mentionsInWindow,
  upcomingContent,
} from '@/features/pr/data/prStats'
import { contentKindLabel, fmtDateTime, sentimentLabel } from './prUi'
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

  return (
    <div className="sb prx sb-page">
      <div className="sb-head-row">
        <h1>{x(PM.pr_ov_title)}</h1>
        <Link to="/pr/content" className="sb-btn sb-btn-primary">
          {x(PM.pr_ov_new_content)}
        </Link>
      </div>
      <p className="sb-sub">{x(PM.pr_ov_sub)}</p>

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

      <div className="sb-note">
        <Info size={16} aria-hidden="true" />
        <span>{x(PM.pr_note)}</span>
      </div>
    </div>
  )
}
