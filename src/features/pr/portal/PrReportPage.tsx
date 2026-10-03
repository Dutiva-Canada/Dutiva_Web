import '@/features/invest/portal/strategies.css'
import './pr.css'
import { useMemo, useState } from 'react'
import { Download, Info, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { prMessages as PM } from '@/i18n/messages/pr'
import { usePrData } from '@/features/pr/data/PrDataContext'
import { buildPrReport, reportMonths, type PrReport } from '@/features/pr/data/prReport'
import { fmtDate } from './prUi'
import { usePrHead } from './usePrHead'

const SENT_CLASS = {
  positive: 'prx-sent-pos',
  neutral: 'prx-sent-neu',
  negative: 'prx-sent-neg',
} as const

/** 'YYYY-MM' → 'October 2026' / 'octobre 2026' in the active locale. */
function monthLabel(month: string, lang: 'en' | 'fr'): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, 1)).toLocaleDateString(
    lang === 'fr' ? 'fr-CA' : 'en-CA',
    { month: 'long', year: 'numeric', timeZone: 'UTC' },
  )
}

function reportMarkdown(report: PrReport, label: string, x: (m: { en: string; fr: string }) => string): string {
  const lines: string[] = [`# ${x(PM.pr_rep_title)} — ${label}`, '']
  lines.push(`## ${x(PM.pr_rep_coverage)}`)
  lines.push(
    report.coverage.total === 0
      ? x(PM.pr_rep_coverage_empty)
      : `- ${report.coverage.total} — ${x(PM.pr_rep_coverage_tone)
          .replace('{pos}', String(report.coverage.positive))
          .replace('{neu}', String(report.coverage.neutral))
          .replace('{neg}', String(report.coverage.negative))}`,
  )
  for (const o of report.coverage.topOutlets) lines.push(`- ${o.source} (${o.count})`)
  for (const i of report.coverage.items) lines.push(`- ${i.title} — ${i.source}`)
  lines.push('')

  lines.push(`## ${x(PM.pr_rep_content)}`)
  if (report.content.publishedCount === 0) {
    lines.push(x(PM.pr_rep_content_empty))
  } else {
    for (const i of report.content.items) {
      lines.push(`- ${i.title} (${i.kind})${i.url ? ` — ${i.url}` : ''}`)
    }
  }
  lines.push('')

  lines.push(`## ${x(PM.pr_rep_campaigns)}`)
  lines.push(
    x(PM.pr_rep_campaigns_line)
      .replace('{active}', String(report.campaigns.active))
      .replace('{draft}', String(report.campaigns.draft))
      .replace('{paused}', String(report.campaigns.paused))
      .replace('{done}', String(report.campaigns.done)),
  )
  lines.push('')

  lines.push(`## ${x(PM.pr_rep_search)}`)
  lines.push(
    report.search.checked === 0
      ? x(PM.pr_rep_search_empty)
      : x(PM.pr_rep_search_line)
          .replace('{up}', String(report.search.up))
          .replace('{down}', String(report.search.down))
          .replace('{flat}', String(report.search.flat))
          .replace('{total}', String(report.search.checked)),
  )
  lines.push('')

  lines.push(`## ${x(PM.pr_rep_answers)}`)
  lines.push(
    report.answers.checked === 0
      ? x(PM.pr_rep_answers_empty)
      : `${x(PM.pr_rep_answers_line)
          .replace('{cited}', String(report.answers.cited))
          .replace('{mentioned}', String(report.answers.mentioned))
          .replace('{absent}', String(report.answers.absent))
          .replace('{total}', String(report.answers.checked))} — ${x(PM.pr_rep_answers_via)
          .replace('{auto}', String(report.answers.viaAuto))
          .replace('{manual}', String(report.answers.viaManual))}`,
  )
  lines.push('', `_${x(PM.pr_rep_note)}_`)
  return lines.join('\n')
}

export function PrReportPage() {
  const { x, lang } = useI18n()
  const { state, loading, error, refresh } = usePrData()
  usePrHead(PM.pr_seo_title_report, PM.pr_rep_sub)
  const months = useMemo(() => (state ? reportMonths(state) : []), [state])
  const [picked, setPicked] = useState<string | null>(null)
  const month = picked && months.includes(picked) ? picked : (months[0] ?? new Date().toISOString().slice(0, 7))
  const report = useMemo(() => (state ? buildPrReport(state, month) : null), [state, month])

  if (loading || !state || !report) {
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

  const label = monthLabel(month, lang)

  function download() {
    const md = reportMarkdown(report!, label, x)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${x(PM.pr_rep_file_name)}-${month}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="sb prx sb-page">
      <div className="sb-head-row">
        <h1>{x(PM.pr_rep_title)}</h1>
        <button type="button" className="sb-btn sb-btn-secondary" onClick={download}>
          <Download size={15} strokeWidth={2} aria-hidden="true" style={{ verticalAlign: -3 }} />{' '}
          {x(PM.pr_rep_export)}
        </button>
      </div>
      <p className="sb-sub">{x(PM.pr_rep_sub)}</p>

      <div className="sb-field" style={{ maxWidth: 260 }}>
        <label className="sb-label" htmlFor="pr-report-month">{x(PM.pr_rep_month)}</label>
        <select
          id="pr-report-month"
          className="sb-input"
          value={month}
          onChange={(e) => setPicked(e.target.value)}
        >
          {months.map((m) => (
            <option key={m} value={m}>{monthLabel(m, lang)}</option>
          ))}
        </select>
      </div>

      <div className="sb-stats">
        <div className="sb-stat">
          <div className="k">{x(PM.pr_rep_coverage)}</div>
          <div className="v">{report.coverage.total}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(PM.pr_rep_content)}</div>
          <div className="v">{report.content.publishedCount}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(PM.pr_rep_search)}</div>
          <div className="v">{report.search.checked}</div>
        </div>
        <div className="sb-stat">
          <div className="k">{x(PM.pr_rep_answers)}</div>
          <div className="v">{report.answers.checked}</div>
        </div>
      </div>

      <div className="sb-duo">
        <section className="sb-card sb-card-pad">
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2 className="m-0 text-[16px]">{x(PM.pr_rep_coverage)}</h2>
          </div>
          {report.coverage.total === 0 ? (
            <div className="sb-empty">{x(PM.pr_rep_coverage_empty)}</div>
          ) : (
            <>
              <p className="sb-helper" style={{ marginTop: -6 }}>
                {x(PM.pr_rep_coverage_tone)
                  .replace('{pos}', String(report.coverage.positive))
                  .replace('{neu}', String(report.coverage.neutral))
                  .replace('{neg}', String(report.coverage.negative))}
              </p>
              {report.coverage.topOutlets.length > 0 && (
                <p className="sb-helper" style={{ marginTop: -6 }}>
                  {x(PM.pr_rep_top_outlets)}:{' '}
                  {report.coverage.topOutlets.map((o) => `${o.source} (${o.count})`).join(' · ')}
                </p>
              )}
              <ul className="sb-mini-list">
                {report.coverage.items.slice(0, 8).map((i) => (
                  <li key={`${i.title}-${i.publishedAt}`}>
                    <span className={`sb-pill ${SENT_CLASS[i.sentiment as keyof typeof SENT_CLASS] ?? 'prx-sent-neu'}`}>
                      {i.sentiment}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i.title}
                    </span>
                    <span style={{ color: 'var(--sb-muted)', fontSize: 12.5 }}>
                      {i.source || fmtDate(i.publishedAt, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="sb-card sb-card-pad">
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2 className="m-0 text-[16px]">{x(PM.pr_rep_content)}</h2>
          </div>
          {report.content.publishedCount === 0 ? (
            <div className="sb-empty">{x(PM.pr_rep_content_empty)}</div>
          ) : (
            <ul className="sb-mini-list">
              {report.content.items.map((i) => (
                <li key={i.title}>
                  <span className="prx-chip">{i.kind}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {i.url ? (
                      <a href={i.url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                        {i.title}
                      </a>
                    ) : (
                      i.title
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="sb-duo">
        <section className="sb-card sb-card-pad">
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2 className="m-0 text-[16px]">{x(PM.pr_rep_campaigns)}</h2>
          </div>
          <p className="sb-helper" style={{ marginBottom: 0 }}>
            {x(PM.pr_rep_campaigns_line)
              .replace('{active}', String(report.campaigns.active))
              .replace('{draft}', String(report.campaigns.draft))
              .replace('{paused}', String(report.campaigns.paused))
              .replace('{done}', String(report.campaigns.done))}
          </p>
        </section>

        <section className="sb-card sb-card-pad">
          <div className="sb-section-head" style={{ marginTop: 0 }}>
            <h2 className="m-0 text-[16px]">{x(PM.pr_rep_search)}</h2>
          </div>
          {report.search.checked === 0 ? (
            <div className="sb-empty">{x(PM.pr_rep_search_empty)}</div>
          ) : (
            <>
              <p className="sb-helper" style={{ marginTop: -6 }}>
                {x(PM.pr_rep_search_line)
                  .replace('{up}', String(report.search.up))
                  .replace('{down}', String(report.search.down))
                  .replace('{flat}', String(report.search.flat))
                  .replace('{total}', String(report.search.checked))}
              </p>
              <ul className="sb-mini-list">
                {report.search.keywords.slice(0, 6).map((k) => (
                  <li key={k.keyword}>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {k.keyword}
                    </span>
                    <span style={{ color: 'var(--sb-muted)', fontSize: 12.5 }}>
                      {k.previousPosition ?? '—'} → {k.position ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <section className="sb-card sb-card-pad">
        <div className="sb-section-head" style={{ marginTop: 0 }}>
          <h2 className="m-0 text-[16px]">{x(PM.pr_rep_answers)}</h2>
        </div>
        {report.answers.checked === 0 ? (
          <div className="sb-empty">{x(PM.pr_rep_answers_empty)}</div>
        ) : (
          <p className="sb-helper" style={{ marginBottom: 0 }}>
            {x(PM.pr_rep_answers_line)
              .replace('{cited}', String(report.answers.cited))
              .replace('{mentioned}', String(report.answers.mentioned))
              .replace('{absent}', String(report.answers.absent))
              .replace('{total}', String(report.answers.checked))}
            {' · '}
            {x(PM.pr_rep_answers_via)
              .replace('{auto}', String(report.answers.viaAuto))
              .replace('{manual}', String(report.answers.viaManual))}
          </p>
        )}
      </section>

      <div className="sb-note">
        <Info size={16} aria-hidden="true" />
        <span>{x(PM.pr_rep_note)}</span>
      </div>
    </div>
  )
}
