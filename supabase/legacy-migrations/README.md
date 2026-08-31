# Legacy migrations (archive — do not run)

The six SQL files here predate this repository. They were recovered on
2026-08-06 from a separate Supabase CLI project in the user's home folder
(`C:\Users\Marti\supabase`, `project_id = "dutiva-main"`) before that folder was
deleted, because they turned out to be the **only local record of DDL for three
tables that exist in production**.

## Why they were kept

`supabase/migrations/` in this repo is a curated subset of a history that starts
after these ran — see **OA10** in [../../docs/TODO.md](../../docs/TODO.md). A
check against the live database on 2026-08-06 found:

| Table           | `create table` in `supabase/migrations/`? | Live? |
| --------------- | ----------------------------------------- | ----- |
| `profiles`      | yes — `0013_add_billing_profiles.sql`     | yes   |
| `documents`     | **no**                                    | yes   |
| `signatures`    | **no**                                    | yes   |
| `conversations` | **no**                                    | yes   |

So for three live tables, the column definitions, constraints, and RLS policies
existed nowhere in version control. That is the gap OA10 describes — "a reviewer
cannot see the real RLS policies or function bodies in a diff" — and deleting the
home folder would have made it permanent.

## What they are not

**Not runnable, and not part of the migration history.** They live outside
`supabase/migrations/` deliberately: the Supabase CLI only reads that directory,
so nothing here is ever applied. Their naming (`202604070001_…`) belongs to the
old project's lineage and does not interleave with this repo's `0001_…` series.

Treat them as archaeology: the best available answer to "what did this table
originally look like, and why". They are **not** authoritative about the current
schema — four months of migrations have run since, and some of these objects have
been altered or superseded. `npm run db:snapshot` (OA10) remains the real fix; it
captures production as it actually is today.

## Provenance

Copied byte-identical (`cmp` verified) from
`C:\Users\Marti\supabase\migrations\` on 2026-08-06. That folder also held April
copies of four edge functions — `advisor-chat`, `create-checkout-session`,
`monitor-law-changes`, `stripe-webhook` — all strictly older and smaller than
this repo's versions, so none were worth keeping. One of them, the 535-line
`monitor-law-changes`, was accidentally deployed over production that day; see
[../config.toml](../config.toml) for the root cause and the fix.
