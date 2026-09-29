import { createContext } from 'react'
import type { PublicJobPosting } from './data/jobBoardApi'

/**
 * Build-time posting injection for the prerender pipeline. When
 * `renderPage` renders a `/careers/jobs/:slug` URL it provides the posting
 * row it already fetched, so the detail page's single static render emits
 * the real content and `<Seo>` head instead of the client loading state.
 * Absent in the browser — the page fetches via `useEffect` as usual.
 */
export const PrerenderJobPostingContext = createContext<PublicJobPosting | null>(null)
