import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

export type HiringTab = 'candidates' | 'applications' | 'funnel' | 'postings'

const VALID_TABS: ReadonlySet<string> = new Set([
  'candidates',
  'applications',
  'funnel',
  'postings',
])

export function useHiringTab(
  defaultTab: HiringTab = 'candidates',
): [HiringTab, (tab: HiringTab) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<HiringTab>(() => {
    const fromUrl = searchParams.get('tab')
    return fromUrl && VALID_TABS.has(fromUrl) ? (fromUrl as HiringTab) : defaultTab
  })

  useEffect(() => {
    const fromUrl = searchParams.get('tab')
    setActiveTab(fromUrl && VALID_TABS.has(fromUrl) ? (fromUrl as HiringTab) : defaultTab)
  }, [searchParams, defaultTab])

  const selectTab = (tab: HiringTab) => {
    setActiveTab(tab)
    setSearchParams(
      (prev) => {
        prev.set('tab', tab)
        return prev
      },
      { replace: true },
    )
  }

  return [activeTab, selectTab]
}
