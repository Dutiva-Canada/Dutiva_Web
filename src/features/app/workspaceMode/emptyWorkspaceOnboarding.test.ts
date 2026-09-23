import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  dismissSetupCard,
  isSetupCardDismissed,
  markEmptyWorkspaceStudioVisited,
  markEmptyWorkspaceWorkflowVisited,
  readEmptyWorkspaceProgress,
} from './emptyWorkspaceOnboarding'

describe('emptyWorkspaceOnboarding device-local progress', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('starts empty when nothing is stored', () => {
    expect(readEmptyWorkspaceProgress('org-1')).toEqual({
      studioVisited: false,
      workflowVisited: false,
    })
  })

  it('returns empty progress when organizationId is null', () => {
    markEmptyWorkspaceStudioVisited('org-1')
    expect(readEmptyWorkspaceProgress(null)).toEqual({
      studioVisited: false,
      workflowVisited: false,
    })
  })

  it('records studio and workflow visits per organization', () => {
    markEmptyWorkspaceStudioVisited('org-1')
    markEmptyWorkspaceWorkflowVisited('org-1')
    expect(readEmptyWorkspaceProgress('org-1')).toEqual({
      studioVisited: true,
      workflowVisited: true,
    })
    expect(readEmptyWorkspaceProgress('org-2')).toEqual({
      studioVisited: false,
      workflowVisited: false,
    })
  })

  it('dismisses the setup card per organization, device-local', () => {
    expect(isSetupCardDismissed('org-1')).toBe(false)
    dismissSetupCard('org-1')
    expect(isSetupCardDismissed('org-1')).toBe(true)
    expect(isSetupCardDismissed('org-2')).toBe(false)
    expect(isSetupCardDismissed(null)).toBe(false)
  })
})

/**
 * Server sync (migration 0169): hydration OR-merges the per-org marks stored
 * on workspace_preferences into localStorage and pushes the union back, so
 * marks follow the user across devices in both directions.
 */
describe('emptyWorkspaceOnboarding server hydration', () => {
  afterEach(() => {
    localStorage.clear()
    vi.doUnmock('./api')
    vi.resetModules()
  })

  function mockApi(remote: Record<string, unknown>) {
    const api = {
      fetchOnboardingMarks: vi.fn().mockResolvedValue(remote),
      saveOnboardingMarks: vi.fn().mockResolvedValue(true),
    }
    vi.doMock('./api', () => api)
    return api
  }

  it('merges server marks into localStorage and pushes the union back', async () => {
    const api = mockApi({
      'org-1': { workflowVisited: true, setupCardDismissed: true },
    })
    localStorage.setItem(
      'dutiva.emptyWorkspaceOnboarding.v2.org-1',
      JSON.stringify({ studioVisited: true }),
    )
    vi.resetModules()
    const mod = await import('./emptyWorkspaceOnboarding')

    await mod.hydrateEmptyWorkspaceOnboarding('u1', 'org-1')

    /* Local gained the server's marks. */
    expect(mod.readEmptyWorkspaceProgress('org-1')).toEqual({
      studioVisited: true,
      workflowVisited: true,
    })
    expect(mod.isSetupCardDismissed('org-1')).toBe(true)
    /* Server gains the union — local-only studioVisited is written back. */
    expect(api.saveOnboardingMarks).toHaveBeenCalledWith('org-1', {
      studioVisited: true,
      workflowVisited: true,
      setupCardDismissed: true,
    })
  })

  it('does not write back when the server already holds the union', async () => {
    const api = mockApi({
      'org-1': { workflowVisited: true, setupCardDismissed: true },
    })
    vi.resetModules()
    const mod = await import('./emptyWorkspaceOnboarding')

    await mod.hydrateEmptyWorkspaceOnboarding('u1', 'org-1')

    expect(mod.readEmptyWorkspaceProgress('org-1').workflowVisited).toBe(true)
    expect(mod.isSetupCardDismissed('org-1')).toBe(true)
    expect(api.saveOnboardingMarks).not.toHaveBeenCalled()
  })

  it('pushes local-only marks up when the server has no entry', async () => {
    const api = mockApi({})
    localStorage.setItem(
      'dutiva.emptyWorkspaceOnboarding.v2.org-1',
      JSON.stringify({ workflowVisited: true }),
    )
    vi.resetModules()
    const mod = await import('./emptyWorkspaceOnboarding')

    await mod.hydrateEmptyWorkspaceOnboarding('u1', 'org-1')

    expect(api.saveOnboardingMarks).toHaveBeenCalledWith('org-1', {
      studioVisited: false,
      workflowVisited: true,
      setupCardDismissed: false,
    })
  })

  it('is a no-op without an organization', async () => {
    const api = mockApi({ 'org-1': { workflowVisited: true } })
    vi.resetModules()
    const mod = await import('./emptyWorkspaceOnboarding')

    await mod.hydrateEmptyWorkspaceOnboarding('u1', null)

    expect(api.fetchOnboardingMarks).not.toHaveBeenCalled()
    expect(api.saveOnboardingMarks).not.toHaveBeenCalled()
  })
})
