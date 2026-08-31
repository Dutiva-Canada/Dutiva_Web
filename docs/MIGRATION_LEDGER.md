# Migration ledger

Exceptions to strict `NNNN_slug.sql` ordering. `npm run check:migrations` enforces
filename discipline locally and compares the repo against the live Supabase project
when credentials are set.

## Duplicate sequence `0024`

Both files below are **already applied** on project `khtwpxnvziiyplaflwru`. They
share the sequence prefix but have distinct slugs in
`supabase_migrations.schema_migrations`:

| File                                           | Slug                                  | Purpose                                                                              |
| ---------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| `0024_reconcile_billing_schema.sql`            | `reconcile_billing_schema`            | Billing webhook idempotency table, `profiles.plan` constraint for starter/growth/pro |
| `0024_match_advisor_guidance_review_topic.sql` | `match_advisor_guidance_review_topic` | Advisor retrieval RPC adds `topic` and `review_status` columns                       |

**Do not renumber either file.** Supabase keys applied migrations on the slug; a
rename would look like a new migration and could re-run destructive DDL.

New migrations must use the next free sequence (`0094` at time of writing).

## Related accepted exceptions

See `scripts/migration-ledger.mjs` and `scripts/check-migrations.mjs` for:

- `ACCEPTED_UNAPPLIED` — repo files deliberately not applied under their own name
- `ACCEPTED_UNTRACKED` — live slugs with no repo file (split pairs, MCP slices)
