import { describe, expect, it } from 'vitest'
import { phrasesFromMemoryUsed, segmentTextByMemoryPhrases } from './memoryHighlights'

describe('segmentTextByMemoryPhrases', () => {
  it('returns plain text when no phrases match', () => {
    expect(
      segmentTextByMemoryPhrases('Hello there', [
        { id: '1', phrase: 'started March 2018', title: 't' },
      ]),
    ).toEqual([{ text: 'Hello there' }])
  })

  it('highlights the longest matching phrase first', () => {
    const text = 'No enforceable termination clause applies here.'
    const segs = segmentTextByMemoryPhrases(text, [
      { id: 'a', phrase: 'termination clause', title: 'short' },
      { id: 'b', phrase: 'no enforceable termination clause', title: 'long' },
    ])
    expect(segs).toEqual([
      {
        text: 'No enforceable termination clause',
        factId: 'b',
        title: 'long',
      },
      { text: ' applies here.' },
    ])
  })

  it('skips phrases shorter than the minimum', () => {
    expect(
      segmentTextByMemoryPhrases('Yes short ok', [{ id: '1', phrase: 'short', title: 't' }]),
    ).toEqual([{ text: 'Yes short ok' }])
  })
})

describe('phrasesFromMemoryUsed', () => {
  it('maps labels for the active language', () => {
    const phrases = phrasesFromMemoryUsed(
      {
        items: [
          {
            factId: 'f1',
            label: { en: 'Started March 2018', fr: 'Début en mars 2018' },
          },
        ],
      },
      'fr',
    )
    expect(phrases).toEqual([
      { id: 'f1', phrase: 'Début en mars 2018', title: 'Début en mars 2018' },
    ])
  })
})
