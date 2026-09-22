import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { careersMessages as M } from '@/i18n/messages/careers'
import { useAuth } from '@/features/app/auth/authContext'
import { useToasts } from '@/features/app/toasts/toastsContext'
import {
  clampYearsExperience,
  createCandidateProfile,
  deleteMyCandidateProfile,
  getMyCandidateProfile,
  updateCandidateProfile,
} from '@/features/careers/data/candidateApi'
import type {
  CandidateProfile,
  CandidateWorkAuthorization,
} from '@/features/careers/data/candidateApi'
import { CandidateProfileForm } from './CandidateProfileForm'
import type { CandidateProfileFormValues } from './CandidateProfileForm'

type LoadState = 'loading' | 'ready' | 'failed'

/** Initial empty form values. */
function emptyForm(email: string): CandidateProfileFormValues {
  return {
    name: '',
    email,
    phone: '',
    location: '',
    headline: '',
    summary: '',
    resumeText: '',
    coverLetter: '',
    linkedin: '',
    website: '',
    currentRole: '',
    yearsExperience: '',
    workAuthorization: 'unknown' as CandidateWorkAuthorization,
  }
}

/** Convert a loaded profile into form values; session email covers a blank stored value. */
function profileToForm(
  profile: CandidateProfile,
  sessionEmail: string,
): CandidateProfileFormValues {
  return {
    name: profile.name,
    email: profile.email || sessionEmail,
    phone: profile.phone ?? '',
    location: profile.location,
    headline: profile.headline,
    summary: profile.summary,
    resumeText: profile.resumeText,
    coverLetter: profile.coverLetter ?? '',
    linkedin: profile.linkedin ?? '',
    website: profile.website ?? '',
    currentRole: profile.currentRole ?? '',
    yearsExperience: profile.yearsExperience != null ? String(profile.yearsExperience) : '',
    workAuthorization: profile.workAuthorization,
  }
}

/**
 * Candidate profile editor. Loads the existing profile (if any), pre-fills
 * the email from the auth session, and creates or updates on save.
 */
export function CandidateProfilePage() {
  const { x } = useI18n()
  const { session } = useAuth()
  const { showToast } = useToasts()
  const navigate = useNavigate()

  const [state, setState] = useState<LoadState>('loading')
  const [existing, setExisting] = useState<CandidateProfile | null>(null)
  const [form, setForm] = useState<CandidateProfileFormValues>(emptyForm(session?.user.email ?? ''))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setState('loading')
    try {
      const profile = await getMyCandidateProfile()
      setExisting(profile)
      setForm(
        profile
          ? profileToForm(profile, session?.user.email ?? '')
          : emptyForm(session?.user.email ?? ''),
      )
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [session?.user.email])

  useEffect(() => {
    void load()
  }, [load])

  const onSave = async (values: CandidateProfileFormValues) => {
    if (saving) return
    setSaving(true)
    const input = {
      name: values.name.trim(),
      email: values.email,
      phone: values.phone.trim() || null,
      location: values.location.trim(),
      headline: values.headline.trim(),
      summary: values.summary.trim(),
      resumeText: values.resumeText.trim(),
      coverLetter: values.coverLetter.trim() || null,
      linkedin: values.linkedin.trim() || null,
      website: values.website.trim() || null,
      yearsExperience: clampYearsExperience(
        values.yearsExperience ? Number(values.yearsExperience) : null,
      ),
      workAuthorization: values.workAuthorization,
      currentRole: values.currentRole.trim() || null,
    }
    try {
      if (existing) {
        await updateCandidateProfile(input)
      } else {
        await createCandidateProfile(input)
      }
      showToast(M.careers_profile_saved, 'ok')
      void load()
    } catch {
      showToast(M.careers_profile_save_error, 'info')
    } finally {
      setSaving(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-[8px] text-[14px] text-text-muted">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        {x(M.careers_loading)}
      </div>
    )
  }

  if (state === 'failed') {
    return (
      <div className="rounded-[12px] border border-border bg-surface px-[20px] py-[56px] text-center">
        <div className="mb-[4px] text-[14.5px] font-semibold text-text">
          {x(M.careers_error_generic)}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-[12px] cursor-pointer rounded-[8px] border-none bg-navy px-[14px] py-[8px] text-[13px] font-semibold text-white"
        >
          {x(M.careers_retry)}
        </button>
      </div>
    )
  }

  const onDelete = async () => {
    if (deleting) return
    if (!window.confirm(x(M.careers_profile_delete_confirm))) return
    setDeleting(true)
    try {
      await deleteMyCandidateProfile()
      showToast(M.careers_profile_deleted, 'ok')
      navigate('/careers/portal')
    } catch {
      showToast(M.careers_profile_delete_error, 'info')
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <CandidateProfileForm values={form} onChange={setForm} onSubmit={onSave} saving={saving} />

      {existing && (
        <div className="rounded-[12px] border border-risk-border bg-surface p-[20px]">
          <h2 className="m-0 text-[15px] font-semibold text-risk-fg">
            {x(M.careers_profile_delete_title)}
          </h2>
          <p className="mt-[6px] mb-[14px] text-[13px] leading-[1.5] text-text-muted">
            {x(M.careers_profile_delete_body)}
          </p>
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={deleting}
            className="flex cursor-pointer items-center gap-[7px] rounded-[8px] border-none bg-risk-fg px-[14px] py-[8px] text-[13px] font-semibold text-white disabled:cursor-default disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
            )}
            {x(M.careers_profile_delete_action)}
          </button>
        </div>
      )}
    </div>
  )
}
