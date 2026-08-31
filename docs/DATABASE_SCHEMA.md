# Database schema — how it's tracked

The live Supabase project (`khtwpxnvziiyplaflwru`, "dutiva") was built from a
large migration history that predates this repo. **`supabase/migrations/` here
is a curated subset** — the doclib demo (`0001`–`0002`), the HR / support /
billing / status features (`0005`+), and the security-hardening passes
(`0003`–`0004`, `0011`, `0020`, `0021`). The base platform schema (the
`organizations` / `organization_members` tables, the `is_org_member` /
`is_org_admin` / `is_admin_user` helpers, the document-lifecycle and AI tables,
and dozens of RPCs) was created directly on the project and has **no `CREATE`
migration in this repo**.

That's fine for day-to-day work — new changes go through
`supabase/migrations/*` as usual — but it means the repo can't fully
reproduce the live schema from scratch, and a reviewer can't see the real RLS
policies / function bodies in the diff. `supabase/schema.sql` closes that gap:
a committed, human-readable snapshot of the whole live schema, refreshed on
demand.

## Refresh the snapshot

One-time setup (per machine):

```bash
# Install the CLI (macOS shown; see https://supabase.com/docs/guides/cli)
brew install supabase/tap/supabase        # or: npm i -g supabase

supabase login                            # opens a browser
supabase link --project-ref khtwpxnvziiyplaflwru
```

`link` asks for the **database password**. Get it from the dashboard →
**Project Settings → Database → Connection string / Reset database password**.
The CLI stores its own auth locally — **never commit the password or paste it
into chat / a PR.**

Then, whenever you want to capture the current live schema:

```bash
npm run db:snapshot        # → supabase db dump -f supabase/schema.sql
git add supabase/schema.sql
git commit -m "chore: refresh database schema snapshot"
```

## What the snapshot is (and isn't)

- **Is:** a reference dump of the live schema (tables, columns, RLS policies,
  functions, grants) — reviewable in a diff, and a reproducibility anchor.
- **Isn't:** a replayable migration set. Schema _changes_ still go through
  `supabase/migrations/*` (applied via `supabase db push` or the Supabase MCP
  `apply_migration`). Treat `schema.sql` as generated output, not a source of
  truth you hand-edit.

## Notes

- `db dump` reads only the schema (no table data), so the snapshot carries no
  customer or demo rows.
- Supabase-managed schemas (`auth`, `storage`, …) are excluded by default; the
  dump focuses on the application schema.
- After a schema change, re-run `npm run db:snapshot` so the committed snapshot
  doesn't drift from production.
