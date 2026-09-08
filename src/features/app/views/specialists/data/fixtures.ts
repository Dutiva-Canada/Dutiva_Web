import type { Specialist, SpecialistEngagement } from './types'

const DEMO_ORG_ID = 'org-northgate-demo'

export const specialists: Specialist[] = [
  {
    id: 'sp-1',
    organization_id: DEMO_ORG_ID,
    name: 'Jean-Marc Lefebvre',
    specialty: 'lawyer',
    company: 'Drolet & Associés',
    email: 'jml@example.com',
    phone: '514-555-0101',
    crm_contact_id: null,
    finance_party_id: null,
    workspace_access: false,
    workspace_role: 'consultant',
    granted_modules: [],
    access_expires_at: null,
    organization_member_id: null,
    notes: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'sp-2',
    organization_id: DEMO_ORG_ID,
    name: 'Claire Beaumont',
    specialty: 'accountant',
    company: 'Beaumont CPA',
    email: 'claire@example.com',
    phone: null,
    crm_contact_id: null,
    finance_party_id: null,
    workspace_access: true,
    workspace_role: 'viewer',
    granted_modules: ['finance'],
    access_expires_at: null,
    organization_member_id: null,
    notes: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const specialistEngagements: SpecialistEngagement[] = [
  {
    id: 'se-1',
    organization_id: DEMO_ORG_ID,
    specialist_id: 'sp-1',
    engagement_date: '2025-08-15',
    engagement_type: 'call',
    summary: 'Initial employment contract review.',
    follow_up_date: '2025-08-22',
    created_by: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

export const specialistsSummary = {
  specialists,
  engagements: specialistEngagements,
}
