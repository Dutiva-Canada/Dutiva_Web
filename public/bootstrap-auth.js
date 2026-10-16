// Magic-link safety net — see docs/AUTH_MAGIC_LINK.md and index.html comment.
;(function () {
  try {
    /* /workspace is the auth surface's own entry; /app is the legacy mount —
       both are handled by the app shell itself, so the net stays out. */
    var path = window.location.pathname
    if (path.indexOf('/workspace') === 0 || path.indexOf('/app') === 0) return
    var search = window.location.search || ''
    var hash = window.location.hash || ''
    var params = new URLSearchParams(search)
    var isAuthRedirect =
      params.has('token_hash') ||
      params.has('error_code') ||
      /[#&](access_token|refresh_token|error|error_code)=/.test(hash)
    if (isAuthRedirect) {
      window.location.replace('/workspace/auth/confirm' + search + hash)
    }
  } catch {
    /* Never let the safety net block first paint. */
  }
})()
