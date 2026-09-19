import { useEffect, useState } from 'react'
import { installedRepoIds } from './manager'

/**
 * Repo ids currently in the browser's transformers cache, probed once on
 * mount. Installing a model mid-session is picked up on the next mount —
 * the Settings → AI install flow navigates away and back anyway, so a live
 * subscription would add complexity for no visible gain.
 *
 * Always a Set (possibly empty): Cache Storage absent (jsdom, locked-down
 * embeds) degrades to "nothing installed", which just hides the on-device
 * affordances.
 */
export function useInstalledLocalModels(): ReadonlySet<string> {
  const [installed, setInstalled] = useState<ReadonlySet<string>>(new Set())
  useEffect(() => {
    let alive = true
    void installedRepoIds()
      .then((ids) => {
        if (alive) setInstalled(ids)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return installed
}
