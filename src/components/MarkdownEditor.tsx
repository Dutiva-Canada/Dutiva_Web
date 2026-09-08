import { useRef, useState, type ReactNode, type RefObject, type TextareaHTMLAttributes } from 'react'
import { Bold, Heading, Italic, Link, List, ListOrdered } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => <p className="mb-[8px] last:mb-0">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="mb-[8px] list-disc pl-[20px]">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="mb-[8px] list-decimal pl-[20px]">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="mb-[4px]">{children}</li>,
  h1: ({ children }: { children?: ReactNode }) => (
    <h2 className="mb-[8px] text-[16px] font-semibold text-text">{children}</h2>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mb-[8px] text-[16px] font-semibold text-text">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-[8px] text-[15px] font-semibold text-text">{children}</h3>
  ),
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-text">{children}</strong>,
  em: ({ children }: { children?: ReactNode }) => <em className="italic text-text">{children}</em>,
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-accent-hover">
      {children}
    </a>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="mb-[8px] border-l-2 border-border pl-[12px] italic text-text-muted">{children}</blockquote>
  ),
}

export function MarkdownBody({ children }: { readonly children: string }) {
  return <ReactMarkdown components={markdownComponents}>{children}</ReactMarkdown>
}

function getLineRange(text: string, position: number): { start: number; end: number } {
  let start = position
  while (start > 0 && text[start - 1] !== '\n') start -= 1
  let end = position
  while (end < text.length && text[end] !== '\n') end += 1
  return { start, end }
}

interface MarkdownToolbarMessages {
  bold: Bi
  italic: Bi
  heading: Bi
  bulletList: Bi
  numberedList: Bi
  link: Bi
  hint?: Bi
}

interface MarkdownToolbarProps {
  value: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  setValue: (value: string) => void
  messages: MarkdownToolbarMessages
}

export function MarkdownToolbar({ value, textareaRef, setValue, messages }: MarkdownToolbarProps) {
  const { x } = useI18n()

  const apply = (fn: (text: string, start: number, end: number) => { text: string; start: number; end: number }) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const result = fn(value, start, end)
    setValue(result.text)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(result.start, result.end)
    }, 0)
  }

  const wrap = (before: string, after: string, placeholder = '') => {
    apply((text, start, end) => {
      const selected = text.slice(start, end)
      if (selected) {
        const replacement = `${before}${selected}${after}`
        const next = text.slice(0, start) + replacement + text.slice(end)
        return { text: next, start, end: end + before.length + after.length }
      }
      const replacement = `${before}${placeholder}${after}`
      const next = text.slice(0, start) + replacement + text.slice(end)
      const cursor = start + before.length
      return { text: next, start: cursor, end: cursor + placeholder.length }
    })
  }

  const prefixLines = (prefix: string) => {
    apply((text, start, end) => {
      const selection = text.slice(start, end)
      if (selection) {
        const lines = selection.split('\n')
        const prefixed = lines.map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`)).join('\n')
        const next = text.slice(0, start) + prefixed + text.slice(end)
        return { text: next, start, end: start + prefixed.length }
      }
      const range = getLineRange(text, start)
      const line = text.slice(range.start, range.end)
      const prefixed = line.startsWith(prefix) ? line : `${prefix}${line}`
      const next = text.slice(0, range.start) + prefixed + text.slice(range.end)
      return { text: next, start: range.start + prefixed.length, end: range.start + prefixed.length }
    })
  }

  const insertLink = () => {
    apply((text, start, end) => {
      const selected = text.slice(start, end)
      const linkText = selected || 'text'
      const replacement = `[${linkText}](url)`
      const next = text.slice(0, start) + replacement + text.slice(end)
      const cursorStart = start + 1
      const cursorEnd = cursorStart + linkText.length
      return { text: next, start: cursorStart, end: cursorEnd }
    })
  }

  const iconButton = (icon: ReactNode, label: Bi, onClick: () => void) => (
    <button
      key={label.en}
      type="button"
      onClick={onClick}
      aria-label={x(label)}
      title={x(label)}
      className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] border border-border bg-surface text-text-2 hover:bg-inset"
    >
      {icon}
    </button>
  )

  return (
    <div className="mb-[6px] flex items-center gap-[4px]">
      {iconButton(<Bold size={14} />, messages.bold, () => wrap('**', '**', 'bold text'))}
      {iconButton(<Italic size={14} />, messages.italic, () => wrap('_', '_', 'italic text'))}
      {iconButton(<Heading size={14} />, messages.heading, () => prefixLines('## '))}
      {iconButton(<List size={14} />, messages.bulletList, () => prefixLines('- '))}
      {iconButton(<ListOrdered size={14} />, messages.numberedList, () => prefixLines('1. '))}
      {iconButton(<Link size={14} />, messages.link, insertLink)}
      {messages.hint && <span className="ml-auto text-[11px] text-text-faint">{x(messages.hint)}</span>}
    </div>
  )
}

export interface MarkdownEditorMessages {
  bold: Bi
  italic: Bi
  heading: Bi
  bulletList: Bi
  numberedList: Bi
  link: Bi
  write: Bi
  preview: Bi
  hint?: Bi
}

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  messages: MarkdownEditorMessages
  textareaProps?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>
  className?: string
}

export function MarkdownEditor({ value, onChange, messages, textareaProps, className }: MarkdownEditorProps) {
  const { x } = useI18n()
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const tab = (key: 'write' | 'preview', label: Bi) => (
    <button
      key={key}
      type="button"
      onClick={() => setMode(key)}
      className={`rounded-t-[8px] px-[12px] py-[6px] text-[12px] font-semibold ${
        mode === key ? 'bg-surface text-text' : 'text-text-muted hover:text-text'
      }`}
    >
      {x(label)}
    </button>
  )

  return (
    <div className={className}>
      <div className="flex items-end gap-[8px] border-b border-border">
        {tab('write', messages.write)}
        {tab('preview', messages.preview)}
      </div>
      {mode === 'write' ? (
        <>
          <MarkdownToolbar value={value} textareaRef={textareaRef} setValue={onChange} messages={messages} />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...textareaProps}
            className={`${textareaProps?.className ?? ''} rounded-t-none border-t-0`}
          />
        </>
      ) : (
        <div className="min-h-[160px] rounded-b-[10px] border border-t-0 border-border bg-surface p-[12px] text-[13px] leading-relaxed text-text">
          {value ? <MarkdownBody>{value}</MarkdownBody> : <p className="text-text-muted">{x(messages.preview)}</p>}
        </div>
      )}
    </div>
  )
}
