/** First-run tour dismissal flag — localStorage, per browser. */
const KEY = 'dutiva.invest.onboarded.v1'

export function onboardingDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function dismissOnboarding() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* Storage unavailable (private mode) — the tour just reappears. */
  }
}

export function resetOnboarding() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* As above — no flag to clear. */
  }
}
