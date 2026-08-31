import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Lock, Search } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { searchMessages as M } from '@/i18n/messages/search'
import { useEscapeToClose } from '@/lib/escapeStack'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceNavigate } from '@/features/app/workspaceRoot/workspaceRootContext'
import { useSearch } from './searchContext'
import {
  filterSearchEntries,
  filterSearchEntriesFrom,
  pinnedChatEntries,
  searchTabs,
} from './searchCorpus'
import type {
  AdvisorSearchNavState,
  SearchEntry,
  SearchTabKey,
  TemplatesSearchNavState,
} from './searchCorpus'
import { buildProductionSearchEntries, pinnedProductionChats } from './searchProductionCorpus'

/**
 * Global search overlay (⌘K / topbar search) — App v2 `buildSearchView()` +
 * overlay markup (App v2.dc.html, 2302–2346). Renders nothing while closed;
 * the dialog remounts on every open so query/tab/active row reset like the
 * prototype's `openSearch()`.
 */
export function SearchOverlay() {
  const { open } = useSearch()
  if (!open) return null
  return <SearchDialog />
}

function SearchDialog() {
  const { x, lang } = useI18n()
  const { closeSearch } = useSearch()
  const navigate = useWorkspaceNavigate()
  const { mode, organizationId } = useWorkspaceMode()
  const production = mode === 'production'

  /* Escape closes only this overlay (the topmost) — see lib/escapeStack. */
  useEscapeToClose(true, closeSearch)

  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<SearchTabKey>('all')
  const [rawActiveIdx, setRawActiveIdx] = useState(0)
  const [productionEntries, setProductionEntries] = useState<SearchEntry[] | null>(null)
  const [productionLoading, setProductionLoading] = useState(false)
  const [productionLoadFailed, setProductionLoadFailed] = useState(false)

  useEffect(() => {
    if (!production) return
    if (!organizationId) {
      setProductionEntries([])
      setProductionLoading(false)
      setProductionLoadFailed(false)
      return
    }
    let cancelled = false
    setProductionLoading(true)
    setProductionLoadFailed(false)
    void buildProductionSearchEntries(organizationId)
      .then((entries) => {
        if (cancelled) return
        setProductionEntries(entries)
        setProductionLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setProductionEntries(null)
        setProductionLoading(false)
        setProductionLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [production, organizationId])

  const results = useMemo(() => {
    if (production) {
      if (productionLoading || productionLoadFailed || productionEntries === null) return []
      return filterSearchEntriesFrom(productionEntries, tab, query, lang)
    }
    return filterSearchEntries(tab, query, lang)
  }, [production, productionLoading, productionLoadFailed, productionEntries, tab, query, lang])

  /* Prototype clamps the active row against the current result count. */
  const activeIdx = Math.min(rawActiveIdx, Math.max(results.length - 1, 0))

  const pinnedEntries = useMemo(() => {
    if (production) {
      if (!productionEntries?.length) return []
      return pinnedProductionChats(productionEntries)
    }
    return pinnedChatEntries
  }, [production, productionEntries])

  const showRecent = !query && pinnedEntries.length > 0 && !productionLoading
  const noResults = !!query && results.length === 0 && !productionLoading
  const showProductionEmpty =
    production &&
    !productionLoading &&
    !productionLoadFailed &&
    !query &&
    results.length === 0 &&
    (organizationId === null || productionEntries?.length === 0)

  /* Focus the input on open; restore focus to the trigger on close
     (prototype `openSearch()` stores `_lastFocused`, `restoreFocus()`). */
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const lastFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    inputRef.current?.focus()
    return () => {
      if (lastFocused?.isConnected) lastFocused.focus()
    }
  }, [])

  const openEntry = useCallback(
    (entry: SearchEntry) => {
      closeSearch()
      const nav = entry.nav
      switch (nav.kind) {
        case 'employee':
          navigate(`/app/employees/${nav.employeeId}`)
          break
        case 'case':
          navigate(`/app/cases/${nav.caseId}`)
          break
        case 'chat':
          navigate('/app/advisor', {
            state: { chatId: nav.chatId } satisfies AdvisorSearchNavState,
          })
          break
        case 'document':
          if (production) {
            navigate(`/app/documents/generate/${nav.docKey}`)
          } else {
            /* Navigate to the HR Library tab; TemplatesView reads location.state.docKey
               on mount and opens the overlay immediately (prototype openDocFromLibrary). */
            navigate('/app/documents/hr-library', {
              state: { docKey: nav.docKey } satisfies TemplatesSearchNavState,
            })
          }
          break
        case 'generatedDocument':
          navigate(`/app/documents/${nav.docId}`)
          break
        case 'workflow':
          navigate(`/app/workflows/${nav.flowSlug}`)
          break
        case 'view':
          navigate(`/app/${nav.view}`)
          break
      }
    },
    [closeSearch, navigate, production],
  )

  /* Prototype `onKeyDown` (App v2.dc.html, 2764–2778): arrows move the
     active row, Enter opens it, Escape closes; ⌘/Ctrl+K while open resets. */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setQuery('')
        setTab('all')
        setRawActiveIdx(0)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setRawActiveIdx(Math.min(activeIdx + 1, Math.max(results.length - 1, 0)))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setRawActiveIdx(Math.max(activeIdx - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        const active = results[activeIdx]
        if (active) {
          e.preventDefault()
          openEntry(active)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [results, activeIdx, openEntry])

  return (
    <>
      <button
        type="button"
        onClick={closeSearch}
        aria-label={x(M.search_dialog_label)}
        className="fixed inset-0 z-350 cursor-default border-none bg-overlay-scrim"
      />
      <dialog
        open
        aria-modal="true"
        aria-label={x(M.search_dialog_label)}
        className="fixed top-[12vh] right-0 left-0 z-350 m-auto flex max-h-[66vh] w-[min(560px,92vw)] animate-[fadeInUp_.15s_ease] flex-col overflow-hidden rounded-[14px] bg-surface font-sans shadow-search"
      >
        <div className="flex items-center gap-[12px] border-b border-border-soft px-[18px] py-[16px]">
          <Search
            size={17}
            strokeWidth={1.8}
            className="shrink-0 text-text-muted"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setRawActiveIdx(0)
            }}
            placeholder={x(M.search_placeholder)}
            aria-label={x(M.search_dialog_label)}
            className="flex-1 border-none bg-transparent font-sans text-[15px] text-text outline-none"
          />
          <span className="rounded-[4px] border border-border px-[6px] py-[2px] text-[11px] text-text-faint">
            ESC
          </span>
        </div>

        <div className="flex gap-[8px] px-[18px] pt-[12px]">
          {searchTabs.map((tb) => (
            <button
              key={tb.key}
              type="button"
              onClick={() => {
                setTab(tb.key)
                setRawActiveIdx(0)
              }}
              className={
                'cursor-pointer rounded-[100px] border-none px-[13px] py-[7px] font-sans text-[12.5px] font-semibold ' +
                (tab === tb.key ? 'bg-navy text-white' : 'bg-inset text-text-2')
              }
            >
              {x(tb.label)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-[10px] pt-[12px] pb-[16px]">
          {productionLoading && (
            <div className="px-[16px] py-[34px] text-center text-[13.5px] text-text-muted">
              {x(M.search_loading)}
            </div>
          )}

          {productionLoadFailed && (
            <div className="px-[16px] py-[34px] text-center text-[13.5px] text-text-muted">
              {x(M.search_load_failed)}
            </div>
          )}

          {production && organizationId === null && !productionLoading && (
            <div className="px-[16px] py-[34px] text-center text-[13.5px] text-text-muted">
              {x(M.search_no_org)}
            </div>
          )}

          {showRecent && (
            <>
              <div className="px-[10px] pt-[8px] pb-[4px] text-[11px] font-bold tracking-[.04em] text-text-muted uppercase">
                {x(M.search_pinned)}
              </div>
              {pinnedEntries.map((r) => (
                <button
                  key={`pinned-${r.id}`}
                  type="button"
                  onClick={() => openEntry(r)}
                  className="flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] border-none bg-transparent p-[10px] text-left font-sans hover:bg-inset"
                >
                  <span className="w-[78px] shrink-0 text-[11px] font-bold text-gold-dot">
                    {x(r.kindLabel)}
                  </span>
                  <span className="text-[13.5px] text-text">{x(r.title)}</span>
                </button>
              ))}
            </>
          )}

          {!productionLoading && !productionLoadFailed && !(showProductionEmpty && !query) && (
            <div className="px-[10px] pt-[10px] pb-[4px] text-[11px] font-bold tracking-[.04em] text-text-muted uppercase">
              {x(M.search_results)}
            </div>
          )}

          {showProductionEmpty && !query && (
            <div className="px-[16px] py-[24px] text-center text-[13px] text-text-muted">
              {organizationId === null ? x(M.search_no_org) : x(M.search_no_results_hint)}
            </div>
          )}

          {results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => openEntry(r)}
              className={
                'flex w-full cursor-pointer items-center gap-[10px] rounded-[8px] border-none p-[10px] text-left font-sans hover:bg-inset ' +
                (i === activeIdx ? 'bg-inset' : 'bg-transparent')
              }
            >
              <span className="w-[78px] shrink-0 text-[11px] font-bold text-text-muted">
                {x(r.kindLabel)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block overflow-hidden text-[13.5px] text-ellipsis whitespace-nowrap text-text">
                  {x(r.title)}
                </span>
                {r.sub && (
                  <span className="mt-px block overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap text-text-muted">
                    {x(r.sub)}
                  </span>
                )}
              </span>
              {r.restricted && (
                <span className="inline-flex shrink-0 items-center gap-[4px] text-[10.5px] font-bold tracking-[.03em] text-gold-fg uppercase">
                  <Lock size={11} strokeWidth={2} aria-hidden="true" />
                  {x(M.search_restricted)}
                </span>
              )}
            </button>
          ))}

          {noResults && (
            <div className="px-[16px] py-[34px] text-center">
              <div className="text-[13.5px] font-semibold text-text">
                {x(M.search_no_results)} “{query}”
              </div>
              <div className="mt-[4px] text-[12.5px] text-text-muted">
                {x(M.search_no_results_hint)}
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  )
}
