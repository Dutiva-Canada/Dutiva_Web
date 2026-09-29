import { careersMessages as M } from '@/i18n/messages/careers'
import type { ExtractionErrorReason } from '@/lib/fileTextExtraction'

export function errorMessageForReason(reason: ExtractionErrorReason) {
  switch (reason) {
    case 'unsupported_type':
      return M.careers_file_error_unsupported_type
    case 'empty_file':
      return M.careers_file_error_empty_file
    case 'too_large':
      return M.careers_file_error_too_large
    case 'corrupt':
      return M.careers_file_error_corrupt
    case 'read_failed':
      return M.careers_file_error_read_failed
    default:
      return M.careers_file_error_generic
  }
}
