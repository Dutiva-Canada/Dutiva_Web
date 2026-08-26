/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

describe('favicon', () => {
  it('ships a raster tab icon instead of the SVG that cannot load its leaf', () => {
    const html = readFileSync(path.join(root, 'index.html'), 'utf8')
    const iconHrefs = [...html.matchAll(/<link\s+rel="icon"[^>]*>/g)].map((m) => m[0])

    expect(iconHrefs.some((tag) => tag.includes('/favicon.ico'))).toBe(true)
    expect(iconHrefs.some((tag) => tag.includes('icon-app-32.png'))).toBe(true)
    expect(iconHrefs.every((tag) => !tag.includes('icon-app.svg'))).toBe(true)

    expect(existsSync(path.join(root, 'public/favicon.ico'))).toBe(true)
    expect(existsSync(path.join(root, 'public/brand/icon-app-32.png'))).toBe(true)
    expect(existsSync(path.join(root, 'public/brand/icon-app-48.png'))).toBe(true)
  })
})
