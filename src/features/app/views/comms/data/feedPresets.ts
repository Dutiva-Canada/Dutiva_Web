import { bi } from '@/i18n/core'
import type { CommsFeed } from './types'

/** [FR self-authored] Curated Canadian monitoring feeds available as presets. */
export interface CommsFeedPreset extends Omit<CommsFeed, 'id' | 'lastFetchedAt' | 'lastFetchStatus' | 'lastFetchMessage'> {
  jurisdiction: 'federal' | 'provincial' | 'municipal' | 'internal'
}

export const CURATED_FEEDS: CommsFeedPreset[] = [
  {
    url: 'https://www.gazette.gc.ca/rss/p1-eng.xml',
    label: bi('Canada Gazette — Part I (proposed regulations and notices)', 'Gazette du Canada — Partie I (règlements projetés et avis)'),
    sourceType: 'official_notice',
    format: 'rss',
    enabled: true,
    jurisdiction: 'federal',
  },
  {
    url: 'https://www.gazette.gc.ca/rss/p2-eng.xml',
    label: bi('Canada Gazette — Part II (official regulations)', 'Gazette du Canada — Partie II (règlements officiels)'),
    sourceType: 'official_notice',
    format: 'rss',
    enabled: true,
    jurisdiction: 'federal',
  },
  {
    url: 'https://open.canada.ca/data/en/feeds/dataset.atom',
    label: bi('Open Government — new and updated datasets', 'Gouvernement ouvert — nouveaux jeux de données et mises à jour'),
    sourceType: 'official_notice',
    format: 'atom',
    enabled: true,
    jurisdiction: 'federal',
  },
  {
    url: 'https://news.ontario.ca/mlitsd/en/rss/news.rss',
    label: bi('Ontario Newsroom — Labour, Immigration, Training and Skills', 'Salle de presse de l’Ontario — Travail, Immigration, Formation et Compétences'),
    sourceType: 'news',
    format: 'rss',
    enabled: true,
    jurisdiction: 'provincial',
    createCoverageDrafts: true,
  },
]
