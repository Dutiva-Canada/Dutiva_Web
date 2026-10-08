import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LangContext } from '@/i18n/context'
import { buildLangContextValue } from '@/i18n/lang'
import { messages } from '@/i18n/messages'
import { WidgetContent } from './WidgetContent'

/* The lazy ChatWidget chunk, pre-warmed for jsdom. */
import './ChatWidget'

function wrap(text: string, streaming = false) {
  return render(
    <LangContext value={buildLangContextValue('en', () => {}, messages)}>
      <WidgetContent text={text} streaming={streaming} />
    </LangContext>,
  )
}

const CHECKLIST_BLOCK = [
  '```dutiva-widget',
  '{"type":"checklist","data":{"items":[{"id":"a","label":{"en":"Collect SIN","fr":"NAS"}}]}}',
  '```',
].join('\n')

describe('WidgetContent — the plain-text chat renderer', () => {
  it('renders pure prose verbatim', () => {
    const { container } = wrap('Just a normal answer, nothing interactive.')
    expect(container.textContent).toBe('Just a normal answer, nothing interactive.')
  })

  it('mixes text and a widget in one reply — acceptance: bot mixes both', async () => {
    wrap(`Here is your list:\n${CHECKLIST_BLOCK}\nAnything else?`)
    expect(screen.getByText(/Here is your list:/)).toBeInTheDocument()
    expect(await screen.findByText('Collect SIN')).toBeInTheDocument()
    expect(screen.getByText(/Anything else\?/)).toBeInTheDocument()
    /* The fence markers themselves never reach the page. */
    expect(document.body.textContent).not.toContain('dutiva-widget')
  })

  it('renders the fallback line for a broken fence inside a reply', () => {
    wrap(`Sure —\n\`\`\`dutiva-widget\n{bad json\n\`\`\`\nThere you go.`)
    expect(
      screen.getByText('This interactive content could not be displayed.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/There you go\./)).toBeInTheDocument()
  })

  it('hides an unclosed fence while streaming', () => {
    const { container } = wrap('Working on it\n```dutiva-widget\n{"type":"che', true)
    expect(container.textContent).toContain('Working on it')
    expect(container.textContent).not.toContain('dutiva-widget')
  })

  it('leaves non-widget fences alone while streaming', () => {
    const { container } = wrap('```json\n{"a":1', true)
    expect(container.textContent).toContain('{"a":1')
  })
})
