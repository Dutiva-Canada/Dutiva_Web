import { describe, expect, it } from 'vitest'
import {
  ADVISOR_ADDONS,
  ADVISOR_MONTHLY_BY_PLAN,
  FREE_WORKFLOW_IDS,
  GROWTH_MODULE_FEATURES,
  PLAN_ENTITLEMENTS,
  SUPPORT_PRIORITY_RANK,
  UNLIMITED,
  canAccessWorkflow,
  getPlanEntitlements,
  getPlanLimit,
  hasCapacity,
  hasPlanFeature,
  isUnlimited,
  publicPricingUsesDifferentiatedTable,
  requiredPlanForFeature,
  requiredPlanForLimit,
  supportQueueSortRank,
} from './planEntitlements'
import {
  PLAN_COMPARISON,
  PLAN_COMPARISON_ENTITLED,
  PLAN_COMPARISON_SUPPORT,
} from './planComparison'
import { PLAN_FEATURE_GATES_ENABLED, hasPlanAccess, type PlanId } from './plans'
import {
  ADVISOR_OVERAGE_MONTHLY_REPLY_CAP,
  ADVISOR_OVERAGE_PER_REPLY_CAD,
  ADVISOR_PACK_50_PRICE_CAD,
  ADVISOR_PACK_50_REPLIES,
  ADVISOR_PACK_200_PRICE_CAD,
  ADVISOR_PACK_200_REPLIES,
} from './advisorUsage'

const PLANS: PlanId[] = ['free', 'starter', 'growth', 'pro']

describe('planEntitlements', () => {
  it('defines exact capacity for all four plans', () => {
    expect(getPlanLimit('free', 'workspaceUsers')).toBe(1)
    expect(getPlanLimit('starter', 'workspaceUsers')).toBe(2)
    expect(getPlanLimit('growth', 'workspaceUsers')).toBe(5)
    expect(getPlanLimit('pro', 'workspaceUsers')).toBe(10)

    expect(getPlanLimit('free', 'activeEmployees')).toBe(5)
    expect(getPlanLimit('starter', 'activeEmployees')).toBe(10)
    expect(getPlanLimit('growth', 'activeEmployees')).toBe(50)
    expect(getPlanLimit('pro', 'activeEmployees')).toBe(100)

    expect(getPlanLimit('free', 'activeCases')).toBe(3)
    expect(isUnlimited(getPlanLimit('starter', 'activeCases'))).toBe(true)
    expect(isUnlimited(getPlanLimit('growth', 'activeCases'))).toBe(true)
    expect(isUnlimited(getPlanLimit('pro', 'activeCases'))).toBe(true)

    expect(getPlanLimit('free', 'openTasks')).toBe(10)
    expect(isUnlimited(getPlanLimit('starter', 'openTasks'))).toBe(true)
  })

  it('defines Advisor allowances, rollover, and add-ons', () => {
    expect(ADVISOR_MONTHLY_BY_PLAN).toEqual({ free: 20, starter: 80, growth: 200, pro: 400 })
    expect(getPlanLimit('free', 'advisorRolloverMax')).toBe(0)
    expect(getPlanLimit('starter', 'advisorRolloverMax')).toBe(80)
    expect(getPlanLimit('growth', 'advisorRolloverDays')).toBe(90)
    expect(getPlanLimit('pro', 'advisorRolloverDays')).toBe(90)

    expect(hasPlanFeature('free', 'reply_packs')).toBe(false)
    expect(hasPlanFeature('starter', 'reply_packs')).toBe(true)
    expect(hasPlanFeature('free', 'metered_overage')).toBe(false)
    expect(hasPlanFeature('growth', 'metered_overage')).toBe(true)

    expect(ADVISOR_ADDONS.pack50).toEqual({
      replies: ADVISOR_PACK_50_REPLIES,
      priceCad: ADVISOR_PACK_50_PRICE_CAD,
    })
    expect(ADVISOR_ADDONS.pack200).toEqual({
      replies: ADVISOR_PACK_200_REPLIES,
      priceCad: ADVISOR_PACK_200_PRICE_CAD,
    })
    expect(ADVISOR_ADDONS.overagePerReplyCad).toBe(ADVISOR_OVERAGE_PER_REPLY_CAD)
    expect(ADVISOR_ADDONS.overageMonthlyCap).toBe(ADVISOR_OVERAGE_MONTHLY_REPLY_CAP)
  })

  it('defines document and signature limits', () => {
    expect(PLAN_ENTITLEMENTS.free.limits.savedDocuments).toBe(5)
    expect(PLAN_ENTITLEMENTS.free.limits.savedDocumentsPeriod).toBe('lifetime')
    expect(PLAN_ENTITLEMENTS.starter.limits.savedDocuments).toBe(20)
    expect(PLAN_ENTITLEMENTS.growth.limits.savedDocuments).toBe(100)
    expect(PLAN_ENTITLEMENTS.pro.limits.savedDocuments).toBe(300)
    expect(PLAN_ENTITLEMENTS.starter.limits.savedDocumentsPeriod).toBe('month')

    expect(PLAN_ENTITLEMENTS.free.limits.signatureEnvelopes).toBe(1)
    expect(PLAN_ENTITLEMENTS.starter.limits.signatureEnvelopes).toBe(5)
    expect(PLAN_ENTITLEMENTS.growth.limits.signatureEnvelopes).toBe(25)
    expect(PLAN_ENTITLEMENTS.pro.limits.signatureEnvelopes).toBe(100)
  })

  it('gates Growth modules and Advisor memory at Growth+', () => {
    for (const feature of GROWTH_MODULE_FEATURES) {
      expect(hasPlanFeature('free', feature)).toBe(false)
      expect(hasPlanFeature('starter', feature)).toBe(false)
      expect(hasPlanFeature('growth', feature)).toBe(true)
      expect(hasPlanFeature('pro', feature)).toBe(true)
      expect(requiredPlanForFeature(feature)).toBe('growth')
    }
    expect(hasPlanFeature('starter', 'word_compatible_export')).toBe(true)
    expect(hasPlanFeature('free', 'word_compatible_export')).toBe(false)
    expect(requiredPlanForFeature('word_compatible_export')).toBe('starter')
  })

  it('keeps the plan hierarchy free < starter < growth < pro', () => {
    expect(hasPlanAccess('starter', 'free')).toBe(true)
    expect(hasPlanAccess('growth', 'starter')).toBe(true)
    expect(hasPlanAccess('pro', 'growth')).toBe(true)
    expect(hasPlanAccess('free', 'starter')).toBe(false)
  })

  it('resolves capacity and required plans', () => {
    expect(hasCapacity(4, 5)).toBe(true)
    expect(hasCapacity(5, 5)).toBe(false)
    expect(hasCapacity(999, UNLIMITED)).toBe(true)
    expect(requiredPlanForLimit('activeEmployees', 50)).toBe('growth')
    expect(requiredPlanForLimit('activeEmployees', 100)).toBe('pro')
  })

  it('limits Free workflows to the three statutory-notice tools', () => {
    expect(FREE_WORKFLOW_IDS).toEqual([
      'statutory-notice-ontario',
      'statutory-notice-quebec',
      'statutory-notice-federal',
    ])
    expect(canAccessWorkflow('free', 'statutory-notice-ontario')).toBe(true)
    expect(canAccessWorkflow('free', 'duty-to-accommodate')).toBe(false)
    expect(canAccessWorkflow('starter', 'duty-to-accommodate')).toBe(true)
  })

  it('defines support and onboarding entitlements', () => {
    expect(getPlanEntitlements('free').supportPriority).toBe('standard')
    expect(getPlanEntitlements('starter').supportPriority).toBe('paid')
    expect(getPlanEntitlements('growth').supportPriority).toBe('priority')
    expect(getPlanEntitlements('pro').supportPriority).toBe('highest')
    expect(getPlanEntitlements('growth').supportResponseTarget).toBe('1_business_day')
    expect(getPlanEntitlements('starter').supportResponseTarget).toBe('2_business_days')
    expect(getPlanEntitlements('starter').onboarding).toBe('none')
    expect(getPlanEntitlements('growth').onboarding).toBe('walkthrough_on_request')
    expect(getPlanEntitlements('pro').onboarding).toBe('walkthrough_and_call')

    expect(SUPPORT_PRIORITY_RANK.highest).toBeGreaterThan(SUPPORT_PRIORITY_RANK.priority)
    expect(supportQueueSortRank('pro')).toBeLessThan(supportQueueSortRank('growth'))
    expect(supportQueueSortRank('growth')).toBeLessThan(supportQueueSortRank('starter'))
    expect(supportQueueSortRank('starter')).toBeLessThan(supportQueueSortRank('free'))
  })
})

describe('planComparison parity', () => {
  it('publishes the entitled comparison while gates are on', () => {
    expect(PLAN_FEATURE_GATES_ENABLED).toBe(true)
    expect(publicPricingUsesDifferentiatedTable()).toBe(true)
    expect(PLAN_COMPARISON).toBe(PLAN_COMPARISON_ENTITLED)
    expect(PLAN_COMPARISON).not.toBe(PLAN_COMPARISON_SUPPORT)
  })

  it('builds entitled Advisor reply cells from PLAN_ENTITLEMENTS', () => {
    const advisorRow = PLAN_COMPARISON_ENTITLED.flatMap((g) => g.rows).find(
      (r) => r.labelKey === 'pricing_row_advisor_replies',
    )
    expect(advisorRow).toBeTruthy()
    for (const plan of PLANS) {
      const cell = advisorRow!.cells[plan]
      expect(typeof cell === 'string' && cell.includes(plan)).toBe(true)
    }
  })

  it('does not claim full product in the entitled catalogue', () => {
    const labels = PLAN_COMPARISON_ENTITLED.flatMap((g) => g.rows.map((r) => r.labelKey))
    expect(labels).not.toContain('pricing_row_full_product')
  })

  it('includes the nine required entitled sections', () => {
    expect(PLAN_COMPARISON_ENTITLED.map((g) => g.headingKey)).toEqual([
      'pricing_grp_access',
      'pricing_grp_advisor',
      'pricing_grp_employees_cases',
      'pricing_grp_planning',
      'pricing_grp_documents',
      'pricing_grp_workflows',
      'pricing_grp_dashboard',
      'pricing_grp_workplace',
      'pricing_grp_support',
    ])
  })
})
