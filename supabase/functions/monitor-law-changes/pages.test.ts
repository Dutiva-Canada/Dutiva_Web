import { describe, expect, it } from 'vitest'
import { isAllowedLawHost } from './lawRecovery'
import { MONITORED_PAGES } from './pages'

/**
 * Registry sanity for MONITORED_PAGES — the list is data, so nothing else in
 * the suite notices when an entry drifts (a typo'd URL silently disables a
 * monitor, a missing source field falls back to html hashing on a page that
 * needs the structured strategy).
 */
describe('MONITORED_PAGES registry', () => {
  it('gives every page a jurisdiction, name, and https URL', () => {
    for (const page of MONITORED_PAGES) {
      expect(page.jurisdiction, page.law_name).toBeTruthy()
      expect(page.law_name).toBeTruthy()
      expect(page.url).toMatch(/^https:\/\//)
      for (const fb of page.fallbacks) expect(fb).toMatch(/^https:\/\//)
      if (page.referenceUrl) expect(page.referenceUrl).toMatch(/^https:\/\//)
    }
  })

  it('keeps URLs and fallbacks unique — a duplicated target would double-count a page', () => {
    const urls = MONITORED_PAGES.map((p) => p.url)
    expect(new Set(urls).size).toBe(urls.length)
    for (const page of MONITORED_PAGES) {
      expect(new Set(page.fallbacks).size).toBe(page.fallbacks.length)
      expect(page.fallbacks).not.toContain(page.url)
    }
  })

  it('points every structured source at its own documented shape', () => {
    for (const page of MONITORED_PAGES) {
      const source = page.source ?? { kind: 'html' as const }
      if (source.kind === 'html') continue

      // API/XML urls are machine endpoints — readers get referenceUrl instead.
      expect(page.referenceUrl, `${page.law_name} needs a human-facing referenceUrl`).toBeTruthy()

      if (source.kind === 'justice-xml') {
        // The XML filename IS the consolidated number — a mismatch reads the
        // wrong statute's amendment date.
        expect(page.url).toContain(`/${source.consolidatedNumber}.xml`)
      }
      if (source.kind === 'ontario-api') {
        // The e-Laws statute id in url and referenceUrl must be the same act.
        const apiId = page.url.match(/statute\/([0-9a-z]+)$/)?.[1]
        const refId = page.referenceUrl?.match(/statute\/([0-9a-z]+)$/)?.[1]
        expect(apiId, page.law_name).toBeTruthy()
        expect(apiId).toBe(refId)
      }
      if (source.kind === 'quebec-ckan') {
        expect(source.resourceName).toBeTruthy()
        expect(source.statuteCode).toBeTruthy()
      }
    }
  })

  it('keeps every registry host inside the recovery allowlist', () => {
    /* If a monitored page's own host were outside ALLOWED_LAW_HOST_SUFFIXES,
       the SSRF guard would refuse a recovery suggestion that simply moves the
       page within its own domain — the one suggestion we most want to take. */
    for (const page of MONITORED_PAGES) {
      for (const url of [page.url, ...page.fallbacks, page.referenceUrl ?? '']) {
        if (!url) continue
        expect(isAllowedLawHost(url), `${url} (${page.law_name})`).toBe(true)
      }
    }
  })

  it('covers all 14 Canadian jurisdictions', () => {
    const jurisdictions = new Set(MONITORED_PAGES.map((p) => p.jurisdiction))
    expect(jurisdictions.size).toBe(14)
  })
})
