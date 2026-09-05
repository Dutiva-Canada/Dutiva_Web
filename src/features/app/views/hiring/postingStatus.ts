import { hiringMessages as M } from '@/i18n/messages/hiring'

export function getPostingStatusTone(status: string): 'success' | 'neutral' | 'warning' {
  switch (status) {
    case 'active':
      return 'success'
    case 'closed':
      return 'neutral'
    case 'draft':
      return 'warning'
    default:
      return 'warning'
  }
}

export function getPostingStatusLabel(status: string) {
  switch (status) {
    case 'active':
      return M.hiring_posting_active
    case 'closed':
      return M.hiring_posting_closed
    case 'draft':
      return M.hiring_posting_draft
    default:
      return M.hiring_posting_draft
  }
}
