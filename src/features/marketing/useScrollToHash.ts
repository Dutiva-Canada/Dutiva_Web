import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scroll the element named by a URL hash into view. Native fragment
 * navigation is enough on a fully painted homepage, but a hash on first
 * load (or after a client-side jump from /pricing, /guides, …) races the
 * lazy landing chunk: the browser looks for `#product` before React has
 * mounted it, then stays at the hero with the hash still in the URL.
 */
export function scrollToHash(hash: string): boolean {
  const id = hash.startsWith('#') ? hash.slice(1) : hash
  if (!id) return false
  const el = document.getElementById(id)
  if (!el) return false
  el.scrollIntoView({ block: 'start' })
  return true
}

export function useScrollToHash(): void {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    scrollToHash(hash)
  }, [hash])
}
