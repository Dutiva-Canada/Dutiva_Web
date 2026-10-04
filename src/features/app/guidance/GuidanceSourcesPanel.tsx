import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { guidanceMessages as M } from '@/i18n/messages/guidance'
import { authMessages as A } from '@/i18n/messages/auth'
import { common } from '@/i18n/messages/common'
import { statusChipClass } from '@/components/chips'
import { useAuth } from '../auth/authContext'
import { AuthSignInForm } from '../auth/AuthSignInForm'
import { fetchGuidanceSources, fetchRecentLawUpdates } from './api'
import type { GuidanceSource, LawUpdate } from './api'
import { updatesAreStale } from './updatesAreStale'
import {
  COVERAGE_AUDITED_ON,
  COVERAGE_STATUS_LABEL,
  MONITORING_COVERAGE,
  coverageTone,
  noSupportedJurisdictionCovered,
} from './monitoringCoverage'

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; sources: GuidanceSource[]; updates: LawUpdate[] }

function formatDate(iso: string, lang: 'en' | 'fr'): string {
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Same rendering for a date-only string (`YYYY-MM-DD`). Parsed at local noon
 * rather than through `new Date('2026-07-30')`, which JS reads as UTC midnight
 * and would render as the previous day for every user west of Greenwich —
 * i.e. all of Canada.
 */
function formatPlainDate(ymd: string, lang: 'en' | 'fr'): string {
  return formatDate(`${ymd}T12:00:00`, lang)
}

/**
 * Real backend data — no prototype counterpart. Signed out: a magic-link
 * sign-in form. Signed in: guidance_sources + recent law_updates, read
 * directly from Supabase (RLS requires an authenticated session for both).
 */
export function GuidanceSourcesPanel() {
  const { x, lang } = useI18n()
  const { status: authStatus, signOut } = useAuth()
  const [load, setLoad] = useState<LoadState>({ status: 'idle' })
  const requestRef = useRef(0)

  const reload = useCallback(() => {
    const request = ++requestRef.current
    setLoad({ status: 'loading' })
    Promise.all([fetchGuidanceSources(), fetchRecentLawUpdates()])
      .then(([sources, updates]) => {
        if (requestRef.current === request) setLoad({ status: 'ready', sources, updates })
      })
      .catch((error: unknown) => {
        console.error('guidance: failed to load live legal sources', error)
        if (requestRef.current === request) setLoad({ status: 'error' })
      })
  }, [])

  useEffect(() => {
    if (authStatus !== 'signed-in') {
      requestRef.current++
      setLoad({ status: 'idle' })
      return
    }
    reload()
  }, [authStatus, reload])

  return (
    <div className="mt-[28px] rounded-[12px] border border-border bg-surface px-[20px] py-[18px]">
      <div className="flex items-center justify-between gap-[12px]">
        <div>
          <div className="text-[14px] font-semibold text-text">{x(M.guidance_panel_title)}</div>
          <p className="mt-[2px] text-[12px] text-text-muted">{x(M.guidance_panel_beta)}</p>
        </div>
        {authStatus === 'signed-in' && (
          <div className="flex shrink-0 items-center gap-[8px]">
            <button
              type="button"
              onClick={reload}
              disabled={load.status === 'loading'}
              className="flex min-h-[44px] cursor-pointer items-center gap-[5px] rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[12.5px] font-semibold text-text-2 disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={load.status === 'loading' ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              {x(common.refresh)}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="min-h-[44px] cursor-pointer rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[12.5px] font-semibold text-text-2"
            >
              {x(A.auth_sign_out)}
            </button>
          </div>
        )}
      </div>

      {/* Monitoring coverage — shown to everyone, signed in or not. Sweeping a
          page is not the same as being able to detect an amendment on it, and
          a compliance product must not let a customer infer otherwise. */}
      <section className="mt-[16px] rounded-[10px] border border-inset px-[14px] py-[12px]">
        <div className="flex flex-wrap items-baseline justify-between gap-[8px]">
          <div className="text-[12px] font-bold text-text-3">{x(M.guidance_coverage_heading)}</div>
          <div className="text-[11.5px] text-text-muted">
            {x(M.guidance_coverage_audited)} {formatPlainDate(COVERAGE_AUDITED_ON, lang)}
          </div>
        </div>

        <ul className="mt-[10px] flex flex-col gap-[9px]">
          {MONITORING_COVERAGE.map((entry) => (
            <li key={entry.jurisdiction} className="flex items-start gap-[10px]">
              <span className={`${statusChipClass(coverageTone(entry.status))} shrink-0`}>
                {x(COVERAGE_STATUS_LABEL[entry.status])}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-text">{x(entry.label)}</div>
                <p className="mt-[2px] text-[12px] leading-[1.5] text-text-2">{x(entry.detail)}</p>
              </div>
            </li>
          ))}
        </ul>

        {noSupportedJurisdictionCovered() && (
          <div className="mt-[11px] flex items-start gap-[8px] rounded-[8px] border border-risk-border bg-risk-bg px-[11px] py-[9px]">
            <AlertTriangle
              size={14}
              strokeWidth={1.8}
              className="mt-px shrink-0 text-risk-fg"
              aria-hidden="true"
            />
            <span className="text-[12px] leading-[1.55] font-semibold text-risk-fg">
              {x(M.guidance_coverage_none_active)}
            </span>
          </div>
        )}
      </section>

      {authStatus === 'signed-out' && (
        <div className="mt-[16px] flex flex-col gap-[10px]">
          <p className="text-[13px] text-text-2">{x(M.guidance_signin_prompt)}</p>
          <AuthSignInForm idPrefix="guidance" />
        </div>
      )}

      {authStatus === 'sent-link' && (
        <p className="mt-[16px] text-[13px] text-text-2">{x(A.auth_link_sent)}</p>
      )}

      {authStatus === 'loading' && (
        <div className="mt-[16px] flex items-center gap-[8px] text-[13px] text-text-muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          {x(M.guidance_loading)}
        </div>
      )}

      {authStatus === 'signed-in' && load.status === 'loading' && (
        <div className="mt-[16px] flex items-center gap-[8px] text-[13px] text-text-muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          {x(M.guidance_loading)}
        </div>
      )}

      {authStatus === 'signed-in' && load.status === 'error' && (
        <p className="mt-[16px] text-[13px] text-risk-fg">{x(M.guidance_load_error)}</p>
      )}

      {authStatus === 'signed-in' && load.status === 'ready' && (
        <div className="mt-[16px] flex flex-col gap-[18px]">
          <section>
            <div className="mb-[8px] text-[12px] font-bold text-text-3">
              {x(M.guidance_sources_heading)}
            </div>
            {load.sources.length === 0 ? (
              <p className="text-[12.5px] text-text-muted">{x(M.guidance_empty_sources)}</p>
            ) : (
              <ul className="flex flex-col gap-[8px]">
                {load.sources.map((source) => (
                  <li
                    key={source.id}
                    className="flex items-start justify-between gap-[10px] rounded-[10px] border border-inset px-[14px] py-[10px]"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-text">{source.title}</div>
                      {source.jurisdiction && (
                        <div className="mt-[2px] text-[11.5px] text-text-muted">
                          {source.jurisdiction}
                        </div>
                      )}
                    </div>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={source.title}
                        className="mt-[2px] shrink-0 text-text-3"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-[8px] text-[12px] font-bold text-text-3">
              {x(M.guidance_law_updates_heading)}
            </div>
            {load.updates.length === 0 ? (
              <p className="text-[12.5px] text-text-muted">{x(M.guidance_empty_updates)}</p>
            ) : (
              <>
                {updatesAreStale(load.updates) && (
                  <div className="mb-[10px] flex items-start gap-[8px] rounded-[10px] border border-gold-border bg-gold-bg px-[12px] py-[10px]">
                    <AlertTriangle
                      size={14}
                      strokeWidth={1.8}
                      className="mt-px shrink-0 text-gold-fg"
                      aria-hidden="true"
                    />
                    <span className="text-[12px] leading-[1.55] font-semibold text-gold-fg">
                      {x(M.guidance_updates_stale)}
                    </span>
                  </div>
                )}
                <ul className="flex flex-col gap-[8px]">
                  {load.updates.map((update) => (
                    <li
                      key={update.id}
                      className="rounded-[10px] border border-inset px-[14px] py-[10px]"
                    >
                      <div className="text-[13px] font-semibold text-text">
                        {update.lawName}
                        <span className="ml-[6px] font-normal text-text-muted">
                          · {update.jurisdiction}
                        </span>
                      </div>
                      {update.changeSummary && (
                        <p className="mt-[3px] text-[12.5px] text-text-2">{update.changeSummary}</p>
                      )}
                      {update.rawDiff && (
                        <details className="mt-[4px]">
                          <summary className="w-fit cursor-pointer text-[11.5px] font-semibold text-text-3 underline underline-offset-2">
                            {x(M.guidance_update_more)}
                          </summary>
                          <pre className="mt-[4px] font-sans text-[11.5px] leading-[1.55] whitespace-pre-wrap text-text-muted">
                            {update.rawDiff}
                          </pre>
                        </details>
                      )}
                      <div className="mt-[4px] flex flex-wrap items-center gap-x-[12px] gap-y-[4px]">
                        {update.detectedAt && (
                          <p className="text-[11.5px] text-text-muted">
                            {x(M.guidance_detected_on)} {formatDate(update.detectedAt, lang)}
                          </p>
                        )}
                        {(update.referenceUrl ?? update.url) && (
                          <a
                            href={update.referenceUrl ?? update.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-[4px] text-[11.5px] font-semibold text-text-3 underline underline-offset-2"
                          >
                            {x(M.guidance_update_read_source)}
                            <ExternalLink size={11} aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
