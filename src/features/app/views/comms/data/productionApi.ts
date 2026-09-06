import { initialCommsState } from './fixtures'
import type {
  CommsContentItem,
  CommsCoverageItem,
  CommsExecutionAction,
  CommsExecutionEvent,
  CommsFeed,
  CommsInitiative,
  CommsSource,
  CommsSourceType,
  CommsSubmission,
  CommsSubmissionStatus,
  CommsWorkspaceState,
} from './types'
import { feedItemToSource, parseFeedXml } from './feedParser'

/**
 * In-browser persistence stub for the communications workspace in production
 * mode. This keeps the Phase 1 implementation self-contained (no migration
 * needed) while preserving the demo/production split. A later Phase swaps this
 * for a Supabase-backed API.
 */

const storageKey = (orgId: string) => `dutiva_comms_state_${orgId}`

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export function loadCommsState(orgId: string): CommsWorkspaceState {
  try {
    if (!hasStorage()) return clone(initialCommsState)
    const raw = localStorage.getItem(storageKey(orgId))
    if (raw) {
      const parsed = JSON.parse(raw) as CommsWorkspaceState
      return {
        initiatives: parsed.initiatives ?? initialCommsState.initiatives,
        objectives: parsed.objectives ?? initialCommsState.objectives,
        contentItems: parsed.contentItems ?? initialCommsState.contentItems,
        contacts: parsed.contacts ?? initialCommsState.contacts,
        organizations: parsed.organizations ?? initialCommsState.organizations,
        interactions: parsed.interactions ?? initialCommsState.interactions,
        policyFiles: parsed.policyFiles ?? initialCommsState.policyFiles,
        issues: parsed.issues ?? initialCommsState.issues,
        sources: parsed.sources ?? initialCommsState.sources,
        feeds: parsed.feeds ?? initialCommsState.feeds,
        coverageItems: parsed.coverageItems ?? initialCommsState.coverageItems,
        submissions: parsed.submissions ?? initialCommsState.submissions,
        metrics: parsed.metrics ?? initialCommsState.metrics,
        approvals: parsed.approvals ?? initialCommsState.approvals,
        brandClaims: parsed.brandClaims ?? initialCommsState.brandClaims,
        executionEvents: parsed.executionEvents ?? initialCommsState.executionEvents,
      }
    }
  } catch {
    // fall through to fixture seed
  }
  return clone(initialCommsState)
}

function saveCommsState(orgId: string, state: CommsWorkspaceState): void {
  if (!hasStorage()) return
  localStorage.setItem(storageKey(orgId), JSON.stringify(state))
}

function updateState(
  orgId: string,
  patch: (state: CommsWorkspaceState) => CommsWorkspaceState,
): CommsWorkspaceState {
  const next = patch(clone(loadCommsState(orgId)))
  saveCommsState(orgId, next)
  return next
}

export function listInitiatives(orgId: string): CommsInitiative[] {
  return loadCommsState(orgId).initiatives
}

export function addInitiative(
  orgId: string,
  initiative: Omit<CommsInitiative, 'id'>,
): CommsInitiative {
  const created: CommsInitiative = {
    ...initiative,
    id: `init-${Date.now()}`,
  }
  updateState(orgId, (state) => ({ ...state, initiatives: [created, ...state.initiatives] }))
  return created
}

export function updateInitiative(
  orgId: string,
  id: string,
  patch: Partial<CommsInitiative>,
): CommsInitiative | null {
  let result: CommsInitiative | null = null
  updateState(orgId, (state) => {
    const initiatives = state.initiatives.map((i) => {
      if (i.id !== id) return i
      result = { ...i, ...patch }
      return result
    })
    return { ...state, initiatives }
  })
  return result
}

export function removeInitiative(orgId: string, id: string): void {
  updateState(orgId, (state) => ({
    ...state,
    initiatives: state.initiatives.filter((i) => i.id !== id),
    contentItems: state.contentItems.filter((c) => c.initiativeId !== id),
    objectives: state.objectives.filter((o) => o.initiativeId !== id),
    metrics: state.metrics.filter((m) => m.initiativeId !== id),
  }))
}

export function listContentItems(orgId: string): CommsContentItem[] {
  return loadCommsState(orgId).contentItems
}

export function addContentItem(
  orgId: string,
  item: Omit<CommsContentItem, 'id'>,
): CommsContentItem {
  const created: CommsContentItem = { ...item, id: `content-${Date.now()}` }
  updateState(orgId, (state) => ({ ...state, contentItems: [created, ...state.contentItems] }))
  return created
}

export function updateContentItem(
  orgId: string,
  id: string,
  patch: Partial<CommsContentItem>,
): CommsContentItem | null {
  let result: CommsContentItem | null = null
  updateState(orgId, (state) => {
    const contentItems = state.contentItems.map((c) => {
      if (c.id !== id) return c
      result = { ...c, ...patch }
      return result
    })
    return { ...state, contentItems }
  })
  return result
}

export function removeContentItem(orgId: string, id: string): void {
  updateState(orgId, (state) => ({
    ...state,
    contentItems: state.contentItems.filter((c) => c.id !== id),
    approvals: state.approvals.filter((a) => a.contentItemId !== id),
    executionEvents: state.executionEvents.filter((e) => e.contentItemId !== id),
  }))
}

function addExecutionEvent(
  state: CommsWorkspaceState,
  event: Omit<CommsExecutionEvent, 'id'>,
): CommsWorkspaceState {
  const created: CommsExecutionEvent = {
    ...event,
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }
  return { ...state, executionEvents: [created, ...state.executionEvents] }
}

function nextDeliveryStatus(
  current: CommsContentItem['deliveryStatus'],
  action: CommsExecutionAction,
): CommsContentItem['deliveryStatus'] | null {
  switch (action) {
    case 'schedule':
      return current === 'not_queued' || current === 'ready' || current === 'scheduled' || current === 'paused'
        ? 'scheduled'
        : null
    case 'unschedule':
      return current === 'scheduled' ? 'ready' : null
    case 'pause':
      return current === 'scheduled' || current === 'ready' || current === 'sending' ? 'paused' : null
    case 'resume':
      return current === 'paused' ? 'ready' : null
    case 'mark_sent':
      return current === 'scheduled' || current === 'ready' || current === 'sending' ? 'confirmed' : null
    case 'mark_failed':
      return current === 'scheduled' || current === 'sending' ? 'failed' : null
    case 'retry':
      return current === 'failed' || current === 'unknown' ? 'ready' : null
    case 'reconcile':
      return current === 'unknown' ? 'confirmed' : null
    case 'cancel':
      return current === 'scheduled' || current === 'ready' || current === 'paused' ? 'cancelled' : null
    default:
      return null
  }
}

export function transitionDeliveryStatus(
  orgId: string,
  contentItemId: string,
  action: CommsExecutionAction,
  actor: string,
  note?: string,
): CommsContentItem | null {
  let updated: CommsContentItem | null = null
  updateState(orgId, (state) => {
    const item = state.contentItems.find((c) => c.id === contentItemId)
    if (!item) return state
    const nextStatus = nextDeliveryStatus(item.deliveryStatus, action)
    if (!nextStatus) return state
    if (action === 'mark_sent' && item.status !== 'approved') return state

    const noteBi = note ? { en: note, fr: note } : undefined
    updated = {
      ...item,
      deliveryStatus: nextStatus,
      deliveryNote: noteBi,
      scheduledFor: action === 'unschedule' ? undefined : item.scheduledFor,
    }
    const evented = addExecutionEvent(state, {
      contentItemId,
      action,
      previousStatus: item.deliveryStatus,
      newStatus: nextStatus,
      actor,
      note: noteBi,
      timestamp: new Date().toISOString(),
    })
    return {
      ...evented,
      contentItems: evented.contentItems.map((c) => (c.id === contentItemId ? updated! : c)),
    }
  })
  return updated
}

export function recordManualReceipt(
  orgId: string,
  contentItemId: string,
  actor: string,
  note?: string,
): CommsContentItem | null {
  return transitionDeliveryStatus(orgId, contentItemId, 'mark_sent', actor, note)
}

export function toggleInitiativePause(
  orgId: string,
  initiativeId: string,
  paused: boolean,
  actor: string,
): CommsInitiative | null {
  let updated: CommsInitiative | null = null
  updateState(orgId, (state) => {
    const initiative = state.initiatives.find((i) => i.id === initiativeId)
    if (!initiative) return state
    const nextStatus = paused
      ? 'paused'
      : (initiative.status === 'paused' ? 'active' : initiative.status)
    updated = { ...initiative, status: nextStatus }
    const events: Omit<CommsExecutionEvent, 'id'>[] = []
    const nextItems = state.contentItems.map<CommsContentItem>((c) => {
      if (c.initiativeId !== initiativeId) return c
      if (
        paused &&
        (c.deliveryStatus === 'ready' || c.deliveryStatus === 'scheduled' || c.deliveryStatus === 'sending')
      ) {
        events.push({
          contentItemId: c.id,
          action: 'pause',
          previousStatus: c.deliveryStatus,
          newStatus: 'paused',
          actor,
          timestamp: new Date().toISOString(),
        })
        return { ...c, deliveryStatus: 'paused' }
      }
      if (!paused && c.deliveryStatus === 'paused') {
        events.push({
          contentItemId: c.id,
          action: 'resume',
          previousStatus: c.deliveryStatus,
          newStatus: 'ready',
          actor,
          timestamp: new Date().toISOString(),
        })
        return { ...c, deliveryStatus: 'ready' }
      }
      return c
    })
    let nextState: CommsWorkspaceState = {
      ...state,
      initiatives: state.initiatives.map((i) => (i.id === initiativeId ? updated! : i)),
      contentItems: nextItems,
    }
    events.forEach((event) => {
      nextState = addExecutionEvent(nextState, event)
    })
    return nextState
  })
  return updated
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function addSource(orgId: string, source: Omit<CommsSource, 'id'>): CommsSource {
  const created: CommsSource = { ...source, id: createId('source') }
  updateState(orgId, (state) => ({ ...state, sources: [created, ...state.sources] }))
  return created
}

export function updateSource(orgId: string, id: string, patch: Partial<CommsSource>): CommsSource | null {
  let result: CommsSource | null = null
  updateState(orgId, (state) => ({
    ...state,
    sources: state.sources.map((s) => {
      if (s.id !== id) return s
      result = { ...s, ...patch }
      return result
    }),
  }))
  return result
}

export function removeSource(orgId: string, id: string): void {
  updateState(orgId, (state) => ({
    ...state,
    sources: state.sources.filter((s) => s.id !== id),
  }))
}

export function addCoverageItem(orgId: string, item: Omit<CommsCoverageItem, 'id'>): CommsCoverageItem {
  const created: CommsCoverageItem = { ...item, id: createId('coverage') }
  updateState(orgId, (state) => ({ ...state, coverageItems: [created, ...state.coverageItems] }))
  return created
}

export function updateCoverageItem(
  orgId: string,
  id: string,
  patch: Partial<CommsCoverageItem>,
): CommsCoverageItem | null {
  let result: CommsCoverageItem | null = null
  updateState(orgId, (state) => ({
    ...state,
    coverageItems: state.coverageItems.map((c) => {
      if (c.id !== id) return c
      result = { ...c, ...patch }
      return result
    }),
  }))
  return result
}

export function removeCoverageItem(orgId: string, id: string): void {
  updateState(orgId, (state) => ({
    ...state,
    coverageItems: state.coverageItems.filter((c) => c.id !== id),
  }))
}

export function addSubmission(orgId: string, submission: Omit<CommsSubmission, 'id'>): CommsSubmission {
  const created: CommsSubmission = { ...submission, id: createId('submission') }
  updateState(orgId, (state) => ({ ...state, submissions: [created, ...state.submissions] }))
  return created
}

export function updateSubmission(
  orgId: string,
  id: string,
  patch: Partial<CommsSubmission>,
): CommsSubmission | null {
  let result: CommsSubmission | null = null
  updateState(orgId, (state) => ({
    ...state,
    submissions: state.submissions.map((s) => {
      if (s.id !== id) return s
      result = { ...s, ...patch }
      return result
    }),
  }))
  return result
}

export function removeSubmission(orgId: string, id: string): void {
  updateState(orgId, (state) => ({
    ...state,
    submissions: state.submissions.filter((s) => s.id !== id),
  }))
}

export function transitionSubmissionStatus(
  orgId: string,
  id: string,
  nextStatus: CommsSubmissionStatus,
  actor = 'Workspace user',
): CommsSubmission | null {
  const submission = loadCommsState(orgId).submissions.find((s) => s.id === id)
  if (!submission) return null
  const valid: Record<CommsSubmissionStatus, CommsSubmissionStatus[]> = {
    planned: ['submitted', 'withdrawn'],
    submitted: ['recorded', 'planned'],
    recorded: ['planned'],
    withdrawn: ['planned'],
  }
  if (!valid[submission.status].includes(nextStatus)) return null
  const patch: Partial<CommsSubmission> = { status: nextStatus }
  if (nextStatus === 'submitted' && !submission.submittedAt) {
    patch.submittedAt = new Date().toISOString().slice(0, 10)
  }
  if (nextStatus === 'recorded') {
    patch.owner = actor
  }
  return updateSubmission(orgId, id, patch)
}

export type SubmissionDueStatus = 'overdue' | 'due-soon' | 'ok'

export function getSubmissionDueStatus(deadline?: string): SubmissionDueStatus {
  if (!deadline) return 'ok'
  const [year = 0, month = 1, day = 1] = deadline.split('-').map((n) => Number(n))
  const due = Date.UTC(year, month - 1, day)
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  if (Number.isNaN(due)) return 'ok'
  if (due < today) return 'overdue'
  const days = (due - today) / (1000 * 60 * 60 * 24)
  if (days <= 7) return 'due-soon'
  return 'ok'
}

export function addFeed(orgId: string, feed: Omit<CommsFeed, 'id'>): CommsFeed {
  const created: CommsFeed = { ...feed, id: createId('feed') }
  updateState(orgId, (state) => ({ ...state, feeds: [created, ...state.feeds] }))
  return created
}

export function updateFeed(orgId: string, id: string, patch: Partial<CommsFeed>): CommsFeed | null {
  let result: CommsFeed | null = null
  updateState(orgId, (state) => ({
    ...state,
    feeds: state.feeds.map((f) => {
      if (f.id !== id) return f
      result = { ...f, ...patch }
      return result
    }),
  }))
  return result
}

export function removeFeed(orgId: string, id: string): void {
  updateState(orgId, (state) => ({
    ...state,
    feeds: state.feeds.filter((f) => f.id !== id),
  }))
}

export interface FeedSyncResult {
  added: number
  coverageDrafts?: number
  error?: string
}

const COVERAGE_SOURCE_TYPES = new Set<CommsSourceType>(['news', 'social', 'press_release'])

export async function syncFeed(orgId: string, feedId: string): Promise<FeedSyncResult> {
  const feed = loadCommsState(orgId).feeds.find((f) => f.id === feedId)
  if (!feed) return { added: 0, error: 'Feed not found' }
  if (typeof fetch === 'undefined') return { added: 0, error: 'Fetch not available' }

  try {
    const response = await fetch(feed.url)
    if (!response.ok) {
      updateFeed(orgId, feedId, {
        lastFetchedAt: new Date().toISOString(),
        lastFetchStatus: 'error',
        lastFetchMessage: `HTTP ${response.status}`,
      })
      return { added: 0, error: `HTTP ${response.status}` }
    }
    const xml = await response.text()
    const items = parseFeedXml(xml, feed.label.en)
    const state = loadCommsState(orgId)
    const existingUrls = new Set(state.sources.map((s) => s.url).filter(Boolean))
    const existingCoverageUrls = new Set(state.coverageItems.map((c) => c.url).filter(Boolean))
    const createCoverageDrafts = feed.createCoverageDrafts && COVERAGE_SOURCE_TYPES.has(feed.sourceType)
    let added = 0
    let coverageDrafts = 0
    for (const item of items) {
      if (!item.url || existingUrls.has(item.url)) continue
      const source = feedItemToSource(
        item,
        feed.label,
        { en: feed.sourceType, fr: feed.sourceType },
        feed.initiativeId,
      )
      const created = addSource(orgId, source)
      existingUrls.add(item.url)
      added++
      if (created && createCoverageDrafts && !existingCoverageUrls.has(item.url)) {
        addCoverageItem(orgId, {
          sourceId: created.id,
          initiativeId: feed.initiativeId,
          outlet: created.publisher,
          headline: { en: item.title, fr: item.title },
          language: 'en',
          publishedDate: item.publishedDate ? item.publishedDate.slice(0, 10) : undefined,
          url: item.url,
          reach: 0,
          provenance: 'provider',
          owner: 'Feed monitor',
          notes: {
            en: 'Reach and sentiment need to be confirmed.',
            fr: 'La portée et le sentiment doivent être confirmés.',
          },
        })
        existingCoverageUrls.add(item.url)
        coverageDrafts++
      }
    }
    const message = coverageDrafts > 0
      ? `${added} source${added === 1 ? '' : 's'}, ${coverageDrafts} coverage draft${coverageDrafts === 1 ? '' : 's'}`
      : `${added} source${added === 1 ? '' : 's'}`
    updateFeed(orgId, feedId, {
      lastFetchedAt: new Date().toISOString(),
      lastFetchStatus: 'ok',
      lastFetchMessage: message,
    })
    return { added, coverageDrafts }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    updateFeed(orgId, feedId, {
      lastFetchedAt: new Date().toISOString(),
      lastFetchStatus: 'error',
      lastFetchMessage: message,
    })
    return { added: 0, error: message }
  }
}

export async function syncAllFeeds(orgId: string): Promise<(FeedSyncResult & { feedId: string })[]> {
  const feeds = loadCommsState(orgId).feeds.filter((f) => f.enabled)
  const results = await Promise.all(feeds.map((f) => syncFeed(orgId, f.id)))
  return results.map((r, i) => ({ ...r, feedId: feeds[i]!.id }))
}

export function loadFullState(orgId: string): CommsWorkspaceState {
  return clone(loadCommsState(orgId))
}
