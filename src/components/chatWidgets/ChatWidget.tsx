import { lazy, Suspense, useEffect, useMemo } from 'react'
import { parseWidgetSpec, type WidgetSpec } from './widgetSpec'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'
import { WidgetFallback } from './WidgetFallback'
import './chatWidgets.css'

/**
 * <ChatWidget spec={...} /> — the single renderer every chatbot surface
 * shares. It dispatches on `spec.type` to the six vetted components; a spec
 * that fails schema validation (or isn't JSON at all) renders the quiet
 * fallback. No widget type receives raw markup, a URL, or executable code —
 * the spec schema is the security boundary and it admits data only.
 *
 * Calculator is the only statically imported widget: it's small and the
 * most common case. The rest lazy-load so a reply containing one widget
 * type doesn't pay for all six. Everything below this file is fetched only
 * when a dutiva-widget fence actually renders.
 */
import { CalculatorWidget } from './CalculatorWidget'

const ChartWidget = lazy(() =>
  import('./ChartWidget').then((m) => ({ default: m.ChartWidget })),
)
const TableWidget = lazy(() =>
  import('./TableWidget').then((m) => ({ default: m.TableWidget })),
)
const ChecklistWidget = lazy(() =>
  import('./ChecklistWidget').then((m) => ({ default: m.ChecklistWidget })),
)
const TimelineWidget = lazy(() =>
  import('./TimelineWidget').then((m) => ({ default: m.TimelineWidget })),
)
const ComparisonWidget = lazy(() =>
  import('./ComparisonWidget').then((m) => ({ default: m.ComparisonWidget })),
)

/**
 * Render telemetry: dev-only console breadcrumb naming the widget *type* —
 * never input values or spec contents. Server-side render analytics are a
 * deliberate non-goal for v1 (see the feature brief); this hook is the seam
 * if that changes.
 */
function useWidgetRenderLog(type: string) {
  useEffect(() => {
    if (import.meta.env.DEV) console.debug(`[chat-widget] render: ${type}`)
  }, [type])
}

export function ChatWidget({ spec }: { readonly spec: WidgetSpec }) {
  useWidgetRenderLog(spec.type)

  let inner
  switch (spec.type) {
    case 'calculator':
      inner = <CalculatorWidget spec={spec} />
      break
    case 'chart':
      inner = <ChartWidget spec={spec} />
      break
    case 'table':
      inner = <TableWidget spec={spec} />
      break
    case 'checklist':
      inner = <ChecklistWidget spec={spec} />
      break
    case 'timeline':
      inner = <TimelineWidget spec={spec} />
      break
    case 'comparison':
      inner = <ComparisonWidget spec={spec} />
      break
    default:
      /* The discriminated union is exhaustive — a validated spec can't land
         here, and an unvalidated one never reaches this component. */
      return <WidgetFallback />
  }

  return (
    <WidgetErrorBoundary>
      <Suspense fallback={<div className="cw-loading" aria-hidden="true" />}>{inner}</Suspense>
    </WidgetErrorBoundary>
  )
}

/**
 * Fenced-block entry point: raw ```dutiva-widget source in, validated spec
 * or fallback out. Used by ChatMarkdown's code-fence override and by
 * WidgetContent on the plain-text portal chats.
 */
export function ChatWidgetBlock({ source }: { readonly source: string }) {
  /* Parse once per source — streaming parents re-render often, and zod
     validation isn't free even on bounded input. */
  const spec = useMemo(() => parseWidgetSpec(source), [source])
  return spec ? <ChatWidget spec={spec} /> : <WidgetFallback />
}
