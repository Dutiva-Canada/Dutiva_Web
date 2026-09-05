import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

export type HiringTab = 'candidates' | 'funnel' | 'postings'

export function useHiringTab(defaultTab: HiringTab = 'candidates'): [HiringTab, (tab: HiringTab) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<HiringTab>(() => {
    const fromUrl = searchParams.get('tab')
    if (fromUrl === 'candidates' || fromUrl === 'funnel' || fromUrl === 'postings') return fromUrl
    return defaultTab
  })

  useEffect(() => {
    const fromUrl = searchParams.get('tab')
    if (fromUrl === 'candidates' || fromUrl === 'funnel' || fromUrl === 'postings') {
      setActiveTab(fromUrl)
    } else {
      setActiveTab(defaultTab)
    }
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
