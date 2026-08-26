import { useState } from 'react'
import { ChevronDown, MessageCircle, Plus, Star, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import type { Bi } from '@/i18n/core'
import { advisorViewMessages as M } from '@/i18n/messages/advisorView'

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
}

export function ThreadList({
  groups,
  activeChatId,
  onSelect,
  onNewConversation,
  onDelete,
  canDelete,
}: ThreadListProps) {
  const { x } = useI18n()
  const [olderOpen, setOlderOpen] = useState(false)

  return (
    <nav
      aria-label={x(M.advisorview_threads_aria)}
      className="hidden w-[248px] shrink-0 flex-col overflow-y-auto border-r border-border-soft px-[10px] pt-[12px] pb-[12px] md:flex"
    >
      <button
        type="button"
        onClick={onNewConversation}
        className="mb-[6px] flex w-full cursor-pointer items-center gap-[8px] rounded-[8px] border-none bg-navy px-[12px] py-[9px] text-[13.5px] font-semibold text-white"
      >
        <Plus size={15} strokeWidth={2} aria-hidden="true" />
        <span>{x(M.advisorview_new_conversation)}</span>
      </button>

      {groups.map((group) => {
        const isOlder = group.key === 'older'
        const collapsed = isOlder && !olderOpen
        const activeInOlder =
          isOlder && group.items.some((chat) => chat.id === activeChatId)
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
                        active
                          ? 'font-semibold text-accent'
                          : 'font-normal text-text-2'
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
                        className="mr-[6px] flex h-[26px] w-[26px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] border-none bg-transparent text-text-muted opacity-0 group-hover/thread:opacity-100 focus-visible:opacity-100 hover:bg-risk-bg hover:text-risk-fg"
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
    </nav>
  )
}
