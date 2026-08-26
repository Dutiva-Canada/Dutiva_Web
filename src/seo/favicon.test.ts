/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { describe, expect, it } from 'vitest'

/* Vite `?raw` glob, not `node:fs`: the app tsconfig is browser-typed. */
function raw(glob: Record<string, string>, suffix: string): string {
  const hit = Object.entries(glob).find(([filePath]) => filePath.endsWith(suffix))
  if (!hit) throw new Error(`${suffix} not found`)
  return hit[1]
}

const html = raw(
  import.meta.glob('../../index.html', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  'index.html',
)

describe('favicon', () => {
  it('ships a raster tab icon instead of the SVG that cannot load its leaf', () => {
    const iconHrefs = [...html.matchAll(/<link\s+rel="icon"[^>]*>/g)].map((m) => m[0])

    expect(iconHrefs.some((tag) => tag.includes('/favicon.ico'))).toBe(true)
    expect(iconHrefs.some((tag) => tag.includes('icon-app-32.png'))).toBe(true)
    expect(iconHrefs.every((tag) => !tag.includes('icon-app.svg'))).toBe(true)

    expect(
      Object.keys(import.meta.glob('../../public/favicon.ico', { eager: true })),
    ).not.toHaveLength(0)
    expect(
      Object.keys(import.meta.glob('../../public/brand/icon-app-32.png', { eager: true })),
    ).not.toHaveLength(0)
    expect(
      Object.keys(import.meta.glob('../../public/brand/icon-app-48.png', { eager: true })),
    ).not.toHaveLength(0)
  })
})
