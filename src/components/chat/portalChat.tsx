import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/* Shared components for the four standalone portal chats (Tally, Mira,
   Paige, Claire). Formatting helpers and scroll/textarea hooks live in
   portalChatUtils.ts — a file that exports components should export only
   components so fast refresh stays clean. */

/**
 * Copy-the-reply control for assistant bubbles. Shows a check for a moment
 * after a successful copy; silently no-ops where the clipboard API is
 * unavailable (non-secure contexts, old WebViews).
 */
export function CopyTurnButton({
  text,
  label,
  className,
}: {
  text: string
  label: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* Clipboard denied — leave the affordance silent. */
    }
  }
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      onClick={() => void copy()}
    >
      {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
    </button>
  )
}
