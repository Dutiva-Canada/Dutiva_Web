import { KnowledgeDemoView } from './KnowledgeDemoView'

/**
 * Knowledge Base — the HR library article list (App v2.dc.html markup lines
 * 1251–1265, `buildKnowledgeView()` lines 3524–3529). A search input filters
 * articles by title or tag (case-insensitive substring, empty query passes
 * everything); opening an article asks the Advisor rail for a summary
 * (prototype `openRail(a.title, { text: …, citations: [] })`).
 *
 * The prototype matches its EN state strings; here matching runs against the
 * current language so FR users can search FR titles (same decision as
 * `filterSearchEntries` in the search corpus).
 *
 * GuidanceSourcesPanel below the article list is real backend data with no
 * prototype counterpart — see its own doc comment.
 */
export function KnowledgeView() {
  return <KnowledgeDemoView />
}
