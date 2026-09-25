import { useCallback, useEffect, useState } from 'react'
import { Bot, Loader2, Play } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useToasts } from '@/features/app/toasts/toastsContext'
import {
  DEFAULT_AGENT_SETTINGS,
  getAgentSettings,
  runAgentScan,
  saveAgentSettings,
  type AgentBoard,
  type AgentSettings,
} from '@/features/careers/data/agentApi'

function segClass(on: boolean): string {
  return `cursor-pointer rounded-[8px] border-none px-[14px] py-[8px] text-[13px] font-semibold transition-colors duration-150 ${
    on ? 'bg-navy text-white' : 'bg-transparent text-text-muted hover:text-text-2'
  }`
}

const fieldClass =
  'w-full rounded-[8px] border border-border bg-inset px-[10px] py-[8px] text-[13px] text-text outline-none focus:border-accent'
const labelClass = 'text-[12.5px] font-semibold text-text-2'
const hintClass = 'mt-[3px] text-[11.5px] text-text-faint'

function parseCsv(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function boardsToText(boards: AgentBoard[]): string {
  return boards.map((b) => `${b.ats}:${b.slug}`).join('\n')
}

function textToBoards(text: string): AgentBoard[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [ats, slug] = line.split(':').map((s) => s.trim())
      return (ats === 'greenhouse' || ats === 'lever') && slug
        ? ({ ats, slug } as AgentBoard)
        : null
    })
    .filter((b): b is AgentBoard => b !== null)
}

/**
 * Job-search-agent settings — opt-in toggle, review-vs-auto-submit autonomy,
 * targeting filters (roles, locations, remote), the external boards to watch,
 * and the daily submission cap. Saves to candidate_agent_settings (0179);
 * "Run a search now" invokes the candidate-job-agent edge function directly.
 */
export function AgentSettingsCard() {
  const { x } = useI18n()
  const { showToast } = useToasts()
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_AGENT_SETTINGS)
  const [keywordsText, setKeywordsText] = useState('')
  const [locationsText, setLocationsText] = useState('')
  const [boardsText, setBoardsText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)

  const load = useCallback(async () => {
    try {
      const saved = await getAgentSettings()
      const merged = saved ?? DEFAULT_AGENT_SETTINGS
      setSettings(merged)
      setKeywordsText(merged.keywords.join(', '))
      setLocationsText(merged.locations.join(', '))
      setBoardsText(boardsToText(merged.boards))
    } catch {
      /* leave defaults — the card still lets them save */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      const next: AgentSettings = {
        ...settings,
        keywords: parseCsv(keywordsText),
        locations: parseCsv(locationsText),
        boards: textToBoards(boardsText),
      }
      await saveAgentSettings(next)
      setSettings(next)
      showToast(M.careers_agent_saved, 'ok')
    } catch {
      showToast(M.careers_error_generic, 'info')
    } finally {
      setSaving(false)
    }
  }

  const onRunScan = async () => {
    if (scanning) return
    if (!settings.enabled || settings.boards.length === 0) {
      showToast(M.careers_agent_run_needs_setup, 'info')
      return
    }
    setScanning(true)
    try {
      const summary = await runAgentScan()
      const tpl = summary.discovered > 0 ? M.careers_agent_scan_done : M.careers_agent_scan_none
      showToast(
        {
          en: tpl.en.replace('{count}', String(summary.discovered)),
          fr: tpl.fr.replace('{count}', String(summary.discovered)),
        },
        'ok',
      )
    } catch {
      showToast(M.careers_error_generic, 'info')
    } finally {
      setScanning(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-[12px] border border-border bg-surface p-[20px]">
        <div className="flex items-center gap-[8px] text-[13px] text-text-muted">
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          {x(M.careers_loading)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[12px] border border-border bg-surface p-[20px]">
      <div className="flex items-center gap-[8px]">
        <Bot size={17} strokeWidth={2} className="text-accent" aria-hidden="true" />
        <h2 className="m-0 text-[15px] font-semibold text-text">{x(M.careers_agent_title)}</h2>
      </div>
      <p className="mt-[6px] mb-[14px] text-[12.5px] leading-[1.5] text-text-muted">
        {x(M.careers_agent_body)}
      </p>

      <div className="flex flex-col gap-[16px]">
        {/* Enable */}
        <div className="flex items-center justify-between gap-[12px]">
          <span className="text-[13.5px] font-semibold text-text-2">
            {x(M.careers_agent_enable)}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
            className={`h-[24px] w-[44px] cursor-pointer rounded-full border-none p-[2px] transition-colors duration-150 ${
              settings.enabled ? 'bg-navy' : 'bg-border'
            }`}
          >
            <span
              className={`block h-[20px] w-[20px] rounded-full bg-white transition-transform duration-150 ${
                settings.enabled ? 'translate-x-[20px]' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Autonomy */}
        <div className="flex flex-wrap items-center justify-between gap-[10px]">
          <span className="text-[13.5px] font-semibold text-text-2">
            {x(M.careers_agent_autonomy_label)}
          </span>
          <div
            role="tablist"
            aria-label={x(M.careers_agent_autonomy_label)}
            className="flex gap-[4px] rounded-[10px] bg-inset p-[3px]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={settings.autonomy === 'review'}
              onClick={() => setSettings((s) => ({ ...s, autonomy: 'review' }))}
              className={segClass(settings.autonomy === 'review')}
            >
              {x(M.careers_agent_review_each)}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={settings.autonomy === 'auto_submit'}
              onClick={() => setSettings((s) => ({ ...s, autonomy: 'auto_submit' }))}
              className={segClass(settings.autonomy === 'auto_submit')}
            >
              {x(M.careers_agent_auto_submit)}
            </button>
          </div>
        </div>
        {settings.autonomy === 'auto_submit' && (
          <p className="m-0 -mt-[8px] text-[11.5px] leading-[1.5] text-text-faint">
            {x(M.careers_agent_auto_note)}
          </p>
        )}

        {/* Keywords / locations */}
        <div>
          <label htmlFor="agent-keywords" className={labelClass}>
            {x(M.careers_agent_keywords)}
          </label>
          <input
            id="agent-keywords"
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            className={`${fieldClass} mt-[4px]`}
            placeholder="payroll, HR coordinator"
          />
          <div className={hintClass}>{x(M.careers_agent_keywords_hint)}</div>
        </div>
        <div>
          <label htmlFor="agent-locations" className={labelClass}>
            {x(M.careers_agent_locations)}
          </label>
          <input
            id="agent-locations"
            value={locationsText}
            onChange={(e) => setLocationsText(e.target.value)}
            className={`${fieldClass} mt-[4px]`}
            placeholder="Toronto, Montreal, Quebec"
          />
          <div className={hintClass}>{x(M.careers_agent_locations_hint)}</div>
        </div>
        <label className="flex cursor-pointer items-center gap-[8px] text-[13px] font-semibold text-text-2">
          <input
            type="checkbox"
            checked={settings.remoteOk}
            onChange={(e) => setSettings((s) => ({ ...s, remoteOk: e.target.checked }))}
            className="h-[15px] w-[15px] accent-[#1c3f94]"
          />
          {x(M.careers_agent_remote)}
        </label>

        {/* Boards */}
        <div>
          <label htmlFor="agent-boards" className={labelClass}>
            {x(M.careers_agent_boards)}
          </label>
          <textarea
            id="agent-boards"
            value={boardsText}
            onChange={(e) => setBoardsText(e.target.value)}
            rows={3}
            className={`${fieldClass} mt-[4px] resize-y font-mono text-[12.5px]`}
            placeholder={'greenhouse:acme\nlever:northstar'}
          />
          <div className={hintClass}>{x(M.careers_agent_boards_hint)}</div>
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
          <div>
            <label htmlFor="agent-min-score" className={labelClass}>
              {x(M.careers_agent_min_score)}
            </label>
            <input
              id="agent-min-score"
              type="number"
              min={0}
              max={100}
              value={settings.minMatchScore}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  minMatchScore: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                }))
              }
              className={`${fieldClass} mt-[4px]`}
            />
          </div>
          <div>
            <label htmlFor="agent-daily-cap" className={labelClass}>
              {x(M.careers_agent_daily_cap)}
            </label>
            <input
              id="agent-daily-cap"
              type="number"
              min={1}
              max={50}
              value={settings.dailyApplyCap}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  dailyApplyCap: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                }))
              }
              className={`${fieldClass} mt-[4px]`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-[10px]">
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white disabled:cursor-default disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
            {x(M.careers_agent_save)}
          </button>
          <button
            type="button"
            onClick={() => void onRunScan()}
            disabled={scanning}
            className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border border-border bg-transparent px-[14px] py-[8px] text-[13px] font-semibold text-text-2 hover:bg-inset disabled:cursor-default disabled:opacity-60"
          >
            {scanning ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Play size={14} strokeWidth={2} aria-hidden="true" />
            )}
            {scanning ? x(M.careers_agent_running) : x(M.careers_agent_run_now)}
          </button>
        </div>
      </div>
    </div>
  )
}
