/**
 * Record a migration as applied in the linked Supabase project by updating
 * supabase_migrations.schema_migrations with its name and statement list.
 * Useful when a migration was executed outside of the standard CLI/CI flow.
 *
 * Usage: node scripts/record-migration.mjs <version> <path/to/migration.sql>
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
const projectRef = process.env.SUPABASE_PROJECT_REF?.trim()

if (!token || !projectRef) {
  console.error('record-migration: SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF must be set')
  process.exit(1)
}

const version = process.argv[2]
const file = process.argv[3]

if (!version || !file) {
  console.error('record-migration: usage: node scripts/record-migration.mjs <version> <file.sql>')
  process.exit(1)
}

const fileName = file.split(/[\\/]/).pop()?.replace(/\.sql$/, '') ?? ''
if (!fileName) {
  console.error('record-migration: could not determine migration name from file path')
  process.exit(1)
}

const match = fileName.match(/^(\d{4})_([a-z0-9_]+)$/)
if (!match) {
  console.error('record-migration: filename must match NNNN_lower_snake_case')
  process.exit(1)
}
const slug = match[2]

const sql = readFileSync(resolve(file), 'utf-8')

// Simple statement splitter. Production migrations should avoid unescaped
// semicolons in strings/comments; dollar-quoted DO blocks are not split here.
function splitStatements(raw) {
  const statements = []
  let current = ''
  let inDollarQuote = false
  let dollarTag = ''
  let inSingleQuote = false
  let inLineComment = false
  let inBlockComment = false
  let i = 0

  while (i < raw.length) {
    const char = raw[i]
    const next = raw[i + 1]
    const two = raw.slice(i, i + 2)

    if (!inDollarQuote && !inSingleQuote && !inBlockComment && two === '--') {
      inLineComment = true
    }
    if (inLineComment && char === '\n') {
      inLineComment = false
      current += char
      i++
      continue
    }
    if (inLineComment) {
      current += char
      i++
      continue
    }

    if (!inDollarQuote && !inSingleQuote && !inLineComment && two === '/*') {
      inBlockComment = true
      current += two
      i += 2
      continue
    }
    if (inBlockComment && two === '*/') {
      inBlockComment = false
      current += two
      i += 2
      continue
    }
    if (inBlockComment) {
      current += char
      i++
      continue
    }

    if (!inDollarQuote && !inSingleQuote && !inLineComment && !inBlockComment) {
      if (!inDollarQuote && char === '$') {
        const possibleTag = raw.slice(i + 1, raw.indexOf('$', i + 1) + 1)
        if (possibleTag && /^\$[A-Za-z0-9_]*\$$/.test(possibleTag)) {
          dollarTag = possibleTag
          inDollarQuote = true
          current += dollarTag
          i += dollarTag.length
          continue
        }
      }
      if (char === "'") {
        inSingleQuote = true
      }
    } else if (inSingleQuote) {
      if (char === "'" && next !== "'") {
        inSingleQuote = false
      }
    } else if (inDollarQuote) {
      if (two === `${dollarTag}$`) {
        // End of dollar quote if next char after tag is not part of a longer tag
        const afterTag = raw.slice(i + dollarTag.length, i + dollarTag.length + 1)
        if (!/[A-Za-z0-9_]/.test(afterTag)) {
          inDollarQuote = false
          current += dollarTag
          i += dollarTag.length
          continue
        }
      }
    }

    if (char === ';' && !inDollarQuote && !inSingleQuote) {
      const trimmed = current.trim()
      if (trimmed) statements.push(trimmed)
      current = ''
      i++
      continue
    }

    current += char
    i++
  }

  const trimmed = current.trim()
  if (trimmed) statements.push(trimmed)
  return statements
}

const statements = splitStatements(sql)

const query = `INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES ('${version.replace(/'/g, "''")}', '${slug.replace(/'/g, "''")}', ARRAY[${statements.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ')}]) ON CONFLICT (version) DO UPDATE SET name = EXCLUDED.name, statements = EXCLUDED.statements`

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
})

if (!response.ok) {
  console.error('record-migration update failed:', response.status, await response.text())
  process.exit(1)
}

console.log(`record-migration: updated schema_migrations row for version ${version} to name ${slug}`)
