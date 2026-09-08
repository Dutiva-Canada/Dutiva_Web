import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Link2, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { entityLinksMessages as M } from '@/i18n/messages/entityLinks'
import { FormField, FormSelect } from '@/components/FormField'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import {
  useWorkspaceRoot,
  workspacePath,
} from '@/features/app/workspaceRoot/workspaceRootContext'
import { createEntityLink, deleteEntityLink, listEntityLinks } from './data/productionApi'
import { entityLinks as fixtureLinks, entityLinksDemoOrgId } from './data/fixtures'
import type { EntityLink, EntityTable, LinkCandidate } from './data/types'

function generateId() {
  return `elink-${Math.random().toString(36).slice(2, 9)}`
}

interface EntityLinksPanelProps {
  readonly fromTable: string
  readonly fromId: string
  readonly candidates: LinkCandidate[]
}

/**
 * Generic cross-module link editor: shows the records linked from a given
 * entity (`from_table`/`from_id`) and lets the user add or remove links to
 * candidate records in other modules. Production reads/writes go through
 * `public.entity_links`; demo mode keeps a local copy seeded from fixtures.
 */
export function EntityLinksPanel({ fromTable, fromId, candidates }: EntityLinksPanelProps) {
  const { x } = useI18n()
  const { mode, organizationId } = useWorkspaceMode()
  const { root } = useWorkspaceRoot()

  const isProduction = mode === 'production' && Boolean(organizationId)

  const [prodLinks, setProdLinks] = useState<EntityLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [demoLinks, setDemoLinks] = useState<EntityLink[]>(() =>
    fixtureLinks.filter((l) => l.from_table === fromTable && l.from_id === fromId),
  )

  useEffect(() => {
    setDemoLinks(fixtureLinks.filter((l) => l.from_table === fromTable && l.from_id === fromId))
  }, [fromTable, fromId])

  useEffect(() => {
    if (!isProduction || !organizationId) return
    const orgId = organizationId
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const rows = await listEntityLinks(orgId, { fromTable, fromId })
        if (!cancelled) setProdLinks(rows)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'load failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isProduction, organizationId, fromTable, fromId])

  const links = isProduction ? prodLinks : demoLinks

  // Candidates minus records already linked, so the add form cannot offer
  // a duplicate (the table's UNIQUE constraint would reject it anyway).
  const availableCandidates = useMemo(() => {
    const linked = new Set(links.map((l) => `${l.to_table}:${l.to_id}`))
    return candidates
      .map((c) => ({
        ...c,
        records: c.records.filter((r) => !linked.has(`${c.table}:${r.id}`)),
      }))
      .filter((c) => c.records.length > 0)
  }, [candidates, links])

  const [targetTable, setTargetTable] = useState('')
  const [targetId, setTargetId] = useState('')
  const selectedCandidate = availableCandidates.find((c) => c.table === targetTable)

  const addLink = async () => {
    if (!targetTable || !targetId) return
    if (isProduction && organizationId) {
      try {
        setError(null)
        const created = await createEntityLink(organizationId, {
          from_table: fromTable,
          from_id: fromId,
          to_table: targetTable as EntityTable,
          to_id: targetId,
          relationship: 'relates_to',
        })
        setProdLinks((prev) => [...prev, created])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'save failed')
        return
      }
    } else {
      const now = new Date().toISOString()
      setDemoLinks((prev) => [
        ...prev,
        {
          id: generateId(),
          organization_id: organizationId ?? entityLinksDemoOrgId,
          from_table: fromTable,
          from_id: fromId,
          to_table: targetTable,
          to_id: targetId,
          relationship: 'relates_to',
          created_by: null,
          created_at: now,
          updated_at: now,
        },
      ])
    }
    setTargetTable('')
    setTargetId('')
  }

  const removeLink = async (id: string) => {
    if (isProduction) {
      try {
        setError(null)
        await deleteEntityLink(id)
        setProdLinks((prev) => prev.filter((l) => l.id !== id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'remove failed')
      }
    } else {
      setDemoLinks((prev) => prev.filter((l) => l.id !== id))
    }
  }

  return (
    <div className="rounded-[10px] border border-border bg-inset p-[12px]">
      <div className="mb-[8px] flex items-center gap-[8px]">
        <Link2 size={14} className="text-text-muted" aria-hidden="true" />
        <span className="text-[12px] font-semibold text-text-3">{x(M.el_title)}</span>
      </div>

      {isProduction && loading ? (
        <p className="m-0 mb-[8px] text-[12.5px] text-text-muted">{x(M.el_loading)}</p>
      ) : null}
      {error ? <p className="m-0 mb-[8px] text-[12.5px] text-risk-fg">{x(M.el_error)}</p> : null}

      {links.length === 0 ? (
        <p className="m-0 mb-[8px] text-[12.5px] text-text-muted">{x(M.el_empty)}</p>
      ) : (
        <div className="mb-[10px] flex flex-wrap gap-[8px]">
          {links.map((link) => {
            const candidate = candidates.find((c) => c.table === link.to_table)
            const record = candidate?.records.find((r) => r.id === link.to_id)
            const title = record?.title ?? link.to_id
            const moduleLabel = candidate ? x(candidate.label) : link.to_table
            return (
              <div
                key={link.id}
                className="flex items-center gap-[4px] rounded-[8px] border border-inset bg-surface py-[4px] pl-[10px] pr-[4px]"
              >
                {candidate ? (
                  <Link
                    to={workspacePath(root, candidate.view)}
                    title={x(M.el_link)}
                    className="flex items-center gap-[6px] text-[12.5px] text-text hover:text-accent"
                  >
                    <span className="font-medium">{title}</span>
                    <span className="text-text-faint">{moduleLabel}</span>
                  </Link>
                ) : (
                  <span className="flex items-center gap-[6px] text-[12.5px] text-text">
                    <span className="font-medium">{title}</span>
                    <span className="text-text-faint">{moduleLabel}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void removeLink(link.id)}
                  aria-label={x(M.el_remove)}
                  title={x(M.el_remove)}
                  className="rounded-[6px] p-[3px] text-text-muted hover:bg-inset hover:text-text"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {availableCandidates.length > 0 ? (
        <div className="grid grid-cols-1 gap-[8px] sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <FormField label={x(M.el_target_module)}>
            <FormSelect
              value={targetTable}
              onChange={(e) => {
                setTargetTable(e.target.value)
                setTargetId('')
              }}
            >
              <option value="">—</option>
              {availableCandidates.map((c) => (
                <option key={c.table} value={c.table}>
                  {x(c.label)}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={x(M.el_target_record)}>
            <FormSelect
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={!selectedCandidate}
            >
              <option value="">—</option>
              {(selectedCandidate?.records ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <button
            type="button"
            onClick={() => void addLink()}
            disabled={!targetTable || !targetId}
            className="rounded-[8px] border border-border bg-surface px-[14px] py-[9px] text-[13px] font-medium text-text hover:bg-inset disabled:opacity-50"
          >
            {x(M.el_add)}
          </button>
        </div>
      ) : null}
    </div>
  )
}
