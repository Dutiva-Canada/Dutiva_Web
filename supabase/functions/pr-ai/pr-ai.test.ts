import { describe, expect, it } from 'vitest'
import {
  cleanDraft,
  clustersPrompt,
  draftPrompt,
  parseClusters,
  parsePromptList,
  parseTone,
  parseToneList,
  promptsPrompt,
  summaryPrompt,
  tonePrompt,
} from './handlers'

describe('parseTone', () => {
  it('extracts plain tone words', () => {
    expect(parseTone('positive')).toBe('positive')
    expect(parseTone('Neutral')).toBe('neutral')
    expect(parseTone('NEGATIVE')).toBe('negative')
  })
  it('tolerates numbering and punctuation', () => {
    expect(parseTone('2. positive.')).toBe('positive')
    expect(parseTone('- negative')).toBe('negative')
    expect(parseTone('3) neutral,')).toBe('neutral')
  })
  it('reads French tone labels', () => {
    expect(parseTone('positif')).toBe('positive')
    expect(parseTone('négatif')).toBe('negative')
    expect(parseTone('neutre')).toBe('neutral')
  })
  it('returns null for ambiguous or empty replies', () => {
    expect(parseTone('')).toBeNull()
    expect(parseTone('I cannot determine that')).toBeNull()
    expect(parseTone('   \n  ')).toBeNull()
  })
  it('only reads the first non-empty line', () => {
    expect(parseTone('\n\nnegative\nbecause the article criticizes')).toBe('negative')
  })
})

describe('parseToneList', () => {
  it('maps one tone per line in order', () => {
    expect(parseToneList('positive\nneutral\nnegative', 3)).toEqual([
      'positive',
      'neutral',
      'negative',
    ])
  })
  it('strips numbering per line', () => {
    expect(parseToneList('1. positive\n2. negative', 2)).toEqual(['positive', 'negative'])
  })
  it('pads missing lines with neutral', () => {
    expect(parseToneList('positive', 3)).toEqual(['positive', 'neutral', 'neutral'])
    expect(parseToneList('garbled junk\npositive', 2)).toEqual(['positive', 'neutral'])
  })
  it('caps at the requested count', () => {
    expect(parseToneList('positive\nnegative\nneutral\npositive', 2)).toEqual([
      'positive',
      'negative',
    ])
  })
})

describe('cleanDraft', () => {
  it('passes clean text through', () => {
    expect(cleanDraft('Hello world.\nSecond line.')).toBe('Hello world.\nSecond line.')
  })
  it('strips code fences', () => {
    expect(cleanDraft('```markdown\nDraft text here.\n```')).toBe('Draft text here.')
  })
  it('strips a one-line preamble', () => {
    expect(cleanDraft('Here is a draft:\nActual content.')).toBe('Actual content.')
    expect(cleanDraft("Voici une ébauche :\nContenu réel.")).toBe('Contenu réel.')
  })
  it('strips markdown headers but keeps body', () => {
    expect(cleanDraft('# Press release\n\nDutiva today announced…')).toBe('Dutiva today announced…')
  })
  it('keeps a long first line that is real content', () => {
    const content = 'Dutiva today announced a new compliance toolkit for Canadian employers.'
    expect(cleanDraft(content)).toBe(content)
  })
})

describe('prompts', () => {
  it('tonePrompt numbers headlines and asks for one word per line', () => {
    const p = tonePrompt(['Foo acquired by Bar', 'Layoffs at Baz'])
    expect(p).toContain('1. Foo acquired by Bar')
    expect(p).toContain('2. Layoffs at Baz')
    expect(p).toContain('one word per line')
    expect(p).toContain('TOWARD THE COVERED COMPANY')
  })
  it('draftPrompt carries kind/channel/title/notes and language', () => {
    const p = draftPrompt({ itemKind: 'release', channel: 'press', title: 'New tool', notes: 'launch in March', lang: 'fr' })
    expect(p).toContain('Canadian French')
    expect(p).toContain('Type: release')
    expect(p).toContain('Channel: press')
    expect(p).toContain('Notes to work from: launch in March')
  })
  it('draftPrompt shortens for social posts', () => {
    const p = draftPrompt({ itemKind: 'post', channel: 'linkedin', title: 'Hi', notes: '', lang: 'en' })
    expect(p).toContain('under 60 words')
  })
  it('clustersPrompt numbers items and fixes the output format', () => {
    const p = clustersPrompt([
      { title: 'Dutiva launches toolkit', source: 'BetaKit' },
      { title: 'Compliance roundup', source: '' },
    ])
    expect(p).toContain('1. Dutiva launches toolkit — BetaKit')
    expect(p).toContain('2. Compliance roundup')
    expect(p).toContain('Theme name | 1,3,5')
  })
  it('summaryPrompt pins the model to the given numbers only', () => {
    const p = summaryPrompt('{"coverage":{"total":4}}', 'October 2026', 'fr')
    expect(p).toContain('ONLY the numbers')
    expect(p).toContain('October 2026')
    expect(p).toContain('Canadian French')
  })
  it('promptsPrompt carries tracked questions and campaign context', () => {
    const p = promptsPrompt({
      campaigns: ['Fall launch'],
      existing: ['What is Dutiva?'],
      lang: 'en',
    })
    expect(p).toContain('Fall launch')
    expect(p).toContain('What is Dutiva?')
    expect(p).toContain('3 lines')
  })
})

describe('parseClusters', () => {
  const items = 5
  it('parses theme lines into indices', () => {
    expect(parseClusters('Product news | 1,3\nCriticism | 2', items)).toEqual([
      { theme: 'Product news', indices: [0, 2] },
      { theme: 'Criticism', indices: [1] },
    ])
  })
  it('strips bullets and numbering from theme names', () => {
    expect(parseClusters('- Product news | 1\n2. Industry | 2', items)).toEqual([
      { theme: 'Product news', indices: [0] },
      { theme: 'Industry', indices: [1] },
    ])
  })
  it('drops out-of-range and non-numeric indices', () => {
    expect(parseClusters('News | 1,9,abc,2', items)).toEqual([
      { theme: 'News', indices: [0, 1] },
    ])
    expect(parseClusters('News | 9', items)).toEqual([])
  })
  it('ignores lines without a bar and caps at four themes', () => {
    const raw = 'preamble\nA | 1\nB | 2\nC | 3\nD | 4\nE | 5'
    const out = parseClusters(raw, items)
    expect(out).toHaveLength(4)
    expect(out[0]).toEqual({ theme: 'A', indices: [0] })
  })
  it('dedupes indices within a theme', () => {
    expect(parseClusters('News | 1 1,1', items)).toEqual([{ theme: 'News', indices: [0] }])
  })
})

describe('parsePromptList', () => {
  it('strips numbering and quotes', () => {
    expect(parsePromptList('1. Best HR software in Canada?\n- "Alternatives to BambooHR"', [])).toEqual([
      'Best HR software in Canada?',
      'Alternatives to BambooHR',
    ])
  })
  it('dedupes against existing prompts case-insensitively', () => {
    expect(
      parsePromptList('What is Dutiva?\nHR tools for Ontario employers', ['what is dutiva?']),
    ).toEqual(['HR tools for Ontario employers'])
  })
  it('rejects fragments and overlong lines, caps at max', () => {
    const long = 'x'.repeat(400)
    expect(parsePromptList(`short\nok line here\n${long}\nanother good line\nfourth one here`, [], 3)).toEqual([
      'ok line here',
      'another good line',
      'fourth one here',
    ])
  })
  it('returns empty for unusable replies', () => {
    expect(parsePromptList('n/a\nok\n\n', [])).toEqual([])
  })
})
