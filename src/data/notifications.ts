import { bi } from '@/i18n/core'
import type { Notification } from './types'

/** Notifications, transcribed from the prototype's `buildNotifications()`. */

export const notifications: Notification[] = [
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
