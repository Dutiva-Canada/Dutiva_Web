import { readPref, writePref } from '@/lib/prefs'
import { fetchOnboardingMarks, saveOnboardingMarks } from './api'

/**
 * Progress for the production setup path (empty Home checklist + the
 * Keep-going card that survives first records). The guided-process step
 * completes when the user opens the Workflows catalog or a flow runner;
 * every other step derives from live org data — see setupPath.ts.
 *
 * Two layers, same marks: localStorage gives synchronous first paint, and
 * `workspace_preferences.onboarding` (migration 0169) carries the same marks
 * across devices. Reads stay local and sync; marks write through to the
 * server fire-and-forget, and `hydrateEmptyWorkspaceOnboarding` merges the
 * server copy down when the workspace resolves. Marks are monotonic — a
 * visit or dismissal never un-happens — so merging is OR, never overwrite.
 * Non-admin org members can't write workspace_preferences (RLS); they keep
 * the device-local behavior unchanged.
 * See docs/EMPTY_WORKSPACE_ONBOARDING.md.
 */

export type EmptyWorkspaceSessionProgress = {
  studioVisited: boolean
  workflowVisited: boolean
}

const emptyProgress = (): EmptyWorkspaceSessionProgress => ({
  studioVisited: false,
  workflowVisited: false,
})

const storageKey = (organizationId: string): string =>
  `dutiva.emptyWorkspaceOnboarding.v2.${organizationId}`

export function readEmptyWorkspaceProgress(
  organizationId: string | null,
): EmptyWorkspaceSessionProgress {
  if (!organizationId) return emptyProgress()
  try {
    const raw = readPref(storageKey(organizationId), '')
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<EmptyWorkspaceSessionProgress>
    return {
      studioVisited: parsed.studioVisited === true,
      workflowVisited: parsed.workflowVisited === true,
    }
  } catch {
    return emptyProgress()
  }
}

function writeProgress(organizationId: string, next: EmptyWorkspaceSessionProgress): void {
  writePref(storageKey(organizationId), JSON.stringify(next))
}

export function markEmptyWorkspaceStudioVisited(organizationId: string | null): void {
  if (!organizationId) return
  const current = readEmptyWorkspaceProgress(organizationId)
  if (current.studioVisited) return
  writeProgress(organizationId, { ...current, studioVisited: true })
  void saveOnboardingMarks(organizationId, { studioVisited: true })
}

export function markEmptyWorkspaceWorkflowVisited(organizationId: string | null): void {
  if (!organizationId) return
  const current = readEmptyWorkspaceProgress(organizationId)
  if (current.workflowVisited) return
  writeProgress(organizationId, { ...current, workflowVisited: true })
  void saveOnboardingMarks(organizationId, { workflowVisited: true })
}

/**
 * Keep-going card dismissal — org-scoped, synced for platform admins.
 * Dismissal only hides the card on the populated Home; the empty Home
 * always shows the full path.
 */
const dismissedKey = (organizationId: string): string =>
  `dutiva.setupCard.dismissed.v1.${organizationId}`

export function isSetupCardDismissed(organizationId: string | null): boolean {
  if (!organizationId) return false
  return readPref(dismissedKey(organizationId), '') === '1'
}

export function dismissSetupCard(organizationId: string | null): void {
  if (!organizationId) return
  writePref(dismissedKey(organizationId), '1')
  void saveOnboardingMarks(organizationId, { setupCardDismissed: true })
}

/**
 * Merge the server's onboarding marks for `organizationId` into localStorage
 * and push the union back — so a mark made on any device lands on all of
 * them, in either direction. Awaited by WorkspaceModeProvider before the
 * production workspace mounts, so views read post-merge state on first
 * paint. No-op without Supabase or for marks the table can't hold (RLS).
 */
export async function hydrateEmptyWorkspaceOnboarding(
  userId: string,
  organizationId: string | null,
): Promise<void> {
  if (!organizationId) return
  const remote = (await fetchOnboardingMarks(userId))[organizationId]
  const remoteMarks = {
    studioVisited: remote?.studioVisited === true,
    workflowVisited: remote?.workflowVisited === true,
    setupCardDismissed: remote?.setupCardDismissed === true,
  }
  const local = readEmptyWorkspaceProgress(organizationId)
  const merged = {
    studioVisited: local.studioVisited || remoteMarks.studioVisited,
    workflowVisited: local.workflowVisited || remoteMarks.workflowVisited,
  }
  const dismissed = isSetupCardDismissed(organizationId) || remoteMarks.setupCardDismissed

  if (merged.studioVisited !== local.studioVisited || merged.workflowVisited !== local.workflowVisited)
    writeProgress(organizationId, merged)
  if (dismissed && !isSetupCardDismissed(organizationId))
    writePref(dismissedKey(organizationId), '1')

  if (
    merged.studioVisited !== remoteMarks.studioVisited ||
    merged.workflowVisited !== remoteMarks.workflowVisited ||
    dismissed !== remoteMarks.setupCardDismissed
  ) {
    void saveOnboardingMarks(organizationId, {
      studioVisited: merged.studioVisited,
      workflowVisited: merged.workflowVisited,
      setupCardDismissed: dismissed,
    })
  }
}
