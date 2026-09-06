import { useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { commsMessages as M } from '@/i18n/messages/comms'
import { useCommsData } from '../data/useCommsData'
import { CURATED_FEEDS } from '../data/feedPresets'
import type { CommsFeedFormat, CommsSourceType } from '../data/types'
import { SOURCE_TYPE_LABEL } from '../commsLabels'

const SOURCE_TYPES: CommsSourceType[] = [
  'official_notice',
  'news',
  'social',
  'press_release',
  'internal',
  'partner',
  'manual',
]
const FORMATS: CommsFeedFormat[] = ['auto', 'rss', 'atom']

const inputClass =
  'w-full rounded-[10px] border border-border bg-surface px-[12px] py-[9px] font-sans text-[13.5px] text-text'
const labelClass = 'mb-[4px] block text-[12px] font-semibold text-text-3'

export function FeedsSection() {
  const { x, lang } = useI18n()
  const { state, canWrite, addFeed, removeFeed, syncFeed, syncAllFeeds } = useCommsData()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [sourceType, setSourceType] = useState<CommsSourceType>('news')
  const [format, setFormat] = useState<CommsFeedFormat>('auto')
  const [initiativeId, setInitiativeId] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [createCoverageDrafts, setCreateCoverageDrafts] = useState(false)
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const [lastResult, setLastResult] = useState<Record<string, string>>({})

  const reset = () => {
    setOpen(false)
    setUrl('')
    setLabel('')
    setSourceType('news')
    setFormat('auto')
    setInitiativeId(state.initiatives[0]?.id ?? '')
    setEnabled(true)
    setCreateCoverageDrafts(false)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    addFeed({
      url,
      label: { en: label, fr: `[FR] ${label}` },
      sourceType,
      format,
      initiativeId: initiativeId || undefined,
      enabled,
      createCoverageDrafts,
    })
    reset()
  }

  const onSync = async (feedId: string) => {
    setSyncing((prev) => ({ ...prev, [feedId]: true }))
    setLastResult((prev) => ({ ...prev, [feedId]: '' }))
    const result = await syncFeed(feedId)
    setSyncing((prev) => ({ ...prev, [feedId]: false }))
    const parts = [result.added, x(M.comms_intelligence_feed_items_added)]
    if (result.coverageDrafts) parts.push(`+ ${result.coverageDrafts} ${x(M.comms_intelligence_coverage_drafts)}`)
    setLastResult((prev) => ({
      ...prev,
      [feedId]: result.error ?? parts.join(' '),
    }))
  }

  const onSyncAll = async () => {
    setSyncing((prev) => ({ ...prev, __all: true }))
    const results = await syncAllFeeds()
    setSyncing((prev) => ({ ...prev, __all: false }))
    const added = results.reduce((sum, r) => sum + r.added, 0)
    const coverageDrafts = results.reduce((sum, r) => sum + (r.coverageDrafts ?? 0), 0)
    const firstError = results.find((r) => r.error)
    const parts = [added, x(M.comms_intelligence_feed_items_added)]
    if (coverageDrafts) parts.push(`+ ${coverageDrafts} ${x(M.comms_intelligence_coverage_drafts)}`)
    setLastResult((prev) => ({
      ...prev,
      __all: firstError?.error ?? parts.join(' '),
    }))
  }

  const existingUrls = useMemo(
    () => new Set(state.feeds.map((f) => f.url)),
    [state.feeds],
  )

  const addPreset = (preset: typeof CURATED_FEEDS[number]) => {
    addFeed({
      url: preset.url,
      label: preset.label,
      sourceType: preset.sourceType,
      format: preset.format,
      enabled: preset.enabled,
      initiativeId: preset.initiativeId,
      jurisdiction: preset.jurisdiction,
      createCoverageDrafts: preset.createCoverageDrafts,
    })
  }

  return (
    <section className="rounded-[12px] border border-border bg-surface p-[16px]">
      <div className="mb-[12px] flex flex-wrap items-center justify-between gap-[12px]">
        <h3 className="text-[15px] font-semibold text-text">{x(M.comms_intelligence_feeds)}</h3>
        <div className="flex flex-wrap items-center gap-[8px]">
          {canWrite && state.feeds.some((f) => f.enabled) && (
            <button
              type="button"
              onClick={onSyncAll}
              disabled={syncing.__all}
              className="flex cursor-pointer items-center gap-[4px] rounded-[8px] border border-border bg-surface px-[10px] py-[6px] font-sans text-[12px] font-semibold text-text hover:bg-inset disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncing.__all ? 'animate-spin' : ''} />
              {x(M.comms_intelligence_sync_all)}
            </button>
          )}
          {canWrite && !open && (
            <button
              type="button"
              onClick={() => {
                reset()
                setOpen(true)
              }}
              className="flex cursor-pointer items-center gap-[6px] rounded-[8px] border-none bg-navy px-[12px] py-[7px] font-sans text-[12.5px] font-semibold text-white"
            >
              <Plus size={14} aria-hidden="true" />
              {x(M.comms_intelligence_add_feed)}
            </button>
          )}
        </div>
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mb-[12px] rounded-[10px] border border-border bg-inset p-[12px]">
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>URL</label>
              <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputClass}
                placeholder="https://example.com/feed.xml"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{x(M.comms_intelligence_feed_label)}</label>
              <input required value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_filter_source_type)}</label>
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value as CommsSourceType)} className={inputClass}>
                {SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{x(SOURCE_TYPE_LABEL[t])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_intelligence_feed_format)}</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as CommsFeedFormat)} className={inputClass}>
                {FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{x(M.comms_initiatives_name)}</label>
              <select value={initiativeId} onChange={(e) => setInitiativeId(e.target.value)} className={inputClass}>
                <option value="">{x(M.comms_none)}</option>
                {state.initiatives.map((i) => (
                  <option key={i.id} value={i.id}>{x(i.title)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-[8px]">
              <input
                id="feed-enabled"
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-[16px] w-[16px] rounded border-border"
              />
              <label htmlFor="feed-enabled" className="text-[13px] text-text">
                {x(M.comms_intelligence_feed_enabled)}
              </label>
            </div>
            <div className="flex items-center gap-[8px] sm:col-span-2">
              <input
                id="feed-coverage-drafts"
                type="checkbox"
                checked={createCoverageDrafts}
                onChange={(e) => setCreateCoverageDrafts(e.target.checked)}
                className="h-[16px] w-[16px] rounded border-border"
              />
              <label htmlFor="feed-coverage-drafts" className="text-[13px] text-text">
                {x(M.comms_intelligence_feed_coverage_drafts)}
              </label>
            </div>
          </div>
          <div className="mt-[12px] flex gap-[8px]">
            <button type="submit" className="rounded-[8px] border-none bg-navy px-[14px] py-[8px] font-sans text-[13px] font-semibold text-white">
              {x(M.comms_create)}
            </button>
            <button type="button" onClick={reset} className="rounded-[8px] border border-border bg-surface px-[14px] py-[8px] font-sans text-[13px] font-semibold text-text">
              {x(M.comms_cancel)}
            </button>
          </div>
        </form>
      )}

      {canWrite && CURATED_FEEDS.length > 0 && (
        <div className="mb-[14px] rounded-[10px] border border-border bg-inset p-[12px]">
          <h4 className="mb-[8px] text-[13px] font-semibold text-text">{x(M.comms_intelligence_curated_feeds)}</h4>
          <div className="flex flex-col gap-[8px]">
            {CURATED_FEEDS.map((preset) => {
              const added = existingUrls.has(preset.url)
              return (
                <div key={preset.url} className="flex flex-wrap items-center justify-between gap-[8px]">
                  <div className="text-[12.5px] text-text">
                    {x(preset.label)}
                    <span className="ml-[6px] text-[11px] text-text-muted">({preset.jurisdiction})</span>
                  </div>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => addPreset(preset)}
                    className="rounded-[6px] border border-border bg-surface px-[8px] py-[4px] font-sans text-[11.5px] font-semibold text-text hover:bg-inset disabled:opacity-50"
                  >
                    {added ? x(M.comms_intelligence_feed_added) : x(M.comms_intelligence_add_preset)}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {state.feeds.length === 0 ? (
        <p className="text-[13px] text-text-muted">{x(M.comms_intelligence_feeds_empty)}</p>
      ) : (
        <ul className="m-0 flex flex-col gap-[10px] p-0">
          {state.feeds.map((feed) => (
            <li key={feed.id} className="rounded-[8px] bg-inset p-[12px]">
              <div className="flex flex-wrap items-start justify-between gap-[12px]">
                <div>
                  <div className="text-[14px] font-semibold text-text">{x(feed.label)}</div>
                  <div className="text-[12px] text-text-muted break-all">{feed.url}</div>
                </div>
                <span className={`rounded-[100px] px-[10px] py-[3px] text-[12px] font-semibold whitespace-nowrap ${feed.enabled ? 'bg-ok-bg text-ok-fg' : 'bg-inset text-text-muted'}`}>
                  {feed.enabled ? x(M.comms_status_active) : x(M.comms_status_paused)}
                </span>
              </div>
              <div className="mt-[6px] text-[12px] text-text-muted">
                {x(SOURCE_TYPE_LABEL[feed.sourceType])} · {feed.format}
                {feed.lastFetchedAt ? ` · ${x(M.comms_intelligence_retrieved)} ${new Date(feed.lastFetchedAt).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')}` : ''}
              </div>
              {feed.lastFetchMessage && (
                <div className={`mt-[4px] text-[12px] ${feed.lastFetchStatus === 'error' ? 'text-risk-fg' : 'text-text-muted'}`}>
                  {feed.lastFetchMessage}
                </div>
              )}
              {lastResult[feed.id] && (
                <div className="mt-[4px] text-[12px] text-text-muted">{lastResult[feed.id]}</div>
              )}
              {canWrite && (
                <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
                  <button
                    type="button"
                    onClick={() => onSync(feed.id)}
                    disabled={syncing[feed.id]}
                    className="flex items-center gap-[4px] rounded-[6px] border border-border bg-surface px-[8px] py-[4px] font-sans text-[11.5px] font-semibold text-text hover:bg-inset disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={syncing[feed.id] ? 'animate-spin' : ''} />
                    {x(M.comms_intelligence_feed_sync)}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFeed(feed.id)}
                    className="text-[12px] font-semibold text-risk-fg"
                  >
                    {x(M.comms_remove)}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {lastResult.__all && (
        <p className="mt-[10px] text-[12px] text-text-muted">{lastResult.__all}</p>
      )}
      <p className="mt-[10px] text-[11px] leading-normal text-text-faint">{x(M.comms_intelligence_feed_disclaimer)}</p>
      <p className="mt-[6px] text-[11px] leading-normal text-text-faint">{x(M.comms_intelligence_feed_auto_sync)}</p>
    </section>
  )
}
