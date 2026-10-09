import { describe, expect, it } from 'vitest'
import { hideIncompleteWidgetFence, splitChatSegments } from './specBlocks'

const WIDGET = '```dutiva-widget\n{"type":"checklist","data":{"items":[{"id":"a","label":"x"}]}}\n```'

describe('splitChatSegments', () => {
  it('passes plain text through untouched', () => {
    expect(splitChatSegments('Just prose, no fences.')).toEqual([
      { kind: 'text', text: 'Just prose, no fences.' },
    ])
  })

  it('splits text and widget blocks in order — one reply can mix both', () => {
    const reply = `Here is the list:\n${WIDGET}\nWant the table too?`
    const segments = splitChatSegments(reply)
    expect(segments).toHaveLength(3)
    expect(segments[0]).toEqual({ kind: 'text', text: 'Here is the list:\n' })
    expect(segments[1]?.kind).toBe('widget')
    expect(segments[2]).toEqual({ kind: 'text', text: '\nWant the table too?' })
  })

  it('handles multiple widgets in one reply', () => {
    const segments = splitChatSegments(`${WIDGET}\nthen\n${WIDGET}`)
    expect(segments.filter((s) => s.kind === 'widget')).toHaveLength(2)
  })

  it('does not swallow other code fences', () => {
    const content = '```json\n{"a":1}\n```'
    expect(splitChatSegments(content)).toEqual([{ kind: 'text', text: content }])
  })

  it('requires the fence to close — an unclosed block stays text', () => {
    const content = 'intro\n```dutiva-widget\n{"type":"chart"'
    const segments = splitChatSegments(content)
    expect(segments.every((s) => s.kind === 'text')).toBe(true)
  })

  it('drops an empty widget fence entirely', () => {
    expect(splitChatSegments(`a\n\`\`\`dutiva-widget\n\`\`\`\nb`)).toEqual([
      { kind: 'text', text: 'a\n' },
      { kind: 'text', text: '\nb' },
    ])
  })

  it('extracts the fence body as the widget source', () => {
    const segments = splitChatSegments(WIDGET)
    expect(segments).toHaveLength(1)
    expect(segments[0]).toEqual({
      kind: 'widget',
      source: '{"type":"checklist","data":{"items":[{"id":"a","label":"x"}]}}',
    })
  })
})

describe('hideIncompleteWidgetFence', () => {
  it('hides a widget fence that has not closed yet', () => {
    const partial = 'Here you go:\n```dutiva-widget\n{"type":"check'
    expect(hideIncompleteWidgetFence(partial)).toBe('Here you go:\n')
  })

  it('keeps a closed fence', () => {
    expect(hideIncompleteWidgetFence(`before\n${WIDGET}\nafter`)).toBe(
      `before\n${WIDGET}\nafter`,
    )
  })

  it('leaves other unclosed code fences alone', () => {
    const partial = 'code:\n```json\n{"a":'
    expect(hideIncompleteWidgetFence(partial)).toBe(partial)
  })

  it('leaves prose without fences untouched', () => {
    expect(hideIncompleteWidgetFence('no fences here')).toBe('no fences here')
  })
})
