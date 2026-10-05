import type { Lang } from '@/i18n/core'
import type { PolicyEdition } from '@/features/marketing/legal/policyContent'

/**
 * Health wellness notice — a health-specific policy edition in the same
 * shape the marketing legal collection renders (PolicyEdition), so the
 * standalone /health/legal/wellness page reuses the same article renderer
 * as the shared Terms and Privacy documents.
 *
 * The substance is mandated, not editorial: Dutiva Health is a self-tracking
 * and reflection tool — not medical or mental-health advice, diagnosis,
 * treatment, therapy, or a crisis service; journal contents are private to
 * the user; nothing the user writes is monitored by a person, and no entry
 * triggers an alert. The in-app assistant answers chat messages as software
 * — it is not a person and not a crisis service.
 *
 * [FR self-authored — parity with the EN text; hedge strength matched.]
 */
export const healthWellnessNotice: Record<Lang, PolicyEdition> = {
  en: {
    title: 'Wellness notice',
    effectiveDate: 'October 4, 2026',
    callout: [
      'Dutiva Health is a self-tracking and reflection tool. It does not provide medical or mental-health advice, diagnosis, or treatment, and it is not a crisis service.',
      'In crisis or thinking about suicide? Call or text 9-8-8 (Canada, 24/7) — or 911 if you’re in immediate danger.',
    ],
    sections: [
      {
        title: '1. What Dutiva Health is',
        blocks: [
          {
            type: 'p',
            text: 'Dutiva Health lets you record daily check-ins (mood and energy), keep a private journal, track small habits, and view simple counts and averages of what you recorded. It is a reflection tool you operate yourself.',
          },
          {
            type: 'p',
            text: 'An in-app assistant can answer questions about your own tracked data and record things you ask it to (a check-in, a habit marked done, a journal entry). Its replies are generated from the same counts and averages you can see — they are observations about your inputs, not assessments of your health.',
          },
        ],
      },
      {
        title: '2. What Dutiva Health is not',
        blocks: [
          {
            type: 'p',
            text: 'Dutiva is not a licensed health-care provider, and Dutiva Health is not a medical device or a health-care service. In particular:',
          },
          { type: 'li', text: 'it does not diagnose any condition;' },
          { type: 'li', text: 'it does not provide therapy, counselling, or treatment;' },
          {
            type: 'li',
            text: 'it does not monitor you or check on your wellbeing between your own visits;',
          },
          { type: 'li', text: 'it cannot detect or respond to an emergency.' },
          {
            type: 'p',
            text: 'Nothing in the app is a substitute for care from a qualified professional. If something you notice in your check-ins concerns you, bring it to your doctor or a mental-health professional.',
          },
        ],
      },
      {
        title: '3. Crisis support',
        blocks: [
          {
            type: 'p',
            text: 'Nobody monitors what you write in the app, and nothing you write triggers an alert to a person — including entries about feeling unsafe or thinking about suicide. The in-app assistant is software: it can reply to a chat message with supportive words and the crisis line below, but it is not a crisis service and it cannot help in an emergency.',
          },
          {
            type: 'p',
            text: 'If you are in crisis or thinking about suicide, call or text 9-8-8 — Canada’s suicide crisis helpline, free, confidential, bilingual, and available 24/7. If you or someone near you is in immediate danger, call 911.',
          },
        ],
      },
      {
        title: '4. Your data',
        blocks: [
          {
            type: 'p',
            text: 'Check-ins, journal entries, habits, and chat messages are stored in your account and readable only by you. What you record may be sensitive — write what you choose, and you can delete entries or clear the conversation at any time.',
          },
          {
            type: 'p',
            text: 'The Privacy policy describes how personal information is collected, used, and retained across Dutiva services.',
          },
        ],
      },
    ],
  },
  fr: {
    title: 'Avis de bien-être',
    effectiveDate: '4 octobre 2026',
    callout: [
      'Dutiva Santé est un outil d’autosurveillance et de réflexion. Il n’offre ni conseil médical ou en santé mentale, ni diagnostic, ni traitement, et ce n’est pas un service de crise.',
      'En crise ou si vous pensez au suicide? Appelez ou textez le 9-8-8 (Canada, 24/7) — ou le 911 en cas de danger immédiat.',
    ],
    sections: [
      {
        title: '1. Ce qu’est Dutiva Santé',
        blocks: [
          {
            type: 'p',
            text: 'Dutiva Santé vous permet de noter des points du jour (humeur et énergie), de tenir un journal privé, de suivre de petites habitudes et de voir de simples décomptes et moyennes de ce que vous avez noté. C’est un outil de réflexion que vous utilisez vous-même.',
          },
          {
            type: 'p',
            text: 'Un assistant intégré peut répondre à des questions sur vos propres données suivies et enregistrer ce que vous lui demandez (un point du jour, une habitude faite, une entrée de journal). Ses réponses sont générées à partir des mêmes décomptes et moyennes que vous voyez — ce sont des observations sur vos saisies, pas une évaluation de votre santé.',
          },
        ],
      },
      {
        title: '2. Ce que Dutiva Santé n’est pas',
        blocks: [
          {
            type: 'p',
            text: 'Dutiva n’est pas un fournisseur de soins de santé agréé, et Dutiva Santé n’est ni un appareil médical ni un service de soins de santé. Plus précisément :',
          },
          { type: 'li', text: 'il ne pose aucun diagnostic;' },
          { type: 'li', text: 'il n’offre ni thérapie, ni counselling, ni traitement;' },
          {
            type: 'li',
            text: 'il ne vous surveille pas et ne prend pas de vos nouvelles entre vos visites;',
          },
          { type: 'li', text: 'il ne peut ni détecter ni gérer une urgence.' },
          {
            type: 'p',
            text: 'Rien dans l’application ne remplace les soins d’un professionnel qualifié. Si quelque chose dans vos points du jour vous préoccupe, parlez-en à votre médecin ou à un professionnel de la santé mentale.',
          },
        ],
      },
      {
        title: '3. Soutien en cas de crise',
        blocks: [
          {
            type: 'p',
            text: 'Personne ne surveille ce que vous écrivez dans l’application, et rien de ce que vous écrivez ne déclenche d’alerte vers une personne — y compris les entrées où vous ne vous sentez pas en sécurité ou pensez au suicide. L’assistant intégré est un logiciel : il peut répondre à un message de clavardage avec des mots de soutien et la ligne de crise ci-dessous, mais ce n’est pas un service de crise et il ne peut pas intervenir en cas d’urgence.',
          },
          {
            type: 'p',
            text: 'Si vous êtes en crise ou pensez au suicide, appelez ou textez le 9-8-8 — la ligne d’aide en cas de crise suicide au Canada, gratuite, confidentielle, bilingue et ouverte 24/7. Si vous ou une personne près de vous êtes en danger immédiat, appelez le 911.',
          },
        ],
      },
      {
        title: '4. Vos données',
        blocks: [
          {
            type: 'p',
            text: 'Vos points du jour, vos entrées de journal, vos habitudes et vos messages de clavardage sont conservés dans votre compte et ne sont lisibles que par vous. Ce que vous notez peut être sensible — écrivez ce que vous choisissez, et vous pouvez supprimer des entrées ou effacer la discussion en tout temps.',
          },
          {
            type: 'p',
            text: 'La politique de confidentialité décrit comment les renseignements personnels sont recueillis, utilisés et conservés dans l’ensemble des services Dutiva.',
          },
        ],
      },
    ],
  },
}
