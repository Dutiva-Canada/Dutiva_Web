/**
 * Aggregated blog sections — one file per slug.
 * Do not re-export from `./index` (article metadata); see content.ts.
 */
import { sections as quebec_employment_standards } from './quebec-employment-standards'
import { sections as federally_regulated_workplaces } from './federally-regulated-workplaces'
import { sections as workplace_policies_canada } from './workplace-policies-canada'
import { sections as employment_record_keeping } from './employment-record-keeping'
import { sections as job_protected_leaves } from './job-protected-leaves'
import { sections as harassment_prevention_obligations } from './harassment-prevention-obligations'
import type { ArticleSection } from '../articleModel'

export const BLOG_SECTIONS: Record<string, readonly ArticleSection[]> = {
  'quebec-employment-standards': quebec_employment_standards,
  'federally-regulated-workplaces': federally_regulated_workplaces,
  'workplace-policies-canada': workplace_policies_canada,
  'employment-record-keeping': employment_record_keeping,
  'job-protected-leaves': job_protected_leaves,
  'harassment-prevention-obligations': harassment_prevention_obligations,
}
