import { afterEach, describe, expect, it } from 'vitest'
import { loadTrustedSite, TRUSTEDSITE_SCRIPT_URL } from './trustedsite'

describe('loadTrustedSite', () => {
  afterEach(() => {
    document.getElementById('dutiva-trustedsite')?.remove()
  })

  it('injects the vendor script once', () => {
    expect(loadTrustedSite()).toBe(true)
    const script = document.getElementById('dutiva-trustedsite')
    expect(script).toBeInstanceOf(HTMLScriptElement)
    expect((script as HTMLScriptElement).src).toBe(TRUSTEDSITE_SCRIPT_URL)
    expect(loadTrustedSite()).toBe(true)
    expect(document.querySelectorAll('#dutiva-trustedsite')).toHaveLength(1)
  })
})
