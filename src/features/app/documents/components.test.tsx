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
  it('renders letterhead, right-aligned date, address, and Re: line', () => {
    const blocks: PreviewBlock[] = [
      {
        type: 'letterhead',
        text: {
          en: '{{org}}\n{{employer_business_name}}\n{{employer_address}}',
          fr: '…',
        },
        dateText: {
          en: '{{today}}',
          fr: '…',
        },
      },
      {
        type: 'address',
        text: {
          en: '{{employee_name}}\n{{employee_address_line_1}}\n{{employee_address_line_2}}',
          fr: '…',
        },
      },
      {
        type: 'para',
        text: {
          en: '**Re:** Offer of Employment - {{position_title}}',
          fr: '…',
        },
      },
      {
        type: 'para',
        text: {
          en: 'Dear {{employee_first_name}},',
          fr: '…',
        },
      },
      {
        type: 'para',
        text: {
          en: 'We are pleased to offer you employment in the position of {{position_title}}.',
          fr: '…',
        },
      },
    ]

    const { container } = renderPaper(blocks, {
      org: 'Northgate Logistics Inc.',
      employer_business_name: 'Northgate Logistics',
      employer_address: '1200 Industrial Parkway, Mississauga, ON  L5T 2H8',
      today: 'August 27, 2026',
      employee_name: 'Jordan Mensah',
      employee_address_line_1: '42 Maple Street',
      employee_address_line_2: 'Toronto, ON  M5V 1A1',
      position_title: 'Operations Coordinator',
      employee_first_name: 'Jordan',
    })

    expect(screen.getByText('Northgate Logistics Inc.').closest('.font-semibold')).not.toBeNull()
    expect(screen.getByText('August 27, 2026').closest('div')?.className).toContain('text-right')
    expect(container.querySelector('address')).not.toBeNull()
    expect(screen.getByText('Re:')).toBeInTheDocument()
    expect(container.textContent).toMatch(/Dear\s+Jordan,/)
    expect(screen.getByText(/We are pleased to offer you employment/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Jordan ,/)
    expect(container.textContent).not.toMatch(/Coordinator \./)
  })

  it('renders clause label/value lines as a definition list', () => {
    const blocks: PreviewBlock[] = [
      {
        type: 'clause',
        n: 1,
        heading: { en: 'Employer information', fr: '…' },
        text: {
          en: "The following information is included.\nLegal name: {{org}}\nEmployer telephone: {{employer_phone}}",
          fr: '…',
        },
      },
    ]

    const { container } = renderPaper(blocks, {
      org: 'Northgate Logistics Inc.',
      employer_phone: '(905) 555-0142',
    })

    expect(container.querySelector('dl')).not.toBeNull()
    expect(screen.getByText('Legal name')).toBeInTheDocument()
    expect(screen.getByText('Northgate Logistics Inc.')).toBeInTheDocument()
  })

  it('renders clause bullet lists and sign-off blocks', () => {
    const blocks: PreviewBlock[] = [
      {
        type: 'clause',
        n: 13,
        heading: { en: 'Conditions of this offer', fr: '…' },
        text: {
          en: 'This offer is conditional on:\n* your legal authorization to work in Canada;\n* your signing the Employment Agreement.\n\nWe look forward to working with you.\nSincerely,\n{{employer_signer_name}}\n{{employer_signer_title}}',
          fr: '…',
        },
      },
    ]

    const { container } = renderPaper(blocks, {
      employer_signer_name: 'Martin Constantineau',
      employer_signer_title: 'Director of Human Resources',
    })

    expect(container.querySelector('ul li')).not.toBeNull()
    expect(screen.getByText('Sincerely,')).toBeInTheDocument()
    expect(screen.getByText('Martin Constantineau')).toBeInTheDocument()
  })
})
