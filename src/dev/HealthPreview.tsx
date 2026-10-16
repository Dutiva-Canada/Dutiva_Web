/* TEMPORARY dev-only preview harness for the /wellness portal — mounts the
   real page components on fixture data inside the real providers so the
   visual state can be reviewed without auth. Not routed in production
   builds (routes.tsx gates the route on import.meta.env.DEV). */
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Globe, LogOut } from 'lucide-react'
import { LangProvider } from '@/i18n/LangProvider'
import { useI18n } from '@/i18n/context'
import type { Lang } from '@/i18n/core'
import { healthMessages as HM } from '@/i18n/messages/health'
import { useTheme } from '@/lib/themeContext'
import { HealthDataContext } from '@/features/health/data/HealthDataContext'
import type { HealthDataContextValue } from '@/features/health/data/HealthDataContext'
import type {
  HealthChatTurn,
} from '@/features/health/data/api'
import type {
  HealthCheckIn,
  HealthHabit,
  HealthHabitLog,
  HealthJournalEntry,
  HealthMemory,
  HealthState,
} from '@/features/health/data/types'
import { ToastsProvider } from '@/features/app/toasts/ToastsProvider'
import { ToastHost } from '@/features/app/toasts/ToastHost'
import { AuthContext } from '@/features/app/auth/authContext'
import type { AuthContextValue } from '@/features/app/auth/authContext'
import { ThemeCycleButton } from '@/features/invest/portal/InvestPortalLayout'
import { HealthFooter } from '@/features/health/portal/HealthFooter'
import { HealthHomePage } from '@/features/health/portal/HealthHomePage'
import { HealthCheckInPage } from '@/features/health/portal/HealthCheckInPage'
import { HealthHabitsPage } from '@/features/health/portal/HealthHabitsPage'
import { HealthJournalPage } from '@/features/health/portal/HealthJournalPage'
import { HealthToolsPage } from '@/features/health/portal/HealthToolsPage'
import { HealthInsightsPage } from '@/features/health/portal/HealthInsightsPage'
import { HealthResourcesPage } from '@/features/health/portal/HealthResourcesPage'
import { HealthReviewPage } from '@/features/health/portal/HealthReviewPage'
import { HealthDataPage } from '@/features/health/portal/HealthDataPage'
import { HealthChatComposer } from '@/features/health/portal/HealthChatComposer'
import { HealthChatTurnRow } from '@/features/health/portal/HealthChatTurnRow'
import { HealthVoiceCall } from '@/features/health/portal/HealthVoiceCall'
import { primeHabitTargetsProbe } from '@/features/health/data/api'
import '@/features/health/portal/health.css'

const NAV = [
  { p: 'home', label: HM.health_tab_overview },
  { p: 'check-in', label: HM.health_tab_checkin },
  { p: 'habits', label: HM.health_tab_habits },
  { p: 'journal', label: HM.health_tab_journal },
  { p: 'tools', label: HM.health_tab_tools },
  { p: 'chat', label: HM.health_tab_chat },
  { p: 'insights', label: HM.health_tab_insights },
  { p: 'review', label: HM.health_tab_review },
  { p: 'resources', label: HM.health_tab_resources },
] as const

const pad = (n: number) => String(n).padStart(2, '0')
const ago = (days: number, h = 9) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(h, 14, 0, 0)
  return d.toISOString()
}
const dayKey = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function buildState(empty: boolean, daysLimit?: number): HealthState {
  if (empty) {
    return {
      checkIns: [],
      entries: [],
      habits: [],
      habitLogs: [],
      memories: [],
      pendingReview: 0,
      lastLoadedAt: new Date().toISOString(),
    }
  }
  const moods = [4, 5, 3, 4, 2, 4, 5, 3, 4, 4, 5, 3, 4, 5]
  const checkIns: HealthCheckIn[] = moods.map((mood, i) => ({
    id: `c${i}`,
    mood,
    energy: [4, 3, 2, 4, 1, 3, 5, 3, 4, 4, 4, 2, 3, 5][i] ?? null,
    note:
      i === 1
        ? 'Walked at lunch — felt noticeably better after.'
        : i === 4
          ? 'Rough night — the kids were up twice and work was loud.'
          : '',
    createdAt: ago(i, 8),
  })).slice(0, daysLimit && daysLimit > 0 ? daysLimit : undefined)
  const entries: HealthJournalEntry[] = [
    {
      id: 'j0',
      title: 'What the week actually felt like',
      body: 'Monday was the low point — I kept circling the same worry about the deadline and it soaked the whole evening.\n\nWednesday turned around. The walk helped, and saying the worry out loud in chat made it smaller.\n\nBy Friday I noticed I was doing the thing where I stack three tasks and call it one. Naming it here so I notice it sooner next time.',
      sharedAt: ago(1),
      createdAt: ago(1, 21),
      updatedAt: ago(1, 21),
    },
    {
      id: 'j1',
      title: 'Gratitude, quick list',
      body: 'Coffee on the porch. The dog being ridiculous. A call with Sam that went long in the good way.',
      sharedAt: null,
      createdAt: ago(3, 7),
      updatedAt: ago(3, 7),
    },
    {
      id: 'j2',
      title: '',
      body: 'Noticed I sleep worse after late screens. Try the earlier cutoff this week.',
      sharedAt: null,
      createdAt: ago(6, 22),
      updatedAt: ago(6, 22),
    },
  ]
  const habits: HealthHabit[] = [
    { id: 'h1', name: 'Morning walk', createdAt: ago(20) },
    { id: 'h2', name: 'Read for 20 minutes', createdAt: ago(20) },
    { id: 'h3', name: 'Screens off by 10', createdAt: ago(12) },
    /* Born today — exercises the void-dot strip and the "Started today"
       meta instead of a zero-of-thirty count. */
    { id: 'h4', name: 'Evening stretch', createdAt: ago(0, 1) },
  ]
  const habitLogs: HealthHabitLog[] = []
  let li = 0
  for (let d = 0; d < 7; d++) habitLogs.push({ id: `l${li++}`, habitId: 'h1', day: dayKey(d), createdAt: ago(d) })
  for (const d of [0, 2, 4, 9, 11]) habitLogs.push({ id: `l${li++}`, habitId: 'h2', day: dayKey(d), createdAt: ago(d) })
  for (const d of [1, 3, 4]) habitLogs.push({ id: `l${li++}`, habitId: 'h3', day: dayKey(d), createdAt: ago(d) })
  const memories: HealthMemory[] = [
    { id: 'm1', text: 'Caffeine after 2 pm ruins my sleep.', source: 'manual', createdAt: ago(9) },
    { id: 'm2', text: 'Sunday evenings tend to be the low point of my week.', source: 'mira', createdAt: ago(5) },
    { id: 'm3', text: 'I have a dog named Biscuit — walks count as my outside time.', source: 'manual', createdAt: ago(4) },
  ]
  return {
    checkIns,
    entries,
    habits,
    habitLogs,
    memories,
    checkInsTotal: checkIns.length,
    entriesTotal: entries.length,
    pendingReview: 2,
    lastLoadedAt: new Date().toISOString(),
  }
}

function ChatPreview({
  callOverlay = false,
  callServer = false,
}: {
  callOverlay?: boolean
  callServer?: boolean
}) {
  const { x, lang } = useI18n()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState('')
  const dayLabels = { today: x(HM.health_chat_day_today), yesterday: x(HM.health_chat_day_yesterday) }
  const reasonChips = [
    x(HM.health_chat_reason_wrong),
    x(HM.health_chat_reason_vague),
    x(HM.health_chat_reason_tone),
  ]
  const turns: HealthChatTurn[] = [
    { id: 'u1', role: 'user', content: 'I keep waking up at 3 am thinking about work. Is that something worth tracking?', action: null, feedback: null, createdAt: ago(1, 6) },
    {
      id: 'a1',
      role: 'assistant',
      content:
        'Worth tracking, yes — 3 am wake-ups are a pattern worth naming before they become a story you tell yourself.\n\nTwo small things that help:\n\n- **Write the worry down** when it lands — a journal line at 3 am beats rehearsing it in the dark.\n- **Check in the next morning** anyway. A rough night shows up in the trend, and the trend is what I watch.',
      action: null,
      feedback: 1,
      reasoning: 'The user reports a recurring early-morning wake pattern tied to work worry. Responding with a lightweight tracking suggestion keeps it non-clinical.',
      contextUsed: { checkins: 14, habits: 3, memories: 3, journals: 3 },
      createdAt: ago(1, 6.1),
    },
    { id: 'u2', role: 'user', content: 'Can you add a habit for an evening wind-down?', action: null, feedback: null, createdAt: ago(0, 8) },
    {
      id: 'a2',
      role: 'assistant',
      content: 'Done — "Screens off by 10" is on your list now. Mark it tonight if you manage it.',
      action: { kind: 'habit_add', ok: true, refId: 'h3' } as never,
      feedback: null,
      createdAt: ago(0, 8.1),
    },
    { id: 'u3', role: 'user', content: 'What should I write about today?', action: null, feedback: null, createdAt: ago(0, 9) },
    {
      id: 'a3',
      role: 'assistant',
      content: 'Try this: **what used up your energy that didn\u2019t deserve it?** The check-ins this week dipped mid-week — the journal is where the reason usually hides.',
      action: null,
      feedback: null,
      createdAt: ago(0, 9.1),
    },
  ]
  return (
    <div className="sb hb sb-page">
      <div className="sb-head-row">
        <div>
          <h1>{x(HM.health_chat_title)}</h1>
          <p className="sb-sub" style={{ margin: '2px 0 0' }}>
            {x(HM.health_chat_thread_default)}
          </p>
        </div>
      </div>
      <section className="sb-card sb-card-pad sbchat" style={{ marginTop: 14 }}>
        <div className="sbchat-log-wrap">
          <div className="sbchat-log" role="log" aria-label={x(HM.health_chat_log_label)} aria-live="polite">
            {turns.map((t, i) => (
              <HealthChatTurnRow
                key={t.id}
                t={t}
                showDay={i === 0 || formatDayChanged(turns[i - 1]!.createdAt, t.createdAt)}
                isLastAssistant={i === turns.length - 1 && t.role === 'assistant'}
                x={x}
                lang={lang}
                dayLabels={dayLabels}
                reasonChips={reasonChips}
                sending={false}
                undoing={null}
                deleting={null}
                delArmed={null}
                reasonFor={null}
                crisisDismissed={false}
                onRetry={() => {}}
                onEditFailed={() => {}}
                onReuse={() => {}}
                onRate={() => {}}
                onPickReason={() => {}}
                onDismissReasons={() => {}}
                onRegenerate={() => {}}
                onUndo={() => {}}
                onRemoveTurn={() => {}}
                onDismissCrisis={() => {}}
              />
            ))}
          </div>
        </div>
        <HealthChatComposer
          inputRef={inputRef}
          draft={draft}
          onDraft={setDraft}
          onSend={() => {}}
          disabled={false}
          x={x}
        />
      </section>
      {/* ?call=1 renders the voice-call overlay over the transcript so the
          call chrome can be screenshotted without a mic or speech APIs;
          ?call=server shows the server-engine recording state. */}
      {callOverlay && (
        <HealthVoiceCall
          status={callServer ? 'recording' : 'listening'}
          blockKind="perm"
          engine={callServer ? 'server' : 'speech'}
          liveText=""
          lastText="Can you add a habit for an evening wind-down?"
          level={0.55}
          micOff={false}
          voiceOff={false}
          x={x}
          onMic={() => {}}
          onVoice={() => {}}
          onEnd={() => {}}
        />
      )}
    </div>
  )
}

function formatDayChanged(a: string, b: string) {
  return a.slice(0, 10) !== b.slice(0, 10)
}

const PAGES: Record<string, ComponentType<{ callOverlay?: boolean; callServer?: boolean }>> = {
  home: HealthHomePage,
  'check-in': HealthCheckInPage,
  habits: HealthHabitsPage,
  journal: HealthJournalPage,
  tools: HealthToolsPage,
  insights: HealthInsightsPage,
  resources: HealthResourcesPage,
  review: HealthReviewPage,
  /* Footer-linked, not in the pill nav — reachable via ?p=data. The
     reminder card probes for migration 0227 and hides in the fixture
     (no live Supabase), which is exactly its unapplied behavior. */
  data: HealthDataPage,
  chat: ChatPreview,
}

function Shell() {
  const { x, lang, setLang } = useI18n()
  const { setTheme } = useTheme()
  const [params] = useSearchParams()
  const page = params.get('p') ?? 'home'
  const empty = params.get('empty') === '1'
  const daysLimit = parseInt(params.get('days') ?? '', 10)
  const state = useMemo(() => buildState(empty, daysLimit), [empty, daysLimit])
  const other: Lang = lang === 'fr' ? 'en' : 'fr'

  useEffect(() => {
    const l = params.get('lang')
    if (l === 'fr' || l === 'en') setLang(l)
  }, [params, setLang])
  useEffect(() => {
    const t = params.get('theme')
    if (t === 'dark' || t === 'light') setTheme(t)
  }, [params, setTheme])

  const health: HealthDataContextValue = {
    state,
    loading: false,
    error: undefined,
    refresh: () => Promise.resolve(),
  }
  const Page = PAGES[page] ?? HealthHomePage
  /* ?call=1 layers the voice-call overlay onto the chat preview;
     ?call=server shows the same overlay in its server-engine state. */
  const callOverlay =
    page === 'chat' && (params.get('call') === '1' || params.get('call') === 'server')
  const callServer = params.get('call') === 'server'
  /* Signed-out stub by default — ?internal=1 poses as a @dutiva.ca session
     so tier-gated surfaces (e.g. "Practice with Mira") render. Pages that
     call useAuth (tools/practices) crash without this context. */
  const internal = params.get('internal') === '1'
  /* ?caps=1 poses as a fully migrated project — capability probes (habit
     weekly targets) answer true so the gated controls render. */
  const caps = params.get('caps') === '1'
  useEffect(() => {
    if (caps) primeHabitTargetsProbe(true)
  }, [caps])
  const auth: AuthContextValue = useMemo(
    () => ({
      status: internal ? 'signed-in' : 'signed-out',
      session: internal
        ? ({ user: { id: 'preview', email: 'preview@dutiva.ca' } } as AuthContextValue['session'])
        : null,
      authorized: internal ? true : null,
      signInWithEmail: async () => undefined,
      verifyEmailCode: async () => undefined,
      signOut: async () => {},
      refreshAuthorization: async () => {},
    }),
    [internal],
  )

  const navClass = (active: boolean) =>
    `flex items-center justify-center whitespace-nowrap rounded-[8px] px-[10px] py-[5px] text-center text-[13px] font-semibold leading-[1.15] transition-[background,color] duration-150 ${
      active ? 'bg-surface text-text shadow-[0_1px_3px_rgba(13,27,42,0.10)]' : 'text-text-muted hover:text-text-2'
    }`

  return (
    <HealthDataContext value={health}>
      <div className="surface-app hb-shell flex min-h-[100dvh] flex-col bg-bg text-text">
        <header className="hb-topbar sticky top-0 z-10 border-b border-border bg-surface">
          <div className="mx-auto flex min-h-[56px] max-w-[1100px] items-center justify-between gap-[16px] px-[20px]">
            <div className="flex min-w-0 items-center gap-[16px]">
              <span className="hb-wordmark shrink-0 font-display text-[17px] font-bold tracking-[-0.01em] text-navy">
                {x(HM.health_portal_title)}
              </span>
              <nav className="hidden items-center gap-[2px] overflow-x-auto rounded-[10px] bg-inset p-[3px] min-[1080px]:flex">
                {NAV.map((item) => (
                  <Link
                    key={item.p}
                    to={`/dev-health-preview?p=${item.p}${empty ? '&empty=1' : ''}`}
                    className={navClass(page === item.p)}
                  >
                    {x(item.label)}
                    {item.p === 'review' && <span className="hb-badge">2</span>}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-[8px]">
              <ThemeCycleButton className="inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[8px] border border-border bg-transparent text-text-2 transition-colors hover:bg-inset" />
              <button
                type="button"
                onClick={() => setLang(other)}
                className="inline-flex h-[34px] min-w-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-[8px] border border-border bg-transparent px-[10px] text-[12px] font-semibold text-text-2 transition-colors hover:bg-inset"
              >
                <Globe size={13} aria-hidden="true" />
                {lang === 'en' ? 'FR' : 'EN'}
              </button>
              <button
                type="button"
                className="flex shrink-0 cursor-pointer items-center gap-[6px] whitespace-nowrap rounded-[8px] border border-border bg-transparent px-[12px] py-[7px] text-[13px] font-semibold text-text-2 hover:bg-inset"
              >
                <LogOut size={14} strokeWidth={2} aria-hidden="true" />
                {x(HM.health_sign_out)}
              </button>
            </div>
          </div>
        </header>
        <main id="hb-main" className="mx-auto w-full max-w-[1100px] flex-1 px-[20px] py-[32px]">
          <AuthContext value={auth}>
            <Page callOverlay={callOverlay} callServer={callServer} />
          </AuthContext>
        </main>
        <HealthFooter />
      </div>
      <ToastHost />
    </HealthDataContext>
  )
}

export function HealthPreview() {
  return (
    <LangProvider>
      <ToastsProvider>
        <Shell />
      </ToastsProvider>
    </LangProvider>
  )
}
