import { z } from 'zod'

/**
 * Declarative calculator expressions — the safety boundary for "the model
 * supplies a formula". A formula is data, not code: a JSON tree of
 * whitelisted operators evaluated by this fixed interpreter. There is no
 * string form, so nothing here can become `eval`, a fetch, or a DOM write.
 *
 * Shape (examples):
 *   { "op": "mul", "args": [{ "op": "ref", "key": "rate" }, { "op": "num", "value": 1.5 }] }
 *   { "op": "if", "cond": { "op": "gte", "args": [h, 44] }, "then": ot, "else": 0 }
 *
 * Everything evaluates to a number; comparisons and booleans are 1/0. An
 * operation that can't produce a finite number (divide by zero, missing
 * input, overflow) yields NaN, which the widget renders as "—".
 */
export type FormulaExpr =
  | { readonly op: 'num'; readonly value: number }
  | { readonly op: 'ref'; readonly key: string }
  | { readonly op: 'add' | 'mul' | 'min' | 'max' | 'and' | 'or'; readonly args: readonly FormulaExpr[] }
  | { readonly op: 'sub' | 'div' | 'pow' | 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'; readonly args: readonly [FormulaExpr, FormulaExpr] }
  | { readonly op: 'abs' | 'round' | 'floor' | 'ceil' | 'not'; readonly arg: FormulaExpr }
  | { readonly op: 'clamp'; readonly value: FormulaExpr; readonly min: FormulaExpr; readonly max: FormulaExpr }
  | { readonly op: 'if'; readonly cond: FormulaExpr; readonly then: FormulaExpr; readonly else: FormulaExpr }

const INPUT_KEY = /^[a-zA-Z][a-zA-Z0-9_]{0,30}$/

/** Caps that keep a hostile or runaway spec cheap to validate and evaluate. */
export const FORMULA_MAX_DEPTH = 16
export const FORMULA_MAX_NODES = 128
export const FORMULA_MAX_ARGS = 8

export const formulaExprSchema: z.ZodType<FormulaExpr> = z.lazy(() =>
  z.discriminatedUnion('op', [
    z.strictObject({ op: z.literal('num'), value: z.number().finite() }),
    z.strictObject({ op: z.literal('ref'), key: z.string().regex(INPUT_KEY) }),
    z.strictObject({
      op: z.enum(['add', 'mul', 'min', 'max', 'and', 'or']),
      args: z.array(formulaExprSchema).min(1).max(FORMULA_MAX_ARGS),
    }),
    z.strictObject({
      op: z.enum(['sub', 'div', 'pow', 'gt', 'gte', 'lt', 'lte', 'eq', 'neq']),
      args: z.tuple([formulaExprSchema, formulaExprSchema]),
    }),
    z.strictObject({
      op: z.enum(['abs', 'round', 'floor', 'ceil', 'not']),
      arg: formulaExprSchema,
    }),
    z.strictObject({
      op: z.literal('clamp'),
      value: formulaExprSchema,
      min: formulaExprSchema,
      max: formulaExprSchema,
    }),
    z.strictObject({
      op: z.literal('if'),
      cond: formulaExprSchema,
      then: formulaExprSchema,
      else: formulaExprSchema,
    }),
  ]),
)

function childrenOf(expr: FormulaExpr): readonly FormulaExpr[] {
  switch (expr.op) {
    case 'num':
      return []
    case 'ref':
      return []
    case 'abs':
    case 'round':
    case 'floor':
    case 'ceil':
    case 'not':
      return [expr.arg]
    case 'clamp':
      return [expr.value, expr.min, expr.max]
    case 'if':
      return [expr.cond, expr.then, expr.else]
    default:
      return expr.args
  }
}

/** Depth of the deepest node; a lone leaf is depth 1. */
export function formulaDepth(expr: FormulaExpr): number {
  const children = childrenOf(expr)
  if (children.length === 0) return 1
  return 1 + Math.max(...children.map(formulaDepth))
}

export function formulaNodeCount(expr: FormulaExpr): number {
  return 1 + childrenOf(expr).reduce((sum, child) => sum + formulaNodeCount(child), 0)
}

/** Every input key the expression reads — used to check refs resolve to declared inputs. */
export function formulaRefs(expr: FormulaExpr): ReadonlySet<string> {
  const refs = new Set<string>()
  const walk = (node: FormulaExpr) => {
    if (node.op === 'ref') refs.add(node.key)
    for (const child of childrenOf(node)) walk(child)
  }
  walk(expr)
  return refs
}

export function evaluateFormula(expr: FormulaExpr, vars: Readonly<Record<string, number>>): number {
  switch (expr.op) {
    case 'num':
      return expr.value
    case 'ref':
      return vars[expr.key] ?? Number.NaN
    case 'add':
      return expr.args.reduce((sum, arg) => sum + evaluateFormula(arg, vars), 0)
    case 'mul':
      return expr.args.reduce((product, arg) => product * evaluateFormula(arg, vars), 1)
    case 'sub':
      return evaluateFormula(expr.args[0], vars) - evaluateFormula(expr.args[1], vars)
    case 'div': {
      const divisor = evaluateFormula(expr.args[1], vars)
      return divisor === 0 ? Number.NaN : evaluateFormula(expr.args[0], vars) / divisor
    }
    case 'pow': {
      const result = Math.pow(evaluateFormula(expr.args[0], vars), evaluateFormula(expr.args[1], vars))
      return Number.isFinite(result) ? result : Number.NaN
    }
    case 'min':
      return Math.min(...expr.args.map((arg) => evaluateFormula(arg, vars)))
    case 'max':
      return Math.max(...expr.args.map((arg) => evaluateFormula(arg, vars)))
    case 'abs':
      return Math.abs(evaluateFormula(expr.arg, vars))
    case 'round':
      return Math.round(evaluateFormula(expr.arg, vars))
    case 'floor':
      return Math.floor(evaluateFormula(expr.arg, vars))
    case 'ceil':
      return Math.ceil(evaluateFormula(expr.arg, vars))
    case 'clamp':
      return Math.min(
        Math.max(evaluateFormula(expr.value, vars), evaluateFormula(expr.min, vars)),
        evaluateFormula(expr.max, vars),
      )
    case 'if':
      /* Lazy branches — the untaken side never evaluates, so a guard like
         `if (divisor > 0, a / divisor, 0)` can't produce NaN from its dead
         branch. */
      return evaluateFormula(expr.cond, vars) !== 0
        ? evaluateFormula(expr.then, vars)
        : evaluateFormula(expr.else, vars)
    case 'gt':
      return evaluateFormula(expr.args[0], vars) > evaluateFormula(expr.args[1], vars) ? 1 : 0
    case 'gte':
      return evaluateFormula(expr.args[0], vars) >= evaluateFormula(expr.args[1], vars) ? 1 : 0
    case 'lt':
      return evaluateFormula(expr.args[0], vars) < evaluateFormula(expr.args[1], vars) ? 1 : 0
    case 'lte':
      return evaluateFormula(expr.args[0], vars) <= evaluateFormula(expr.args[1], vars) ? 1 : 0
    case 'eq':
      return evaluateFormula(expr.args[0], vars) === evaluateFormula(expr.args[1], vars) ? 1 : 0
    case 'neq':
      return evaluateFormula(expr.args[0], vars) !== evaluateFormula(expr.args[1], vars) ? 1 : 0
    case 'and':
      return expr.args.every((arg) => evaluateFormula(arg, vars) !== 0) ? 1 : 0
    case 'or':
      return expr.args.some((arg) => evaluateFormula(arg, vars) !== 0) ? 1 : 0
    case 'not':
      return evaluateFormula(expr.arg, vars) === 0 ? 1 : 0
  }
}
