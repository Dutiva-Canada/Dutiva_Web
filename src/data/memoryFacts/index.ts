/**
 * Advisor Memory seed facts — split into subject/lifecycle sections to stay
 * under the 800-line architecture budget. Shared M() builder + type guards
 * live in ./shared.
 */
import type { MemoryFact } from '../types'
import { jordanMemoryFacts } from './jordan'
import { caseFileMemoryFacts } from './caseFiles'
import { lifecycleMemoryFacts } from './lifecycle'

export const seedMemoryFacts: MemoryFact[] = [
  ...jordanMemoryFacts,
  ...caseFileMemoryFacts,
  ...lifecycleMemoryFacts,
]
