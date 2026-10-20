import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Opens an inline create form when the route has `?new=1`, then strips the
 * query (replace) so a refresh does not keep re-opening the form.
 * Used by production Employees / Cases / Tasks empty→create CTAs.
 *
 * The param is always consumed — even when `enabled` is false (a viewer
 * without create rights, or a demo view that only strips the deep link) —
 * so a stray `?new=1` never lingers in the URL.
 */
export function useOpenCreateFormFromQuery(enabled: boolean): {
  formOpen: boolean
  setFormOpen: (open: boolean) => void
} {
  const [searchParams, setSearchParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    if (enabled) setFormOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [enabled, searchParams, setSearchParams])

  return { formOpen, setFormOpen }
}
