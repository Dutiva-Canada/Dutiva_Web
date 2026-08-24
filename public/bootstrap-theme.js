// Theme + language bootstrap before first paint — see index.html comment.
;(function () {
  var storage = null
  try {
    storage = window.localStorage
  } catch {
    /* private mode — defaults below */
  }
  var theme = storage && storage.getItem('dutiva-theme')
  if (theme !== 'light' && theme !== 'dark') {
    theme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
  }
  document.documentElement.dataset.theme = theme
  var chrome = theme === 'dark' ? '#081019' : '#f3f5fa'
  var tints = document.querySelectorAll('meta[name="theme-color"]')
  for (var i = 0; i < tints.length; i++) {
    tints[i].setAttribute('content', chrome)
  }
  var path = window.location.pathname
  var lang = 'en-CA'
  if (path === '/fr' || path.indexOf('/fr/') === 0) {
    lang = 'fr-CA'
  } else if (path.indexOf('/app') === 0) {
    var stored = storage && storage.getItem('dutiva-lang')
    if (stored === 'fr') lang = 'fr-CA'
  }
  document.documentElement.lang = lang
})()
