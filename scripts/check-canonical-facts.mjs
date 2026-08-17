/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
/**
 * Canonical-facts drift check — the half that reads stylesheets.
 *
 * `docs/CANONICAL_FACTS.md` is the source of record for Dutiva's load-bearing
 * facts, and it states its own precedence rule: where it disagrees with the
 * code, the code wins and the file gets corrected. Enforcement is split in two
 * along a principled line:
 *
 *   1. `src/canonicalFacts.test.ts` — rows backed by **TypeScript values**
 *      (template count, plan prices, jurisdictions, billing ratio, beta flag,
 *      coverage audit date, retired contact addresses). Those are imported and
 *      compared directly, which is what a test does well.
 *   2. THIS SCRIPT — rows backed by **CSS text** (the brand palette). Vitest
 *      runs with `css: false` (vite.config.ts), which stubs every `.css` file
 *      to an empty string — `?raw` included — so a test physically cannot read
 *      a token value. Turning that off to check two rows would slow the whole
 *      suite, so the stylesheet comparison lives here instead.
 *
 * Why the brand rows are worth enforcing at all: CANONICAL_FACTS §6 records
 * that the *written description* of the accent colour had already drifted once
 * (amber #E8A020 for gold #d4af37) while the logo kit stayed correct. A hex in
 * a document is exactly the kind of fact that gets copied into a deck and
 * outlives the value it described.
 *
 * Dependency-free on purpose, matching check-migrations.mjs.
 */

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docPath = path.join(root, 'docs', 'CANONICAL_FACTS.md')
const stylesDir = path.join(root, 'src', 'styles')

/**
 * Each brand row, and the exact CSS declarations that define it.
 *
 * Deliberately not "does this hex appear anywhere in src/styles/": that is
 * satisfied by any unrelated value in any file, so pointing Brand navy's deep
 * stop at `#0a1522` (a gradient stop already in patterns.css) or swapping the
 * gold and navy rows outright would both stay green. Each row is compared as
 * an exact set against the declarations it actually names, so a value that
 * moves to a different meaning fails even though the hex still exists.
 *
 * `--bg` is scoped to its selector because surfaces.css declares it four times
 * across the theme ramps; only the marketing dark surface is the brand's deep
 * navy floor.
 */
const BRAND_ROWS = [
  {
    label: 'Brand gold',
    sources: [
      { file: 'tokens.css', selector: ':root', prop: '--gold-gradient' },
      { file: 'tokens.css', selector: ':root', prop: '--gold-on-dark' },
    ],
  },
  {
    label: 'Brand navy',
    sources: [
      { file: 'tokens.css', selector: ':root', prop: '--dutiva-navy' },
      { file: 'surfaces.css', selector: '.surface-marketing', prop: '--bg' },
    ],
  },
]

const doc = await readFile(docPath, 'utf8')

const styleFiles = (await readdir(stylesDir)).filter((name) => name.endsWith('.css'))
const stylesheets = new Map(
  await Promise.all(
    styleFiles.map(async (name) => [
      name,
      (await readFile(path.join(stylesDir, name), 'utf8')).toLowerCase(),
    ]),
  ),
)

/** Hex values declared by `prop` inside the `selector` block of `css`. */
function declaredHexes(css, selector, prop) {
  /* Comments are stripped first so a hex mentioned in prose (surfaces.css
     explains the deep floor by naming the brand navy) is never mistaken for a
     declaration. */
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '')

  /* Walk brace-delimited blocks without a capturing regex (which can
     super-linear-backtrack on large inputs). */
  let pos = 0
  while (pos < code.length) {
    const open = code.indexOf('{', pos)
    if (open === -1) break
    const close = code.indexOf('}', open + 1)
    if (close === -1) break
    const rawSelector = code.slice(pos, open)
    const body = code.slice(open + 1, close)
    pos = close + 1
    if (rawSelector.trim() !== selector) continue
    const declaration = body.split(';').find((entry) => entry.trim().startsWith(`${prop}:`))
    if (declaration === undefined) continue
    return [...declaration.matchAll(/#([0-9a-f]{6})\b/g)].map((m) => m[0])
  }

  return null
}

/**
 * First cell of a markdown table row, trimmed — `null` for a non-table line.
 *
 * Parsed rather than prefix-matched because Prettier formats this repo's
 * markdown and pads table columns to align them, so `| Brand gold |` becomes
 * `| Brand gold   |` as soon as a longer label joins the table.
 */
function firstCell(line) {
  if (!line.trimStart().startsWith('|')) return null
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')[0]
    .trim()
}

const problems = []

for (const { label, sources } of BRAND_ROWS) {
  const row = doc.split('\n').find((line) => firstCell(line) === label)

  if (!row) {
    problems.push(`docs/CANONICAL_FACTS.md has no "${label}" row`)
    continue
  }

  const documented = [...row.matchAll(/#([0-9a-f]{6})\b/gi)].map((m) => m[0].toLowerCase())

  if (documented.length === 0) {
    problems.push(`"${label}" row publishes no hex value — it used to`)
    continue
  }

  const declared = []
  let unreadable = false

  for (const { file, selector, prop } of sources) {
    const css = stylesheets.get(file)
    const hexes = css === undefined ? null : declaredHexes(css, selector, prop)

    if (hexes === null) {
      problems.push(
        `"${label}" is defined by ${prop} in ${selector} (src/styles/${file}), which no ` +
          'longer exists — the declaration moved or was renamed, so this row is ' +
          'describing something the stylesheets no longer say',
      )
      unreadable = true
      continue
    }

    declared.push(...hexes)
  }

  if (unreadable) continue

  /* Exact set comparison, both directions: a hex the document invented and a
     stop the palette gained but the document never learned about are equally
     wrong. Order is ignored — the document writes the gradient light-to-dark
     and adds the on-dark shade after it. */
  const documentedSet = [...new Set(documented)].sort((a, b) => a.localeCompare(b))
  const declaredSet = [...new Set(declared)].sort((a, b) => a.localeCompare(b))

  if (documentedSet.join(' ') !== declaredSet.join(' ')) {
    const named = sources.map(({ prop }) => prop).join(', ')
    problems.push(
      `"${label}" publishes ${documentedSet.join(', ')} but ${named} declare ` +
        `${declaredSet.join(', ')} — the document is describing a palette the product ` +
        'does not have',
    )
  }
}

if (problems.length > 0) {
  console.error('check-canonical-facts: FAILED')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error(
    "\nFix whichever side is wrong. Per the file's own rule, where " +
      'docs/CANONICAL_FACTS.md disagrees with the code, the code wins and the ' +
      'document gets corrected.',
  )
  process.exit(1)
}

console.log(
  `check-canonical-facts: OK (${BRAND_ROWS.length} brand rows resolved against ` +
    `${styleFiles.length} stylesheets)`,
)
