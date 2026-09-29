export function formatDate(iso: string, lang: 'en' | 'fr'): string {
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(iso: string, lang: 'en' | 'fr'): string {
  return new Date(iso).toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
