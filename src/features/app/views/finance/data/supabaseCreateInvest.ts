import type {
  FinanceCashSweep,
  FinanceDecisionEntry,
  FinanceDocumentLink,
  FinanceWatchlistItem,
} from './types'
import {
  mapCapitalCall,
  mapCashSweep,
  mapCommitment,
  mapDeal,
  mapDecisionEntry,
  mapDocumentLink,
  mapWatchlistItem,
} from './supabaseMappers'
import { TABLES, supabase } from './supabaseTables'

export async function addWatchlistItemInSupabase(
  orgId: string,
  item: Omit<FinanceWatchlistItem, 'id'>,
): Promise<FinanceWatchlistItem | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.watchlistItems)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      symbol: item.symbol || null,
      label: item.label,
      asset_class: item.assetClass,
      thesis: item.thesis ?? null,
      target_low: item.targetLow ? Number(item.targetLow) : null,
      target_high: item.targetHigh ? Number(item.targetHigh) : null,
      currency: item.currency,
      status: item.status,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapWatchlistItem(data as Record<string, unknown>)
}

export async function transitionWatchlistStatusInSupabase(
  orgId: string,
  id: string,
  status: FinanceWatchlistItem['status'],
): Promise<FinanceWatchlistItem | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.watchlistItems)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapWatchlistItem(data as Record<string, unknown>)
}

export async function addDecisionEntryInSupabase(
  orgId: string,
  item: Omit<FinanceDecisionEntry, 'id'>,
): Promise<FinanceDecisionEntry | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.decisionEntries)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      holding_id: item.holdingId ?? null,
      watchlist_item_id: item.watchlistItemId ?? null,
      decision: item.decision,
      decided_at: item.decidedAt,
      summary: item.summary,
      rationale: item.rationale ?? null,
      review_date: item.reviewDate ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapDecisionEntry(data as Record<string, unknown>)
}

export async function updateDecisionOutcomeInSupabase(
  orgId: string,
  id: string,
  outcome: import('@/i18n/core').Bi,
): Promise<FinanceDecisionEntry | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.decisionEntries)
    .update({ outcome, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapDecisionEntry(data as Record<string, unknown>)
}

/* ---------- Deals pipeline ---------- */

export async function addDealInSupabase(
  orgId: string,
  item: Omit<import('./types').FinanceDeal, 'id'>,
): Promise<import('./types').FinanceDeal | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.deals)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      name: item.name,
      kind: item.kind,
      stage: item.stage,
      counterparty: item.counterparty ?? null,
      value: item.value ? Number(item.value) : null,
      currency: item.currency,
      target_date: item.targetDate ?? null,
      owner: item.owner ?? null,
      notes: item.notes ?? null,
      watchlist_item_id: item.watchlistItemId ?? null,
      holding_id: item.holdingId ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapDeal(data as Record<string, unknown>)
}

export async function updateDealInSupabase(
  orgId: string,
  id: string,
  patch: Partial<Omit<import('./types').FinanceDeal, 'id'>>,
): Promise<import('./types').FinanceDeal | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.deals)
    .update({
      /* Same Partial contract as updateEntityInSupabase — absent keys are
         dropped from the payload, present keys write (or clear). */
      ...(patch.entityId !== undefined ? { entity_id: patch.entityId } : {}),
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
      ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
      ...(patch.counterparty !== undefined ? { counterparty: patch.counterparty || null } : {}),
      ...(patch.value !== undefined ? { value: patch.value ? Number(patch.value) : null } : {}),
      ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
      ...(patch.targetDate !== undefined ? { target_date: patch.targetDate || null } : {}),
      ...(patch.owner !== undefined ? { owner: patch.owner || null } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
      ...(patch.watchlistItemId !== undefined
        ? { watchlist_item_id: patch.watchlistItemId || null }
        : {}),
      ...(patch.holdingId !== undefined ? { holding_id: patch.holdingId || null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapDeal(data as Record<string, unknown>)
}

export async function transitionDealStageInSupabase(
  orgId: string,
  id: string,
  stage: import('./types').FinanceDealStage,
): Promise<import('./types').FinanceDeal | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.deals)
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapDeal(data as Record<string, unknown>)
}

export async function removeDealInSupabase(orgId: string, id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from(TABLES.deals)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}

/* ---------- Capital commitments ---------- */

export async function addCommitmentInSupabase(
  orgId: string,
  item: Omit<import('./types').FinanceCommitment, 'id'>,
): Promise<import('./types').FinanceCommitment | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.commitments)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      party_id: item.partyId,
      label: item.label ?? null,
      committed: Number(item.committed || 0),
      called: Number(item.called || 0),
      currency: item.currency,
      next_call_date: item.nextCallDate ?? null,
      status: item.status,
      notes: item.notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapCommitment(data as Record<string, unknown>)
}

export async function updateCommitmentInSupabase(
  orgId: string,
  id: string,
  patch: Partial<Omit<import('./types').FinanceCommitment, 'id'>>,
): Promise<import('./types').FinanceCommitment | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.commitments)
    .update({
      /* Same Partial contract as updateDealInSupabase — absent keys drop
         out of the payload, present keys write (or clear). */
      ...(patch.entityId !== undefined ? { entity_id: patch.entityId } : {}),
      ...(patch.partyId !== undefined ? { party_id: patch.partyId } : {}),
      ...(patch.label !== undefined ? { label: patch.label ?? null } : {}),
      ...(patch.committed !== undefined ? { committed: Number(patch.committed || 0) } : {}),
      ...(patch.called !== undefined ? { called: Number(patch.called || 0) } : {}),
      ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
      ...(patch.nextCallDate !== undefined ? { next_call_date: patch.nextCallDate || null } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapCommitment(data as Record<string, unknown>)
}

export async function removeCommitmentInSupabase(orgId: string, id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from(TABLES.commitments)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}

/* ---------- Treasury cash sweeps ---------- */

export async function addCashSweepInSupabase(
  orgId: string,
  item: Omit<FinanceCashSweep, 'id'>,
): Promise<FinanceCashSweep | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.cashSweeps)
    .insert({
      organization_id: orgId,
      entity_id: item.entityId,
      from_account_id: item.fromAccountId,
      to_account_id: item.toAccountId,
      amount: Number(item.amount || 0),
      currency: item.currency,
      status: item.status,
      scheduled_date: item.scheduledDate,
      executed_date: item.executedDate ?? null,
      reference: item.reference ?? null,
      notes: item.notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapCashSweep(data as Record<string, unknown>)
}

export async function updateCashSweepInSupabase(
  orgId: string,
  id: string,
  patch: Partial<Omit<FinanceCashSweep, 'id'>>,
): Promise<FinanceCashSweep | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.cashSweeps)
    .update({
      ...(patch.entityId !== undefined ? { entity_id: patch.entityId } : {}),
      ...(patch.fromAccountId !== undefined ? { from_account_id: patch.fromAccountId } : {}),
      ...(patch.toAccountId !== undefined ? { to_account_id: patch.toAccountId } : {}),
      ...(patch.amount !== undefined ? { amount: Number(patch.amount || 0) } : {}),
      ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.scheduledDate !== undefined ? { scheduled_date: patch.scheduledDate } : {}),
      ...(patch.executedDate !== undefined ? { executed_date: patch.executedDate || null } : {}),
      ...(patch.reference !== undefined ? { reference: patch.reference ?? null } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapCashSweep(data as Record<string, unknown>)
}

export async function removeCashSweepInSupabase(orgId: string, id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from(TABLES.cashSweeps)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}

export async function transitionCashSweepStatusInSupabase(
  orgId: string,
  id: string,
  status: FinanceCashSweep['status'],
): Promise<FinanceCashSweep | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.cashSweeps)
    .update({
      status,
      ...(status === 'executed' ? { executed_date: new Date().toISOString().slice(0, 10) } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapCashSweep(data as Record<string, unknown>)
}

/* ---------- Capital calls ---------- */

/**
 * Bumps a commitment's `called` ledger by `delta` (can be negative).
 * Reads the row fresh so concurrent-ish edits don't need client state;
 * the `called <= committed` CHECK on finance_commitments makes an
 * over-commitment write fail, which the caller surfaces as an error.
 */
async function bumpCommitmentCalled(
  orgId: string,
  commitmentId: string,
  delta: number,
): Promise<void> {
  const { data: cur, error: readErr } = await supabase
    .from(TABLES.commitments)
    .select('called, committed')
    .eq('organization_id', orgId)
    .eq('id', commitmentId)
    .single()
  if (readErr) throw readErr
  const next = Math.max(0, Math.round((Number(cur.called ?? 0) + delta) * 100) / 100)
  const { error } = await supabase
    .from(TABLES.commitments)
    .update({ called: next, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .eq('id', commitmentId)
  if (error) throw error
}

export async function addCapitalCallInSupabase(
  orgId: string,
  item: Omit<import('./types').FinanceCapitalCall, 'id'>,
): Promise<import('./types').FinanceCapitalCall | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.capitalCalls)
    .insert({
      organization_id: orgId,
      commitment_id: item.commitmentId,
      amount: Number(item.amount || 0),
      due_date: item.dueDate,
      status: item.status,
      reference: item.reference ?? null,
      received_date: item.receivedDate ?? null,
      notes: item.notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  const created = mapCapitalCall(data as Record<string, unknown>)
  if (created.status === 'received') {
    try {
      await bumpCommitmentCalled(orgId, created.commitmentId, Number(created.amount))
    } catch (e) {
      // Roll back the insert so a rejected bump can't leave a phantom
      // received call that never reached the ledger.
      await supabase
        .from(TABLES.capitalCalls)
        .delete()
        .eq('organization_id', orgId)
        .eq('id', created.id)
      throw e
    }
  }
  return created
}

export async function updateCapitalCallInSupabase(
  orgId: string,
  id: string,
  patch: Partial<Omit<import('./types').FinanceCapitalCall, 'id'>>,
): Promise<import('./types').FinanceCapitalCall | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.capitalCalls)
    .update({
      ...(patch.commitmentId !== undefined ? { commitment_id: patch.commitmentId } : {}),
      ...(patch.amount !== undefined ? { amount: Number(patch.amount || 0) } : {}),
      ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.reference !== undefined ? { reference: patch.reference || null } : {}),
      ...(patch.receivedDate !== undefined ? { received_date: patch.receivedDate || null } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapCapitalCall(data as Record<string, unknown>)
}

export async function removeCapitalCallInSupabase(orgId: string, id: string): Promise<boolean> {
  if (!supabase) return false
  const { data: cur, error: readErr } = await supabase
    .from(TABLES.capitalCalls)
    .select('commitment_id, amount, status')
    .eq('organization_id', orgId)
    .eq('id', id)
    .single()
  if (readErr) throw readErr
  if (cur.status === 'received') {
    await bumpCommitmentCalled(orgId, cur.commitment_id, -Number(cur.amount))
  }
  const { error } = await supabase
    .from(TABLES.capitalCalls)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}

/**
 * Lifecycle transition for a call. Moving into `received` bumps the
 * parent commitment's `called`; moving back out decrements it. The bump
 * runs first so a CHECK violation on `called <= committed` aborts the
 * transition rather than recording money the ledger can't hold.
 */
export async function transitionCapitalCallStatusInSupabase(
  orgId: string,
  id: string,
  nextStatus: import('./types').FinanceCapitalCallStatus,
): Promise<import('./types').FinanceCapitalCall | null> {
  if (!supabase) return null
  const { data: cur, error: readErr } = await supabase
    .from(TABLES.capitalCalls)
    .select('commitment_id, amount, status')
    .eq('organization_id', orgId)
    .eq('id', id)
    .single()
  if (readErr) throw readErr
  const wasReceived = cur.status === 'received'
  const willBeReceived = nextStatus === 'received'
  if (wasReceived === willBeReceived) {
    return updateCapitalCallInSupabase(orgId, id, { status: nextStatus })
  }
  await bumpCommitmentCalled(
    orgId,
    cur.commitment_id,
    willBeReceived ? Number(cur.amount) : -Number(cur.amount),
  )
  return updateCapitalCallInSupabase(orgId, id, {
    status: nextStatus,
    receivedDate: willBeReceived ? new Date().toISOString().slice(0, 10) : '',
  })
}

/* ---------- Deal/holding document links (migration 0175) ---------- */

export async function addDocumentLinkInSupabase(
  orgId: string,
  item: Omit<FinanceDocumentLink, 'id'>,
): Promise<FinanceDocumentLink | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLES.documentLinks)
    .insert({
      organization_id: orgId,
      deal_id: item.dealId ?? null,
      holding_id: item.holdingId ?? null,
      document_id: item.documentId,
      document_ref: item.documentRef ?? null,
      title: item.title ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapDocumentLink(data as Record<string, unknown>)
}

export async function removeDocumentLinkInSupabase(orgId: string, id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from(TABLES.documentLinks)
    .delete()
    .eq('organization_id', orgId)
    .eq('id', id)
  if (error) throw error
  return true
}
