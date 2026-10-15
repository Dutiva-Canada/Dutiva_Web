import '@/features/invest/portal/strategies.css'
import './health.css'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, Loader2, RefreshCw, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { healthMessages as HM } from '@/i18n/messages/health'
import { addJournalEntry, shareEntryWithMira } from '@/features/health/data/api'
import { healthModalities } from '@/features/health/data/healthModalities'
import { useHealthData } from '@/features/health/data/HealthDataContext'
import { useAuth } from '@/features/app/auth/authContext'
import { isInternalDutivaAccount } from '@/lib/billing/adminAccess'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useHealthHead } from './useHealthHead'

/* Breath pacing modes — each step is [phase, seconds]. `hold-in` keeps the
   circle expanded and `out`/`hold-out` shrink it (the CSS scales by phase),
   so a 4·7·8 run is just a box without the empty-lungs hold. The countdown
   and the CSS transition both read the current step's duration. */
type BreathStep = readonly ['in' | 'hold-in' | 'out' | 'hold-out', number]
interface BreathMode {
  id: string
  /** Bilingual chip label — null when the digits alone carry it (4·7·8). */
  labelKey: { en: string; fr: string } | null
  steps: readonly BreathStep[]
}
const BREATH_MODES: readonly BreathMode[] = [
  {
    id: 'box',
    labelKey: HM.health_tool_breath_mode_box,
    steps: [
      ['in', 4],
      ['hold-in', 4],
      ['out', 4],
      ['hold-out', 4],
    ],
  },
  {
    id: 'relax',
    labelKey: null,
    steps: [
      ['in', 4],
      ['hold-in', 7],
      ['out', 8],
    ],
  },
]

/* Phase cues — a soft WebAudio chime plus a short haptic pulse mark each
   transition, so the exercise works with eyes closed. The AudioContext is
   created inside the Start press (autoplay rules need the gesture); the
   per-step effect only plays on a ready context. Persisted — one toggle
   and the choice sticks. */
const BREATH_CUES_KEY = 'dutiva:health:breath-cues'

function BreathingCard() {
  const { x } = useI18n()
  const [modeId, setModeId] = useState<(typeof BREATH_MODES)[number]['id']>('box')
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState({ step: 0, secs: BREATH_MODES[0]!.steps[0]![1] })
  const [cycles, setCycles] = useState(0)
  /* Opt-in, not opt-out — a pause tool shouldn't sound or buzz before the
     person asks it to. 'on' is the stored value; anything else is off. */
  const [cues, setCues] = useState(() => localStorage.getItem(BREATH_CUES_KEY) === 'on')
  const audioRef = useRef<AudioContext | null>(null)

  const toggleCues = () =>
    setCues((on) => {
      localStorage.setItem(BREATH_CUES_KEY, on ? 'off' : 'on')
      return !on
    })

  const mode = BREATH_MODES.find((m) => m.id === modeId) ?? BREATH_MODES[0]!
  const steps = mode.steps
  const phase = steps[beat.step]?.[0] ?? 'in'

  /* One 1s ticker drives the countdown; the step advances when it hits 0.
     The CSS circle reads the same per-step duration so motion and text stay
     in step. No audio, no haptics — the pace is the whole point. The
     updater stays pure: the cycle tally lives in the wrap effect below —
     StrictMode replays updaters in dev and would count every lap twice. */
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setBeat((b) => {
        if (b.secs > 1) return { ...b, secs: b.secs - 1 }
        const next = (b.step + 1) % steps.length
        return { step: next, secs: steps[next]?.[1] ?? 4 }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running, steps])

  /* A lap completes when the step wraps from the last phase back to the
     first — observed here, not inside the beat updater. */
  const prevStepRef = useRef(0)
  useEffect(() => {
    if (running && prevStepRef.current === steps.length - 1 && beat.step === 0) {
      setCycles((c) => c + 1)
    }
    prevStepRef.current = beat.step
  }, [beat.step, running, steps.length])

  /* The cue fires on the phase change itself — the countdown ticking over
     is what an eyes-closed user needs marked. Inhale rises (660 Hz),
     exhale settles (440 Hz), holds get a shorter, quieter blip. Audio and
     haptics are a nicety wrapped in try/catch: neither may break the tool. */
  useEffect(() => {
    if (!running || !cues) return
    const step = steps[beat.step]?.[0] ?? 'in'
    try {
      navigator.vibrate?.(step === 'in' ? 45 : step === 'out' ? 65 : 20)
      const ctx = audioRef.current
      if (ctx && ctx.state === 'running') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = step === 'in' ? 660 : step === 'out' ? 440 : 520
        const t = ctx.currentTime
        const tail = step === 'hold-in' || step === 'hold-out' ? 0.35 : 0.8
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(step.startsWith('hold') ? 0.04 : 0.07, t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + tail)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + tail + 0.05)
      }
    } catch {
      /* a silent tool still works — the circle and the count carry it */
    }
  }, [beat.step, running, cues, steps])

  /* Stop ends the session: the circle and count reset, but the cycle tally
     stays up — it's the record of what you just did. Starting again begins
     a fresh count. */
  const toggle = () => {
    if (running) {
      setRunning(false)
      setBeat({ step: 0, secs: steps[0]?.[1] ?? 4 })
    } else {
      /* AudioContext needs the press gesture to leave `suspended` — warm
         it here so the first chime actually sounds. */
      try {
        const Ctor =
          window.AudioContext ??
          (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (Ctor) {
          audioRef.current ??= new Ctor()
          if (audioRef.current.state === 'suspended') void audioRef.current.resume()
        }
      } catch {
        /* no audio stack — cues just stay silent */
      }
      setCycles(0)
      setBeat({ step: 0, secs: steps[0]?.[1] ?? 4 })
      setRunning(true)
    }
  }

  const pickMode = (id: string) => {
    if (running || id === modeId) return
    const m = BREATH_MODES.find((mm) => mm.id === id) ?? BREATH_MODES[0]!
    setModeId(id)
    setBeat({ step: 0, secs: m.steps[0]?.[1] ?? 4 })
  }

  const phaseLabel =
    phase === 'in'
      ? HM.health_tool_breath_in
      : phase === 'out'
        ? HM.health_tool_breath_out
        : HM.health_tool_breath_hold
  const pattern = steps.map((s) => s[1]).join('·')

  return (
    <section id="breathing" aria-labelledby="hb-t-breath" className="hb-tool-sec">
      <div className="sb-section-head">
        <h2 id="hb-t-breath">{x(HM.health_tool_breath_title)}</h2>
      </div>
      <div className="sb-card sb-card-pad">
        <p className="sb-helper">{x(HM.health_tool_breath_body)}</p>
        <div className="mt-[16px] flex flex-col items-center gap-[16px]">
          <div
            className="flex items-center gap-[8px]"
            role="group"
            aria-label={x(HM.health_tool_breath_mode_label)}
          >
            {BREATH_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`hb-pace ${modeId === m.id ? 'is-on' : ''}`}
                aria-pressed={modeId === m.id}
                disabled={running}
                onClick={() => pickMode(m.id)}
              >
                {m.labelKey ? x(m.labelKey) : '4·7·8'}
              </button>
            ))}
          </div>
          <div
            className="hb-breath"
            data-phase={running ? phase : 'out'}
            style={{ ['--breath-ms' as string]: `${(steps[beat.step]?.[1] ?? 4) * 1000}ms` }}
            role="img"
            aria-label={running ? `${x(phaseLabel)} · ${beat.secs}` : pattern}
          >
            {/* The disc breathes; the label doesn't — shrinking text with
                the circle made the resting readout ~10px tall. */}
            <span className="hb-breath-disc" aria-hidden="true" />
            <span className="hb-breath-label">
              {running ? `${x(phaseLabel)} · ${beat.secs}` : pattern}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-[10px]">
            <button
              type="button"
              className={`sb-btn ${running ? 'sb-btn-secondary' : 'sb-btn-primary'}`}
              onClick={toggle}
            >
              {x(running ? HM.health_tool_breath_stop : HM.health_tool_breath_start)}
            </button>
            <button
              type="button"
              className={`hb-pace ${cues ? 'is-on' : ''}`}
              aria-pressed={cues}
              title={x(HM.health_tool_breath_cues_hint)}
              onClick={toggleCues}
            >
              {cues ? (
                <Volume2 size={13} aria-hidden="true" />
              ) : (
                <VolumeX size={13} aria-hidden="true" />
              )}
              {x(HM.health_tool_breath_cues)}
            </button>
            {cycles > 0 && (
              <span className="sb-pill">
                {x(HM.health_tool_breath_cycle).replace('{count}', String(cycles))}
              </span>
            )}
          </div>
          {running && cycles >= 3 && (
            <p className="hb-row-meta m-0">{x(HM.health_tool_breath_nudge)}</p>
          )}
          {!running && cycles > 0 && (
            <Link className="hb-quiet-link" to="/health/checkin">
              {x(HM.health_tool_checkin_link)}
            </Link>
          )}
          {/* Screen readers get the phase changes without watching the circle. */}
          <span className="sr-only" aria-live="polite">
            {running ? x(phaseLabel) : ''}
          </span>
        </div>
      </div>
    </section>
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
    <section id="grounding" aria-labelledby="hb-t-ground" className="hb-tool-sec">
      <div className="sb-section-head">
        <h2 id="hb-t-ground">{x(HM.health_tool_ground_title)}</h2>
      </div>
      <div className="sb-card sb-card-pad">
        <p className="sb-helper">{x(HM.health_tool_ground_body)}</p>
        <ol className="mt-[14px] flex list-none flex-col gap-[8px] p-0">
          {GROUND_STEPS.map((label, i) => (
            <li
              key={i}
              className={`hb-res-item hb-res-item--static ${i === step ? 'is-current' : ''}`}
              aria-current={i === step ? 'step' : undefined}
            >
              {/* The badge echoes the count the row asks for (5 things, 4
                  things…) — the ordinal "1 ↔ 5 things" juxtaposition read
                  like two numbers disagreeing. Done steps keep the check. */}
              <span className="hb-res-icon hb-step-badge" aria-hidden="true">
                {i < step ? <Check size={15} strokeWidth={3} /> : GROUND_STEPS.length - i}
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
              <Link className="hb-quiet-link" to="/health/checkin">
                {x(HM.health_tool_checkin_link)}
              </Link>
            </>
          ) : (
            <>
              {step > 0 && (
                <button
                  type="button"
                  className="sb-btn sb-btn-sm sb-btn-secondary"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  {x(HM.health_tool_ground_back)}
                </button>
              )}
              <button
                type="button"
                className="sb-btn sb-btn-primary"
                onClick={() => setStep((s) => s + 1)}
              >
                {x(HM.health_tool_ground_next)}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

const GRAT_PROMPTS = [
  HM.health_tool_grat_p1,
  HM.health_tool_grat_p2,
  HM.health_tool_grat_p3,
  HM.health_tool_grat_p4,
  HM.health_tool_grat_p5,
  HM.health_tool_grat_p6,
  HM.health_tool_grat_p7,
  HM.health_tool_grat_p8,
] as const
const GRAT_MAX = 2000
const GRAT_COUNT_FROM = GRAT_MAX - 200

function GratitudeCard() {
  const { x, lang } = useI18n()
  const { refresh } = useHealthData()
  const { showToast } = useToasts()
  const [promptIdx, setPromptIdx] = useState(0)
  const [body, setBody] = useState('')
  const [share, setShare] = useState(false)
  const [saving, setSaving] = useState(false)

  /* "Another prompt" advances deterministically — no random repeat of the
     prompt the user is looking at. */
  const nextPrompt = () => {
    setPromptIdx((i) => (i + 1) % GRAT_PROMPTS.length)
  }

  const prompt = GRAT_PROMPTS[promptIdx] ?? GRAT_PROMPTS[0]!

  const save = async () => {
    const trimmed = body.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      /* The prompt rides into the title so a run of gratitude notes stays
         distinguishable in the journal list. */
      const entry = await addJournalEntry({
        title: `${x(HM.health_tool_grat_entry)} — ${x(prompt)}`,
        body: trimmed,
      })
      if (share) {
        /* Explicit per-entry consent — the same stamp the journal page's
           share toggle produces. A failed share mustn't mask a saved note. */
        await shareEntryWithMira(entry.id, lang).catch(() => {
          showToast(HM.health_tool_grat_share_failed, 'info')
        })
      }
      await refresh()
      setBody('')
      showToast(HM.health_tool_grat_saved, 'ok', {
        label: HM.health_tool_grat_view,
        to: '/health/journal',
      })
    } catch {
      showToast(HM.health_tool_grat_failed)
    } finally {
      setSaving(false)
    }
  }

  const remaining = GRAT_MAX - body.length

  return (
    <section id="gratitude" aria-labelledby="hb-t-grat" className="hb-tool-sec">
      <div className="sb-section-head">
        <h2 id="hb-t-grat">{x(HM.health_tool_grat_title)}</h2>
      </div>
      <div className="sb-card sb-card-pad">
        <p className="sb-helper">{x(HM.health_tool_grat_body)}</p>
        <div className="mt-[14px] flex flex-col gap-[12px]">
          <div className="flex items-center justify-between gap-[10px]">
            {/* aria-live so swapping the prompt announces — the button keeps
                focus, so nothing else tells a screen reader it changed. */}
            <p className="m-0 text-[14px] font-semibold text-[color:var(--sb-ink)]" aria-live="polite">
              {x(prompt)}
            </p>
            <button
              type="button"
              className="sb-btn sb-btn-sm sb-btn-secondary"
              onClick={nextPrompt}
            >
              <RefreshCw size={13} aria-hidden="true" />
              {x(HM.health_tool_grat_another)}
            </button>
          </div>
          <textarea
            className="hb-textarea"
            style={{ minHeight: 88 }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={x(HM.health_tool_grat_ph)}
            maxLength={GRAT_MAX}
            aria-label={x(prompt)}
          />
          {remaining < GRAT_MAX - GRAT_COUNT_FROM && (
            <p className="hb-row-meta m-0 text-right">
              {x(HM.health_tool_grat_count).replace('{count}', String(remaining))}
            </p>
          )}
          <label className="hb-check">
            <input
              type="checkbox"
              checked={share}
              onChange={(e) => setShare(e.target.checked)}
            />
            {x(HM.health_tool_grat_share)}
          </label>
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
      </div>
    </section>
  )
}

/* The chat composer's sessionStorage draft key for the default thread —
   the same key HealthChatPage's usePortalChatDraft reads on mount. Seeding
   it before navigation lands the request already typed in the box. */
const HEALTH_CHAT_DRAFT_KEY = 'dutiva:health-chat:main'

/**
 * The modality library — what Mira knows, split honestly: approaches she
 * can guide step-by-step (internal accounts — the server gates the same
 * range on @dutiva.ca) and clinician-led ones she explains but never
 * conducts (EMDR, hypnotherapy). "Ask Mira" seeds the composer with a
 * tell-me-about-it prompt and is safe for every tier; "Practice with Mira"
 * only renders where the server will actually guide.
 */
function PracticesSection() {
  const { x, lang } = useI18n()
  const { session } = useAuth()
  const navigate = useNavigate()
  const isInternal = isInternalDutivaAccount(session?.user?.email)

  /* Appends rather than overwrites — an unsent draft in the main thread is
     the user's text, and a one-click chip shouldn't silently erase it. */
  const seedChat = (text: string) => {
    try {
      const prev = sessionStorage.getItem(HEALTH_CHAT_DRAFT_KEY)?.trim()
      sessionStorage.setItem(HEALTH_CHAT_DRAFT_KEY, prev ? `${prev}\n\n${text}` : text)
    } catch {
      /* storage blocked — the chat opens empty; the question is still
         readable on the card */
    }
    navigate('/health/chat')
  }

  const guided = healthModalities.filter((m) => m.guided)
  const clinician = healthModalities.filter((m) => !m.guided)

  const renderRow = (m: (typeof healthModalities)[number]) => (
    <div key={m.id} className="hb-row">
      <div className="hb-row-main">
        <span className="hb-row-title">{m.name[lang]}</span>
        <p className="hb-row-body">{m.what[lang]}</p>
        <p className="hb-row-body">
          <span className="hb-row-meta">
            {x(m.guided ? HM.health_tool_practice_guided : HM.health_tool_practice_explains)}
            {': '}
          </span>
          {m.mira[lang]}
        </p>
        {m.note && <p className="hb-row-meta">{m.note[lang]}</p>}
      </div>
      <div className="hb-row-side">
        {m.guided && isInternal && m.practiceAsk && (
          <button
            type="button"
            className="sb-btn sb-btn-sm sb-btn-primary"
            aria-label={x(HM.health_tool_practice_go_label).replace('{name}', m.name[lang])}
            onClick={() => seedChat(m.practiceAsk?.[lang] ?? '')}
          >
            {x(HM.health_tool_practice_go)}
          </button>
        )}
        <button
          type="button"
          className="sb-btn sb-btn-sm sb-btn-secondary"
          aria-label={x(HM.health_tool_practice_ask_label).replace('{name}', m.name[lang])}
          onClick={() => seedChat(m.ask[lang])}
        >
          {x(HM.health_tool_practice_ask)}
        </button>
      </div>
    </div>
  )

  return (
    <div className="sb-card sb-card-pad">
      <h2 style={{ marginTop: 0 }}>{x(HM.health_tools_practice_title)}</h2>
      <p className="sb-body-text" style={{ marginTop: 0 }}>
        {x(HM.health_tools_practice_sub)}
      </p>
      {/* The gate is stated once, here — not repeated under every row. */}
      {!isInternal && <p className="sb-helper">{x(HM.health_tool_practice_int)}</p>}
      <div className="hb-rows hb-mod-rows">
        <h3 className="hb-group-head">{x(HM.health_tools_group_guided)}</h3>
        {guided.map(renderRow)}
        <h3 className="hb-group-head">{x(HM.health_tools_group_clinician)}</h3>
        {clinician.map(renderRow)}
      </div>
    </div>
  )
}

type ToolTab = 'exercises' | 'practices'
const TOOL_TABS: readonly { key: ToolTab; label: { en: string; fr: string } }[] = [
  { key: 'exercises', label: HM.health_tools_tab_exercises },
  { key: 'practices', label: HM.health_tools_practice_title },
]
/* Tool-section ids — a hash naming one opens the exercises tab and scrolls
   to it; #practices opens the library tab. */
const TOOL_SECTION_IDS = new Set(['breathing', 'grounding', 'gratitude'])

/**
 * Tools — three self-guided pauses that run entirely client-side, split from
 * the modality library by a tab so each surface stays short. None of the
 * exercises need an AI call, and only the gratitude note persists (as an
 * ordinary journal entry, shared with Mira only when the box is ticked).
 * Non-clinical by design: structure for a pause, nothing claiming to treat
 * or measure anything. Practices lists the approaches Mira can bring to
 * chat — the exercises stay with her there, where the conversation happens.
 */
export function HealthToolsPage() {
  const { x } = useI18n()
  useHealthHead(HM.health_seo_title_tools, HM.health_seo_desc_tools)
  const [tab, setTab] = useState<ToolTab>('exercises')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const { hash } = useLocation()

  /* Inbound deep links — Mira's seeds, card links, shared URLs. Runs on hash
     change too, so an in-page link to a tool still lands correctly. */
  useEffect(() => {
    const h = hash.slice(1)
    if (h === 'practices') setTab('practices')
    else if (TOOL_SECTION_IDS.has(h)) {
      setTab('exercises')
      requestAnimationFrame(() =>
        document.getElementById(h)?.scrollIntoView({ block: 'start' }),
      )
    }
  }, [hash])

  const selectTab = (t: ToolTab) => {
    setTab(t)
    try {
      window.history.replaceState(
        null,
        '',
        t === 'practices' ? '#practices' : window.location.pathname + window.location.search,
      )
    } catch {
      /* file:// or locked-down contexts — the tab still switches */
    }
  }

  /* Arrow-key roving between tabs (home/end too) — select follows focus. */
  const onTabKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = TOOL_TABS.length - 1
    const next =
      e.key === 'ArrowRight' ? (i + 1) % TOOL_TABS.length
      : e.key === 'ArrowLeft' ? (i - 1 + TOOL_TABS.length) % TOOL_TABS.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1
    if (next < 0) return
    e.preventDefault()
    tabRefs.current[next]?.focus()
    selectTab(TOOL_TABS[next]!.key)
  }

  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <h1>{x(HM.health_tools_title)}</h1>
      </div>
      <p className="sb-sub">{x(HM.health_tools_sub)}</p>

      <div className="hb-tabs" role="tablist" aria-label={x(HM.health_tools_tabs_aria)}>
        {TOOL_TABS.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`hb-tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`hb-panel-${t.key}`}
            tabIndex={tab === t.key ? 0 : -1}
            className="hb-tab"
            onClick={() => selectTab(t.key)}
            onKeyDown={(e) => onTabKeyDown(e, i)}
          >
            {x(t.label)}
          </button>
        ))}
      </div>

      {tab === 'exercises' ? (
        <div
          role="tabpanel"
          id="hb-panel-exercises"
          aria-labelledby="hb-tab-exercises"
          className="mt-[18px] flex flex-col gap-[18px]"
        >
          <BreathingCard />
          <GroundingCard />
          <GratitudeCard />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="hb-panel-practices"
          aria-labelledby="hb-tab-practices"
          className="hb-tool-sec mt-[18px]"
        >
          <PracticesSection />
        </div>
      )}

      <div className="sb-note" style={{ marginTop: 18 }}>
        <p className="m-0">
          {x(HM.health_tools_note)}{' '}
          <Link to="/health/resources">{x(HM.health_tools_note_link)}</Link>
        </p>
      </div>
    </div>
  )
}
