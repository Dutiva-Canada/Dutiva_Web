import { useState } from 'react'
import { ChevronDown, ChevronRight, Sun } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { keyOfL, pickL } from '@/i18n/core'
import type { LText } from '@/i18n/core'
import { advisorCore as M } from '@/i18n/messages/advisorCore'

/**
 * "Reasoning" expander above an assistant reply — toggle button with the
 * spark icon and chevron, opening the inset panel of em-dash-prefixed trace
 * lines (prototype `hasReasoning` / `reasoningOpen` markup).
 */
export function ReasoningExpander({ lines }: { readonly lines: readonly LText[] }) {
  const { x, lang } = useI18n()
  const [open, setOpen] = useState(false)
  if (lines.length === 0) return null
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-[6px] border-none bg-transparent px-0 py-[2px] text-[12.5px] font-semibold text-text-muted"
      >
        <Sun size={12} strokeWidth={2} aria-hidden="true" />
        <span>{x(M.advisor_reasoning)}</span>
        {open ? (
          <ChevronDown size={10} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <ChevronRight size={10} strokeWidth={2.5} aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="mt-[6px] flex max-w-[560px] flex-col gap-[6px] rounded-[10px] bg-inset px-[12px] py-[10px]">
          {lines.map((line) => (
            <div
              key={keyOfL(line)}
              className="flex gap-[7px] text-[12.5px] leading-normal text-text-3"
            >
              <span className="text-text-faint">—</span>
              <span>{pickL(line, lang)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
