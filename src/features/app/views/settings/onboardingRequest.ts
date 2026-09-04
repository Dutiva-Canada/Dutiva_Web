import type { OnboardingEntitlement } from '@/config/planEntitlements'
import type { ResponseMethod, SupportCategory } from '@/config/support'
import type { Bi } from '@/i18n/core'

/** Prefill for Growth/Pro onboarding request → Support form. */
export interface OnboardingSupportPrefill {
  category: SupportCategory
  responseMethod: ResponseMethod
  subject: Bi
  description: Bi
  searchIntent: 'walkthrough' | 'onboarding-call'
}

export function onboardingSupportPrefill(
  onboarding: OnboardingEntitlement,
): OnboardingSupportPrefill | null {
  if (onboarding === 'none') return null
  if (onboarding === 'walkthrough_and_call') {
    return {
      category: 'sales',
      responseMethod: 'scheduled_call',
      searchIntent: 'onboarding-call',
      subject: {
        en: 'Schedule onboarding call',
        fr: 'Planifier un appel d’intégration', // [FR self-authored]
      },
      description: {
        en: 'I’d like to book the included Professional onboarding call for our workspace.',
        fr: 'Je souhaite réserver l’appel d’intégration inclus dans le forfait Professionnel pour notre espace de travail.', // [FR self-authored]
      },
    }
  }
  return {
    category: 'sales',
    responseMethod: 'email',
    searchIntent: 'walkthrough',
    subject: {
      en: 'Request onboarding walkthrough',
      fr: 'Demander une démonstration d’intégration', // [FR self-authored]
    },
    description: {
      en: 'I’d like an onboarding walkthrough for our Growth plan workspace.',
      fr: 'Je souhaite une démonstration d’intégration pour notre espace de travail au forfait Croissance.', // [FR self-authored]
    },
  }
}

export function onboardingSupportPath(onboarding: OnboardingEntitlement): string | null {
  const prefill = onboardingSupportPrefill(onboarding)
  if (!prefill) return null
  return `/app/support?intent=${prefill.searchIntent}`
}
