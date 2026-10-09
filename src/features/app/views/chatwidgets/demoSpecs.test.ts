import { describe, expect, it } from 'vitest'
import { parseWidgetSpec, widgetSpecSchema } from '@/components/chatWidgets/widgetSpec'
import { splitChatSegments } from '@/components/chatWidgets/specBlocks'
import {
  demoBrokenReply,
  demoCalculators,
  demoChartBar,
  demoChartPie,
  demoChecklist,
  demoComparison,
  demoMixedReply,
  demoTable,
  demoTimeline,
} from './demoSpecs'

/* The demo route is the reviewer-facing catalog — a fixture that drifts
   out of schema (type-valid but rule-invalid, like two `recommended`
   options) would silently render the fallback on the demo page. Pin
   every entry against the real validator. */
describe('demoSpecs — the review catalog stays valid', () => {
  it.each([
    ['calculator/termination-pay', demoCalculators[0]!],
    ['calculator/overtime', demoCalculators[1]!],
    ['chart/pie', demoChartPie],
    ['chart/bar', demoChartBar],
    ['table', demoTable],
    ['checklist', demoChecklist],
    ['timeline', demoTimeline],
    ['comparison', demoComparison],
  ])('%s passes widgetSpecSchema', (_name, spec) => {
    expect(widgetSpecSchema.safeParse(spec).success).toBe(true)
  })

  it('the mixed reply parses into text and a working widget', () => {
    const widgets = splitChatSegments(demoMixedReply).filter((s) => s.kind === 'widget')
    expect(widgets.length).toBeGreaterThan(0)
    for (const w of widgets) {
      expect(parseWidgetSpec(w.source)).not.toBeNull()
    }
  })

  it('the broken reply stays broken — it exists to demo the fallback', () => {
    const widgets = splitChatSegments(demoBrokenReply).filter((s) => s.kind === 'widget')
    expect(widgets.length).toBeGreaterThan(0)
    expect(widgets.some((w) => parseWidgetSpec(w.source) === null)).toBe(true)
  })
})
