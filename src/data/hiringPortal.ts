import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'

/**
 * Candidate-portal applications shown in the demo inbox — mirrors the
 * PortalApplication shape the production tab renders, minus the long-form
 * fields (cover letter, resume text) that a fixture doesn't need.
 */
export interface DemoPortalApplication {
  id: string
  candidateName: string
  candidateHeadline: Bi
  candidateEmail: string
  candidateLocation: Bi
  jobPostingTitle: Bi
  status:
    | 'submitted'
    | 'under_review'
    | 'shortlisted'
    | 'interview'
    | 'offered'
    | 'hired'
    | 'rejected'
    | 'withdrawn'
  appliedDate: string
  aiMatchScore: number | null
}

export const demoPortalApplications: DemoPortalApplication[] = [
  {
    id: 'pa1',
    candidateName: 'Amélie Tremblay',
    candidateHeadline: bi('Senior Product Manager', 'Gestionnaire de produit senior'),
    candidateEmail: 'amelie.tremblay@example.com',
    candidateLocation: bi('Toronto, ON', 'Toronto, ON'),
    jobPostingTitle: bi('Senior Product Manager', 'Gestionnaire de produit principal'),
    status: 'submitted',
    appliedDate: 'Sep 8, 2026',
    aiMatchScore: 84,
  },
  {
    id: 'pa2',
    candidateName: 'Daniel Okafor',
    candidateHeadline: bi('Product Operations Lead', 'Chef des opérations produit'),
    candidateEmail: 'd.okafor@example.com',
    candidateLocation: bi('Mississauga, ON', 'Mississauga, ON'),
    jobPostingTitle: bi('Senior Product Manager', 'Gestionnaire de produit principal'),
    status: 'under_review',
    appliedDate: 'Sep 6, 2026',
    aiMatchScore: null,
  },
  {
    id: 'pa3',
    candidateName: 'Priya Sharma',
    candidateHeadline: bi('B2B SaaS PM · ex-logistics', 'GP SaaS B2B · ex-logistique'),
    candidateEmail: 'priya.sharma@example.com',
    candidateLocation: bi('Vancouver, BC', 'Vancouver, C.-B.'),
    jobPostingTitle: bi('Senior Product Manager', 'Gestionnaire de produit principal'),
    status: 'shortlisted',
    appliedDate: 'Sep 2, 2026',
    aiMatchScore: 91,
  },
]
