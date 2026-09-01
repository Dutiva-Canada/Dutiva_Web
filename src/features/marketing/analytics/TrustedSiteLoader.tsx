import { useEffect } from 'react'
import { loadTrustedSite } from './trustedsite'

/** Loads the public-site TrustedSite trustmark on mount (marketing shell only). */
export function TrustedSiteLoader() {
  useEffect(() => {
    loadTrustedSite()
  }, [])

  return null
}
