import { defineMessages } from '../core'

/**
 * Export-protection strings — watermark notice lines stamped into exported
 * artifacts, rate-limit refusals, and the Settings export-activity panel.
 * No prototype coverage exists for this feature, so every FR string is
 * self-authored (Québec French). `{tokens}` are filled by the callers
 * (src/lib/exportProtection) with `String.replace`, same pattern as
 * usageLimit.ts.
 */
export const exportProtectionMessages = defineMessages({
  /* Visible watermark stamped into every exported artifact. Kept to one
     sentence pair: identity + traceability first, obligation second. */
  exportprot_notice_line: {
    en: 'Exported from Dutiva — {workspace} · {actor} · {ts} UTC · Export ID {id}.',
    fr: 'Exporté de Dutiva — {workspace} · {actor} · {ts} UTC · ID d’exportation {id}.',
  }, // FR self-authored
  exportprot_notice_confidential: {
    en: 'Confidential: for internal HR use only. This copy is traceable to the exporting account.',
    fr: 'Confidentiel : réservé à l’usage RH interne. Cette copie est traçable au compte exportateur.',
  }, // FR self-authored

  /* Rate-limit refusals (mirrors the Advisor's usage-limit voice: vague wait
     on purpose — the rolling window frees as calls age out). */
  exportprot_limit_burst: {
    en: 'Export limit reached — too many exports in a short time. Try again in about {wait}.',
    fr: 'Limite d’exportation atteinte — trop d’exportations en peu de temps. Réessayez dans environ {wait}.',
  }, // FR self-authored
  exportprot_limit_daily: {
    en: 'Daily export limit reached. Try again in about {wait}.',
    fr: 'Limite quotidienne d’exportation atteinte. Réessayez dans environ {wait}.',
  }, // FR self-authored
  exportprot_wait_minutes: { en: '{count} minutes', fr: '{count} minutes' }, // FR self-authored
  exportprot_wait_hours: { en: '{count} hours', fr: '{count} heures' }, // FR self-authored
  exportprot_wait_minute: { en: 'a minute', fr: 'une minute' }, // FR self-authored
  exportprot_wait_hour: { en: 'an hour', fr: 'une heure' }, // FR self-authored

  /* Watermark identity fallbacks — used only when the export runs outside
     the workspace provider stack (no signed-in profile, no demo fixture
     identity to name). */
  exportprot_demo_actor: { en: 'Demo session', fr: 'Session démo' }, // FR self-authored
  exportprot_demo_workspace: { en: 'Dutiva demo workspace', fr: 'Espace démo Dutiva' }, // FR self-authored

  /* Settings › Export activity — real export events recorded on this device. */
  exportprot_audit_section: { en: 'Export activity', fr: 'Activité d’exportation' }, // FR self-authored
  exportprot_audit_empty: {
    en: 'No exports recorded on this device yet.',
    fr: 'Aucune exportation enregistrée sur cet appareil pour l’instant.',
  }, // FR self-authored
  exportprot_audit_device_note: {
    en: 'Every export is watermarked with its export ID and recorded here on this device. Signed-in exports are also written to the server export trail for staff review.',
    fr: 'Chaque exportation est filigranée avec son ID d’exportation et enregistrée ici sur cet appareil. Les exportations en session sont aussi écrites dans le journal d’exportation serveur pour revue par le personnel.', // FR self-authored
  }, // FR self-authored
  exportprot_audit_row_by: { en: 'by', fr: 'par' }, // FR self-authored
})
