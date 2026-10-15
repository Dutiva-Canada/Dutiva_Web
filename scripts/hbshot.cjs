/* Health portal visual sweep — screenshots every /health page from the
   dev-only preview harness (src/dev/HealthPreview.tsx) across themes,
   languages, widths, and empty states. No auth needed.

   Usage:
     npm run dev            # Vite on :5173
     node scripts/hbshot.cjs

   Env:
     HBSHOTS_OUT   output dir (default: ./hbshots-out)
     HBSHOTS_BASE  preview URL (default: http://localhost:5173/dev-health-preview) */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const OUT = process.env.HBSHOTS_OUT || path.join(process.cwd(), 'hbshots-out')
const BASE = process.env.HBSHOTS_BASE || 'http://localhost:5173/dev-health-preview'

const jobs = []
const pages = ['home', 'check-in', 'habits', 'journal', 'tools', 'insights', 'resources', 'review', 'chat']
for (const p of pages) jobs.push({ p, theme: 'light', lang: 'en', w: 1280, h: 900 })
// dark + fr + mobile spot checks
for (const p of ['home', 'check-in', 'journal', 'chat'])
  jobs.push({ p, theme: 'dark', lang: 'en', w: 1280, h: 900 })
for (const p of ['home', 'check-in', 'resources', 'tools'])
  jobs.push({ p, theme: 'light', lang: 'fr', w: 1280, h: 900 })
jobs.push({ p: 'home', theme: 'light', lang: 'en', w: 390, h: 844 })
jobs.push({ p: 'check-in', theme: 'light', lang: 'en', w: 390, h: 844 })
jobs.push({ p: 'home', theme: 'light', lang: 'en', w: 1280, h: 900, empty: true })
jobs.push({ p: 'journal', theme: 'light', lang: 'en', w: 1280, h: 900, empty: true })
/* Voice-call overlay — speech engine (listening) and the server engine's
   tap-to-talk recording state, whose provenance note differs. */
jobs.push({ p: 'chat', theme: 'light', lang: 'en', w: 1280, h: 900, call: '1' })
jobs.push({ p: 'chat', theme: 'dark', lang: 'fr', w: 1280, h: 900, call: 'server' })

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
  for (const j of jobs) {
    const url = `${BASE}?p=${j.p}&theme=${j.theme}&lang=${j.lang}${j.empty ? '&empty=1' : ''}${j.call ? `&call=${j.call}` : ''}`
    try {
      await page.setViewportSize({ width: j.w, height: j.h })
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(900)
      const name = `${j.p}-${j.theme}-${j.lang}-${j.w}${j.empty ? '-empty' : ''}${j.call ? `-call-${j.call}` : ''}.png`
      await page.screenshot({ path: path.join(OUT, name), fullPage: true })
      console.log('shot', name)
    } catch (e) {
      console.log('FAIL', j.p, j.theme, j.lang, String(e).slice(0, 120))
    }
  }
  if (errors.length) console.log('PAGEERRORS:', errors.slice(0, 10))
  await browser.close()
})()
