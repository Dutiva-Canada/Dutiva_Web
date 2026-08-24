// Magic-link safety net — see docs/AUTH_MAGIC_LINK.md and index.html comment.
;(function () {
  try {
    if (window.location.pathname.indexOf('/app') === 0) return
    var search = window.location.search || ''
    var hash = window.location.hash || ''
    var params = new URLSearchParams(search)
    var isAuthRedirect =
      params.has('token_hash') ||
      params.has('error_code') ||
      /[#&](access_token|refresh_token|error|error_code)=/.test(hash)
    if (isAuthRedirect) {
      window.location.replace('/app/auth/confirm' + search + hash)
    }
  } catch {
    /* Never let the safety net block first paint. */
  }
})()
