/**
 * Resolve a catalogue template key (tid like `T01`, or tpl id like `tpl_t01`)
 * to the Documents generate route. Prefer this over DocStudioOverlay for
 * jurisdiction-aware catalogue templates.
 */
import { templateById, templateByTid } from '@/features/app/documents/data'
import { customTemplateByTid, customTemplates } from '@/features/app/documents/customTemplates'

const customTemplateById = new Map(customTemplates.map((t) => [t.id, t]))

export function catalogueGeneratePath(templateKey: string): string | null {
  const byTid = templateByTid.get(templateKey) ?? customTemplateByTid.get(templateKey)
  if (byTid) return `/app/documents/generate/${byTid.id}`
  const byId = templateById.get(templateKey) ?? customTemplateById.get(templateKey)
  if (byId) return `/app/documents/generate/${byId.id}`
  return null
}
