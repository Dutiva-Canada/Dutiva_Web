import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Disclaimer } from '@/components/Disclaimer'
import { useI18n } from '@/i18n/context'
import { useToasts } from '@/features/app/toasts/toastsContext'
import { useDoclib } from '../doclibContext'
import { DocPaper } from '../components'
import { SignaturePad, type SignatureValue } from '../components/SignaturePad'
import { answerLabels, computedTokens, resolveBlocks } from '../engine'

export function SigningScreen() {
  const { envelopeId } = useParams<{ envelopeId: string }>()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()
  const navigate = useNavigate()
  const { showToast } = useToasts()
  const { data, org, applySignature } = useDoclib()
  const [selectedEmail, setSelectedEmail] = useState<string | null>(() => searchParams.get('recipient'))
  const [signature, setSignature] = useState<SignatureValue | undefined>()

  const doc = useMemo(() => {
    if (!envelopeId || !data) return undefined
    return data.documents.find((d) => d.signature?.envelopeId === envelopeId)
  }, [envelopeId, data])

  const template = useMemo(
    () => (doc ? data?.templates.find((tpl) => tpl.tid === doc.templateTid) : undefined),
    [doc, data],
  )

  const pendingRecipients = useMemo(
    () => doc?.recipients.filter((r) => r.status !== 'signed') ?? [],
    [doc],
  )

  useEffect(() => {
    if (pendingRecipients.length === 1 && !selectedEmail) {
      const email = pendingRecipients[0]?.email
      if (email) setSelectedEmail(email)
    }
  }, [pendingRecipients, selectedEmail])

  const selectedRecipient = useMemo(
    () => doc?.recipients.find((r) => r.email === selectedEmail),
    [doc, selectedEmail],
  )

  const blocksAndValues = useMemo(() => {
    if (!doc || !template) return null
    const blocks = resolveBlocks(template, {
      jurisdiction: doc.jurisdiction,
      headcount: org.headcount,
      unionized: org.unionized,
      answers: doc.answers,
    })
    const values = {
      ...computedTokens(doc.jurisdiction, doc.language, doc.updatedAt.slice(0, 10)),
      ...answerLabels(template, doc.answers, doc.language),
    }
    return { blocks, values }
  }, [doc, template, org])

  if (!data) {
    return <div className="p-8 text-center text-text-muted">{t('doclib_common_loading')}</div>
  }

  if (!doc || !envelopeId) {
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

  const handleSign = () => {
    if (!envelopeId || !selectedRecipient || !signature) return
    const updated = applySignature(envelopeId, selectedRecipient.email, {
      image: signature.image,
      signedName: signature.signedName,
    })
    if (updated) {
      showToast(
        { en: 'Document signed', fr: 'Document signé' },
        updated.signatureStatus === 'signed' ? 'ok' : 'info',
      )
      navigate(`/app/documents/${updated.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-300 px-7 pt-1 pb-16 max-[640px]:px-4">
      <button
        type="button"
        onClick={() => navigate('/app/documents')}
        className="mb-3.5 inline-flex items-center gap-1.5 py-1 text-[13px] font-semibold text-text-muted transition-colors hover:text-text"
      >
        <ChevronLeft size={15} strokeWidth={2} aria-hidden="true" />
        {t('doclib_sign_back')}
      </button>

      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
            {doc.ref}
          </div>
          <h1 className="font-display text-[23px] font-semibold leading-[1.2] tracking-[-0.015em] text-text">
            {t('doclib_sign_title')}
          </h1>
          <p className="mt-1 text-[13px] text-text-faint">{t('doclib_sign_subtitle')}</p>
        </div>
      </div>

      {pendingRecipients.length > 1 && !selectedEmail && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 text-[13px] font-semibold text-text">{t('doclib_sign_select')}</div>
          <div className="space-y-2">
            {pendingRecipients.map((recipient) => (
              <button
                key={recipient.email}
                type="button"
                onClick={() => setSelectedEmail(recipient.email)}
                className="flex w-full items-center justify-between rounded-[10px] border border-border bg-inset px-4 py-3 text-left hover:bg-surface"
              >
                <div>
                  <div className="text-[13px] font-semibold text-text">{recipient.name}</div>
                  <div className="text-[11.5px] text-text-faint">{recipient.email}</div>
                </div>
                <span className="rounded-lg bg-navy px-2.5 py-1 text-[12px] font-semibold text-white">
                  {t('doclib_docd_sendSign')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}


      <div className="flex flex-col gap-6.5 lg:flex-row">
        <div className="min-w-0 flex-1">
          {blocksAndValues && (
            <div className="max-h-[70vh] overflow-y-auto rounded-[14px] border border-border">
              <DocPaper
                blocks={blocksAndValues.blocks}
                values={blocksAndValues.values}
                docLang={doc.language}
              />
            </div>
          )}
        </div>

        <aside className="w-full shrink-0 lg:w-90">
          <div className="sticky top-[14px] rounded-[14px] border border-border bg-surface p-5">
            <h2 className="mb-1 font-display text-[16px] font-semibold text-text">
              {t('doclib_sign_title')}
            </h2>

            {!selectedEmail ? (
              <div className="text-[13px] text-text-muted">
                {pendingRecipients.length > 0 ? t('doclib_sign_select') : t('doclib_sign_notFound')}
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

                <p className="mt-4 text-[11.5px] text-text-faint">{t('doclib_sign_confirm')}</p>

                <button
                  type="button"
                  onClick={handleSign}
                  disabled={!selectedRecipient || !signature}
                  className="mt-4 w-full rounded-[9px] bg-navy px-3.5 py-2 text-[12.5px] font-semibold text-white opacity-100 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('doclib_sign_done')}
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
