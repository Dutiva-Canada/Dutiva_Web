/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * health-chat-feedback — aggregate the thumbs ratings on Mira's replies so
 * the persona can be tuned from signal, not vibes.
 *
 * Prints counts only — how many assistant turns were rated, how the split
 * lands, and how it trends by week. It deliberately does NOT dump reply
 * text: what users wrote to a wellness companion is sensitive, and the
 * tuning question ("is the down-share rising?") is answerable from counts.
 * When the ratio says something moved, review the actual turns in the
 * dashboard — under the same access controls as any user-data read.
 *
 * Usage: node scripts/health-chat-feedback.mjs [--days 90]   (default 90)
 *
 * Needs SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF (.env is loaded).
 */
import './lib/env.mjs'
import { managementQuery } from './lib/managementApi.mjs'
import { ACCESS_TOKEN_HELP, cleanSecret, describeSecret } from './lib/secrets.mjs'

const daysArg = process.argv.indexOf('--days')
const days =
  daysArg >= 0 && /^\d+$/.test(process.argv[daysArg + 1] ?? '')
    ? Math.min(Math.max(Number(process.argv[daysArg + 1]), 1), 365)
    : 90

const token = cleanSecret(process.env.SUPABASE_ACCESS_TOKEN)
const projectRef = cleanSecret(process.env.SUPABASE_PROJECT_REF)
if (!token || !projectRef) {
  console.error('health-chat-feedback: needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF')
  process.exit(1)
}

const totals = await managementQuery(
  projectRef,
  token,
  `select
     count(*)::int as turns,
     count(*) filter (where feedback = 1)::int as up,
     count(*) filter (where feedback = -1)::int as down
   from public.health_chat_messages
   where role = 'assistant'
     and created_at >= now() - interval '1 day' * ${days}`,
)

if (!totals?.ok) {
  console.error(
    `health-chat-feedback: query failed (${totals?.status ?? 'no response'}) — ` +
      `SUPABASE_ACCESS_TOKEN ${describeSecret(process.env.SUPABASE_ACCESS_TOKEN)}.\n` +
      `  ${ACCESS_TOKEN_HELP}`,
  )
  process.exit(1)
}

const rows = await totals.json()
const t = rows[0] ?? { turns: 0, up: 0, down: 0 }
const rated = t.up + t.down
console.log(`health-chat-feedback — last ${days} days`)
console.log(`  assistant turns:  ${t.turns}`)
console.log(`  rated:            ${rated} (${t.turns ? Math.round((rated / t.turns) * 100) : 0}%)`)
console.log(`  thumbs up:        ${t.up}`)
console.log(`  thumbs down:      ${t.down}`)
if (rated > 0) {
  console.log(`  down share:       ${Math.round((t.down / rated) * 100)}% of rated turns`)
}

const weekly = await managementQuery(
  projectRef,
  token,
  `select date_trunc('week', created_at)::date as week,
          count(*) filter (where feedback = 1)::int as up,
          count(*) filter (where feedback = -1)::int as down
   from public.health_chat_messages
   where role = 'assistant' and feedback is not null
     and created_at >= now() - interval '1 day' * ${days}
   group by 1 order by 1 desc`,
)
if (weekly?.ok) {
  const weeks = await weekly.json()
  if (weeks.length > 0) {
    console.log('\n  by week (rated turns only):')
    for (const w of weeks) {
      const total = w.up + w.down
      console.log(`    ${w.week}  +${w.up} / −${w.down}  (${Math.round((w.down / total) * 100)}% down)`)
    }
  }
}
