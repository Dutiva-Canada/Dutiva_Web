import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useEffect, useState } from 'react'
import { ExternalLink, Link2, Loader2, Rss, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import { addMention, addPrFeed, deleteMention, deletePrFeed, fetchMentionMeta, syncPrFeeds } from '@/features/pr/data/api'
import { loadNotifyPref, setNotifyPref } from '@/lib/notifications/notifyPrefs'
import type { PrSentiment } from '@/features/pr/data/types'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { fmtDate, SENTIMENTS, sentimentLabel } from './prUi'
import { usePrHead } from './usePrHead'

const SENT_PILL: Record<PrSentiment, string> = {
  positive: 'prx-sent-pos',
  neutral: 'prx-sent-neu',
  negative: 'prx-sent-neg',
}

interface Draft {
  source: string
  title: string
  url: string
  sentiment: PrSentiment
  date: string
}

export function PrMentionsPage() {
  const { x, lang } = useI18n()
  const { state, loading, error, refresh } = usePrData()
  const { showToast } = useToasts()
  usePrHead(PM.pr_men_title, PM.pr_men_sub)

  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({
    source: '',
    title: '',
    url: '',
    sentiment: 'neutral',
    date: '',
  })
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [armDelete, setArmDelete] = useState<string | null>(null)
  const [feedUrl, setFeedUrl] = useState('')
  const [feedLabel, setFeedLabel] = useState('')
  const [feedSaving, setFeedSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [armFeedDelete, setArmFeedDelete] = useState<string | null>(null)
  const [notifyOn, setNotifyOn] = useState<boolean | null>(null)
  const [notifySaving, setNotifySaving] = useState(false)

  /* Email opt-out — absent pref row defaults to on; failures leave the
     checkbox at its previous value rather than lying. */
  useEffect(() => {
    let cancelled = false
    loadNotifyPref('pr')
      .then((v) => { if (!cancelled) setNotifyOn(v) })
      .catch(() => { if (!cancelled) setNotifyOn(true) })
    return () => { cancelled = true }
  }, [])

  const toggleNotify = async () => {
    const next = !(notifyOn ?? true)
    if (notifySaving) return
    setNotifySaving(true)
    setNotifyOn(next)
    try {
      await setNotifyPref('pr', next)
    } catch {
      setNotifyOn(!next)
      showToast(PM.pr_men_fetch_fail)
    } finally {
      setNotifySaving(false)
    }
  }

  /** Paste-a-link prefill — the edge function reads the page's meta tags so
      headline/outlet/date come back filled. Never overwrites typed fields. */
  const fetchDetails = async () => {
    if (!draft.url.trim() || fetching) return
    setFetching(true)
    try {
      const meta = await fetchMentionMeta(draft.url.trim())
      setDraft((d) => ({
        ...d,
        title: d.title || meta.title,
        source: d.source || meta.source,
        date: d.date || (meta.publishedAt ? meta.publishedAt.slice(0, 10) : ''),
      }))
      showToast(PM.pr_men_fetched)
    } catch {
      showToast(PM.pr_men_fetch_fail)
    } finally {
      setFetching(false)
    }
  }

  const submit = async () => {
    if (!draft.title.trim() || saving) return
    setSaving(true)
    try {
      await addMention({
        source: draft.source,
        title: draft.title,
        url: draft.url,
        sentiment: draft.sentiment,
        publishedAt: draft.date
          ? new Date(`${draft.date}T12:00:00`).toISOString()
          : undefined,
      })
      await refresh()
      setDraft({ source: '', title: '', url: '', sentiment: 'neutral', date: '' })
      setFormOpen(false)
      showToast(PM.pr_men_saved)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (armDelete !== id) {
      setArmDelete(id)
      return
    }
    setArmDelete(null)
    await deleteMention(id)
    await refresh()
  }

  /* Feeds — the user pastes a Google Alerts RSS (or any feed) URL; the
     pr-mentions-feed function polls it daily and "Sync now" triggers it on
     demand. New items land as neutral mentions, deduped on the real link. */
  const feedUrlOk = /^https?:\/\//i.test(feedUrl.trim())

  const addFeed = async () => {
    if (!feedUrlOk || feedSaving) return
    setFeedSaving(true)
    try {
      await addPrFeed({ url: feedUrl, label: feedLabel })
      await refresh()
      setFeedUrl('')
      setFeedLabel('')
      showToast(PM.pr_men_feed_added)
    } finally {
      setFeedSaving(false)
    }
  }

  const syncFeeds = async () => {
    if (syncing) return
    setSyncing(true)
    try {
      const res = await syncPrFeeds()
      await refresh()
      showToast(
        res.added === 0
          ? PM.pr_men_feed_synced_none
          : {
              en: (res.added === 1 ? PM.pr_men_feed_synced_one : PM.pr_men_feed_synced_many).en.replace(
                '{count}',
                String(res.added),
              ),
              fr: (res.added === 1 ? PM.pr_men_feed_synced_one : PM.pr_men_feed_synced_many).fr.replace(
                '{count}',
                String(res.added),
              ),
            },
      )
    } catch {
      showToast(PM.pr_men_fetch_fail)
    } finally {
      setSyncing(false)
    }
  }

  const removeFeed = async (id: string) => {
    if (armFeedDelete !== id) {
      setArmFeedDelete(id)
      return
    }
    setArmFeedDelete(null)
    await deletePrFeed(id)
    await refresh()
  }

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

  return (
    <div className="sb prx sb-page">
      <div className="sb-head-row">
        <h1>{x(PM.pr_men_title)}</h1>
        <button
          type="button"
          className="sb-btn sb-btn-primary"
          onClick={() => setFormOpen(true)}
        >
          {x(PM.pr_men_new)}
        </button>
      </div>
      <p className="sb-sub">{x(PM.pr_men_sub)}</p>

      {formOpen && (
        <form
          className="sb-card sb-card-pad"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className="sb-form-grid">
            <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
              <label className="sb-flabel" htmlFor="pr-mn-title">{x(PM.pr_men_headline)}</label>
              <input
                id="pr-mn-title"
                className="sb-input"
                required
                value={draft.title}
                placeholder={x(PM.pr_men_headline_ph)}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-mn-source">{x(PM.pr_men_source)}</label>
              <input
                id="pr-mn-source"
                className="sb-input"
                value={draft.source}
                placeholder={x(PM.pr_men_source_ph)}
                onChange={(e) => setDraft({ ...draft, source: e.target.value })}
              />
            </div>
            <div className="sb-field" style={{ gridColumn: '1 / -1' }}>
              <label className="sb-flabel" htmlFor="pr-mn-url">{x(PM.pr_men_url)}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                <input
                  id="pr-mn-url"
                  className="sb-input"
                  style={{ flex: 1, minWidth: 0 }}
                  type="url"
                  value={draft.url}
                  placeholder={x(PM.pr_men_url_ph)}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                />
                <button
                  type="button"
                  className="sb-btn sb-btn-secondary"
                  style={{ minHeight: 44, whiteSpace: 'nowrap' }}
                  disabled={!draft.url.trim() || fetching}
                  onClick={() => void fetchDetails()}
                >
                  {fetching ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Link2 size={14} aria-hidden="true" />
                  )}
                  {x(fetching ? PM.pr_men_fetching : PM.pr_men_fetch)}
                </button>
              </div>
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-mn-sent">{x(PM.pr_men_sentiment)}</label>
              <select
                id="pr-mn-sent"
                className="sb-input"
                value={draft.sentiment}
                onChange={(e) =>
                  setDraft({ ...draft, sentiment: e.target.value as PrSentiment })
                }
              >
                {SENTIMENTS.map((s) => (
                  <option key={s} value={s}>{sentimentLabel(s, lang)}</option>
                ))}
              </select>
            </div>
            <div className="sb-field">
              <label className="sb-flabel" htmlFor="pr-mn-date">{x(PM.pr_men_date)}</label>
              <input
                id="pr-mn-date"
                className="sb-input"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </div>
            <div className="sb-form-actions">
              <button type="submit" className="sb-btn sb-btn-primary" disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {x(PM.pr_men_save)}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="sb-section-head">
        <h2>{x(PM.pr_men_feeds_title)}</h2>
        {state.feeds.length > 0 && (
          <button
            type="button"
            className="sb-btn sb-btn-secondary sb-btn-sm"
            disabled={syncing}
            onClick={() => void syncFeeds()}
          >
            {syncing && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
            {x(syncing ? PM.pr_men_feed_syncing : PM.pr_men_feed_sync)}
          </button>
        )}
      </div>
      <section className="sb-card sb-card-pad">
        <p className="sb-helper" style={{ marginTop: 0 }}>{x(PM.pr_men_feeds_sub)}</p>
        <div className="sb-form-grid" style={{ marginTop: 10 }}>
          <div className="sb-field" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
            <label className="sb-flabel" htmlFor="pr-feed-url">{x(PM.pr_men_feed_url)}</label>
            <input
              id="pr-feed-url"
              className="sb-input"
              type="url"
              value={feedUrl}
              placeholder={x(PM.pr_men_feed_url_ph)}
              onChange={(e) => setFeedUrl(e.target.value)}
            />
          </div>
          <div className="sb-field" style={{ marginBottom: 0 }}>
            <label className="sb-flabel" htmlFor="pr-feed-label">{x(PM.pr_men_feed_label)}</label>
            <input
              id="pr-feed-label"
              className="sb-input"
              value={feedLabel}
              placeholder={x(PM.pr_men_feed_label_ph)}
              onChange={(e) => setFeedLabel(e.target.value)}
            />
          </div>
          <div className="sb-form-actions" style={{ alignSelf: 'end' }}>
            <button
              type="button"
              className="sb-btn sb-btn-secondary"
              disabled={!feedUrlOk || feedSaving}
              onClick={() => void addFeed()}
            >
              {feedSaving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              {x(PM.pr_men_feed_add)}
            </button>
          </div>
        </div>
        {state.feeds.length === 0 ? (
          <div className="sb-empty" style={{ paddingTop: 14, paddingBottom: 6 }}>
            {x(PM.pr_men_feeds_empty)}
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            {state.feeds.map((f) => (
              <div key={f.id} className="prx-mention">
                <div className="prx-mention-main">
                  <p className="prx-mention-title">
                    <Rss size={13} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 6 }} />
                    {f.label || f.url}
                  </p>
                  <div className="prx-mention-meta">
                    {f.label && <span>{f.url}</span>}
                    <span>
                      {f.lastSyncedAt
                        ? x(PM.pr_men_feed_last).replace('{date}', fmtDate(f.lastSyncedAt, lang))
                        : x(PM.pr_men_feed_never)}
                    </span>
                  </div>
                </div>
                <div className="prx-mention-side">
                  <div className="sb-row-actions">
                    <button
                      type="button"
                      className="sb-btn sb-btn-secondary sb-btn-sm"
                      onClick={() => void removeFeed(f.id)}
                      onBlur={() => setArmFeedDelete(null)}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      {armFeedDelete === f.id
                        ? x(PM.pr_men_feed_delete_confirm)
                        : x(PM.pr_men_feed_delete)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {notifyOn !== null && (
          <label className="sb-notify-row">
            <input
              type="checkbox"
              checked={notifyOn}
              disabled={notifySaving}
              onChange={() => void toggleNotify()}
            />
            <span>
              {x(PM.pr_notify_label)}
              <span className="sb-notify-hint">{x(PM.pr_notify_hint)}</span>
            </span>
          </label>
        )}
      </section>

      <div className="sb-section-head">
        <h2>{x(PM.pr_men_title)}</h2>
      </div>
      <section className="sb-card sb-card-pad">
        {state.mentions.length === 0 ? (
          <div className="sb-empty">{x(PM.pr_men_empty)}</div>
        ) : (
          <div>
            {state.mentions.map((m) => (
              <div key={m.id} className="prx-mention">
                <div className="prx-mention-main">
                  <p className="prx-mention-title">
                    {m.url ? (
                      <a href={m.url} target="_blank" rel="noreferrer">
                        {m.title}
                      </a>
                    ) : (
                      m.title
                    )}
                  </p>
                  <div className="prx-mention-meta">
                    {m.source && <span>{m.source}</span>}
                    <span>{fmtDate(m.publishedAt, lang)}</span>
                  </div>
                </div>
                <div className="prx-mention-side">
                  <span className={`sb-pill ${SENT_PILL[m.sentiment]}`}>
                    {sentimentLabel(m.sentiment, lang)}
                  </span>
                  <div className="sb-row-actions">
                    {m.url && (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="sb-btn sb-btn-secondary sb-btn-sm"
                      >
                        <ExternalLink size={13} aria-hidden="true" />
                        {x(PM.pr_men_view)}
                      </a>
                    )}
                    <button
                      type="button"
                      className="sb-btn sb-btn-secondary sb-btn-sm"
                      onClick={() => void remove(m.id)}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      {armDelete === m.id
                        ? x(PM.pr_men_delete_confirm)
                        : x(PM.pr_men_delete)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
