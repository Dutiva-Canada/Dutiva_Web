import { listIssues } from '@/features/app/views/comms/data/issuesApi'
import { listSubmissions } from '@/features/app/views/comms/data/submissionsApi'
import { listBrandClaims } from '@/features/app/views/comms/data/brandClaimsApi'
import { listPolicyFiles } from '@/features/app/views/comms/data/policyFilesApi'

export type { CommsIssue, CommsSubmission, CommsBrandClaim, CommsPolicyFile } from '@/features/app/views/comms/data/types'

export {
  listIssues as listCommsIssues,
  listSubmissions as listCommsSubmissions,
  listBrandClaims as listCommsBrandClaims,
  listPolicyFiles as listCommsPolicyFiles,
}
