import { LANDING_WORKSPACE_FIXTURES } from './workspaceDemoFixtures'
import type { ScoreDelta } from '@/features/app/views/analytics/aggregation'

export const LANDING_CASE_ID = LANDING_WORKSPACE_FIXTURES.cases[0]!.id

export function landingCasePreview() {
  return LANDING_WORKSPACE_FIXTURES.cases[0]!
}

export function landingCasesPreview() {
  return LANDING_WORKSPACE_FIXTURES.cases
}

export function landingHomePreview() {
  return LANDING_WORKSPACE_FIXTURES.home
}

export function landingCommPreview() {
  return LANDING_WORKSPACE_FIXTURES.comm
}

export function landingScorePreview(): { score: number; delta: ScoreDelta | null } {
  return {
    score: LANDING_WORKSPACE_FIXTURES.score,
    delta: LANDING_WORKSPACE_FIXTURES.scoreDelta,
  }
}

export function landingAttentionPreview() {
  return LANDING_WORKSPACE_FIXTURES.attention
}
