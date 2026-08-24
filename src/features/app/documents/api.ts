import { docCases, docEmployees, sampleDocuments, templateCategories } from './data'
import type { DocCase, DocEmployee, DocTemplate, GeneratedDoc, TemplateCategory } from './data'
import { allTemplates } from './catalogue'

/**
 * Read layer for the HR Documents Library.
 *
 * The catalogue is static, fictional demo content, so it is served straight
 * from the bundled fixtures — identical in the app, local dev, and tests.
 *
 * It used to be fetched at runtime from anon-readable `public.doclib_*` views
 * in the shared Supabase project. That read was removed: the fixtures are the
 * single source of truth those views were seeded from (so nothing about the
 * rendered library changes), and dropping the read means the demo no longer
 * depends on the project-wide anon key and can't share a trust boundary with
 * the real `public.*` tables. The demo schema + views are dropped in
 * supabase/migrations/0021_drop_doclib_demo_schema.sql.
 */

export interface DoclibData {
  templates: DocTemplate[]
  categories: TemplateCategory[]
  documents: GeneratedDoc[]
  employees: DocEmployee[]
  cases: DocCase[]
  /** Which source served the data — fixtures for demo, catalogue-only shell in production. */
  source: 'fixtures' | 'catalogue'
}

const FIXTURES: DoclibData = {
  templates: allTemplates,
  categories: templateCategories,
  documents: sampleDocuments,
  employees: docEmployees,
  cases: docCases,
  source: 'fixtures',
}

/** Production shell — template catalogue only; no Northgate sample rows. */
const PRODUCTION_CATALOGUE: DoclibData = {
  templates: allTemplates,
  categories: templateCategories,
  documents: [],
  employees: [],
  cases: [],
  source: 'catalogue',
}

let cache: Promise<DoclibData> | null = null
let productionCache: Promise<DoclibData> | null = null

/** Load the demo document library (bundled fixtures), resolved once per session. */
export function loadDoclibData(): Promise<DoclibData> {
  cache ??= Promise.resolve(FIXTURES)
  return cache
}

/** Load the production catalogue shell (templates only — no demo documents/people). */
export function loadProductionDoclibCatalogue(): Promise<DoclibData> {
  productionCache ??= Promise.resolve(PRODUCTION_CATALOGUE)
  return productionCache
}

/** Test hook. */
export function resetDoclibCache(): void {
  cache = null
  productionCache = null
}
