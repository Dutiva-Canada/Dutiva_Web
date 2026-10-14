/** Icon per agent_suggestions kind — the pending strips across the portal
    share these so a row's type is scannable at a glance (a theme watch
    doesn't look like a rule-add). Unknown kinds get Sparkles. */
import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  Bot,
  Brain,
  CirclePlus,
  DoorOpen,
  LayoutGrid,
  ListPlus,
  Radar,
  Repeat,
  SlidersHorizontal,
  Sparkles,
  Target,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

const KIND_ICONS: Record<string, LucideIcon> = {
  strategy: Bot,
  rule_add: CirclePlus,
  rule_tune: SlidersHorizontal,
  scope_add: ListPlus,
  thesis: BookOpen,
  exit_proposal: DoorOpen,
  goal: Target,
  scan: Radar,
  swot: LayoutGrid,
  memory: Brain,
  profile: UserRound,
  order_cross: ArrowLeftRight,
  stress_scenario: Activity,
  recurring: Repeat,
}

export function suggestionIcon(kind: string): LucideIcon {
  return KIND_ICONS[kind] ?? Sparkles
}
