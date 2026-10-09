import '@/features/invest/portal/strategies.css'
import './health.css'
import { useEffect, useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { addJournalEntry } from '@/features/health/data/api'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useHealthHead } from './useHealthHead'

const BREATH_PHASE_MS = 4_000
const BREATH_PHASES = ['in', 'hold-in', 'out', 'hold-out'] as const

function BreathingCard() {
  const { x } = useI18n()
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<(typeof BREATH_PHASES)[number]>('in')
  const [seconds, setSeconds] = useState(BREATH_PHASE_MS / 1000)
  const [cycles, setCycles] = useState(0)

  /* One 1s ticker drives the countdown; the phase advances when it hits 0.
     The CSS circle reads the same 4s constant so motion and text stay in
     step. No audio, no haptics — the pace is the whole point. */
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s > 1) return s - 1
        setPhase((p) => {
          const next = (BREATH_PHASES.indexOf(p) + 1) % BREATH_PHASES.length
          if (next === 0) setCycles((c) => c + 1)
          return BREATH_PHASES[next] ?? 'in'
        })
        return BREATH_PHASE_MS / 1000
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running])

  const toggle = () => {
    if (running) {
      setRunning(false)
      setPhase('in')
      setSeconds(BREATH_PHASE_MS / 1000)
    } else {
      setRunning(true)
    }
  }

  const phaseLabel =
    phase === 'in'
      ? HM.health_tool_breath_in
      : phase === 'out'
        ? HM.health_tool_breath_out
        : HM.health_tool_breath_hold

  return (
    <>
      <div className="sb-section-head">
        <h2>{x(HM.health_tool_breath_title)}</h2>
      </div>
      <section className="sb-card sb-card-pad">
        <p className="sb-helper">{x(HM.health_tool_breath_body)}</p>
        <div className="mt-[16px] flex flex-col items-center gap-[16px]">
          <div
            className="hb-breath"
            data-phase={running ? phase : 'out'}
            style={{ ['--breath-ms' as string]: `${BREATH_PHASE_MS}ms` }}
            role="img"
            aria-label={x(phaseLabel)}
          >
            {running ? `${x(phaseLabel)} · ${seconds}` : x(HM.health_tool_breath_start)}
          </div>
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              className={`sb-btn ${running ? 'sb-btn-secondary' : 'sb-btn-primary'}`}
              onClick={toggle}
              aria-live="off"
            >
              {x(running ? HM.health_tool_breath_stop : HM.health_tool_breath_start)}
            </button>
            {cycles > 0 && (
              <span className="sb-pill">
                {x(HM.health_tool_breath_cycle).replace('{count}', String(cycles))}
              </span>
            )}
          </div>
          {/* Screen readers get the phase changes without watching the circle. */}
          <span className="sr-only" aria-live="polite">
            {running ? x(phaseLabel) : ''}
          </span>
        </div>
      </section>
    </>
  )
}

const GROUND_STEPS = [
  HM.health_tool_ground_s5,
  HM.health_tool_ground_s4,
  HM.health_tool_ground_s3,
  HM.health_tool_ground_s2,
  HM.health_tool_ground_s1,
] as const

function GroundingCard() {
  const { x } = useI18n()
  const [step, setStep] = useState(0)
  const done = step >= GROUND_STEPS.length

  return (
    <>
      <div className="sb-section-head">
        <h2>{x(HM.health_tool_ground_title)}</h2>
      </div>
      <section className="sb-card sb-card-pad">
        <p className="sb-helper">{x(HM.health_tool_ground_body)}</p>
        <ol className="mt-[14px] flex list-none flex-col gap-[8px] p-0">
        {GROUND_STEPS.map((label, i) => (
          <li
            key={i}
            className={`hb-res-item ${i === step ? 'is-current' : ''}`}
            style={i === step ? { borderColor: 'var(--sb-accent)' } : undefined}
            aria-current={i === step ? 'step' : undefined}
          >
            <span
              className="hb-res-icon"
              aria-hidden="true"
              style={{ width: 30, height: 30, fontSize: 13, fontWeight: 700 }}
            >
              {i < step ? '✓' : i + 1}
            </span>
            <span className={`hb-res-name ${i < step ? 'text-[color:var(--sb-muted)]' : ''}`}>
              {x(label)}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-[14px] flex items-center gap-[10px]">
        {done ? (
          <>
            <p className="m-0 flex-1 text-[13px] text-[color:var(--sb-body)]">
              {x(HM.health_tool_ground_done)}
            </p>
            <button
              type="button"
              className="sb-btn sb-btn-secondary"
              onClick={() => setStep(0)}
            >
              <RotateCcw size={13} aria-hidden="true" />
              {x(HM.health_tool_ground_restart)}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="sb-btn sb-btn-primary"
            onClick={() => setStep((s) => s + 1)}
          >
            {x(HM.health_tool_ground_next)}
          </button>
        )}
      </div>
      </section>
    </>
  )
}

const GRAT_PROMPTS = [
  HM.health_tool_grat_p1,
  HM.health_tool_grat_p2,
  HM.health_tool_grat_p3,
  HM.health_tool_grat_p4,
] as const

function GratitudeCard() {
  const { x } = useI18n()
  const { refresh } = useHealthData()
  const { showToast } = useToasts()
  const [promptIdx, setPromptIdx] = useState(0)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  /* "Another prompt" advances deterministically — no random repeat of the
     prompt the user is looking at. */
  const nextPrompt = () => {
    setPromptIdx((i) => (i + 1) % GRAT_PROMPTS.length)
  }

  const save = async () => {
    const trimmed = body.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await addJournalEntry({ title: x(HM.health_tool_grat_entry), body: trimmed })
      await refresh()
      setBody('')
      showToast(HM.health_tool_grat_saved)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="sb-section-head">
        <h2>{x(HM.health_tool_grat_title)}</h2>
      </div>
      <section className="sb-card sb-card-pad">
        <p className="sb-helper">{x(HM.health_tool_grat_body)}</p>
        <div className="mt-[14px] flex flex-col gap-[12px]">
        <div className="flex items-center justify-between gap-[10px]">
          <p className="m-0 text-[14px] font-semibold text-[color:var(--sb-ink)]">
            {x(GRAT_PROMPTS[promptIdx] ?? GRAT_PROMPTS[0]!)}
          </p>
          <button
            type="button"
            className="sb-btn sb-btn-sm sb-btn-secondary"
            onClick={nextPrompt}
          >
            {x(HM.health_tool_grat_another)}
          </button>
        </div>
        <textarea
          className="hb-textarea"
          style={{ minHeight: 88 }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={x(HM.health_tool_grat_ph)}
          maxLength={2000}
          aria-label={x(HM.health_tool_grat_title)}
        />
        <div>
          <button
            type="button"
            className="sb-btn sb-btn-primary"
            disabled={!body.trim() || saving}
            onClick={() => void save()}
          >
            {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {x(HM.health_tool_grat_save)}
          </button>
        </div>
      </div>
      </section>
    </>
  )
}

/**
 * Tools — three self-guided pauses that run entirely client-side. None of
 * them need an AI call, and only the gratitude note persists (as an ordinary
 * journal entry). Non-clinical by design: structure for a pause, nothing
 * claiming to treat or measure anything.
 */
export function HealthToolsPage() {
  const { x } = useI18n()
  useHealthHead(HM.health_seo_title_tools, HM.health_seo_desc_tools)

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_tools_title)}</h1>
      </div>
      <p className="sb-sub">{x(HM.health_tools_sub)}</p>

      <div className="mt-[18px] flex flex-col gap-[18px]">
        <BreathingCard />
        <GroundingCard />
        <GratitudeCard />
      </div>

      <div className="sb-note" style={{ marginTop: 18 }}>
        {x(HM.health_tools_note)}
      </div>
    </div>
  )
}
