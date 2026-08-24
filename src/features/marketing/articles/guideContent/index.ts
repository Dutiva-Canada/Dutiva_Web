/**
 * Aggregated guide sections — one file per slug.
 * Do not re-export from `./index` (article metadata); see content.ts.
 */
import { sections as ontario_termination_notice } from './ontario-termination-notice'
import { sections as probation_clauses_ontario } from './probation-clauses-ontario'
import { sections as employer_document_checklist } from './employer-document-checklist'
import { sections as employment_contract_clauses } from './employment-contract-clauses'
import { sections as duty_to_accommodate } from './duty-to-accommodate'
import { sections as termination_documentation } from './termination-documentation'
import type { ArticleSection } from '../articleModel'

export const GUIDE_SECTIONS: Record<string, readonly ArticleSection[]> = {
  'ontario-termination-notice': ontario_termination_notice,
  'probation-clauses-ontario': probation_clauses_ontario,
  'employer-document-checklist': employer_document_checklist,
  'employment-contract-clauses': employment_contract_clauses,
  'duty-to-accommodate': duty_to_accommodate,
  'termination-documentation': termination_documentation,
}
