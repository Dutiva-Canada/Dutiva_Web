import { bi } from '@/i18n/core'
import type { Notification } from './types'

/** Notifications, transcribed from the prototype's `buildNotifications()`. */

export const notifications: Notification[] = [
  {
    id: 'n1',
    text: bi(
      'Compliance: Remote Work Policy review due soon',
      'Conformité : révision de la politique de télétravail bientôt due',
    ),
    time: bi('1h ago', 'Il y a 1 h'),
    unread: true,
  },
  {
    id: 'n2',
    text: bi(
      'Draft ready: Termination Letter — Jordan Mensah',
      'Ébauche prête : lettre de licenciement — Jordan Mensah',
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
