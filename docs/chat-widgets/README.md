# Interactive chat widgets

A shared widget system every Dutiva chatbot can use. The bot emits a typed
widget spec as JSON inside a fenced block; the chat frontend validates it
against a strict schema and renders it as an interactive component inline in
the message thread. A bot sends data, never code — the schema is the security
boundary.

## Emitting a widget

Assistant replies embed a ```` ```dutiva-widget ```` fence containing a spec:

    ```dutiva-widget
    {
      "type": "checklist",
      "title": { "en": "New-hire onboarding", "fr": "Embauche d'un nouvel employé" },
      "locale": "en",
      "data": {
        "items": [
          { "id": "offer-letter", "label": { "en": "Signed offer letter on file", "fr": "Lettre d'offre signée au dossier" } }
        ]
      }
    }
    ```

Text and fences can be mixed freely in one reply; each fence renders inline
where it appears. Specs live in `src/components/chatWidgets/widgetSpec.ts`
(strict zod — `type`, `title`, `locale`, typed `data`, nothing else). A spec
that fails validation renders a quiet fallback line, never markup.

## Widget types

| `type`        | Data                                            | Examples |
| ------------- | ----------------------------------------------- | -------- |
| `calculator`  | Labeled numeric inputs + declarative formula AST | Ontario ESA termination pay, overtime (see `prebuiltWidgets.ts`) |
| `chart`       | Series + labels; `bar` or `pie`                  | Payroll cost breakdown |
| `table`       | Columns + rows; sortable + searchable            | Compliance deadlines |
| `checklist`   | Checkable items, progress bar, copy summary      | Onboarding checklist |
| `timeline`    | Dated steps on a rail                            | Probation schedule |
| `comparison`  | Side-by-side option cards + recommended flag     | Contractor vs employee |

Calculator formulas are `FormulaExpr` trees (`src/components/chatWidgets/formula.ts`)
— an interpreter over data, not executable code. Regulated calculators set
`data.regulated: true` to render the "estimate — verify" line plus the shared
`Disclaimer`.

## Feature flag

`VITE_INTERACTIVE_CHAT_WIDGETS` — `all`/`true`/`1`, or a comma-separated list
of surfaces (`advisor`, `invest`, `health`, `pr`). Default off: fenced content
renders as plain text and no widget code is fetched or executed. Dev/review
override: `localStorage["dutiva:flag:interactiveChatWidgets"]`.

## Invariants

- Widgets are presentational; state lives client-side in the message. No
  backend mutation — orders, submissions, writes, emails — can come out of a
  widget interaction. Any future action must go through the chatbot's existing
  explicit-approval flow.
- No `dangerouslySetInnerHTML`, no `eval`, no dynamic script injection.
- Every user-facing string is bilingual (`{ en, fr }`) and follows the chat
  locale; switching languages re-renders visible widgets without reload.
- The careers AI tools have no chat thread (outputs render into textareas), so
  there is no surface there to wire — documented, not forced.

## Where it renders

- Advisor chat — via `ChatMarkdown`'s code-fence override.
- Invest / Health / PR portal chats — via the `WidgetContent` segment renderer
  on assistant turns (lazy-loaded; user text is never parsed).

## Demo

`/demo/chat-widgets` (EN), `/fr/demo/chat-widgets` (FR) — every widget from
its spec, mixed text+widget replies, and the invalid-spec fallback. The
screenshots in this directory show the catalog in EN/FR and dark mode.
