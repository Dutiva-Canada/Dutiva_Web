import { render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { LangProvider } from '@/i18n/LangProvider'
import { ChatMarkdown, hideIncompleteTable } from './ChatMarkdown'

beforeAll(
  () =>
    /* Warm the lazy ChatChart chunk so chart-fence tests don't time out
     waiting for the dynamic import under concurrent test runs. */
    import('./ChatChart'),
)

function renderMd(markdown: string, streaming = false) {
  return render(
    <LangProvider>
      <ChatMarkdown streaming={streaming}>{markdown}</ChatMarkdown>
    </LangProvider>,
  )
}

const WAGE_TABLE = [
  '| Jurisdiction | Current rate | Next increase |',
  '| :--- | :--- | :--- |',
  '| Ontario | $17.60/hour | Oct 1, 2026 |',
  '| Québec | $16.60/hour | Traditionally May 1 |',
].join('\n')

describe('ChatMarkdown', () => {
  it('renders a GFM table as a real table, not raw pipes', () => {
    const { container } = renderMd(WAGE_TABLE)
    const table = container.querySelector('table')
    expect(table).not.toBeNull()
    expect(within(table as HTMLElement).getByText('Ontario').tagName).toBe('TD')
    expect(screen.getByRole('columnheader', { name: 'Jurisdiction' })).toBeInTheDocument()
    expect(container.textContent).not.toContain('|')
    expect(container.textContent).not.toContain('---')
  })

  it('tags every body cell with its column header for the mobile card layout', () => {
    const { container } = renderMd(WAGE_TABLE)
    const firstRow = container.querySelectorAll('tbody tr')[0] as HTMLElement
    const labels = [...firstRow.querySelectorAll('td')].map((td) => td.getAttribute('data-label'))
    expect(labels).toEqual(['Jurisdiction', 'Current rate', 'Next increase'])
  })

  it('puts the table in its own scrollable region so the page never slides sideways', () => {
    renderMd(WAGE_TABLE)
    const region = screen.getByRole('region', { name: 'Table' })
    expect(region).toHaveClass('cm-tablewrap')
    expect(region).toHaveAttribute('tabindex', '0')
  })

  it('renders headings, lists and emphasis without their markers', () => {
    const { container } = renderMd(
      '## Termination checklist\n\n- **Notice** period\n- Record of *employment*',
    )
    expect(screen.getByText('Termination checklist').tagName).toBe('H4')
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(screen.getByText('Notice').tagName).toBe('STRONG')
    expect(screen.getByText('employment').tagName).toBe('EM')
    expect(container.textContent).not.toContain('#')
    expect(container.textContent).not.toContain('*')
  })

  it('opens links in a new tab with a safe rel', () => {
    renderMd('see [the ESA](https://example.com/esa)')
    const anchor = screen.getByRole('link', { name: 'the ESA' })
    expect(anchor).toHaveAttribute('href', 'https://example.com/esa')
    expect(anchor).toHaveAttribute('target', '_blank')
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer nofollow')
  })

  it('does not render raw HTML from model output', () => {
    const { container } = renderMd('<img src=x onerror="alert(1)"> and <b>bold</b>')
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    expect(container.textContent).toContain('<b>bold</b>')
  })

  it('falls back to a code block when a chart spec is malformed', async () => {
    const { container } = renderMd('```chart\n{ "type": "bar", oops\n```')
    expect(await screen.findByText(/"type": "bar", oops/)).toHaveClass('cm-codeblock')
    expect(container.querySelector('figure.cm-chart')).toBeNull()
  })

  it('renders a well-formed chart spec with its title and data toggle', async () => {
    const spec = JSON.stringify({
      type: 'bar',
      title: 'General minimum wage by jurisdiction',
      x: 'jurisdiction',
      format: { prefix: '$', suffix: '/hr', decimals: 2 },
      series: [{ key: 'rate', label: 'Current rate' }],
      data: [
        { jurisdiction: 'Québec', rate: 16.6 },
        { jurisdiction: 'Ontario', rate: 17.6 },
      ],
    })
    // ChatChart is code-split, so the figure lands a tick after the fallback.
    const { container } = renderMd(`\`\`\`chart\n${spec}\n\`\`\``)
    expect(await screen.findByText('General minimum wage by jurisdiction')).toBeInTheDocument()
    expect(container.querySelector('figure.cm-chart')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Show data' })).toBeInTheDocument()
  })
})

describe('hideIncompleteTable', () => {
  it('hides a trailing table fragment that has no separator row yet', () => {
    const partial = 'Here is the comparison.\n\n| Jurisdiction | Current rate |'
    expect(hideIncompleteTable(partial)).toBe('Here is the comparison.\n')
  })

  it('keeps the table once the separator row lands', () => {
    const settled = 'Here is the comparison.\n\n| Jurisdiction |\n| :--- |\n| Ontario |'
    expect(hideIncompleteTable(settled)).toBe(settled)
  })

  it('leaves prose untouched', () => {
    expect(hideIncompleteTable('No table here at all.')).toBe('No table here at all.')
  })

  it('suppresses the half-arrived table when streaming', () => {
    const { container } = renderMd('Comparing the three.\n\n| Jurisdiction | Rate |', true)
    expect(container.textContent).toBe('Comparing the three.')
  })
})
