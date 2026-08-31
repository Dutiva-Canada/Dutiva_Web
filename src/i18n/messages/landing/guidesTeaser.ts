import { defineMessages } from '../../core'

export const landingGuidesTeaser = defineMessages({
  landing_guides_badge: {
    en: 'Guides',
    fr: 'Guides',
  },
  landing_guides_title: {
    en: 'Canadian HR compliance guides.',
    fr: 'Guides de conformité RH canadienne.',
  },
  /* Deliberately describes the guides' half of the editorial split (documents
     and decisions), not the blog's (which obligations apply). This string used
     to paraphrase `blog_intro` almost exactly, which made the landing teaser,
     /guides and /blog all read as the same promise. See
     `features/marketing/articles/articleModel.ts`. */
  landing_guides_sub: {
    en: 'Plain-language explainers on the documents and decisions Canadian employers have to get right — contracts, probation, accommodation, and termination.',
    fr: 'Des explications en langage clair sur les documents et les décisions que les employeurs canadiens doivent réussir — contrats, probation, accommodement et cessation d’emploi.',
  },
  landing_guides_browse: {
    en: 'Browse all guides',
    fr: 'Parcourir tous les guides',
  },
  /* Names what the blog is for rather than where it is: an unqualified "Visit
     the blog" next to six guide cards gave a reader no reason to click. */
  landing_guides_blog: {
    en: 'Blog: what applies to your workplace',
    fr: 'Blogue : ce qui s’applique à votre entreprise',
  },
})
