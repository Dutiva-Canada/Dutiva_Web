import { cases, chats } from '@/data'
import type { Bi } from '@/i18n/core'
import type { Task } from '@/data'

/** Title of the case or chat a demo task is linked to, if any. */
export function linkedFor(task: Task): Bi | null {
  const linkedCase = cases.find((c) => c.chatId === task.chatId)
  if (linkedCase) return linkedCase.title
  const linkedChat = chats.find((c) => c.id === task.chatId)
  return linkedChat ? linkedChat.title : null
}
