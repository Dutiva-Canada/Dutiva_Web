/*
 * Known migration history exceptions — single source for check-migrations.mjs.
 *
 * Renaming a migration that is already applied on the live project is worse
 * than keeping a duplicate sequence number: `supabase db push` keys on the
 * filename slug, so a rename reads as a brand-new migration and may re-run it.
 */

/** @type {ReadonlyMap<string, { readonly files: readonly string[]; readonly reason: string }>} */
export const ACCEPTED_DUPLICATE_SEQUENCES = new Map([
  [
    '0024',
    {
      files: ['0024_reconcile_billing_schema.sql', '0024_match_advisor_guidance_review_topic.sql'],
      reason:
        'Both applied on the live project under sequence 0024 before filename ' +
        'discipline blocked new collisions. Do not renumber either file.',
    },
  ],
  [
    '0194',
    {
      files: ['0194_dutiva_pr_growth.sql', '0194_pr_access_dutiva_staff.sql'],
      reason:
        '0194_dutiva_pr_growth.sql was applied via the Management API while a ' +
        'parallel MR merged 0194_pr_access_dutiva_staff.sql; both ran on the ' +
        'live project under sequence 0194. The staff-grant SQL is idempotent ' +
        'and both sides were verified applied. Do not renumber either file.',
    },
  ],
])

/** @returns {ReadonlySet<string>} */
export function acceptedDuplicateSequenceNumbers() {
  return new Set(ACCEPTED_DUPLICATE_SEQUENCES.keys())
}
