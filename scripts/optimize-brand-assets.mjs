/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Generate WebP siblings and recompress marketing rasters in public/brand/.
 * OG share cards stay PNG (social crawlers); leaf + founder get WebP for pages.
 *
 * Run: npm run optimize:brand
 */

import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const brandDir = path.join(root, 'public', 'brand')

/** Skip favicon/PWA icons — tiny and not page LCP targets. */
const SKIP = new Set([
  'apple-touch-icon.png',
  'icon-app.svg',
  'icon-app-192.png',
  'icon-app-512.png',
  'icon-app-maskable-192.png',
  'icon-app-maskable-512.png',
])

async function optimizeRaster(fileName) {
  const input = path.join(brandDir, fileName)
  const ext = path.extname(fileName).toLowerCase()
  const base = fileName.slice(0, -ext.length)
  const webpOut = path.join(brandDir, `${base}.webp`)

  if (ext === '.png') {
    await sharp(input)
      .png({ quality: 82, compressionLevel: 9, palette: fileName.startsWith('dutiva-leaf') })
      .toFile(input + '.tmp')
    await sharp(input + '.tmp')
      .webp({ quality: 82 })
      .toFile(webpOut)
  } else if (ext === '.jpg' || ext === '.jpeg') {
    await sharp(input)
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(input + '.tmp')
    await sharp(input + '.tmp')
      .webp({ quality: 82 })
      .toFile(webpOut)
  } else {
    return
  }

  const { rename } = await import('node:fs/promises')
  await rename(input + '.tmp', input)
  const before = (await stat(input)).size
  const afterWebp = (await stat(webpOut)).size
  console.log(
    `optimize-brand: ${fileName} → ${base}.webp (${afterWebp} B webp, ${before} B ${ext.slice(1)})`,
  )
}

const entries = await readdir(brandDir)
for (const name of entries) {
  if (SKIP.has(name)) continue
  if (!/\.(png|jpe?g)$/i.test(name)) continue
  await optimizeRaster(name)
}

console.log('optimize-brand: OK')
