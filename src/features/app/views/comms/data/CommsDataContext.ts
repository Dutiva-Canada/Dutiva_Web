import { createContext } from 'react'
import type { FeedSyncResult } from './feedsApi'
import type {
  CommsApproval,
  CommsBrandClaim,
  CommsContact,
  CommsContentItem,
  CommsCoverageItem,
  CommsExecutionAction,
  CommsFeed,
  CommsInitiative,
  CommsIntegration,
  CommsInteraction,
  CommsIssue,
  CommsMetric,
  CommsObjective,
  CommsOrganization,
  CommsPolicyFile,
  CommsSource,
  CommsSubmission,
  CommsSubmissionStatus,
  CommsUsageControls,
  CommsWorkspaceState,
} from './types'

export interface CommsDataContextValue {
  state: CommsWorkspaceState
  canWrite: boolean
  addInitiative: (item: Omit<CommsInitiative, 'id'>) => Promise<CommsInitiative | null>
  updateInitiative: (id: string, patch: Partial<CommsInitiative>) => Promise<CommsInitiative | null>
  removeInitiative: (id: string) => Promise<void>
  addContentItem: (item: Omit<CommsContentItem, 'id'>) => Promise<CommsContentItem | null>
  updateContentItem: (id: string, patch: Partial<CommsContentItem>) => Promise<CommsContentItem | null>
  removeContentItem: (id: string) => Promise<void>
  transitionDeliveryStatus: (
    contentItemId: string,
    action: CommsExecutionAction,
    actor: string,
    note?: string,
  ) => Promise<CommsContentItem | null>
  recordManualReceipt: (contentItemId: string, actor: string, note?: string) => Promise<CommsContentItem | null>
  toggleInitiativePause: (initiativeId: string, paused: boolean, actor: string) => Promise<CommsInitiative | null>
  addSource: (item: Omit<CommsSource, 'id'>) => Promise<CommsSource | null>
  updateSource: (id: string, patch: Partial<CommsSource>) => Promise<CommsSource | null>
  removeSource: (id: string) => Promise<void>
  addFeed: (item: Omit<CommsFeed, 'id'>) => Promise<CommsFeed | null>
  updateFeed: (id: string, patch: Partial<CommsFeed>) => Promise<CommsFeed | null>
  removeFeed: (id: string) => Promise<void>
  syncFeed: (feedId: string) => Promise<FeedSyncResult>
  syncAllFeeds: () => Promise<({ feedId: string } & FeedSyncResult)[]>
  addCoverageItem: (item: Omit<CommsCoverageItem, 'id'>) => Promise<CommsCoverageItem | null>
  updateCoverageItem: (id: string, patch: Partial<CommsCoverageItem>) => Promise<CommsCoverageItem | null>
  removeCoverageItem: (id: string) => Promise<void>
  addSubmission: (item: Omit<CommsSubmission, 'id'>) => Promise<CommsSubmission | null>
  updateSubmission: (id: string, patch: Partial<CommsSubmission>) => Promise<CommsSubmission | null>
  transitionSubmissionStatus: (
    id: string,
    nextStatus: CommsSubmissionStatus,
    actor?: string,
  ) => Promise<CommsSubmission | null>
  removeSubmission: (id: string) => Promise<void>
  addBrandClaim: (item: Omit<CommsBrandClaim, 'id'>) => Promise<CommsBrandClaim | null>
  updateBrandClaim: (id: string, patch: Partial<CommsBrandClaim>) => Promise<CommsBrandClaim | null>
  removeBrandClaim: (id: string) => Promise<void>
  addApproval: (item: Omit<CommsApproval, 'id'>) => Promise<CommsApproval | null>
  removeApproval: (id: string) => Promise<void>
  addContact: (item: Omit<CommsContact, 'id'>) => Promise<CommsContact | null>
  updateContact: (id: string, patch: Partial<CommsContact>) => Promise<CommsContact | null>
  removeContact: (id: string) => Promise<void>
  addOrganization: (item: Omit<CommsOrganization, 'id'>) => Promise<CommsOrganization | null>
  updateOrganization: (id: string, patch: Partial<CommsOrganization>) => Promise<CommsOrganization | null>
  removeOrganization: (id: string) => Promise<void>
  addInteraction: (item: Omit<CommsInteraction, 'id'>) => Promise<CommsInteraction | null>
  updateInteraction: (id: string, patch: Partial<CommsInteraction>) => Promise<CommsInteraction | null>
  removeInteraction: (id: string) => Promise<void>
  addPolicyFile: (item: Omit<CommsPolicyFile, 'id'>) => Promise<CommsPolicyFile | null>
  removePolicyFile: (id: string) => Promise<void>
  addIssue: (item: Omit<CommsIssue, 'id'>) => Promise<CommsIssue | null>
  updateIssue: (id: string, patch: Partial<CommsIssue>) => Promise<CommsIssue | null>
  removeIssue: (id: string) => Promise<void>
  addMetric: (item: Omit<CommsMetric, 'id'>) => Promise<CommsMetric | null>
  updateMetric: (id: string, patch: Partial<CommsMetric>) => Promise<CommsMetric | null>
  removeMetric: (id: string) => Promise<void>
  addObjective: (item: Omit<CommsObjective, 'id'>) => Promise<CommsObjective | null>
  updateObjective: (id: string, patch: Partial<CommsObjective>) => Promise<CommsObjective | null>
  removeObjective: (id: string) => Promise<void>
  addIntegration: (item: Omit<CommsIntegration, 'id'>) => Promise<CommsIntegration | null>
  updateIntegration: (id: string, patch: Partial<CommsIntegration>) => Promise<CommsIntegration | null>
  removeIntegration: (id: string) => Promise<void>
  updateUsageControls: (controls: Partial<CommsUsageControls>) => Promise<CommsUsageControls | null>
}

export const CommsDataContext = createContext<CommsDataContextValue | null>(null)
