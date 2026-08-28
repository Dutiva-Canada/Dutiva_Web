import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileStack, Folder, MessageCircle, Plus, Send, Users, Waypoints } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { shellMessages as M } from '@/i18n/messages/shell'
import { SidebarTooltip } from './SidebarTooltip'
import { cx } from './cx'

type CreateActionKey =
  'conversation' | 'workflow' | 'case' | 'document' | 'employee' | 'communication'

interface CreateAction {
  key: CreateActionKey
  label: { en: string; fr: string }
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  href?: string
  state?: Record<string, unknown>
  disabled?: boolean
}

function useCreateActions(): CreateAction[] {
  /* Order matches empty-workspace first steps (person → Studio → guided
     process), then case / conversation / communication. Employee and Case
     use ?new=1 so the create form opens — same contract as Home checklist. */
  return [
    {
      key: 'employee',
      label: M.shell_create_employee,
      icon: Users,
      href: '/app/employees?new=1',
    },
    {
      key: 'document',
      label: M.shell_create_document,
      icon: FileStack,
      href: '/app/documents/studio',
    },
    {
      key: 'workflow',
      label: M.shell_create_workflow,
      icon: Waypoints,
      href: '/app/workflows',
    },
    {
      key: 'case',
      label: M.shell_create_case,
      icon: Folder,
      href: '/app/cases?new=1',
    },
    {
      key: 'conversation',
      label: M.shell_create_conversation,
      icon: MessageCircle,
      href: '/app/advisor',
      state: { newConversation: true },
    },
    {
      key: 'communication',
      label: M.shell_create_communication,
      icon: Send,
      href: '/app/communications',
    },
  ]
}

interface SidebarCreateMenuProps {
  readonly expanded: boolean
  readonly onNavigate?: () => void
}

export function SidebarCreateMenu({ expanded, onNavigate }: SidebarCreateMenuProps) {
  const { x } = useI18n()
  const navigate = useNavigate()
  const actions = useCreateActions()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleToggle = useCallback(() => setOpen((v) => !v), [])
  const handleClose = useCallback(() => setOpen(false), [])

  const handleAction = (action: CreateAction) => {
    if (action.disabled) return
    handleClose()
    onNavigate?.()
    if (action.href) {
      navigate(action.href, { state: action.state })
    }
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleClose()
        buttonRef.current?.focus()
        return
      }
      const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])
      if (items.length === 0) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const current = document.activeElement
        const idx = items.indexOf(current as Element)
        const movesDown = e.key === 'ArrowDown'
        let nextIdx = 0
        if (movesDown) {
          nextIdx = idx >= 0 && idx < items.length - 1 ? idx + 1 : 0
        } else if (idx > 0) {
          nextIdx = idx - 1
        } else {
          nextIdx = items.length - 1
        }
        ;(items[nextIdx] as HTMLElement).focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, handleClose])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) === false &&
        buttonRef.current?.contains(e.target as Node) === false
      ) {
        handleClose()
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [open, handleClose])

  useEffect(() => {
    if (!open) return
    const first = menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement | null
    first?.focus()
  }, [open])

  const unavailableDescId = 'create-unavailable-desc'

  if (!expanded) {
    return (
      <div className="relative">
        <SidebarTooltip label={x(M.shell_create)} show>
          <button
            ref={buttonRef}
            type="button"
            onClick={handleToggle}
            aria-label={x(M.shell_create)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-navy text-white hover:opacity-[.92]"
          >
            <Plus size={18} strokeWidth={2} />
          </button>
        </SidebarTooltip>
        {open && (
          <CreateMenuPanel
            ref={menuRef}
            actions={actions}
            unavailableDescId={unavailableDescId}
            onAction={handleAction}
            compact
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className="mb-1.5 flex w-full cursor-pointer items-center gap-2 rounded-lg bg-navy px-3 py-2.25 text-[13.5px] font-semibold text-white hover:opacity-[.92]"
      >
        <Plus size={15} strokeWidth={2} className="shrink-0" />
        <span className="flex-1 text-left">{x(M.shell_create)}</span>
      </button>
      {open && (
        <CreateMenuPanel
          ref={menuRef}
          actions={actions}
          unavailableDescId={unavailableDescId}
          onAction={handleAction}
        />
      )}
    </div>
  )
}

interface CreateMenuPanelProps {
  actions: CreateAction[]
  unavailableDescId: string
  onAction: (action: CreateAction) => void
  compact?: boolean
}

const CreateMenuPanel = forwardRef<HTMLDivElement, CreateMenuPanelProps>(function CreateMenuPanel(
  { actions, unavailableDescId, onAction, compact = false },
  ref,
) {
  const { x } = useI18n()
  return (
    <div
      ref={ref}
      role="menu"
      aria-label={x(M.shell_create)}
      className={cx(
        'absolute z-60 w-55 overflow-hidden rounded-[10px] border border-border bg-surface shadow-menu',
        compact ? 'top-0 left-full ml-2' : 'top-full left-0 mt-1.5',
      )}
    >
      {actions.map((action) => {
        const Icon = action.icon
        const disabled = !!action.disabled
        return (
          <button
            key={action.key}
            type="button"
            role="menuitem"
            aria-disabled={disabled}
            aria-describedby={disabled ? unavailableDescId : undefined}
            tabIndex={-1}
            onClick={() => onAction(action)}
            className={cx(
              'flex w-full cursor-pointer items-center justify-between gap-2.5 border-none bg-transparent px-3 py-2.25 text-left text-[13px]',
              disabled ? 'text-text-muted' : 'text-text-2 hover:bg-inset focus:bg-inset',
            )}
          >
            <span className="flex items-center gap-2.25">
              <Icon size={15} strokeWidth={1.8} className="shrink-0" />
              {x(action.label)}
            </span>
            {disabled && (
              <span className="rounded-sm border border-border px-1.25 py-px text-[10px] text-text-faint">
                {x(M.shell_create_unavailable)}
              </span>
            )}
          </button>
        )
      })}
      <div id={unavailableDescId} className="sr-only">
        {x(M.shell_create_unavailable_desc)}
      </div>
    </div>
  )
})
