import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, FileText, Lock, Search } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import type { WorkspaceMessageKey } from '@/i18n/messages'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useDoclib } from '../doclibContext'
import { can } from '../engine'
import { DocChip, JurisdictionPill, Skel } from '../components'
import { RepositoryProductionView } from './RepositoryProductionView'
import {
  documentStatusInfo,
  reviewStatusInfo,
  riskLevelInfo,
  signatureStatusInfo,
  workspaceRoles,
} from '../data'
import type {
  DocChipTone,
  DocEmployee,
  DocRiskLevel,
  DocStatus,
  GeneratedDoc,
  Jurisdiction,
  ReviewStatus,
  SignatureStatus,
} from '../data'

/**
 * /app/documents — the Document repository (handoff screen 04): the org's
 * generated documents in a filterable 8-column register. Desktop renders a
 * real table; below 768px each document becomes a stacked label/value card
 * (the handoff explicitly chose stacking over horizontal scroll).
 */

const SELECT_CLASS =
  'cursor-pointer rounded-[9px] border border-border bg-surface px-[10px] py-[7px] text-[12.5px] font-medium text-text'
const TH_CLASS =
  'px-[14px] py-[11px] text-left text-[11px] font-bold tracking-[0.04em] text-text-muted uppercase whitespace-nowrap'
const TD_CLASS = 'px-[14px] py-[12px] align-middle'

const DOC_STATUSES = Object.keys(documentStatusInfo) as DocStatus[]
const REVIEW_STATUSES = Object.keys(reviewStatusInfo) as ReviewStatus[]
const SIGNATURE_STATUSES = Object.keys(signatureStatusInfo) as SignatureStatus[]
const RISK_LEVELS = Object.keys(riskLevelInfo) as DocRiskLevel[]
const JURISDICTIONS: Jurisdiction[] = ['ON', 'QC', 'FED']

type GroupKey = 'none' | 'employee' | 'status' | 'category'
const GROUP_KEYS: GroupKey[] = ['none', 'employee', 'status', 'category']
const GROUP_LABEL_KEY: Record<GroupKey, WorkspaceMessageKey> = {
  none: 'doclib_repo_groupNone',
  employee: 'doclib_repo_groupEmployee',
  status: 'doclib_repo_groupStatus',
  category: 'doclib_repo_groupCategory',
}

interface RepoFilters {
  status: string
  review: string
  signature: string
  risk: string
  jurisdiction: string
  employee: string
}

const NO_FILTERS: RepoFilters = {
  status: 'all',
  review: 'all',
  signature: 'all',
  risk: 'all',
  jurisdiction: 'all',
  employee: 'all',
}

interface DocGroup {
  key: string
  heading: string
  docs: GeneratedDoc[]
}

const docHref = (doc: GeneratedDoc): string => `/app/documents/${doc.id}`

function matchesFilters(doc: GeneratedDoc, filters: RepoFilters, query: string, showArchived: boolean) {
  if (doc.archived && !showArchived) return false
  if (filters.status !== 'all' && doc.status !== filters.status) return false
  if (filters.review !== 'all' && doc.reviewStatus !== filters.review) return false
  if (filters.signature !== 'all' && doc.signatureStatus !== filters.signature) return false
  if (filters.risk !== 'all' && doc.risk !== filters.risk) return false
  if (filters.jurisdiction !== 'all' && doc.jurisdiction !== filters.jurisdiction) return false
  if (filters.employee !== 'all' && doc.employeeId !== filters.employee) return false
  if (!query) return true
  return `${doc.title.en} ${doc.title.fr} ${doc.ref}`.toLowerCase().includes(query)
}

export function RepositoryScreen() {
  const { mode } = useWorkspaceMode()
  if (mode === 'production') return <RepositoryProductionView />
  return <RepositoryDemoScreen />
}

function RepositoryDemoScreen() {
  const { t, x, L } = useI18n()
  const { data, role } = useDoclib()
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupKey>('none')
  const [filters, setFilters] = useState<RepoFilters>(NO_FILTERS)

  if (!can(role, 'view_repository')) return <PermissionNote />
  if (!data) return <RepositorySkeleton />

  const glue = L(': ', ' : ')
  const employeeById = new Map(data.employees.map((employee) => [employee.id, employee]))
  const templateByTid = new Map(data.templates.map((template) => [template.tid, template]))
  const categoryById = new Map(data.categories.map((category) => [category.id, category]))

  const q = query.trim().toLowerCase()
  const visible = data.documents.filter((doc) => matchesFilters(doc, filters, q, showArchived))

  /** Stable-ordered groups (first-appearance order within the filtered list). */
  const groupOf = (doc: GeneratedDoc): { key: string; heading: string } => {
    switch (groupBy) {
      case 'employee': {
        const employee = doc.employeeId ? employeeById.get(doc.employeeId) : undefined
        return employee
          ? { key: employee.id, heading: employee.name }
          : { key: '__org', heading: t('doclib_repo_orgWide') }
      }
      case 'status':
        return { key: doc.status, heading: x(documentStatusInfo[doc.status].label) }
      case 'category': {
        const template = templateByTid.get(doc.templateTid)
        const category = template ? categoryById.get(template.category) : undefined
        return category
          ? { key: category.id, heading: x(category.name) }
          : { key: '__other', heading: '—' }
      }
      default:
        return { key: '__all', heading: '' }
    }
  }
  const groups: DocGroup[] = []
  const groupByKey = new Map<string, DocGroup>()
  for (const doc of visible) {
    const { key, heading } = groupOf(doc)
    let group = groupByKey.get(key)
    if (!group) {
      group = { key, heading, docs: [] }
      groupByKey.set(key, group)
      groups.push(group)
    }
    group.docs.push(doc)
  }

  const setFilter = (key: keyof RepoFilters) => (value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }))
  const clearFilters = () => {
    setQuery('')
    setFilters(NO_FILTERS)
  }

  return (
    <div className="pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-[640px]">
          <div className="text-[11px] font-bold tracking-[0.08em] text-gold-dot uppercase">
            {t('doclib_repo_eyebrow')}
          </div>
          <h1 className="mt-1 font-display text-[26px] font-bold tracking-[-0.01em] text-text max-[640px]:text-[22px]">
            {t('doclib_repo_title')}
          </h1>
          <p className="mt-1 text-[13.5px] leading-relaxed text-text-muted">
            {t('doclib_repo_subtitle')}
          </p>
        </div>
        <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[10px] text-center shadow-sm">
          <div className="font-display text-[22px] leading-tight font-bold text-navy">
            {visible.length}
          </div>
          <div className="text-[11.5px] text-text-muted">{t('doclib_repo_count')}</div>
        </div>
      </header>

      {data.documents.length === 0 ? (
        <EmptyRepo />
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-text-faint"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('doclib_repo_searchPh')}
                aria-label={t('doclib_repo_searchPh')}
                className="w-full rounded-[10px] border border-border bg-surface py-[8px] pr-[12px] pl-[34px] text-[13px] text-text placeholder:text-text-faint"
              />
            </div>
            <button
              type="button"
              aria-pressed={showArchived}
              onClick={() => setShowArchived((value) => !value)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border px-[12px] py-[7px] text-[12.5px] font-semibold transition-colors ${
                showArchived
                  ? 'border-(--accent-soft-border) bg-accent-soft text-accent'
                  : 'border-border bg-surface text-text-muted hover:text-text'
              }`}
            >
              <Archive size={14} aria-hidden="true" />
              {t('doclib_repo_showArchived')}
            </button>
            <select
              aria-label={t('doclib_repo_groupBy')}
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value as GroupKey)}
              className={SELECT_CLASS}
            >
              {GROUP_KEYS.map((key) => (
                <option key={key} value={key}>
                  {`${t('doclib_repo_groupBy')}${glue}${t(GROUP_LABEL_KEY[key])}`}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <FilterSelect
              label={t('doclib_filter_status')}
              value={filters.status}
              onChange={setFilter('status')}
              options={DOC_STATUSES.map((status) => ({
                value: status,
                label: x(documentStatusInfo[status].label),
              }))}
            />
            <FilterSelect
              label={t('doclib_filter_review')}
              value={filters.review}
              onChange={setFilter('review')}
              options={REVIEW_STATUSES.map((status) => ({
                value: status,
                label: x(reviewStatusInfo[status].label),
              }))}
            />
            <FilterSelect
              label={t('doclib_filter_signature')}
              value={filters.signature}
              onChange={setFilter('signature')}
              options={SIGNATURE_STATUSES.map((status) => ({
                value: status,
                label: x(signatureStatusInfo[status].label),
              }))}
            />
            <FilterSelect
              label={t('doclib_filter_risk')}
              value={filters.risk}
              onChange={setFilter('risk')}
              options={RISK_LEVELS.map((risk) => ({
                value: risk,
                label: x(riskLevelInfo[risk].label),
              }))}
            />
            <FilterSelect
              label={t('doclib_filter_jurisdiction')}
              value={filters.jurisdiction}
              onChange={setFilter('jurisdiction')}
              options={JURISDICTIONS.map((code) => ({ value: code, label: code }))}
            />
            <FilterSelect
              label={t('doclib_filter_employee')}
              value={filters.employee}
              onChange={setFilter('employee')}
              options={data.employees.map((employee) => ({
                value: employee.id,
                label: employee.name,
              }))}
            />
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer px-[4px] text-[12.5px] font-bold text-gold-fg"
            >
              {t('doclib_studio_clear')}
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="mt-4 rounded-[12px] border border-border bg-surface px-6 py-12 text-center">
              <div className="text-[14px] font-bold text-text">{t('doclib_repo_noMatch')}</div>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 cursor-pointer text-[12.5px] font-bold text-gold-fg"
              >
                {t('doclib_studio_clear')}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-5">
              {groups.map((group) => (
                <section key={group.key}>
                  {groupBy !== 'none' && (
                    <h2 className="mb-2 flex items-baseline gap-2 text-[12px] font-bold tracking-[0.04em] text-text-muted uppercase">
                      {group.heading}
                      <span className="font-semibold text-text-faint">{group.docs.length}</span>
                    </h2>
                  )}
                  <DocTable docs={group.docs} employeeById={employeeById} />
                  <DocCards docs={group.docs} employeeById={employeeById} />
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Desktop table (≥768px) ──────────────────────────────────────────────── */

function DocTable({
  docs,
  employeeById,
}: {
  readonly docs: GeneratedDoc[]
  readonly employeeById: Map<string, DocEmployee>
}) {
  const { t, x } = useI18n()
  const navigate = useNavigate()
  return (
    <div className="hidden overflow-x-auto rounded-[12px] border border-border bg-surface md:block">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-inset">
            <th className={TH_CLASS}>{t('doclib_col_title')}</th>
            <th className={TH_CLASS}>{t('doclib_col_employee')}</th>
            <th className={TH_CLASS}>{t('doclib_col_jurisdiction')}</th>
            <th className={TH_CLASS}>{t('doclib_col_status')}</th>
            <th className={TH_CLASS}>{t('doclib_col_review')}</th>
            <th className={TH_CLASS}>{t('doclib_col_signature')}</th>
            <th className={TH_CLASS}>{t('doclib_col_risk')}</th>
            <th className={TH_CLASS}>{t('doclib_col_updated')}</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => (
            <tr
              key={doc.id}
              onClick={() => navigate(docHref(doc))}
              className="cursor-pointer border-t border-inset transition-colors hover:bg-inset/50"
            >
              <td className={TD_CLASS}>
                <Link
                  to={docHref(doc)}
                  onClick={(event) => event.stopPropagation()}
                  className="block min-w-0"
                >
                  <span className="block truncate text-[13.5px] font-semibold text-text">
                    {x(doc.title)}
                  </span>
                  <span className="mt-[2px] block text-[11px] text-text-faint">
                    {doc.templateTid} · {doc.ref} · v{doc.currentVersion}
                  </span>
                </Link>
              </td>
              <td className={TD_CLASS}>
                <EmployeeCell doc={doc} employeeById={employeeById} />
              </td>
              <td className={TD_CLASS}>
                <JurisdictionPill code={doc.jurisdiction} />
              </td>
              <td className={TD_CLASS}>
                <StatusDotChip info={documentStatusInfo[doc.status]} />
              </td>
              <td className={TD_CLASS}>
                <DocChip tone={reviewStatusInfo[doc.reviewStatus].tone}>
                  {x(reviewStatusInfo[doc.reviewStatus].label)}
                </DocChip>
              </td>
              <td className={TD_CLASS}>
                <DocChip tone={signatureStatusInfo[doc.signatureStatus].tone}>
                  {x(signatureStatusInfo[doc.signatureStatus].label)}
                </DocChip>
              </td>
              <td className={TD_CLASS}>
                <StatusDotChip info={riskLevelInfo[doc.risk]} />
              </td>
              <td className={`${TD_CLASS} text-[12px] whitespace-nowrap text-text-muted`}>
                {doc.updatedAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Chip with a leading status dot — the prototype's status/risk cell treatment. */
function StatusDotChip({ info }: { readonly info: { tone: DocChipTone; label: Bi } }) {
  const { x } = useI18n()
  return (
    <DocChip tone={info.tone}>
      <span
        className="mr-[5px] inline-block h-[6px] w-[6px] self-center rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {x(info.label)}
    </DocChip>
  )
}

/* ── Stacked cards (<768px) — handoff picked stacking over horizontal scroll ─ */

function DocCards({
  docs,
  employeeById,
}: {
  readonly docs: GeneratedDoc[]
  readonly employeeById: Map<string, DocEmployee>
}) {
  const { t, x } = useI18n()
  return (
    <div className="flex flex-col gap-2 md:hidden">
      {docs.map((doc) => (
        <Link
          key={doc.id}
          to={docHref(doc)}
          className="block rounded-[12px] border border-border bg-surface p-[14px] max-[640px]:p-[12px]"
        >
          <div className="text-[13.5px] font-semibold text-text">{x(doc.title)}</div>
          <div className="mt-[2px] text-[11px] text-text-faint">
            {doc.templateTid} · {doc.ref} · v{doc.currentVersion}
          </div>
          <dl className="mt-3 flex flex-col gap-[8px]">
            <CardRow label={t('doclib_col_employee')}>
              <EmployeeCell doc={doc} employeeById={employeeById} />
            </CardRow>
            <CardRow label={t('doclib_col_jurisdiction')}>
              <JurisdictionPill code={doc.jurisdiction} />
            </CardRow>
            <CardRow label={t('doclib_col_status')}>
              <StatusDotChip info={documentStatusInfo[doc.status]} />
            </CardRow>
            <CardRow label={t('doclib_col_review')}>
              <DocChip tone={reviewStatusInfo[doc.reviewStatus].tone}>
                {x(reviewStatusInfo[doc.reviewStatus].label)}
              </DocChip>
            </CardRow>
            <CardRow label={t('doclib_col_signature')}>
              <DocChip tone={signatureStatusInfo[doc.signatureStatus].tone}>
                {x(signatureStatusInfo[doc.signatureStatus].label)}
              </DocChip>
            </CardRow>
            <CardRow label={t('doclib_col_risk')}>
              <StatusDotChip info={riskLevelInfo[doc.risk]} />
            </CardRow>
            <CardRow label={t('doclib_col_updated')}>
              <span className="text-[12px] text-text-muted">{doc.updatedAt}</span>
            </CardRow>
          </dl>
        </Link>
      ))}
    </div>
  )
}

function CardRow({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-[11px] font-bold tracking-[0.03em] text-text-muted uppercase">
        {label}
      </dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}

/* ── Shared cells & states ───────────────────────────────────────────────── */

function EmployeeCell({
  doc,
  employeeById,
}: {
  readonly doc: GeneratedDoc
  readonly employeeById: Map<string, DocEmployee>
}) {
  const { t } = useI18n()
  if (!doc.employeeId) {
    return <span className="text-[12.5px] text-text-faint">— {t('doclib_repo_orgWide')}</span>
  }
  const employee = employeeById.get(doc.employeeId)
  if (!employee) return <span className="text-[12.5px] text-text-faint">—</span>
  const position = doc.answers['position_title']
  return (
    <div className="min-w-0">
      <div className="truncate text-[13px] font-medium text-text">{employee.name}</div>
      {position !== undefined && position !== '' && (
        <div className="truncate text-[11.5px] text-text-muted">{position}</div>
      )}
    </div>
  )
}

/** Role gate — the external role only sees its signing package, not the repo. */
function PermissionNote() {
  const { t, x } = useI18n()
  const { role } = useDoclib()
  const info = workspaceRoles.find((entry) => entry.key === role)
  return (
    <div className="rounded-[12px] border border-border bg-surface px-6 py-12 text-center">
      <Lock size={22} className="mx-auto text-text-faint" aria-hidden="true" />
      <div className="mt-3 text-[15px] font-bold text-text">{t('doclib_docd_permDenied')}</div>
      {info && <p className="mt-1 text-[13px] text-text-muted">{x(info.desc)}</p>}
    </div>
  )
}

function EmptyRepo() {
  const { t } = useI18n()
  return (
    <div className="mt-5 rounded-[12px] border border-border bg-surface px-6 py-14 text-center">
      <FileText size={26} className="mx-auto text-text-faint" aria-hidden="true" />
      <div className="mt-3 text-[15px] font-bold text-text">{t('doclib_repo_empty')}</div>
      <p className="mt-1 text-[13px] text-text-muted">{t('doclib_repo_emptySub')}</p>
      <Link
        to="/app/documents/studio"
        className="mt-4 inline-flex items-center gap-1.5 rounded-[9px] bg-navy px-[14px] py-[8px] text-[12.5px] font-semibold text-white"
      >
        {t('doclib_repo_goStudio')}
      </Link>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly options: { value: string; label: string }[]
}) {
  const { t, L } = useI18n()
  const glue = L(': ', ' : ')
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={SELECT_CLASS}
    >
      <option value="all">{`${label}${glue}${t('doclib_filter_all')}`}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {`${label}${glue}${option.label}`}
        </option>
      ))}
    </select>
  )
}

function RepositorySkeleton() {
  return (
    <div className="pb-8">
      <Skel className="h-[12px] w-[90px]" />
      <Skel className="mt-2 h-[30px] w-[280px] max-w-full" />
      <Skel className="mt-2 h-[14px] w-[460px] max-w-full" />
      <div className="mt-5 flex flex-wrap gap-2">
        <Skel className="h-[38px] min-w-[220px] flex-1" />
        <Skel className="h-[38px] w-[130px]" />
        <Skel className="h-[38px] w-[150px]" />
      </div>
      <div className="mt-4 overflow-hidden rounded-[12px] border border-border bg-surface">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className={index > 0 ? 'border-t border-inset p-[14px]' : 'p-[14px]'}>
            <Skel className="h-[14px] w-[45%]" />
            <Skel className="mt-2 h-[11px] w-[30%]" />
          </div>
        ))}
      </div>
    </div>
  )
}
