import { describe, expect, it } from 'vitest'
import { lookupStatutoryNoticeWeeks } from '@/features/app/advisor/safety/statutoryNotice'
import { NOTICE_TENURE_BANDS, statutoryNoticeOntarioFlow } from './statutoryNoticeOntario'
import { severanceEligibilityOntarioFlow } from './severanceEligibilityOntario'
import { isOutcome } from '../flowModel'

describe('statutoryNoticeOntarioFlow', () => {
  it('registers every tenure band against the grounded ESA s.57 lookup', () => {
    for (const band of NOTICE_TENURE_BANDS) {
      expect(lookupStatutoryNoticeWeeks('ON', band.completedMonths)).toBe(band.weeks)
    }
  })

  it('names the floor weeks in each outcome title', () => {
    for (const band of NOTICE_TENURE_BANDS) {
      const outcomeId = `floor_${band.weeks}`
      const step = statutoryNoticeOntarioFlow.steps.find((s) => s.id === outcomeId)
      expect(step, outcomeId).toBeDefined()
      expect(isOutcome(step!)).toBe(true)
      expect(step!.title.en).toContain(`${band.weeks} week`)
    }
  })

  it('hands every outcome off to the termination letter template', () => {
    for (const step of statutoryNoticeOntarioFlow.steps) {
      if (!isOutcome(step)) continue
      expect(step.documents).toEqual(['T03'])
    }
  })
})

describe('severanceEligibilityOntarioFlow', () => {
  it('never states a severance week or dollar figure in outcomes', () => {
    const moneyOrWeeks = /\$[\d.,]+|\d+\s*weeks?|\d+\s*semaines?/i
    for (const step of severanceEligibilityOntarioFlow.steps) {
      if (!isOutcome(step)) continue
      /* The $2.5M threshold appears only on the employer question, not as a computed entitlement. */
      expect(step.title.en).not.toMatch(moneyOrWeeks)
      expect(step.body.en).not.toMatch(/\d+\s*weeks?\s+of\s+severance/i)
      expect(step.body.en).toMatch(/not calculated|not met|Exclusion|Not enough|may apply/i)
    }
  })

  it('keeps Option B — gate only, hand off to T03', () => {
    for (const step of severanceEligibilityOntarioFlow.steps) {
      if (!isOutcome(step)) continue
      expect(step.documents).toEqual(['T03'])
    }
  })
})
