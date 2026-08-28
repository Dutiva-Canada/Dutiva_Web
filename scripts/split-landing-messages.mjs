/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * One-time splitter for landing.ts → landing/*.ts section modules.
 * Run: node scripts/split-landing-messages.mjs
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'src/i18n/messages/landing.ts')
const outDir = path.join(root, 'src/i18n/messages/landing')

/** Map landing key segment → output file (without .ts). */
function bucketForKey(key) {
  if (/^landing_(nav_|signin|start_free)/.test(key)) return 'chrome'
  if (/^landing_(hero_|h_|sub_|cta_nocard|cta_seehow|stat_|beta_honeypot|hero_check)/.test(key)) return 'hero'
  if (/^landing_adv_/.test(key)) return 'advisorPreview'
  if (/^landing_trust_/.test(key)) return 'trust'
  if (/^landing_how/.test(key)) return 'howItWorks'
  if (/^landing_faq/.test(key)) return 'faq'
  if (/^landing_prod/.test(key)) return 'product'
  if (/^landing_wf/.test(key)) return 'workflows'
  if (/^landing_(try_|demo_)/.test(key)) return 'demo'
  if (/^landing_(mod_|cat_|studio_)/.test(key)) return 'documentStudio'
  if (/^landing_why/.test(key)) return 'whyDutiva'
  if (/^landing_testimonials_/.test(key)) return 'testimonials'
  if (/^landing_(price_|mo|free_|starter_|growth_|pro_)/.test(key)) return 'pricing'
  if (/^landing_guides_/.test(key)) return 'guidesTeaser'
  if (/^landing_(cta_badge|cta_title|cta_p|cta_capacity|cta_spots|cta_email|cta_btn|cta_disclaimer)/.test(key))
    return 'waitlistCta'
  if (/^landing_foot_/.test(key)) return 'footer'
  if (/^landing_cov/.test(key)) return 'coverage'
  return 'misc'
}

const raw = await readFile(src, 'utf8')
const headerEnd = raw.indexOf('export const landing = defineMessages({')
const preamble = raw.slice(0, headerEnd)
const bodyStart = raw.indexOf('{', headerEnd) + 1
const bodyEnd = raw.lastIndexOf('})')
const body = raw.slice(bodyStart, bodyEnd)

const buckets = new Map()
let preambleExtra = ''

/** Split on top-level `landing_*:` entries (brace-aware). */
const entryRe = /(\/\*[\s\S]*?\*\/\s*)?(landing_[a-z0-9_]+):\s*\{/g
let match
while ((match = entryRe.exec(body)) !== null) {
  const comment = match[1] ?? ''
  const key = match[2]
  let depth = 1
  let i = entryRe.lastIndex
  while (i < body.length && depth > 0) {
    if (body[i] === '{') depth++
    else if (body[i] === '}') depth--
    i++
  }
  const entryBody = body.slice(entryRe.lastIndex - 1, i)
  const bucket = bucketForKey(key)
  if (!buckets.has(bucket)) buckets.set(bucket, [])
  buckets.get(bucket).push(`${comment}${key}: ${entryBody}`)
  entryRe.lastIndex = i
}

if (preamble.includes('BETA_COHORT_LIMIT')) {
  preambleExtra = "import { BETA_COHORT_LIMIT } from '@/config/beta'\n"
}

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

const imports = []
for (const [bucket, entries] of [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const exportName = `landing${bucket[0].toUpperCase()}${bucket.slice(1)}`
  const needsBeta = entries.some((e) => e.includes('BETA_COHORT_LIMIT'))
  const file = `${bucket}.ts`
  const content = `${needsBeta ? "import { BETA_COHORT_LIMIT } from '@/config/beta'\n" : ''}import { defineMessages } from '../../core'

export const ${exportName} = defineMessages({
${entries.join(',\n')},
})
`
  await writeFile(path.join(outDir, file), content, 'utf8')
  imports.push({ exportName, file: `./${file.replace('.ts', '')}` })
}

const index = `${preambleExtra}import { defineMessages } from '../core'
${imports.map(({ exportName, file }) => `import { ${exportName} } from '${file}'`).join('\n')}

/** Landing page messages — split by section for maintainability. */
export const landing = defineMessages({
${imports.map(({ exportName }) => `  ...${exportName},`).join('\n')}
})
`

await writeFile(path.join(outDir, 'index.ts'), index, 'utf8')
console.log(`split-landing: wrote ${imports.length} section files under src/i18n/messages/landing/`)
