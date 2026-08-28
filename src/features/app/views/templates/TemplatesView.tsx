import { TemplatesDemoView } from './TemplatesDemoView'

/**
 * Templates — the Document Studio template gallery (App v2.dc.html markup
 * lines 1232–1250, `buildTemplatesView()` lines 3457–3462). A responsive
 * auto-fill grid of template tiles in fixture order; clicking a tile opens
 * the document in the shared Document Studio overlay without the generation
 * shimmer (prototype `openDocFromLibrary`).
 *
 * Honours global-search navigation: arriving with `location.state`
 * = `TemplatesSearchNavState { docKey }` opens that template on mount (the
 * prototype's search-result `openDocFromLibrary(title, category)`), then
 * clears the state so history navigation doesn't re-open it.
 */
export function TemplatesView() {
  return <TemplatesDemoView />
}
