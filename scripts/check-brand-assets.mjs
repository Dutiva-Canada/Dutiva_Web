/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Assert every marketing brand path referenced in code exists under public/brand,
 * and that WebP siblings exist for page raster assets (not OG cards).
 */

import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Keep in sync with src/seo/site.ts marketing rasters. */
const REQUIRED = [
  '/brand/dutiva-leaf.png',
  '/brand/martin-constantineau.jpg',
  '/brand/og-dutiva-en.png',
  '/brand/og-dutiva-fr.png',
]

const WEBP_SIBLINGS = ['/brand/dutiva-leaf.png', '/brand/martin-constantineau.jpg']

const errors = []

for (const urlPath of REQUIRED) {
  const file = path.join(root, 'public', urlPath)
  if (!existsSync(file)) errors.push(`missing ${urlPath}`)
}

for (const urlPath of WEBP_SIBLINGS) {
  const webp = urlPath.replace(/\.(png|jpe?g)$/i, '.webp')
  const file = path.join(root, 'public', webp)
  if (!existsSync(file)) errors.push(`missing WebP sibling ${webp} (run npm run optimize:brand)`)
}

if (errors.length > 0) {
  console.error('check-brand-assets: FAIL')
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}

console.log('check-brand-assets: OK')
