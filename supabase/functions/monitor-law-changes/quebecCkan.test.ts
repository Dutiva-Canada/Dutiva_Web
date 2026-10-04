import { describe, expect, it } from 'vitest'
import {
  assessQuebecPackage,
  diffStatuteSections,
  parseStatuteStatus,
  parseStatuteXml,
  quebecFingerprint,
  sectionFingerprint,
} from './quebecCkan'

/**
 * A trimmed but real-shaped response, matching a live fetch of
 * https://www.donneesquebec.ca/recherche/api/3/action/package_show
 *   ?id=c8433300-f752-4815-8ea2-69cad416dd80
 * on 2026-08-05 ("Lois et règlements codifiés du Québec"), fetched twice
 * independently and byte-stable both times.
 */
const PACKAGE_RESPONSE = JSON.stringify({
  success: true,
  result: {
    id: 'c8433300-f752-4815-8ea2-69cad416dd80',
    title: 'Lois et règlements codifiés du Québec',
    resources: [
      {
        id: '8d24d604-97f5-441b-93ba-f58743726514',
        name: 'Lois',
        format: 'XML',
        last_modified: '2026-07-20T13:29:10.040764',
        url: 'https://www.donneesquebec.ca/recherche/dataset/c8433300-f752-4815-8ea2-69cad416dd80/resource/8d24d604-97f5-441b-93ba-f58743726514/download/20260720_lois.zip',
      },
      {
        id: 'afb1cbe8-0e82-4262-aff6-f4186cf83686',
        name: 'Reglements',
        format: 'XML',
        last_modified: '2026-07-20T13:29:13.130723',
        url: 'https://www.donneesquebec.ca/recherche/dataset/c8433300-f752-4815-8ea2-69cad416dd80/resource/afb1cbe8-0e82-4262-aff6-f4186cf83686/download/20260720_reglements.zip',
      },
    ],
  },
})

describe('assessQuebecPackage', () => {
  it('finds the named resource and reads its last_modified', () => {
    const verdict = assessQuebecPackage(PACKAGE_RESPONSE, 'Lois')
    expect(verdict.ok).toBe(true)
    if (!verdict.ok) throw new Error('expected acceptance')
    expect(verdict.facts.lastModified).toBe('2026-07-20T13:29:10.040764')
    expect(verdict.facts.url).toContain('20260720_lois.zip')
  })

  it('refuses invalid JSON', () => {
    const verdict = assessQuebecPackage('Just a moment...', 'Lois')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('invalid-json')
  })

  it('refuses a response that does not report success', () => {
    const verdict = assessQuebecPackage(JSON.stringify({ success: false }), 'Lois')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('api-error')
  })

  it('treats a zero-resource result as an outage, not "no change"', () => {
    const empty = JSON.stringify({ success: true, result: { resources: [] } })
    const verdict = assessQuebecPackage(empty, 'Lois')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('no-resources')
  })

  it('reports a renamed/missing resource rather than silently tracking a different one', () => {
    const verdict = assessQuebecPackage(PACKAGE_RESPONSE, 'Statutes')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('resource-missing')
    expect(verdict.detail).toContain('Statutes')
  })
})

describe('quebecFingerprint', () => {
  it('is prefixed so the column is self-describing', () => {
    const verdict = assessQuebecPackage(PACKAGE_RESPONSE, 'Lois')
    if (!verdict.ok) throw new Error('expected acceptance')
    expect(quebecFingerprint(verdict.facts)).toMatch(/^quebec-ckan:/)
  })

  it('changes when last_modified changes', () => {
    const before = assessQuebecPackage(PACKAGE_RESPONSE, 'Lois')
    if (!before.ok) throw new Error('expected acceptance')

    const bumped = JSON.parse(PACKAGE_RESPONSE)
    bumped.result.resources[0].last_modified = '2026-08-04T00:00:00.000000'
    bumped.result.resources[0].url = bumped.result.resources[0].url.replace('20260720', '20260804')
    const after = assessQuebecPackage(JSON.stringify(bumped), 'Lois')
    if (!after.ok) throw new Error('expected acceptance')

    expect(quebecFingerprint(before.facts)).not.toBe(quebecFingerprint(after.facts))
  })
})

describe('parseStatuteStatus', () => {
  const MANIFEST = [
    '"A-1", "Repealed on 15 November 2000", "A", "20001115"',
    '"C-12", "Updated to 10 June 2026", "J", "20260610"',
    '"N-1.1", "Updated to 10 June 2026", "J", "20260610"',
    '"A-6.001", "Updated to 30 June 2026", "J", "20260630"',
  ].join('\n')

  it('reads each Act\'s own consolidation stamp', () => {
    const map = parseStatuteStatus(MANIFEST)
    expect(map.get('N-1.1')?.ymd).toBe('20260610')
    expect(map.get('C-12')?.flag).toBe('J')
    /* Repealed Acts keep their repeal date — the flag, not the date,
       is what says "gone". */
    expect(map.get('A-1')?.flag).toBe('A')
    /* A per-Act date means the corpus can move for one law without
       touching the other. */
    expect(map.get('A-6.001')?.ymd).toBe('20260630')
  })

  it('yields nothing usable from an HTML error page', () => {
    expect(parseStatuteStatus('<html>Just a moment</html>').size).toBe(0)
  })
})

describe('parseStatuteXml', () => {
  const XML = `<?xml version="1.0"?>
<LegislativeDocument xml:lang="en" date-eev="20251028" DocumentType="cs">
  <Statute>
    <Identification Code="id"><Id>N-1.1</Id>
      <LongTitle Code="id-lt">Act respecting labour standards</LongTitle>
    </Identification>
    <Body>
      <Section Code="se:1" date-eev="19990401">
        <Label style="P">1</Label>
        <Subsection Code="se:1-ss:1"><Text>Purpose text.</Text></Subsection>
        <HistoricalNote><Ref><RefFreeForm>1979, c. 45, s. 1</RefFreeForm></Ref></HistoricalNote>
      </Section>
      <Section Code="se:3_1" date-eev="20251028">
        <Label style="P">3.1</Label>
        <Subsection Code="se:3_1-ss:1"><Text>Scope text.</Text></Subsection>
        <HistoricalNote>
          <Ref><RefFreeForm>1982, c. 12, s. 1</RefFreeForm></Ref>
          <Ref activateHyperlink="true"><RefFreeForm>2025, c. 9, s. 2</RefFreeForm></Ref>
        </HistoricalNote>
      </Section>
      <Section Code="se:40" date-eev="19800101">
        <Label style="P">40</Label>
        <Subsection Code="se:40-ss:1"><Text>Wages.</Text></Subsection>
      </Section>
    </Body>
    <Schedule Code="sc-nb:1" date-eev="19990401">
      <ScheduleHeading><Label>SCHEDULE I</Label></ScheduleHeading>
      <HistoricalNote><Ref><RefFreeForm>1979, c. 45, Schedule I</RefFreeForm></Ref></HistoricalNote>
    </Schedule>
  </Statute>
</LegislativeDocument>`

  it('reads per-section in-force dates and the latest amending instrument', () => {
    const facts = parseStatuteXml(XML)
    expect(facts.docEev).toBe('20251028')
    expect(facts.title).toBe('Act respecting labour standards')
    expect(facts.sections).toHaveLength(4)
    const s31 = facts.sections.find((s) => s.number === '3.1')
    expect(s31?.eev).toBe('20251028')
    /* The last HistoricalNote ref is the most recent amendment — '2025, c. 9'
       rather than the 1982 original. */
    expect(s31?.latestRef).toBe('2025, c. 9, s. 2')
  })

  it('labels schedules and tolerates a missing HistoricalNote', () => {
    const facts = parseStatuteXml(XML)
    expect(facts.sections.map((s) => s.number)).toContain('SCHEDULE I')
    expect(facts.sections.find((s) => s.number === '40')?.latestRef).toBeNull()
  })
})

describe('sectionFingerprint + diffStatuteSections', () => {
  const before = [
    { number: '1', eev: '19990401', latestRef: null },
    { number: '3.1', eev: '20180601', latestRef: '2018, c. 21' },
    { number: '40', eev: '19800101', latestRef: null },
  ]

  it('stays identical under a cosmetic republish of the same provisions', () => {
    const reordered = [...before].reverse()
    expect(sectionFingerprint(reordered)).toBe(sectionFingerprint(before))
  })

  it('moves only when a provision in-force date does', () => {
    const after = before.map((s) => (s.number === '3.1' ? { ...s, eev: '20251028' } : s))
    expect(sectionFingerprint(after)).not.toBe(sectionFingerprint(before))
  })

  it('names amended, added and removed provisions', () => {
    const after = [
      { number: '1', eev: '19990401', latestRef: null },
      { number: '3.1', eev: '20251028', latestRef: '2025, c. 9, s. 2' },
      { number: '81.1', eev: '20251028', latestRef: '2025, c. 9, s. 4' },
    ]
    const diff = diffStatuteSections(before, after)
    expect(diff.amended.map((s) => s.number)).toEqual(['3.1'])
    expect(diff.added.map((s) => s.number)).toEqual(['81.1'])
    expect(diff.removedNumbers).toEqual(['40'])
  })

  it('a null baseline diffs as all-added — the caller must not print that as a change list', () => {
    const diff = diffStatuteSections(null, before)
    expect(diff.added).toHaveLength(3)
    expect(diff.amended).toHaveLength(0)
  })
})
