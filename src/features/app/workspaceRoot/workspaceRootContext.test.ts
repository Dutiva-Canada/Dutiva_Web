import { describe, expect, it } from 'vitest'
import { rewriteAppPath, workspacePath, workspaceSegments } from './workspaceRootContext'

describe('workspaceRootContext helpers', () => {
  it('builds paths from a workspace root', () => {
    expect(workspacePath('/demo', 'home')).toBe('/demo/home')
    expect(workspacePath('/fr/demo', 'workflows/statutory-notice-ontario')).toBe(
      '/fr/demo/workflows/statutory-notice-ontario',
    )
  })

  it('strips workspace prefixes for segment parsing', () => {
    expect(workspaceSegments('/demo/documents/studio')).toEqual(['documents', 'studio'])
    expect(workspaceSegments('/fr/demo/advisor')).toEqual(['advisor'])
    expect(workspaceSegments('/app/cases/case1')).toEqual(['cases', 'case1'])
  })

  it('rewrites /app paths inside the public demo root', () => {
    expect(rewriteAppPath('/app/cases/case1', '/demo')).toBe('/demo/cases/case1')
    expect(rewriteAppPath('/app/advisor', '/fr/demo')).toBe('/fr/demo/advisor')
    expect(rewriteAppPath('/app/home', '/app')).toBe('/app/home')
    expect(rewriteAppPath('/templates', '/demo')).toBe('/templates')
  })
})
