import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'
import { knowledgeItems } from '@/data'
import { allTemplates } from '@/features/app/documents/catalogue'
import { listDocuments } from '@/features/app/documents/productionApi'
import { referenceGuides } from '@/features/app/reference/data'
import { listCases } from '@/features/app/views/cases/productionApi'
import { listCommunications } from '@/features/app/views/communications/productionApi'
import { sensitiveCaseTypes } from '@/features/app/views/cases/caseModel'
import { listFindings } from '@/features/app/views/compliance/productionApi'
import { listEmployees } from '@/features/app/views/employees/productionApi'
import { listOwnConversations } from '@/features/app/views/memory/conversationsApi'
import { listPolicies } from '@/features/app/views/policies/productionApi'
import { listTasks } from '@/features/app/views/tasks/productionApi'
import { searchMessages as M } from '@/i18n/messages/search'
import { flowSearchEntries } from './searchCorpus'
import type { SearchEntry } from './searchCorpus'

const DOT = ' · '

function joinBi(parts: Bi[], separator = DOT): Bi {
  return bi(parts.map((p) => p.en).join(separator), parts.map((p) => p.fr).join(separator))
}

function neutral(text: string): Bi {
  return bi(text, text)
}

function conversationTitle(messages: { role: string; content: string }[]): Bi {
  const firstUser = messages.find((m) => m.role === 'user')?.content?.trim()
  if (!firstUser) return bi('Advisor conversation', 'Conversation du Conseiller')
  const clipped = firstUser.length > 72 ? `${firstUser.slice(0, 69)}…` : firstUser
  return neutral(clipped)
}

/**
 * Build the global-search corpus from live org data (production mode).
 * Client-side filter reuses filterSearchEntriesFrom in searchCorpus.ts.
 */
export async function buildProductionSearchEntries(organizationId: string): Promise<SearchEntry[]> {
  const [employees, cases, conversations, documents, comms, tasks, findings, policies] =
    await Promise.all([
      listEmployees(organizationId),
      listCases(organizationId),
      listOwnConversations(24),
      listDocuments(organizationId),
      listCommunications(organizationId),
      listTasks(organizationId),
      listFindings(organizationId),
      listPolicies(organizationId),
    ])

  const personEntries: SearchEntry[] = employees.map((e) => ({
    id: `emp-${e.id}`,
    kind: 'person',
    kindLabel: M.search_kind_person,
    title: neutral(e.name),
    sub: joinBi([neutral(e.title ?? ''), neutral(e.jurisdiction)]),
    restricted: false,
    match: joinBi([neutral(e.name), neutral(e.title ?? ''), neutral(e.jurisdiction)]),
    nav: { kind: 'employee', employeeId: e.id },
  }))

  const caseEntries: SearchEntry[] = cases.map((c) => ({
    id: `case-${c.id}`,
    kind: 'case',
    kindLabel: M.search_kind_case,
    title: neutral(c.title),
    sub: joinBi([neutral(c.caseType), neutral(c.jurisdiction), neutral(c.status)]),
    restricted: sensitiveCaseTypes.includes(c.caseType),
    match: joinBi([neutral(c.title), neutral(c.caseType)]),
    nav: { kind: 'case', caseId: c.id },
  }))

  const chatEntries: SearchEntry[] = conversations.map((c) => {
    const title = conversationTitle(c.messages)
    return {
      id: c.id,
      kind: 'chat',
      kindLabel: M.search_kind_conversation,
      title,
      restricted: false,
      match: title,
      nav: { kind: 'chat', chatId: c.id },
    }
  })

  const templateEntries: SearchEntry[] = allTemplates.map((d) => ({
    id: `doc-${d.tid}`,
    kind: 'document',
    kindLabel: M.search_kind_document,
    title: d.name,
    sub: d.risk === 'high' ? joinBi([d.name, M.search_doc_high_risk_suffix]) : d.name,
    restricted: d.risk === 'high',
    match: d.name,
    nav: { kind: 'document', docKey: d.tid },
  }))

  const generatedEntries: SearchEntry[] = documents.map((d) => ({
    id: `gen-${d.id}`,
    kind: 'document',
    kindLabel: M.search_kind_document,
    title: d.title,
    sub: joinBi([neutral(d.ref), neutral(d.status)]),
    restricted: d.reviewStatus === 'hr_review_required' || d.reviewStatus === 'not_reviewed',
    match: joinBi([d.title, neutral(d.ref)]),
    nav: { kind: 'generatedDocument', docId: d.id },
  }))

  const commsEntries: SearchEntry[] = comms.map((c) => ({
    id: `comm-${c.id}`,
    kind: 'comms',
    kindLabel: M.search_kind_comms,
    title: neutral(c.title),
    sub: joinBi([neutral(c.audience ?? ''), neutral(c.status)]),
    restricted: false,
    match: neutral(c.title),
    nav: { kind: 'view', view: 'communications' },
  }))

  const taskEntries: SearchEntry[] = tasks.map((t) => ({
    id: `task-${t.id}`,
    kind: 'task',
    kindLabel: M.search_kind_task,
    title: neutral(t.title),
    sub: t.dueDate ? neutral(t.dueDate) : undefined,
    restricted: false,
    match: neutral(t.title),
    nav: { kind: 'view', view: 'tasks' },
  }))

  const complianceEntries: SearchEntry[] = findings
    .filter((f) => !f.resolved)
    .map((f) => ({
      id: `ci-${f.id}`,
      kind: 'compliance',
      kindLabel: M.search_kind_compliance,
      title: neutral(f.title),
      sub: joinBi([neutral(f.severity), neutral(f.status)]),
      restricted: false,
      match: neutral(f.title),
      nav: { kind: 'view', view: 'compliance' },
    }))

  const policyEntries: SearchEntry[] = policies.map((p) => ({
    id: `pol-${p.id}`,
    kind: 'policy',
    kindLabel: M.search_kind_policy,
    title: neutral(p.name),
    sub: joinBi([neutral(p.status), neutral(p.lastReviewed ?? '')]),
    restricted: false,
    match: neutral(p.name),
    nav: { kind: 'view', view: 'policies' },
  }))

  const knowledgeEntries: SearchEntry[] = [
    ...knowledgeItems.map((k) => ({
      id: `kb-${k.id}`,
      kind: 'knowledge' as const,
      kindLabel: M.search_kind_knowledge,
      title: k.title,
      restricted: false,
      match: k.title,
      nav: { kind: 'view' as const, view: 'knowledge' as const },
    })),
    ...referenceGuides.map((g) => ({
      id: `ref-${g.slug}`,
      kind: 'knowledge' as const,
      kindLabel: M.search_kind_knowledge,
      title: g.title,
      restricted: false,
      match: g.title,
      nav: { kind: 'view' as const, view: 'knowledge' as const },
    })),
  ]

  return [
    ...personEntries,
    ...caseEntries,
    ...chatEntries,
    ...templateEntries,
    ...generatedEntries,
    ...commsEntries,
    ...taskEntries,
    ...complianceEntries,
    ...policyEntries,
    ...knowledgeEntries,
    ...flowSearchEntries,
  ]
}

/** Pinned chats in production — most recent three conversations. */
export function pinnedProductionChats(entries: readonly SearchEntry[]): SearchEntry[] {
  return entries
    .filter((e) => e.kind === 'chat')
    .slice(0, 3)
    .map((e) => ({ ...e, kindLabel: M.search_pinned }))
}
