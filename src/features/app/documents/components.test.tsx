import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LangProvider } from '@/i18n/LangProvider'
import { DocPaper } from './components'
import type { PreviewBlock } from './data'

function renderPaper(blocks: PreviewBlock[], values: Record<string, string>) {
  return render(
    <LangProvider>
      <DocPaper blocks={blocks} values={values} />
    </LangProvider>,
  )
}

describe('DocPaper letter formatting', () => {
  it('preserves line breaks and renders inline bold in letter blocks', () => {
    const blocks: PreviewBlock[] = [
      {
        type: 'para',
        text: {
          en: '{{today}}\n\n{{employee_name}}\n\n**Re:** Offer of Employment - {{position_title}}\n\nDear {{employee_first_name}},\n\nWe are pleased to offer you employment.',
          fr: '…',
        },
      },
    ]

    const { container } = renderPaper(blocks, {
      today: 'August 27, 2026',
      employee_name: 'Jordan Mensah',
      position_title: 'Operations Coordinator',
      employee_first_name: 'Jordan',
    })

    expect(screen.getByText('Re:')).toBeInTheDocument()
    expect(screen.getByText('Re:').tagName).toBe('STRONG')
    expect(container.textContent).toContain('August 27, 2026\n\nJordan Mensah')
    expect(container.textContent).toMatch(/Dear\s+Jordan,\s+We are pleased to offer you employment/)
  })
})
