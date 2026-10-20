import { useState } from 'react'
import { readPref, writePref } from '@/lib/prefs'
import { NEWS_PAYWALL_PREF } from '@/features/invest/data/newsDedupe'

/* "I'm subscribed — show them anyway" lives on the device, not the
   account: shared by the Overview card and the Analysis board. */
export function usePaywalledPref(): [boolean, () => void] {
  /* readPref/writePref, not raw localStorage — private mode mustn't
     throw the card for a display flag. */
  const [show, setShow] = useState(() => readPref(NEWS_PAYWALL_PREF, '0') === '1')
  const toggle = () => {
    setShow((v) => {
      writePref(NEWS_PAYWALL_PREF, v ? '0' : '1')
      return !v
    })
  }
  return [show, toggle]
}
