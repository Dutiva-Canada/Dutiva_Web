import { describe, expect, it } from 'vitest'
import {
  assessOntarioActVersions,
  looksLikeCurrencyDate,
  ontarioFingerprintPayload,
} from './ontarioApi'

/**
 * A trimmed but real-shaped response, verified against a live fetch of
 * https://www.ontario.ca/laws/api/v2/legislation/en/act-versions/statute/00e41
 * on 2026-08-06 — current version plus one historical version.
 *
 * THE ENVELOPE DEPTH IS THE POINT. `versions.hits` is a top_hits aggregation
 * that happens to be named "hits"; its value is the Elasticsearch response
 * object `{ total, max_score, hits }`, and the documents are in *that* object's
 * `hits`. Three levels, not two.
 *
 * This fixture was hand-written with two, and so was the parser. They agreed
 * with each other, the suite passed, and in production every Ontario statute
 * came back `no-versions` — reported as an e-Laws outage rather than a bug in
 * this file. Anything claiming to mirror a live response gets checked against
 * one.
 */
const versionsEnvelope = (hits: unknown[]) => ({
  aggregations: {
    all: {
      doc_count: 45839,
      versions: {
        doc_count: hits.length,
        hits: {
          hits: {
            total: { value: hits.length, relation: 'eq' },
            max_score: null,
            hits,
          },
        },
      },
    },
  },
})

const ESA_RESPONSE = JSON.stringify(
  versionsEnvelope([
    {
      _index: 'statute_202405',
      _id: 'UlA6XIYBOKnGi1ssbkFk',
      _source: {
        act: { en: 'Employment Standards Act, 2000' },
        alias: { en: 'statute/00e41' },
        state: { en: 'current' },
        title: { en: 'Employment Standards Act, 2000, S.O. 2000, c. 41' },
        dateFrom: { en: '2026-01-01T05:00:00.000Z' },
        version: 0,
      },
    },
    {
      _index: 'statute_202405',
      _id: 'm_f-jpsBbzy_QHiqmMJG',
      _source: {
        act: { en: 'Employment Standards Act, 2000' },
        dateTo: { en: '2025-12-31T05:00:00.000Z' },
        alias: { en: 'statute/00e41/v83' },
        state: { en: 'historical' },
        title: { en: 'Employment Standards Act, 2000, S.O. 2000, c. 41' },
        dateFrom: { en: '2025-11-27T05:00:00.000Z' },
        version: 83,
      },
    },
  ]),
)

describe('assessOntarioActVersions', () => {
  it('accepts a real response and identifies the current version', () => {
    const verdict = assessOntarioActVersions(ESA_RESPONSE, 'Employment Standards Act')
    expect(verdict.ok).toBe(true)
    if (!verdict.ok) throw new Error('expected acceptance')
    expect(verdict.facts.current?.dateFrom).toBe('2026-01-01T05:00:00.000Z')
    expect(verdict.facts.versionCount).toBe(2)
  })

  it('sorts the normalized versions by version number, oldest first', () => {
    const verdict = assessOntarioActVersions(ESA_RESPONSE, 'Employment Standards Act')
    if (!verdict.ok) throw new Error('expected acceptance')
    expect(verdict.facts.normalizedVersions.map((v) => v.version)).toEqual([0, 83])
  })

  it('refuses invalid JSON', () => {
    const verdict = assessOntarioActVersions('Just a moment...', 'Employment Standards Act')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('invalid-json')
  })

  it('treats a zero-version result as an outage, not "no change"', () => {
    const verdict = assessOntarioActVersions(
      JSON.stringify(versionsEnvelope([])),
      'Employment Standards Act',
    )
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('no-versions')
  })

  it('reads through the full top_hits envelope, not the response object above it', () => {
    /* The 2026-08-06 regression, pinned: a payload one level short is what the
       parser used to read, and treating it as valid is what silently blinded
       Ontario monitoring. If someone "simplifies" the path again, this fails. */
    const oneLevelShort = JSON.stringify({
      aggregations: {
        all: {
          versions: {
            hits: {
              hits: [
                {
                  _source: {
                    act: { en: 'Employment Standards Act, 2000' },
                    state: { en: 'current' },
                    version: 0,
                  },
                },
              ],
            },
          },
        },
      },
    })
    const verdict = assessOntarioActVersions(oneLevelShort, 'Employment Standards Act')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('no-versions')
  })

  it('refuses a response with no state=current version', () => {
    const noCurrent = JSON.stringify(
      versionsEnvelope([
        {
          _source: {
            act: { en: 'Employment Standards Act, 2000' },
            state: { en: 'historical' },
            version: 0,
          },
        },
      ]),
    )
    const verdict = assessOntarioActVersions(noCurrent, 'Employment Standards Act')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('no-current-version')
  })

  it('refuses a different Act served from the expected statute id', () => {
    /* The same identity discipline justiceXml.ts applies to ConsolidatedNumber —
       a URL that starts answering for the wrong statute must be reported. */
    const verdict = assessOntarioActVersions(ESA_RESPONSE, 'Human Rights Code')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('wrong-act')
    expect(verdict.detail).toContain('Human Rights Code')
    expect(verdict.detail).toContain('Employment Standards Act, 2000')
  })

  it('compares act names case-insensitively', () => {
    expect(assessOntarioActVersions(ESA_RESPONSE, 'employment standards act').ok).toBe(true)
  })
})

describe('ontarioFingerprintPayload', () => {
  it('changes when a version is added', () => {
    const before = assessOntarioActVersions(ESA_RESPONSE, 'Employment Standards Act')
    if (!before.ok) throw new Error('expected acceptance')

    const withNewVersion = JSON.parse(ESA_RESPONSE)
    withNewVersion.aggregations.all.versions.hits.hits.hits[0]._source.dateFrom.en =
      '2027-01-01T05:00:00.000Z'
    const after = assessOntarioActVersions(
      JSON.stringify(withNewVersion),
      'Employment Standards Act',
    )
    if (!after.ok) throw new Error('expected acceptance')

    expect(ontarioFingerprintPayload(before.facts)).not.toBe(ontarioFingerprintPayload(after.facts))
  })

  it('is stable for identical input', () => {
    const verdict = assessOntarioActVersions(ESA_RESPONSE, 'Employment Standards Act')
    if (!verdict.ok) throw new Error('expected acceptance')
    expect(ontarioFingerprintPayload(verdict.facts)).toBe(ontarioFingerprintPayload(verdict.facts))
  })
})

describe('looksLikeCurrencyDate', () => {
  it('accepts the plain-text date the currency-date endpoint returns', () => {
    expect(looksLikeCurrencyDate('August 3, 2026')).toBe(true)
  })

  it('rejects a JSON or HTML error page', () => {
    expect(looksLikeCurrencyDate('{"error":"not found"}')).toBe(false)
    expect(looksLikeCurrencyDate('<html>404</html>')).toBe(false)
  })
})
