import { defineMessages } from '../core'

/**
 * /templates — the marketing template-library preview linked from the
 * landing page's Product section ("Browse all templates"). Chrome copy
 * only; the catalogue itself renders the real product data
 * (`src/features/app/documents/data`) so this page can never drift out of
 * sync with what Document Studio actually ships.
 */
export const templatesPreviewMessages = defineMessages({
  tplPreview_eyebrow: {
    en: 'Document templates',
    fr: 'Modèles de documents',
  },
  tplPreview_h1: {
    en: 'Canadian HR templates, ready to generate.',
    fr: 'Des modèles RH canadiens, prêts à générer.',
  },
  tplPreview_intro: {
    en: 'A growing library of employer-side templates — offers, agreements, policies, discipline, and termination — each jurisdiction-aware for Ontario, Quebec, and Federal workplaces.',
    fr: 'Une bibliothèque grandissante de modèles pour employeurs — offres, ententes, politiques, discipline et cessation — chacun adapté aux règles de l’Ontario, du Québec et du régime fédéral.',
  },
  /* SEO meta only — page hero keeps the longer tplPreview_intro. */
  tplPreview_meta_description: {
    en: 'Browse jurisdiction-aware HR templates for Ontario, Quebec, and federal workplaces — hiring, policies, discipline, and termination from Dutiva.',
    fr: 'Parcourez les modèles RH adaptés à l’Ontario, au Québec et au fédéral — embauche, politiques, discipline et cessation d’emploi avec Dutiva.',
  },
  tplPreview_count: {
    en: 'templates',
    fr: 'modèles',
  },
  tplPreview_jurisdictions: {
    en: 'Jurisdictions',
    fr: 'Juridictions',
  },
  tplPreview_cta_t: {
    en: 'Generate your first document.',
    fr: 'Générez votre premier document.',
  },
  tplPreview_cta_p: {
    en: 'Sign in to open Document Studio and start from any template above.',
    fr: 'Connectez-vous pour ouvrir le Studio de documents et démarrer à partir de n’importe quel modèle ci-dessus.',
  },
  tplPreview_cta_btn: {
    en: 'See plans',
    fr: 'Voir les forfaits',
  },
  tplPreview_samples_title: {
    en: 'Sample outputs',
    fr: 'Exemples de sortie',
  },
  tplPreview_samples_intro: {
    en: 'Pick a template to see a rendered preview — the same output Document Studio generates after you sign in.',
    fr: 'Choisissez un modèle pour voir un aperçu rendu — la même sortie que le Studio de documents génère après connexion.',
  },
  tplPreview_show_sample: {
    en: 'Preview sample',
    fr: 'Aperçu du modèle',
  },
  tplPreview_close_sample: {
    en: 'Close preview',
    fr: 'Fermer l’aperçu',
  },
  tplPreview_sample_note: {
    en: 'Sample preview with demo answers — sign in to generate your own.',
    fr: 'Aperçu type avec réponses de démonstration — connectez-vous pour générer le vôtre.',
  },
})
