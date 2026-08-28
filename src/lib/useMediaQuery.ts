import { useEffect, useState } from 'react'

/** Subscribe to a CSS media query — used where Tailwind breakpoints need JS gating (e.g. tests). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => readMediaQuery(query))

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

function readMediaQuery(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(query).matches
}

export function useMdUp(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

export function useLgUp(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

export function useXlUp(): boolean {
  return useMediaQuery('(min-width: 1280px)')
}
