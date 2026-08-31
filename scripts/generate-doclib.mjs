/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * ONE-SHOT IMPORT — kept for provenance, not runnable.
 *
 * This read the HR Documents Library handoff's `dutiva-data.js` (exported to
 * JSON) and emitted the T01–T16 fixture modules. Both paths below point at a
 * developer machine that no longer exists and the source JSON was never
 * committed, so running this today fails at the first `readFileSync` — and if
 * the inputs were ever restored, it would overwrite `templates/index.ts` and
 * `meta.ts`, dropping every template authored in-repo since the import.
 *
 * Templates added after the import are hand-authored against the model in
 * `data/types.ts`. See docs/FOUR_RING_FRAMEWORK.md.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const JSON_DIR = String.raw`C:\Users\Marti\AppData\Local\Temp\claude\C--Users-Marti-OneDrive-Desktop-Dutiva--Redesign-\e1b6f6bc-5c7c-4641-9ed0-26d5bd73c8ea\scratchpad\doclib-json`
const REPO = String.raw`C:\Users\Marti\OneDrive\Desktop\Dutiva (Redesign)`
const DATA_DIR = join(REPO, 'src', 'features', 'app', 'documents', 'data')
const load = (n) => JSON.parse(readFileSync(join(JSON_DIR, `${n}.json`), 'utf8'))

const templates = load('templates')
const documents = load('documents')
const employees = load('employees')
const cases = load('cases')
const i18n = load('i18n')
const dataModel = load('dataModel')
const meta = load('meta')

const fail = (msg) => {
  throw new Error(msg)
}
const bi = (en, fr, ctx) => {
  if (typeof en !== 'string' || typeof fr !== 'string') fail(`missing en/fr at ${ctx}`)
  return { en, fr }
}
const zipBi = (ens, frs, ctx) => {
  if (!Array.isArray(ens) || !Array.isArray(frs) || ens.length !== frs.length)
    fail(`parallel array mismatch at ${ctx}: ${ens?.length} vs ${frs?.length}`)
  return ens.map((en, i) => ({ en, fr: frs[i] }))
}
const inSet = (v, set, ctx) => {
  if (!set.includes(v)) fail(`unexpected value '${v}' at ${ctx}`)
  return v
}

const DOC_STATUS = [
  'draft',
  'in_review',
  'needs_revision',
  'approved',
  'sent_for_signature',
  'partially_signed',
  'signed',
  'exported',
  'archived',
  'voided',
  'deleted',
]
const REVIEW = [
  'not_reviewed',
  'hr_review_required',
  'lawyer_review_recommended',
  'approved_for_use',
]
const SIG = [
  'not_sent',
  'sent',
  'viewed',
  'pending',
  'partially_signed',
  'signed',
  'declined',
  'expired',
  'voided',
]
const AUDIT = [
  'template_opened',
  'generation_started',
  'draft_saved',
  'document_created',
  'document_updated',
  'version_created',
  'review_requested',
  'review_approved',
  'review_rejected',
  'sent_for_signature',
  'signature_viewed',
  'signature_completed',
  'document_exported',
  'document_archived',
  'document_restored',
  'document_voided',
  'permission_changed',
  'comment_added',
]
const JURIS = ['ON', 'QC', 'FED']
const RISK = ['low', 'medium', 'high']
const QTYPES = ['text', 'textarea', 'date', 'number', 'select', 'radio']
const BLOCKS = ['title', 'meta', 'para', 'clause', 'sig', 'ack', 'note']
const CATS = ['hiring', 'agreements', 'policies', 'discipline', 'termination']
const SUBJECTS = ['candidate', 'employee', 'org', 'external']

/* ---------- transform templates ---------- */
const outTemplates = templates.map((t) => {
  const ctx = t.tid
  const questions = t.questions.map((q) => {
    const out = {
      id: q.id,
      section: bi(q.section_en, q.section_fr, `${ctx}.${q.id}.section`),
      label: bi(q.label_en, q.label_fr, `${ctx}.${q.id}.label`),
      type: inSet(q.type, QTYPES, `${ctx}.${q.id}.type`),
      required: !!q.required,
    }
    if (q.placeholder_en)
      out.placeholder = bi(q.placeholder_en, q.placeholder_fr, `${ctx}.${q.id}.ph`)
    if (q.hint_en) out.hint = bi(q.hint_en, q.hint_fr, `${ctx}.${q.id}.hint`)
    if (q.options)
      out.options = q.options.map((o) => ({
        value: o.value,
        label: bi(o.label_en, o.label_fr, `${ctx}.${q.id}.opt`),
      }))
    const extra = Object.keys(q).filter(
      (k) =>
        ![
          'id',
          'section_en',
          'section_fr',
          'label_en',
          'label_fr',
          'type',
          'required',
          'placeholder_en',
          'placeholder_fr',
          'hint_en',
          'hint_fr',
          'options',
        ].includes(k),
    )
    if (extra.length) fail(`unknown question keys ${extra} at ${ctx}.${q.id}`)
    return out
  })
  const preview = t.preview.map((b, i) => {
    const out = { type: inSet(b.type, BLOCKS, `${ctx}.preview[${i}]`) }
    if (b.type === 'sig') out.roles = zipBi(b.roles_en, b.roles_fr, `${ctx}.preview[${i}].roles`)
    else out.text = bi(b.en, b.fr, `${ctx}.preview[${i}]`)
    if (b.n !== undefined) out.n = b.n
    if (b.heading_en) out.heading = bi(b.heading_en, b.heading_fr, `${ctx}.preview[${i}].heading`)
    if (b.tone) out.tone = inSet(b.tone, ['info', 'risk'], `${ctx}.preview[${i}].tone`)
    if (b.when) out.when = b.when
    const extra = Object.keys(b).filter(
      (k) =>
        ![
          'type',
          'en',
          'fr',
          'n',
          'heading_en',
          'heading_fr',
          'when',
          'roles_en',
          'roles_fr',
          'tone',
        ].includes(k),
    )
    if (extra.length) fail(`unknown preview keys ${extra} at ${ctx}[${i}]`)
    return out
  })
  const notes = {}
  for (const [j, v] of Object.entries(t.jurisdiction_notes ?? {})) {
    inSet(j, JURIS, `${ctx}.notes`)
    notes[j] = bi(v.en, v.fr, `${ctx}.notes.${j}`)
  }
  return {
    id: t.id,
    tid: t.tid,
    key: t.key,
    kind: t.kind,
    category: inSet(t.category, CATS, ctx),
    core: !!t.core,
    name: bi(t.name_en, t.name_fr, ctx),
    desc: bi(t.desc_en, t.desc_fr, ctx),
    jurisdictions: t.jurisdictions.map((j) => inSet(j, JURIS, ctx)),
    risk: inSet(t.risk, RISK, ctx),
    review: inSet(t.review, REVIEW, ctx),
    requiresLawyerReview: !!t.requires_lawyer_review,
    version: t.version,
    versionNumber: t.version_number,
    effectiveDate: t.effective_date,
    updatedAt: t.updated_at,
    estMinutes: t.est_minutes,
    usageCount: t.usage_count,
    statutory: zipBi(t.statutory_en, t.statutory_fr, `${ctx}.statutory`),
    jurisdictionNotes: notes,
    includes: zipBi(t.includes_en, t.includes_fr, `${ctx}.includes`),
    questions,
    preview,
    subject: inSet(t.subject, SUBJECTS, ctx),
    ...(t.bodyHtml_en ? { bodyHtmlEn: t.bodyHtml_en } : {}),
  }
})

/* ---------- transform documents ---------- */
const empIds = new Set(employees.map((e) => e.id))
const caseIds = new Set(cases.map((c) => c.id))
const tplTids = new Set(templates.map((t) => t.tid))
const documentSignature = (signature, ctx) => {
  if (!signature?.provider) return {}
  return {
    signature: {
      provider: signature.provider,
      envelopeId: signature.envelope_id,
      status: inSet(signature.status, SIG, `${ctx}.sig`),
      ...(signature.sent_at ? { sentAt: signature.sent_at } : {}),
      ...(signature.viewed_at ? { viewedAt: signature.viewed_at } : {}),
      ...(signature.signed_at ? { signedAt: signature.signed_at } : {}),
      ...(signature.declined_at ? { declinedAt: signature.declined_at } : {}),
      ...(signature.expires_at ? { expiresAt: signature.expires_at } : {}),
    },
  }
}
const outDocuments = documents.map((d) => {
  const ctx = d.id
  if (!tplTids.has(d.template_tid)) fail(`unknown template ${d.template_tid} at ${ctx}`)
  if (d.employee_id && !empIds.has(d.employee_id)) fail(`unknown employee at ${ctx}`)
  if (d.case_id && !caseIds.has(d.case_id)) fail(`unknown case at ${ctx}`)
  const out = {
    id: d.id,
    ref: d.ref,
    templateTid: d.template_tid,
    templateKey: d.template_key,
    title: bi(d.title_en, d.title_fr, ctx),
    ...(d.employee_id ? { employeeId: d.employee_id } : {}),
    ...(d.case_id ? { caseId: d.case_id } : {}),
    jurisdiction: inSet(d.jurisdiction, JURIS, ctx),
    language: inSet(d.language, ['en', 'fr'], ctx),
    status: inSet(d.status, DOC_STATUS, ctx),
    reviewStatus: inSet(d.review_status, REVIEW, ctx),
    signatureStatus: inSet(d.signature_status, SIG, ctx),
    risk: inSet(d.risk, RISK, ctx),
    currentVersion: d.current_version,
    createdBy: d.created_by,
    updatedBy: d.updated_by,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    archived: !!d.archived,
    answers: d.answers ?? {},
    versions: (d.versions ?? []).map((v) => ({
      n: v.n,
      changeSummary: bi(v.change_summary_en, v.change_summary_fr, `${ctx}.v${v.n}`),
      createdBy: v.created_by,
      createdAt: v.created_at,
    })),
    recipients: (d.recipients ?? []).map((r) => ({
      name: r.name,
      type: r.type,
      email: r.email,
      order: r.order,
      status: r.status,
      ...(r.signed_at ? { signedAt: r.signed_at } : {}),
    })),
    /* A null-provider signature is the prototype's "nothing sent yet"
       placeholder — signatureStatus already says not_sent, so omit it. */
    ...documentSignature(d.signature, ctx),
    audit: (d.audit ?? []).map((a) => ({
      event: inSet(a.event, AUDIT, `${ctx}.audit`),
      actor: a.actor,
      at: a.at,
      ...(a.meta ? { meta: a.meta } : {}),
    })),
  }
  return out
})

/* ---------- meta ---------- */
const outCategories = meta.categories.map((c) => ({
  id: inSet(c.id, CATS, 'category'),
  order: c.order,
  icon: c.icon,
  name: bi(c.name_en, c.name_fr, `cat.${c.id}`),
  desc: bi(c.desc_en, c.desc_fr, `cat.${c.id}`),
}))
const outJurisdictions = meta.jurisdictions.map((j) => ({
  code: inSet(j.code, JURIS, 'juris'),
  name: bi(j.name_en, j.name_fr, `juris.${j.code}`),
  statute: bi(j.statute_en, j.statute_fr, `juris.${j.code}.statute`),
  also: zipBi(j.also_en, j.also_fr, `juris.${j.code}.also`),
}))
const outRoles = meta.roles.map((r) => ({
  key: r.key,
  label: bi(r.label_en, r.label_fr, `role.${r.key}`),
  initials: r.initials,
  desc: bi(r.desc_en, r.desc_fr, `role.${r.key}`),
}))
const outRisk = Object.fromEntries(
  Object.entries(meta.riskLevels).map(([k, v]) => [
    k,
    {
      key: v.key,
      tone: v.tone,
      order: v.order,
      label: bi(v.label_en, v.label_fr, `risk.${k}`),
      desc: bi(v.desc_en, v.desc_fr, `risk.${k}`),
    },
  ]),
)
const statusMap = (obj, name) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      { tone: v.tone, label: bi(v.label_en, v.label_fr, `${name}.${k}`) },
    ]),
  )
const outStatus = {
  document: statusMap(meta.status.document, 'status.document'),
  review: statusMap(meta.status.review, 'status.review'),
  signature: statusMap(meta.status.signature, 'status.signature'),
}
const outSectors = meta.sectors.map((s) => ({
  key: s.key,
  federallyRegulated: !!s.federally_regulated,
  name: bi(s.name_en, s.name_fr, `sector.${s.key}`),
}))
const outTiers = meta.employerSizeTiers.map((t) => ({
  key: t.key,
  min: t.min,
  max: t.max,
  label: bi(t.label_en, t.label_fr, `tier.${t.key}`),
}))
const outThresholds = meta.sizeThresholds.map((t) => ({
  at: t.at,
  text: bi(t.en, t.fr, `threshold.${t.at}`),
}))
const outOrg = {
  name: meta.org.name,
  headcount: meta.org.headcount,
  unionized: !!meta.org.unionized,
  sector: meta.org.sector,
  primaryJurisdiction: inSet(meta.org.primary_jurisdiction, JURIS, 'org'),
}
const outCases = cases.map((c) => ({
  id: c.id,
  title: bi(c.title_en, c.title_fr, c.id),
  employeeId: c.employee,
  jurisdiction: inSet(c.jurisdiction, JURIS, c.id),
  risk: inSet(c.risk, RISK, c.id),
}))
const outEmployees = employees.map((e) => ({
  id: e.id,
  name: e.name,
  jurisdiction: inSet(e.jurisdiction, JURIS, e.id),
}))

/* ---------- emit TS ---------- */
mkdirSync(join(DATA_DIR, 'templates'), { recursive: true })
const HEADER = `/* GENERATED from the HR Documents Library handoff (dutiva-data.js) — do not
   hand-edit. Regenerate with scripts/generate-doclib.mjs (see repo docs). */\n`

const emit = (rel, body) => {
  writeFileSync(join(DATA_DIR, rel), HEADER + body)
  console.log('wrote', rel)
}
const templateFileName = (template) =>
  `${template.tid.toLowerCase()}-${template.key.replaceAll('_', '-')}`
const templateSymbol = (template) => `tpl${template.tid}`

for (const t of outTemplates) {
  const file = `templates/${templateFileName(t)}.ts`
  const constName = templateSymbol(t)
  emit(
    file,
    `import type { DocTemplate } from '../types'\n\nexport const ${constName}: DocTemplate = ${JSON.stringify(t, null, 2)}\n`,
  )
}
const templateImports = outTemplates
  .map((t) => `import { ${templateSymbol(t)} } from './${templateFileName(t)}'`)
  .join('\n')
const templateSymbols = outTemplates.map(templateSymbol).join(', ')
emit(
  'templates/index.ts',
  `${templateImports}\nimport type { DocTemplate } from '../types'\n\nexport const docTemplates: DocTemplate[] = [${templateSymbols}]\n\nexport const templateByTid = new Map(docTemplates.map((t) => [t.tid, t]))\nexport const templateById = new Map(docTemplates.map((t) => [t.id, t]))\n`,
)
emit(
  'documents.ts',
  `import type { GeneratedDoc } from './types'\n\nexport const sampleDocuments: GeneratedDoc[] = ${JSON.stringify(outDocuments, null, 2)}\n`,
)
emit(
  'employees.ts',
  `import type { DocEmployee } from './types'\n\nexport const docEmployees: DocEmployee[] = ${JSON.stringify(outEmployees, null, 2)}\n`,
)
emit(
  'cases.ts',
  `import type { DocCase } from './types'\n\nexport const docCases: DocCase[] = ${JSON.stringify(outCases, null, 2)}\n`,
)
emit(
  'meta.ts',
  `import type { Bi } from '@/i18n/core'\nimport type {\n  CapabilityMatrix,\n  DocRiskLevel,\n  DocStatus,\n  JurisdictionInfo,\n  OrgProfile,\n  ReviewStatus,\n  RiskLevelInfo,\n  RoleInfo,\n  Sector,\n  SignatureStatus,\n  SizeThreshold,\n  SizeTier,\n  StatusInfo,\n  TemplateCategory,\n} from './types'\n\nexport const templateCategories: TemplateCategory[] = ${JSON.stringify(outCategories, null, 2)}\n\nexport const jurisdictionInfo: JurisdictionInfo[] = ${JSON.stringify(outJurisdictions, null, 2)}\n\nexport const workspaceRoles: RoleInfo[] = ${JSON.stringify(outRoles, null, 2)}\n\nexport const riskLevelInfo: Record<DocRiskLevel, RiskLevelInfo> = ${JSON.stringify(outRisk, null, 2)}\n\nexport const documentStatusInfo: Record<DocStatus, StatusInfo> = ${JSON.stringify(outStatus.document, null, 2)}\n\nexport const reviewStatusInfo: Record<ReviewStatus, StatusInfo> = ${JSON.stringify(outStatus.review, null, 2)}\n\nexport const signatureStatusInfo: Record<SignatureStatus, StatusInfo> = ${JSON.stringify(outStatus.signature, null, 2)}\n\nexport const capabilityMatrix: CapabilityMatrix = ${JSON.stringify(meta.permissions, null, 2)}\n\nexport const sectors: Sector[] = ${JSON.stringify(outSectors, null, 2)}\n\nexport const sizeTiers: SizeTier[] = ${JSON.stringify(outTiers, null, 2)}\n\nexport const sizeThresholds: SizeThreshold[] = ${JSON.stringify(outThresholds, null, 2)}\n\nexport const defaultOrgProfile: OrgProfile = ${JSON.stringify(outOrg, null, 2)}\n\nexport const unionNote: Bi = ${JSON.stringify(bi(meta.unionNote_en, meta.unionNote_fr, 'unionNote'), null, 2)}\n\nexport const DOC_ORG_NAME = ${JSON.stringify(meta.orgName)}\n`,
)
emit(
  'index.ts',
  `export * from './types'\nexport * from './meta'\nexport { docTemplates, templateByTid, templateById } from './templates/index'\nexport { sampleDocuments } from './documents'\nexport { docEmployees } from './employees'\nexport { docCases } from './cases'\n`,
)

/* ---------- i18n module ---------- */
const enKeys = Object.keys(i18n.en)
const frKeys = new Set(Object.keys(i18n.fr))
if (enKeys.length !== frKeys.size || enKeys.some((k) => !frKeys.has(k)))
  fail('i18n en/fr key sets differ')
const keyFor = (k) => 'doclib_' + k.replace(/[.-]/g, '_')
const seen = new Set()
const lines = enKeys.map((k) => {
  const nk = keyFor(k)
  if (seen.has(nk)) fail(`i18n key collision: ${nk}`)
  seen.add(nk)
  return `  ${nk}: { en: ${JSON.stringify(i18n.en[k])}, fr: ${JSON.stringify(i18n.fr[k])} },`
})
writeFileSync(
  join(REPO, 'src', 'i18n', 'messages', 'doclib.ts'),
  `import { defineMessages } from '../core'\n\n/**\n * HR Documents Library (Document Studio + Repository) — GENERATED from the\n * handoff's DUTIVA_DATA.i18n dictionary (215 keys x EN/FR). Key mapping:\n * dotted prototype namespaces become underscores under the doclib_ prefix\n * (studio.title -> doclib_studio_title). Regenerate via scripts/generate-doclib.mjs.\n */\nexport const doclibMessages = defineMessages({\n${lines.join('\n')}\n})\n`,
)
console.log('wrote src/i18n/messages/doclib.ts', enKeys.length, 'keys')

/* ---------- seed SQL ---------- */
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replaceAll("'", "''")}'`)
const qj = (v) => `${q(JSON.stringify(v))}::jsonb`
const qa = (arr) => `array[${arr.map((x) => q(x)).join(',')}]::text[]`
const rows = []
rows.push(
  `insert into doclib.organizations (id, name, employee_count, size_tier, unionized, sector, federally_regulated, primary_jurisdiction) values ('org_northgate', ${q(outOrg.name)}, ${outOrg.headcount}, 'small', ${outOrg.unionized}, ${q(outOrg.sector)}, false, ${q(outOrg.primaryJurisdiction)});`,
)
for (const e of outEmployees)
  rows.push(
    `insert into doclib.employees (id, organization_id, name, jurisdiction) values (${q(e.id)}, 'org_northgate', ${q(e.name)}, ${q(e.jurisdiction)});`,
  )
for (const c of outCases)
  rows.push(
    `insert into doclib.employee_cases (id, organization_id, employee_id, title_en, title_fr, jurisdiction, risk) values (${q(c.id)}, 'org_northgate', ${q(c.employeeId)}, ${q(c.title.en)}, ${q(c.title.fr)}, ${q(c.jurisdiction)}, ${q(c.risk)});`,
  )
for (const c of outCategories)
  rows.push(
    `insert into doclib.document_template_categories (id, name_en, name_fr, "order", icon, desc_en, desc_fr) values (${q(c.id)}, ${q(c.name.en)}, ${q(c.name.fr)}, ${c.order}, ${q(c.icon)}, ${q(c.desc.en)}, ${q(c.desc.fr)});`,
  )
for (const t of outTemplates) {
  rows.push(
    `insert into doclib.document_templates (id, category_id, template_key, tid, kind, core, subject, name_en, name_fr, desc_en, desc_fr, jurisdictions_supported, risk_level, review_status, requires_lawyer_review, est_minutes, usage_count, effective_date, updated_at) values (${q(t.id)}, ${q(t.category)}, ${q(t.key)}, ${q(t.tid)}, ${q(t.kind)}, ${t.core}, ${q(t.subject)}, ${q(t.name.en)}, ${q(t.name.fr)}, ${q(t.desc.en)}, ${q(t.desc.fr)}, ${qa(t.jurisdictions)}, ${q(t.risk)}, ${q(t.review)}, ${t.requiresLawyerReview}, ${t.estMinutes}, ${t.usageCount}, ${q(t.effectiveDate)}, ${q(t.updatedAt)});`,
    `insert into doclib.document_template_versions (id, template_id, version_number, question_flow_json, clause_library_json, statutory_references_json, jurisdiction_notes_json, includes_json, body_content, effective_date, created_by) values (${q(t.id + '_v' + t.versionNumber)}, ${q(t.id)}, ${t.versionNumber}, ${qj(t.questions)}, ${qj(t.preview)}, ${qj(t.statutory)}, ${qj(t.jurisdictionNotes)}, ${qj(t.includes)}, ${t.bodyHtmlEn ? q(t.bodyHtmlEn) : 'null'}, ${q(t.effectiveDate)}, 'handoff-seed');`,
  )
}
for (const d of outDocuments) {
  rows.push(
    `insert into doclib.documents (id, organization_id, employee_id, case_id, template_id, ref, title_en, title_fr, language, jurisdiction, status, risk_level, review_status, signature_status, current_version, created_by, updated_by, created_at, updated_at, archived_at, answers_json) values (${q(d.id)}, 'org_northgate', ${q(d.employeeId ?? null)}, ${q(d.caseId ?? null)}, ${q('tpl_' + d.templateTid.toLowerCase())}, ${q(d.ref)}, ${q(d.title.en)}, ${q(d.title.fr)}, ${q(d.language)}, ${q(d.jurisdiction)}, ${q(d.status)}, ${q(d.risk)}, ${q(d.reviewStatus)}, ${q(d.signatureStatus)}, ${d.currentVersion}, ${q(d.createdBy)}, ${q(d.updatedBy)}, ${q(d.createdAt)}, ${q(d.updatedAt)}, ${d.archived ? q(d.updatedAt) : 'null'}, ${qj(d.answers)});`,
  )
  for (const v of d.versions)
    rows.push(
      `insert into doclib.document_versions (id, document_id, version_number, change_summary_en, change_summary_fr, created_by, created_at) values (${q(d.id + '_v' + v.n)}, ${q(d.id)}, ${v.n}, ${q(v.changeSummary.en)}, ${q(v.changeSummary.fr)}, ${q(v.createdBy)}, ${q(v.createdAt)});`,
    )
  d.recipients.forEach((r, i) =>
    rows.push(
      `insert into doclib.document_recipients (id, document_id, recipient_type, name, email, signing_order, status, signed_at) values (${q(d.id + '_r' + (i + 1))}, ${q(d.id)}, ${q(r.type)}, ${q(r.name)}, ${q(r.email)}, ${r.order}, ${q(r.status)}, ${r.signedAt ? q(r.signedAt) : 'null'});`,
    ),
  )
  if (d.signature)
    rows.push(
      `insert into doclib.document_signatures (id, document_id, provider, external_envelope_id, status, sent_at, viewed_at, signed_at, declined_at, expires_at) values (${q(d.id + '_sig')}, ${q(d.id)}, ${q(d.signature.provider)}, ${q(d.signature.envelopeId)}, ${q(d.signature.status)}, ${d.signature.sentAt ? q(d.signature.sentAt) : 'null'}, ${d.signature.viewedAt ? q(d.signature.viewedAt) : 'null'}, ${d.signature.signedAt ? q(d.signature.signedAt) : 'null'}, ${d.signature.declinedAt ? q(d.signature.declinedAt) : 'null'}, ${d.signature.expiresAt ? q(d.signature.expiresAt) : 'null'});`,
    )
  d.audit.forEach((a, i) =>
    rows.push(
      `insert into doclib.document_audit_events (id, organization_id, document_id, actor_name, event_type, event_metadata, created_at) values (${q(d.id + '_a' + (i + 1))}, 'org_northgate', ${q(d.id)}, ${q(a.actor)}, ${q(a.event)}, ${a.meta ? q(a.meta) : 'null'}, ${q(a.at)});`,
    ),
  )
}
mkdirSync(join(REPO, 'supabase', 'migrations'), { recursive: true })
writeFileSync(
  join(REPO, 'supabase', 'migrations', '0002_doclib_seed.sql'),
  `-- GENERATED seed for the doclib demo schema (Northgate Logistics sample data).\n-- Source: HR Documents Library handoff dutiva-data.js. Regenerate via scripts/generate-doclib.mjs.\nbegin;\n${rows.join('\n')}\ncommit;\n`,
)
console.log('wrote supabase/migrations/0002_doclib_seed.sql', rows.length, 'rows')

/* ---------- DATA_MODEL.md ---------- */
const entitySection = (entity) => {
  const fields = entity.fields.map((field) => `\`${field}\``).join(', ')
  const rls = entity.rls ? ', RLS' : ''
  return `### \`${entity.table}\` (${entity.group}${rls})\n\n${entity.desc_en}\n\n- **Fields:** ${fields}\n- **Relations:** ${entity.relations.join('; ')}\n- **Surfaces in UI:** ${entity.ui_en}\n`
}
const ent = dataModel.entities.map(entitySection).join('\n')
const flow = dataModel.flow
  .map((item, index) => `${index + 1}. ${item.step_en ?? item.en ?? JSON.stringify(item)}`)
  .join('\n')
const auditEvents = dataModel.audit_events.join('`, `')
writeFileSync(
  join(REPO, 'docs', 'DATA_MODEL.md'),
  `# HR Documents Library — data model\n\nTranscribed from the handoff's "Data Model & Handoff" screen (the authoritative\nstarting spec). The prototype shipped this as an in-app dev view; per the handoff\nREADME it is deliberately NOT a product route — it lives here as engineering\ndocumentation instead. The live demo schema is \`doclib\` in the Dutiva Supabase\nproject (see \`supabase/migrations/\`); ids are semantic text slugs for the demo\nseed (production would use uuids).\n\n**Stack:** ${dataModel.stack}\n\n## Entities\n\n${ent}\n## End-to-end flow\n\n${flow}\n\n## Audit event catalogue\n\n\`${auditEvents}\`\n\n\`document_audit_events\` is append-only: no UPDATE/DELETE is granted on it, even\nto service roles.\n`,
)
console.log('wrote docs/DATA_MODEL.md')
console.log(
  '\nDONE. templates:',
  outTemplates.length,
  'documents:',
  outDocuments.length,
  'i18n keys:',
  enKeys.length,
)
