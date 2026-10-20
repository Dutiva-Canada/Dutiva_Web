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
    expect(workspaceSegments('/workspace/cases/case1')).toEqual(['cases', 'case1'])
    /* Legacy /app spellings still parse — the redirect normalizes them. */
    expect(workspaceSegments('/app/cases/case1')).toEqual(['cases', 'case1'])
  })

  it('rewrites /app paths to the active workspace root', () => {
    /* `/app/…` is the canonical virtual prefix link targets use — it maps to
       the mounted root (/workspace in production, /demo in the preview). */
    expect(rewriteAppPath('/app/cases/case1', '/demo')).toBe('/demo/cases/case1')
    expect(rewriteAppPath('/app/advisor', '/fr/demo')).toBe('/fr/demo/advisor')
    expect(rewriteAppPath('/app/home', '/workspace')).toBe('/workspace/home')
    expect(rewriteAppPath('/templates', '/demo')).toBe('/templates')
  })

  it('maps a bare /app (and its query/hash forms) to the root itself', () => {
    expect(rewriteAppPath('/app', '/demo')).toBe('/demo')
    expect(rewriteAppPath('/app', '/fr/demo')).toBe('/fr/demo')
    expect(rewriteAppPath('/app', '/workspace')).toBe('/workspace')
    expect(rewriteAppPath('/app?x=1', '/demo')).toBe('/demo?x=1')
    expect(rewriteAppPath('/app#frag', '/demo')).toBe('/demo#frag')
  })

  it('always sends the sign-in gate and auth landing to /workspace', () => {
    expect(rewriteAppPath('/app/welcome', '/demo')).toBe('/workspace/welcome')
    expect(rewriteAppPath('/app/welcome', '/fr/demo')).toBe('/workspace/welcome')
    expect(rewriteAppPath('/app/auth/confirm', '/demo')).toBe('/workspace/auth/confirm')
    expect(rewriteAppPath('/app/welcome', '/workspace')).toBe('/workspace/welcome')
  })
})
