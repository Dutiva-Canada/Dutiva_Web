/**
 * The Ontario corpus heartbeat — the one check no per-page verdict can stand
 * in for: e-Laws answering fine while the corpus behind it freezes reads as
 * "no changes" forever. It polls the dedicated currency-date endpoint and
 * files one alert per freeze, not one per sweep.
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { fetchWithTimeout } from './lawFetch.ts'
import { assessCurrencyDate } from './ontarioApi.ts'
import {
  BROKEN_ALERT_THRESHOLD,
  DAY_MS,
  ONTARIO_SOURCE_STALE_MS,
  type HashRecord,
} from './sweepShared.ts'

/* ── Source liveness: e-Laws currency-date heartbeat ──────────────────
   Per-page verdicts catch a page that stops answering or stops being the
   Act it claimed. What they cannot catch: the whole Ontario API answering
   fine while the corpus behind it freezes — every fingerprint matches and
   every sweep reports green. e-Laws publishes how current its corpus is
   ("Laws current to …") at a dedicated endpoint; polling it is the
   independent alarm docs/LAW_MONITORING.md left open. State lives on a
   pseudo law_page_hashes row so a freeze alerts once, not every sweep. */
const HEARTBEAT_KEY = 'heartbeat:ontario-elaws-currency-date'
const HEARTBEAT_URL = 'https://www.ontario.ca/laws/api/v2/legislation/en/currency-date'

export async function runOntarioHeartbeat(
  ctx: { db: SupabaseClient },
  hashMap: Record<string, HashRecord>,
): Promise<string[]> {
  const lines: string[] = []
  try {
    const hbRecord = hashMap[HEARTBEAT_KEY]
    const hbMeta = (hbRecord?.meta ?? null) as Record<string, unknown> | null
    let alertKind = typeof hbMeta?.alertKind === 'string' ? hbMeta.alertKind : null
    let hbFailures = typeof hbMeta?.failures === 'number' ? hbMeta.failures : 0

    const hbFetch = await fetchWithTimeout(HEARTBEAT_URL, 12000)
    const hbVerdict = assessCurrencyDate(
      hbFetch.ok ? hbFetch.text : null,
      Date.now(),
      ONTARIO_SOURCE_STALE_MS,
    )
    const claimText = hbVerdict.kind === 'dead' ? null : hbVerdict.claimText

    let summary: string | null = null
    if (hbVerdict.kind === 'dead') {
      hbFailures += 1
      lines.push(`HB-DEAD   Ontario/e-Laws currency-date unreadable (failure #${hbFailures})`)
      if (hbFailures >= BROKEN_ALERT_THRESHOLD && alertKind !== 'dead') {
        alertKind = 'dead'
        summary =
          'The e-Laws currency-date endpoint stopped returning a readable "laws current to" ' +
          `date — ${hbFailures} consecutive checks. Per-statute fetches may still succeed on ` +
          'stale data; treat Ontario monitoring as unconfirmed until the endpoint recovers.'
      }
    } else {
      hbFailures = 0
      if (hbVerdict.kind === 'stale') {
        lines.push(`HB-STALE  Ontario/e-Laws claims corpus is ${hbVerdict.ageDays}d old`)
        if (alertKind !== 'stale') {
          alertKind = 'stale'
          summary =
            `e-Laws still reports its corpus "current to ${hbVerdict.claimText}" — ` +
            `${hbVerdict.ageDays} days old, past the ~90-day bound a live consolidation feed ` +
            'stays under. Ontario act-version data may have stopped updating even though ' +
            'every page fetch succeeds; verify against e-Laws before relying on the next digest.'
        }
      } else {
        alertKind = null
        lines.push(`HB-OK     Ontario/e-Laws corpus current to ${hbVerdict.claimText}`)
      }
    }

    await ctx.db.from('law_page_hashes').upsert({
      url: HEARTBEAT_KEY,
      jurisdiction: 'Ontario',
      law_name: 'e-Laws source liveness (currency-date)',
      content_hash: claimText ?? hbRecord?.hash ?? '',
      is_broken: alertKind !== null,
      consecutive_failures: hbFailures,
      ...(alertKind !== null ? { last_broken_at: new Date().toISOString() } : {}),
      last_checked: new Date().toISOString(),
      meta: { heartbeat: true, alertKind, failures: hbFailures, lastClaimed: claimText },
    })

    if (summary !== null) {
      await ctx.db.from('law_updates').insert({
        jurisdiction: 'Ontario',
        law_name: 'e-Laws source liveness (currency-date)',
        url: HEARTBEAT_URL,
        reference_url: 'https://www.ontario.ca/laws',
        change_summary: summary,
        raw_diff: `claimed: ${claimText ?? 'unreadable'} · failures: ${hbFailures} · threshold: ${ONTARIO_SOURCE_STALE_MS / DAY_MS}d`,
        detected_at: new Date().toISOString(),
        is_new: false,
        event_type: 'broken',
      })
    }
  } catch (err) {
    lines.push(`HB-ERROR  Ontario heartbeat: ${String(err)}`)
  }
  return lines
}
