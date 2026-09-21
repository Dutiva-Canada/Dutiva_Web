// Live check: documents agent tools through the Advisor rail (demo workspace —
// DoclibProvider binds reads + simulated send; `approve` is unbound and every
// send precondition is fixture-gated, so commits should refuse honestly).
// Run: node scripts/_tmp-agent-docs-check.mjs   (dev server must be on :5173)
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

/* ── 1. EN: approve a document — demo has no approve mutator → refusal ──── */
await page.goto(`${BASE}/app/documents`, { waitUntil: 'networkidle' })
await openRail(page)
let r = await railTurn(page, 'approve the termination letter', 'Confirm')
report('EN approve — card rendered', r.card)
report('EN approve — honest demo refusal', /Not available in the demo workspace/i.test(r.body))
await page.screenshot({ path: `${OUT}/docs-approve-en.png` })

/* ── 2. EN: send an unapproved doc → "must be approved" refusal ─────────── */
await page.goto(`${BASE}/app/documents`, { waitUntil: 'networkidle' })
await openRail(page)
r = await railTurn(
  page,
  'send the termination letter to jordan@northgate.ca for signature',
  'Confirm',
)
report('EN send unapproved — card rendered', r.card)
report(
  'EN send unapproved — needs-approval refusal',
  /must be approved before it can go out for signature/i.test(r.body),
)
await page.screenshot({ path: `${OUT}/docs-send-draft-en.png` })

/* ── 3. EN: send a doc with an existing envelope → refusal ──────────────── */
await page.goto(`${BASE}/app/documents`, { waitUntil: 'networkidle' })
await openRail(page)
r = await railTurn(
  page,
  'send the employment agreement to jane@northgate.ca for signature',
  'Confirm',
)
report('EN send existing — card rendered', r.card)
report('EN send existing — envelope refusal', /signature envelope already exists/i.test(r.body))
await page.screenshot({ path: `${OUT}/docs-send-existing-en.png` })

/* ── 4. EN: send an approved+unsent doc → the simulated envelope lands ──── */
await page.goto(`${BASE}/app/documents`, { waitUntil: 'networkidle' })
await openRail(page)
r = await railTurn(
  page,
  'send the performance improvement plan to daniel@northgate.ca for signature',
  'Confirm',
)
report('EN send approved — card rendered', r.card)
report(
  'EN send approved — envelope created',
  /Sent for signature/i.test(r.body) && /daniel@northgate\.ca/i.test(r.body),
)
report('EN send approved — register row flipped', /Performance improvement plan/.test(r.body))
await page.screenshot({ path: `${OUT}/docs-send-ok-en.png` })

/* ── 5. Dark + FR: approuve la lettre → honest demo refusal ─────────────── */
await page.emulateMedia({ colorScheme: 'dark' })
await page.goto(`${BASE}/fr/app/documents`, { waitUntil: 'networkidle' })
if (!(await page.getByRole('button', { name: /Demander au Conseiller/ }).count())) {
  // FR route may not exist — go EN and flip the language toggle
  await page.goto(`${BASE}/app/documents`, { waitUntil: 'networkidle' })
  const frToggle = page.getByRole('button', { name: /^(FR|Français)$/ })
  if (await frToggle.count()) await frToggle.first().click()
  await page.waitForTimeout(800)
}
await openRail(page)
r = await railTurn(page, 'approuve la lettre de cessation', 'Confirmer')
report('FR approve — card rendered', r.card)
report('FR approve — honest demo refusal', /espace de démo|démonstration/i.test(r.body))
await page.screenshot({ path: `${OUT}/docs-approve-fr-dark.png` })

await browser.close()
console.log(ok.join('\n'))
if (bad.length) console.log('\n' + bad.join('\n'))
process.exit(bad.length ? 1 : 0)
