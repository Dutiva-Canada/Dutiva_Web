import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Opens an inline create form when the route has `?new=1`, then strips the
 * query (replace) so a refresh does not keep re-opening the form.
 * Used by production Employees / Cases / Tasks empty→create CTAs.
 */
export function useOpenCreateFormFromQuery(enabled: boolean): {
  formOpen: boolean
  setFormOpen: (open: boolean) => void
} {
  const [searchParams, setSearchParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    if (!enabled) return
    if (searchParams.get('new') !== '1') return
    setFormOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [enabled, searchParams, setSearchParams])

  return { formOpen, setFormOpen }
}
