import type { Bi, Lang } from '@/i18n/core'
import { bi, pick } from '@/i18n/core'
import { searchMessages as M } from '@/i18n/messages/search'
import { sensitiveCaseTypes } from '@/features/app/views/cases/caseModel'
import {
  cases,
  chats,
  communications,
  complianceItems,
  employees,
  knowledgeItems,
  policies,
  tasks,
} from '@/data'
import { allTemplates } from '@/features/app/documents/catalogue'
import { flows } from '@/features/app/flows/data'

/**
 * Global-search corpus — typed transcription of the prototype's
 * `buildSearchView()` (App v2.dc.html, lines 4066–4093). Every searchable
 * entity domain contributes entries: People, Cases, Conversations, Documents,
 * Comms, Tasks, Compliance, Policies, Knowledge. Entries store `Bi` fields so
 * a live language toggle re-localizes titles, subs and match text.
 */

/* ------------------------------------------------------------------- tabs */

export type SearchTabKey = 'all' | 'people' | 'cases' | 'chats' | 'documents' | 'knowledge'

export const searchTabs: ReadonlyArray<{ key: SearchTabKey; label: Bi }> = [
  { key: 'all', label: M.search_tab_all },
  { key: 'people', label: M.search_tab_people },
  { key: 'cases', label: M.search_tab_cases },
  { key: 'chats', label: M.search_tab_chats },
  { key: 'documents', label: M.search_tab_documents },
  { key: 'knowledge', label: M.search_tab_knowledge },
]

/* ---------------------------------------------------------------- entries */

export type SearchEntryKind =
  | 'person'
  | 'case'
  | 'chat'
  | 'document'
  | 'comms'
  | 'task'
  | 'compliance'
  | 'policy'
  | 'knowledge'
  | 'workflow'

/**
 * Where a result navigates. The overlay resolves these to react-router
 * routes (CONVENTIONS.md route table).
 */
export type SearchNav =
  | { kind: 'employee'; employeeId: string }
  | { kind: 'case'; caseId: string }
  | { kind: 'chat'; chatId: string }
  | { kind: 'document'; docKey: string }
  | { kind: 'generatedDocument'; docId: string }
  | { kind: 'workflow'; flowSlug: string }
  | { kind: 'view'; view: 'communications' | 'tasks' | 'compliance' | 'policies' | 'knowledge' }

/** Router `location.state` for chat results (prototype `selectChat(c.id)`). */
export interface AdvisorSearchNavState {
  chatId: string
}

/** Router `location.state` for document results (prototype
 *  `openDocFromLibrary(title, category)`). */
export interface TemplatesSearchNavState {
  docKey: string
}

export interface SearchEntry {
  /** Unique across the corpus — mirrors the prototype's result ids. */
  id: string
  kind: SearchEntryKind
  kindLabel: Bi
  title: Bi
  sub?: Bi
  /** Shows the gold lock badge (sensitive cases, high-risk documents). */
  restricted: boolean
  /** Text the query is matched against — the fields the prototype filters on. */
  match: Bi
  nav: SearchNav
}

/** ` · ` joiner used by every prototype sub line. */
const DOT = ' · '

function joinBi(parts: Bi[], separator = DOT): Bi {
  return bi(parts.map((p) => p.en).join(separator), parts.map((p) => p.fr).join(separator))
}

function concatBi(...parts: Bi[]): Bi {
  return joinBi(parts, '')
}

/** Language-neutral text (names, owners, ids) as a Bi pair. */
function neutral(text: string): Bi {
  return bi(text, text)
}

/* Case types whose results carry the Restricted badge — single source in the
   cases feature (prototype `sensitiveCaseTypes()`). */
const SENSITIVE_CASE_TYPES: readonly string[] = sensitiveCaseTypes

/* Prototype order within the All tab: people, cases, chats, docs, comms,
   tasks, compliance, policies, knowledge (`byTab.all`). */

const personEntries: SearchEntry[] = employees.map((e) => ({
  id: `emp-${e.id}`,
  kind: 'person',
  kindLabel: M.search_kind_person,
  title: neutral(e.name),
  sub: joinBi([e.role, e.jurisdiction]),
  restricted: false,
  match: joinBi([neutral(e.name), e.role, e.jurisdiction]),
  nav: { kind: 'employee', employeeId: e.id },
}))

const caseEntries: SearchEntry[] = cases.map((c) => ({
  id: `case-${c.id}`,
  kind: 'case',
  kindLabel: M.search_kind_case,
  title: c.title,
  sub: joinBi([c.typeLabel, c.province, c.status, neutral(c.owner)]),
  restricted: SENSITIVE_CASE_TYPES.includes(c.type),
  match: joinBi([c.title, c.typeLabel]),
  nav: { kind: 'case', caseId: c.id },
}))

const chatEntries: SearchEntry[] = chats.map((c) => ({
  id: c.id,
  kind: 'chat',
  kindLabel: M.search_kind_conversation,
  title: c.title,
  restricted: false,
  match: c.title,
  nav: { kind: 'chat', chatId: c.id },
}))

const documentEntries: SearchEntry[] = allTemplates.map((d) => ({
  id: `doc-${d.tid}`,
  kind: 'document',
  kindLabel: M.search_kind_document,
  title: d.name,
  sub: d.risk === 'high' ? concatBi(d.name, M.search_doc_high_risk_suffix) : d.name,
  restricted: d.risk === 'high',
  match: d.name,
  nav: { kind: 'document', docKey: d.tid },
}))

const commsEntries: SearchEntry[] = communications.map((c) => ({
  id: `comm-${c.id}`,
  kind: 'comms',
  kindLabel: M.search_kind_comms,
  title: c.title,
  sub: joinBi([c.audience, c.status]),
  restricted: false,
  match: c.title,
  nav: { kind: 'view', view: 'communications' },
}))

const taskEntries: SearchEntry[] = tasks.map((t) => ({
  id: `task-${t.id}`,
  kind: 'task',
  kindLabel: M.search_kind_task,
  title: t.title,
  sub: t.due,
  restricted: false,
  match: t.title,
  nav: { kind: 'view', view: 'tasks' },
}))

const complianceEntries: SearchEntry[] = complianceItems.map((ci) => ({
  id: `ci-${ci.id}`,
  kind: 'compliance',
  kindLabel: M.search_kind_compliance,
  title: ci.title,
  sub: joinBi([ci.severityLabel, ci.province]),
  restricted: false,
  match: ci.title,
  nav: { kind: 'view', view: 'compliance' },
}))

const policyEntries: SearchEntry[] = policies.map((p) => ({
  id: `pol-${p.id}`,
  kind: 'policy',
  kindLabel: M.search_kind_policy,
  title: p.title,
  sub: joinBi([p.status, p.updated]),
  restricted: false,
  match: p.title,
  nav: { kind: 'view', view: 'policies' },
}))

const knowledgeEntries: SearchEntry[] = knowledgeItems.map((k) => ({
  id: `kb-${k.id}`,
  kind: 'knowledge',
  kindLabel: M.search_kind_knowledge,
  title: k.title,
  restricted: false,
  match: k.title,
  nav: { kind: 'view', view: 'knowledge' },
}))

/** Guided flows + calculators — real in both demo and production. */
export const flowSearchEntries: readonly SearchEntry[] = flows.map((f) => ({
  id: `flow-${f.slug}`,
  kind: 'workflow',
  kindLabel: M.search_kind_workflow,
  title: f.title,
  sub: f.summary,
  restricted: false,
  match: joinBi([f.title, f.summary]),
  nav: { kind: 'workflow', flowSlug: f.slug },
}))

/** Full corpus in the prototype's All-tab order. */
export const searchEntries: readonly SearchEntry[] = [
  ...personEntries,
  ...caseEntries,
  ...chatEntries,
  ...documentEntries,
  ...commsEntries,
  ...taskEntries,
  ...complianceEntries,
  ...policyEntries,
  ...knowledgeEntries,
  ...flowSearchEntries,
]

/** Pinned conversations shown while the query is empty (gold kind label). */
export const pinnedChatEntries: readonly SearchEntry[] = chats
  .filter((c) => c.pinned)
  .map((c) => ({
    id: c.id,
    kind: 'chat',
    kindLabel: M.search_pinned,
    title: c.title,
    restricted: false,
    match: c.title,
    nav: { kind: 'chat', chatId: c.id },
  }))

/* -------------------------------------------------------------- filtering */

const TAB_KINDS: Record<Exclude<SearchTabKey, 'all'>, SearchEntryKind> = {
  people: 'person',
  cases: 'case',
  chats: 'chat',
  documents: 'document',
  knowledge: 'knowledge',
}

export function filterSearchEntriesFrom(
  entries: readonly SearchEntry[],
  tab: SearchTabKey,
  query: string,
  lang: Lang,
): SearchEntry[] {
  const q = query.toLowerCase()
  const scoped = tab === 'all' ? entries : entries.filter((e) => e.kind === TAB_KINDS[tab])
  if (!q) return [...scoped]
  return scoped.filter((e) => pick(e.match, lang).toLowerCase().includes(q))
}

/**
 * Prototype filter semantics: an empty query passes everything; otherwise a
 * case-insensitive substring match. The prototype matches its (EN) state
 * strings and translates at render; here entries match in the CURRENT
 * language so FR users can search FR titles (names/ids are in both).
 */
export function filterSearchEntries(tab: SearchTabKey, query: string, lang: Lang): SearchEntry[] {
  return filterSearchEntriesFrom(searchEntries, tab, query, lang)
}
