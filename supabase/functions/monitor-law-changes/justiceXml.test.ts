import { describe, expect, it } from 'vitest'
import { amendmentFingerprint, assessJusticeStatute, parseJusticeStatuteHead } from './justiceXml'

/**
 * The fixtures below are the real opening bytes of the two federal Acts we
 * monitor, captured from raw.githubusercontent.com on 2026-07-30 — including
 * the leading byte-order mark, which the live files carry and a hand-written
 * fixture would have quietly omitted.
 */

/** Canada Labour Code, first ~1.4 KB of eng/acts/L-2.xml. */
const L2_HEAD =
  '﻿<?xml version="1.0" encoding="utf-8"?><Statute lims:pit-date="2025-12-12" ' +
  'hasPreviousVersion="true" lims:lastAmendedDate="2025-12-12" lims:current-date="2025-12-29" ' +
  'lims:inforce-start-date="2018-12-13" lims:fid="339470" lims:id="339470" bill-origin="commons" ' +
  'bill-type="govt-public" in-force="yes" xml:lang="en" xmlns:lims="http://justice.gc.ca/lims">' +
  '<Identification lims:inforce-start-date="2018-12-13" lims:fid="339471" lims:id="339471">' +
  '<LongTitle lims:inforce-start-date="2018-12-13" lims:fid="339472" lims:id="339472">' +
  'An Act to consolidate certain statutes respecting labour</LongTitle>' +
  '<ShortTitle lims:inforce-start-date="2018-12-13" lims:fid="339473" lims:id="339473" ' +
  'status="official">Canada Labour Code</ShortTitle>' +
  '<RunningHead lims:inforce-start-date="2018-12-13" lims:fid="339474" lims:id="339474">' +
  'Labour Code, Canada</RunningHead>' +
  '<Chapter lims:inforce-start-date="2018-12-13" lims:fid="339477" lims:id="339477">' +
  '<ConsolidatedNumber official="yes">L-2</ConsolidatedNumber></Chapter></Identification>' +
  '<Body><Section lims:inforce-start-date="2003-01-01" lims:lastAmendedDate="2003-01-01" ' +
  'lims:fid="339480"><Label>1</Label><Text>This Act may be cited as the Canada Labour Code' +
  '</Text></Section></Body></Statute>'

/** Canadian Human Rights Act, first ~900 bytes of eng/acts/H-6.xml. */
const H6_HEAD =
  '﻿<?xml version="1.0" encoding="utf-8"?><Statute lims:pit-date="2024-08-19" ' +
  'hasPreviousVersion="true" lims:lastAmendedDate="2024-08-19" lims:current-date="2026-05-26" ' +
  'lims:inforce-start-date="2002-12-31" lims:fid="256781" lims:id="256781" bill-origin="commons" ' +
  'bill-type="govt-public" in-force="yes" xml:lang="en" xmlns:lims="http://justice.gc.ca/lims">' +
  '<Identification lims:inforce-start-date="2002-12-31" lims:fid="256782" lims:id="256782">' +
  '<LongTitle>An Act to extend the laws in Canada that proscribe discrimination</LongTitle>' +
  '<ShortTitle lims:fid="256784" status="official">Canadian Human Rights Act</ShortTitle>' +
  '<RunningHead>Canadian Human Rights</RunningHead>' +
  '<Chapter><ConsolidatedNumber official="yes">H-6</ConsolidatedNumber></Chapter>' +
  '</Identification>'

describe('parseJusticeStatuteHead', () => {
  it('reads the Canada Labour Code head', () => {
    expect(parseJusticeStatuteHead(L2_HEAD)).toEqual({
      lastAmendedDate: '2025-12-12',
      currentDate: '2025-12-29',
      consolidatedNumber: 'L-2',
      shortTitle: 'Canada Labour Code',
    })
  })

  it('reads the Canadian Human Rights Act head from a truncated Range response', () => {
    /* H6_HEAD stops mid-document, as a Range request does. Everything we need
       sits in <Identification>, so a partial body must still parse. */
    const facts = parseJusticeStatuteHead(H6_HEAD)
    expect(facts?.lastAmendedDate).toBe('2024-08-19')
    expect(facts?.consolidatedNumber).toBe('H-6')
    expect(facts?.shortTitle).toBe('Canadian Human Rights Act')
  })

  it("takes the Act's amendment date, not a section's", () => {
    /* L-2's body carries lims:lastAmendedDate="2003-01-01" on a Section. A
       first-match-anywhere regex would return that instead of 2025-12-12 —
       the Act would look frozen in 2003 and no amendment would ever register. */
    expect(L2_HEAD).toContain('lims:lastAmendedDate="2003-01-01"')
    expect(parseJusticeStatuteHead(L2_HEAD)?.lastAmendedDate).toBe('2025-12-12')
  })

  it('tolerates the leading byte-order mark the live files carry', () => {
    expect(L2_HEAD.startsWith('﻿')).toBe(true)
    expect(parseJusticeStatuteHead(L2_HEAD)).not.toBeNull()
  })

  it('returns null for anything that is not a statute document', () => {
    expect(parseJusticeStatuteHead('')).toBeNull()
    expect(parseJusticeStatuteHead('<html><body>404: Not Found</body></html>')).toBeNull()
    expect(parseJusticeStatuteHead('Just a moment...')).toBeNull()
  })

  it('returns null when the root carries no amendment date', () => {
    expect(parseJusticeStatuteHead('<Statute lims:fid="1"><Identification/></Statute>')).toBeNull()
  })
})

describe('assessJusticeStatute', () => {
  it('accepts the Act it was asked for', () => {
    const verdict = assessJusticeStatute(L2_HEAD, 'L-2')
    expect(verdict.ok).toBe(true)
    if (!verdict.ok) throw new Error('expected acceptance')
    expect(verdict.facts.lastAmendedDate).toBe('2025-12-12')
  })

  it('refuses a different Act served from the expected URL', () => {
    /* The Saskatchewan fallback in this monitor pointed at a 2015 Gazette
       issue rather than the Employment Act, and nothing noticed because
       nothing checked identity. This is that check. */
    const verdict = assessJusticeStatute(L2_HEAD, 'H-6')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('wrong-act')
    expect(verdict.detail).toContain('L-2')
    expect(verdict.detail).toContain('Canada Labour Code')
  })

  it('compares consolidated numbers case-insensitively', () => {
    expect(assessJusticeStatute(L2_HEAD, 'l-2').ok).toBe(true)
  })

  it('accepts a document with no consolidated number rather than failing closed', () => {
    /* The root amendment date is the load-bearing value; refusing over a
       missing optional field would reject a correct document. */
    const noNumber = '<Statute lims:lastAmendedDate="2025-01-01"><Identification/></Statute>'
    expect(assessJusticeStatute(noNumber, 'L-2').ok).toBe(true)
  })

  it('reports an error page as unparsable, not as a wrong Act', () => {
    const verdict = assessJusticeStatute('<html>404: Not Found</html>', 'L-2')
    expect(verdict.ok).toBe(false)
    if (verdict.ok) throw new Error('expected refusal')
    expect(verdict.reason).toBe('unparsable')
  })
})

describe('amendmentFingerprint', () => {
  it('prefixes the date so the column is self-describing', () => {
    expect(amendmentFingerprint('2025-12-12')).toBe('amended:2025-12-12')
  })

  it('changes only when the amendment date changes', () => {
    expect(amendmentFingerprint('2025-12-12')).toBe(amendmentFingerprint('2025-12-12'))
    expect(amendmentFingerprint('2025-12-12')).not.toBe(amendmentFingerprint('2026-01-05'))
  })

  it('cannot collide with the SHA-256 fingerprints used for HTML sources', () => {
    expect(amendmentFingerprint('2025-12-12')).not.toMatch(/^[0-9a-f]{64}$/)
  })
})
