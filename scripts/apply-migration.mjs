/**
 * Apply a SQL migration file to the linked Supabase project by splitting
 * it into individual statements and running each via the Management API
 * /database/query endpoint. Handles DO $$ ... $$ blocks without splitting
 * on semicolons inside them.
 *
 * Usage: node scripts/apply-migration.mjs <migration-file.sql>
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
const projectRef = process.env.SUPABASE_PROJECT_REF?.trim()

if (!token || !projectRef) {
  console.error('apply-migration: SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF must be set')
  process.exit(1)
}

const file = process.argv[2]
if (!file) {
  console.error('apply-migration: usage: node scripts/apply-migration.mjs <file.sql>')
  process.exit(1)
}

const sql = readFileSync(resolve(file), 'utf-8')
const API_URL = `https://api.supabase.com/v1/projects/${projectRef}/database/query`

/**
 * Split SQL into individual statements, respecting:
 * - DO $$ ... $$ blocks (don't split on ; inside dollar-quoted strings)
 * - Single-quoted strings ('...')
 * - Line comments (-- ...)
 * - Block comments (/* ... *\/)
 */
function splitSql(sql) {
  const statements = []
  let current = ''
  let i = 0
  let inDollarQuote = false
  let dollarTag = ''
  let inSingleQuote = false
  let inLineComment = false
  let inBlockComment = false

  while (i < sql.length) {
    const char = sql[i]
    const next = sql[i + 1]
    const two = sql.slice(i, i + 2)

    // Handle line comments
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

    // Handle block comments
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

    // Handle dollar-quoted strings: $tag$ ... $tag$
    if (!inSingleQuote && char === '$') {
      const dollarMatch = sql.slice(i).match(/^\$([a-zA-Z0-9_]*)\$/)
      if (dollarMatch) {
        const tag = dollarMatch[1]
        if (!inDollarQuote) {
          inDollarQuote = true
          dollarTag = tag
          current += dollarMatch[0]
          i += dollarMatch[0].length
          continue
        } else if (tag === dollarTag) {
          inDollarQuote = false
          dollarTag = ''
          current += dollarMatch[0]
          i += dollarMatch[0].length
          continue
        }
      }
    }

    // Handle single-quoted strings
    if (!inDollarQuote && char === "'" && !inLineComment) {
      // Check for escaped quote ('')
      if (next === "'" && inSingleQuote) {
        current += two
        i += 2
        continue
      }
      inSingleQuote = !inSingleQuote
      current += char
      i++
      continue
    }

    // Split on semicolons (only when not inside any quoted block)
    if (char === ';' && !inDollarQuote && !inSingleQuote && !inLineComment && !inBlockComment) {
      current += char
      // Strip leading/trailing whitespace and check if there's real SQL
      // (not just comments). Remove leading line/block comments to check.
      const trimmed = current.trim()
      const withoutComments = trimmed
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .trim()
      if (withoutComments) {
        statements.push(trimmed)
      }
      current = ''
      i++
      continue
    }

    current += char
    i++
  }

  // Don't forget the last statement (if no trailing semicolon)
  const trimmed = current.trim()
  const withoutComments = trimmed
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
  if (withoutComments) {
    statements.push(trimmed)
  }

  return statements
}

async function runQuery(query) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`${response.status} ${body.slice(0, 300)}`)
  }

  return response.json().catch(() => null)
}

const statements = splitSql(sql)
console.log(`apply-migration: ${file} split into ${statements.length} statements`)

let succeeded = 0
let failed = 0

for (let idx = 0; idx < statements.length; idx++) {
  const stmt = statements[idx]
  const preview = stmt.slice(0, 80).replace(/\n/g, ' ')
  process.stdout.write(`  [${idx + 1}/${statements.length}] ${preview}... `)

  try {
    await runQuery(stmt)
    console.log('OK')
    succeeded++
  } catch (error) {
    console.log('FAILED')
    console.log(`    ${error.message}`)
    failed++
    // Continue to next statement — many CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS
    // are idempotent, so a failure on one shouldn't stop the rest.
  }
}

console.log(`\napply-migration: ${succeeded} succeeded, ${failed} failed`)

if (failed > 0) {
  console.error('apply-migration: some statements failed — review errors above')
  process.exit(1)
} else {
  console.log('apply-migration: all statements succeeded')
}
