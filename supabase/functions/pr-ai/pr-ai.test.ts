import { describe, expect, it } from 'vitest'
import { cleanDraft, parseTone, parseToneList, draftPrompt, tonePrompt } from './handlers'

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
})
