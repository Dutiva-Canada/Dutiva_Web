# Accessibility Requirements

## Target

`ACC-REQ-001`: The product SHALL meet or exceed **WCAG 2.1 Level AA** for all user-facing web surfaces.

`ACC-REQ-002`: The product SHOULD aim for WCAG 2.1 AAA where it does not conflict with design or legal constraints.

---

## Perceivable

`ACC-REQ-003`: All non-text content SHALL have appropriate text alternatives:

- images and icons SHALL have descriptive `alt` text or be marked as decorative;
- complex images (e.g., diagrams, timelines) SHALL have longer descriptions where needed;
- video and audio SHALL have captions/transcripts where provided.

`ACC-REQ-004`: Information SHALL NOT be conveyed by colour alone. Status, errors, and required fields SHALL have additional visual indicators (text, icons, patterns) and programmatic cues.

`ACC-REQ-005`: Colour contrast SHALL meet WCAG 2.1 AA minimums:

- 4.5:1 for normal text;
- 3:1 for large text and graphical objects;
- focus indicators SHALL be visible against adjacent colours.

`ACC-REQ-006`: Text SHALL be resizable up to 200% without loss of content or functionality.

`ACC-REQ-007`: The product SHALL honour user preferences for reduced motion and reduced transparency.

---

## Operable

`ACC-REQ-008`: All interactive elements SHALL be operable by keyboard alone, with a visible and logical tab order.

`ACC-REQ-009`: Keyboard focus SHALL not be trapped unexpectedly. Users SHALL be able to exit modals, overlays, and rich components using standard keys (`Escape`, `Tab`, `Shift+Tab`).

`ACC-REQ-010`: Focus management SHALL be predictable:

- focus moves to the start of a newly opened modal or dialog;
- focus returns to the triggering element when the dialog closes;
- focus is visible on all focusable elements.

`ACC-REQ-011`: Touch targets SHALL be at least 44 × 44 CSS pixels on mobile.

`ACC-REQ-012`: The product SHALL support standard browser zoom and text scaling.

`ACC-REQ-013`: Sufficient time SHALL be provided for users to read and interact with content. Auto-advancing content SHALL be pauseable, stoppable, or hideable.

`ACC-REQ-014`: Users SHALL be warned before session timeout and given a way to extend the session without losing data.

---

## Understandable

`ACC-REQ-015`: Content SHALL be written in plain language appropriate for the target audience.

`ACC-REQ-016`: Legal and administrative terms SHALL be explained or linked to plain-language definitions.

`ACC-REQ-017`: Error messages SHALL be clear, specific, and actionable. They SHALL identify the field in error and describe how to fix it.

`ACC-REQ-018`: Forms SHALL use proper labels, fieldsets, legends, and programmatic associations (`label for`, `aria-labelledby`, etc.).

`ACC-REQ-019`: Required fields SHALL be indicated programmatically and visually.

`ACC-REQ-020`: Navigation and wayfinding SHALL be consistent across products and pages.

`ACC-REQ-021`: A skip-to-content link or equivalent SHALL be available on content-heavy pages.

`ACC-REQ-022`: Breadcrumbs, page titles, and headings SHALL reflect the user's location and task.

---

## Robust

`ACC-REQ-023`: Markup SHALL validate and use semantic HTML elements (`header`, `nav`, `main`, `section`, `article`, `footer`, etc.).

`ACC-REQ-024`: ARIA roles, states, and properties SHALL be used correctly and sparingly, only when native semantics are insufficient.

`ACC-REQ-025`: Status messages and live regions SHALL be announced by assistive technologies without moving focus unless the user explicitly navigates to them.

`ACC-REQ-026`: Custom components (comboboxes, tabs, dialogs, timelines, document viewers) SHALL follow established accessibility patterns (ARIA Authoring Practices).

---

## Screen-reader and assistive-technology support

`ACC-REQ-027`: The product SHALL be tested with at least one desktop and one mobile screen reader (e.g., NVDA/JAWS on Windows, VoiceOver on macOS/iOS, TalkBack on Android).

`ACC-REQ-028`: Document previews and exported documents SHOULD be readable by assistive technologies where the format supports it (e.g., tagged PDFs for generated documents).

`ACC-REQ-029`: Evidence images and scans SHALL have OCR-derived or user-provided text alternatives where possible.

`ACC-REQ-030`: Dynamic content updates (AI chat replies, document preview, timeline changes) SHALL be announced appropriately without disorienting the user.

---

## Cognitive accessibility

`ACC-REQ-031`: The product SHALL reduce cognitive load:

- one primary action per step;
- progressive disclosure of advanced options;
- clear next-step buttons and instructions;
- confirmation before irreversible actions;
- ability to save and resume multi-step workflows.

`ACC-REQ-032`: Users SHALL be able to review and edit answers before finalizing generated documents or submitting forms.

`ACC-REQ-033`: AI-generated outputs and recommendations SHALL be presented with confidence indicators and explanations.

`ACC-REQ-034`: The product SHALL avoid time pressure for administrative tasks that are not time-critical.

---

## Document and file accessibility

`ACC-REQ-035`: Generated documents SHOULD be exported in accessible formats where feasible (e.g., tagged PDFs, structured Word documents).

`ACC-REQ-036`: Plain-text exports SHALL remain readable and well-structured.

`ACC-REQ-037`: File upload interfaces SHALL announce accepted formats, size limits, and errors in an accessible way.

`ACC-REQ-038`: Preview of uploaded evidence SHALL provide accessible alternatives (text transcript, OCR text, alt text).

---

## Language and localization

`ACC-REQ-039`: The HTML `lang` attribute SHALL be set to `en-CA` or `fr-CA` based on the active language.

`ACC-REQ-040`: Language changes SHALL be announced to assistive technologies.

`ACC-REQ-041`: French content SHALL be reviewed for Québec-appropriate terminology and screen-reader pronunciation where relevant.

---

## Testing and conformance

`ACC-REQ-042`: Accessibility SHALL be tested throughout development, not only at release.

`ACC-REQ-043`: Automated accessibility checks (e.g., axe-core) SHALL run in CI for every commit.

`ACC-REQ-044`: Manual accessibility testing with assistive technologies SHALL be performed before major releases.

`ACC-REQ-045`: An accessibility statement SHALL be published in both English and French, describing conformance, known limitations, and how to request accommodation or report issues.
