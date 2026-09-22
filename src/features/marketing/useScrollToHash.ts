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
    if (!hash || scrollToHash(hash)) return
    /* The anchor can live inside a lazily loaded section — watch the DOM
       until it mounts rather than racing it and losing the jump. The timer
       resets on each mutation, so the observer survives a slow chunk and
       only gives up once the DOM has been quiet for five seconds. */
    let timeout: ReturnType<typeof setTimeout>
    const observer = new MutationObserver(() => {
      if (scrollToHash(hash)) {
        observer.disconnect()
        return
      }
      clearTimeout(timeout)
      timeout = setTimeout(() => observer.disconnect(), 5000)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    timeout = setTimeout(() => observer.disconnect(), 5000)
    return () => {
      observer.disconnect()
      clearTimeout(timeout)
    }
  }, [hash])
}
