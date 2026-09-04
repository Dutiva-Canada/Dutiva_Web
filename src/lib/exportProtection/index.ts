/**
 * Export protection — watermarking, fingerprinting, velocity guard and audit
 * trail for everything a user takes out of Dutiva. Threat model, channel
 * design and operations runbook: docs/EXPORT_PROTECTION.md.
 *
 * Call order for an export path:
 *   authorizeExport() → (denied? exportDenialMessage → toast, stop)
 *   → build the watermarked artifact (applyTextWatermark / buildTextPdf /
 *     dynamic wordDoc) with the returned stamp → triggerDownload().
 */

export {
  contentFingerprint,
  decodeInvisibleTag,
  encodeInvisibleTag,
  isExportId,
  newExportId,
} from './fingerprint'
export {
  applyTextWatermark,
  formatStampTime,
  watermarkFooterLines,
  watermarkNotice,
  type ExportStamp,
} from './watermark'
export {
  appendExportAudit,
  clearExportAudit,
  localExportDecision,
  readExportAudit,
  LOCAL_GUARD_POLICY,
  type ExportAuditEntry,
  type ExportKind,
  type ExportSurface,
} from './localAudit'
export {
  authorizeExport,
  exportDenialMessage,
  type ExportDecision,
  type ExportRequest,
} from './authorize'
export { buildTextPdf, type TextPdfInput } from './artifacts/textPdf'
/* Word OOXML stays off this barrel — `docx` must not reach the eager graph.
   Callers dynamic-import `@/lib/exportProtection/artifacts/wordDoc`. */
export { exportFilename, triggerDownload } from './artifacts/download'
