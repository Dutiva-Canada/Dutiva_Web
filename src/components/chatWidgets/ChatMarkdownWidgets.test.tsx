import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LangProvider } from '@/i18n/LangProvider'
import { ChatMarkdown } from '@/components/advisor/ChatMarkdown'
import { CHAT_WIDGET_FLAG_KEY } from './flags'

/* Pre-warm the lazy widget chunk. */
import './ChatWidget'

const SPEC = JSON.stringify({
  type: 'checklist',
  data: { items: [{ id: 'a', label: 'Collect SIN' }] },
})
const REPLY = `Here is the checklist:\n\`\`\`dutiva-widget\n${SPEC}\n\`\`\`\nDone.`

describe('ChatMarkdown × dutiva-widget fences', () => {
  beforeEach(() => {
    localStorage.removeItem(CHAT_WIDGET_FLAG_KEY)
  })

  it('flag off — the fence renders as a plain code block, exactly as before', () => {
    const { container } = render(
      <LangProvider>
        <ChatMarkdown>{REPLY}</ChatMarkdown>
      </LangProvider>,
    )
    const code = container.querySelector('.cm-codeblock')
    expect(code).not.toBeNull()
    expect(code?.textContent).toContain('"type":"checklist"')
    /* No widget rendered. */
    expect(container.querySelector('.cw-root')).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('flag on for advisor — the fence becomes a working widget', async () => {
    localStorage.setItem(CHAT_WIDGET_FLAG_KEY, 'advisor')
    const { container } = render(
      <LangProvider>
        <ChatMarkdown>{REPLY}</ChatMarkdown>
      </LangProvider>,
    )
    expect(await screen.findByRole('checkbox')).toBeInTheDocument()
    expect(container.textContent).not.toContain('dutiva-widget')
    expect(container.textContent).toContain('Done.')
  })

  it('flag on for a different surface only — advisor stays a code block', () => {
    localStorage.setItem(CHAT_WIDGET_FLAG_KEY, 'invest')
    const { container } = render(
      <LangProvider>
        <ChatMarkdown>{REPLY}</ChatMarkdown>
      </LangProvider>,
    )
    expect(container.querySelector('.cm-codeblock')).not.toBeNull()
    expect(container.querySelector('.cw-root')).toBeNull()
  })
})
