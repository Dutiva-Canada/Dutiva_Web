import { useEffect, useState } from 'react'
import { readPref, writePref } from '@/lib/prefs'
import type { OrderMode } from '@/features/invest/data/types'

/**
 * Portal-level user preferences — localStorage, per browser, same posture as
 * the onboarding flag. Every reader validates the stored value so a stale or
 * hand-edited pref degrades to the default instead of a broken route/mode.
 */

const HOME_TAB_KEY = 'dutiva.invest.homeTab'
const ORDER_MODE_KEY = 'dutiva.invest.orderMode'
const BADGE_SCOPE_KEY = 'dutiva.invest.badgeScope'
const DISPLAY_CUR_KEY = 'dutiva.invest.displayCurrency'

export const HOME_TABS = [
  '/invest',
  '/invest/chat',
  '/invest/portfolio',
  '/invest/orders',
  '/invest/signals',
  '/invest/strategies',
  '/invest/theses',
  '/invest/analysis',
  '/invest/profile',
] as const
export type HomeTab = (typeof HOME_TABS)[number]

export function readHomeTab(): HomeTab {
  const v = readPref(HOME_TAB_KEY, '/invest')
  return (HOME_TABS as readonly string[]).includes(v) ? (v as HomeTab) : '/invest'
}
export function writeHomeTab(tab: HomeTab): void {
  writePref(HOME_TAB_KEY, tab)
}

export function readOrderMode(): OrderMode {
  const v = readPref(ORDER_MODE_KEY, 'paper')
  return v === 'live' ? 'live' : 'paper'
}
export function writeOrderMode(mode: OrderMode): void {
  writePref(ORDER_MODE_KEY, mode)
}

export type BadgeScope = 'all' | 'signals'
export function readBadgeScope(): BadgeScope {
  return readPref(BADGE_SCOPE_KEY, 'all') === 'signals' ? 'signals' : 'all'
}
export function writeBadgeScope(scope: BadgeScope): void {
  writePref(BADGE_SCOPE_KEY, scope)
}

/** '' = the book default (first account's base currency). */
export const DISPLAY_CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'JPY'] as const
export function readDisplayCurrency(): string {
  const v = readPref(DISPLAY_CUR_KEY, '')
  return (DISPLAY_CURRENCIES as readonly string[]).includes(v) ? v : ''
}
export function writeDisplayCurrency(cur: string): void {
  writePref(DISPLAY_CUR_KEY, (DISPLAY_CURRENCIES as readonly string[]).includes(cur) ? cur : '')
}

const CHART_READS_KEY = 'dutiva.invest.chartReads'

/* Tally's one-line reads on the computed cards (donut, rebalance, curve).
   On by default — they're part of the surface now; a reader who finds
   them noise turns them off once, from Settings or the line itself. */
export function readChartReads(): boolean {
  return readPref(CHART_READS_KEY, 'on') !== 'off'
}
export function writeChartReads(on: boolean): void {
  writePref(CHART_READS_KEY, on ? 'on' : 'off')
}

/* Every mounted read must flip together — a raw useState(readChartReads)
   per card would leave the other cards' lines up after one mutes. The
   listeners keep every consumer on the same pref. */
const chartReadListeners = new Set<() => void>()
export function useChartReads(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(readChartReads)
  useEffect(() => {
    const sync = () => setOn(readChartReads())
    chartReadListeners.add(sync)
    return () => {
      chartReadListeners.delete(sync)
    }
  }, [])
  const set = (v: boolean) => {
    writeChartReads(v)
    chartReadListeners.forEach((f) => f())
  }
  return [on, set]
}
