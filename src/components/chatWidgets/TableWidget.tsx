import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { pickL } from '@/i18n/core'
import type { LText } from '@/i18n/core'
import { chatWidgetMessages as CW } from '@/i18n/messages/chatWidgets'
import { formatValue } from './formatValue'
import type { TableSpec } from './widgetSpec'
import { WidgetFrame } from './WidgetFrame'

/**
 * Table — sortable, filterable rows inside a chat. Sort is per-column
 * tri-state (asc → desc → unsorted); filter is a case/accent-insensitive
 * substring match over every cell's resolved text. All computation is
 * client-side on the spec's rows — 500-row cap in the schema keeps the
 * render cheap enough for a phone, and `content-visibility` lets the
 * browser skip off-screen rows.
 */
type SortDir = 'asc' | 'desc'

interface SortState {
  readonly key: string
  readonly dir: SortDir
}

function cellText(cell: string | number | LText | undefined, lang: 'en' | 'fr'): string {
  if (cell == null) return ''
  if (typeof cell === 'number') return formatValue(cell, undefined, lang)
  if (typeof cell === 'string') return cell
  return pickL(cell, lang)
}

const COMBINING_MARKS = /[\u0300-\u036f]/g

function normalize(text: string): string {
  return text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()
}

export function TableWidget({ spec }: { readonly spec: TableSpec }) {
  const { x, lang } = useI18n()
  const { columns, rows, searchable = true, sortable = true } = spec.data
  const [sort, setSort] = useState<SortState | null>(null)
  const [query, setQuery] = useState('')

  const locale = lang === 'fr' ? 'fr' : 'en'

  const visible = useMemo(() => {
    const needle = normalize(query.trim())
    let list = rows
    if (needle) {
      list = list.filter((row) =>
        columns.some((col) => normalize(cellText(row[col.key], lang)).includes(needle)),
      )
    }
    if (sort) {
      const dir = sort.dir === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        const av = a[sort.key]
        const bv = b[sort.key]
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
        return cellText(av, lang).localeCompare(cellText(bv, lang), locale, {
          sensitivity: 'base',
          numeric: true,
        }) * dir
      })
    }
    return list
  }, [rows, columns, query, sort, lang, locale])

  const toggleSort = (key: string) => {
    setSort((prev) =>
      prev?.key !== key ? { key, dir: 'asc' } : prev.dir === 'asc' ? { key, dir: 'desc' } : null,
    )
  }

  return (
    <WidgetFrame title={spec.title} regionLabel={x(CW.chatw_table_region)}>
      {searchable && (
        <div className="cw-table-search">
          <input
            className="cw-calc-input"
            type="search"
            value={query}
            placeholder={x(CW.chatw_table_search)}
            aria-label={x(CW.chatw_table_search)}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}
      <div
        className="cw-tablewrap"
        role="region"
        tabIndex={0}
        aria-label={spec.title ? pickL(spec.title, lang) : x(CW.chatw_table_region)}
      >
        <table className="cw-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const active = sort?.key === col.key ? sort.dir : null
                const ariaSort =
                  active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : 'none'
                const hint = !sortable
                  ? undefined
                  : active === 'asc'
                    ? x(CW.chatw_table_sort_asc)
                    : active === 'desc'
                      ? x(CW.chatw_table_sort_desc)
                      : x(CW.chatw_table_sort_none)
                return (
                  <th
                    key={col.key}
                    scope="col"
                    data-align={col.align ?? 'left'}
                    aria-sort={sortable ? ariaSort : undefined}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className="cw-table-sort"
                        onClick={() => toggleSort(col.key)}
                        aria-label={`${pickL(col.label, lang)} — ${hint}`}
                      >
                        {pickL(col.label, lang)}
                        {active === 'asc' ? (
                          <ArrowUp size={12} aria-hidden="true" />
                        ) : active === 'desc' ? (
                          <ArrowDown size={12} aria-hidden="true" />
                        ) : (
                          <ArrowUpDown size={12} aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      pickL(col.label, lang)
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="cw-table-empty" colSpan={columns.length}>
                  {x(CW.chatw_table_no_results)}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => (
                <tr key={i} style={{ contentVisibility: 'auto' }}>
                  {columns.map((col) => (
                    <td key={col.key} data-align={col.align ?? 'left'}>
                      {cellText(row[col.key], lang)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  )
}
