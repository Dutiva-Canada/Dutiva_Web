import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'

/**
 * Hiring module — evidence-based recruitment system
 * 
 * Implements the AI-resistant hiring funnel described in the feature spec:
 * 1. Easy application collection
 * 2. Evidence screening (AI-extracted structured data)
 * 3. Work sample assessments (20-45 min, AI-allowed)
 * 4. Defense conversations (deep-dive interviews)
 * 5. Five-score authenticity evaluation
 * 
 * Funnel stages: application → basic_qualified → evidence_qualified → work_sample → interview → hired
 */

/* ── Candidate & Application ─────────────────────────────────────────────── */

export type CandidateStatus = 
  | 'application' 
  | 'basic_qualified' 
  | 'evidence_qualified' 
  | 'work_sample' 
  | 'interview' 
  | 'hired' 
  | 'rejected'

export type WorkAuthorization = 'authorized' | 'needs_sponsorship' | 'unknown'

export interface Candidate {
  /** Stable id, usable in /app/hiring/candidates/:candidateId */
  id: string
  name: string
  email: string
  phone?: string
  location: Bi
  /** LinkedIn profile URL or resume attachment */
  resume: string
  /** LinkedIn URL if provided */
  linkedIn?: string
  /** Job position applied for */
  position: Bi
  /** Current/most recent role */
  currentRole: Bi
  /** Years of relevant experience */
  yearsExperience: number
  /** Work authorization status */
  workAuthorization: WorkAuthorization
  /** Compensation expectations (optional) */
  compensationExpectations?: string
  /** Current funnel stage */
  status: CandidateStatus
  /** When application was received */
  appliedDate: string
  /** ISO date for sorting */
  appliedISO: string
  /** Recruiter/hiring manager assigned */
  assignedTo?: string
  /** Key qualifications/requirements match */
  knockoutCriteria: KnockoutCriteria
}

export interface KnockoutCriteria {
  /** Meets basic requirements */
  meetsRequirements: boolean
  /** Required qualifications present */
  requiredQualifications: string[]
  /** Missing deal-breaker requirements */
  missingRequirements: string[]
}

/* ── Evidence Screening (AI-extracted structured data) ───────────────────── */

export type EvidenceQuality = 'high' | 'medium' | 'low' | 'generic'

export interface EvidenceScreening {
  candidateId: string
  /** AI-extracted relevant experience claims */
  relevantExperience: ExperienceClaim[]
  /** Scope and complexity of problems handled */
  scope: ScopeAssessment
  /** Quantifiable results with evidence */
  outcomes: OutcomeClaim[]
  /** Demonstrated skills vs claimed */
  skills: SkillClaim[]
  /** Career trajectory analysis */
  careerTrajectory: CareerTrajectory
  /** Domain knowledge assessment */
  domainKnowledge: DomainKnowledge
  /** Overall evidence quality score */
  evidenceQuality: EvidenceQuality
  /** Confidence in the assessment */
  confidence: 'high' | 'medium' | 'low'
  /** Missing information that would improve assessment */
  missingInfo: string[]
}

export interface ExperienceClaim {
  claim: Bi
  evidence: Bi
  confidence: 'high' | 'medium' | 'low'
  /** Specific examples vs generic claims */
  specificity: 'specific' | 'moderate' | 'generic'
  missingInfo?: string
}

export interface ScopeAssessment {
  /** Size of teams/projects managed */
  teamSize: string
  /** Budget/impact scale */
  scale: Bi
  /** Complexity of problems handled */
  complexity: Bi
  confidence: 'high' | 'medium' | 'low'
}

export interface OutcomeClaim {
  claim: Bi
  evidence: Bi
  /** Quantifiable metrics */
  metrics?: string[]
  confidence: 'high' | 'medium' | 'low'
  /** Individual vs team contribution clarity */
  contributionClarity: 'clear' | 'unclear' | 'mixed'
}

export interface SkillClaim {
  skill: Bi
  demonstrated: boolean
  evidence: Bi
  proficiency: 'expert' | 'advanced' | 'intermediate' | 'beginner'
}

export interface CareerTrajectory {
  /** Shows increasing responsibility */
  progression: 'strong' | 'moderate' | 'flat' | 'declining'
  evidence: Bi
  /** Learning and growth indicators */
  learning: Bi
  confidence: 'high' | 'medium' | 'low'
}

export interface DomainKnowledge {
  domain: Bi
  level: 'expert' | 'advanced' | 'intermediate' | 'beginner'
  evidence: Bi
  confidence: 'high' | 'medium' | 'low'
}

/* ── Work Sample Assessment ───────────────────────────────────────────────── */

export type AssessmentType = 'product_manager' | 'sales' | 'engineer' | 'marketer' | 'general'

export type AssessmentStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface WorkSampleAssessment {
  id: string
  candidateId: string
  /** Type of assessment based on role */
  assessmentType: AssessmentType
  /** The problem/scenario presented */
  scenario: Bi
  /** Candidate's submission */
  submission: Bi
  /** Whether AI tools were allowed (should be true) */
  aiAllowed: boolean
  /** Whether AI was detected in submission */
  aiDetected: boolean
  /** Time taken to complete */
  timeTaken?: string
  /** Assessment status */
  status: AssessmentStatus
  /** Assigned evaluator */
  evaluator?: string
  /** Evaluation results */
  evaluation?: AssessmentEvaluation
  /** When assigned */
  assignedDate: string
  /** When completed */
  completedDate?: string
}

export interface AssessmentEvaluation {
  /** Quality of the work product */
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  /** Approach and methodology */
  approach: Bi
  /** Use of AI tools (if applicable) */
  aiUsage: Bi
  /** Overall capability assessment */
  capability: 'high' | 'medium' | 'low'
  /** Specific feedback */
  feedback: Bi
  /** Recommendation for next stage */
  recommendation: 'advance' | 'hold' | 'reject'
}

/* ── Interview & Defense Conversation ─────────────────────────────────────── */

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled'

export interface DefenseInterview {
  id: string
  candidateId: string
  workSampleId: string
  /** Interview format */
  format: 'defend_work' | 'technical_deep_dive' | 'behavioral'
  /** Scheduled date/time */
  scheduledDate: string
  /** Interviewer(s) */
  interviewers: string[]
  /** Status */
  status: InterviewStatus
  /** Interview notes and responses */
  conversation: InterviewConversation[]
  /** Final assessment */
  assessment?: InterviewAssessment
}

export interface InterviewConversation {
  /** Question asked */
  question: Bi
  /** Candidate's response */
  response: Bi
  /** Depth of understanding demonstrated */
  depth: 'deep' | 'moderate' | 'shallow' | 'evasive'
  /** Ability to explain decisions */
  reasoning: 'strong' | 'moderate' | 'weak'
  /** Alternative approaches considered */
  alternatives: Bi
  /** Confidence level in response */
  confidence: 'high' | 'medium' | 'low'
}

export interface InterviewAssessment {
  /** Overall reasoning capability */
  reasoningCapability: 'strong' | 'moderate' | 'weak'
  /** Ability to defend their work */
  defenseAbility: 'strong' | 'moderate' | 'weak'
  /** Depth of domain knowledge */
  knowledgeDepth: 'deep' | 'moderate' | 'shallow'
  /** Communication clarity */
  communication: 'clear' | 'moderate' | 'unclear'
  /** Authenticity score based on consistency */
  authenticity: 'high' | 'medium' | 'low'
  /** Final recommendation */
  recommendation: 'hire' | 'strong_consider' | 'weak_consider' | 'reject'
  /** Key reasons for recommendation */
  reasons: Bi[]
}

/* ── Five-Score Authenticity Evaluation ───────────────────────────────────── */

export type ScoreLevel = 'high' | 'medium' | 'low' | 'insufficient'

export interface AuthenticityScores {
  candidateId: string
  /** Can they meet the basic requirements? */
  qualification: ScoreLevel
  /** Have they actually done similar things? */
  evidence: ScoreLevel
  /** Can they perform the work? */
  capability: ScoreLevel
  /** Can they explain and defend their decisions? */
  reasoning: ScoreLevel
  /** Do they actually want this job? */
  motivation: ScoreLevel
  /** Overall authenticity score */
  overall: 'high' | 'medium' | 'low'
  /** Explainable reasoning for each score */
  explanations: ScoreExplanation[]
  /** When scores were last updated */
  lastUpdated: string
}

export interface ScoreExplanation {
  dimension: 'qualification' | 'evidence' | 'capability' | 'reasoning' | 'motivation'
  score: ScoreLevel
  /** Job-related evidence for the score */
  evidence: Bi
  /** Confidence in this assessment */
  confidence: 'high' | 'medium' | 'low'
}

/* ── Funnel Analytics ───────────────────────────────────────────────────────── */

export interface FunnelMetrics {
  /** Total applications received */
  totalApplications: number
  /** Passed basic qualification screen */
  basicQualified: number
  /** Passed evidence screening */
  evidenceQualified: number
  /** Completed work samples */
  workSamples: number
  /** Completed interviews */
  interviews: number
  /** Final hires */
  hires: number
  /** Conversion rates between stages */
  conversionRates: {
    toBasicQualified: number
    toEvidenceQualified: number
    toWorkSample: number
    toInterview: number
    toHire: number
  }
  /** Time metrics */
  averageTimeToHire: string
  /** Stage duration averages */
  stageDurations: {
    application: string
    screening: string
    workSample: string
    interview: string
  }
}

/* ── Job Postings ───────────────────────────────────────────────────────── */

export interface JobPosting {
  id: string
  title: Bi
  department: Bi
  location: Bi
  type: Bi
  description: Bi
  requirements: Bi[]
  knockoutCriteria: string[]
  workSampleScenario: Bi
  status: 'active' | 'closed' | 'draft'
  postedDate: string
  closingDate?: string
}

/* ── Demo Fixtures ───────────────────────────────────────────────────────── */

export const demoCandidates: Candidate[] = [
  {
    id: 'c1',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    phone: '+1 (416) 555-0123',
    location: bi('Toronto, ON', 'Toronto, ON'),
    resume: 'sarah_chen_resume.pdf',
    linkedIn: 'linkedin.com/in/sarahchen',
    position: bi('Senior Product Manager', 'Gestionnaire de produit principal'),
    currentRole: bi('Product Manager', 'Gestionnaire de produit'),
    yearsExperience: 7,
    workAuthorization: 'authorized',
    compensationExpectations: '$130-150k',
    status: 'evidence_qualified',
    appliedDate: 'Aug 15, 2026',
    appliedISO: '2026-08-15',
    assignedTo: 'Riley Summers',
    knockoutCriteria: {
      meetsRequirements: true,
      requiredQualifications: ['5+ years PM experience', 'B2B SaaS experience', 'Data analysis skills'],
      missingRequirements: [],
    },
  },
  {
    id: 'c2',
    name: 'Marcus Johnson',
    email: 'marcus.j@example.com',
    location: bi('Vancouver, BC', 'Vancouver, BC'),
    resume: 'marcus_johnson_resume.pdf',
    linkedIn: 'linkedin.com/in/marcusjohnson',
    position: bi('Sales Representative', 'Représentant commercial'),
    currentRole: bi('Account Executive', 'Directeur de comptes'),
    yearsExperience: 4,
    workAuthorization: 'authorized',
    compensationExpectations: '$90-110k base + commission',
    status: 'work_sample',
    appliedDate: 'Aug 18, 2026',
    appliedISO: '2026-08-18',
    assignedTo: 'Riley Summers',
    knockoutCriteria: {
      meetsRequirements: true,
      requiredQualifications: ['3+ years B2B sales', 'CRM experience', 'Pipeline management'],
      missingRequirements: [],
    },
  },
  {
    id: 'c3',
    name: 'Emily Rodriguez',
    email: 'emily.r@example.com',
    location: bi('Montreal, QC', 'Montréal, QC'),
    resume: 'emily_rodriguez_resume.pdf',
    linkedIn: 'linkedin.com/in/emilyrodriguez',
    position: bi('Software Engineer', 'Ingénieure logiciel'),
    currentRole: bi('Full Stack Developer', 'Développeuse full stack'),
    yearsExperience: 5,
    workAuthorization: 'authorized',
    compensationExpectations: '$120-140k',
    status: 'interview',
    appliedDate: 'Aug 12, 2026',
    appliedISO: '2026-08-12',
    assignedTo: 'Riley Summers',
    knockoutCriteria: {
      meetsRequirements: true,
      requiredQualifications: ['4+ years development', 'React/TypeScript', 'API development'],
      missingRequirements: [],
    },
  },
  {
    id: 'c4',
    name: 'David Kim',
    email: 'david.kim@example.com',
    location: bi('Calgary, AB', 'Calgary, AB'),
    resume: 'david_kim_resume.pdf',
    position: bi('Marketing Specialist', 'Spécialiste marketing'),
    currentRole: bi('Digital Marketing Coordinator', 'Coordonnateur marketing numérique'),
    yearsExperience: 3,
    workAuthorization: 'needs_sponsorship',
    status: 'basic_qualified',
    appliedDate: 'Aug 20, 2026',
    appliedISO: '2026-08-20',
    knockoutCriteria: {
      meetsRequirements: true,
      requiredQualifications: ['2+ years marketing', 'Social media', 'Content creation'],
      missingRequirements: ['Work authorization'],
    },
  },
  {
    id: 'c5',
    name: 'Jennifer Taylor',
    email: 'jennifer.t@example.com',
    location: bi('Ottawa, ON', 'Ottawa, ON'),
    resume: 'jennifer_taylor_resume.pdf',
    linkedIn: 'linkedin.com/in/jennifertaylor',
    position: bi('Product Manager', 'Gestionnaire de produit'),
    currentRole: bi('Senior Business Analyst', 'Analyste commercial principal'),
    yearsExperience: 6,
    workAuthorization: 'authorized',
    compensationExpectations: '$125-145k',
    status: 'application',
    appliedDate: 'Aug 22, 2026',
    appliedISO: '2026-08-22',
    knockoutCriteria: {
      meetsRequirements: true,
      requiredQualifications: ['5+ years business experience', 'Stakeholder management', 'Data analysis'],
      missingRequirements: ['Direct product management experience'],
    },
  },
]

export const demoEvidenceScreening: EvidenceScreening[] = [
  {
    candidateId: 'c1',
    relevantExperience: [
      {
        claim: bi('Led enterprise sales increase of 35%', 'Augmentation des ventes entreprises de 35 %'),
        evidence: bi('Managed 42-account portfolio; implemented Salesforce automation; reported $2.3M annual recurring revenue increase', 'Géré un portefeuille de 42 comptes; mis en œuvre l\'automatisation Salesforce; rapporté une augmentation de 2,3 M$ de revenus récurrents annuels'),
        confidence: 'high',
        specificity: 'specific',
      },
      {
        claim: bi('Launched 3 products from concept to market', 'Lancement de 3 produits du concept au marché'),
        evidence: bi('Product manager for SaaS platform features; managed cross-functional teams of 8-12; all products shipped on schedule', 'Gestionnaire de produit pour les fonctionnalités de la plateforme SaaS; géré des équipes interfonctionnelles de 8 à 12; tous les produits livrés à temps'),
        confidence: 'high',
        specificity: 'specific',
      },
    ],
    scope: {
      teamSize: '8-12 people',
      scale: bi('$2-5M ARR impact', 'Impact de 2 à 5 M$ en revenus récurrents annuels'),
      complexity: bi('Multi-stakeholder enterprise SaaS', 'SaaS entreprise avec plusieurs parties prenantes'),
      confidence: 'high',
    },
    outcomes: [
      {
        claim: bi('Increased enterprise sales 35%', 'Augmentation des ventes entreprises de 35 %'),
        evidence: bi('42-account portfolio; Salesforce automation; $2.3M ARR increase', 'Portefeuille de 42 comptes; automatisation Salesforce; augmentation de 2,3 M$ en revenus récurrents annuels'),
        metrics: ['35% growth', '$2.3M ARR', '42 accounts'],
        confidence: 'high',
        contributionClarity: 'clear',
      },
    ],
    skills: [
      {
        skill: bi('Product Strategy', 'Stratégie produit'),
        demonstrated: true,
        evidence: bi('Defined product roadmaps for 3 major releases; conducted market research and competitive analysis', 'Défini les feuilles de route produit pour 3 versions majeures; effectué des recherches sur le marché et une analyse concurrentielle'),
        proficiency: 'advanced',
      },
      {
        skill: bi('Data Analysis', 'Analyse de données'),
        demonstrated: true,
        evidence: bi('Used SQL and Tableau to analyze user behavior; A/B tested features; measured conversion funnels', 'Utilisé SQL et Tableau pour analyser le comportement des utilisateurs; testé A/B les fonctionnalités; mesuré les entonnoirs de conversion'),
        proficiency: 'advanced',
      },
      {
        skill: bi('Stakeholder Management', 'Gestion des parties prenantes'),
        demonstrated: true,
        evidence: bi('Led cross-functional teams of 8-12; presented to executive leadership; managed conflicting priorities', 'Dirigé des équipes interfonctionnelles de 8 à 12; présenté à la direction générale; géré les priorités conflictuelles'),
        proficiency: 'advanced',
      },
    ],
    careerTrajectory: {
      progression: 'strong',
      evidence: bi('Progressed from Business Analyst to Senior Product Manager over 7 years; increasing scope and responsibility', 'Progression d\'analyste commercial à gestionnaire de produit principal sur 7 ans; portée et responsabilités croissantes'),
      learning: bi('Completed product management certification; learned SQL and data visualization; attended industry conferences', 'Certification en gestion de produit achevée; apprentissage de SQL et de la visualisation de données; participation à des conférences de l\'industrie'),
      confidence: 'high',
    },
    domainKnowledge: {
      domain: bi('B2B SaaS', 'SaaS B2B'),
      level: 'expert',
      evidence: bi('5 years in B2B SaaS; deep understanding of enterprise sales cycles, SaaS metrics, and customer success', '5 ans dans le SaaS B2B; compréhension approfondie des cycles de vente entreprises, des métriques SaaS et du succès client'),
      confidence: 'high',
    },
    evidenceQuality: 'high',
    confidence: 'high',
    missingInfo: ['Individual contribution vs team contribution in some claims'],
  },
]

export const demoWorkSamples: WorkSampleAssessment[] = [
  {
    id: 'ws1',
    candidateId: 'c2',
    assessmentType: 'sales',
    scenario: bi('Here\'s a prospect account in the manufacturing sector. They use a legacy system and have 500 employees. Give us your 10-minute approach to winning this account.', 'Voici un compte prospect dans le secteur manufacturier. Ils utilisent un système hérité et ont 500 employés. Donnez-nous votre approche de 10 minutes pour gagner ce compte.'),
    submission: bi('I would start by researching their current pain points with legacy systems, then craft a personalized outreach highlighting our ROI. My approach would be: 1) Research the decision-makers, 2) Identify specific operational inefficiencies, 3) Quantify potential cost savings, 4) Schedule a demo focused on their use case, 5) Provide a customized pilot proposal. I used ChatGPT to refine my value proposition messaging.', 'Je commencerais par rechercher leurs points actuels de douleur avec les systèmes hérités, puis rédigerais une approche personnalisée mettant en évidence notre ROI. Mon approche serait: 1) Rechercher les décideurs, 2) Identifier les inefficacités opérationnelles spécifiques, 3) Quantifier les économies potentielles, 4) Planifier une démonstration axée sur leur cas d\'usage, 5) Fournir une proposition de pilote personnalisée. J\'ai utilisé ChatGPT pour affiner mon message de proposition de valeur.'),
    aiAllowed: true,
    aiDetected: true,
    timeTaken: '32 minutes',
    status: 'completed',
    evaluator: 'Riley Summers',
    evaluation: {
      quality: 'good',
      approach: bi('Structured approach with clear methodology. Good use of AI for messaging refinement while maintaining strategic thinking.', 'Approche structurée avec une méthodologie claire. Bonne utilisation de l\'IA pour l\'affichage des messages tout en maintenant une réflexion stratégique.'),
      aiUsage: bi('Used AI appropriately for communication refinement. Strategic thinking appears to be their own.', 'Utilisation appropriée de l\'IA pour l\'affinement de la communication. La réflexion stratégique semble être la leur.'),
      capability: 'medium',
      feedback: bi('Strong methodology and appropriate AI use. Could be more specific about manufacturing sector challenges and ROI calculations.', 'Méthodologie solide et utilisation appropriée de l\'IA. Pourrait être plus spécifique sur les défis du secteur manufacturier et les calculs de ROI.'),
      recommendation: 'advance',
    },
    assignedDate: 'Aug 19, 2026',
    completedDate: 'Aug 19, 2026',
  },
]

export const demoInterviews: DefenseInterview[] = [
  {
    id: 'i1',
    candidateId: 'c3',
    workSampleId: 'ws1',
    format: 'defend_work',
    scheduledDate: 'Aug 25, 2026',
    interviewers: ['Riley Summers', 'Technical Lead'],
    status: 'completed',
    conversation: [
      {
        question: bi('Walk me through how you arrived at this technical solution for the API performance issue.', 'Expliquez-moi comment vous êtes arrivé à cette solution technique pour le problème de performance de l\'API.'),
        response: bi('I started by analyzing the API response times using monitoring tools. I identified that the bottleneck was in the database query. I considered caching versus query optimization, and chose query optimization because the data changes frequently. I implemented an index which reduced response time by 60%.', 'J\'ai commencé par analyser les temps de réponse de l\'API à l\'aide d\'outils de surveillance. J\'ai identifié que le goulot d\'étranglement était dans la requête de base de données. J\'ai envisagé la mise en cache par rapport à l\'optimisation des requêtes, et j\'ai choisi l\'optimisation des requêtes car les données changent fréquemment. J\'ai mis en œuvre un index qui a réduit le temps de réponse de 60 %.'),
        depth: 'deep',
        reasoning: 'strong',
        alternatives: bi('Considered Redis caching but decided against it due to data freshness requirements and added complexity.', 'Envisagé la mise en cache Redis mais décidé contre en raison des exigences de fraîcheur des données et de la complexité ajoutée.'),
        confidence: 'high',
      },
      {
        question: bi('What assumption are you least confident about in your approach?', 'Quelle hypothèse êtes-vous le moins confiant dans votre approche?'),
        response: bi('I\'m least confident about the long-term scalability of this solution. If data volume grows 10x, the index might not be sufficient. I would then need to consider partitioning or a different database architecture.', 'Je suis le moins confiant quant à l\'évolutivité à long terme de cette solution. Si le volume de données augmente de 10 fois, l\'index pourrait ne pas suffire. Je devrais alors envisager le partitionnement ou une architecture de base de données différente.'),
        depth: 'deep',
        reasoning: 'strong',
        alternatives: bi('Already thinking about next-level solutions if current approach doesn\'t scale.', 'Pense déjà aux solutions de niveau supérieur si l\'approche actuelle ne s\'adapte pas.'),
        confidence: 'high',
      },
    ],
    assessment: {
      reasoningCapability: 'strong',
      defenseAbility: 'strong',
      knowledgeDepth: 'deep',
      communication: 'clear',
      authenticity: 'high',
      recommendation: 'hire',
      reasons: [
        bi('Demonstrated deep technical understanding and ability to explain decisions', 'Démontré une compréhension technique approfondie et la capacité d\'expliquer les décisions'),
        bi('Clearly considered alternatives and trade-offs', 'Clairement envisagé des alternatives et des compromis'),
        bi('Shows forward thinking about scalability', 'Montre une réflexion prospective sur l\'évolutivité'),
        bi('High confidence in responses with no evasiveness', 'Confiance élevée dans les réponses sans évasivité'),
      ],
    },
  },
]

export const demoAuthenticityScores: AuthenticityScores[] = [
  {
    candidateId: 'c3',
    qualification: 'high',
    evidence: 'high',
    capability: 'high',
    reasoning: 'high',
    motivation: 'medium',
    overall: 'high',
    explanations: [
      {
        dimension: 'qualification',
        score: 'high',
        evidence: bi('Meets all technical requirements: 5 years development, React/TypeScript expertise, API development experience', 'Répond à toutes les exigences techniques: 5 ans de développement, expertise React/TypeScript, expérience en développement d\'API'),
        confidence: 'high',
      },
      {
        dimension: 'evidence',
        score: 'high',
        evidence: bi('Portfolio shows 3 major shipped projects with clear technical contributions and quantifiable outcomes', 'Le portefeuille montre 3 projets majeurs livrés avec des contributions techniques claires et des résultats quantifiables'),
        confidence: 'high',
      },
      {
        dimension: 'capability',
        score: 'high',
        evidence: bi('Work sample demonstrates strong problem-solving and appropriate AI use; interview shows deep technical reasoning', 'L\'échantillon de travail démontre une forte résolution de problèmes et une utilisation appropriée de l\'IA; l\'entretien montre un raisonnement technique approfondi'),
        confidence: 'high',
      },
      {
        dimension: 'reasoning',
        score: 'high',
        evidence: bi('Interview demonstrates ability to explain decisions, consider alternatives, and defend technical choices with confidence', 'L\'entretien démontre la capacité d\'expliquer les décisions, d\'envisager des alternatives et de défendre les choix techniques avec confiance'),
        confidence: 'high',
      },
      {
        dimension: 'motivation',
        score: 'medium',
        evidence: bi('Expressed interest in the role but limited specific knowledge about our company and product', 'A exprimé de l\'intérêt pour le poste mais une connaissance limitée de notre entreprise et de notre produit'),
        confidence: 'medium',
      },
    ],
    lastUpdated: 'Aug 25, 2026',
  },
]

export const demoJobPostings: JobPosting[] = [
  {
    id: 'jp1',
    title: bi('Senior Product Manager', 'Gestionnaire de produit principal'),
    department: bi('Product', 'Produit'),
    location: bi('Toronto, ON (Hybrid)', 'Toronto, ON (Hybride)'),
    type: bi('Full-time', 'Temps plein'),
    description: bi('We\'re looking for a Senior Product Manager to lead our B2B SaaS product strategy. You\'ll work with cross-functional teams to deliver features that drive customer success and business growth.', 'Nous recherchons un gestionnaire de produit principal pour diriger notre stratégie de produit SaaS B2B. Vous travaillerez avec des équipes interfonctionnelles pour livrer des fonctionnalités qui favorisent le succès des clients et la croissance de l\'entreprise.'),
    requirements: [
      bi('5+ years of product management experience', '5+ ans d\'expérience en gestion de produit'),
      bi('B2B SaaS experience required', 'Expérience en SaaS B2B requise'),
      bi('Strong data analysis and SQL skills', 'Solides compétences en analyse de données et SQL'),
      bi('Experience with agile development methodologies', 'Expérience avec les méthodologies de développement agile'),
      bi('Excellent stakeholder management skills', 'Excellentes compétences en gestion des parties prenantes'),
    ],
    knockoutCriteria: ['5+ years PM experience', 'B2B SaaS experience', 'Data analysis skills'],
    workSampleScenario: bi('Here\'s a real product problem and some customer data. What would you do?', 'Voici un problème de produit réel et des données client. Que feriez-vous?'),
    status: 'active',
    postedDate: 'Aug 1, 2026',
    closingDate: 'Sep 15, 2026',
  },
]

export const demoFunnelMetrics: FunnelMetrics = {
  totalApplications: 127,
  basicQualified: 89,
  evidenceQualified: 52,
  workSamples: 23,
  interviews: 8,
  hires: 2,
  conversionRates: {
    toBasicQualified: 0.70,
    toEvidenceQualified: 0.58,
    toWorkSample: 0.44,
    toInterview: 0.35,
    toHire: 0.25,
  },
  averageTimeToHire: '18 days',
  stageDurations: {
    application: '2 days',
    screening: '3 days',
    workSample: '5 days',
    interview: '8 days',
  },
}
