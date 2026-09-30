import { describe, expect, it } from 'vitest'
import { attributeCites, expandSection } from './statuteDrift'

describe('expandSection', () => {
  it('returns endpoints for ranges and the single section otherwise', () => {
    expect(expandSection('63-64')).toEqual(['63', '64'])
    expect(expandSection('169-174')).toEqual(['169', '174'])
    expect(expandSection('49.7')).toEqual(['49.7'])
    expect(expandSection(null)).toEqual([])
  })
})

describe('attributeCites', () => {
  it('attributes a section to the act named before it', () => {
    const out = attributeCites('Canada Labour Code s.240; verified 2026-07-29.')
    expect(out).toEqual([
      expect.objectContaining({ act: 'Canada Labour Code', sections: ['240'] }),
    ])
  })

  it('keeps the regulator cite separate from the act cite', () => {
    const out = attributeCites(
      'Canada Labour Code s.252(2), s.253.2(3); Canada Labour Standards Regulations s.24; verified.',
    )
    const clc = out.find((o) => o.act === 'Canada Labour Code')
    const clsr = out.find((o) => o.act === 'Canada Labour Standards Regulations')
    expect(clc?.sections).toEqual(['252', '253.2'])
    expect(clsr?.sections).toEqual(['24'])
  })

  it('captures both endpoints of a range', () => {
    const out = attributeCites('Employment Standards Act, 2000, ss. 17–20 (Part VII).')
    expect(out[0]?.sections).toEqual(['17', '20'])
  })

  it('attributes O. Reg. cites to the regulation, not the ESA', () => {
    const out = attributeCites(
      'Employment Standards Act, 2000: s. 54; O. Reg. 288/01 s. 2(1) and s. 3.',
    )
    const reg = out.find((o) => o.act === 'O. Reg. 288/01')
    expect(reg?.sections).toEqual(['2', '3'])
    const esa = out.find((o) => o.act === 'Employment Standards Act')
    expect(esa?.sections).toEqual(['54'])
  })

  it('leaves cites before any act name unattributed', () => {
    const out = attributeCites('see s. 12 for the old rule; Canada Labour Code s. 240 applies.')
    expect(out.find((o) => o.act === '')?.sections).toEqual(['12'])
    expect(out.find((o) => o.act === 'Canada Labour Code')?.sections).toEqual(['240'])
  })

  it('handles QC regulation cite N-1.1, r.6 s.2', () => {
    const out = attributeCites('3-year retention under N-1.1, r.6 s.2, cross-checked.')
    expect(out.find((o) => o.act === 'N-1.1, r. 6')?.sections).toEqual(['2'])
  })

  it('handles LNT shorthand and art. cites', () => {
    const out = attributeCites('LNT ss.82-84; CNESST pages read via browser.')
    expect(out[0]?.sections).toEqual(['82', '84'])
  })
})
