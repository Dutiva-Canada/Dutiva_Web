import { describe, expect, it } from 'vitest'
import { scrubRoutePattern } from './scrubRoute'

describe('scrubRoutePattern', () => {
  it('leaves known static public and workspace routes untouched', () => {
    expect(scrubRoutePattern('/')).toBe('/')
    expect(scrubRoutePattern('/pricing')).toBe('/pricing')
    expect(scrubRoutePattern('/fr/tarifs')).toBe('/fr/tarifs')
    expect(scrubRoutePattern('/workspace/home')).toBe('/workspace/home')
    expect(scrubRoutePattern('/workspace/planning/tasks')).toBe('/workspace/planning/tasks')
  })

  it('collapses public policy/help slugs to their named pattern', () => {
    expect(scrubRoutePattern('/legal/quebec-law-25')).toBe('/legal/:slug')
    expect(scrubRoutePattern('/help/signing-in')).toBe('/help/:slug')
    expect(scrubRoutePattern('/fr/juridique/loi-25')).toBe('/fr/juridique/:slug')
    expect(scrubRoutePattern('/fr/aide/connexion')).toBe('/fr/aide/:slug')
  })

  it('scrubs opaque entity identifiers on the workspace surface', () => {
    expect(scrubRoutePattern('/workspace/cases/8f3b9c1e-0a2d-4b6f-9c1e-0a2d4b6f9c1e')).toBe(
      '/workspace/cases/:id',
    )
    expect(scrubRoutePattern('/workspace/employees/emp_00931')).toBe('/workspace/employees/:id')
    expect(scrubRoutePattern('/workspace/support/requests/DUT-2025-000123')).toBe(
      '/workspace/support/requests/:id',
    )
    expect(scrubRoutePattern('/workspace/support/admin/DUT-2025-000123')).toBe(
      '/workspace/support/admin/:id',
    )
  })

  it('scrubs human-readable fixture ids (name slugs), not just opaque ones', () => {
    expect(scrubRoutePattern('/workspace/employees/jordan-mensah')).toBe('/workspace/employees/:id')
    expect(scrubRoutePattern('/workspace/settings/memory/people/riley-summers')).toBe(
      '/workspace/settings/memory/people/:id',
    )
    expect(scrubRoutePattern('/workspace/settings/memory/conversations/kickoff')).toBe(
      '/workspace/settings/memory/conversations/:id',
    )
  })

  it('matches position-aware: a static-looking id under a dynamic route is still scrubbed', () => {
    // `employees/:employeeId` has no static `studio` child, so `studio` here is
    // an employee id — must not leak via the documents-only `studio` route.
    expect(scrubRoutePattern('/workspace/employees/studio')).toBe('/workspace/employees/:id')
    expect(scrubRoutePattern('/workspace/cases/templates')).toBe('/workspace/cases/:id')
  })

  it('keeps real document sub-routes but scrubs the document id', () => {
    expect(scrubRoutePattern('/workspace/documents/studio')).toBe('/workspace/documents/studio')
    expect(scrubRoutePattern('/workspace/documents/hr-library')).toBe(
      '/workspace/documents/hr-library',
    )
    expect(scrubRoutePattern('/workspace/documents/templates/termination-letter')).toBe(
      '/workspace/documents/templates/:id',
    )
    expect(scrubRoutePattern('/workspace/documents/generate/warning-letter')).toBe(
      '/workspace/documents/generate/:id',
    )
    expect(scrubRoutePattern('/workspace/documents/8f3b9c1e0a2d4b6f')).toBe(
      '/workspace/documents/:id',
    )
  })

  it('degrades an unknown route to a safe label rather than echoing the path', () => {
    // A 404 or a not-yet-registered dynamic route must never transmit a segment.
    expect(scrubRoutePattern('/workspace/missing/jane-doe')).toBe('/workspace/:unknown')
    expect(scrubRoutePattern('/workspace/some-new-feature/42')).toBe('/workspace/:unknown')
    expect(scrubRoutePattern('/totally/made/up')).toBe('/unknown')
    expect(scrubRoutePattern('/not-a-path')).toBe('/unknown')
  })

  it('normalizes legacy /app paths to the canonical workspace patterns', () => {
    // The pre-rename mount redirects client-side; errors captured mid-redirect
    // still group with /workspace.
    expect(scrubRoutePattern('/workspace/cases/8f3b9c1e-0a2d-4b6f-9c1e-0a2d4b6f9c1e')).toBe(
      '/workspace/cases/:id',
    )
    expect(scrubRoutePattern('/workspace/home')).toBe('/workspace/home')
    expect(scrubRoutePattern('/workspace')).toBe('/workspace')
    expect(scrubRoutePattern('/workspace/missing/x')).toBe('/workspace/:unknown')
  })

  it('drops query strings and fragments entirely', () => {
    expect(scrubRoutePattern('/workspace/cases/abc-123?tab=notes#section')).toBe(
      '/workspace/cases/:id',
    )
    expect(scrubRoutePattern('/pricing?ref=email&utm=x')).toBe('/pricing')
  })

  it('strips a trailing slash but preserves root', () => {
    expect(scrubRoutePattern('/pricing/')).toBe('/pricing')
    expect(scrubRoutePattern('/workspace/')).toBe('/workspace')
    expect(scrubRoutePattern('/')).toBe('/')
  })

  it('is total: never throws on odd input', () => {
    expect(scrubRoutePattern('')).toBe('/')
    expect(scrubRoutePattern('///')).toBe('/')
  })
})
