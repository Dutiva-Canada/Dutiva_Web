import { createContext } from 'react'
import type {
  CommsApproval,
  CommsBrandClaim,
  CommsContact,
  CommsContentItem,
  CommsCoverageItem,
  CommsExecutionAction,
  CommsFeed,
  CommsInitiative,
  CommsInteraction,
  CommsOrganization,
  CommsSource,
  CommsSubmission,
  CommsSubmissionStatus,
  CommsWorkspaceState,
} from './types'

export interface CommsDataContextValue {
  state: CommsWorkspaceState
  canWrite: boolean
  addInitiative: (item: Omit<CommsInitiative, 'id'>) => CommsInitiative | null
  updateInitiative: (id: string, patch: Partial<CommsInitiative>) => CommsInitiative | null
  removeInitiative: (id: string) => void
  addContentItem: (item: Omit<CommsContentItem, 'id'>) => CommsContentItem | null
  updateContentItem: (id: string, patch: Partial<CommsContentItem>) => CommsContentItem | null
  removeContentItem: (id: string) => void
  transitionDeliveryStatus: (
    contentItemId: string,
    action: CommsExecutionAction,
    actor: string,
    note?: string,
  ) => CommsContentItem | null
  recordManualReceipt: (contentItemId: string, actor: string, note?: string) => CommsContentItem | null
  toggleInitiativePause: (initiativeId: string, paused: boolean, actor: string) => CommsInitiative | null
  addSource: (item: Omit<CommsSource, 'id'>) => CommsSource | null
  updateSource: (id: string, patch: Partial<CommsSource>) => CommsSource | null
  removeSource: (id: string) => void
  addFeed: (item: Omit<CommsFeed, 'id'>) => CommsFeed | null
  updateFeed: (id: string, patch: Partial<CommsFeed>) => CommsFeed | null
  removeFeed: (id: string) => void
  syncFeed: (feedId: string) => Promise<import('./productionApi').FeedSyncResult>
  syncAllFeeds: () => Promise<({ feedId: string } & import('./productionApi').FeedSyncResult)[]>
  addCoverageItem: (item: Omit<CommsCoverageItem, 'id'>) => CommsCoverageItem | null
  updateCoverageItem: (id: string, patch: Partial<CommsCoverageItem>) => CommsCoverageItem | null
  removeCoverageItem: (id: string) => void
  addSubmission: (item: Omit<CommsSubmission, 'id'>) => CommsSubmission | null
  updateSubmission: (id: string, patch: Partial<CommsSubmission>) => CommsSubmission | null
  transitionSubmissionStatus: (
    id: string,
    nextStatus: CommsSubmissionStatus,
    actor?: string,
  ) => CommsSubmission | null
  removeSubmission: (id: string) => void
  addBrandClaim: (item: Omit<CommsBrandClaim, 'id'>) => CommsBrandClaim | null
  updateBrandClaim: (id: string, patch: Partial<CommsBrandClaim>) => CommsBrandClaim | null
  removeBrandClaim: (id: string) => void
  addApproval: (item: Omit<CommsApproval, 'id'>) => CommsApproval | null
  removeApproval: (id: string) => void
  addContact: (item: Omit<CommsContact, 'id'>) => CommsContact | null
  updateContact: (id: string, patch: Partial<CommsContact>) => CommsContact | null
  removeContact: (id: string) => void
  addOrganization: (item: Omit<CommsOrganization, 'id'>) => CommsOrganization | null
  updateOrganization: (id: string, patch: Partial<CommsOrganization>) => CommsOrganization | null
  removeOrganization: (id: string) => void
  addInteraction: (item: Omit<CommsInteraction, 'id'>) => CommsInteraction | null
  updateInteraction: (id: string, patch: Partial<CommsInteraction>) => CommsInteraction | null
  removeInteraction: (id: string) => void
}

export const CommsDataContext = createContext<CommsDataContextValue | null>(null)
