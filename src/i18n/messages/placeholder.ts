import { defineMessages } from '../core'

/**
 * Generic placeholder copy for workspace modules that are routed but not yet
 * implemented. Kept minimal; each module will replace this with its own
 * catalogue as it ships.
 */
export const placeholderMessages = defineMessages({
  placeholder_title: { en: 'Not available yet', fr: 'Pas encore disponible' }, // [FR self-authored]
  placeholder_message: {
    en: 'This workspace is being built. It will be available in a coming update.',
    fr: 'Cet espace de travail est en construction. Il sera disponible dans une prochaine mise à jour.',
  }, // [FR self-authored]
  placeholder_back_home: { en: 'Back to Home', fr: 'Retour à l’accueil' }, // [FR self-authored]
})
