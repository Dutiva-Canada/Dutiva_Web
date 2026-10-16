import { describe, expect, it } from 'vitest'
import { isDoclibStudioPath, isNavActive, moduleLabelFor } from './navLabels'
import { shellMessages as M } from '@/i18n/messages/shell'

describe('moduleLabelFor', () => {
  it('titles a module from its first path segment', () => {
    expect(moduleLabelFor('/workspace/cases')).toBe(M.shell_v_cases)
    expect(moduleLabelFor('/workspace/compliance')).toBe(M.shell_v_compliance)
  })

  it('collapses every documents and planning subroute onto the section label', () => {
    expect(moduleLabelFor('/workspace/documents/hr-library')).toBe(M.shell_nav_library)
    expect(moduleLabelFor('/workspace/documents/generate/t01')).toBe(M.shell_nav_library)
    expect(moduleLabelFor('/workspace/planning/calendar')).toBe(M.shell_nav_planning)
  })

  it('falls back to Home rather than rendering an empty heading', () => {
    expect(moduleLabelFor('/workspace/not-a-module')).toBe(M.shell_v_home)
    expect(moduleLabelFor('/workspace')).toBe(M.shell_v_home)
  })

  it('never resolves a label from a route parameter', () => {
    /* ModeGate titles production empty states with this. viewLabelFor swaps in
       a fixture employee's name for /app/employees/:id; doing that here would
       put demo data on the screen that exists to prove there is none. */
    expect(moduleLabelFor('/workspace/employees/e10')).toBe(M.shell_v_employees)
  })
})

describe('isNavActive', () => {
  it('matches the item and its children, not a sibling with a shared prefix', () => {
    expect(isNavActive('/workspace/cases', '/workspace/cases')).toBe(true)
    expect(isNavActive('/workspace/cases', '/workspace/cases/case1')).toBe(true)
    expect(isNavActive('/workspace/cases', '/workspace/cases-archive')).toBe(false)
    expect(isNavActive('/workspace/cases', '/workspace/compliance')).toBe(false)
  })
})

describe('isDoclibStudioPath', () => {
  it('separates the Studio flow from the Repository', () => {
    expect(isDoclibStudioPath('/workspace/documents/studio')).toBe(true)
    expect(isDoclibStudioPath('/workspace/documents/templates/t01')).toBe(true)
    expect(isDoclibStudioPath('/workspace/documents/generate/t01')).toBe(true)
    expect(isDoclibStudioPath('/workspace/documents')).toBe(false)
    expect(isDoclibStudioPath('/workspace/documents/hr-library')).toBe(false)
    expect(isDoclibStudioPath('/workspace/cases')).toBe(false)
  })
})

describe('eager-graph invariant', () => {
  /* This module exists to be importable from the eager entry graph: ModeGate
     needs a label, and nothing lazy sits between it and routes.tsx. The moment
     it reaches for a fixture, every marketing visitor downloads the demo HR
     data with the landing page.

     scripts/check-entry-graph.mjs catches this in the built output, but only
     `npm run build` runs it. This asserts the same rule in `npm run test`,
     where it fails in seconds instead of after a full build. */
  const source = Object.values(
    import.meta.glob('./navLabels.ts', { query: '?raw', import: 'default', eager: true }),
  )[0] as string

  it('imports no demo fixtures', () => {
    expect(source).not.toMatch(/from\s+'@\/data/)
  })

  it('imports nothing but types and the shell messages', () => {
    const imported = [...source.matchAll(/^import\s+(?:type\s+)?.*?from\s+'([^']+)'/gm)].map(
      (m) => m[1],
    )
    expect(imported).toEqual(['@/i18n/core', '@/i18n/messages/shell'])
  })
})
