/**
 * The Settings profile's dimension vocabulary — the select options and the
 * value→label map. Shared by the editor (InvestSettingsPage) and the
 * read-only "how Tally reads you" layer (InvestProfilePage) so the two can
 * never drift: a new option here appears on both surfaces.
 */
import type { Bi } from '@/i18n/core'
import { investMessages as IM } from '@/i18n/messages/invest'

export type ProfileField = 'risk' | 'horizon' | 'goal' | 'experience' | 'style'

export const PROFILE_SELECTS: { key: ProfileField; label: Bi; options: [string, Bi][] }[] = [
  {
    key: 'risk',
    label: IM.invest_profile_risk,
    options: [
      ['conservative', IM.invest_risk_conservative],
      ['balanced', IM.invest_opt_balanced],
      ['aggressive', IM.invest_risk_aggressive],
    ],
  },
  {
    key: 'horizon',
    label: IM.invest_profile_horizon,
    options: [
      ['short', IM.invest_horizon_short],
      ['medium', IM.invest_horizon_medium],
      ['long', IM.invest_horizon_long],
    ],
  },
  {
    key: 'goal',
    label: IM.invest_profile_goal,
    options: [
      ['growth', IM.invest_goal_growth],
      ['income', IM.invest_goal_income],
      ['preservation', IM.invest_goal_preservation],
      ['learn', IM.invest_goal_learn],
    ],
  },
  {
    key: 'experience',
    label: IM.invest_profile_experience,
    options: [
      ['new', IM.invest_exp_new],
      ['intermediate', IM.invest_exp_intermediate],
      ['experienced', IM.invest_exp_experienced],
    ],
  },
  {
    key: 'style',
    label: IM.invest_profile_style,
    options: [
      ['concise', IM.invest_style_concise],
      ['balanced', IM.invest_opt_balanced],
      ['teach', IM.invest_style_teach],
    ],
  },
]

export const PROFILE_TAGS: ['sectors' | 'exclusions', Bi][] = [
  ['sectors', IM.invest_profile_sectors],
  ['exclusions', IM.invest_profile_exclusions],
]
