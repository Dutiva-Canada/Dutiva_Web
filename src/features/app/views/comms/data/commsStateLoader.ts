import type { Bi } from '@/i18n/core'
import type { CommsWorkspaceState } from './types'
import { listInitiatives } from './initiativesApi'
import { listContentItems } from './contentItemsApi'
import { listContacts, listOrganizations } from './stakeholdersApi'
import { listCoverageItems } from './coverageApi'
import { listSources } from './sourcesApi'
import { listFeeds } from './feedsApi'
import { listSubmissions } from './submissionsApi'
import { listApprovals } from './approvalsApi'
import { listBrandClaims } from './brandClaimsApi'
import { listInteractions } from './interactionsApi'
import { listIssues } from './issuesApi'
import { listMetrics } from './metricsApi'
import { listObjectives } from './objectivesApi'
import { listPolicyFiles } from './policyFilesApi'
import { listIntegrations } from './integrationsApi'
import { getUsageControls } from './usageControlsApi'
import { listExecutionEvents } from './executionEventsApi'
import { listSegmentMemberships, listSegments } from './segmentsApi'

export const emptyCommsState: CommsWorkspaceState = {
  initiatives: [],
  objectives: [],
  contentItems: [],
  contacts: [],
  organizations: [],
  interactions: [],
  policyFiles: [],
  issues: [],
  sources: [],
  feeds: [],
  coverageItems: [],
  submissions: [],
  metrics: [],
  approvals: [],
  brandClaims: [],
  usageControls: {},
  integrations: [],
  executionEvents: [],
  segments: [],
  segmentMemberships: [],
}

export function noteToBi(note?: string): Bi | undefined {
  return note ? { en: note, fr: note } : undefined
}

/**
 * Loads every comms domain from Supabase in parallel. Used by
 * `CommsDataProvider` on mount and after feed syncs.
 */
export async function loadFullCommsState(orgId: string): Promise<CommsWorkspaceState> {
  const [
    initiatives,
    objectives,
    contentItems,
    contacts,
    organizations,
    interactions,
    policyFiles,
    issues,
    sources,
    feeds,
    coverageItems,
    submissions,
    metrics,
    approvals,
    brandClaims,
    integrations,
    executionEvents,
    segments,
    segmentMemberships,
  ] = await Promise.all([
    listInitiatives(orgId),
    listObjectives(orgId),
    listContentItems(orgId),
    listContacts(orgId),
    listOrganizations(orgId),
    listInteractions(orgId),
    listPolicyFiles(orgId),
    listIssues(orgId),
    listSources(orgId),
    listFeeds(orgId),
    listCoverageItems(orgId),
    listSubmissions(orgId),
    listMetrics(orgId),
    listApprovals(orgId),
    listBrandClaims(orgId),
    listIntegrations(orgId),
    listExecutionEvents(orgId),
    listSegments(orgId),
    listSegmentMemberships(orgId),
  ])
  const usageControls = (await getUsageControls(orgId)) ?? {}
  return {
    initiatives,
    objectives,
    contentItems,
    contacts,
    organizations,
    interactions,
    policyFiles,
    issues,
    sources,
    feeds,
    coverageItems,
    submissions,
    metrics,
    approvals,
    brandClaims,
    usageControls,
    integrations,
    executionEvents,
    segments,
    segmentMemberships,
  }
}
