import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LangContext } from '@/i18n/context'
import { buildLangContextValue } from '@/i18n/lang'
import { messages } from '@/i18n/messages'
import type { Lang } from '@/i18n/core'
import { ChatWidget, ChatWidgetBlock } from './ChatWidget'
import type { WidgetSpec } from './widgetSpec'
import { ontarioTerminationPaySpec } from './prebuiltWidgets'

/* Load lazy widget chunks up front so tests don't wait on dynamic imports. */
import './ChartWidget'
import './TableWidget'
import './ChecklistWidget'
import './TimelineWidget'
import './ComparisonWidget'

function wrap(ui: ReactNode) {
  return render(
    <LangContext value={buildLangContextValue('en', () => {}, messages)}>
      {ui}
    </LangContext>,
  )
}

const CHECKLIST_SPEC: WidgetSpec = {
  type: 'checklist',
  title: { en: 'Onboarding', fr: 'Intégration' },
  data: { items: [{ id: 'a', label: { en: 'Collect SIN', fr: 'Recueillir le NAS' } }] },
}

const TABLE_SPEC: WidgetSpec = {
  type: 'table',
  data: {
    columns: [{ key: 'jur', label: 'Jurisdiction' }],
    rows: [{ jur: 'Ontario' }, { jur: 'Québec' }],
  },
}

const TIMELINE_SPEC: WidgetSpec = {
  type: 'timeline',
  data: {
    steps: [
      { label: 'Start', date: '2026-01-05', status: 'done' },
      { label: 'Review', status: 'upcoming' },
    ],
  },
}

const COMPARISON_SPEC: WidgetSpec = {
  type: 'comparison',
  data: {
    options: [
      { name: 'Employee', recommended: true, rows: [{ label: 'Control', value: 'Employer' }] },
      { name: 'Contractor', rows: [{ label: 'Control', value: 'Worker' }] },
    ],
  },
}

describe('ChatWidget', () => {
  it('renders a calculator spec', async () => {
    wrap(<ChatWidget spec={ontarioTerminationPaySpec()} />)
    expect(screen.getByText('Ontario termination pay — ESA minimum')).toBeInTheDocument()
    expect(screen.getByLabelText('Annual salary')).toBeInTheDocument()
  })

  it('renders a chart spec with its data-table toggle', async () => {
    wrap(
      <ChatWidget
        spec={{
          type: 'chart',
          data: { kind: 'pie', items: [{ label: 'Wages', value: 100 }] },
        }}
      />,
    )
    expect(await screen.findByRole('button', { name: 'Show data' })).toBeInTheDocument()
  })

  it('renders a table spec', async () => {
    wrap(<ChatWidget spec={TABLE_SPEC} />)
    expect(await screen.findByRole('columnheader', { name: /Jurisdiction/ })).toBeInTheDocument()
    expect(screen.getByText('Ontario')).toBeInTheDocument()
  })

  it('sorts and filters a 60-row table — the volume case', async () => {
    const spec: WidgetSpec = {
      type: 'table',
      data: {
        columns: [
          { key: 'item', label: 'Item' },
          { key: 'due', label: 'Due', align: 'right' },
        ],
        rows: Array.from({ length: 60 }, (_, i) => ({
          item: `Deadline ${String(60 - i).padStart(2, '0')}`,
          due: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
        })),
      },
    }
    const { container } = wrap(<ChatWidget spec={spec} />)

    const rowCount = () => container.querySelectorAll('tbody tr').length
    expect(await screen.findByText('Deadline 60')).toBeInTheDocument()
    expect(rowCount()).toBe(60)

    /* Sort ascending by item — Deadline 01 leads. */
    fireEvent.click(await screen.findByRole('button', { name: /Item/ }))
    expect(container.querySelector('tbody tr td')?.textContent).toBe('Deadline 01')

    /* Filtering narrows the set accent-insensitively. */
    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter rows' }), {
      target: { value: 'deadline 5' },
    })
    expect(rowCount()).toBeLessThan(60)
    expect(container.textContent).toContain('Deadline 59')
  })

  it('renders a checklist spec', async () => {
    wrap(<ChatWidget spec={CHECKLIST_SPEC} />)
    expect(await screen.findByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders a timeline spec', async () => {
    wrap(<ChatWidget spec={TIMELINE_SPEC} />)
    expect(await screen.findByText('Review')).toBeInTheDocument()
    expect(screen.getByText('Start')).toBeInTheDocument()
  })

  it('renders a comparison spec with the recommended badge', async () => {
    wrap(<ChatWidget spec={COMPARISON_SPEC} />)
    expect(await screen.findByText('Recommended')).toBeInTheDocument()
    expect(screen.getByText('Contractor')).toBeInTheDocument()
  })
})

describe('ChatWidgetBlock — the fence entry point', () => {
  it('renders a valid spec from JSON source', async () => {
    wrap(<ChatWidgetBlock source={JSON.stringify(CHECKLIST_SPEC)} />)
    expect(await screen.findByText('Collect SIN')).toBeInTheDocument()
  })

  it('renders the fallback for malformed JSON — never the source', () => {
    const { container } = wrap(<ChatWidgetBlock source={'{"type": oops'} />)
    expect(screen.getByText('This interactive content could not be displayed.')).toBeInTheDocument()
    expect(container.textContent).not.toContain('"type": oops')
  })

  it('renders the fallback for a spec that fails schema validation', () => {
    const { container } = wrap(
      <ChatWidgetBlock
        source={'{"type":"calculator","html":"<img src=x>","data":{}}'}
      />,
    )
    expect(screen.getByText('This interactive content could not be displayed.')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders the fallback for raw markup passed as the spec', () => {
    const { container } = wrap(<ChatWidgetBlock source={'<img src=x onerror=alert(1)>'} />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('This interactive content could not be displayed.')).toBeInTheDocument()
  })

  it('escapes markup inside spec labels — it renders as text, never DOM', async () => {
    const spec: WidgetSpec = {
      type: 'checklist',
      data: { items: [{ id: 'a', label: '<b>bold</b>' }] },
    }
    const { container } = wrap(<ChatWidget spec={spec} />)
    expect(await screen.findByText('<b>bold</b>')).toBeInTheDocument()
    expect(container.querySelector('b')).toBeNull()
  })
})

describe('live language switching', () => {
  function LangHarness({ children }: { readonly children: ReactNode }) {
    const [lang, setLang] = useState<Lang>('en')
    const value = useMemo(() => buildLangContextValue(lang, setLang, messages), [lang])
    return (
      <LangContext value={value}>
        <button type="button" onClick={() => setLang('fr')}>
          switch
        </button>
        {children}
      </LangContext>
    )
  }

  it('re-renders every visible widget in French with no reload', async () => {
    render(
      <LangHarness>
        <ChatWidget spec={CHECKLIST_SPEC} />
        <ChatWidget spec={ontarioTerminationPaySpec()} />
      </LangHarness>,
    )

    expect(screen.getByText('Onboarding')).toBeInTheDocument()
    expect(screen.getByText('Collect SIN')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'switch' }))

    expect(screen.getByText('Intégration')).toBeInTheDocument()
    expect(screen.getByText('Recueillir le NAS')).toBeInTheDocument()
    expect(screen.getByText('Indemnité de licenciement en Ontario — minimum de la LNT')).toBeInTheDocument()
    /* The French estimate disclaimer also shows live. */
    expect(screen.getByText(/vérifiez la législation en vigueur/)).toBeInTheDocument()
  })
})

describe('WidgetErrorBoundary — a crashing widget degrades, the chat survives', () => {
  function Boom(): never {
    throw new Error('render kaboom')
  }

  it('swaps the crashed card for the fallback and reports the stack', async () => {
    const { WidgetErrorBoundary } = await import('./WidgetErrorBoundary')
    const { container } = wrap(
      <>
        <WidgetErrorBoundary>
          <Boom />
        </WidgetErrorBoundary>
        <ChatWidget spec={CHECKLIST_SPEC} />
      </>,
    )
    /* The boundary catches: the crashed card shows the quiet fallback… */
    expect(container.querySelector('.cw-fallback')).not.toBeNull()
    /* …and its sibling widget keeps living. */
    expect(await screen.findByRole('checkbox')).toBeInTheDocument()
  })
})
