import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { templatesMessages as M } from '@/i18n/messages/templates'
import { documentTemplates } from '@/data'
import { useDocStudio } from '@/features/app/docstudio/docStudioContext'
import type { TemplatesSearchNavState } from '@/features/app/search/searchCorpus'

/** Northgate fixtures — demo workspace and public `/demo` only. */
export function TemplatesDemoView() {
  const { x } = useI18n()
  const { openDocFromLibrary } = useDocStudio()
  const location = useLocation()
  const navigate = useNavigate()
  /* Handled-by-identity guard: StrictMode-safe, but a LATER navigation with a
     new state object (e.g. a second search-result click while already on this
     view) is handled again. */
  const handledNavState = useRef<unknown>(undefined)

  useEffect(() => {
    const state = location.state as Partial<TemplatesSearchNavState> | null
    if (state === null || handledNavState.current === state) return
    handledNavState.current = state
    if (typeof state.docKey === 'string') {
      openDocFromLibrary(state.docKey)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate, openDocFromLibrary])

  return (
    <section aria-label={x(M.templates_gallery_aria)}>
      <h1 className="sr-only">{x(M.templates_gallery_aria)}</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-[18px]">
        {documentTemplates.map((doc) => (
          <button
            key={doc.key}
            type="button"
            onClick={() => openDocFromLibrary(doc.key)}
            className="flex cursor-pointer flex-col gap-[14px] rounded-[12px] border border-border bg-surface p-[18px] text-left font-sans transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-(--accent-soft-border)"
          >
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-inset">
              <FileText
                size={15}
                strokeWidth={1.7}
                className="text-text-muted"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="text-[13.5px] leading-[1.3] font-semibold text-text">
                {x(doc.title)}
              </div>
              <div className="mt-[4px] text-[11.5px] text-text-muted">{x(doc.category)}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
