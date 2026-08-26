import { afterEach, describe, expect, it } from 'vitest'
import {
  markEmptyWorkspaceStudioVisited,
  markEmptyWorkspaceWorkflowVisited,
  readEmptyWorkspaceProgress,
} from './emptyWorkspaceOnboarding'

describe('emptyWorkspaceOnboarding session progress', () => {
  afterEach(() => {
    sessionStorage.clear()
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
})
