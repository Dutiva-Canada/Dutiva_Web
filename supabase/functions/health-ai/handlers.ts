/**
 * health-ai — pure helpers for the wellness-portal model calls.
 *
 * Mira reads what the person wrote: check-in notes and bounded excerpts
 * of explicitly shared journal entries reach every prompt kind
 * (buildCompanionSignals), the chat conversation is included on chat, and
 * entry_react reads one journal entry the person explicitly shared.
 * Everything read belongs to the caller — the wellness notice discloses
 * this plainly.
 */
import { detectPatterns } from '../_shared/adviceScreen.ts'

export interface CheckInRow {
  mood: number
  energy: number | null
  /** The writer's local calendar day (migration 0229). NULL on legacy
      rows — the UTC date of created_at is the fallback, and the comment
      in buildHealthFacts owns what that approximation means. */
  day?: string | null
  created_at: string
}

export interface HabitRowLite {
  id: string
  name: string
  /** Local day the habit was created (migration 0229) — the floor for its
      streak/progress math. NULL → created_at's UTC date, pre-0229 shape. */
  day?: string | null
  created_at?: string | null
}

export interface HabitLogRowLite {
  habit_id: string
  day: string
}

export interface HealthFacts {
  days: number
  checkInCount: number
  /** Distinct days with at least one check-in — the honest "how much data"
      number; checkInCount can exceed it when a day is logged twice. */
  loggedDays: number
  avgMood: number | null
  avgEnergy: number | null
  moodTrend: 'up' | 'down' | 'flat' | null
  habitsTotal: number
  /** Days each tracked habit was marked done inside the window — real
      adherence, so "a habit marked once" never reads as "a habit kept". */
  habitDays: { name: string; days: number }[]
}

const DAY_MS = 86_400_000

/** A YYYY-MM-DD shifted by `n` days — calendar-date math without a
    timezone surprise (UTC anchor, same trick as dayNum client-side). */
function shiftDay(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10)
}

/** The remembered layer — durable facts the person asked Mira to hold
    (health_memories: written by hand, or proposed by her and accepted on
    the review queue). Rendered as its own labeled block so a memory never
    blurs into "recent words" — and it's context, never permission. */
function memoriesBlock(memories: string[]): string {
  if (memories.length === 0) return ''
  return (
    'Things they asked you to remember — durable context they confirmed:\n' +
    memories.map((m) => `  - ${oneLine(m, 300)}`).join('\n')
  )
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

/** Aggregate raw rows into the numbers a prompt may cite. `days` is the
    lookback window; `nowIso` anchors it (injected for testability). */
export function buildHealthFacts(
  checkIns: CheckInRow[],
  habits: HabitRowLite[],
  logs: HabitLogRowLite[],
  days: number,
  nowIso: string,
): HealthFacts {
  /* Calendar-day window anchored on the caller's local today — the same
     frame the page charts. Rows written after migration 0229 carry the
     writer's own local day; legacy rows fall back to the UTC date of
     created_at, which can read one day "future" for writers behind UTC —
     the +1 bound keeps those while excluding genuinely future stamps. */
  const todayUtc = nowIso.slice(0, 10)
  const cutoffDay = shiftDay(todayUtc, -(days - 1))
  /* Half the WINDOW, not half measured back from today — `today−7` would
     leave an 8-date newer half against 6 older dates on a 14-day window.
     Anchoring to the cutoff splits 14 dates evenly (odd windows give the
     recent half the extra day). */
  const midDay = shiftDay(cutoffDay, Math.floor(days / 2))

  /* Per-day averaging — the same weighting the Insights page uses, so the
     recap can't cite an average the displayed card disagrees with. */
  const byDay = new Map<string, { moodSum: number; n: number; eSum: number; eN: number }>()
  let checkInCount = 0
  for (const c of checkIns) {
    const day = c.day ?? c.created_at.slice(0, 10)
    /* The stored day is the writer's calendar — a UTC+ user can be a real
       day ahead of the server's UTC today without anything being wrong.
       The +1 bound keeps genuinely future rows out while letting the
       furthest real timezone in (UTC+14). */
    if (day < cutoffDay || day > shiftDay(todayUtc, 1)) continue
    checkInCount += 1
    const slot = byDay.get(day) ?? { moodSum: 0, n: 0, eSum: 0, eN: 0 }
    slot.moodSum += c.mood
    slot.n += 1
    if (c.energy != null) {
      slot.eSum += c.energy
      slot.eN += 1
    }
    byDay.set(day, slot)
  }

  const moodAvgs: { day: string; v: number }[] = []
  const energyAvgs: number[] = []
  for (const [day, s] of byDay) {
    moodAvgs.push({ day, v: s.moodSum / s.n })
    if (s.eN > 0) energyAvgs.push(s.eSum / s.eN)
  }

  /* A trend needs at least two logged days in EACH half — otherwise two
     check-ins a fortnight apart would manufacture a "trend" out of two
     points. Empty halves already meant null; thin ones now do too. */
  const olderVals = moodAvgs.filter((m) => m.day < midDay).map((m) => m.v)
  const newerVals = moodAvgs.filter((m) => m.day >= midDay).map((m) => m.v)
  let moodTrend: HealthFacts['moodTrend'] = null
  if (olderVals.length >= 2 && newerVals.length >= 2) {
    /* The diff runs on raw means — rounding each half to a tenth first
       would let a real 0.34 shift collapse to a rounded 0.3 and read
       "flat". (avg()'s rounding stays for the reported stats.) */
    const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length
    const diff = mean(newerVals) - mean(olderVals)
    moodTrend = diff > 0.3 ? 'up' : diff < -0.3 ? 'down' : 'flat'
  }

  /* Per-habit adherence — a Set per habit so a duplicated (habit, day)
     row can't inflate the count, habits never marked still appear with
     days:0 rather than vanishing, and marks stamped before the habit
     existed don't count toward it. */
  const floorByHabit = new Map(habits.map((h) => [h.id, habitStartDay(h)]))
  const doneDays = new Map<string, Set<string>>()
  for (const l of logs) {
    /* habit_logs.day is already the writer's local day — same +1 bound:
       their "today" can sit one UTC date ahead of the server's. */
    if (l.day < cutoffDay || l.day > shiftDay(todayUtc, 1)) continue
    const floor = floorByHabit.get(l.habit_id)
    if (floor != null && l.day < floor) continue
    const set = doneDays.get(l.habit_id) ?? new Set<string>()
    set.add(l.day)
    doneDays.set(l.habit_id, set)
  }

  return {
    days,
    checkInCount,
    loggedDays: byDay.size,
    avgMood: avg(moodAvgs.map((m) => m.v)),
    avgEnergy: avg(energyAvgs),
    moodTrend,
    habitsTotal: habits.length,
    habitDays: habits.map((h) => ({ name: h.name, days: doneDays.get(h.id)?.size ?? 0 })),
  }
}

/** The day a habit started existing — the stored local day when the row
    carries it (migration 0229), else created_at's UTC date, else no floor
    (a bare id/name fixture gets no restriction). Streak and adherence math
    ignore logs stamped before it: a backfill can't invent history. */
function habitStartDay(h: HabitRowLite): string | null {
  return h.day ?? h.created_at?.slice(0, 10) ?? null
}

/* The advice line is tiered: external accounts get observations only, a
   verified @dutiva.ca sign-in (`advice`) may be told what to do. The
   clinical line is identical either way — never diagnosis, treatment,
   or therapy. */
function sharedRules(advice: boolean): string {
  return [
    'This is a non-clinical wellness tracker. Never diagnose, never mention illness, treatment, medication, therapy, or crisis.',
    advice
      ? 'Internal staff account (@dutiva.ca) — advice is in scope: name the pattern in the numbers and say plainly what you would do with it. No praise inflation, no shame.'
      : 'Never give advice beyond noticing a pattern in the numbers. No praise inflation, no shame.',
    'Write in plain, warm language — a sentence or two at a time.',
  ].join(' ')
}

/* The chat companion gets a wider remit than the one-shot prompts — she may
   listen, reflect feelings, offer small everyday suggestions, and answer
   general questions plainly — but the clinical line is the same: nothing
   applied to the person, no steering toward care, no substances, and "she
   is software" is a rule, not a mood. Internal tier adds skills practice:
   she can guide evidence-informed exercises (a thought record, a breathing
   space, a DBT skill) plainly named as such — that's still not therapy,
   and the clinician-led approaches stay with clinicians. */
function companionRules(advice: boolean): string {
  return [
    'This is a non-clinical wellness space. Never diagnose the person or read a condition onto what they shared, never steer them toward treatment, medication, or a clinical visit, never name a substance, and never offer therapy — when they need professional support, point to the portal\'s Resources page.',
    'A general question still deserves a real answer — "what is X" is not a diagnosis request. Explain the topic in general terms — what it is, how it tends to show up, that professionals help with it — never applied to them or their care.',
    'You are software, not a person. Never claim feelings, a body, a life outside this chat, or a professional credential — if asked, say so plainly.',
    advice
      ? 'No praise inflation, no shame, no scorekeeping. Internal staff account (@dutiva.ca) — concrete everyday advice is welcome here, and so is guiding skills practice (a thought record, a breathing space, a DBT skill) — name the approach when you use one. You are still not a therapist: EMDR, hypnotherapy, trauma processing, trance work, and prescriptive protocols stay with clinicians — explain those, never conduct or simulate them.'
      : 'No praise inflation, no shame, no scorekeeping. Meet the person where they are.',
  ].join(' ')
}

/* Internal-tier practice range — the approaches Mira can run step-by-step
   as skills practice, and the ones she explains but never conducts. One
   instruction per reply when guiding; an exercise is a conversation, not a
   dump of steps. External accounts never see this block — their posture
   stays listening plus at most one everyday suggestion. */
function modalityPlaybook(): string {
  return [
    'On this account you can guide evidence-informed exercises as skills practice — say plainly that it\'s practice, not therapy, if the line ever blurs:',
    '- CBT — a thought record (situation → thought → feeling → the evidence for and against → a balanced reframe), naming distortions, behavioral activation, worry postponement, breaking a problem into next steps',
    '- MBCT — the three-minute breathing space, decentering ("thoughts are events that pass, not facts"), a body scan, noticing the early tug of a mood spiral',
    '- MBSR — body scan, sitting meditation, breath awareness, gentle mindful movement, a pause before a stressor',
    '- ACT — defusion ("I\'m having the thought that…", leaves on a stream), acceptance ("make room"), the values compass, committed action sized small',
    '- DBT skills — TIPP, STOP, opposite action, DEAR MAN for asking, radical acceptance, self-soothing through the senses',
    '- IPT-style reflection — a relationships inventory, journaling a role change, rehearsing a hard conversation',
    '- CBT-I basics — a fixed wake time, bed for sleep only, a wind-down plan, a sleep diary (sleep-restriction windows are a clinician\'s calibration, not yours)',
    '- Person-centered listening, solution-focused questions (the miracle question, scaling, hunting exceptions), coaching-style goal work (what you want, what\'s in the way, the next dated step), meditation (breath counting, loving-kindness, noting), spiritual reflection on the person\'s own terms — never doctrine',
    '- PMR — tense-and-release through the muscle groups, one release at a time; expressive writing — a timed uncensored write from a prompt, then a second pass on what surfaced; self-compassion — the compassion break, a letter to yourself, softening the inner critic\'s tone; guided imagery — calm-place scenes in sensory detail; MI-style reflection — hearing both sides of a change out loud and naming the person\'s own reasons',
    'Clinician-led approaches — explain plainly what they are and what a session looks like, but never conduct or simulate them: EMDR, hypnotherapy, any trauma processing, trance or suggestion work, prescriptive sleep-restriction, anything amounting to diagnosis or treatment. Offer the adjacent skill you do have (grounding, calm-place imagery, ordinary relaxation) and point to the portal\'s Resources page.',
    'When you guide an exercise, go one step per reply and wait — don\'t stack the whole sequence into one message. If an exercise stirs more than it settles, stop it and say so.',
  ].join('\n')
}

/** The one line every prompt kind hands out when something looks like crisis. */
const CRISIS_LINE =
  'Call or text 9-8-8 (Canada, 24/7) — or 911 if you are in immediate danger.'

/** Rendered signal lines shared by every kind — see buildCompanionSignals. */
function signalsBlock(signals: string[]): string {
  return signals.length === 0 ? '(nothing shared yet)' : signals.join('\n')
}

export function reflectPrompt(
  facts: HealthFacts,
  signals: string[],
  lang: 'en' | 'fr',
  advice = false,
  memories: string[] = [],
): string {
  const langLine = lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.'
  return [
    `You write gentle journal prompts for a personal wellness tracker. ${sharedRules(advice)}`,
    'Given the stats and the person\'s own recent words below, suggest ONE short reflection prompt (one or two sentences, phrased as a question they could write about). If something they wrote invites a deeper look, ask toward it. If everything is thin, ask a broad gentle question instead.',
    langLine,
    'Return only the prompt text — no preamble, no quotes.',
    '',
    `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
    'Their recent words:',
    signalsBlock(signals),
    memoriesBlock(memories),
  ].join('\n')
}

export function recapPrompt(
  facts: HealthFacts,
  signals: string[],
  lang: 'en' | 'fr',
  advice = false,
  memories: string[] = [],
): string {
  const langLine = lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.'
  return [
    `You write two-week summaries for a personal wellness tracker. ${sharedRules(advice)}`,
    'Summarize the stats and the person\'s own recent words below in 3–4 short sentences: check-in count, mood and energy averages, whether mood trended up or down' +
      /* Zero configured habits is an absence, not a failure. And habits
         are reported as days-marked, not kept/failed — a habit with
         days:1 was marked once, not "kept up". */
      (facts.habitsTotal > 0
        ? ', how each habit went by its days marked in habitDays'
        : '') +
      ', and — only if a note or excerpt makes it natural — one nod to what they\'ve actually been carrying. ' +
      /* Two steers against the failure shapes seen live: verdict words
         ("very low", "poor") instead of numbers, and week-scale claims
         ("all week", "staying at the bottom") extrapolated from a single
         check-in. */
      'Report the numbers plainly — counts and averages — never verdicts like "very low", "poor", or "failing". If the data is thin — a check-in or two — describe those days plainly instead of narrating a period you can\'t see; if there is no data at all, say so in one sentence and stop. ' +
      (advice
        ? 'Describe first — then, if the numbers call for it, say plainly what you would change.'
        : 'Describe, don\'t advise.'),
    langLine,
    'Return only the summary text.',
    '',
    `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
    'Their recent words:',
    signalsBlock(signals),
    memoriesBlock(memories),
  ].join('\n')
}

export function habitPrompt(
  facts: HealthFacts,
  habitNames: string[],
  signals: string[],
  lang: 'en' | 'fr',
  advice = false,
  memories: string[] = [],
): string {
  const langLine = lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.'
  return [
    `You suggest one small daily habit for a personal wellness tracker. ${sharedRules(advice)}`,
    'Given the stats, the habits the person already tracks, and their own recent words below, suggest ONE new habit they are not already doing — small, concrete, and doable in under ten minutes a day.',
    'Answer in exactly this format: Habit name | one short reason it fits. No preamble.',
    langLine,
    '',
    `Current habits: ${habitNames.length > 0 ? habitNames.join(' | ') : '(none yet)'}`,
    `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
    'Their recent words:',
    signalsBlock(signals),
    memoriesBlock(memories),
  ].join('\n')
}

/** "Habit name | reason" — tolerates a missing reason half. Anything else
    returns null so the caller can say "no suggestion" rather than invent one. */
export function parseHabit(raw: string): { name: string; why: string } | null {
  const first = raw.split('\n').map((l) => l.trim()).find((l) => l !== '') ?? ''
  if (!first) return null
  const bar = first.lastIndexOf('|')
  const rawName = (bar < 0 ? first : first.slice(0, bar))
    .replace(/^[-*•\d.\s]+/, '')
    .replace(/["“”]/g, '')
    .trim()
  if (rawName.length < 3 || rawName.length > 120) return null
  const why = bar < 0 ? '' : first.slice(bar + 1).trim().slice(0, 200)
  return { name: rawName.slice(0, 120), why }
}

/* ── Chat — the portal's companion ──────────────────────────────────────────
   Wider context than the other kinds, on purpose: aggregates and per-habit
   status, plus the person's own recent words (check-in notes, excerpts of
   journal entries they chose to share) and the conversation itself. Mira
   keeps company by knowing what the person has shared — every row is still
   the caller's own, and quoted text is truncated hard before it reaches
   the prompt. */

export interface HabitStatus {
  id: string
  name: string
  doneToday: boolean
  /** Consecutive days marked done, counting back from `today` (a day with no
      mark doesn't break a streak started yesterday — same leniency as the
      client-side habitStreak). */
  streak: number
  /** The walk reached the fetched window's floor still running — the true
     streak is `streak` OR LONGER. Prompts must say "N+", never "N". */
  streakCapped?: boolean
}

export function buildHabitStatuses(
  habits: HabitRowLite[],
  logs: HabitLogRowLite[],
  today: string,
  /** Oldest day the log slice covers. When a streak's walk consumes it, the
     run may continue past the fetch — the status flags itself rather than
     narrating the window edge as the streak's real length. */
  floorDay?: string,
): HabitStatus[] {
  const doneToday = new Set(logs.filter((l) => l.day === today).map((l) => l.habit_id))
  const prevDay = (ymd: string): string => {
    const d = new Date(`${ymd}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().slice(0, 10)
  }
  return habits.map((h) => {
    const floor = habitStartDay(h)
    const days = new Set(
      logs
        .filter((l) => l.habit_id === h.id && (floor == null || l.day >= floor))
        .map((l) => l.day),
    )
    let streak = 0
    let cursor = days.has(today) ? today : prevDay(today)
    while (days.has(cursor)) {
      streak += 1
      cursor = prevDay(cursor)
    }
    /* Stopping exactly at the fetch floor means the data ran out, not the
       streak — reaching prevDay(floorDay) proves it consumed the window's
       last day. Unless the habit's own start day sits at the floor: that
       floor stops the walk at the same cursor by DESIGN (marks can't
       predate the habit), so the streak is exact, not truncated. The flag
       only ships when true — an exact streak carries no noise key. */
    const capped =
      floorDay != null &&
      cursor === prevDay(floorDay) &&
      (floor == null || floor < floorDay)
    return {
      id: h.id,
      name: h.name,
      doneToday: doneToday.has(h.id),
      streak,
      ...(capped ? { streakCapped: true } : {}),
    }
  })
}

/** The action grammar the model may emit. Everything here is an additive or
    undoable write on the caller's own rows — no deletes, nothing irreversible,
    nothing cross-user. `day` is always the client's local today, supplied by
    the caller, so "mark it done" lands on the right calendar day. */
export type ChatAction =
  | { type: 'mark_habit_done'; habit: string }
  | { type: 'unmark_habit_done'; habit: string }
  | { type: 'add_habit'; name: string }
  | { type: 'add_checkin'; mood: number; energy?: number; note?: string }
  | { type: 'add_journal_entry'; title?: string; body: string }
  | { type: 'propose_memory'; text: string }

export interface ChatReply {
  reply: string
  action: ChatAction | null
  /* Short next-prompt chips the client shows as tappable follow-ups —
     ephemeral: they ride the reply payload, never the stored turn. */
  suggests: string[]
}

/** A check-in row with its free-text note — chat only. */
export interface CheckInNoteRow extends CheckInRow {
  note: string
}

/** A journal entry trimmed for prompting — chat only. `shared_at` is the
    per-entry consent flag: null means the person never pressed "Let Mira
    read this", and the excerpt must not reach a prompt. */
export interface JournalExcerptRow {
  title: string
  body: string
  created_at: string
  /** Consent timestamp — set by "Let Mira read this", cleared by revoking. */
  shared_at: string | null
}

const SIGNAL_NOTE_MAX = 160
const SIGNAL_EXCERPT_MAX = 200
const SIGNAL_NOTES_LIMIT = 8
const SIGNAL_JOURNAL_LIMIT = 3

const oneLine = (s: string, max: number): string =>
  s.replace(/\s+/g, ' ').replace(/"/g, "'").trim().slice(0, max)

/** The person's own recent words, as prompt lines. Bounded hard — the point
    is that Mira can hear "rough day at work," not that she can recite the
    journal. Newest first; empty notes and entries are dropped, and journal
    excerpts come only from entries the person explicitly shared — consent
    is enforced here too, not just in the query that fetched the rows. */
/** Gate for the automatic "short evening walk" proposal. "Sustained" means
    days, not entries — five check-ins across two days is a bad weekend, not
    a low patch — and a tracked walk (in either language) already covers the
    suggestion. Pure so the boundary is testable; the runtime adds dedupe and
    cooldown on top. */
export function lowMoodPatchEligible(facts: HealthFacts, statuses: HabitStatus[]): boolean {
  if (facts.loggedDays < 5 || facts.avgMood == null || facts.avgMood > 2.4) return false
  return !statuses.some((h) => /walk|marche/i.test(h.name))
}

export function buildCompanionSignals(
  checkIns: CheckInNoteRow[],
  journals: JournalExcerptRow[],
): string[] {
  const byNewest = <T extends { created_at: string }>(rows: T[]): T[] =>
    [...rows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  const dayOf = (iso: string) => iso.slice(0, 10)

  const lines: string[] = []
  const notes = byNewest(checkIns)
    .filter((c) => c.note.trim() !== '')
    .slice(0, SIGNAL_NOTES_LIMIT)
  for (const c of notes) {
    /* The stored local day when the row carries it — the label names the
       day the writer meant, not the UTC date it landed on. */
    lines.push(
      `- check-in ${c.day ?? dayOf(c.created_at)} · mood ${c.mood}/5 · "${oneLine(c.note, SIGNAL_NOTE_MAX)}"`,
    )
  }
  const entries = byNewest(journals)
    .filter((j) => j.shared_at != null && j.body.trim() !== '')
    .slice(0, SIGNAL_JOURNAL_LIMIT)
  for (const j of entries) {
    const title = j.title.trim() ? `"${oneLine(j.title, 80)}" · ` : ''
    lines.push(`- journal ${dayOf(j.created_at)} · ${title}"${oneLine(j.body, SIGNAL_EXCERPT_MAX)}"`)
  }
  return lines
}

export function chatPrompt(
  facts: HealthFacts,
  statuses: HabitStatus[],
  signals: string[],
  today: string,
  lang: 'en' | 'fr',
  advice = false,
  memories: string[] = [],
): { role: 'system'; content: string } {
  const habitLines =
    statuses.length === 0
      ? '  (no habits tracked yet)'
      : statuses
          .map(
            (s) =>
              `  - "${s.name}" — ${s.doneToday ? 'done today' : 'not done today'}, ` +
              `streak ${s.streak}${s.streakCapped ? '+' : ''} day${s.streak === 1 ? '' : 's'}`,
          )
          .join('\n')
  const signalLines = signals.length === 0 ? '  (nothing shared yet)' : signals.join('\n')
  return {
    role: 'system',
    content: [
      `You are Mira — the emotional companion inside Dutiva Wellness, a personal wellness tracker. ${companionRules(advice)}`,
      'How you keep company:',
      '- Listen first. When the person shares how they feel, acknowledge it warmly and specifically — name the feeling back in their own terms, then ask at most one gentle follow-up. Let them set the pace; do not interrogate.',
      '- Weave their tracked context (below) into conversation when it helps them feel heard — a streak kept, a note they left, something they journaled. Never recite it as a report, and never mention that you were given a context block.',
      advice
        ? '- When they seem stuck or ask for ideas, advise directly — concrete, everyday suggestions sized to what the data shows. Offer, don\'t push.'
        : '- When they seem stuck or ask for ideas, offer at most ONE small, concrete, everyday suggestion — a short walk, a few slow breaths, writing a few lines, reaching out to someone they trust. Offer, don\'t push.',
      ...(advice ? [modalityPlaybook()] : []),
      '- Answer questions plainly — about their tracked data (check-in counts, mood and energy averages, habits and streaks) and general questions about a topic alike, the latter in general terms only, never applied to them. If their data cannot answer what they asked about it, say so rather than guessing.',
      'You can also DO things in the portal when the person asks. To act, end your JSON reply with an "action" object — the system executes it against their account. Allowed actions:',
      '  {"type":"mark_habit_done","habit":"<existing habit name>"}   — mark a habit done today',
      '  {"type":"unmark_habit_done","habit":"<existing habit name>"} — undo today\'s mark',
      '  {"type":"add_habit","name":"<new habit>"}                    — start tracking a habit',
      '  {"type":"add_checkin","mood":<1-5>,"energy":<1-5>,"note":"<short>"} — log a check-in (mood required; energy/note optional)',
      '  {"type":"add_journal_entry","title":"<optional>","body":"<text>"}   — write a journal entry',
      '  {"type":"propose_memory","text":"<a durable fact or preference>"}   — file something to remember for review',
      'Only emit an action the person actually asked for. If a habit name does not match the list below, ask which habit they mean instead of guessing. Never emit an action to satisfy a hypothetical. When you do act, keep the reply personal — a companion confirming, not a receipt. propose_memory is the exception that waits: it files to their review queue and only becomes a memory if they accept — emit it when they ask you to remember something, or when they state a durable preference or standing context worth keeping. Never propose memories about symptoms, trauma, or anything clinical — those don’t belong in the record.',
      `If the person seems to be in crisis or mentions suicide or self-harm: set action to null and reply ONLY with supportive words plus this line — "${CRISIS_LINE}" Do not log check-ins or entries for crisis content.`,
      `Today is ${today} (the person's local date).`,
      lang === 'fr'
        ? 'Reply in Canadian French.'
        : 'Reply in English.',
      'Output ONLY strict JSON: {"reply":"<sized to the moment — a sentence or two for everyday talk; when they ask you to read their numbers, plan something, or work a question through, a fuller answer is welcome: a short paragraph or two, a small list when it helps scan>","action":<object or null>,"suggests":["<prompt>"]}. No markdown fences.',
      '"suggests" holds up to 3 short things the person might say next — each under 8 words, same language as the reply. Omit the field or send an empty array when the exchange is clearly finished.',
      '',
      `Stats for the last ${facts.days} days: ${JSON.stringify(facts)}`,
      'Habits:',
      habitLines,
      'Their recent words — their own text; quote back sparingly and only when it fits:',
      signalLines,
      memoriesBlock(memories),
    ].join('\n'),
  }
}

export { createReplyDeltaExtractor } from '../_shared/replyDelta.ts'

export const CHAT_ACTION_TYPES = new Set([
  'mark_habit_done',
  'unmark_habit_done',
  'add_habit',
  'add_checkin',
  'add_journal_entry',
  'propose_memory',
])

/** Strict JSON reply from the model. Anything unparseable or with a malformed
    action returns null — the caller then files a plain-text fallback rather
    than executing something it half-understood. */
export function parseChatReply(raw: string | null | undefined): ChatReply | null {
  if (!raw) return null
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as {
      reply?: unknown
      action?: unknown
      suggests?: unknown
    }
    const reply = typeof obj.reply === 'string' ? obj.reply.trim() : ''
    if (!reply) return null
    /* Follow-up chips — kept only as clean short strings; malformed or
       oversized entries drop out rather than fail the whole reply. */
    const suggests = Array.isArray(obj.suggests)
      ? obj.suggests
          .filter((s): s is string => typeof s === 'string')
          .map((s) => s.trim().slice(0, 120))
          .filter((s) => s !== '')
          .slice(0, 3)
      : []
    const a = obj.action
    if (a === null || a === undefined) return { reply, action: null, suggests }
    if (typeof a !== 'object') return null
    const action = a as Record<string, unknown>
    if (typeof action.type !== 'string' || !CHAT_ACTION_TYPES.has(action.type)) return null
    switch (action.type) {
      case 'mark_habit_done':
      case 'unmark_habit_done':
        if (typeof action.habit !== 'string' || action.habit.trim() === '') return null
        return { reply, suggests, action: { type: action.type, habit: action.habit.trim().slice(0, 120) } }
      case 'add_habit':
        if (typeof action.name !== 'string' || action.name.trim().length < 2) return null
        return { reply, suggests, action: { type: 'add_habit', name: action.name.trim().slice(0, 120) } }
      case 'add_checkin': {
        const mood = Number(action.mood)
        if (!Number.isInteger(mood) || mood < 1 || mood > 5) return null
        const energy = action.energy === undefined ? undefined : Number(action.energy)
        if (energy !== undefined && (!Number.isInteger(energy) || energy < 1 || energy > 5))
          return null
        return {
          reply,
          suggests,
          action: {
            type: 'add_checkin',
            mood,
            energy,
            note: typeof action.note === 'string' ? action.note.trim().slice(0, 500) : undefined,
          },
        }
      }
      case 'add_journal_entry': {
        if (typeof action.body !== 'string' || action.body.trim() === '') return null
        return {
          reply,
          suggests,
          action: {
            type: 'add_journal_entry',
            title: typeof action.title === 'string' ? action.title.trim().slice(0, 200) : undefined,
            body: action.body.slice(0, 4000),
          },
        }
      }
      case 'propose_memory': {
        if (typeof action.text !== 'string' || action.text.trim().length < 3) return null
        return {
          reply,
          suggests,
          action: { type: 'propose_memory', text: action.text.trim().slice(0, 500) },
        }
      }
    }
    return null
  } catch {
    return null
  }
}

/** Resolve a habit the model named — exact (case-insensitive) first, then a
    unique substring match. Ambiguous or absent → null, so the reply can say
    "which habit?" instead of writing to the wrong one. */
export function resolveHabitRef(
  named: string,
  statuses: HabitStatus[],
): HabitStatus | null {
  const needle = named.trim().toLowerCase()
  if (!needle) return null
  const exact = statuses.filter((s) => s.name.trim().toLowerCase() === needle)
  if (exact.length === 1) return exact[0]
  const partial = statuses.filter((s) => s.name.trim().toLowerCase().includes(needle))
  return partial.length === 1 ? partial[0] : null
}

/** Is the requested toggle already in effect? A write that changes nothing
   must not become undoable — undo on a no-op writes data the action never
   touched: reversing a mark that never wrote deletes the pre-existing log;
   reversing an unmark that matched nothing invents one. */
export function habitToggleNoop(actionType: string, target: HabitStatus): boolean {
  return target.doneToday === (actionType === 'mark_habit_done')
}

/* ── Reactions — Mira noticing what the person just did ─────────────────────
   Fired on positive actions (check-in saved, habit marked done) and on an
   explicitly shared journal entry. Same context and same rules as chat —
   she reacts because she already knows the person — but plain-text output,
   no action grammar. */

export type ReactEvent =
  | { type: 'checkin_saved'; mood: number; energy?: number | null; note?: string }
  | { type: 'checkin_edited'; mood: number; energy?: number | null; note?: string }
  | { type: 'habit_marked'; habit: string }
  | { type: 'habit_added'; habit: string }
  | { type: 'memory_added'; text: string }

/** Validate a client-sent reaction event. Pure — kept in handlers so vitest
    reaches it (runtime.ts carries npm: imports). */
export function parseReactEvent(raw: unknown): ReactEvent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const ev = raw as Record<string, unknown>
  if (ev.type === 'checkin_saved' || ev.type === 'checkin_edited') {
    const mood = Number(ev.mood)
    if (!Number.isInteger(mood) || mood < 1 || mood > 5) return null
    const energy = ev.energy == null ? null : Number(ev.energy)
    if (energy !== null && (!Number.isInteger(energy) || energy < 1 || energy > 5)) {
      return null
    }
    return {
      type: ev.type,
      mood,
      energy,
      note: typeof ev.note === 'string' ? ev.note.slice(0, 2000) : undefined,
    }
  }
  if (ev.type === 'habit_marked' || ev.type === 'habit_added') {
    if (typeof ev.habit !== 'string' || ev.habit.trim() === '') return null
    return { type: ev.type, habit: ev.habit.trim().slice(0, 120) }
  }
  if (ev.type === 'memory_added') {
    if (typeof ev.text !== 'string' || ev.text.trim() === '') return null
    return { type: ev.type, text: ev.text.trim().slice(0, 500) }
  }
  return null
}

/** One or two sentences reacting to something the person just did. `habitStreak`
    is the streak the server already computed — the client only names the habit.
    `streakCapped` marks a floor value (the fetched window ran out): the prompt
    says "N+" and never claims a round mark it can't verify. */
export function reactPrompt(
  event: ReactEvent,
  habitStreak: number | null,
  signals: string[],
  today: string,
  lang: 'en' | 'fr',
  advice = false,
  memories: string[] = [],
  streakCapped = false,
): string {
  const eventLine =
    event.type === 'checkin_saved' || event.type === 'checkin_edited'
      ? `${event.type === 'checkin_edited' ? 'revised a check-in — it now reads' : 'saved a check-in'} — mood ${event.mood}/5` +
        (event.energy != null ? `, energy ${event.energy}/5` : '') +
        (event.note?.trim() ? `, note: "${oneLine(event.note, 300)}"` : ', no note')
      : event.type === 'memory_added'
        ? `just asked you to remember — "${oneLine(event.text, 200)}"`
        : event.type === 'habit_added'
          ? `started tracking a new habit — "${oneLine(event.habit, 120)}"`
          : `marked the habit "${oneLine(event.habit, 120)}" done today` +
            (habitStreak != null
              ? ` — streak now ${habitStreak}${streakCapped ? '+' : ''} day${habitStreak === 1 ? '' : 's'}`
              : '')
  /* A streak lands differently at a round mark — a week, two weeks, a month,
     a round ten. Tell her once, so she can name the milestone plainly rather
     than recite a number every day. */
  const milestone =
    habitStreak != null &&
    !streakCapped &&
    (habitStreak % 10 === 0 || habitStreak === 7 || habitStreak === 14 || habitStreak === 21 || habitStreak === 28)
      ? ` This is day ${habitStreak} — a round mark; you may name it in a few words (e.g. "a week of it", "a month straight").`
      : ''
  return [
    `You are Mira — the emotional companion inside Dutiva Wellness, a personal wellness tracker. ${companionRules(advice)}`,
    advice
      ? 'The person just did something in the app (below). React the way a companion would — one or two short sentences, naming what they did. If they shared a feeling in the note, meet the feeling first. Small warmth, no cheerleading — a small concrete suggestion is welcome if the moment calls for it.'
      : 'The person just did something in the app (below). React the way a companion would — one or two short sentences, naming what they did. If they shared a feeling in the note, meet the feeling first. Small warmth, no cheerleading, no advice unless it lands as one gentle observation.',
    `If anything they wrote hints at crisis or self-harm, reply ONLY with supportive words plus "${CRISIS_LINE}" — nothing else.`,
    `Today is ${today}.`,
    lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.',
    'Return only the reply text.',
    '',
    `The event: ${eventLine}.${milestone}`,
    'Their recent words:',
    signalsBlock(signals),
    memoriesBlock(memories),
  ].join('\n')
}

const ENTRY_BODY_MAX = 2500

/** A fuller response to a journal entry the person explicitly chose to share
    — pressed "Let Mira read this." Consent per entry: only this body is sent. */
export function entryReactPrompt(
  title: string,
  body: string,
  signals: string[],
  today: string,
  lang: 'en' | 'fr',
  advice = false,
  memories: string[] = [],
): string {
  return [
    `You are Mira — the emotional companion inside Dutiva Wellness, a personal wellness tracker. ${companionRules(advice)}`,
    advice
      ? 'The person chose to share a private journal entry with you. Respond as a companion who was trusted with it: name what they shared in their own terms, reflect the feeling underneath it, ask at most one gentle question if it helps them feel heard. 2–4 short sentences. Not a summary — a concrete suggestion is fine if it helps. No lists.'
      : 'The person chose to share a private journal entry with you. Respond as a companion who was trusted with it: name what they shared in their own terms, reflect the feeling underneath it, ask at most one gentle question if it helps them feel heard. 2–4 short sentences. Not a summary, not advice — no fixes, no lists.',
    `If the entry hints at crisis or self-harm, reply ONLY with supportive words plus "${CRISIS_LINE}" — nothing else.`,
    `Today is ${today}.`,
    lang === 'fr' ? 'Reply in Canadian French.' : 'Reply in English.',
    'Return only the reply text.',
    '',
    `The entry${title.trim() ? ` "${oneLine(title, 120)}"` : ''} — their own words:`,
    `"""${oneLine(body, ENTRY_BODY_MAX)}"""`,
    'Their recent words:',
    signalsBlock(signals),
    memoriesBlock(memories),
  ].join('\n')
}

/* ── Output screens — the deterministic backstop behind the prompt ─────────
   Two different boundaries are enforced here:

   1. The clinical line binds EVERY tier, and it has two halves. Banned:
      anything clinical APPLIED to the person — a condition read onto
      them ("you have…", "your anxiety", "sounds like depression"),
      steering them toward treatment, medication or a clinical visit,
      and substance vocabulary outright. Allowed: the topic itself —
      asked "what is X", Mira may explain it plainly in third-person
      terms (what it is, how it tends to show up, that professionals
      help with it). The Resources page pointer and the crisis line
      stay clean either way.
   2. The directed line binds only the external tier — the external
      register sanctions at most one small everyday suggestion, offered
      not pushed. "You should sleep eight hours", a cut-caffeine
      directive, or a prescribed regimen is over that line. Everyday
      suggestions ("a short walk", "a few slow breaths") deliberately
      stay clean — flagging suppresses the reply, so a false positive
      costs a good answer and the patterns aim high-precision.

   Internal @dutiva.ca replies run only the clinical table — advice is in
   scope there; the clinical line is not. */
const CLINICAL_PATTERNS: Record<'en' | 'fr', RegExp[]> = {
  en: [
    /* Substances and prescribing — banned outright, either person. A
       topic-level answer never needs them. */
    /\b(?:medications?|meds|pills?|tablets?|capsules?|prescri\w+|dose|dosage|\d+\s?mg\b|antidepressants?|ssris?|snris?|benzodiazepin\w*|anxiolyt\w*|melatonin|magnesium|supplements?|vitamins?|ibuprofen|tylenol|advil|medicine|painkillers?|sleeping\s+pills?)(?!\w)/i,
    /* A condition read onto the person — "you have / you may have / you
       are showing signs of". Up to three words of slack covers "you
       have some early symptoms of depression" without letting a real
       distance in. */
    /\byou(?:\s+|'|’)\s*(?:have|may\s+have|might\s+have|could\s+have|must\s+have|seem\s+to\s+have|ve\s+got|have\s+got|got|(?:(?:might|could|may|must)\s+be|are|re)\s+(?:showing|experiencing|dealing\s+with|struggling\s+with|going\s+through|living\s+with)|show|suffer(?:ing)?\s+from|live\s+with)\s+[\w'’-]*(?:\s+[\w'’-]+){0,3}\s*(?:depress\w*|anxiet\w*|insomnia|burnout|bipolar|ptsd|ocd|adhd|schizophren\w*|disorder|syndrome|condition|deficien\w*|illness|disease|diabetes|thyroid|an[ae]mia|eating\s+disorder|sleep\s+apn[oe]a|panic\s+disorder)(?!\w)/i,
    /* The adjectival read — "you seem depressed", "you might be burned
       out". */
    /\byou(?:\s+|'|’)\s*(?:are|re|seem|sound|look|feel|might\s+be|could\s+be|may\s+be|must\s+be|appear(?:\s+to\s+be)?|come\s+across\s+as)\s+(?:so\s+|really\s+|quite\s+|pretty\s+|very\s+|genuinely\s+|truly\s+|a\s+(?:bit|little)\s+)?(?:depress\w+|anxious|manic|burn(?:t|ed)[\s-]?out|traumati[sz]\w+|bipolar|suicidal|psychotic)(?!\w)/i,
    /* Possessive — "your depression", "your symptoms", "your diagnosis". */
    /\byour\s+(?:depress\w+|anxiet\w+|insomnia|burnout|bipolar|ptsd|ocd|adhd|schizophren\w*|disorder|syndrome|symptoms?|diagnos\w+|illness|disease|condition|panic\s+attacks?)(?!\w)/i,
    /* Labeled guesses about what they described — "sounds like
       depression", "it could be anxiety", "a sign of a disorder". */
    /\b(?:sounds?|seems?|feels?|looks?)\s+like\s+(?:it\s+(?:could|might|may|is|'s)\s*(?:be\s+)?|you(?:'re|\s+are)?\s+(?:have|may\s+have|might\s+have|could\s+have|are\s+dealing\s+with|are\s+going\s+through|are\s+struggling\s+with)\s+)?(?:a\s+|an\s+|some\s+|early\s+)?(?:[\w'’-]+\s+){0,2}(?:signs?\s+of\s+)?(?:depress\w*|anxiet\w*|insomnia|burnout|disorder|syndrome|bipolar|ptsd|ocd|adhd|schizophren\w*|eating\s+disorder)(?!\w)/i,
    /\b(?:that|this|it)(?:'s|\s+(?:is|was|(?:could|might|may)\s+(?:well\s+)?be))\s+(?:a\s+|an\s+|early\s+)?(?:[\w'’-]+\s+){0,2}(?:signs?\s+of\s+|form\s+of\s+|case\s+of\s+)?(?:depress\w*|anxiet\w*|insomnia|burnout|disorder|syndrome|bipolar|ptsd|ocd|adhd|schizophren\w*|eating\s+disorder)(?!\w)/i,
    /\b(?:could|might|may)\s+(?:well\s+)?be\s+(?:a\s+|an\s+)?(?:early\s+)?(?:signs?|symptoms?|form|case)\s+of\s+[\w'’-]*(?:depress\w*|anxiet\w*|insomnia|burnout|disorder|syndrome|bipolar|ptsd|ocd|adhd|schizophren\w*)(?!\w)/i,
    /* Steered toward care — "you should see a doctor", "a therapist
       could help you", "get checked out", "consider therapy". General
       third-person mentions stay clean: "a doctor can diagnose it",
       "talking to a professional helps". */
    /\byou\s+(?:should|must|need\s+to|ought\s+to|might\s+want\s+to|may\s+want\s+to|could|want\s+to)\s+(?:see|talk\s+to|speak\s+(?:to|with)|consult|reach\s+out\s+to|visit|ask|contact|call|check\s+with)\s+(?:a\s+|your\s+)?(?:doctor|physician|therapist|counsello?r\w*|psychiatr\w*|psycholog\w*|clinician|professional|gp|provider|nurse|specialist)(?!\w)/i,
    /\b(?:doctor|physician|therapist|counsello?r\w*|psychiatr\w*|psycholog\w*|clinician|professional|provider|specialist|therapy|treatment|counsell?ing)\s+(?:could|can|may|might|would|should|will)\s+(?:really\s+|actually\s+|genuinely\s+)?help\s+(?:you\b|with\s+(?:this|that|it|what))/i,
    /\b(?:see|talk\s+to|speak\s+(?:to|with)|consult|visit|ask|contact|tell)\s+(?:a\s+|your\s+)?(?:doctor|physician|therapist|counsello?r\w*|psychiatr\w*|psycholog\w*|clinician|professional|provider|nurse|specialist)\s+about\s+(?:your|those|these|the|what)\b/i,
    /(?:^|[.!?\n]\s*|\b(?:please|so|then|honestly|seriously)\s+)(?:see|talk\s+to|speak\s+(?:to|with)|consult|visit|call|ask|reach\s+out\s+to|contact)\s+(?:a\s+|your\s+)?(?:doctor|physician|therapist|counsello?r\w*|psychiatr\w*|psycholog\w*|clinician|professional|provider|nurse|specialist)\b/im,
    /\b(?:worth|a\s+good\s+idea\s+to|best\s+to|help(?:s|ful)?\s+to)\s+(?:see|seeing|talk(?:ing)?\s+(?:to|with)|speak(?:ing)?\s+(?:to|with)|consult(?:ing)?|visit(?:ing)?|try(?:ing)?|consider(?:ing)?|explor\w*|look(?:ing)?\s+into)\s+(?:a\s+|your\s+)?(?:doctor|physician|therapist|counsello?r\w*|psychiatr\w*|psycholog\w*|clinician|professional|provider|specialist|therapy|treatment|counsell?ing)\b/i,
    /\b(?:get|getting)\s+(?:yourself\s+)?(?:tested|diagnosed|checked\s+out|screened|assessed|evaluated|referred)\b/i,
    /\bget\s+(?:it|that|this|yourself|those)\s+(?:checked|tested|diagnosed|looked\s+at|assessed|evaluated|checked\s+out)\b/i,
    /\byou\s+(?:could|should|might|may|would)?\s*(?:start|try|stop|begin|pursue|undergo|consider|explore|look\s+into|benefit\s+from|enter|join)\s+(?:a\s+|an\s+|some\s+|the\s+|group\s+)?(?:treatment|therapy|counsell?ing|psychotherapy|rehab|clinical\s+care)\b/i,
    /(?:^|[.!?\n]\s*|\b(?:please|so|then)\s+)(?:try|consider|explore|look\s+into|start|begin|pursue|join)\s+(?:a\s+|an\s+|some\s+|the\s+|group\s+)?(?:therapy|treatment|counsell?ing|psychotherapy|rehab|a\s+support\s+group)\b/im,
    /\b(?:seek|seeking|get|getting|find|reach\s+out\s+for|ask\s+for|look\s+for)\s+(?:professional|medical|clinical|urgent)\s+(?:help|support|care|attention|advice|treatment)\b/i,
    /* Diagnosis verbs aimed at the person — "only a professional can
       diagnose it" stays clean. */
    /\bdiagnos(?:e|es|ed|ing)\s+(?:you|this\s+as)\b/i,
    /\byou(?:\s+|'|’)\s*(?:were|are|re|d\s+be|have\s+been|may\s+be|might\s+be|got|were\s+recently)\s+diagnos\w+/i,
  ],
  fr: [
    /* Substances — banned outright, either person. */
    /\b(?:médicaments?|pilules?|comprimés?|gélules?|prescri\w+|ordonnance|dosage|posologie|antidépresseurs?|isrs?|benzodiazépin\w*|anxiolyt\w*|mélatonine|magnésium|suppléments?|vitamines?|ibuprofène|tylénol|somnifères?|médicament\w*)(?!\w)/i,
    /* A condition read onto the person — "vous avez de l'anxiété",
       "vous souffrez d'insomnie", "vous faites de la dépression". */
    /\bvous\s+(?:avez|souffrez|présentez|montrez|pourriez\s+avoir|auriez|faites|vivez\s+avec|traversez|ressentez|éprouvez|semblez\s+avoir)\s+[\w'’-]*(?:\s+[\w'’-]+){0,3}\s*(?:l'|d')?(?:dépress\w*|anxiété|anxieu\w*|insomnie|épuisement|burnout|bipolarité|tspt|toc|tdah|schizophrén\w*|troubles?|syndrome|maladie|carence|diabète|thyroïde|anémie|apnée|panique)(?!\w)/i,
    /\bvous\s+(?:êtes|semblez|paraissez|avez\s+l'air|vous\s+sentez)\s+(?:si\s+|très\s+|vraiment\s+|tellement\s+|un\s+peu\s+|plutôt\s+)?(?:dépressi[\wàâäéèêëîïôöùûüçœæ]*|déprim\w*[\wàâäéèêëîïôöùûüçœæ]*|anxieu\w+|épuis[\wàâäéèêëîïôöùûüçœæ]*|en\s+burnout|bipolaire|suicidaire|traumatis[\wàâäéèêëîïôöùûüçœæ]*|psychotique)(?!\w)/i,
    /\bvo(?:tre|s)\s+(?:dépress\w+|anxiété|insomnie|épuisement|burnout|bipolarité|tspt|toc|tdah|schizophrén\w*|troubles?|syndrome|maladie|diagnostic\w*|symptômes?|condition|crises?\s+de\s+panique)(?!\w)/i,
    /* Labeled guesses — "ça ressemble à de la dépression", "c'est de
       l'anxiété", "ça pourrait être un signe de burnout". */
    /(?:ça|cela|ceci|tout\s+ça|c')\s*(?:est|était|ressemble\s+à|semble\s+(?:à|être)|pourrait\s+être|serait|s'apparente\s+à|tient\s+(?:de|du))\s*(?:de\s+la\s+|de\s+l'|d'|du\s+|un\s+|une\s+|des\s+)?(?:[\w'’-]+\s+){0,2}(?:l'|d')?(?:dépress\w*|anxiété|anxieu\w*|insomnie|troubles?|burnout|épuisement|bipolarité|tspt|toc|tdah|syndrome)(?!\w)/i,
    /\b(?:pourrait|pourrait\s+bien|peut|pourrait\s+être)\s+(?:un\s+|une\s+)?(?:signe|symptôme|forme|cas)\s+(?:de\s+|d')?(?:de\s+la\s+|de\s+l'|d')?[\w'’-]*(?:l'|d')?(?:dépress\w*|anxiété|insomnie|troubles?|burnout|épuisement|bipolarité|tspt|toc|tdah)(?!\w)/i,
    /* Steered toward care — "vous devriez consulter", imperatives in
       -ez (necessarily addressed to the reader), "une thérapie
       pourrait aider". General mentions stay clean: "un professionnel
       peut l'évaluer", "il existe du soutien". */
    /\bvous\s+(?:devriez|devez|pourriez|auriez\s+intérêt\s+à|gagneriez\s+à|avez\s+besoin\s+de|feriez\s+bien\s+de)\s+(?:voir|consulter|contacter|appeler|parler\s+(?:à|avec)|rencontrer|demander\s+à|en\s+parler\s+(?:à|avec))\s+(?:un\s+|une\s+|votre\s+|le\s+|la\s+|des\s+)?(?:médecin|docteur|thérapeute|psychiatr\w*|psycholog\w*|psycho\w+|conseill\w+|clinicien\w*|professionnel|spécialiste|infirmi\w+|travailleu\w+\s+social\w*)(?!\w)/i,
    /\b(?:médecin|docteur|thérapeute|psychiatr\w*|psycholog\w*|psycho\w+|conseill\w+|clinicien|professionnel|spécialiste|thérap\w+|traitement|suivi|psychothérap\w+)\s+(?:pourrait|pourraient|peut|peuvent|devrait|devraient|va|vont|aiderait|aideraient|serait|seraient|est|sont)\s+(?:vous\s+|te\s+)?(?:aider|soulager|faire\s+du\s+bien|être\s+utile|être\s+la\s+réponse)/i,
    /\b(?:consultez|parlez|appelez|contactez|demandez|voyez|allez\s+voir|prenez\s+rendez-vous\s+avec|en\s+parlez)\s+(?:à\s+|avec\s+)?(?:un\s+|une\s+|votre\s+|le\s+|la\s+)?(?:médecin|docteur|thérapeute|psychiatr\w*|psycholog\w*|psycho\w+|conseill\w+|clinicien|professionnel|spécialiste|infirmi\w+)\b/i,
    /\b(?:ça|cela|il)\s+(?:aide|aiderait|pourrait\s+aider|vaut\s+la\s+peine|vaudrait\s+la\s+peine|est\s+utile|serait\s+utile)\s+(?:de\s+|d')?(?:consulter|voir|parler\s+(?:à|avec)|contacter|appeler|rencontrer|en\s+parler)\s+(?:à\s+|avec\s+)?(?:un\s+|une\s+|votre\s+|le\s+|la\s+)?(?:médecin|docteur|thérapeute|psychiatr\w*|psycholog\w*|psycho\w+|conseill\w+|clinicien|professionnel|spécialiste|infirmi\w+)\b/i,
    /\b(?:vaut|vaudrait)\s+la\s+peine\s+de\s+(?:consulter|voir|parler\s+(?:à|avec)|contacter|appeler|rencontrer|en\s+parler)\s+(?:à\s+|avec\s+)?(?:un\s+|une\s+|votre\s+|le\s+|la\s+)?(?:médecin|docteur|thérapeute|psychiatr\w*|psycholog\w*|psycho\w+|conseill\w+|clinicien|professionnel|spécialiste|infirmi\w+)\b/i,
    /\bvous\s+(?:pourriez|devriez|devez|pouvez|auriez\s+intérêt\s+à)?\s*(?:commencer|commenciez|commencez|essayer|essayez|arrêter|entamer|envisager|envisagez|explorer|explorez|suivre|entreprendre|rejoindre)\s+(?:un\s+|une\s+|le\s+|la\s+|de\s+la\s+)?(?:traitement|thérap\w+|psychothérap\w+|suivi\s+(?:psychologique|thérapeutique|professionnel)|cure|thérapie\s+de\s+groupe)\b/i,
    /\b(?:vous\s+faire|se\s+faire|faites[-\s]vous)\s+(?:tester|dépister|évaluer|diagnostiquer|examiner|soigner|suivre)\b/i,
    /\b(?:cherchez|chercher|obtenez|obtenir|demandez|demander|consultez|consulter)\s+(?:de\s+l'|de\s+la\s+|un\s+|une\s+|des\s+|du\s+)?(?:aide|soutien|soins|avis)\s+(?:professionnel\w*|médical\w*|clinique\w*|d'urgence)/i,
    /\bvous\s+(?:a\s+été|êtes|avez\s+été|étiez|seriez|soyez)?\s*diagnosti\w+/i,
  ],
}

const DIRECTED_PATTERNS: Record<'en' | 'fr', RegExp[]> = {
  en: [
    /\byou\s+(?:should|must|need\s+to|ought\s+to|have\s+to|gotta)\s+(?:sleep|rest|nap|eat|drink|hydrate|exercise|work\s+out|walk|run|jog|meditate|breathe|cut|avoid|reduce|limit|stop|start|quit|take|skip|track|log|journal|stretch|get\s+(?:more|some|to\s+bed))(?!\w)/i,
    /\btry\s+to\s+(?:sleep|cut|quit|stop|avoid|get\s+more)(?!\w)/i,
    /\b(?:cut|quit|stop|drop|skip|avoid|limit|reduce|increase|add)\s+(?:back\s+|down\s+|out\s+|on\s+|your\s+|the\s+)?(?:caffeine|coffee|alcohol|sugar|salt|sweets?|screen\s*time|screens?|smoking|vaping|cigarettes?|junk\s*food|snacks?|snacking|carbs|dairy|gluten|processed\s+foods?|calories|meat|late\s+nights?)(?!\w)/i,
    /\b(?:sleep|get|aim\s+for)\s+(?:at\s+least\s+|around\s+)?\d+\s*hours?\s*(?:a\s+night|of\s+sleep|per\s+night|each\s+night)?/i,
    /\b(?:follow|start|try|stick\s+to|begin)\s+(?:a\s+|an\s+|this\s+|the\s+|my\s+)?(?:diet|meal\s+plan|workout|exercise\s+(?:plan|routine|regimen)|fitness\s+(?:plan|routine)|regimen)(?!\w)/i,
    /\bi(?:'d|\s+would)?\s+(?:recommend|advise|prescribe)\s+(?:that\s+you\s+|you\s+)?(?:taking|take|starting|start|stopping|stop|cutting|cut|changing|change)(?!\w)/i,
  ],
  fr: [
    /\bvous\s+(?:devriez|devez|auriez\s+intérêt\s+à|gagneriez\s+à|feriez\s+bien\s+de|avez\s+besoin\s+de)\s+(?:dormir|vous\s+coucher|manger|boire|marcher|bouger|faire|méditer|respirer|couper|éviter|réduire|limiter|arrêter|cesser|commencer|prendre|noter|tenir)(?!\w)/i,
    /\bil\s+faut\s+que\s+vous\s+(?:dormiez|mangiez|buviez|marchiez|fassiez|coupiez|évitiez|réduisiez|arrêtiez|commenciez|preniez)/i,
    /\bessayez\s+de\s+(?:dormir|vous\s+coucher|couper|réduire|éviter|arrêter|cesser|prendre)(?!\w)/i,
    /(?:coupez|réduisez|évitez|arrêtez|cessez|limitez|supprimez)\s+(?:la\s+|le\s+|les\s+|de\s+|d'|des\s+|votre\s+|du\s+)?\s*(?:caféine|café|alcool|sucre|sel|sucreries|écrans?|tabac|cigarettes?|vapotage|grignotage|glucides|calories|viande)(?!\w)/i,
    /\bdormez\s+(?:au\s+moins\s+)?\d+\s*heures?(?!\w)/i,
    /\b(?:suivez|commencez|adoptez)\s+(?:un|une|ce|cette|le|la)\s+(?:régime|programme\s+(?:d'entraînement|d'exercice)|plan\s+(?:de\s+repas|d'entraînement))(?!\w)/i,
    /\bje\s+(?:vous\s+)?(?:recommande|conseille)\s+(?:de\s+|d')?(?:prendre|commencer|arrêter|cesser|couper|réduire|changer)(?!\w)/i,
  ],
}

/** Fragments crossing a boundary, matched per tier. Empty = clean. */
export function detectHealthFlags(text: string, lang: 'en' | 'fr', advice: boolean): string[] {
  const hits = detectPatterns(text, CLINICAL_PATTERNS[lang])
  if (advice) return hits
  return [...hits, ...detectPatterns(text, DIRECTED_PATTERNS[lang])]
}

/** The repair note behind a flagged reply — names what crossed so the
    rewrite fixes the boundary instead of hedging. */
export function buildHealthRepairNote(flags: string[], advice: boolean): string {
  return (
    'Your reply crossed a boundary — flagged:\n' +
    flags.map((f) => `- "${f}"`).join('\n') +
    '\nRewrite it with nothing clinical applied to the person: no label on what they have or are showing, no steering toward treatment or a clinical visit, no substance names at all. A general explanation of the topic itself is fine — keep it if that is what they asked for. ' +
    (advice
      ? 'Advice itself is fine for this internal account. '
      : 'And no "you should" directives — observations and at most one small everyday suggestion, offered not pushed. ') +
    'Keep the same language and the same JSON contract.'
  )
}

/** The fixed text that replaces a flagged reply the repair pass could not
    clean — the boundary stated plainly, the companion posture kept. */
export const HEALTH_FALLBACK_EN =
  'That one is bigger than what I can weigh in on — the Resources page points to real people if you need more. What I can do is stay close to what you’ve logged: what you wrote, what changed, what the trend looks like.'
export const HEALTH_FALLBACK_FR =
  'Ça dépasse ce que je peux trancher — la page Ressources mène vers de vraies personnes si besoin. Ce que je peux faire : rester près de ce que vous avez consigné — ce que vous avez écrit, ce qui a changé, ce que la tendance montre.'

/** One-liner for flagged reaction replies — they are too small to repair. */
export const HEALTH_REACT_FALLBACK_EN = 'I’m here — tell me more whenever you’re ready.'
export const HEALTH_REACT_FALLBACK_FR = 'Je suis là — dites-m’en plus quand vous voulez.'

/** Fallbacks for the flagged one-shot kinds. */
export const HEALTH_REFLECT_FALLBACK_EN = 'What is one thing from today that stayed with you?'
export const HEALTH_REFLECT_FALLBACK_FR = 'Qu’est-ce qui vous est resté de la journée ?'
export const HEALTH_RECAP_FALLBACK_EN =
  'A quiet stretch — keep logging and the picture sharpens.'
export const HEALTH_RECAP_FALLBACK_FR =
  'Une semaine tranquille — continuez à consigner et l’image se précisera.'
