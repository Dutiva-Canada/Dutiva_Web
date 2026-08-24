/**
 * ChatMarkdown — rich renderer for Advisor replies.
 *
 * Why this exists: the Advisor emits GitHub-flavored Markdown (tables, lists,
 * headings), but the previous renderer (`features/app/advisor/markdown.tsx`)
 * only understood inline constructs, so a table arrived on screen as raw
 * `| pipes | and | dashes |`.
 *
 * What it adds:
 *   - GFM: tables, strikethrough, task lists, autolinks.
 *   - Tables that survive a 390px phone: they become stacked cards, each row
 *     titled by its first column, each value tagged with its column header.
 *     On >= 640px they stay real tables with a sticky header.
 *   - Charts via a ```chart fenced block (see ChatChart.tsx).
 *   - Images, code, quotes, lists styled to match the chat surface.
 *
 * Theming: every color derives from `currentColor` of the message bubble, so
 * light/dark and any brand palette work with no configuration. Override
 * `--cm-accent` / `--cm-surface-solid` on `.cm-root` (or an ancestor) to tint
 * links and rules — the call sites do this from the app-surface tokens.
 *
 * Security: raw HTML in model output is NOT rendered (react-markdown's
 * default). Do not add rehype-raw here — it would let model output inject
 * markup into the page.
 */

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  lazy,
  Suspense,
  useContext,
  useMemo,
} from 'react'
import type { ReactElement, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { useI18n } from '@/i18n/context'
import { advisorCore } from '@/i18n/messages/advisorCore'
import {
  highlightReactNodes,
  type MemoryHighlightPhrase,
} from '@/features/app/advisor/memoryHighlights'
import { hideIncompleteTable } from './chatMarkdownUtils'
import './chat-markdown.css'

/* recharts and its d3 tree are ~420kB, and most replies have no chart in them
   at all. This import has to stay dynamic: it is what makes those bytes a
   separate on-demand chunk, fetched the first time a reply actually contains a
   ```chart block and never on a marketing page. vite.config.ts keeps the tree
   out of the `vendor` group for the same reason — the two go together. */
const ChatChart = lazy(() =>
  import('./ChatChart').then((module) => ({ default: module.ChatChart })),
)

/* ------------------------------------------------------------------ *
 * hast helpers (loosely typed so @types/hast isn't required)
 * ------------------------------------------------------------------ */

interface HastNode {
  type?: string
  tagName?: string
  value?: string
  children?: HastNode[]
  properties?: Record<string, unknown>
}

/** react-markdown hands components the hast node; we only read shape, not types. */
function asNode(node: unknown): HastNode | undefined {
  return node as HastNode | undefined
}

function textOf(node?: HastNode): string {
  if (!node) return ''
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map(textOf).join('')
}

function findChild(node: HastNode | undefined, tagName: string): HastNode | undefined {
  return node?.children?.find((c) => c.tagName === tagName)
}

/** Column headers of a GFM table, used to label cells in mobile card mode. */
function headerLabels(table?: HastNode): string[] {
  const row = findChild(findChild(table, 'thead'), 'tr')
  return (row?.children ?? []).filter((c) => c.tagName === 'th').map((c) => textOf(c).trim())
}

const HeaderContext = createContext<readonly string[]>([])
const MemoryHighlightContext = createContext<readonly MemoryHighlightPhrase[]>([])

function Highlighted({ children }: { children?: ReactNode }) {
  const phrases = useContext(MemoryHighlightContext)
  return <>{highlightReactNodes(children, phrases)}</>
}

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ *
 * Element overrides
 * ------------------------------------------------------------------ */

function languageOf(node?: HastNode): string | undefined {
  const className = node?.properties?.className
  const list = Array.isArray(className) ? className : [className]
  for (const entry of list) {
    const match = /^language-(.+)$/.exec(String(entry ?? ''))
    if (match) return match[1]
  }
  return undefined
}

/** GFM table: the wrapper, not the page, scrolls sideways. */
function MdTable({ node, children }: { node?: unknown; children?: ReactNode }) {
  const { x } = useI18n()
  const labels = headerLabels(asNode(node))
  return (
    <HeaderContext.Provider value={labels}>
      <div
        className="cm-tablewrap"
        role="region"
        tabIndex={0}
        aria-label={x(advisorCore.advisor_md_table)}
      >
        <table className="cm-table">{children}</table>
      </div>
    </HeaderContext.Provider>
  )
}

/**
 * Stamp each cell with its column header so the mobile card layout can print
 * the label via CSS `content: attr(data-label)`.
 */
function MdRow({ children }: { children?: ReactNode }) {
  const labels = useContext(HeaderContext)
  let column = -1
  return (
    <tr className="cm-tr">
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child
        column += 1
        return cloneElement(child as ReactElement<{ 'data-label'?: string }>, {
          'data-label': labels[column] ?? '',
        })
      })}
    </tr>
  )
}

const components: Components = {
  h1: ({ children }) => <h3 className="cm-h cm-h1">{children}</h3>,
  h2: ({ children }) => <h4 className="cm-h cm-h2">{children}</h4>,
  h3: ({ children }) => <h5 className="cm-h cm-h3">{children}</h5>,
  h4: ({ children }) => <h6 className="cm-h cm-h4">{children}</h6>,
  h5: ({ children }) => <h6 className="cm-h cm-h4">{children}</h6>,
  h6: ({ children }) => <h6 className="cm-h cm-h4">{children}</h6>,

  p: ({ children }) => (
    <p className="cm-p">
      <Highlighted>{children}</Highlighted>
    </p>
  ),
  // `className` is passed through so remark-gfm's task-list classes survive.
  ul: ({ children, className }) => <ul className={cx('cm-ul', className)}>{children}</ul>,
  ol: ({ children, className }) => <ol className={cx('cm-ol', className)}>{children}</ol>,
  li: ({ children, className }) => (
    <li className={cx('cm-li', className)}>
      <Highlighted>{children}</Highlighted>
    </li>
  ),
  hr: () => <hr className="cm-hr" />,

  blockquote: ({ children }) => (
    <blockquote className="cm-quote">
      <Highlighted>{children}</Highlighted>
    </blockquote>
  ),

  a: ({ href, children }) => (
    <a className="cm-a" href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ),

  img: ({ src, alt, title }) => (
    <figure className="cm-figure">
      <img
        className="cm-img"
        src={typeof src === 'string' ? src : undefined}
        alt={alt ?? ''}
        loading="lazy"
      />
      {(title || alt) && <figcaption className="cm-caption">{title || alt}</figcaption>}
    </figure>
  ),

  table: MdTable,
  thead: ({ children }) => <thead className="cm-thead">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: MdRow,
  th: ({ children, style }) => (
    <th className="cm-th" style={style} scope="col">
      <Highlighted>{children}</Highlighted>
    </th>
  ),
  td: ({ children, style, ...rest }) => (
    <td
      className="cm-td"
      style={style}
      data-label={(rest as { 'data-label'?: string })['data-label']}
    >
      <Highlighted>{children}</Highlighted>
    </td>
  ),

  // A ```chart block renders itself; everything else keeps the <pre> shell.
  pre: ({ node, children }) => {
    if (languageOf(findChild(asNode(node), 'code')) === 'chart') return <>{children}</>
    return <pre className="cm-pre">{children}</pre>
  },
  code: ({ className, children }) => {
    const language = /language-(\w+)/.exec(className ?? '')?.[1]
    const source = String(children ?? '')
    if (language === 'chart') {
      return (
        <Suspense fallback={<div className="cm-chart-loading" aria-hidden="true" />}>
          <ChatChart source={source} />
        </Suspense>
      )
    }
    // react-markdown v9 dropped the `inline` prop; a fenced block always
    // carries a language class or a newline.
    const inline = !language && !source.includes('\n')
    return inline ? (
      <code className="cm-code">{children}</code>
    ) : (
      <code className="cm-codeblock">{children}</code>
    )
  },
}

/* ------------------------------------------------------------------ *
 * Public component
 * ------------------------------------------------------------------ */

export interface ChatMarkdownProps {
  readonly children: string
  /** True while the reply is still arriving — suppresses half-built tables. */
  readonly streaming?: boolean
  readonly className?: string
  /** Org memory phrases to gold-underline in prose (not code). */
  readonly memoryHighlights?: readonly MemoryHighlightPhrase[]
}

export function ChatMarkdown({
  children,
  streaming = false,
  className,
  memoryHighlights = [],
}: ChatMarkdownProps) {
  const source = useMemo(
    () => (streaming ? hideIncompleteTable(children) : children),
    [children, streaming],
  )

  return (
    <MemoryHighlightContext.Provider value={memoryHighlights}>
      <div className={className ? `cm-root ${className}` : 'cm-root'}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {source}
        </ReactMarkdown>
      </div>
    </MemoryHighlightContext.Provider>
  )
}
