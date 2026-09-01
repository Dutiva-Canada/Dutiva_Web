import { useState } from 'react'
import { ChevronDown, List, MessageCircle, PanelLeftClose, Plus, Star, Trash2, X } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'
import { shellMessages as SM } from '@/i18n/messages/shell'
import { useMdUp } from '@/lib/useMediaQuery'

/**
 * Advisor thread list — the prototype shows these chat groups in the sidebar
 * nav while the Advisor view is active (`showChatGroupsInNav` + `chatGroups`
 * in `renderVals`). Here they render as a left column inside the view,
 * styled after the prototype's chat-group markup: uppercase group labels,
 * 13px thread rows with the chat-bubble glyph, accent-soft active state, and
 * the filled star on pinned threads. The navy 'New conversation' button
 * mirrors the sidebar's `newChatBtnStyle`.
 *
 * Older is soft-collapsed by default so long histories don’t dominate.
 * Deletable threads (session + production) get a trash control; demo fixtures
 * stay read-only.
 *
 * Below md, the list moves into a full-screen sheet opened from
 * `ThreadListMobileAccess`. On md+, the column is on demand: hidden until
 * opened from the chat/home chrome, with preference persisted in localStorage.
 */

export interface ThreadListItem {
  id: string
  title: Bi
  pinned: boolean
}

export type ThreadGroupKey = 'pinned' | 'today' | 'week' | 'older'

export interface ThreadGroup {
  key: ThreadGroupKey
  /** Group heading (advisorViewMessages key value). */
  label: Bi
  items: ThreadListItem[]
}

export interface ThreadListProps {
  readonly groups: ThreadGroup[]
  readonly activeChatId: string | null
  readonly onSelect: (chatId: string) => void
  readonly onNewConversation: () => void
  /** When set, deletable rows show a trash control. */
  readonly onDelete?: (chatId: string) => void
  readonly canDelete?: (chatId: string) => boolean
  readonly hideNewConversation?: boolean
  /** Desktop on-demand panel — when false, the column is not rendered. */
  readonly open?: boolean
  readonly onClose?: () => void
}

export function activeThreadTitle(groups: ThreadGroup[], activeChatId: string | null): Bi | null {
  if (activeChatId === null) return null
  for (const group of groups) {
    const match = group.items.find((item) => item.id === activeChatId)
    if (match) return match.title
  }
  return null
}

function ThreadListPanel({
  groups,
  activeChatId,
  onSelect,
  onNewConversation,
  onDelete,
  canDelete,
  hideNewConversation = false,
}: ThreadListProps) {
  const { x } = useI18n()
  const [olderOpen, setOlderOpen] = useState(false)

  return (
    <>
      {!hideNewConversation ? (
        <button
          type="button"
          onClick={onNewConversation}
          className="mb-[6px] flex w-full cursor-pointer items-center gap-[8px] rounded-[8px] border-none bg-navy px-[12px] py-[9px] text-[13.5px] font-semibold text-white"
        >
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          <span>{x(M.advisorview_new_conversation)}</span>
        </button>
      ) : null}

      {groups.map((group) => {
        const isOlder = group.key === 'older'
        const collapsed = isOlder && !olderOpen
        const activeInOlder = isOlder && group.items.some((chat) => chat.id === activeChatId)
        const showItems = !collapsed || activeInOlder

        return (
          <div key={group.key}>
            {isOlder ? (
              <button
                type="button"
                onClick={() => setOlderOpen((open) => !open)}
                aria-expanded={olderOpen || activeInOlder}
                className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-[10px] pt-[14px] pb-[6px] text-left"
              >
                <span className="text-[11px] font-semibold tracking-[0.04em] text-text-muted uppercase">
                  {x(group.label)}
                  <span className="ml-[6px] font-normal normal-case tracking-normal">
                    ({group.items.length})
                  </span>
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={1.8}
                  className={`shrink-0 text-text-muted transition-transform duration-150 ${
                    olderOpen || activeInOlder ? 'rotate-180' : 'rotate-0'
                  }`}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <div className="px-[10px] pt-[14px] pb-[6px] text-[11px] font-semibold tracking-[0.04em] text-text-muted uppercase">
                {x(group.label)}
              </div>
            )}
            {showItems &&
              (collapsed && activeInOlder
                ? group.items.filter((chat) => chat.id === activeChatId)
                : group.items
              ).map((chat) => {
                const active = chat.id === activeChatId
                const deletable = onDelete != null && (canDelete?.(chat.id) ?? true)
                return (
                  <div
                    key={chat.id}
                    className={`group/thread flex w-full items-center gap-[4px] rounded-[7px] ${
                      active ? 'bg-accent-soft' : 'bg-transparent hover:bg-inset'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(chat.id)}
                      aria-current={active ? 'true' : undefined}
                      className={`flex min-w-0 flex-1 cursor-pointer items-center gap-[8px] border-none bg-transparent px-[10px] py-[7px] text-left font-sans text-[13px] ${
                        active ? 'font-semibold text-accent' : 'font-normal text-text-2'
                      }`}
                    >
                      <MessageCircle
                        size={14}
                        strokeWidth={1.7}
                        className="shrink-0 opacity-70"
                        aria-hidden="true"
                      />
                      <span className="flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap">
                        {x(chat.title)}
                      </span>
                      {chat.pinned && (
                        <Star
                          size={12}
                          strokeWidth={0}
                          fill="currentColor"
                          className="shrink-0 opacity-55"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                    {deletable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(chat.id)
                        }}
                        aria-label={`${x(M.advisorview_delete_conversation)} — ${x(chat.title)}`}
                        className={`mr-[6px] flex h-[26px] w-[26px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] border-none bg-transparent text-text-muted hover:bg-risk-bg hover:text-risk-fg ${
                          active
                            ? 'opacity-100'
                            : 'opacity-55 group-hover/thread:opacity-100 focus-visible:opacity-100'
                        }`}
                      >
                        <Trash2 size={13} strokeWidth={1.8} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )
              })}
            {collapsed && !activeInOlder && (
              <button
                type="button"
                onClick={() => setOlderOpen(true)}
                className="mb-[4px] w-full cursor-pointer border-none bg-transparent px-[10px] py-[6px] text-left text-[12px] font-semibold text-accent"
              >
                {x(M.advisorview_show_older)}
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}

/** Desktop thread column (hidden below md). */
export function ThreadList({
  open = true,
  onClose,
  ...props
}: ThreadListProps) {
  const { x } = useI18n()
  const mdUp = useMdUp()
  if (!mdUp || !open) return null

  return (
    <nav
      aria-label={x(M.advisorview_threads_aria)}
      className="hidden w-[248px] shrink-0 flex-col overflow-y-auto border-r border-border-soft md:flex"
    >
      <div className="flex shrink-0 items-center justify-between px-[10px] pt-[12px] pb-[6px]">
        <h2 className="m-0 font-display text-[14px] font-semibold text-text">
          {x(M.advisorview_threads_aria)}
        </h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={x(M.advisorview_close_threads)}
            className="flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent text-text-muted hover:bg-inset"
          >
            <PanelLeftClose size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[10px] pb-[12px]">
        <ThreadListPanel {...props} />
      </div>
    </nav>
  )
}

/** Opens the desktop conversation column when it is collapsed. */
export function ThreadListOpenButton({ onOpen }: { readonly onOpen: () => void }) {
  const { x } = useI18n()
  const mdUp = useMdUp()
  if (!mdUp) return null

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-[5px] rounded-[100px] border border-border-soft bg-surface-2 px-[11px] py-[4px] font-sans text-[11.5px] font-bold whitespace-nowrap text-text-2"
    >
      <List size={13} strokeWidth={1.9} aria-hidden="true" />
      {x(M.advisorview_open_threads)}
    </button>
  )
}

/** Mobile bar + full-screen sheet for thread switching. */
export function ThreadListMobileAccess(props: ThreadListProps) {
  const { x } = useI18n()
  const mdUp = useMdUp()
  const [open, setOpen] = useState(false)
  const activeTitle = activeThreadTitle(props.groups, props.activeChatId)

  if (mdUp) return null

  const handleSelect = (chatId: string) => {
    props.onSelect(chatId)
    setOpen(false)
  }

  const handleNew = () => {
    props.onNewConversation()
    setOpen(false)
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-[8px] border-b border-border-soft bg-surface px-[12px] py-[8px] md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={x(M.advisorview_open_threads)}
          className="flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-center gap-[8px] rounded-[8px] border border-border-soft bg-surface-2 px-[12px] py-[8px] text-left font-sans text-[13px] font-semibold text-text"
        >
          <List
            size={16}
            strokeWidth={1.8}
            className="shrink-0 text-text-muted"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {activeTitle ? x(activeTitle) : x(M.advisorview_threads_aria)}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={1.8}
            className="shrink-0 text-text-muted"
            aria-hidden="true"
          />
        </button>
        {!props.hideNewConversation ? (
          <button
            type="button"
            onClick={handleNew}
            aria-label={x(M.advisorview_new_conversation)}
            className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] border-none bg-navy text-white"
          >
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={x(M.advisorview_threads_aria)}
          className="fixed inset-0 z-80 flex flex-col bg-surface md:hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-[14px] py-[10px]">
            <h2 className="m-0 font-display text-[16px] font-semibold text-text">
              {x(M.advisorview_threads_aria)}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={x(SM.shell_close_menu)}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-[8px] border-none bg-inset text-text-2"
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <nav
            aria-label={x(M.advisorview_threads_aria)}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[10px] pt-[12px] pb-[max(12px,env(safe-area-inset-bottom))]"
          >
            <ThreadListPanel {...props} onSelect={handleSelect} onNewConversation={handleNew} />
          </nav>
        </div>
      ) : null}
    </>
  )
}
