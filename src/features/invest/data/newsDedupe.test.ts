import { describe, expect, it } from 'vitest'
import { dedupeNews, JUNK_HEADLINE, NEWS_KIND_ORDER, newsKind } from './newsDedupe'

function row(title: string, over: Partial<{ symbol: string; publishedAt: string }> = {}) {
  return { title, symbol: 'AMD', publishedAt: '2026-10-16T14:00:00Z', ...over }
}

describe('dedupeNews', () => {
  it('merges the same event rewritten by two outlets', () => {
    const items = dedupeNews([
      row('Advanced Micro Devices (NASDAQ:AMD) Stock Falls 6% - Here\'s Why'),
      row('Advanced Micro Devices Inc (AMD) Stock Down 6.0% but Still Overvalued -- GF Score: 81/100'),
    ])
    expect(items).toHaveLength(1)
    expect(items[0]!.title).toContain("Here's Why")
  })

  it('merges a wire story across its publisher wordings', () => {
    const items = dedupeNews([
      row('Binance Founder CZ Voices Support for XRP, ZEC and SOL Amid China Crypto Controversy', { symbol: 'SOL' }),
      row("Binance's CZ backs XRP, ZEC, and SOL amid Solana gains", { symbol: 'SOL' }),
    ])
    expect(items).toHaveLength(1)
  })

  it('keeps genuinely different stories about the same symbol', () => {
    const items = dedupeNews([
      row('Applied Materials Inc Stock (AMAT) Moved Down by 3.13% on Oct 16: What Investors Need To Know', { symbol: 'AMAT' }),
      row('Applied Materials Just Opened a $5 Billion R&D Center. What That Actually Means for AMAT Stock.', { symbol: 'AMAT' }),
    ])
    expect(items).toHaveLength(2)
  })

  it('does not merge across different publish days', () => {
    const items = dedupeNews([
      row('AMD slides on chip selloff', { publishedAt: '2026-10-16T14:00:00Z' }),
      row('AMD slides on chip selloff again', { publishedAt: '2026-10-10T14:00:00Z' }),
    ])
    expect(items).toHaveLength(2)
  })

  it('prefers the symbol-tagged copy over the unscoped one', () => {
    const items = dedupeNews([
      row('Chip stocks slide on export fears', { symbol: '' }),
      row('Chip stocks slide on export fears', { symbol: 'AMAT' }),
    ])
    expect(items).toHaveLength(1)
    expect(items[0]!.symbol).toBe('AMAT')
  })

  it('keeps different-symbol copies apart — the tag is a claim', () => {
    const items = dedupeNews([
      row('Chip stocks slide on export fears', { symbol: 'AMAT' }),
      row('Chip stocks slide on export fears', { symbol: 'SHOP' }),
    ])
    expect(items).toHaveLength(2)
  })

  it('symbol-agnostic mode merges cross-tag duplicates for theme cards', () => {
    const items = dedupeNews(
      [
        row('Export rules tighten on semis', { symbol: 'AMAT' }),
        row('Export rules tighten on semis', { symbol: 'ARM' }),
      ],
      { symbolAware: false },
    )
    expect(items).toHaveLength(1)
  })

  it('merges one theme story across its linked symbols — the tag is a linkage, not a mention', () => {
    const items = dedupeNews([
      { ...row('US-China Trade War Escalates With New Bans', { symbol: 'AMD' }), viaTheme: 'Export restrictions' },
      { ...row('US-China Trade War Escalates With New Bans', { symbol: 'AMAT' }), viaTheme: 'Export restrictions' },
      { ...row('US-China Trade War Escalates With New Bans', { symbol: 'ARM' }), viaTheme: 'Export restrictions' },
    ])
    expect(items).toHaveLength(1)
  })

  it('prefers a book symbol over a board-only link when theme copies merge', () => {
    const items = dedupeNews(
      [
        { ...row('US-China Trade War Escalates With New Bans', { symbol: 'AMD' }), viaTheme: 'Export restrictions' },
        { ...row('US-China Trade War Escalates With New Bans', { symbol: 'AMAT' }), viaTheme: 'Export restrictions' },
      ],
      { preferSymbols: new Set(['AMAT']) },
    )
    expect(items).toHaveLength(1)
    expect(items[0]!.symbol).toBe('AMAT')
  })

  it('needs two shared content tokens to merge — one never proves same-story', () => {
    const items = dedupeNews([
      row('AMD Falls on Downgrade', { symbol: 'AMD' }),
      row('AMD Opens New Toronto Office', { symbol: 'AMD' }),
    ])
    expect(items).toHaveLength(2)
  })

  it('keeps cross-symbol copies when the stories claim different themes', () => {
    const items = dedupeNews([
      { ...row('Semis slide on the day', { symbol: 'AMAT' }), viaTheme: 'Export restrictions' },
      { ...row('Semis slide on the day', { symbol: 'ARM' }), viaTheme: 'Rate path' },
    ])
    expect(items).toHaveLength(2)
  })
})

describe('newsKind', () => {
  const cases: [title: string, kind: ReturnType<typeof newsKind>][] = [
    /* events — something happened */
    ['Apple Reports Q4 Earnings Beat Expectations', 'event'],
    ['FDA Approves New Cancer Drug', 'event'],
    ['US Widens Chip-Equipment Export Rules', 'event'],
    ['Microsoft to Acquire Activision', 'event'],
    ['AMD Stock Jumps on New AI Chip Launch', 'event'],
    /* analyst churn wins its borrowed event verbs */
    ['Analyst Announces New AMD Price Target', 'view'],
    ['Oppenheimer Maintains Outperform on AMD After Earnings', 'view'],
    ['Should You Buy AMD Stock Right Now?', 'view'],
    ['Top 10 Stocks to Watch This Week', 'view'],
    ['Solana (SOL) Price Prediction for November', 'view'],
    /* price-move writeups */
    ["AMD Stock Falls 6% - Here's Why", 'move'],
    ['Why NVIDIA Stock Jumped Today', 'move'],
    ['Applied Materials Stock Moved Down by 3.13%', 'move'],
    ['Bitcoin Hits New All-Time High', 'move'],
    /* neither template — stays neutral */
    ['Fed Holds Rates Steady', 'news'],
    ['China Negotiations Continue Into Weekend', 'news'],
  ]
  it.each(cases)('classifies "%s" as %s', (title, kind) => {
    expect(newsKind(title)).toBe(kind)
  })

  it('orders kinds event → news → view → move', () => {
    expect(
      [newsKind('Fed Holds Rates Steady'), newsKind('Apple Reports Q4 Earnings Beat'), newsKind('AMD Stock Falls 6%'), newsKind('Should You Buy AMD?')]
        .sort((a, b) => NEWS_KIND_ORDER[a] - NEWS_KIND_ORDER[b]),
    ).toEqual(['event', 'news', 'view', 'move'])
  })
})

describe('JUNK_HEADLINE', () => {
  it('drops listing pages and wager boards, keeps real headlines', () => {
    for (const t of [
      'SOL price on Oct 13, 2026 at 4am EDT Crypto Prediction Market',
      'Arm Holdings plc Tokenized Stock (Coinbase) price today, ARMc to USD live price, marketcap and chart',
      'QUBT Nov 2026 8.500 call (QUBT261106C00008500)',
      'ETH / USD live price, marketcap and chart - CoinMarketCap',
      'AAPL Jan 2027 250.000 call',
      'Current price of Ethereum for October 16, 2026',
    ]) {
      expect(JUNK_HEADLINE.test(t), t).toBe(true)
    }
    for (const t of [
      'AMD Stock Falls 6% - Here\'s Why',
      'Applied Materials Just Opened a $5 Billion R&D Center',
      'Binance backs XRP amid controversy',
      'Fed holds rates steady',
      'Current prices hold steady for Bitcoin',
    ]) {
      expect(JUNK_HEADLINE.test(t), t).toBe(false)
    }
  })
})
