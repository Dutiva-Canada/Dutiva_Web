const { chromium } = require('playwright')
const path = require('path')
const out = path.join(__dirname, '..', 'hbshots-out')
const jobs = [
  { p: 'data', theme: 'light', lang: 'en', w: 1280, name: 'data-light-en' },
  { p: 'data', theme: 'dark', lang: 'fr', w: 1280, name: 'data-dark-fr' },
  { p: 'data', theme: 'light', lang: 'en', w: 390, name: 'data-light-en-mobile' },
  /* Welcome card — only shows on a truly fresh account */
  { p: 'home', theme: 'light', lang: 'en', w: 1280, name: 'welcome-light-en', extra: '&empty=1' },
  { p: 'home', theme: 'dark', lang: 'fr', w: 1280, name: 'welcome-dark-fr', extra: '&empty=1' },
  /* Habits — weekly cadence select in the add row + per-row target control */
  { p: 'habits', theme: 'light', lang: 'en', w: 1280, name: 'habits-light-en', extra: '&caps=1' },
  { p: 'habits', theme: 'dark', lang: 'fr', w: 1280, name: 'habits-dark-fr', extra: '&caps=1' },
  /* Voice call — server engine recording state with the level meter */
  { p: 'chat', theme: 'light', lang: 'en', w: 1280, name: 'call-server-en', extra: '&call=server' },
  { p: 'chat', theme: 'dark', lang: 'fr', w: 1280, name: 'call-server-dark-fr', extra: '&call=server' },
  /* Insights — two-week recap button copy */
  { p: 'insights', theme: 'light', lang: 'en', w: 1280, name: 'insights-light-en' },
  { p: 'insights', theme: 'dark', lang: 'fr', w: 1280, name: 'insights-dark-fr' },
  /* Insights sparse — the starting-point frame on a thin window */
  { p: 'insights', theme: 'light', lang: 'en', w: 1280, name: 'insights-sparse-en', extra: '&days=2' },
  { p: 'insights', theme: 'dark', lang: 'fr', w: 1280, name: 'insights-sparse-fr', extra: '&days=2' },
]
;(async () => {
  const browser = await chromium.launch()
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: { width: j.w, height: 1000 } })
    await page.goto(
      `http://localhost:5173/dev-health-preview?p=${j.p}&theme=${j.theme}&lang=${j.lang}${j.extra || ''}`,
      { waitUntil: 'networkidle' },
    )
    await page.waitForTimeout(900)
    await page.screenshot({ path: path.join(out, `${j.name}.png`), fullPage: true })
    console.log(j.name)
    await page.close()
  }
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
