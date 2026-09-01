/**
 * TrustedSite (Halo Security) trustmark loader — public marketing surface only.
 *
 * The vendor snippet used to ship in index.html and therefore ran on /app/* too.
 * It now loads from {@link TrustedSiteLoader} on the public route shell so the
 * signed-in workspace never executes third-party trustmark code.
 */

export const TRUSTEDSITE_SCRIPT_URL = 'https://cdn.ywxi.net/js/1.js'

const SCRIPT_ID = 'dutiva-trustedsite'

/** Inject the TrustedSite main code once. Returns true when the script is present. */
export function loadTrustedSite(): boolean {
  if (typeof document === 'undefined') return false
  if (document.getElementById(SCRIPT_ID)) return true

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.type = 'text/javascript'
  script.async = true
  script.src = TRUSTEDSITE_SCRIPT_URL
  document.body.appendChild(script)
  return true
}
