import { describe, expect, it } from 'vitest'
import { mixdownToMono, resampleLinear } from './audio'

/**
 * The pure half of voice-note capture — decodeBlobToMono16k needs an
 * AudioContext (absent in jsdom), so the mixdown/resample math it chains is
 * pinned here directly.
 */

describe('mixdownToMono', () => {
  it('averages channels sample-by-sample', () => {
    const left = new Float32Array([1, 0, -1])
    const right = new Float32Array([0, 1, -1])
    const mono = mixdownToMono([left, right])
    expect(Array.from(mono)).toEqual([0.5, 0.5, -1])
  })

  it('passes a single channel through unchanged', () => {
    const mono = mixdownToMono([new Float32Array([0.25, -0.5])])
    expect(Array.from(mono)).toEqual([0.25, -0.5])
  })

  it('returns empty for no channels', () => {
    expect(mixdownToMono([]).length).toBe(0)
  })

  it('keeps the longest channel when lengths differ', () => {
    const mono = mixdownToMono([new Float32Array([1, 1, 1]), new Float32Array([1])])
    expect(mono.length).toBe(3)
    expect(mono[0]).toBeCloseTo(1)
    expect(mono[2]).toBeCloseTo(0.5)
  })
})

describe('resampleLinear', () => {
  it('returns a copy at the same rate', () => {
    const src = new Float32Array([0.1, 0.2])
    const out = resampleLinear(src, 16_000, 16_000)
    expect(Array.from(out)).toEqual(Array.from(src))
    expect(out).not.toBe(src)
  })

  it('halves the sample count on 2:1 downsample', () => {
    const src = new Float32Array([0, 1, 0, -1])
    const out = resampleLinear(src, 32_000, 16_000)
    expect(out.length).toBe(2)
    expect(out[0]).toBe(0)
    expect(out[1]).toBe(0)
  })

  it('interpolates intermediate points', () => {
    /* 2 samples → 4: output i maps to source position i·(from/to) =
       0, 0.5, 1, 1.5 — the last clamped to the final sample. */
    const src = new Float32Array([0, 1])
    const out = resampleLinear(src, 8_000, 16_000)
    expect(out.length).toBe(4)
    expect(out[0]).toBeCloseTo(0)
    expect(out[1]).toBeCloseTo(0.5)
    expect(out[2]).toBeCloseTo(1)
    expect(out[3]).toBeCloseTo(1)
  })

  it('handles empty input', () => {
    expect(resampleLinear(new Float32Array(0), 48_000, 16_000).length).toBe(0)
  })
})
