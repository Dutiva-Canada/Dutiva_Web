// Live check: operations agent tools through the Advisor rail (demo workspace —
// OperationsDataProvider mutators run locally, so writes should land for real).
// Run: node scripts/_tmp-agent-ops-check.mjs   (dev server must be on :5173)
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const OUT = '.playwright-mcp'
const ok = []
const bad = []
const report = (name, pass, extra = '') =>
  (pass ? ok : bad).push(`${pass ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`)

async function railTurn(page, text, confirmLabel) {
  const rail = page.getByRole('dialog')
  await rail.getByRole('textbox').fill(text)
  await rail.getByRole('button', { name: /^(Send|Envoyer)$/ }).click()
  await page.waitForTimeout(2200)
  const confirm = rail.getByRole('button', { name: confirmLabel })
  if ((await confirm.count()) === 0) return { card: false, body: '' }
  await confirm.first().click()
  await page.waitForTimeout(1200)
  return { card: true, body: await page.locator('body').innerText() }
}

async function openRail(page) {
  await page
    .getByRole('button', { name: /Ask Advisor|Demander au Conseiller/ })
    .first()
    .click()
  await page.getByRole('dialog').waitFor({ timeout: 8000 })
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
const page = await ctx.newPage()

/* ── 1. EN: mark the workstation shipment delivered ─────────────────────── */
await page.goto(`${BASE}/app/operations/logistics`, { waitUntil: 'networkidle' })
await openRail(page)
let r = await railTurn(page, 'mark the workstation shipment as delivered', 'Confirm')
report('EN deliver — card rendered', r.card)
report('EN deliver — outcome', /Marked as delivered/i.test(r.body))
report(
  'EN deliver — register shows delivered',
  /New workstation shipment/.test(r.body) && /delivered/i.test(r.body),
)
await page.screenshot({ path: `${OUT}/ops-deliver-en.png` })

/* ── 2. EN: add a vendor ────────────────────────────────────────────────── */
await page.goto(`${BASE}/app/operations/vendors`, { waitUntil: 'networkidle' })
await openRail(page)
r = await railTurn(page, 'add a vendor Groupe Alimex', 'Confirm')
report('EN vendor — card rendered', r.card)
report('EN vendor — outcome', /Vendor added — Groupe Alimex/i.test(r.body))
report('EN vendor — register row', /Groupe Alimex/.test(r.body))
await page.screenshot({ path: `${OUT}/ops-vendor-en.png` })

/* ── 3. EN: project status → on hold ────────────────────────────────────── */
await page.goto(`${BASE}/app/operations/projects`, { waitUntil: 'networkidle' })
await openRail(page)
r = await railTurn(page, 'mark the project office relocation as on hold', 'Confirm')
report('EN project — card rendered', r.card)
report('EN project — outcome', /Project on hold — Office relocation/i.test(r.body))
await page.screenshot({ path: `${OUT}/ops-project-en.png` })

/* ── 4. Dark + FR: marque le projet … comme terminé ─────────────────────── */
await page.emulateMedia({ colorScheme: 'dark' })
await page.goto(`${BASE}/fr/app/operations/projets`, { waitUntil: 'networkidle' })
// FR route may not be localized — fall back to /app/operations/projects + lang toggle
if (!(await page.getByRole('button', { name: /Demander au Conseiller/ }).count())) {
  await page.goto(`${BASE}/app/operations/projects`, { waitUntil: 'networkidle' })
  const frToggle = page.getByRole('button', { name: /^(FR|Français)$/ })
  if (await frToggle.count()) await frToggle.first().click()
  await page.waitForTimeout(800)
}
await openRail(page)
r = await railTurn(page, 'marque le projet relocation comme terminé', 'Confirmer')
report('FR project — card rendered', r.card)
report('FR project — outcome', /Projet terminé — Office relocation/i.test(r.body))
await page.screenshot({ path: `${OUT}/ops-project-fr-dark.png` })

console.log(ok.concat(bad).join('\n'))
console.log(`\n${ok.length} passed, ${bad.length} failed`)
await browser.close()
process.exit(bad.length ? 1 : 0)
