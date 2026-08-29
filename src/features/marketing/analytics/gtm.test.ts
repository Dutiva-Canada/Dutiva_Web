import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { isGtmConfigured, loadGtm, loadConsentedTags } from './gtm'
import { setAnalyticsConsent } from '@/lib/analyticsConsent'

describe('gtm', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GTM_CONTAINER_ID', '')
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    localStorage.clear()
  })

  it('isGtmConfigured returns false without a container ID', () => {
    expect(isGtmConfigured()).toBe(false)
  })

  it('isGtmConfigured returns true with a container ID', () => {
    vi.stubEnv('VITE_GTM_CONTAINER_ID', 'GTM-TESTID')
    expect(isGtmConfigured()).toBe(true)
  })

  it('loadGtm does nothing without a container ID', () => {
    setAnalyticsConsent(true)
    expect(loadGtm()).toBe(false)
    expect(document.head.querySelector('#dutiva-gtm')).toBeNull()
    expect(document.body.querySelector('#dutiva-gtm-ns')).toBeNull()
  })

  it('loadGtm does nothing without consent even with a container ID', () => {
    vi.stubEnv('VITE_GTM_CONTAINER_ID', 'GTM-P3C7386R')
    expect(loadGtm()).toBe(false)
    expect(document.head.querySelector('#dutiva-gtm')).toBeNull()
  })

  it('loadGtm injects the container script and noscript iframe after consent', () => {
    vi.stubEnv('VITE_GTM_CONTAINER_ID', 'GTM-P3C7386R')
    setAnalyticsConsent(true)
    expect(loadGtm()).toBe(true)
    const script = document.head.querySelector('#dutiva-gtm') as HTMLScriptElement | null
    expect(script?.src).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-P3C7386R')
    const iframe = document.body.querySelector('#dutiva-gtm-ns') as HTMLIFrameElement | null
    expect(iframe?.src).toBe('https://www.googletagmanager.com/ns.html?id=GTM-P3C7386R')
    expect(iframe?.className).toBe('gtm-ns')
  })

  it('loadConsentedTags prefers GTM over a direct GA4 measurement ID', () => {
    vi.stubEnv('VITE_GTM_CONTAINER_ID', 'GTM-P3C7386R')
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TESTID')
    setAnalyticsConsent(true)
    expect(loadConsentedTags()).toBe(true)
    expect(document.head.querySelector('#dutiva-gtm')).toBeTruthy()
    expect(document.head.querySelector('script[src*="gtag/js"]')).toBeNull()
  })
})
