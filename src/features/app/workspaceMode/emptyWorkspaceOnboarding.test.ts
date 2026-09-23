import { afterEach, describe, expect, it } from 'vitest'
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
