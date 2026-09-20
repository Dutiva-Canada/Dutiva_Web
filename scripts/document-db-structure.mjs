/**
 * Generate docs/DATABASE_STRUCTURE.md — a readable map of the live Supabase
 * project, from the live database (not the repo's migrations, which cannot
 * fully reproduce it — see docs/DATABASE_SCHEMA.md).
 *
 *   SUPABASE_ACCESS_TOKEN=… SUPABASE_PROJECT_REF=… node scripts/document-db-structure.mjs
 *
 * Emits: schemas/extensions, every table grouped by domain prefix (with
 * column count, RLS flag, policy count), views, functions/RPCs, triggers and
 * cron jobs. Secrets (vault contents, function bodies, data rows) are never
 * touched — this is a structure map, not a dump; supabase/schema.sql is the
 * full DDL snapshot.
 */
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
const projectRef = process.env.SUPABASE_PROJECT_REF?.trim()
if (!token || !projectRef) {
  console.error('document-db-structure: SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF must be set')
  process.exit(1)
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(root, 'docs', 'DATABASE_STRUCTURE.md')
const API = `https://api.supabase.com/v1/projects/${projectRef}/database/query`

/* Same internal-schema filter as scripts/refresh_schema_snapshot.py — keep
   the two lists in sync. */
const INTERNAL_RE = `!~ '^(information_schema|pg_|_analytics|_realtime|_supavisor|auth|etl|extensions|pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_|_timescaledb_|topology|vault)'`

async function query(sql) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  if (!res.ok) throw new Error(`query failed ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

const QUERIES = {
  tables: `
    select n.nspname as schema, c.relname as name,
           c.relrowsecurity as rls,
           (select count(*) from pg_attribute a
             where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as cols,
           (select count(*) from pg_policies p
             where p.schemaname = n.nspname and p.tablename = c.relname) as policies
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where c.relkind = 'r' and n.nspname ${INTERNAL_RE}
     order by 1, 2`,
  views: `
    select schemaname as schema, viewname as name
      from pg_views where schemaname ${INTERNAL_RE} order by 1, 2`,
  functions: `
    select n.nspname as schema, p.proname as name,
           pg_get_function_identity_arguments(p.oid) as args,
           p.prosecdef as definer
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public','doclib') order by 1, 2`,
  triggers: `
    select event_object_schema as schema, event_object_table as table_name,
           trigger_name as name
      from information_schema.triggers
     where event_object_schema ${INTERNAL_RE} order by 1, 2, 3`,
  extensions: `select extname as name, extversion as version from pg_extension order by 1`,
  policies: `
    select schemaname as schema, tablename as table_name, policyname as name,
           cmd, array_to_string(roles, ',') as roles
      from pg_policies where schemaname ${INTERNAL_RE} order by 1, 2, 3`,
  cronJobs: `select jobname as name, schedule, command from cron.job order by name`,
  schemas: `
    select nspname as name from pg_namespace
     where nspname ${INTERNAL_RE} order by 1`,
}

/** Group a table by its first name segment: finance_holdings → finance. */
function domainOf(name) {
  return name.split('_')[0]
}

function groupByDomain(tables) {
  const groups = new Map()
  for (const t of tables) {
    const d = domainOf(t.name)
    if (!groups.has(d)) groups.set(d, [])
    groups.get(d).push(t)
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

const data = {}
for (const [key, sql] of Object.entries(QUERIES)) {
  try {
    data[key] = await query(sql)
  } catch (e) {
    data[key] = []
    console.error(`  (${key} query failed: ${e.message.slice(0, 120)})`)
  }
}

const today = new Date().toISOString().slice(0, 10)
const lines = []
lines.push(`# Database structure — live project \`${projectRef}\``)
lines.push('')
lines.push(`Generated ${today} by \`scripts/document-db-structure.mjs\` from the live`)
lines.push('database — **do not hand-edit**. For the full DDL snapshot see')
lines.push('`supabase/schema.sql`; for how the schema is tracked and why repo')
lines.push('migrations alone cannot reproduce it, see `docs/DATABASE_SCHEMA.md`.')
lines.push('')
lines.push('## Schemas')
lines.push('')
for (const s of data.schemas) lines.push(`- \`${s.name}\``)
lines.push('')
lines.push('## Extensions')
lines.push('')
lines.push('| Extension | Version |')
lines.push('| --------- | ------- |')
for (const e of data.extensions) lines.push(`| \`${e.name}\` | ${e.version} |`)
lines.push('')
lines.push(`## Tables — ${data.tables.length} total`)
lines.push('')
lines.push('Grouped by name prefix. RLS = `relrowsecurity`; a table without RLS is')
lines.push('either intentional (public read) or a finding — check `check:rls`.')
lines.push('')
const bySchema = new Map()
for (const t of data.tables) {
  if (!bySchema.has(t.schema)) bySchema.set(t.schema, [])
  bySchema.get(t.schema).push(t)
}
for (const [schema, tables] of [...bySchema.entries()].sort()) {
  lines.push(`### schema \`${schema}\` (${tables.length})`)
  lines.push('')
  for (const [domain, members] of groupByDomain(tables)) {
    lines.push(`**\`${domain}_*\`** — ${members.length} table(s)`)
    lines.push('')
    lines.push('| Table | Cols | RLS | Policies |')
    lines.push('| ----- | ---- | --- | -------- |')
    for (const t of members) {
      lines.push(`| \`${t.name}\` | ${t.cols} | ${t.rls ? 'on' : '**off**'} | ${t.policies} |`)
    }
    lines.push('')
  }
}
lines.push(`## Views — ${data.views.length}`)
lines.push('')
for (const v of data.views) lines.push(`- \`${v.schema}.${v.name}\``)
lines.push('')
lines.push(`## Functions / RPCs — ${data.functions.length}`)
lines.push('')
lines.push('| Function | Args | Security definer |')
lines.push('| -------- | ---- | ---------------- |')
for (const f of data.functions) {
  lines.push(`| \`${f.schema}.${f.name}\` | ${f.args || '—'} | ${f.definer ? 'yes' : ''} |`)
}
lines.push('')
lines.push(`## Triggers — ${data.triggers.length}`)
lines.push('')
lines.push('| Table | Trigger |')
lines.push('| ----- | ------- |')
for (const t of data.triggers) lines.push(`| \`${t.schema}.${t.table_name}\` | \`${t.name}\` |`)
lines.push('')
lines.push(`## RLS policies — ${data.policies.length}`)
lines.push('')
lines.push('Names and scope only; full `USING`/`WITH CHECK` expressions are in')
lines.push('`supabase/schema.sql` and the migrations that created them.')
lines.push('')
lines.push('| Table | Policy | Command | Roles |')
lines.push('| ----- | ------ | ------- | ----- |')
for (const p of data.policies) {
  lines.push(`| \`${p.schema}.${p.table_name}\` | ${p.name} | ${p.cmd} | ${p.roles} |`)
}
lines.push('')
lines.push(`## Cron jobs — ${data.cronJobs.length}`)
lines.push('')
if (data.cronJobs.length) {
  lines.push('| Job | Schedule |')
  lines.push('| --- | -------- |')
  for (const j of data.cronJobs) lines.push(`| \`${j.name}\` | \`${j.schedule}\` |`)
} else {
  lines.push('(cron.job not readable — either pg_cron is absent or the query role lacks access)')
}
lines.push('')
lines.push('## Replication recipe')
lines.push('')
lines.push('To rebuild this database on a new Supabase project:')
lines.push('')
lines.push('1. `supabase link` the new project, then `supabase db push` — applies all')
lines.push('   159 repo migrations in order.')
lines.push('2. Replay the pre-repo baseline: the platform tables/RPCs that predate')
lines.push('   this repo exist only in `supabase/schema.sql` (see DATABASE_SCHEMA.md).')
lines.push('   Apply the missing objects from that file, or dump-restore them.')
lines.push('3. Re-apply the MCP slices in `ACCEPTED_UNTRACKED` (check-migrations.mjs):')
lines.push('   `grant_admin_directory_rpcs`, `signup_alert_identifies_account`, plus')
lines.push('   the advisor-phase aliases — their SQL lives in the MCP apply history,')
lines.push('   not this repo.')
lines.push('4. Set function secrets + Vault entries per `.env.example` and the')
lines.push('   migration comments that need them (law-monitor, attachment-scan keys).')
lines.push('5. Verify: `npm run check:migrations` against the new project, then this')
lines.push('   script — the generated map should match modulo the project ref.')
lines.push('')

writeFileSync(OUT, lines.join('\n'))
console.log(`document-db-structure: wrote ${OUT}`)
console.log(
  `  ${data.schemas.length} schemas, ${data.extensions.length} extensions, ` +
    `${data.tables.length} tables, ${data.views.length} views, ` +
    `${data.functions.length} functions, ${data.triggers.length} triggers, ${data.cronJobs.length} cron jobs`,
)
