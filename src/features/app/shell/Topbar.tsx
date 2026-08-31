import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, PanelLeftClose, PanelLeftOpen, Search, Sparkle } from 'lucide-react'
import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { useSearch } from '@/features/app/search/searchContext'
import {
  useAskAdvisorBriefing,
  railViewKeyFromPathname,
} from '@/features/app/rail/useAskAdvisorBriefing'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { useWorkspaceRoot } from '@/features/app/workspaceRoot/workspaceRootContext'
import { workspaceModeMessages as WM } from '@/i18n/messages/workspaceMode'
import { AuthMenuButton } from '@/features/app/auth/AuthMenuButton'
import { LangToggle, ThemeToggle } from './ShellControls'
import { cx } from './cx'
import {
  listWorkspaceNotifications,
  markAllWorkspaceNotificationsRead,
  markWorkspaceNotificationRead,
  relativeTimeLabel,
  type WorkspaceNotification,
} from './workspaceNotificationsApi'

/* Sample notifications — prototype `buildNotifications()` (FR from `frDict()`;
   '2 days ago' FR follows the prototype's 'Il y a N jours' pattern). */
interface DemoNotificationItem {
  id: string
  text: Bi
  time: Bi
  unread: boolean
}

const SAMPLE_NOTIFICATIONS: DemoNotificationItem[] = [
  {
    id: 'n1',
    text: bi(
      'Compliance: Remote Work Policy is overdue for review',
      'Conformité : la politique de télétravail est en retard pour révision',
    ),
    time: bi('1h ago', 'Il y a 1 h'),
    unread: true,
  },
  {
    id: 'n2',
    text: bi(
      'Document ready: Termination Letter — Jordan Mensah',
      'Document prêt : lettre de licenciement — Jordan Mensah',
    ),
    time: bi('2h ago', 'Il y a 2 h'),
    unread: true,
  },
  {
    id: 'n3',
    text: bi(
      'Task assigned: Accommodation review — Amara Okafor',
      'Tâche assignée : examen d’accommodement — Amara Okafor',
    ),
    time: bi('Yesterday', 'Hier'),
    unread: false,
  },
  {
    id: 'n4',
    text: bi('Priya Nair accepted her offer', 'Priya Nair a accepté son offre'),
    time: bi('2 days ago', 'Il y a 2 jours'),
    unread: false,
  },
]

/**
 * Sticky workspace topbar (desktop + tablet) — route title, "Ask Advisor"
 * (opens the contextual rail), EN/FR pill, theme toggle, global search
 * trigger, notifications popover.
 */
export function Topbar({
  title,
  sidebarExpanded,
  onToggleSidebar,
}: {
  readonly title: string
  readonly sidebarExpanded?: boolean
  readonly onToggleSidebar?: () => void
}) {
  const { x } = useI18n()
  const { openSearch } = useSearch()
  const askAdvisor = useAskAdvisorBriefing()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { root } = useWorkspaceRoot()

  const { mode } = useWorkspaceMode()
  const [demoNotifications, setDemoNotifications] = useState(SAMPLE_NOTIFICATIONS)
  const [prodNotifications, setProdNotifications] = useState<WorkspaceNotification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    if (mode !== 'production') return
    let cancelled = false
    void listWorkspaceNotifications()
      .then((rows) => {
        if (!cancelled) setProdNotifications(rows)
      })
      .catch(() => {
        if (!cancelled) setProdNotifications([])
      })
    return () => {
      cancelled = true
    }
  }, [mode, notifOpen])

  const demoItems = demoNotifications.map((n) => ({
    id: n.id,
    text: n.text,
    time: n.time,
    unread: n.unread,
    href: null as string | null,
  }))
  const prodItems = prodNotifications.map((n) => ({
    id: n.id,
    text: n.body ?? n.title,
    time: relativeTimeLabel(n.createdAt),
    unread: n.unread,
    href: n.href,
  }))
  const notifications = mode === 'production' ? prodItems : demoItems
  const hasUnread = notifications.some((n) => n.unread)

  const markAllRead = () => {
    if (mode === 'production') {
      setProdNotifications((list) => list.map((n) => ({ ...n, unread: false })))
      void markAllWorkspaceNotificationsRead().catch(() => {
        /* best-effort */
      })
      return
    }
    setDemoNotifications((list) => list.map((n) => ({ ...n, unread: false })))
  }

  const openItem = (id: string, href: string | null) => {
    if (mode === 'production') {
      setProdNotifications((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)))
      void markWorkspaceNotificationRead(id).catch(() => {
        /* best-effort */
      })
    } else {
      setDemoNotifications((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)))
    }
    setNotifOpen(false)
    if (href) navigate(href)
  }

  /* The prototype hides "Ask Advisor" on the Advisor view itself. */
  const showAskAdvisor = !pathname.startsWith(`${root}/advisor`)

  return (
    <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-bg px-[22px]">
      <div className="flex min-w-0 items-center gap-2">
        {onToggleSidebar ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={x(sidebarExpanded ? M.shell_collapse_sidebar : M.shell_expand_sidebar)}
            aria-expanded={sidebarExpanded}
            className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-text-3 hover:bg-inset"
          >
            {sidebarExpanded ? (
              <PanelLeftClose size={18} strokeWidth={1.8} />
            ) : (
              <PanelLeftOpen size={18} strokeWidth={1.8} />
            )}
          </button>
        ) : null}
        <h1 className="m-0 truncate font-display text-[18px] font-semibold text-text">{title}</h1>
      </div>
      <div className="flex items-center gap-[14px]">
        {showAskAdvisor && (
          <button
            type="button"
            onClick={() => askAdvisor(railViewKeyFromPathname(pathname))}
            className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border border-gold-border bg-gold-bg px-[14px] py-[8px] text-[13.5px] font-semibold whitespace-nowrap text-gold-fg"
          >
            <Sparkle size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            {x(M.shell_ask_advisor)}
          </button>
        )}
        <LangToggle />
        <ThemeToggle
          className="flex cursor-pointer border-none bg-transparent p-[6px] text-text-3"
          iconSize={18}
        />
        <button
          type="button"
          onClick={openSearch}
          aria-label={x(M.shell_search)}
          className="cursor-pointer border-none bg-transparent p-[6px] text-text-3"
        >
          <Search size={18} strokeWidth={1.7} />
        </button>
        <AuthMenuButton />
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((open) => !open)}
            aria-label={x(M.shell_notifications)}
            aria-expanded={notifOpen}
            className="relative cursor-pointer border-none bg-transparent p-[6px] text-text-3"
          >
            <Bell size={18} strokeWidth={1.7} />
            {hasUnread && (
              <div className="absolute top-[5px] right-[6px] h-[7px] w-[7px] rounded-full border-[1.5px] border-bg bg-risk-dot" />
            )}
          </button>
          {notifOpen && (
            <>
              <div
                onClick={() => setNotifOpen(false)}
                className="fixed inset-0 z-190"
                aria-hidden="true"
              />
              <dialog
                open
                aria-label={x(M.shell_notifications)}
                className="absolute top-[38px] right-0 left-auto z-200 m-0 w-[min(340px,calc(100vw-24px))] animate-[fadeInUp_.15s_ease] overflow-hidden rounded-[12px] border border-border bg-surface shadow-popover"
              >
                <div className="flex items-center justify-between border-b border-border-soft px-[14px] py-[12px]">
                  <span className="text-[13.5px] font-bold">{x(M.shell_notifications)}</span>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="cursor-pointer border-none bg-transparent text-[12.5px] font-semibold text-accent"
                  >
                    {x(M.shell_mark_all_read)}
                  </button>
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="px-[14px] py-[18px] text-center text-[12.5px] text-text-muted">
                      {x(WM.wsmode_notifications_empty)}
                    </div>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openItem(n.id, n.href)}
                      className={cx(
                        'flex w-full cursor-pointer gap-[10px] border-0 border-b border-inset px-[14px] py-[11px] text-left',
                        n.unread ? 'bg-surface-2' : 'bg-surface',
                      )}
                    >
                      <div
                        className={cx(
                          'mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full',
                          n.unread ? 'bg-gold-dot' : 'bg-transparent',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] leading-[1.4] text-text">{x(n.text)}</div>
                        <div className="mt-[2px] text-[11.5px] text-text-muted">{x(n.time)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </dialog>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
