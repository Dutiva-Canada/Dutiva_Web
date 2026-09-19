// Live check: security agent tools through the Advisor rail (demo workspace —
// SecurityDataProvider binds reads + the real register mutators, so commits
// land in fixture state for real: report/resolve incident, complete review).
// Run: node scripts/_tmp-agent-sec-check.mjs   (dev server must be on :5173)
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
  await page.waitForTimeout(1400)
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

/* ── 1. EN: report an incident — real fixture write ─────────────────────── */
await page.goto(`${BASE}/app/security/incidents`, { waitUntil: 'networkidle' })
await openRail(page)
let r = await railTurn(
  page,
  'report a security incident — suspicious email attachment opened',
  'Confirm',
)
report('EN report — card rendered', r.card)
report(
  'EN report — incident logged',
  /Incident logged/i.test(r.body) && /suspicious email attachment/i.test(r.body),
)
report(
  'EN report — register shows the new incident',
  /Suspicious email attachment opened/i.test(r.body),
)
await page.screenshot({ path: `${OUT}/sec-report-en.png` })

/* ── 2. EN: resolve the contained fixture incident — row flips ──────────── */
await page.goto(`${BASE}/app/security/incidents`, { waitUntil: 'networkidle' })
await openRail(page)
r = await railTurn(page, 'resolve the suspicious login incident', 'Confirm')
report('EN resolve — card rendered', r.card)
report(
  'EN resolve — resolved message',
  /Resolved — Suspicious login/i.test(r.body) || /Resolved/i.test(r.body),
)
await page.screenshot({ path: `${OUT}/sec-resolve-en.png` })

/* ── 3. EN: resolve it again in the SAME session — a reload would restore
     the contained fixture; the idempotency check needs the live state. ──── */
r = await railTurn(page, 'resolve the suspicious login incident', 'Confirm')
report('EN resolve-again — card rendered', r.card)
report('EN resolve-again — idempotent', /Already resolved/i.test(r.body))

/* ── 4. EN: complete the Q3 access review — row flips ───────────────────── */
await page.goto(`${BASE}/app/security/access`, { waitUntil: 'networkidle' })
await openRail(page)
r = await railTurn(page, 'mark the access review Q3 admin as done', 'Confirm')
report('EN review — card rendered', r.card)
report(
  'EN review — completed message',
  /Access review completed/i.test(r.body) && /Q3 admin/i.test(r.body),
)
await page.screenshot({ path: `${OUT}/sec-review-en.png` })

/* ── 5. EN read: open incidents through the rail (no confirm needed) ────── */
await page.goto(`${BASE}/app/security/incidents`, { waitUntil: 'networkidle' })
await openRail(page)
{
  const rail = page.getByRole('dialog')
  await rail.getByRole('textbox').fill('list my security incidents')
  await rail.getByRole('button', { name: /^(Send|Envoyer)$/ }).click()
  await page.waitForTimeout(2200)
  const body = await page.locator('body').innerText()
  report('EN read — incidents surface', /incident/i.test(body))
}

/* ── 6. Dark + FR: report an incident — real write, French copy ─────────── */
await page.emulateMedia({ colorScheme: 'dark' })
await page.goto(`${BASE}/app/security/incidents`, { waitUntil: 'networkidle' })
{
  const frToggle = page.getByRole('button', { name: /^(FR|Français)$/ })
  if (await frToggle.count()) await frToggle.first().click()
  await page.waitForTimeout(800)
}
await openRail(page)
r = await railTurn(page, 'consigne un incident de sécurité — hameçonnage', 'Confirmer')
report('FR report — card rendered', r.card)
report(
  'FR report — incident logged in French',
  /Incident consigné/i.test(r.body) && /hameçonnage/i.test(r.body),
)
await page.screenshot({ path: `${OUT}/sec-report-fr-dark.png` })

/* ── 7. FR: complete the access review — the noun-guarded rescue ────────── */
await page.goto(`${BASE}/app/security/access`, { waitUntil: 'networkidle' })
await openRail(page)
r = await railTurn(page, "termine la revue d'accès Q3", 'Confirmer')
report('FR review — card rendered', r.card)
report(
  'FR review — completed or already-completed',
  /revue d’accès terminée|Déjà terminée/i.test(r.body),
)
await page.screenshot({ path: `${OUT}/sec-review-fr-dark.png` })

await browser.close()
console.log(ok.join('\n'))
if (bad.length) console.log('\n' + bad.join('\n'))
process.exit(bad.length ? 1 : 0)
