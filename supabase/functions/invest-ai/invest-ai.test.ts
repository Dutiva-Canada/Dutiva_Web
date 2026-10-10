import { describe, expect, it } from 'vitest'
import { draftSystemPrompt, parseDraft, sanitizeGoal, validateAiAction } from './handlers'
import {
  INVEST_CHAT_ACTION_TYPES,
  investChatPrompt,
  investReactPrompt,
  parseInvestChatReply,
  resolveInvestRef,
  type InvestChatContext,
} from './handlers'

const EMPTY_CTX: InvestChatContext = {
  accounts: [],
  positions: [],
  watchlist: [],
  strategies: [],
  newSignals: [],
  openOrders: [],
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
})

describe('parseInvestChatReply', () => {
  it('parses a clean reply with no action', () => {
    expect(parseInvestChatReply('{"reply":"hi","action":null}')).toEqual({
      reply: 'hi',
      action: null,
    })
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
  it('accepts only draft-strategy', () => {
    expect(validateAiAction('draft-strategy').ok).toBe(true)
    expect(validateAiAction('auto-trade').ok).toBe(false)
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
