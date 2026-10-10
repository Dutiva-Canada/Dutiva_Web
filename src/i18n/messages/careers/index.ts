import { careersApplications } from './applications'
import { careersAssistant } from './assistant'
import { careersBoard } from './board'
import { careersPortal } from './portal'

/** Candidate Portal — B2C job application product. Bilingual messages for
    the public job board (/careers) and the authenticated candidate portal
    (/careers/portal). Split by section for maintainability. */
export const careersMessages = {
  ...careersBoard,
  ...careersPortal,
  ...careersApplications,
  ...careersAssistant,
}
