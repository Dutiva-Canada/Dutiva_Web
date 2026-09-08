import { bi } from '@/i18n/core'
import type {
  CommsInitiative,
  CommsSegment,
  CommsSegmentMembership,
  CommsWorkspaceState,
} from './types'

/**
 * Demo fixtures for the communications workspace, including the bilingual SMB
 * product-launch pilot scenario and a separate policy-consultation file.
 *
 * [FR self-authored for fixture copy; not from a design handoff.]
 */

const productLaunch: CommsInitiative = {
  id: 'init-1',
  title: bi('Bilingual product launch', 'Lancement de produit bilingue'),
  type: 'campaign',
  domain: 'imc',
  owner: 'Riley Summers',
  audience: bi(
    'Prospective employers in Ontario and Quebec',
    'Employeurs potentiels en Ontario et au Québec',
  ),
  intendedOutcome: bi(
    'Generate qualified registrations for the Dutiva communications workspace preview.',
    'Générer des inscriptions qualifiées pour l’aperçu de l’espace de travail Communications de Dutiva.',
  ),
  baseline: '0',
  target: '50',
  startDate: '2026-09-01',
  endDate: '2026-10-31',
  risk: 'medium',
  budget: 2500,
  currency: 'CAD',
  status: 'active',
}

const policyConsultation: CommsInitiative = {
  id: 'init-2',
  title: bi('Federal AI-in-HR consultation', 'Consultation fédérale sur l’IA en RH'),
  type: 'policy_consultation',
  domain: 'public_affairs',
  owner: 'Alex Dubois',
  audience: bi(
    'Policy staff and stakeholder coalitions',
    'Personnel politique et coalitions de parties prenantes',
  ),
  intendedOutcome: bi(
    'Record an informed, reviewable public-affairs position without a sales objective.',
    'Consigner une position en matière d’affaires publiques, éclairée et révisable, sans objectif de vente.',
  ),
  startDate: '2026-08-15',
  endDate: '2026-09-30',
  risk: 'low',
  status: 'active',
}

const hrHandoffIssue: CommsInitiative = {
  id: 'init-3',
  title: bi(
    'Workplace conduct review — communications hold',
    'Examen de conduite au travail — suspension des communications',
  ),
  type: 'issue_response',
  domain: 'corporate',
  owner: 'Riley Summers',
  audience: bi('Internal employees only', 'Employés internes seulement'),
  intendedOutcome: bi(
    'Coordinate a restricted response using only the redacted HR summary.',
    'Coordonner une réponse restreinte en utilisant uniquement le résumé RH expurgé.',
  ),
  startDate: '2026-09-05',
  risk: 'high',
  status: 'active',
}

const tier1Media: CommsSegment = {
  id: 'segment-1',
  name: bi('Tier-1 Media', 'Médias de premier plan'),
  description: bi(
    'National and trade outlets that should receive embargoed pitches.',
    'Médias nationaux et spécialisés qui doivent recevoir des sollicitations sous embargo.',
  ),
}

const bilingualCreators: CommsSegment = {
  id: 'segment-2',
  name: bi('Bilingual Creators', 'Créateurs bilingues'),
  description: bi(
    'Creators who publish in both English and French.',
    'Créateurs qui publient en anglais et en français.',
  ),
}

const tier1MediaSamira: CommsSegmentMembership = {
  id: 'membership-1',
  segmentId: 'segment-1',
  contactId: 'contact-1',
}

const bilingualCreatorsPriya: CommsSegmentMembership = {
  id: 'membership-2',
  segmentId: 'segment-2',
  contactId: 'contact-3',
}

export const initialCommsState: CommsWorkspaceState = {
  initiatives: [productLaunch, policyConsultation, hrHandoffIssue],
  objectives: [
    {
      id: 'obj-1',
      initiativeId: 'init-1',
      label: bi('Qualified registrations', 'Inscriptions qualifiées'),
      baseline: '0',
      target: '50',
      period: bi('Launch window (Sep–Oct 2026)', 'Période de lancement (sept.–oct. 2026)'),
      owner: 'Riley Summers',
      evidenceSource: bi('Website sign-up form', 'Formulaire d’inscription sur le site Web'),
    },
  ],
  contentItems: [
    {
      id: 'content-1',
      initiativeId: 'init-1',
      title: bi('English launch announcement', 'Annonce de lancement en anglais'),
      language: 'en',
      channel: 'email',
      status: 'approved',
      deliveryStatus: 'scheduled',
      dueDate: '2026-09-08',
      scheduledFor: '2026-09-08T09:00:00-04:00',
      timeZone: 'America/Toronto',
      owner: 'Riley Summers',
      body: bi(
        'We’re opening early access to Dutiva’s new communications workspace for Canadian teams.',
        'Nous ouvrons l’accès anticipé au nouvel espace de travail Communications de Dutiva pour les équipes canadiennes.',
      ),
      revisionNote: bi('Approved for English audience.', 'Approuvé pour le public anglophone.'),
    },
    {
      id: 'content-2',
      initiativeId: 'init-1',
      title: bi('French launch announcement', 'Annonce de lancement en français'),
      language: 'fr',
      channel: 'email',
      status: 'changes_requested',
      deliveryStatus: 'not_queued',
      dueDate: '2026-09-09',
      owner: 'Alex Dubois',
      body: bi(
        'French adaptation pending after English source revision.',
        'Adaptation française en attente après la révision de la source anglaise.',
      ),
      revisionNote: bi(
        'Marked for re-review because the English source changed.',
        'Marquée pour relecture parce que la source anglaise a changé.',
      ),
      needsTranslationReview: true,
    },
    {
      id: 'content-3',
      initiativeId: 'init-1',
      title: bi('LinkedIn launch post', 'Publication LinkedIn de lancement'),
      language: 'bilingual',
      channel: 'social_linkedin',
      status: 'in_review',
      deliveryStatus: 'not_queued',
      dueDate: '2026-09-10',
      owner: 'Jordan Lee',
      body: bi('English/French carrousel post.', 'Publication carrousel anglais/français.'),
    },
    {
      id: 'content-4',
      initiativeId: 'init-1',
      title: bi('Press pitch', 'Sollicitation médiatique'),
      language: 'en',
      channel: 'press_release',
      status: 'draft',
      deliveryStatus: 'not_queued',
      dueDate: '2026-09-12',
      owner: 'Riley Summers',
      body: bi(
        'Pitch to Canadian HR trade media.',
        'Sollicitation des médias spécialisés canadiens en RH.',
      ),
    },
    {
      id: 'content-5',
      initiativeId: 'init-1',
      title: bi('Newsletter draft', 'Brouillon de bulletin'),
      language: 'en',
      channel: 'newsletter',
      status: 'draft',
      deliveryStatus: 'not_queued',
      dueDate: '2026-09-11',
      owner: 'Morgan Patel',
      body: bi(
        'Launch-week edition for the waitlist.',
        'Édition de la semaine du lancement pour la liste d’attente.',
      ),
    },
    {
      id: 'content-6',
      initiativeId: 'init-2',
      title: bi('Briefing note', 'Note de breffage'),
      language: 'bilingual',
      channel: 'meeting',
      status: 'approved',
      deliveryStatus: 'ready',
      dueDate: '2026-09-15',
      timeZone: 'America/Toronto',
      owner: 'Alex Dubois',
      body: bi(
        'Key arguments and evidence links for coalition meetings.',
        'Arguments clés et liens probants pour les réunions de coalition.',
      ),
    },
  ],
  contacts: [
    {
      id: 'contact-1',
      name: 'Samira Okonkwo',
      type: 'media',
      role: bi('Editor, Canadian HR Reporter', 'Rédactrice, Canadian HR Reporter'),
      purpose: bi(
        'Press pitch and coverage follow-up',
        'Sollicitation médiatique et suivi de couverture',
      ),
      channelPreference: bi('Email', 'Courriel'),
      active: true,
    },
    {
      id: 'contact-2',
      name: 'Leo Tremblay',
      type: 'institutional',
      role: bi('Policy Advisor, Innovation Canada', 'Conseiller politique, Innovation Canada'),
      purpose: bi(
        'AI-in-HR consultation stakeholder',
        'Partie prenante à la consultation sur l’IA en RH',
      ),
      channelPreference: bi('Email and meetings', 'Courriel et réunions'),
      active: true,
    },
    {
      id: 'contact-3',
      name: 'Priya Desai',
      type: 'creator',
      role: bi('HR technology reviewer', 'Critique de technologies RH'),
      purpose: bi('Product review and disclosure', 'Évaluation de produit et divulgation'),
      channelPreference: bi('Social DM', 'Message privé sur les réseaux'),
      active: true,
    },
  ],
  organizations: [
    {
      id: 'org-1',
      name: 'Canadian HR Reporter',
      type: bi('Trade publication', 'Publication spécialisée'),
      jurisdiction: bi('National', 'Nationale'),
    },
    {
      id: 'org-2',
      name: 'Innovation, Science and Economic Development Canada',
      type: bi('Federal authority', 'Autorité fédérale'),
      jurisdiction: bi('Federal', 'Fédéral'),
    },
  ],
  interactions: [
    {
      id: 'interaction-1',
      initiativeId: 'init-1',
      contactId: 'contact-1',
      type: 'inquiry',
      source: bi('Email to press@dutiva.ca', 'Courriel à presse@dutiva.ca'),
      visibility: 'internal',
      summary: bi(
        'Samira asked for embargo timing and spokesperson availability.',
        'Samira a demandé le calendrier de l’embargo et la disponibilité d’un porte-parole.',
      ),
      responseTarget: '2026-09-07T17:00:00-04:00',
      owner: 'Riley Summers',
      status: 'open',
    },
    {
      id: 'interaction-2',
      initiativeId: 'init-2',
      contactId: 'contact-2',
      type: 'meeting',
      source: bi('Coalition briefing call', 'Appel de breffage de la coalition'),
      visibility: 'internal',
      summary: bi(
        'Discussed scope of submission; no lobbying obligation triggered at this stage.',
        'Discussion sur la portée de la soumission; aucune obligation de lobbying déclenchée à ce stade.',
      ),
      owner: 'Alex Dubois',
      status: 'responded',
    },
  ],
  policyFiles: [
    {
      id: 'policy-1',
      initiativeId: 'init-2',
      jurisdiction: bi('Federal', 'Fédéral'),
      authority: bi(
        'Innovation, Science and Economic Development Canada',
        'Innovation, Sciences et Développement économique Canada',
      ),
      objective: bi(
        'Comment on proposed AI guidance for employers.',
        'Commenter l’orientation proposée sur l’IA pour les employeurs.',
      ),
      sourceUrl: 'https://ised-isde.canada.ca/',
      stage: 'consultation_open',
      deadline: '2026-09-30',
      owner: 'Alex Dubois',
    },
  ],
  issues: [
    {
      id: 'issue-1',
      initiativeId: 'init-3',
      title: bi('HR handoff — conduct review', 'Transmission RH — examen de conduite'),
      severity: 'high',
      status: 'open',
      lead: 'Riley Summers',
      spokesperson: 'Martin Constantineau',
      affectedChannels: ['email', 'intranet'],
      restricted: true,
      summary: bi(
        'Restricted issue created from a redacted HR handoff. The communications team cannot open the underlying HR case.',
        'Enjeu restreint créé à partir d’une transmission RH expurgée. L’équipe Communications ne peut pas ouvrir le dossier RH sous-jacent.',
      ),
    },
  ],
  sources: [
    {
      id: 'source-1',
      initiativeId: 'init-2',
      sourceType: 'official_notice',
      publisher: bi('ISED — consultation notice', 'ISED — avis de consultation'),
      publishedDate: '2026-08-01',
      retrievedAt: '2026-09-01T10:00:00Z',
      jurisdiction: bi('Federal', 'Fédéral'),
      classification: bi('Official notice', 'Avis officiel'),
      supports: bi('Deadline and scope of submission', 'Échéancier et portée de la soumission'),
    },
    {
      id: 'source-2',
      initiativeId: 'init-1',
      sourceType: 'internal',
      publisher: bi('Internal messaging review', 'Examen de la messagerie interne'),
      publishedDate: '2026-09-04',
      jurisdiction: bi('Internal', 'Interne'),
      classification: bi('Internal evidence', 'Preuve interne'),
      supports: bi(
        'Claim rejected: needs substantiation before use in public copy.',
        'Revendication rejetée : justification requise avant usage dans le texte public.',
      ),
    },
    {
      id: 'source-3',
      initiativeId: 'init-1',
      sourceType: 'news',
      publisher: bi('Canadian HR Reporter', 'Canadian HR Reporter'),
      publishedDate: '2026-09-06',
      retrievedAt: '2026-09-06T12:00:00Z',
      jurisdiction: bi('National', 'Nationale'),
      classification: bi('Trade coverage', 'Couverture spécialisée'),
      supports: bi(
        'Early launch-week mention — reach not verified.',
        'Mention précoce de la semaine du lancement — portée non vérifiée.',
      ),
    },
    {
      id: 'source-4',
      initiativeId: 'init-2',
      sourceType: 'partner',
      publisher: bi(
        'Coalition for Ethical AI in Employment',
        'Coalition pour une IA éthique en emploi',
      ),
      publishedDate: '2026-09-03',
      retrievedAt: '2026-09-04T09:30:00Z',
      jurisdiction: bi('Federal', 'Fédéral'),
      classification: bi('Stakeholder position', 'Position de partie prenante'),
      supports: bi(
        'Context for coalition submission.',
        'Contexte pour la soumission de la coalition.',
      ),
    },
  ],
  feeds: [
    {
      id: 'feed-1',
      url: 'https://www.canada.ca/en/news/web-feeds.atom',
      label: bi('Government of Canada news', 'Nouvelles du gouvernement du Canada'),
      sourceType: 'official_notice',
      enabled: false,
      format: 'auto',
      lastFetchMessage: 'Ready to sync when enabled.',
    },
  ],
  coverageItems: [
    {
      id: 'coverage-1',
      initiativeId: 'init-1',
      sourceId: 'source-3',
      outlet: bi('Canadian HR Reporter', 'Canadian HR Reporter'),
      headline: bi(
        'Dutiva previews communications workspace for Canadian teams',
        'Dutiva dévoile un aperçu de son espace de travail Communications pour les équipes canadiennes',
      ),
      language: 'en',
      publishedDate: '2026-09-06',
      url: 'https://www.hrreporter.com/example-article',
      reach: 4200,
      sentiment: 'neutral',
      provenance: 'manual',
      owner: 'Riley Summers',
      notes: bi(
        'Reach is an estimate from the outlet kit.',
        'La portée est une estimation tirée du kit du média.',
      ),
    },
    {
      id: 'coverage-2',
      initiativeId: 'init-1',
      outlet: bi('LinkedIn', 'LinkedIn'),
      headline: bi(
        'Bilingual product-launch discussion',
        'Discussion sur le lancement bilingue du produit',
      ),
      language: 'bilingual',
      publishedDate: '2026-09-07',
      reach: 180,
      sentiment: 'positive',
      provenance: 'manual',
      owner: 'Jordan Lee',
      notes: bi(
        'Engagement only; reach is not de-duplicated across platforms.',
        'Engagement seulement; la portée n’est pas dédupliquée entre les plateformes.',
      ),
    },
  ],
  submissions: [
    {
      id: 'submission-1',
      initiativeId: 'init-2',
      policyFileId: 'policy-1',
      authority: bi(
        'Innovation, Science and Economic Development Canada',
        'Innovation, Sciences et Développement économique Canada',
      ),
      deadline: '2026-09-30',
      method: bi('Online consultation portal', 'Portail de consultation en ligne'),
      owner: 'Alex Dubois',
      status: 'planned',
    },
  ],
  metrics: [
    {
      id: 'metric-1',
      initiativeId: 'init-1',
      name: bi('Qualified registrations', 'Inscriptions qualifiées'),
      value: 12,
      target: 50,
      period: bi('As of 5 Sep 2026', 'Au 5 sept. 2026'),
      provenance: 'manual',
      owner: 'Riley Summers',
    },
    {
      id: 'metric-2',
      initiativeId: 'init-1',
      name: bi('Press mentions', 'Mentions dans les médias'),
      value: 0,
      target: 3,
      period: bi('Launch window', 'Période de lancement'),
      provenance: 'manual',
      owner: 'Riley Summers',
    },
  ],
  approvals: [
    {
      id: 'approval-1',
      contentItemId: 'content-1',
      approver: 'Riley Summers',
      decision: 'approved',
      decidedAt: '2026-09-06T14:00:00Z',
    },
    {
      id: 'approval-2',
      contentItemId: 'content-6',
      approver: 'Alex Dubois',
      decision: 'approved',
      decidedAt: '2026-09-05T10:00:00Z',
    },
  ],
  brandClaims: [
    {
      id: 'claim-1',
      text: bi(
        'Dutiva Communications helps Canadian teams plan, review, and coordinate messages across channels.',
        'Dutiva Communications aide les équipes canadiennes à planifier, réviser et coordonner des messages sur plusieurs canaux.',
      ),
      evidence: bi('Product scope document v0.1', 'Document de portée du produit v0.1'),
      owner: 'Riley Summers',
      reviewDate: '2026-12-01',
      status: 'active',
    },
    {
      id: 'claim-2',
      text: bi(
        'Cut communication review time by 50%.',
        'Réduisez de 50 % le temps de révision des communications.',
      ),
      evidence: bi('Pending pilot measurement', 'Mesure pilote en attente'),
      owner: 'Riley Summers',
      status: 'rejected',
    },
  ],
  usageControls: {},
  integrations: [],
  executionEvents: [],
  segments: [tier1Media, bilingualCreators],
  segmentMemberships: [tier1MediaSamira, bilingualCreatorsPriya],
}
