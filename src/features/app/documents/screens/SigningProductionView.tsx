import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Disclaimer } from '@/components/Disclaimer'
import { useI18n } from '@/i18n/context'
import { doclibMessages as M } from '@/i18n/messages/doclib'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ProductionEmptyState } from '@/features/app/workspaceMode/ProductionEmptyState'
import { DocPaper } from '../components'
import { SignaturePad, type SignatureValue } from '../components/SignaturePad'
import {
  applyDocumentSignature,
  currentSigningTurn,
  declineDocumentSignature,
  getSigningPackage,
  recordDocumentSignatureView,
  recipientCanSignNow,
} from '../signatureApi'
import type { SigningPackage } from '../signatureApi'
import { DUTIVA_SIGNING_CONSENT_VERSION } from '../signingConsent'

/**
 * Dutiva-native signing — frozen document snapshot, consent capture, ordered
 * recipients, and server-side RPC enforcement (0078). No third-party vendor.
 */
export function SigningProductionView() {
  const { envelopeId } = useParams<{ envelopeId: string }>()
  const [searchParams] = useSearchParams()
  const { t, x } = useI18n()
  const navigate = useNavigate()
  const { showToast } = useToasts()
  const { organizationId, identity } = useWorkspaceMode()

  const [pkg, setPkg] = useState<SigningPackage | null | undefined>(undefined)
  const [loadFailed, setLoadFailed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<string | null>(() =>
    searchParams.get('recipient'),
  )
  const [signature, setSignature] = useState<SignatureValue | undefined>()

  const load = useCallback(async () => {
    if (!organizationId || !envelopeId) return
    setLoadFailed(false)
    try {
      setPkg(await getSigningPackage(organizationId, envelopeId))
    } catch {
      setPkg(null)
      setLoadFailed(true)
    }
  }, [organizationId, envelopeId])

  useEffect(() => {
    void load()
  }, [load])

  const userEmail = identity.user.email.toLowerCase()

  useEffect(() => {
    if (!envelopeId || !pkg) return
    void recordDocumentSignatureView(envelopeId).catch(() => {
      /* view audit is best-effort */
    })
  }, [envelopeId, pkg?.signature.id])

  /* Refresh while waiting for an earlier signer so turn state stays current. */
  useEffect(() => {
    if (!pkg || recipientCanSignNow(pkg.recipients, userEmail)) return
    const id = window.setInterval(() => {
      void load()
    }, 15_000)
    return () => window.clearInterval(id)
  }, [pkg, userEmail, load])

  const turn = useMemo(() => (pkg ? currentSigningTurn(pkg.recipients) : null), [pkg])

  const pendingRecipients = useMemo(
    () =>
      pkg?.recipients.filter(
        (r) =>
          r.status !== 'signed' && r.status !== 'declined' && r.email.toLowerCase() === userEmail,
      ) ?? [],
    [pkg, userEmail],
  )

  const signedRecipientsForUser = useMemo(
    () =>
      pkg?.recipients.filter((r) => r.status === 'signed' && r.email.toLowerCase() === userEmail) ??
      [],
    [pkg, userEmail],
  )

  useEffect(() => {
    if (turn && recipientCanSignNow(pkg?.recipients ?? [], userEmail) && !selectedEmail) {
      setSelectedEmail(turn.email)
    }
  }, [turn, pkg, userEmail, selectedEmail])

  const selectedRecipient = useMemo(
    () => pkg?.recipients.find((r) => r.email === selectedEmail),
    [pkg, selectedEmail],
  )

  const canSignSelected =
    !!selectedRecipient &&
    recipientCanSignNow(pkg?.recipients ?? [], selectedRecipient.email) &&
    selectedRecipient.email.toLowerCase() === userEmail

  const preview = useMemo(() => {
    if (!pkg) return null
    const current = pkg.detail.versions.find((v) => v.versionNumber === pkg.detail.currentVersion)
    if (!current) return null
    return {
      blocks: current.content.blocks,
      values: current.content.values,
      lang: pkg.detail.language,
    }
  }, [pkg])

  if (!organizationId) {
    return <ProductionEmptyState title={x(M.doclib_prod_empty_title)} />
  }

  if (pkg === undefined) {
    return <div className="p-8 text-center text-text-muted">{t('doclib_common_loading')}</div>
  }

  if (loadFailed || !pkg || !envelopeId) {
    return (
      <div className="mx-auto max-w-170 px-6 py-16 text-center">
        <h1 className="mb-2 font-display text-[20px] font-semibold text-text">
          {t('doclib_sign_notFound')}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/app/documents')}
          className="mt-4 rounded-[9px] bg-navy px-3.5 py-2 text-[12.5px] font-semibold text-white"
        >
          {t('doclib_sign_back')}
        </button>
      </div>
    )
  }

  if (
    pendingRecipients.length === 0 &&
    signedRecipientsForUser.length === 0 &&
    pkg.detail.signatureStatus !== 'signed'
  ) {
    return (
      <div className="mx-auto max-w-170 px-6 py-16 text-center">
        <h1 className="mb-2 font-display text-[20px] font-semibold text-text">
          {x(M.doclib_sign_wrongAccount)}
        </h1>
        <p className="text-[13px] text-text-muted">{x(M.doclib_sign_wrongAccountBody)}</p>
        <button
          type="button"
          onClick={() => navigate(`/app/documents/${pkg.detail.id}`)}
          className="mt-4 rounded-[9px] bg-navy px-3.5 py-2 text-[12.5px] font-semibold text-white"
        >
          {x(M.doclib_prod_back)}
        </button>
      </div>
    )
  }

  if (
    pendingRecipients.length === 0 &&
    signedRecipientsForUser.length > 0 &&
    pkg.detail.signatureStatus !== 'signed'
  ) {
    return (
      <div className="mx-auto max-w-170 px-6 py-16 text-center">
        <h1 className="mb-2 font-display text-[20px] font-semibold text-text">
          {x(M.doclib_sign_alreadySigned_title)}
        </h1>
        <p className="text-[13px] text-text-muted">{x(M.doclib_sign_alreadySigned_body)}</p>
        <button
          type="button"
          onClick={() => navigate(`/app/documents/${pkg.detail.id}`)}
          className="mt-4 rounded-[9px] bg-navy px-3.5 py-2 text-[12.5px] font-semibold text-white"
        >
          {x(M.doclib_prod_back)}
        </button>
      </div>
    )
  }

  const handleSign = async () => {
    if (!envelopeId || !canSignSelected || !signature || !consentChecked || signing) return
    setSigning(true)
    try {
      const result = await applyDocumentSignature(
        envelopeId,
        {
          image: signature.image,
          signedName: signature.signedName,
        },
        DUTIVA_SIGNING_CONSENT_VERSION,
      )
      showToast(
        result.signatureStatus === 'signed' ? M.doclib_prod_status_signed : M.doclib_prod_sent_sign,
        result.signatureStatus === 'signed' ? 'ok' : 'info',
      )
      navigate(`/app/documents/${result.documentId}`)
    } catch {
      showToast(M.doclib_prod_send_sign_failed, 'info')
    } finally {
      setSigning(false)
    }
  }

  const handleDecline = async () => {
    if (!envelopeId || !canSignSelected || declining) return
    setDeclining(true)
    try {
      const result = await declineDocumentSignature(envelopeId)
      showToast(M.doclib_sign_declined, 'info')
      navigate(`/app/documents/${result.documentId}`)
    } catch {
      showToast(M.doclib_prod_send_sign_failed, 'info')
    } finally {
      setDeclining(false)
    }
  }

  return (
    <div className="mx-auto max-w-300 px-7 pt-1 pb-16 max-[640px]:px-4">
      <button
        type="button"
        onClick={() => navigate(`/app/documents/${pkg.detail.id}`)}
        className="mb-3.5 inline-flex items-center gap-1.5 py-1 text-[13px] font-semibold text-text-muted transition-colors hover:text-text"
      >
        <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
        {t('doclib_sign_back')}
      </button>

      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
            {pkg.detail.ref}
          </div>
          <h1 className="font-display text-[23px] font-semibold leading-[1.2] tracking-[-0.015em] text-text">
            {t('doclib_sign_title')}
          </h1>
          <p className="mt-1 text-[13px] text-text-faint">{x(M.doclib_sign_dutivaNote)}</p>
        </div>
      </div>

      {turn && !canSignSelected && (
        <div className="mb-4 rounded-xl border border-border bg-inset px-4 py-3 text-[13px] text-text-muted">
          {x(M.doclib_sign_waitingTurn)} {turn.name} ({turn.email})
        </div>
      )}

      <div className="flex flex-col gap-6.5 lg:flex-row">
        <div className="min-w-0 flex-1">
          {preview && (
            <div className="max-h-[70vh] overflow-y-auto rounded-[14px] border border-border">
              <DocPaper blocks={preview.blocks} values={preview.values} docLang={preview.lang} />
            </div>
          )}
        </div>

        <aside className="w-full shrink-0 lg:w-90">
          <div className="sticky top-[14px] rounded-[14px] border border-border bg-surface p-5">
            <h2 className="mb-1 font-display text-[16px] font-semibold text-text">
              {t('doclib_sign_title')}
            </h2>

            {!canSignSelected ? (
              <div className="text-[13px] text-text-muted">
                {turn ? x(M.doclib_sign_waitingTurn) : t('doclib_sign_notFound')}
              </div>
            ) : (
              <>
                <div className="mb-4 text-[12.5px] text-text-faint">
                  {selectedRecipient?.name} · {selectedRecipient?.email}
                </div>

                <SignaturePad
                  labels={{
                    name: t('doclib_sign_name'),
                    draw: t('doclib_sign_draw'),
                    type: t('doclib_sign_type'),
                    clear: t('doclib_sign_clear'),
                    placeholder: t('doclib_sign_namePh'),
                  }}
                  onChange={setSignature}
                />

                <label className="mt-4 flex items-start gap-2 text-[12px] text-text-muted">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>{x(M.doclib_sign_consent)}</span>
                </label>

                <p className="mt-3 text-[11.5px] text-text-faint">{x(M.doclib_sign_legalNotice)}</p>

                <button
                  type="button"
                  onClick={() => void handleSign()}
                  disabled={!signature || !consentChecked || signing}
                  className="mt-4 w-full rounded-[9px] bg-navy px-3.5 py-2 text-[12.5px] font-semibold text-white opacity-100 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('doclib_sign_done')}
                </button>

                <button
                  type="button"
                  onClick={() => void handleDecline()}
                  disabled={declining}
                  className="mt-2 w-full rounded-[9px] border border-border bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-text hover:bg-inset disabled:opacity-50"
                >
                  {x(M.doclib_sign_decline)}
                </button>
              </>
            )}
          </div>

          <Disclaimer variant="block" className="mt-4" />
        </aside>
      </div>
    </div>
  )
}
