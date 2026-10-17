import { useState } from 'react'
import { NEWS_PAYWALL_PREF } from '@/features/invest/data/newsDedupe'

/* "I'm subscribed — show them anyway" lives on the device, not the
   account: shared by the Overview card and the Analysis board. */
export function usePaywalledPref(): [boolean, () => void] {
  const [show, setShow] = useState(
    () => localStorage.getItem(NEWS_PAYWALL_PREF) === '1',
  )
  const toggle = () => {
    setShow((v) => {
      localStorage.setItem(NEWS_PAYWALL_PREF, v ? '0' : '1')
      return !v
    })
  }
  return [show, toggle]
}
