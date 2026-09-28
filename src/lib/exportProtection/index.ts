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

export { decodeInvisibleTag, encodeInvisibleTag } from './fingerprint'
export { formatStampTime, watermarkFooterLines, watermarkNotice } from './watermark'
export { appendExportAudit, clearExportAudit, readExportAudit } from './localAudit'
export { authorizeExport, exportDenialMessage } from './authorize'
export { buildTextPdf } from './artifacts/textPdf'
/* Word OOXML stays off this barrel — `docx` must not reach the eager graph.
   Callers dynamic-import `@/lib/exportProtection/artifacts/wordDoc`. */
export { exportFilename, triggerDownload } from './artifacts/download'
