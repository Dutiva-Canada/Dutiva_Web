import { describe, expect, it } from 'vitest'
import {
  evaluateFormula,
  formulaDepth,
  formulaNodeCount,
  formulaRefs,
  type FormulaExpr,
} from './formula'

const num = (value: number): FormulaExpr => ({ op: 'num', value })
const ref = (key: string): FormulaExpr => ({ op: 'ref', key })

describe('evaluateFormula', () => {
  it('evaluates literals and input refs', () => {
    expect(evaluateFormula(num(7), {})).toBe(7)
    expect(evaluateFormula(ref('rate'), { rate: 20 })).toBe(20)
  })

  it('returns NaN for a ref with no input value', () => {
    expect(evaluateFormula(ref('missing'), {})).toBeNaN()
  })

  it('evaluates arithmetic chains', () => {
    const expr: FormulaExpr = {
      op: 'mul',
      args: [
        { op: 'add', args: [ref('a'), num(2)] },
        num(3),
      ],
    }
    expect(evaluateFormula(expr, { a: 4 })).toBe(18)
  })

  it('evaluates sub/div/pow', () => {
    expect(evaluateFormula({ op: 'sub', args: [num(9), num(4)] }, {})).toBe(5)
    expect(evaluateFormula({ op: 'div', args: [num(9), num(2)] }, {})).toBe(4.5)
    expect(evaluateFormula({ op: 'pow', args: [num(3), num(2)] }, {})).toBe(9)
  })

  it('returns NaN on divide by zero and non-finite results', () => {
    expect(evaluateFormula({ op: 'div', args: [num(1), num(0)] }, {})).toBeNaN()
    expect(evaluateFormula({ op: 'pow', args: [num(-1), num(0.5)] }, {})).toBeNaN()
  })

  it('evaluates min/max/clamp and unary ops', () => {
    expect(evaluateFormula({ op: 'min', args: [num(3), num(8)] }, {})).toBe(3)
    expect(evaluateFormula({ op: 'max', args: [num(0), ref('h')] }, { h: 6 })).toBe(6)
    expect(
      evaluateFormula({ op: 'clamp', value: num(15), min: num(0), max: num(8) }, {}),
    ).toBe(8)
    expect(evaluateFormula({ op: 'abs', arg: num(-4) }, {})).toBe(4)
    expect(evaluateFormula({ op: 'floor', arg: num(3.7) }, {})).toBe(3)
    expect(evaluateFormula({ op: 'ceil', arg: num(3.2) }, {})).toBe(4)
    expect(evaluateFormula({ op: 'round', arg: num(3.5) }, {})).toBe(4)
  })

  it('evaluates comparisons and boolean ops as 1/0', () => {
    const hours = ref('hours')
    expect(evaluateFormula({ op: 'gt', args: [hours, num(44)] }, { hours: 50 })).toBe(1)
    expect(evaluateFormula({ op: 'lte', args: [hours, num(44)] }, { hours: 50 })).toBe(0)
    expect(evaluateFormula({ op: 'eq', args: [num(2), num(2)] }, {})).toBe(1)
    expect(evaluateFormula({ op: 'neq', args: [num(2), num(2)] }, {})).toBe(0)
    expect(
      evaluateFormula({ op: 'and', args: [{ op: 'gt', args: [num(5), num(1)] }, num(1)] }, {}),
    ).toBe(1)
    expect(evaluateFormula({ op: 'or', args: [num(0), num(0)] }, {})).toBe(0)
    expect(evaluateFormula({ op: 'not', arg: num(0) }, {})).toBe(1)
  })

  it('evaluates if/cond lazily — the dead branch never runs', () => {
    /* if(divisor > 0, 10/divisor, 0) with divisor = 0 must return 0, not NaN. */
    const expr: FormulaExpr = {
      op: 'if',
      cond: { op: 'gt', args: [ref('divisor'), num(0)] },
      then: { op: 'div', args: [num(10), ref('divisor')] },
      else: num(0),
    }
    expect(evaluateFormula(expr, { divisor: 0 })).toBe(0)
    expect(evaluateFormula(expr, { divisor: 5 })).toBe(2)
  })

  it('computes the ESA termination-pay formula end to end', () => {
    /* (salary / 52) × min(floor(years), 8): 3 yrs × $60k → $3,461.54 */
    const esa: FormulaExpr = {
      op: 'mul',
      args: [
        { op: 'div', args: [ref('salary'), num(52)] },
        {
          op: 'min',
          args: [{ op: 'floor', arg: ref('years') }, num(8)],
        },
      ],
    }
    expect(evaluateFormula(esa, { salary: 60000, years: 3 })).toBeCloseTo(3461.54, 2)
    /* The eight-week cap binds at 9+ years. */
    expect(evaluateFormula(esa, { salary: 60000, years: 12 })).toBeCloseTo(9230.77, 2)
  })

  it('computes the Ontario overtime formula end to end', () => {
    /* max(0, hours − 44) × rate × 1.5: 50 h × $20 → $180 */
    const ot: FormulaExpr = {
      op: 'mul',
      args: [
        { op: 'max', args: [num(0), { op: 'sub', args: [ref('hours'), num(44)] }] },
        ref('rate'),
        num(1.5),
      ],
    }
    expect(evaluateFormula(ot, { hours: 50, rate: 20 })).toBe(180)
    expect(evaluateFormula(ot, { hours: 40, rate: 20 })).toBe(0)
  })
})

describe('formula introspection', () => {
  const tree: FormulaExpr = {
    op: 'mul',
    args: [
      { op: 'div', args: [ref('salary'), num(52)] },
      { op: 'min', args: [{ op: 'floor', arg: ref('years') }, num(8)] },
    ],
  }

  it('counts nodes and depth', () => {
    expect(formulaNodeCount(tree)).toBe(8)
    expect(formulaDepth(tree)).toBe(4)
    expect(formulaNodeCount(num(1))).toBe(1)
    expect(formulaDepth(num(1))).toBe(1)
  })

  it('collects the referenced input keys', () => {
    expect([...formulaRefs(tree)].sort()).toEqual(['salary', 'years'])
  })
})
