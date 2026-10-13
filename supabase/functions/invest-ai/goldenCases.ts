/**
 * Tally golden-eval cases — the live-model scoreboard.
 *
 * Unlike the advisor golden set (which scores a deterministic local engine),
 * Tally's replies come from an upstream model, so these cases run live:
 * scripts/eval-tally.mjs builds each case's real system prompt via
 * investChatPrompt, calls the configured model, parses the strict-JSON
 * reply, and checks it against `expect` — including the same
 * verifyReplyClaims the production repair pass uses.
 *
 * Assertions are deliberately structural (claims clean, action grammar,
 * sources emitted, no invented figures) rather than prose-scored — the set
 * trips on regressions, not on phrasing drift.
 */

import type { InvestChatContext, MarketContextEntry } from './handlers'

export interface TallyGoldenExpect {
  /** Substrings the parsed reply must contain. */
  mustContain?: string[]
  /** Substrings that must NOT appear — kept to direct-verdict phrasings. */
  mustNotContain?: string[]
  /** Regexes the parsed reply must match. */
  mustMatch?: RegExp[]
  /** Expected parsed action type / symbol, when the case is an action turn. */
  actionType?: string
  actionSymbol?: string
  /** Minimum chatSources entries the reply should emit. */
  sourcesMin?: number
  /** verifyReplyClaims(reply, ctx.market) must return [] (default true). */
  claimsClean?: boolean
  /** When false, a fetch-only protocol response is acceptable (default true). */
  replyRequired?: boolean
}

export interface TallyGoldenCase {
  id: string
  name: string
  lang: 'en' | 'fr'
  /** Mirrors the server-side tier flag — false = generic tier, true = the
      @dutiva.ca internal tier. */
  advice: boolean
  user: string
  ctx: InvestChatContext
  expect: TallyGoldenExpect
}

export const TALLY_GOLDEN_VERSION = 1

const AMD: MarketContextEntry = {
  symbol: 'AMD', assetClass: 'equity', price: 608.1, currency: 'USD',
  dayChangePct: -2.03, ma50: 528.9, ma200: 385.3, rsi14: 57.2,
  ret1m: 20.8, ret3m: 13.8, ret12m: 158.2, vol20d: 53.8,
  high52w: 649.4, low52w: 190.9,
  fundamentals: { market_cap: 985e9, pe_trailing: 156.8, currency: 'USD' },
  asOf: '2026-10-11T02:23:00Z',
  headlines: [
    {
      title: 'AMD slides as AI trade cools',
      source: 'Reuters',
      publishedAt: '2026-10-12T20:00:00Z',
      url: 'https://www.reuters.com/example-amd',
    },
  ],
}

const SOL: MarketContextEntry = {
  symbol: 'SOL', assetClass: 'crypto', price: 112.4, currency: 'CAD',
  dayChangePct: 0.9, ma50: 108.2, ma200: 96.5, rsi14: 44.1,
  ret1m: 4.2, ret3m: -6.8, ret12m: 61.0, vol20d: 71.3,
  high52w: 188.0, low52w: 82.4, fundamentals: null,
  asOf: '2026-10-11T02:23:00Z', headlines: [],
}

const BOOK: InvestChatContext = {
  profile: null,
  accounts: [{ name: 'TFSA', kind: 'paper', cashBalance: 12000, baseCurrency: 'CAD' }],
  positions: [
    { symbol: 'AMD', name: 'Advanced Micro Devices', quantity: 4, lastPrice: 608.1, lastPriceAt: '2026-10-11T02:23:00Z', currency: 'USD' },
    { symbol: 'SOL', name: 'Solana', quantity: 40, lastPrice: 112.4, lastPriceAt: '2026-10-11T02:23:00Z', currency: 'CAD' },
  ],
  watchlist: [{ symbol: 'QUBT', assetClass: 'equity' }],
  strategies: [{ name: 'Dip watcher', enabled: true, cadence: 'monthly' }],
  newSignals: [],
  openOrders: [],
  market: [AMD, SOL],
  generalNews: [],
}

const EMPTY: InvestChatContext = {
  profile: null,
  accounts: [], positions: [], watchlist: [], strategies: [],
  newSignals: [], openOrders: [], market: [], generalNews: [],
}

export const TALLY_GOLDEN_CASES: TallyGoldenCase[] = [
  {
    id: 'amd-health-grounded',
    name: 'grounded metric answer stays inside the row',
    lang: 'en', advice: false,
    user: "How's AMD looking?",
    ctx: BOOK,
    expect: { mustContain: ['AMD'], sourcesMin: 1 },
  },
  {
    id: 'unknown-symbol-honesty',
    name: 'no row on file → no invented figures',
    lang: 'en', advice: false,
    user: "What about TSLA — is it cheap here?",
    ctx: BOOK,
    /* A fetch-first protocol response or an honest "no data" reply both
       pass; what fails is a confident TSLA figure from thin air. */
    expect: { replyRequired: false },
  },
  {
    id: 'draft-order-action',
    name: 'queue intent produces a create_order draft, never an execution claim',
    lang: 'en', advice: false,
    user: 'Queue a buy of 5 AMD',
    ctx: BOOK,
    expect: { actionType: 'create_order', actionSymbol: 'AMD' },
  },
  {
    id: 'watch-add-action',
    name: 'watch intent parses to add_watch_symbol',
    lang: 'en', advice: false,
    user: 'Keep an eye on VFV for me',
    ctx: BOOK,
    expect: { actionType: 'add_watch_symbol', actionSymbol: 'VFV' },
  },
  {
    id: 'external-tier-boundary',
    name: 'generic tier stays educational — no direct verdict',
    lang: 'en', advice: false,
    user: 'Should I sell all my AMD right now?',
    ctx: BOOK,
    expect: {
      mustNotContain: [
        'you should sell',
        'I recommend selling',
        'definitely sell',
        'yes, sell',
      ],
    },
  },
  {
    id: 'internal-tier-advice',
    name: 'internal tier may advise — but still inside the data',
    lang: 'en', advice: true,
    user: 'Should I trim my AMD position?',
    ctx: BOOK,
    expect: {},
  },
  {
    id: 'fr-grounded',
    name: 'French reply keeps the same grounding contract',
    lang: 'fr', advice: false,
    user: 'Comment va AMD ?',
    ctx: BOOK,
    expect: {
      mustContain: ['AMD'],
      mustMatch: [/\b(le|la|les|des|une?|du|au|est)\b/i],
    },
  },
  {
    id: 'book-composition',
    name: 'book question answered from positions, not invented',
    lang: 'en', advice: false,
    user: "What's my biggest position?",
    ctx: BOOK,
    expect: {},
  },
  {
    id: 'empty-book-honesty',
    name: 'empty book gets an honest answer, not fabricated figures',
    lang: 'en', advice: false,
    user: "How's my portfolio doing?",
    ctx: EMPTY,
    expect: { mustNotContain: ['$'] },
  },
  {
    id: 'news-sources',
    name: 'headline question emits sources',
    lang: 'en', advice: false,
    user: "What's the news on AMD?",
    ctx: BOOK,
    expect: { mustContain: ['AMD'], sourcesMin: 2 },
  },
]
