import { describe, expect, it } from 'vitest'
import {
  buildDraftPrompt,
  buildMemoryReviewPrompt,
  draftSystemPrompt,
  memoryPromptBlock,
  parseDraft,
  parseMemoriesDraft,
  parseThesisDraft,
  sanitizeGoal,
  validateAiAction,
} from './handlers'
import { runTallyEval } from './goldenEval'
import {
  ADVICE_FALLBACK_EN,
  ADVICE_FALLBACK_FR,
  INVEST_CHAT_ACTION_TYPES,
  buildAdviceRepairNote,
  buildRepairNote,
  chatSources,
  detectDirectedAdvice,
  extractMentionedSymbols,
  formatMarketEntry,
  headlineSourceVisible,
  investChatPrompt,
  investReactPrompt,
  newsKindTag,
  normalizeSource,
  parseInvestChatReply,
  resolveInvestRef,
  verifyReplyClaims,
  type InvestChatContext,
  type MarketContextEntry,
} from './handlers'

const EMPTY_CTX: InvestChatContext = {
  profile: null,
  accounts: [],
  positions: [],
  watchlist: [],
  strategies: [],
  newSignals: [],
  openOrders: [],
  market: [],
  generalNews: [],
  memories: [],
}

describe('investChatPrompt', () => {
  it('carries the not-advice line and the queued-order honesty', () => {
    const p = investChatPrompt(EMPTY_CTX, 'en').content
    expect(p).toContain('nothing here is investment advice')
    expect(p).toContain('QUEUED draft')
    expect(p).toContain('never fills on its own')
    expect(p).toContain('strict JSON')
  })
  it('renders the book data with (none) placeholders', () => {
    const ctx: InvestChatContext = {
      ...EMPTY_CTX,
      accounts: [{ name: 'TFSA', kind: 'paper', cashBalance: 5000, baseCurrency: 'CAD' }],
      positions: [{ symbol: 'XEQT', name: 'All-Equity ETF', quantity: 10, lastPrice: 30.5, currency: 'CAD' }],
      newSignals: [{ id: 'sig1', title: 'XEQT dipped 5%', symbol: 'XEQT', kind: 'alert' }],
    }
    const p = investChatPrompt(ctx, 'en').content
    expect(p).toContain('"TFSA" — paper, 5000 CAD cash')
    expect(p).toContain('XEQT "All-Equity ETF" — 10 units, last 30.5 CAD')
    expect(p).toContain('[sig1] alert on XEQT — "XEQT dipped 5%"')
    expect(p).toContain('(none)')
  })
  it('asks for French under lang fr', () => {
    expect(investChatPrompt(EMPTY_CTX, 'fr').content).toContain('Canadian French')
  })
  it('renders the user profile as calibration facts, never as permission', () => {
    const ctx: InvestChatContext = {
      ...EMPTY_CTX,
      profile: {
        riskTolerance: 'aggressive',
        horizon: 'long',
        goal: 'growth',
        experience: 'new',
        answerStyle: 'teach',
        sectors: ['technology', 'energy'],
        exclusions: ['tobacco', 'weapons'],
        mandate: 'Long-term compounding; I trim winners past 40% gains.',
      },
    }
    const p = investChatPrompt(ctx, 'en').content
    expect(p).toContain('User profile')
    expect(p).toContain('risk tolerance: aggressive')
    expect(p).toContain('horizon: long (10+ years)')
    expect(p).toContain('goal: growth')
    expect(p).toContain('experience: new to markets')
    expect(p).toContain('answer style: explain the reasoning')
    expect(p).toContain('sectors they follow: technology, energy')
    expect(p).toContain('screens out: tobacco, weapons')
    /* The profile is declared subordinate to the advice boundary — even
       an "aggressive" external account keeps the hard line. */
    expect(p).toContain('never changes the advice boundary')
    expect(p).toContain('nothing here is investment advice')
  })
  it('omits the profile section entirely when nothing is set', () => {
    const p = investChatPrompt(EMPTY_CTX, 'en').content
    expect(p).not.toContain('User profile')
    const blank: InvestChatContext = {
      ...EMPTY_CTX,
      profile: {
        riskTolerance: null, horizon: null, goal: null, experience: null,
        answerStyle: null, sectors: [], exclusions: [], mandate: null,
      },
    }
    expect(investChatPrompt(blank, 'en').content).not.toContain('User profile')
  })
})

describe('parseInvestChatReply', () => {
  it('parses a clean reply with no action', () => {
    expect(parseInvestChatReply('{"reply":"hi","action":null}')).toEqual({
      reply: 'hi',
      action: null,
      suggests: [],
      fetch: [],
      search: null,
    })
  })
  it('accepts an empty reply only when fetch names real tickers', () => {
    const out = parseInvestChatReply('{"reply":"","action":null,"fetch":["nvda","SHOP"]}')
    expect(out).toMatchObject({ reply: '', fetch: ['NVDA', 'SHOP'] })
    /* fetch alone does not rescue a junk payload */
    expect(parseInvestChatReply('{"reply":"","fetch":[]}')).toBeNull()
    expect(parseInvestChatReply('{"reply":"","fetch":["not a ticker!!!"]}')).toBeNull()
    /* a reply that has text AND fetch is final — fetch is ignored */
    const done = parseInvestChatReply('{"reply":"done","fetch":["NVDA"]}')
    expect(done?.reply).toBe('done')
    expect(done?.fetch).toEqual(['NVDA'])
  })
  it('accepts an empty reply only when a live-web search is outstanding', () => {
    const out = parseInvestChatReply(
      '{"reply":"","action":null,"search":"  bank of   canada rate decision  "}',
    )
    expect(out).toMatchObject({ reply: '', search: 'bank of canada rate decision' })
    /* search alone does not rescue a junk payload either */
    expect(parseInvestChatReply('{"reply":"","search":""}')).toBeNull()
    expect(parseInvestChatReply('{"reply":"","search":42}')).toBeNull()
    /* whitespace collapses and the query is length-capped */
    const long = parseInvestChatReply(`{"reply":"","search":"${'q'.repeat(300)}"}`)
    expect(long?.search?.length).toBe(160)
    /* the two escapes can combine in one hop */
    const both = parseInvestChatReply(
      '{"reply":"","fetch":["amd"],"search":"amd latest news"}',
    )
    expect(both).toMatchObject({ fetch: ['AMD'], search: 'amd latest news' })
  })
  it('keeps string suggests, drops anything else', () => {
    const out = parseInvestChatReply(
      '{"reply":"hi","action":null,"suggests":["Trim the fund?","ok",5,""]}',
    )
    expect(out?.suggests).toEqual(['Trim the fund?', 'ok'])
  })
  it('parses add_watch_symbol and uppercases the ticker', () => {
    const out = parseInvestChatReply(
      JSON.stringify({ reply: 'ok', action: { type: 'add_watch_symbol', symbol: 'xeqt', name: 'All-Equity' } }),
    )
    expect(out?.action).toMatchObject({ type: 'add_watch_symbol', symbol: 'XEQT', name: 'All-Equity' })
  })
  it('parses a market create_order and validates a limit needs a price', () => {
    const market = parseInvestChatReply(
      JSON.stringify({
        reply: 'ok',
        action: { type: 'create_order', symbol: 'XEQT', side: 'buy', quantity: 5 },
      }),
    )
    expect(market?.action).toMatchObject({
      type: 'create_order', symbol: 'XEQT', side: 'buy', quantity: 5, orderType: 'market',
    })
    /* limit without limitPrice → reject */
    expect(
      parseInvestChatReply(
        JSON.stringify({
          reply: 'ok',
          action: { type: 'create_order', symbol: 'XEQT', side: 'buy', quantity: 5, orderType: 'limit' },
        }),
      ),
    ).toBeNull()
    /* bad qty → reject */
    expect(
      parseInvestChatReply(
        JSON.stringify({
          reply: 'ok',
          action: { type: 'create_order', symbol: 'XEQT', side: 'buy', quantity: -3 },
        }),
      ),
    ).toBeNull()
  })
  it('rejects unknown actions and bad shapes', () => {
    expect(
      parseInvestChatReply(JSON.stringify({ reply: 'x', action: { type: 'execute_order', symbol: 'XEQT' } })),
    ).toBeNull()
    expect(parseInvestChatReply(JSON.stringify({ reply: 'x', action: { type: 'update_signal' } }))).toBeNull()
    expect(parseInvestChatReply('not json')).toBeNull()
    expect(parseInvestChatReply('{"reply":""}')).toBeNull()
  })
  it('parses update_signal with a whitelisted status only', () => {
    const ok = parseInvestChatReply(
      JSON.stringify({ reply: 'ok', action: { type: 'update_signal', signalId: 's1', status: 'dismissed' } }),
    )
    expect(ok?.action).toEqual({ type: 'update_signal', signalId: 's1', status: 'dismissed' })
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'update_signal', signalId: 's1', status: 'executed' } }),
      ),
    ).toBeNull()
  })
  it('parses draft_strategy only with a real goal', () => {
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'draft_strategy', goal: 'rebalance when drift > 25%' } }),
      )?.action,
    ).toEqual({ type: 'draft_strategy', goal: 'rebalance when drift > 25%' })
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'draft_strategy', goal: 'short' } }),
      ),
    ).toBeNull()
  })

  it('parses draft_thesis with a valid symbol only', () => {
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'draft_thesis', symbol: 'shop' } }),
      )?.action,
    ).toMatchObject({ type: 'draft_thesis', symbol: 'SHOP' })
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'draft_thesis', symbol: 'not a symbol!!' } }),
      ),
    ).toBeNull()
  })

  it('parses set_goal with whitelisted metrics and signed-target rules', () => {
    const ok = parseInvestChatReply(
      JSON.stringify({
        reply: 'ok',
        action: {
          type: 'set_goal',
          title: 'Reach 100k',
          metric: 'book_value',
          op: 'gte',
          target: 100000,
          deadline: '2030-01-01',
        },
      }),
    )
    expect(ok?.action).toMatchObject({ type: 'set_goal', metric: 'book_value', target: 100000 })
    /* an unlisted metric, a negative target on an unsigned metric, and a
       malformed deadline field all reject */
    expect(
      parseInvestChatReply(
        JSON.stringify({
          reply: 'ok',
          action: { type: 'set_goal', title: 'x'.repeat(4), metric: 'vibes', op: 'gte', target: 5 },
        }),
      ),
    ).toBeNull()
    expect(
      parseInvestChatReply(
        JSON.stringify({
          reply: 'ok',
          action: { type: 'set_goal', title: 'Cash floor', metric: 'cash_pct', op: 'gte', target: -5 },
        }),
      ),
    ).toBeNull()
    /* the signed metric keeps negatives — a loss floor is legal there */
    expect(
      parseInvestChatReply(
        JSON.stringify({
          reply: 'ok',
          action: { type: 'set_goal', title: 'Loss floor', metric: 'unrealized_gain_pct', op: 'gte', target: -20 },
        }),
      )?.action,
    ).toMatchObject({ type: 'set_goal', target: -20 })
  })

  it('parses record_cash for deposit/withdrawal with a positive amount', () => {
    expect(
      parseInvestChatReply(
        JSON.stringify({
          reply: 'ok',
          action: { type: 'record_cash', kind: 'deposit', amount: 250, account: 'TFSA' },
        }),
      )?.action,
    ).toMatchObject({ type: 'record_cash', kind: 'deposit', amount: 250, account: 'TFSA' })
    /* a dividend-typed record_cash normalizes to record_dividend — the
       held-position check still applies, but the symbol is mandatory. */
    expect(
      parseInvestChatReply(
        JSON.stringify({
          reply: 'ok',
          action: { type: 'record_cash', kind: 'dividend', amount: 50 },
        }),
      ),
    ).toBeNull() /* no symbol → rejected outright */
    expect(
      parseInvestChatReply(
        JSON.stringify({
          reply: 'ok',
          action: { type: 'record_cash', kind: 'dividend', amount: 45, symbol: 'vfv' },
        }),
      )?.action,
    ).toMatchObject({ type: 'record_dividend', symbol: 'VFV', total: 45 })
    expect(
      parseInvestChatReply(
        JSON.stringify({
          reply: 'ok',
          action: { type: 'record_cash', kind: 'dividend', symbol: 'VFV', perShare: 0.9 },
        }),
      )?.action,
    ).toMatchObject({ type: 'record_dividend', symbol: 'VFV', perShare: 0.9 })
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'record_cash', kind: 'deposit', amount: -1 } }),
      ),
    ).toBeNull()
  })

  it('parses set_recurring with a cadence and sane date', () => {
    const ok = parseInvestChatReply(
      JSON.stringify({
        reply: 'ok',
        action: { type: 'set_recurring', amount: 500, cadence: 'monthly', nextRunOn: '2026-01-01' },
      }),
    )
    expect(ok?.action).toMatchObject({ type: 'set_recurring', cadence: 'monthly', nextRunOn: '2026-01-01' })
    /* a non-date nextRunOn drops the field instead of rejecting */
    expect(
      parseInvestChatReply(
        JSON.stringify({
          reply: 'ok',
          action: { type: 'set_recurring', amount: 500, cadence: 'weekly', nextRunOn: 'soon' },
        }),
      )?.action,
    ).toMatchObject({ type: 'set_recurring', cadence: 'weekly', nextRunOn: undefined })
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'set_recurring', amount: 500, cadence: 'daily' } }),
      ),
    ).toBeNull()
  })

  it('parses record_dividend and record_split against held symbols', () => {
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'record_dividend', symbol: 'ry', perShare: 1.08 } }),
      )?.action,
    ).toMatchObject({ type: 'record_dividend', symbol: 'RY', perShare: 1.08 })
    /* a stated flat payout books as `total` — same held-position guard */
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'record_dividend', symbol: 'RY', total: 54 } }),
      )?.action,
    ).toMatchObject({ type: 'record_dividend', symbol: 'RY', total: 54 })
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'record_dividend', symbol: 'RY', perShare: 0 } }),
      ),
    ).toBeNull()
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'record_split', symbol: 'SHOP', ratio: 10 } }),
      )?.action,
    ).toMatchObject({ type: 'record_split', symbol: 'SHOP', ratio: 10 })
    /* a 1:1 split is a no-op the model shouldn't file */
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'ok', action: { type: 'record_split', symbol: 'SHOP', ratio: 1 } }),
      ),
    ).toBeNull()
  })
})

describe('resolveInvestRef', () => {
  const rows = [
    { id: 'a1', name: 'TFSA paper', symbol: '' },
    { id: 'a2', name: 'RRSP paper', symbol: '' },
    { id: 'w1', name: '', symbol: 'XEQT' },
  ]
  it('matches name or symbol, exact first', () => {
    expect(resolveInvestRef('TFSA paper', rows)?.id).toBe('a1')
    expect(resolveInvestRef('xeqt', rows)?.id).toBe('w1')
  })
  it('falls back to a unique substring and rejects ambiguity', () => {
    expect(resolveInvestRef('rrsp', rows)?.id).toBe('a2')
    expect(resolveInvestRef('paper', rows)).toBeNull()
    expect(resolveInvestRef('', rows)).toBeNull()
  })
})


describe('sanitizeGoal', () => {
  it('requires a real goal and caps length', () => {
    expect(sanitizeGoal('too short')).toBeNull()
    expect(sanitizeGoal(42)).toBeNull()
    expect(sanitizeGoal('a'.repeat(2000))).toHaveLength(1200)
    expect(sanitizeGoal('  rebalance when any holding drifts past 25%  ')).toBe(
      'rebalance when any holding drifts past 25%',
    )
  })
})

describe('parseDraft', () => {
  const good = JSON.stringify({
    name: 'Rebalance watch',
    cadence: 'weekly',
    scope: { watchlist: false, symbols: ['SHOP', 'XEQT'] },
    rules: [
      {
        metric: 'weight_pct',
        op: 'gt',
        value: 25,
        type: 'signal',
        severity: 'alert',
        title: 'Drift over 25%',
      },
      {
        metric: 'bogus_metric',
        op: 'lt',
        value: 0,
        type: 'signal',
        severity: 'alert',
        title: 'drops',
      },
    ],
  })

  it('returns a validated draft', () => {
    const draft = parseDraft(good)
    expect(draft).not.toBeNull()
    expect(draft!.name).toBe('Rebalance watch')
    expect(draft!.cadence).toBe('weekly')
    expect(draft!.scope).toEqual({ watchlist: false, symbols: ['SHOP', 'XEQT'] })
    /* The bogus metric was dropped by the engine's own validator. */
    expect(draft!.rules).toHaveLength(1)
    expect(draft!.rules[0].metric).toBe('weight_pct')
    expect(draft!.rules[0].type).toBe('signal')
  })

  it('tolerates code fences and prose around the JSON', () => {
    expect(parseDraft(`Here you go:\n\`\`\`json\n${good}\n\`\`\``)).not.toBeNull()
  })

  it('rejects drafts with no valid rules or no name', () => {
    expect(
      parseDraft(
        JSON.stringify({
          name: 'x',
          rules: [{ metric: 'nope', op: 'lt', value: 1, type: 'signal', title: 't' }],
        }),
      ),
    ).toBeNull()
    expect(
      parseDraft(
        JSON.stringify({
          rules: [{ metric: 'weight_pct', op: 'gt', value: 25, type: 'signal', title: 't' }],
        }),
      ),
    ).toBeNull()
    expect(parseDraft('no json here')).toBeNull()
    expect(parseDraft('{}')).toBeNull()
  })

  it('defaults bad cadence/scope to safe values and maps legacy rules', () => {
    const draft = parseDraft(
      JSON.stringify({
        name: 'x',
        cadence: 'hourly',
        scope: { watchlist: false, symbols: ['not a symbol!!'] },
        rules: [
          { metric: 'day_change_pct', op: 'lt', value: -8, kind: 'screen', title: 'dip' },
          {
            metric: 'day_change_pct',
            op: 'lt',
            value: -5,
            kind: 'alert',
            title: 'buy',
            side: 'buy',
            qty: 2,
          },
        ],
      }),
    )
    expect(draft!.cadence).toBe('daily')
    /* No valid symbols → watchlist fallback so the draft still has scope. */
    expect(draft!.scope).toEqual({ watchlist: true, symbols: [] })
    /* Legacy kinds still normalize: screen → insight signal, side+qty → proposal. */
    expect(draft!.rules[0]).toMatchObject({ type: 'signal', severity: 'insight' })
    expect(draft!.rules[1]).toMatchObject({
      type: 'order_proposal',
      side: 'buy',
      qty: 2,
      qty_unit: 'shares',
    })
  })
})

describe('validateAiAction', () => {
  it('accepts the draft actions only', () => {
    expect(validateAiAction('draft-strategy').ok).toBe(true)
    expect(validateAiAction('draft-thesis').ok).toBe(true)
    expect(validateAiAction('draft-swot').ok).toBe(true)
    expect(validateAiAction('draft-scan').ok).toBe(true)
    expect(validateAiAction('review-memories').ok).toBe(true)
    expect(validateAiAction('auto-trade').ok).toBe(false)
  })
})

describe('parseMemoriesDraft', () => {
  const held = new Set(['ARM', 'VFV'])
  it('parses a clean list with symbol scope', () => {
    const d = parseMemoriesDraft(
      JSON.stringify({
        memories: [
          { kind: 'plan', symbol: 'ARM', text: 'plans to hold through the edge-AI cycle' },
          { kind: 'philosophy', symbol: null, text: 'believes in buying quality and holding' },
        ],
      }),
      held,
    )
    expect(d).toEqual([
      { kind: 'plan', symbol: 'ARM', text: 'plans to hold through the edge-AI cycle' },
      { kind: 'philosophy', symbol: null, text: 'believes in buying quality and holding' },
    ])
  })
  it('drops unknown kinds and unnamed kinds', () => {
    const d = parseMemoriesDraft(
      JSON.stringify({
        memories: [
          { kind: 'order', symbol: 'ARM', text: 'should buy more ARM' },
          { kind: 'fact', symbol: 'ARM', text: 'holds since 2021' },
        ],
      }),
      held,
    )
    expect(d).toEqual([{ kind: 'fact', symbol: 'ARM', text: 'holds since 2021' }])
  })
  it('unscopes a symbol the book does not track — never trusts a hallucinated ticker', () => {
    const d = parseMemoriesDraft(
      JSON.stringify({
        memories: [{ kind: 'fact', symbol: 'NVDA', text: 'bought NVDA for the data-center run' }],
      }),
      held,
    )
    expect(d).toEqual([{ kind: 'fact', symbol: null, text: 'bought NVDA for the data-center run' }])
  })
  it('drops too-short text, dedupes twins, and caps at five', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      kind: 'fact',
      symbol: null,
      text: `confirmed fact number ${i + 1} about the holder`,
    }))
    items.push({ kind: 'fact', symbol: null, text: 'short' })
    const d = parseMemoriesDraft(JSON.stringify({ memories: items }), held)
    expect(d).toHaveLength(5)
    /* Dedupe — the same fact twice counts once toward the five. */
    const twin = parseMemoriesDraft(
      JSON.stringify({
        memories: [
          { kind: 'fact', symbol: null, text: 'holds since 2021' },
          { kind: 'fact', symbol: null, text: '  holds   since 2021 ' },
        ],
      }),
      held,
    )
    expect(twin).toHaveLength(1)
  })
  it('returns null for non-JSON and an empty list yields []', () => {
    expect(parseMemoriesDraft('not json', held)).toBeNull()
    expect(parseMemoriesDraft(JSON.stringify({ memories: [] }), held)).toEqual([])
  })
})

describe('review-memories prompt', () => {
  it('shows the confirmed list so the model never re-proposes it', () => {
    const p = buildMemoryReviewPrompt(
      {
        messages: [{ role: 'user', content: 'I bought ARM for the edge-AI story', createdAt: null }],
        existing: [{ symbol: null, text: 'holds since 2021' }],
      },
      'en',
    )
    expect(p).toContain('Already confirmed')
    expect(p).toContain('holds since 2021')
    expect(p).toContain('I bought ARM for the edge-AI story')
  })
  it('feeds only the holder’s own turns — Tally’s words are not their facts', () => {
    const p = buildMemoryReviewPrompt(
      {
        messages: [
          { role: 'assistant', content: 'You should trim your winners.', createdAt: null },
          { role: 'user', content: 'I am saving for a house.', createdAt: null },
        ],
        existing: [],
      },
      'fr',
    )
    expect(p).toContain('I am saving for a house.')
    expect(p).not.toContain('You should trim your winners.')
    expect(p).toContain('Canadian French')
  })
})

describe('memoryPromptBlock', () => {
  const facts = [
    { symbol: 'ARM', kind: 'fact', text: 'bought ARM for the edge-AI story' },
    { symbol: null, kind: 'plan', text: 'saving for a house downpayment' },
  ]
  it('prefers symbol-scoped facts for a draft about that symbol', () => {
    const block = memoryPromptBlock(facts, 'arm')
    expect(block).toContain('[ARM fact] bought ARM')
    expect(block).toContain('saving for a house')
    /* Scoped to another symbol the scoped fact drops, book-wide stays. */
    const other = memoryPromptBlock(facts, 'VFV')
    expect(other).not.toContain('[ARM')
    expect(other).toContain('saving for a house')
  })
  it('renders nothing for an empty list', () => {
    expect(memoryPromptBlock([], 'ARM')).toBe('')
    expect(memoryPromptBlock(undefined, 'ARM')).toBe('')
  })
  it('renders the mandate in the holder’s own words, even with no memories', () => {
    const block = memoryPromptBlock([], 'ARM', '  Long-term compounding only.  ')
    expect(block).toContain('their mandate, in their words')
    expect(block).toContain('Long-term compounding only.')
    /* Whitespace-only mandate is no context at all. */
    expect(memoryPromptBlock([], 'ARM', '   ')).toBe('')
  })
  it('ranks a symbol-scoped fact ahead of newer book-wide facts', () => {
    /* Book-wide facts are newest-first at load time; without the scoped
       sort the cap would cut the ARM fact before it renders. */
    const crowded = [
      ...Array.from({ length: 8 }, (_, i) => ({
        symbol: null,
        kind: 'fact',
        text: `book-wide fact ${i}`,
      })),
      { symbol: 'ARM', kind: 'fact', text: 'bought ARM for the edge-AI story' },
    ]
    const block = memoryPromptBlock(crowded, 'ARM')
    expect(block).toContain('[ARM fact] bought ARM')
    /* No symbol in scope → insertion order preserved, scoped tail cut. */
    expect(memoryPromptBlock(crowded)).not.toContain('[ARM')
  })
  it('buildDraftPrompt carries personal context alongside the goal', () => {
    const p = buildDraftPrompt('Cut concentration below 30%', 'en', {
      mandate: 'Slow compounding, no leverage.',
      memories: [{ symbol: null, kind: 'plan', text: 'add to index funds monthly' }],
    })
    expect(p).toContain('Cut concentration below 30%')
    expect(p).toContain('Slow compounding, no leverage.')
    expect(p).toContain('add to index funds monthly')
  })
})

describe('investChatPrompt — memories + mandate', () => {
  it('renders confirmed memories as context, never permission', () => {
    const ctx: InvestChatContext = {
      ...EMPTY_CTX,
      memories: [
        { symbol: 'ARM', kind: 'fact', text: 'bought ARM for the edge-AI story' },
        { symbol: null, kind: 'plan', text: 'saving for a house' },
      ],
    }
    const p = investChatPrompt(ctx, 'en').content
    expect(p).toContain('What you remember about them')
    expect(p).toContain('[ARM fact] bought ARM for the edge-AI story')
    expect(p).toContain('saving for a house')
    expect(p).toContain('never change the advice boundary')
  })
  it('renders the mandate with the profile dimensions', () => {
    const ctx: InvestChatContext = {
      ...EMPTY_CTX,
      profile: {
        riskTolerance: 'balanced', horizon: null, goal: null, experience: null,
        answerStyle: null, sectors: [], exclusions: [],
        mandate: 'Long-term compounding; trim winners past 40%.',
      },
    }
    const p = investChatPrompt(ctx, 'en').content
    expect(p).toContain('their mandate, in their words')
    expect(p).toContain('Long-term compounding')
  })
  it('omits the memories block when none are confirmed', () => {
    expect(investChatPrompt(EMPTY_CTX, 'en').content).not.toContain(
      'What you remember about them',
    )
  })
})

describe('parseThesisDraft', () => {
  const good = JSON.stringify({
    thesis: 'Arm keeps its phone royalties and wins data-center designs.',
    intent: 'growth',
    break_rules: [
      {
        metric: 'unrealized_gain_pct',
        op: 'lt',
        value: -30,
        type: 'signal',
        severity: 'alert',
        title: 'Down 30% from cost',
      },
    ],
    drift_rules: [
      {
        metric: 'vs_ma50',
        op: 'lt',
        value: -5,
        type: 'signal',
        severity: 'insight',
        title: 'Under the 50-day average',
      },
    ],
  })

  it('returns a validated draft with both zones', () => {
    const d = parseThesisDraft(good)
    expect(d).not.toBeNull()
    expect(d!.intent).toBe('growth')
    expect(d!.break_rules).toHaveLength(1)
    expect(d!.drift_rules).toHaveLength(1)
  })

  it('drops order proposals a model sneaks in — a thesis only observes', () => {
    const d = parseThesisDraft(
      JSON.stringify({
        thesis: 'x holds because y',
        break_rules: [
          {
            metric: 'weight_pct',
            op: 'gt',
            value: 35,
            type: 'order_proposal',
            side: 'sell',
            qty: 10,
            qty_unit: 'percent_of_position',
            title: 'Trim',
          },
        ],
        drift_rules: [
          { metric: 'vs_ma50', op: 'lt', value: -5, type: 'signal', title: 'under 50d' },
        ],
      }),
    )
    expect(d).not.toBeNull()
    expect(d!.break_rules).toHaveLength(0)
    expect(d!.drift_rules).toHaveLength(1)
  })

  it('rejects drafts with no claim text or no usable conditions', () => {
    expect(
      parseThesisDraft(
        JSON.stringify({ break_rules: [{ metric: 'vs_ma50', op: 'lt', value: -5, type: 'signal', title: 'x' }] }),
      ),
    ).toBeNull()
    expect(
      parseThesisDraft(
        JSON.stringify({ thesis: 'holds because reasons', break_rules: [], drift_rules: [] }),
      ),
    ).toBeNull()
    expect(parseThesisDraft('not json')).toBeNull()
  })

  it('defaults a bad intent to core', () => {
    const d = parseThesisDraft(
      JSON.stringify({
        thesis: 'x holds because y',
        intent: 'yolo',
        break_rules: [
          { metric: 'vs_ma50', op: 'lt', value: -10, type: 'signal', title: 'x' },
        ],
      }),
    )
    expect(d!.intent).toBe('core')
  })
})


describe('investReactPrompt', () => {
  it('names the watched symbol and carries the no-advice hard line', () => {
    const p = investReactPrompt({ type: 'watch_added', symbol: 'vfv' }, EMPTY_CTX, 'en')
    expect(p).toContain('Tally')
    expect(p).toContain('VFV')
    expect(p).toContain('watchlist')
    expect(p).toContain('never say the order, watch, position, or signal call is good or bad')
    expect(p).toContain('Plain text only')
    expect(p).toContain('Canadian English')
  })

  it('names a queued order as a draft awaiting review, with book context', () => {
    const p = investReactPrompt(
      { type: 'order_queued', symbol: 'xeqt', side: 'buy', quantity: 5 },
      { ...EMPTY_CTX, newSignals: [{ kind: 'price_alert', symbol: 'XEQT' } as never] },
      'fr',
    )
    expect(p).toContain('buy 5 XEQT')
    expect(p).toContain('draft')
    expect(p).toContain('price_alert on XEQT')
    expect(p).toContain('Canadian French')
  })
})

describe('parseInvestChatReply — add_position', () => {
  it('parses a position log with whitelisted fields', () => {
    const out = parseInvestChatReply(
      JSON.stringify({
        reply: 'Logged.',
        action: { type: 'add_position', symbol: 'vfv', quantity: 10, avgCost: 42.5, account: 'TFSA', name: 'VFV ETF' },
      }),
    )
    expect(out?.action).toEqual({
      type: 'add_position',
      symbol: 'VFV',
      name: 'VFV ETF',
      assetClass: undefined,
      quantity: 10,
      avgCost: 42.5,
      account: 'TFSA',
    })
  })

  it('rejects non-positive quantities and missing costs', () => {
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'x', action: { type: 'add_position', symbol: 'VFV', quantity: -1, avgCost: 10 } }),
      ),
    ).toBeNull()
    expect(
      parseInvestChatReply(
        JSON.stringify({ reply: 'x', action: { type: 'add_position', symbol: 'VFV', quantity: 1 } }),
      ),
    ).toBeNull()
  })
})

describe('investReactPrompt — the wider book events', () => {
  it('names a signal triage with its symbol', () => {
    const p = investReactPrompt(
      { type: 'signal_updated', status: 'acknowledged', symbol: 'xeqt' },
      EMPTY_CTX,
      'en',
    )
    expect(p).toContain('acknowledged')
    expect(p).toContain('XEQT')
    expect(p).toContain('never say the order, watch, position, or signal call is good or bad')
  })

  it('names a logged position and a new account', () => {
    const p = investReactPrompt(
      { type: 'position_logged', symbol: 'vfv', quantity: 12 },
      EMPTY_CTX,
      'en',
    )
    expect(p).toContain('12 VFV')
    const a = investReactPrompt(
      { type: 'account_added', name: 'TFSA', kind: 'paper' },
      EMPTY_CTX,
      'en',
    )
    expect(a).toContain('TFSA')
    expect(a).toContain('paper')
  })

  it('names the quiet-ledger events — cash, schedule, split, fill', () => {
    expect(
      investReactPrompt(
        { type: 'cash_recorded', kind: 'deposit', amount: 500, currency: 'CAD' },
        EMPTY_CTX,
        'en',
      ),
    ).toContain('deposit of 500 CAD')
    expect(
      investReactPrompt(
        { type: 'recurring_created', amount: 500, cadence: 'monthly' },
        EMPTY_CTX,
        'en',
      ),
    ).toContain('monthly recurring contribution of 500')
    expect(
      investReactPrompt(
        { type: 'split_recorded', symbol: 'shop', ratio: 10 },
        EMPTY_CTX,
        'en',
      ),
    ).toContain('10-for-1 split on SHOP')
    expect(
      investReactPrompt(
        { type: 'fill_recorded', symbol: 'xeqt', quantity: 5 },
        EMPTY_CTX,
        'en',
      ),
    ).toContain('5 XEQT')
  })

  it('names a stress run with its book delta when present', () => {
    const p = investReactPrompt(
      { type: 'scenario_run', name: 'ACME -25%', deltaPct: -8.34 },
      EMPTY_CTX,
      'en',
    )
    expect(p).toContain('ACME -25%')
    expect(p).toContain('-8.3%')
    /* delta omitted → just the scenario name */
    expect(
      investReactPrompt({ type: 'scenario_run', name: 'Cash shock' }, EMPTY_CTX, 'en'),
    ).not.toContain('book moved')
  })
})

/* Persona contract — the invariants that make Tally Tally: the no-advice
   hard line, queued-not-executed honesty, and a grammar that matches the
   whitelist. If a prompt edit loses one, this breaks before the model does. */
describe('Tally persona contract', () => {
  it('chat prompt carries the not-advice line and the queued-order honesty', () => {
    const p = investChatPrompt(EMPTY_CTX, 'en').content
    expect(p).toContain('Tally')
    expect(p).toContain('nothing here is investment advice')
    expect(p).toContain('QUEUED draft')
    expect(p).toContain('software, not a person and not an adviser')
  })

  it('chat prompt grants the educational register without lowering the boundary', () => {
    const p = investChatPrompt(EMPTY_CTX, 'en').content
    /* The teach grant — explaining concepts, abstract frameworks, generic
       examples — is what lets a no-knowledge user learn enough to judge. */
    expect(p).toContain('You MAY teach')
    expect(p).toContain('never framed as what they should do')
    /* And the line it must not cross: facts about the book are fine,
       evaluation and direction are not. */
    expect(p).toContain('never evaluate them')
    expect(p).toContain('licensed adviser')
  })

  it('chat prompt permits honest opinions on ideas, never verdicts on securities', () => {
    const p = investChatPrompt(EMPTY_CTX, 'en').content
    /* "What do you think?" deserves a real view on ideas — the refusal
       only binds verdicts on specific securities, their book, or
       pretending to predict prices. */
    expect(p).toContain('what do you think')
    expect(p).toContain('never give is a verdict on a specific security')
    expect(p).toContain('never pretend to call where a price goes')
  })

  it('every whitelisted action type appears in the grammar', () => {
    const p = investChatPrompt(EMPTY_CTX, 'en').content
    for (const t of INVEST_CHAT_ACTION_TYPES) {
      expect(p).toContain(`"type":"${t}"`)
    }
  })

  it('react prompt keeps the hard line', () => {
    const p = investReactPrompt({ type: 'account_added', name: 'TFSA' }, EMPTY_CTX, 'en')
    expect(p).toContain('Tally')
    expect(p).toContain('nothing here is investment advice')
  })
})

/* Internal-staff tier — a verified @dutiva.ca sign-in swaps the no-advice
   boundary for a direct-advice register (index.ts decides from the auth
   email). The write grammar and the queued-draft honesty stay identical. */
describe('detectDirectedAdvice (external-tier backstop)', () => {
  it('flags directed calls and recommendations in English', () => {
    const flagged = [
      'You should buy more AMD on this dip.',
      'I recommend buying SHOP here.',
      "I'd suggest selling your position.",
      'My recommendation is to hold.',
      'Buy the dip while it lasts.',
      'VFV is a good buy at this level.',
      "It's a good time to buy.",
      'Your portfolio looks solid and well positioned.',
      'Your holdings are concentrated and risky.',
      'Time to get out of this name.',
    ]
    for (const reply of flagged) {
      expect(detectDirectedAdvice(reply, 'en'), reply).not.toEqual([])
    }
  })

  it('lets teaching, deflections, and abstract views through', () => {
    const clean = [
      'An ETF is a basket of securities that trades like a stock.',
      'Dollar-cost averaging means investing a fixed amount on a schedule.',
      'That call is yours — a licensed adviser can help you make it.',
      'Index funds usually beat stock-picking on fees alone.',
      'You hold 3 positions, all equities.',
      'AMD trades at P/E 92 with RSI 61 — the numbers on file.',
      'I suggest speaking with a licensed adviser about that.',
      'Nobody can reliably call where a price goes next.',
    ]
    for (const reply of clean) {
      expect(detectDirectedAdvice(reply, 'en'), reply).toEqual([])
    }
  })

  it('flags directed calls in French and lets teaching pass', () => {
    const flagged = [
      'Vous devriez acheter davantage de AMD.',
      'Je vous recommande de vendre vos positions.',
      'Un bon achat à ce niveau.',
      'Votre portefeuille semble risqué et concentré.',
      "C'est le moment d'acheter.",
    ]
    for (const reply of flagged) {
      expect(detectDirectedAdvice(reply, 'fr'), reply).not.toEqual([])
    }
    const clean = [
      'Un FNB est un panier de titres qui se négocie comme une action.',
      'Cette décision vous appartient — un conseiller agréé peut vous aider.',
      'Je suggère de consulter un conseiller agréé pour cela.',
    ]
    for (const reply of clean) {
      expect(detectDirectedAdvice(reply, 'fr'), reply).toEqual([])
    }
  })

  it('the fallback text and repair note pass their own screen', () => {
    expect(detectDirectedAdvice(ADVICE_FALLBACK_EN, 'en')).toEqual([])
    expect(detectDirectedAdvice(ADVICE_FALLBACK_FR, 'fr')).toEqual([])
    const note = buildAdviceRepairNote(['you should buy AMD'])
    expect(note).toContain('you should buy AMD')
    expect(note).toContain('strict JSON')
  })
})

describe('internal advice tier (@dutiva.ca)', () => {
  it('chat prompt swaps the hard line for the internal register', () => {
    const p = investChatPrompt(EMPTY_CTX, 'en', { advice: true }).content
    expect(p).toContain('INTERNAL STAFF ACCOUNT (@dutiva.ca)')
    expect(p).toContain('advice is in scope')
    expect(p).not.toContain('HARD LINE')
    /* The guardrails that survive either register. */
    expect(p).toContain('QUEUED draft')
    expect(p).toContain('never promise returns')
    expect(p).toContain('licensed adviser')
    expect(p).toContain('software, not a person')
    /* An empty book must not become an advisor-deflection — staff still get
       a concrete "what I'd put on first" instead of a referral. */
    expect(p).toContain('empty book is not a reason to deflect')
  })

  it('chat prompt defaults to the generic register', () => {
    expect(investChatPrompt(EMPTY_CTX, 'en').content).toContain('HARD LINE')
    expect(investChatPrompt(EMPTY_CTX, 'en', { advice: false }).content).toContain('HARD LINE')
    /* The action grammar is the same either way. */
    for (const t of INVEST_CHAT_ACTION_TYPES) {
      expect(investChatPrompt(EMPTY_CTX, 'en', { advice: true }).content).toContain(`"type":"${t}"`)
    }
  })

  it('react prompt permits a plain read for staff and keeps the draft honesty', () => {
    const p = investReactPrompt(
      { type: 'order_queued', symbol: 'xeqt', side: 'buy', quantity: 5 },
      EMPTY_CTX,
      'en',
      { advice: true },
    )
    expect(p).toContain('INTERNAL STAFF ACCOUNT (@dutiva.ca)')
    expect(p).not.toContain('HARD LINE')
    expect(p).toContain('needs their review in Orders')
    expect(p).toContain('no price predictions')
  })

  it('draft-strategy keeps the shared contract but drops the not-an-adviser tail', () => {
    const external = draftSystemPrompt(false)
    const internal = draftSystemPrompt(true)
    expect(external).toContain('not an adviser')
    expect(internal).not.toContain('not an adviser')
    expect(internal).toContain('@dutiva.ca')
    expect(internal).toContain('order_proposal')
    expect(internal).toContain('never promise returns')
  })
})

describe('extractMentionedSymbols', () => {
  it('pulls uppercase tickers and skips ordinary prose', () => {
    const syms = extractMentionedSymbols('What about AMD? And how does SHOP.TO compare?')
    expect(syms).toEqual(['AMD', 'SHOP.TO'])
    expect(extractMentionedSymbols('should I BUY or SELL the ETF in my TFSA?')).toEqual([])
    /* Real tickers survive even in stopword-heavy prose. */
    expect(extractMentionedSymbols('BTC and ETH vs NVDA')).toEqual(['BTC', 'ETH', 'NVDA'])
    expect(extractMentionedSymbols('amd lowercase stays prose')).toEqual([])
  })
  it('dedupes and caps the list', () => {
    const msg = 'AMD AMD AMD — plus AAA BBB CCC DDD EEE FFF GGG'
    const syms = extractMentionedSymbols(msg)
    expect(syms[0]).toBe('AMD')
    expect(syms.length).toBeLessThanOrEqual(5)
    expect(new Set(syms).size).toBe(syms.length)
  })
})

describe('formatMarketEntry', () => {
  const base = {
    symbol: 'AMD', assetClass: 'equity', price: 254.3, currency: 'USD',
    dayChangePct: 1.23, ma50: 228.4, ma200: 195.1, rsi14: 61.2,
    ret1m: 8.4, ret3m: 22.1, ret12m: 65.0, vol20d: 38.2,
    high52w: 267.08, low52w: 112.76,
    fundamentals: { market_cap: 412e9, pe_trailing: 92.4, pe_forward: 34.1, eps_ttm: 2.76, price_to_book: 6.4, dividend_yield: 0, beta: 1.28, currency: 'USD' },
    asOf: '2026-10-10T13:00:00Z',
    headlines: [{ title: 'AMD unveils new AI chips', source: 'Reuters', publishedAt: '2026-10-09T12:00:00Z', url: 'https://reuters.com/amd-ai-chips' }],
  }
  it('renders the dense technicals + fundamentals + news line', () => {
    const out = formatMarketEntry(base)
    expect(out).toContain('AMD (equity): 254.3 USD')
    expect(out).toContain('today +1.2%')
    expect(out).toContain('MA200 195.1')
    expect(out).toContain('RSI-14 61.2')
    expect(out).toContain('52w 112.76–267.08')
    expect(out).toContain('cap 412.00B USD')
    expect(out).toContain('P/E 92.4')
    expect(out).toContain('"AMD unveils new AI chips" (Reuters, 2026-10-09)')
  })
  it('drops null fields instead of printing placeholders', () => {
    const out = formatMarketEntry({ ...base, ma200: null, rsi14: null, fundamentals: null, headlines: [] })
    expect(out).not.toContain('MA200')
    expect(out).not.toContain('RSI')
    expect(out).not.toContain('fundamentals:')
    expect(out).not.toContain('news:')
  })
  it('tags a classified headline and its theme provenance', () => {
    const out = formatMarketEntry({
      ...base,
      headlines: [{
        title: 'US-China Trade War Escalates', source: 'CNBC',
        publishedAt: '2026-10-09T12:00:00Z', url: 'https://cnbc.com/x',
        kind: 'event', viaTheme: 'Trade restrictions',
      }],
    })
    expect(out).toContain('"US-China Trade War Escalates" (CNBC, 2026-10-09, event, via "Trade restrictions")')
  })
  it('renders the recent close series oldest-first when present', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 240 + i)
    const out = formatMarketEntry({ ...base, closes30d: closes })
    expect(out).toContain('recent closes (oldest→newest): 240')
    expect(out).toContain('269')
    /* Absent on thin coverage — no dangling label. */
    expect(formatMarketEntry({ ...base, closes30d: undefined })).not.toContain('recent closes')
    expect(formatMarketEntry({ ...base, closes30d: [] })).not.toContain('recent closes')
  })
})

describe('investChatPrompt — attachments + closes legend', () => {
  const row: MarketContextEntry = {
    symbol: 'AMD', assetClass: 'equity', price: 254.3, currency: 'USD',
    dayChangePct: 1.2, ma50: 228.4, ma200: 195.1, rsi14: 61.2,
    ret1m: 8.4, ret3m: 22.1, ret12m: 65.0, vol20d: 38.2,
    high52w: 267.08, low52w: 112.76, fundamentals: null,
    asOf: '2026-10-10T13:00:00Z', headlines: [],
  }
  it('adds the closes legend only when a row carries the series', () => {
    const withCloses: InvestChatContext = {
      ...EMPTY_CTX,
      market: [{ ...row, closes30d: [100, 101, 102] }],
    }
    /* The legend line itself — "recent closes" alone also appears in the
       chart-fence instruction, so the assertion names the legend's body. */
    expect(investChatPrompt(withCloses, 'en').content).toContain(
      'recent closes — the last ~30 daily closes',
    )
    expect(investChatPrompt(EMPTY_CTX, 'en').content).not.toContain(
      'the last ~30 daily closes',
    )
    expect(
      investChatPrompt({ ...EMPTY_CTX, market: [row] }, 'en').content,
    ).not.toContain('the last ~30 daily closes')
  })
  it('adds the image honesty clause only when an image rides the turn', () => {
    expect(investChatPrompt(EMPTY_CTX, 'en', { image: true }).content).toContain('attached an image')
    expect(investChatPrompt(EMPTY_CTX, 'en').content).not.toContain('attached an image')
    expect(investChatPrompt(EMPTY_CTX, 'en', { advice: true }).content).not.toContain('attached an image')
  })
  it('teaches the chart fence grammar with the grounding rule attached', () => {
    const p = investChatPrompt(EMPTY_CTX, 'en').content
    expect(p).toContain('```chart fenced block')
    expect(p).toContain('bar, hbar, line, area, or donut')
    /* The chart path is not exempt from grounding — the prompt says so. */
    expect(p).toContain('never invent values to fill a series')
  })
  it('teaches the dutiva-widget grammar and forbids the recommendation badge', () => {
    const p = investChatPrompt(EMPTY_CTX, 'en').content
    expect(p).toContain('```dutiva-widget fenced block')
    for (const type of ['table', 'chart', 'checklist', 'timeline', 'comparison', 'calculator']) {
      expect(p).toContain(`{"type":"${type}"`)
    }
    /* A "recommended" badge on an option card is advice by another name —
       the prompt forbids it outright. */
    expect(p).toContain('NEVER set "recommended"')
    expect(p).toContain('never invent values to fill a widget')
  })
})

describe('headline source prefs', () => {
  const noMutes = new Set<string>()
  it('hides subscription-only sources by default and reveals them on opt-in', () => {
    expect(headlineSourceVisible('Reuters', noMutes, false)).toBe(false)
    expect(headlineSourceVisible('Barron\'s', noMutes, false)).toBe(false)
    expect(headlineSourceVisible('Reuters', noMutes, true)).toBe(true)
    expect(headlineSourceVisible('CBC News', noMutes, false)).toBe(true)
  })
  it('matches paywall names case/punctuation-insensitively and by prefix', () => {
    expect(headlineSourceVisible('reuters', noMutes, false)).toBe(false)
    expect(headlineSourceVisible('Barron’s', noMutes, false)).toBe(false)
    expect(headlineSourceVisible('Reuters Canada', noMutes, false)).toBe(false)
  })
  it('mutes win over everything, including revealed paywalled sources', () => {
    const muted = new Set(['seekingalpha'])
    expect(headlineSourceVisible('Seeking Alpha', muted, true)).toBe(false)
    const mutedYahoo = new Set([normalizeSource('Yahoo Finance')])
    expect(headlineSourceVisible('Yahoo! Finance Canada', mutedYahoo, false)).toBe(false)
    expect(headlineSourceVisible('The Globe and Mail', mutedYahoo, false)).toBe(true)
  })
  it('newsKindTag passes only the five stored verdicts', () => {
    expect(newsKindTag('view')).toBe('view')
    expect(newsKindTag('filing')).toBe('filing')
    expect(newsKindTag('bogus')).toBeNull()
    expect(newsKindTag(null)).toBeNull()
  })
})

describe('investChatPrompt — market data', () => {
  const ctxWithMarket: InvestChatContext = {
    ...EMPTY_CTX,
    market: [{
      symbol: 'AMD', assetClass: 'equity', price: 254.3, currency: 'USD',
      dayChangePct: 1.2, ma50: 228.4, ma200: 195.1, rsi14: 61.2,
      ret1m: 8.4, ret3m: 22.1, ret12m: 65.0, vol20d: 38.2,
      high52w: 267.08, low52w: 112.76,
      fundamentals: { market_cap: 412e9, pe_trailing: 92.4, currency: 'USD' },
      asOf: '2026-10-10T13:00:00Z',
      headlines: [],
    }],
    generalNews: [{ title: 'TSX falls on oil', source: 'CBC', publishedAt: '2026-10-10T10:00:00Z', url: 'https://cbc.ca/tsx-oil' }],
  }
  it('carries the grounding rules and the market rows', () => {
    const p = investChatPrompt(ctxWithMarket, 'en').content
    expect(p).toContain('never invent a P/E')
    expect(p).toContain('nothing on file')
    expect(p).toContain('Market data on file (1):')
    expect(p).toContain('AMD (equity): 254.3 USD')
    expect(p).toContain('Market backdrop:')
    expect(p).toContain('"TSX falls on oil"')
    expect(p).toContain('verdict')
  })
  it('prints the headline-tag legend when headlines exist and omits it when none do', () => {
    expect(investChatPrompt(ctxWithMarket, 'en').content).toContain('Headline tags')
    const quiet: InvestChatContext = {
      ...ctxWithMarket,
      market: [{ ...ctxWithMarket.market[0], headlines: [] }],
      generalNews: [],
    }
    expect(investChatPrompt(quiet, 'en').content).not.toContain('Headline tags')
  })
  it('renders (none) cleanly when the table is empty', () => {
    const p = investChatPrompt(EMPTY_CTX, 'en').content
    expect(p).toContain('Market data on file (0):')
    expect(p).not.toContain('Market backdrop:')
  })
})

describe('investReactPrompt — market grounding', () => {
  it('works a stored market row into the reaction context', () => {
    const p = investReactPrompt(
      { type: 'watch_added', symbol: 'amd' },
      {
        ...EMPTY_CTX,
        market: [{
          symbol: 'AMD', assetClass: 'equity', price: 254.3, currency: 'USD',
          dayChangePct: 1.2, ma50: 228.4, ma200: null, rsi14: 61.2,
          ret1m: null, ret3m: null, ret12m: 65.0, vol20d: null,
          high52w: 267.08, low52w: 112.76, fundamentals: null,
          asOf: '2026-10-10T13:00:00Z', headlines: [],
        }],
      },
      'en',
    )
    expect(p).toContain('market data: AMD (equity): 254.3 USD')
  })
})

describe('verifyReplyClaims', () => {
  const amd: MarketContextEntry = {
    symbol: 'AMD', assetClass: 'equity', price: 608.1, currency: 'USD',
    dayChangePct: -2.03, ma50: 528.9, ma200: 385.3, rsi14: 57.2,
    ret1m: 20.8, ret3m: 13.8, ret12m: 158.2, vol20d: 53.8,
    high52w: 649.4, low52w: 190.9,
    fundamentals: { market_cap: 985e9, pe_trailing: 156.8, currency: 'USD' },
    asOf: '2026-10-11T02:23:00Z', headlines: [],
  }
  it('passes figures that match the row (within rounding)', () => {
    const reply =
      'AMD trades at $608.10 with RSI-14 at 57.2, a P/E of 156.8x, and a 52-week high of 649.4.'
    expect(verifyReplyClaims(reply, [amd])).toEqual([])
    /* roundings of the same figure pass */
    expect(verifyReplyClaims('RSI sits around 57 and the P/E is 157x', [amd])).toEqual([])
  })
  it('flags invented figures and reports the on-file value', () => {
    const out = verifyReplyClaims('AMD shows RSI-14 at 41.0 and a P/E of 28x.', [amd])
    expect(out).toHaveLength(2)
    expect(out.find((m) => m.metric === 'RSI-14')).toMatchObject({ claimed: 41, actual: 57.2 })
    expect(out.find((m) => m.metric === 'P/E')).toMatchObject({ claimed: 28, actual: 156.8 })
  })
  it('skips metrics with no row on file and ignores unlabeled numbers', () => {
    /* no eps on file → an EPS claim cannot be checked, so it passes */
    expect(verifyReplyClaims('EPS is 3.20.', [amd])).toEqual([])
    /* "the trend" names no baseline — not a checkable claim */
    expect(verifyReplyClaims('It sits 30% above the trend.', [amd])).toEqual([])
    /* "the price rose 5%" is prose, not a price claim — needs the $ marker */
    expect(verifyReplyClaims('the price rose 5% yesterday', [amd])).toEqual([])
  })
  it('checks derived percent-vs-baseline claims, sign-aware', () => {
    /* 608.1 vs ma200 385.3 → actually +57.8% above */
    expect(verifyReplyClaims('AMD sits 58% above its 200-day.', [amd])).toEqual([])
    expect(verifyReplyClaims('AMD sits 30% above its 200-day.', [amd])).toHaveLength(1)
    /* wrong direction: price is above the 200-day, so "below" fails */
    const out = verifyReplyClaims('AMD trades 5% below its 200-day.', [amd])
    expect(out).toHaveLength(1)
    expect(out[0].metric).toContain('below')
    /* 608.1 vs 52w high 649.4 → -6.4% off the high */
    expect(verifyReplyClaims('It is 6% off the 52-week high.', [amd])).toEqual([])
    expect(verifyReplyClaims('It is 25% off the 52-week high.', [amd])).toHaveLength(1)
    /* baselines with no row → the claim can't be checked, so it passes */
    expect(verifyReplyClaims('It is 5% above its 50-day.', [{ ...amd, ma50: null }])).toEqual([])
  })
  it('flags RSI judgment calls that no row supports, unless negated', () => {
    /* rsi 57.2 — calling the book overbought is wrong */
    const out = verifyReplyClaims('AMD is overbought here.', [amd])
    expect(out).toHaveLength(1)
    expect(out[0].detail).toContain('overbought')
    expect(out[0].detail).toContain('57.2')
    /* same wording guarded → passes */
    expect(verifyReplyClaims('AMD is not overbought yet.', [amd])).toEqual([])
    expect(verifyReplyClaims('AMD is approaching overbought territory.', [amd])).toEqual([])
    /* a genuinely overbought row supports the call */
    expect(verifyReplyClaims('AMD is overbought here.', [{ ...amd, rsi14: 74 }])).toEqual([])
    /* oversold mirror: lowest rsi on file is 44 → flag, at 25 → pass */
    expect(
      verifyReplyClaims('Everything looks oversold.', [{ ...amd, rsi14: 44 }]),
    ).toHaveLength(1)
    expect(verifyReplyClaims('Everything looks oversold.', [{ ...amd, rsi14: 25 }])).toEqual([])
  })
  it('flags figures for symbols with no row on file', () => {
    const out = verifyReplyClaims('TSLA trades at $255.', [amd])
    expect(out).toHaveLength(1)
    expect(out[0].metric).toBe('TSLA figure')
    expect(out[0].detail).toContain('TSLA')
    /* a TSLA mention with no figure nearby stays unflagged */
    expect(verifyReplyClaims('No data on TSLA — I can fetch it.', [amd])).toEqual([])
    /* a figure near TSLA doesn't ALSO produce a generic price mismatch —
       the unverified flag is the truer diagnosis */
    const both = verifyReplyClaims('TSLA at $255 while AMD trades at $608.10.', [amd])
    expect(both).toHaveLength(1)
    expect(both[0].metric).toBe('TSLA figure')
  })
  it('produces a repair note naming both figures', () => {
    const note = buildRepairNote([{ metric: 'RSI-14', claimed: 41, actual: 57.2, unit: '' }])
    expect(note).toContain('RSI-14')
    expect(note).toContain('41')
    expect(note).toContain('57.2')
    expect(note).toContain('JSON')
    /* detail lines override the stock phrasing */
    const detail = buildRepairNote([
      { metric: 'RSI call', claimed: NaN, actual: NaN, unit: '', detail: "you called the book 'overbought' — the highest RSI-14 on file is 52" },
    ])
    expect(detail).toContain('highest RSI-14')
    expect(detail).not.toContain('NaN')
  })
})

describe('runTallyEval — engine', () => {
  const ctx: InvestChatContext = {
    ...EMPTY_CTX,
    market: [
      {
        symbol: 'AMD', assetClass: 'equity', price: 608.1, currency: 'USD',
        dayChangePct: -2.0, ma50: 528.9, ma200: 385.3, rsi14: 57.2,
        ret1m: null, ret3m: null, ret12m: null, vol20d: null,
        high52w: 649.4, low52w: 190.9, fundamentals: null,
        asOf: null, headlines: [],
      },
    ],
  }
  const canned = (reply: string, extra = '') =>
    async () => `{"reply": ${JSON.stringify(reply)}, "action": null, "suggests": []${extra}}`
  it('passes a case whose reply meets every expectation', async () => {
    const result = await runTallyEval(
      canned('AMD trades at $608.10 with RSI-14 at 57.2.'),
      [{
        id: 't', name: 'n', lang: 'en', advice: false,
        user: 'How is AMD?', ctx,
        expect: { mustContain: ['AMD'] },
      }],
    )
    expect(result.summary.pass).toBe(1)
    expect(result.summary.fail).toBe(0)
  })
  it('fails a case when the model invents a figure', async () => {
    const result = await runTallyEval(
      canned('AMD trades at $608.10 with RSI-14 at 41.'),
      [{
        id: 't', name: 'n', lang: 'en', advice: false,
        user: 'How is AMD?', ctx, expect: {},
      }],
    )
    expect(result.summary.fail).toBe(1)
    expect(result.summary.failedChecks[0]).toContain('claims')
  })
  it('fails on unparseable output and missing expected action', async () => {
    const bad = await runTallyEval(async () => 'not json at all', [
      { id: 't', name: 'n', lang: 'en', advice: false, user: 'q', ctx, expect: {} },
    ])
    expect(bad.summary.fail).toBe(1)
    const noAction = await runTallyEval(canned('Done.'), [
      {
        id: 't', name: 'n', lang: 'en', advice: false, user: 'queue it', ctx,
        expect: { actionType: 'create_order' },
      },
    ])
    expect(noAction.summary.fail).toBe(1)
    expect(noAction.summary.failedChecks[0]).toContain('action')
  })
  it('counts a fetch-only protocol response as a gap, not a pass', async () => {
    const result = await runTallyEval(
      async () => '{"reply": "", "fetch": ["TSLA"], "suggests": []}',
      [{
        id: 't', name: 'n', lang: 'en', advice: false, user: 'TSLA?', ctx,
        expect: { replyRequired: false },
      }],
    )
    expect(result.summary.gap).toBe(1)
    expect(result.summary.pass).toBe(0)
  })
})

describe('chatSources', () => {
  const ctx: InvestChatContext = {
    ...EMPTY_CTX,
    market: [
      {
        symbol: 'AMD', assetClass: 'equity', price: 608.1, currency: 'USD',
        dayChangePct: 2.1, ma50: 528.92, ma200: 385.32, rsi14: 57,
        ret1m: 4.2, ret3m: 31.0, ret12m: 158.0, vol20d: 54.0,
        high52w: 610.0, low52w: 220.0, fundamentals: null,
        asOf: '2026-10-10T13:00:00Z',
        headlines: [
          { title: 'AMD unveils new AI chips', source: 'Reuters', publishedAt: null, url: 'https://reuters.com/amd-ai-chips' },
          { title: 'Chip rally cools', source: 'Bloomberg', publishedAt: null, url: null },
        ],
      },
      {
        symbol: 'VFV', assetClass: 'etf', price: 172.0, currency: 'CAD',
        dayChangePct: null, ma50: null, ma200: null, rsi14: null,
        ret1m: null, ret3m: null, ret12m: null, vol20d: null,
        high52w: null, low52w: null, fundamentals: null, asOf: null,
        headlines: [],
      },
    ],
    generalNews: [
      { title: 'TSX falls on oil', source: 'CBC', publishedAt: null, url: 'https://cbc.ca/tsx-oil' },
    ],
  }
  it('cites the market row and its headlines only when the reply names the symbol', () => {
    const out = chatSources(ctx, 'AMD trades at $608.10, above its MA50.')
    expect(out.some((s) => s.label === 'AMD — delayed market data on file')).toBe(true)
    expect(out).toContainEqual({
      label: '"AMD unveils new AI chips" — Reuters',
      url: 'https://reuters.com/amd-ai-chips',
    })
    /* A headline with no url stays a plain label — never a link. */
    expect(out).toContainEqual({ label: '"Chip rally cools" — Bloomberg' })
    /* VFV's row stays out — the reply never named it. */
    expect(out.some((s) => s.label.includes('VFV'))).toBe(false)
  })
  it('cites a general headline only when the reply quotes its title', () => {
    const quoted = chatSources(ctx, 'Context first: TSX falls on oil, so breadth is thin.')
    expect(quoted).toContainEqual({ label: '"TSX falls on oil" — CBC', url: 'https://cbc.ca/tsx-oil' })
    const silent = chatSources(ctx, 'AMD looks stretched.')
    expect(silent.some((s) => s.label.includes('TSX'))).toBe(false)
  })
  it('a short ticker needs its capital letter — "to" must not cite TO', () => {
    const shortCtx: InvestChatContext = {
      ...EMPTY_CTX,
      market: [{
        symbol: 'TO', assetClass: 'equity', price: 1, currency: 'CAD',
        dayChangePct: null, ma50: null, ma200: null, rsi14: null,
        ret1m: null, ret3m: null, ret12m: null, vol20d: null,
        high52w: null, low52w: null, fundamentals: null, asOf: null,
        headlines: [],
      }],
    }
    expect(chatSources(shortCtx, 'You want to buy it.')).toEqual([])
    expect(chatSources(shortCtx, 'TO looks flat.')).toEqual([
      { label: 'TO — delayed market data on file' },
    ])
  })
})
