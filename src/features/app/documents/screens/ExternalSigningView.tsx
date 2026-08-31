import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Disclaimer } from '@/components/Disclaimer'
import { useI18n } from '@/i18n/context'
import { pick } from '@/i18n/core'
import { doclibMessages as M } from '@/i18n/messages/doclib'
import { Seo } from '@/seo/Seo'
import { DocPaper } from '../components'
import { SignaturePad, type SignatureValue } from '../components/SignaturePad'
import {
  applyExternalSignature,
  declineExternalSignature,
  externalRecipientCanSignNow,
  getExternalSigningPackage,
  recordExternalSignatureView,
  type ExternalSigningPackage,
} from '../externalSigningApi'
import { DUTIVA_SIGNING_CONSENT_VERSION } from '../signingConsent'

/**
 * Public signing page for external counterparties — token-scoped RPC access
 * (migration 0080). No Dutiva login required.
 */
export function ExternalSigningView() {
  const { token } = useParams<{ token: string }>()
  const { t, x, lang } = useI18n()
  const signPath = lang === 'fr' ? `/fr/sign/${token ?? ''}` : `/sign/${token ?? ''}`
  const seo = (
    <Seo
      page={{
        title: {
          en: 'Sign document | Dutiva Signature',
          fr: 'Signer le document | Dutiva Signature',
        },
        description: {
          en: 'Private signing link. Do not share this URL publicly.',
          fr: 'Lien de signature privé. Ne partagez pas cette URL publiquement.',
        },
        path: { en: signPath, fr: signPath },
        indexable: false,
      }}
    />
  )

  const [pkg, setPkg] = useState<ExternalSigningPackage | null | undefined>(undefined)
  const [loadFailed, setLoadFailed] = useState(false)
  const [signing, setSigning] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [signature, setSignature] = useState<SignatureValue | undefined>()
  const [completedStatus, setCompletedStatus] = useState<'signed' | 'partially_signed' | null>(null)
  const [signError, setSignError] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoadFailed(false)
    try {
      setPkg(await getExternalSigningPackage(token))
    } catch {
      setPkg(null)
      setLoadFailed(true)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!token || !pkg) return
    void recordExternalSignatureView(token).catch(() => {
      /* view audit is best-effort */
    })
  }, [token, pkg?.recipient.id])

  const canSign = pkg ? externalRecipientCanSignNow(pkg) : false
  const turnRecipient = useMemo(() => {
    if (pkg?.turnOrder == null) return null
    return pkg.recipients.find((r) => r.order === pkg.turnOrder) ?? null
  }, [pkg])

  const preview = useMemo(() => {
    if (!pkg) return null
    return {
      blocks: pkg.document.content.blocks,
      values: pkg.document.content.values,
      lang: pkg.document.language,
    }
  }, [pkg])

  /* Refresh while waiting for an earlier signer so the page picks up turn changes. */
  useEffect(() => {
    if (!pkg || canSign || completedStatus !== null) return
    if (pkg.recipient.status === 'signed' || pkg.recipient.status === 'declined') return
    const id = window.setInterval(() => {
      void load()
    }, 15_000)
    return () => window.clearInterval(id)
  }, [pkg, canSign, completedStatus, load])

  if (pkg === undefined) {
    return (
      <>
        {seo}
        <div className="surface-app min-h-screen bg-bg px-6 py-16 text-center font-sans text-text-muted">
          {t('doclib_common_loading')}
        </div>
      </>
    )
  }

  if (loadFailed || !pkg || !token) {
    return (
      <>
        {seo}
        <div className="surface-app min-h-screen bg-bg px-6 py-16 text-center font-sans text-text">
          <h1 className="mb-2 font-display text-[20px] font-semibold text-text">
            {t('doclib_sign_notFound')}
          </h1>
          <p className="text-[13px] text-text-muted">{x(M.doclib_external_invalid_link)}</p>
        </div>
      </>
    )
  }

  if (completedStatus !== null || pkg.recipient.status === 'signed') {
    const docFullySigned = pkg.document.signatureStatus === 'signed'
    const partial = completedStatus === 'partially_signed' || !docFullySigned
    return (
      <>
        {seo}
        <div className="surface-app min-h-screen bg-bg px-6 py-16 text-center font-sans text-text">
          <h1 className="mb-2 font-display text-[20px] font-semibold text-text">
            {x(!partial ? M.doclib_external_signed_title : M.doclib_external_signed_partial_title)}
          </h1>
          <p className="text-[13px] text-text-muted">
            {x(!partial ? M.doclib_external_signed_body : M.doclib_external_signed_partial_body)}
          </p>
        </div>
      </>
    )
  }

  if (pkg.recipient.status === 'declined') {
    return (
      <>
        {seo}
        <div className="surface-app min-h-screen bg-bg px-6 py-16 text-center font-sans text-text">
          <h1 className="mb-2 font-display text-[20px] font-semibold text-text">
            {x(M.doclib_sign_declined)}
          </h1>
        </div>
      </>
    )
  }

  const handleSign = async () => {
    if (!token || !canSign || !signature || !consentChecked || signing) return
    setSigning(true)
    setSignError(false)
    try {
      const result = await applyExternalSignature(
        token,
        {
          image: signature.image,
          signedName: signature.signedName,
        },
        DUTIVA_SIGNING_CONSENT_VERSION,
      )
      setCompletedStatus(result.signatureStatus === 'signed' ? 'signed' : 'partially_signed')
    } catch {
      setSignError(true)
    } finally {
      setSigning(false)
    }
  }

  const handleDecline = async () => {
    if (!token || !canSign || declining) return
    setDeclining(true)
    setSignError(false)
    try {
      await declineExternalSignature(token)
      await load()
    } catch {
      setSignError(true)
    } finally {
      setDeclining(false)
    }
  }

  return (
    <>
      {seo}
      <div className="surface-app min-h-screen bg-bg font-sans text-text">
        <div className="mx-auto max-w-300 px-7 pt-8 pb-16 max-[640px]:px-4">
          <div className="mb-4.5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
              {pkg.document.ref}
            </div>
            <h1 className="font-display text-[23px] font-semibold leading-[1.2] tracking-[-0.015em] text-text">
              {pick(pkg.document.title, pkg.document.language)}
            </h1>
            <p className="mt-1 text-[13px] text-text-faint">{x(M.doclib_external_intro)}</p>
          </div>

          {turnRecipient && !canSign && (
            <div className="mb-4 rounded-xl border border-border bg-inset px-4 py-3 text-[13px] text-text-muted">
              {x(M.doclib_sign_waitingTurn)} {turnRecipient.name} ({turnRecipient.email})
            </div>
          )}

          {signError && (
            <div className="mb-4 rounded-xl border border-risk-border bg-risk-bg px-4 py-3 text-[13px] text-risk-fg">
              {x(M.doclib_external_sign_failed)}
            </div>
          )}

          <div className="flex flex-col gap-6.5 lg:flex-row">
            <div className="min-w-0 flex-1">
              {preview && (
                <div className="max-h-[70vh] overflow-y-auto rounded-[14px] border border-border bg-surface">
                  <DocPaper
                    blocks={preview.blocks}
                    values={preview.values}
                    docLang={preview.lang}
                  />
                </div>
              )}
            </div>

            <aside className="w-full shrink-0 lg:w-90">
              <div className="sticky top-[14px] rounded-[14px] border border-border bg-surface p-5">
                <h2 className="mb-1 font-display text-[16px] font-semibold text-text">
                  {t('doclib_sign_title')}
                </h2>

                {!canSign ? (
                  <div className="text-[13px] text-text-muted">
                    {turnRecipient ? x(M.doclib_sign_waitingTurn) : t('doclib_sign_notFound')}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-[12.5px] text-text-faint">
                      {pkg.recipient.name} · {pkg.recipient.email}
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

                    <p className="mt-3 text-[11.5px] text-text-faint">
                      {x(M.doclib_sign_legalNotice)}
                    </p>

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
      </div>
    </>
  )
}
