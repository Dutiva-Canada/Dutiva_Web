/**
 * Plan comparison tables for /pricing.
 *
 * Two catalogues:
 *   - PLAN_COMPARISON_SUPPORT — used while PLAN_FEATURE_GATES_ENABLED is false.
 *   - PLAN_COMPARISON_ENTITLED — differentiated product limits from
 *     `planEntitlements.ts`. Live while gates are on.
 *
 * `PLAN_COMPARISON` resolves to the truthful catalogue for the current flag so
 * PricingPage cannot silently advertise unenforced limits.
 */
import type { MarketingMessageKey } from '@/i18n/messages'
import type { PlanId } from './plans'
import { PLAN_FEATURE_GATES_ENABLED } from './plans'
import {
  ADVISOR_ADDONS,
  getPlanEntitlements,
  hasPlanFeature,
  isUnlimited,
  type PlanEntitlements,
  type PlanFeature,
} from './planEntitlements'

/**
 * A comparison cell:
 *   - `true`  → included (rendered as a check),
 *   - `false` → not included (rendered as a dash),
 *   - a `MarketingMessageKey` → a short qualifier ("1 business day", …).
 */
export type ComparisonCell = boolean | MarketingMessageKey

export interface ComparisonRow {
  labelKey: MarketingMessageKey
  cells: Record<PlanId, ComparisonCell>
}

export interface ComparisonGroup {
  headingKey: MarketingMessageKey
  rows: ComparisonRow[]
}

/** Quiet-beta: full product for all admitted accounts; paid = support. */
export const PLAN_COMPARISON_SUPPORT: ComparisonGroup[] = [
  {
    headingKey: 'pricing_grp_workspace',
    rows: [
      {
        labelKey: 'pricing_row_full_product',
        cells: { free: 'pricing_v_when_admitted', starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_skip_waitlist',
        cells: { free: false, starter: true, growth: true, pro: true },
      },
    ],
  },
  {
    headingKey: 'pricing_grp_support',
    rows: [
      {
        labelKey: 'pricing_row_help_centre',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_support',
        cells: {
          free: 'pricing_v_email',
          starter: 'pricing_v_email',
          growth: 'pricing_v_email',
          pro: 'pricing_v_email',
        },
      },
      {
        labelKey: 'pricing_row_initial_reply',
        cells: {
          free: 'pricing_v_2_days',
          starter: 'pricing_v_2_days',
          growth: 'pricing_v_1_day',
          pro: 'pricing_v_1_day',
        },
      },
      {
        labelKey: 'pricing_row_walkthrough',
        cells: { free: false, starter: false, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_onboarding_call',
        cells: { free: false, starter: false, growth: false, pro: true },
      },
    ],
  },
  {
    headingKey: 'pricing_grp_billing',
    rows: [
      {
        labelKey: 'pricing_row_contract',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
    ],
  },
]

function numKey(plan: PlanId, kind: string): MarketingMessageKey {
  return `pricing_v_${kind}_${plan}` as MarketingMessageKey
}

function capacityCells(
  pick: (e: PlanEntitlements) => number,
  kind: string,
): Record<PlanId, ComparisonCell> {
  const plans: PlanId[] = ['free', 'starter', 'growth', 'pro']
  const out = {} as Record<PlanId, ComparisonCell>
  for (const plan of plans) {
    const value = pick(getPlanEntitlements(plan))
    out[plan] = isUnlimited(value) ? 'pricing_v_unlimited' : numKey(plan, kind)
  }
  return out
}

function boolFeatureCells(feature: PlanFeature): Record<PlanId, ComparisonCell> {
  return {
    free: hasPlanFeature('free', feature),
    starter: hasPlanFeature('starter', feature),
    growth: hasPlanFeature('growth', feature),
    pro: hasPlanFeature('pro', feature),
  }
}

/**
 * Differentiated comparison derived from PLAN_ENTITLEMENTS. Advertise only when
 * PLAN_FEATURE_GATES_ENABLED is true and server enforcement is live.
 */
export const PLAN_COMPARISON_ENTITLED: ComparisonGroup[] = [
  {
    headingKey: 'pricing_grp_access',
    rows: [
      {
        labelKey: 'pricing_row_skip_waitlist',
        cells: { free: false, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_workspace_users',
        cells: capacityCells((e) => e.limits.workspaceUsers, 'users'),
      },
      {
        labelKey: 'pricing_row_active_employees',
        cells: capacityCells((e) => e.limits.activeEmployees, 'employees'),
      },
      {
        labelKey: 'pricing_row_active_cases',
        cells: capacityCells((e) => e.limits.activeCases, 'cases'),
      },
      {
        labelKey: 'pricing_row_open_tasks',
        cells: capacityCells((e) => e.limits.openTasks, 'tasks'),
      },
    ],
  },
  {
    headingKey: 'pricing_grp_advisor',
    rows: [
      {
        labelKey: 'pricing_row_advisor_replies',
        cells: capacityCells((e) => e.limits.advisorRepliesPerMonth, 'advisor'),
      },
      {
        labelKey: 'pricing_row_advisor_rollover',
        cells: {
          free: false,
          starter: 'pricing_v_rollover_starter',
          growth: 'pricing_v_rollover_growth',
          pro: 'pricing_v_rollover_pro',
        },
      },
      {
        labelKey: 'pricing_row_reply_packs',
        cells: boolFeatureCells('reply_packs'),
      },
      {
        labelKey: 'pricing_row_metered_overage',
        cells: boolFeatureCells('metered_overage'),
      },
      {
        labelKey: 'pricing_row_advisor_memory',
        cells: boolFeatureCells('advisor_cross_record_memory'),
      },
    ],
  },
  {
    headingKey: 'pricing_grp_employees_cases',
    rows: [
      {
        labelKey: 'pricing_row_employee_profiles',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_employee_notes',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_leave_records',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_expiry_tracking',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_hr_cases',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_case_notes',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_tasks',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_calendar',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
    ],
  },
  {
    headingKey: 'pricing_grp_planning',
    rows: [
      {
        labelKey: 'pricing_row_compliance_findings',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_obligations',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_policy_register',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_policy_review',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
    ],
  },
  {
    headingKey: 'pricing_grp_documents',
    rows: [
      {
        labelKey: 'pricing_row_templates_visible',
        cells: {
          free: 'pricing_v_templates_all',
          starter: 'pricing_v_templates_all',
          growth: 'pricing_v_templates_all',
          pro: 'pricing_v_templates_all',
        },
      },
      {
        labelKey: 'pricing_row_saved_documents',
        cells: {
          free: 'pricing_v_docs_free',
          starter: 'pricing_v_docs_starter',
          growth: 'pricing_v_docs_growth',
          pro: 'pricing_v_docs_pro',
        },
      },
      {
        labelKey: 'pricing_row_signature_envelopes',
        cells: {
          free: 'pricing_v_sign_free',
          starter: 'pricing_v_sign_starter',
          growth: 'pricing_v_sign_growth',
          pro: 'pricing_v_sign_pro',
        },
      },
      {
        labelKey: 'pricing_row_pdf_export',
        cells: boolFeatureCells('pdf_export'),
      },
      {
        labelKey: 'pricing_row_word_export',
        cells: boolFeatureCells('word_compatible_export'),
      },
      {
        labelKey: 'pricing_row_doc_repository',
        cells: boolFeatureCells('document_repository'),
      },
    ],
  },
  {
    headingKey: 'pricing_grp_workflows',
    rows: [
      {
        labelKey: 'pricing_row_workflows',
        cells: {
          free: 'pricing_v_workflows_free',
          starter: 'pricing_v_workflows_all',
          growth: 'pricing_v_workflows_all',
          pro: 'pricing_v_workflows_all',
        },
      },
      {
        labelKey: 'pricing_row_reference_guides',
        cells: {
          free: 'pricing_v_guides_all',
          starter: 'pricing_v_guides_all',
          growth: 'pricing_v_guides_all',
          pro: 'pricing_v_guides_all',
        },
      },
      {
        labelKey: 'pricing_row_official_sources',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
    ],
  },
  {
    headingKey: 'pricing_grp_dashboard',
    rows: [
      {
        labelKey: 'pricing_row_guided_setup',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_operational_dashboard',
        cells: boolFeatureCells('operational_dashboard'),
      },
      {
        labelKey: 'pricing_row_operational_analytics',
        cells: boolFeatureCells('operational_analytics'),
      },
      {
        labelKey: 'pricing_row_compliance_trends',
        cells: boolFeatureCells('compliance_trends'),
      },
      {
        labelKey: 'pricing_row_case_aging',
        cells: boolFeatureCells('case_aging_insights'),
      },
      {
        labelKey: 'pricing_row_workforce_insights',
        cells: boolFeatureCells('workforce_insights'),
      },
    ],
  },
  {
    headingKey: 'pricing_grp_workplace',
    rows: [
      {
        labelKey: 'pricing_row_communications',
        cells: boolFeatureCells('communications_register'),
      },
      {
        labelKey: 'pricing_row_compensation',
        cells: boolFeatureCells('compensation_register'),
      },
      {
        labelKey: 'pricing_row_wellbeing',
        cells: boolFeatureCells('wellbeing_register'),
      },
    ],
  },
  {
    headingKey: 'pricing_grp_support',
    rows: [
      {
        labelKey: 'pricing_row_help_centre',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_support',
        cells: {
          free: 'pricing_v_email',
          starter: 'pricing_v_email',
          growth: 'pricing_v_email',
          pro: 'pricing_v_email',
        },
      },
      {
        labelKey: 'pricing_row_queue_priority',
        cells: {
          free: 'pricing_v_priority_standard',
          starter: 'pricing_v_priority_paid',
          growth: 'pricing_v_priority_priority',
          pro: 'pricing_v_priority_highest',
        },
      },
      {
        labelKey: 'pricing_row_initial_reply',
        cells: {
          free: 'pricing_v_2_days',
          starter: 'pricing_v_2_days',
          growth: 'pricing_v_1_day',
          pro: 'pricing_v_1_day',
        },
      },
      {
        labelKey: 'pricing_row_self_onboarding',
        cells: { free: true, starter: true, growth: true, pro: true },
      },
      {
        labelKey: 'pricing_row_walkthrough',
        cells: {
          free: false,
          starter: false,
          growth: 'pricing_v_walkthrough_request',
          pro: true,
        },
      },
      {
        labelKey: 'pricing_row_onboarding_call',
        cells: { free: false, starter: false, growth: false, pro: true },
      },
    ],
  },
]

/** Active comparison for the public site — never the entitled table while gates are off. */
export const PLAN_COMPARISON: ComparisonGroup[] = PLAN_FEATURE_GATES_ENABLED
  ? PLAN_COMPARISON_ENTITLED
  : PLAN_COMPARISON_SUPPORT

/** Pack/overage footnote numbers — must match ADVISOR_ADDONS. */
export const PRICING_ADVISOR_ADDON_FOOTNOTE = {
  pack50Replies: ADVISOR_ADDONS.pack50.replies,
  pack50Price: ADVISOR_ADDONS.pack50.priceCad,
  pack200Replies: ADVISOR_ADDONS.pack200.replies,
  pack200Price: ADVISOR_ADDONS.pack200.priceCad,
  overagePerReply: ADVISOR_ADDONS.overagePerReplyCad,
  overageCap: ADVISOR_ADDONS.overageMonthlyCap,
} as const
