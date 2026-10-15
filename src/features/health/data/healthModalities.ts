import type { Bi } from '@/i18n/core'
import { bi } from '@/i18n/core'

/**
 * The approaches Mira knows — the modality library the Health portal's
 * Practices section renders from. Two tiers, matching the server-side
 * playbook in supabase/functions/health-ai/handlers.ts (keep both in
 * sync):
 *
 *   guided: true   — Mira can lead the exercises step-by-step as skills
 *                    practice (internal accounts only; the server only
 *                    unlocks this range on @dutiva.ca sessions).
 *   guided: false  — clinician-led approaches (EMDR, hypnotherapy). She
 *                    explains what they are and what a session looks like,
 *                    offers the adjacent skill she does have, and points to
 *                    the Resources page — she never conducts them.
 *
 * `note` carries the boundary line where a guided approach has a clinician
 * edge (full DBT, sleep-restriction windows, the structured IPT protocol).
 * `ask` seeds the chat composer for everyone; `practiceAsk` is the internal
 * guided-session opener. All copy self-authored, no design handoff.
 */
export interface HealthModality {
  id: string
  name: Bi
  /** One line — what the approach is. */
  what: Bi
  /** The exercises or material a session works with. */
  mira: Bi
  /** Boundary line — shown when part of the approach stays clinician-side. */
  note: Bi | null
  /** Composer prefill — "tell me about it", available to every account. */
  ask: Bi
  /** Composer prefill — "walk me through it", internal guided sessions. */
  practiceAsk: Bi | null
  guided: boolean
}

export const healthModalities: HealthModality[] = [
  {
    id: 'cbt',
    name: bi('Cognitive behavioral therapy (CBT)', 'Thérapie cognitivo-comportementale (TCC)'),
    what: bi(
      'Maps the loop between a thought, a feeling, and what you do next — then puts the thought on trial.',
      'Relie une pensée, une émotion et ce que vous faites ensuite — puis met la pensée à l’épreuve.',
    ),
    mira: bi(
      'Thought records, naming distortions, balanced reframes, behavioral activation, worry time.',
      'Journal de pensées, nommer les distorsions, reformulations équilibrées, activation comportementale, temps de préoccupation.',
    ),
    note: null,
    ask: bi('Explain what CBT is', 'Explique-moi ce qu’est la TCC'),
    practiceAsk: bi('Walk me through a thought record', 'Guide-moi dans un journal de pensées'),
    guided: true,
  },
  {
    id: 'mbct',
    name: bi('Mindfulness-based cognitive therapy (MBCT)', 'Thérapie cognitive basée sur la pleine conscience (MBCT)'),
    what: bi(
      'CBT tools plus mindfulness — thoughts get treated as passing events, not facts.',
      'Les outils de la TCC plus la pleine conscience — les pensées sont des événements qui passent, pas des faits.',
    ),
    mira: bi(
      'The three-minute breathing space, decentering, body scans, noticing a mood spiral early.',
      'La pause respiratoire de trois minutes, le décentrage, le scan corporel, repérer tôt une spirale d’humeur.',
    ),
    note: null,
    ask: bi('Explain what MBCT is', 'Explique-moi ce qu’est la MBCT'),
    practiceAsk: bi('Run a three-minute breathing space with me', 'Fais-moi une pause respiratoire de trois minutes'),
    guided: true,
  },
  {
    id: 'mbsr',
    name: bi('Mindfulness-based stress reduction (MBSR)', 'Réduction du stress basée sur la pleine conscience (MBSR)'),
    what: bi(
      'Structured mindfulness practice for stress — attention trained on the body and the breath.',
      'Une pratique structurée de pleine conscience pour le stress — l’attention posée sur le corps et le souffle.',
    ),
    mira: bi(
      'Body scans, sitting meditation, breath awareness, gentle mindful movement.',
      'Scans corporels, méditation assise, conscience du souffle, mouvement doux en conscience.',
    ),
    note: null,
    ask: bi('Explain what MBSR is', 'Explique-moi ce qu’est la MBSR'),
    practiceAsk: bi('Guide me through a body scan', 'Guide-moi dans un scan corporel'),
    guided: true,
  },
  {
    id: 'pmr',
    name: bi('Progressive muscle relaxation (PMR)', 'Relaxation musculaire progressive (RMP)'),
    what: bi(
      'Tense a muscle group for a few seconds, then let go — the contrast teaches the body what relaxed feels like.',
      'Contracter un groupe musculaire quelques secondes, puis relâcher — le contraste apprend au corps ce que relâché veut dire.',
    ),
    mira: bi(
      'A guided pass through the muscle groups — hands, shoulders, face, legs — one release at a time.',
      'Un passage guidé des groupes musculaires — mains, épaules, visage, jambes — un relâchement à la fois.',
    ),
    note: null,
    ask: bi('Explain progressive muscle relaxation', 'Explique-moi la relaxation musculaire progressive'),
    practiceAsk: bi('Guide me through a muscle relaxation round', 'Guide-moi dans une séance de relaxation musculaire'),
    guided: true,
  },
  {
    id: 'act',
    name: bi('Acceptance and commitment therapy (ACT)', 'Thérapie d’acceptation et d’engagement (ACT)'),
    what: bi(
      'Stop fighting the thought — name what matters and move toward it anyway.',
      'Cesser de combattre la pensée — nommer ce qui compte et avancer quand même.',
    ),
    mira: bi(
      'Defusion (“I’m having the thought that…”, leaves on a stream), the values compass, committed action.',
      'La défusion (« j’ai la pensée que… », les feuilles sur la rivière), la boussole des valeurs, l’action engagée.',
    ),
    note: null,
    ask: bi('Explain what ACT is', 'Explique-moi ce qu’est l’ACT'),
    practiceAsk: bi('Try a defusion exercise with me', 'Essaie un exercice de défusion avec moi'),
    guided: true,
  },
  {
    id: 'selfcompassion',
    name: bi('Self-compassion practice', 'Pratique d’autocompassion'),
    what: bi(
      'Treating yourself the way you’d treat a friend having the same hard day — a skill, not a mood.',
      'Se traiter comme on traiterait un ami qui vit la même journée difficile — une habileté, pas une humeur.',
    ),
    mira: bi(
      'The self-compassion break, a compassionate letter to yourself, softening the inner critic’s tone.',
      'La pause d’autocompassion, une lettre bienveillante envers soi-même, adoucir le ton du critique intérieur.',
    ),
    note: null,
    ask: bi('Explain self-compassion practice', 'Explique-moi la pratique d’autocompassion'),
    practiceAsk: bi('Walk me through a self-compassion break', 'Guide-moi dans une pause d’autocompassion'),
    guided: true,
  },
  {
    id: 'dbt',
    name: bi('Dialectical behavior therapy skills (DBT)', 'Habiletés de la thérapie comportementale dialectique (TCD)'),
    what: bi(
      'Skills for intense moments — riding out distress, regulating emotion, asking for what you need.',
      'Des habiletés pour les moments intenses — traverser la détresse, réguler l’émotion, demander ce dont vous avez besoin.',
    ),
    mira: bi(
      'TIPP, STOP, opposite action, DEAR MAN, radical acceptance, self-soothing.',
      'TIPP, STOP, action opposée, DEAR MAN, acceptation radicale, auto-apaisement.',
    ),
    note: bi(
      'The skills transfer well — the full protocol (diary cards, chain analysis, a therapist team) is clinician-led.',
      'Les habiletés se transposent bien — le protocole complet (cartes, analyse en chaîne, équipe) relève d’un clinicien.',
    ),
    ask: bi('Explain what DBT skills are', 'Explique-moi les habiletés TCD'),
    practiceAsk: bi('Walk me through the STOP skill', 'Guide-moi dans l’habileté STOP'),
    guided: true,
  },
  {
    id: 'ipt',
    name: bi('Interpersonal psychotherapy (IPT)', 'Psychothérapie interpersonnelle (TIP)'),
    what: bi(
      'Looks at mood through relationships — roles, disputes, transitions, grief.',
      'Regarde l’humeur à travers les relations — rôles, conflits, transitions, deuils.',
    ),
    mira: bi(
      'A relationships inventory, journaling a role change, rehearsing a hard conversation.',
      'Un inventaire relationnel, un journal sur une transition de rôle, la préparation d’une conversation difficile.',
    ),
    note: bi(
      'Mira runs the reflection exercises — the structured protocol is clinician-led.',
      'Mira guide les exercices de réflexion — le protocole structuré relève d’un clinicien.',
    ),
    ask: bi('Explain what IPT is', 'Explique-moi ce qu’est la TIP'),
    practiceAsk: bi('Help me think through a hard relationship', 'Aide-moi à réfléchir à une relation difficile'),
    guided: true,
  },
  {
    id: 'writing',
    name: bi('Expressive writing', 'Écriture expressive'),
    what: bi(
      'Timed, uncensored writing about what weighs on you — the page holds it so your head does less.',
      'Une écriture minutée et sans filtre sur ce qui pèse — la page le porte pour que la tête porte moins.',
    ),
    mira: bi(
      'A short timed write from a prompt, then a second pass on what the first pass surfaced.',
      'Une écriture minutée à partir d’une invite, puis un second passage sur ce que la première a soulevé.',
    ),
    note: null,
    ask: bi('Explain expressive writing', 'Explique-moi l’écriture expressive'),
    practiceAsk: bi('Run a short expressive-writing prompt with me', 'Lance une courte écriture expressive avec moi'),
    guided: true,
  },
  {
    id: 'cbti',
    name: bi('CBT for insomnia (CBT-I)', 'TCC pour l’insomnie (TCC-I)'),
    what: bi(
      'Rebuilds the habits around sleep — timing, the bed, the wind-down — instead of chasing sleep itself.',
      'Rebâtit les habitudes autour du sommeil — horaires, lit, transition — plutôt que de courir après le sommeil.',
    ),
    mira: bi(
      'A fixed wake time, bed-for-sleep rules, a wind-down plan, a sleep diary.',
      'Une heure de lever constante, le lit réservé au sommeil, un rituel du soir, un journal du sommeil.',
    ),
    note: bi(
      'Sleep-restriction windows get calibrated by a clinician — Mira keeps to the behavioral basics.',
      'La fenêtre de restriction du sommeil se calibre avec un clinicien — Mira reste sur les bases comportementales.',
    ),
    ask: bi('Explain what CBT-I is', 'Explique-moi ce qu’est la TCC-I'),
    practiceAsk: bi('Help me build a wind-down plan', 'Aide-moi à bâtir un rituel du soir'),
    guided: true,
  },
  {
    id: 'person',
    name: bi('Person-centered therapy', 'Thérapie centrée sur la personne'),
    what: bi(
      'Unconditional listening — you set the pace and the direction; the other person reflects, not steers.',
      'Une écoute inconditionnelle — vous donnez le rythme et la direction; l’autre reflète, sans diriger.',
    ),
    mira: bi(
      'Open reflective listening — her native register on any conversation.',
      'L’écoute réflexive ouverte — son registre naturel dans toute conversation.',
    ),
    note: null,
    ask: bi('Explain person-centered therapy', 'Explique-moi la thérapie centrée sur la personne'),
    practiceAsk: bi('Just listen while I think out loud', 'Écoute-moi pendant que je réfléchis à voix haute'),
    guided: true,
  },
  {
    id: 'sfbt',
    name: bi('Solution-focused brief therapy (SFBT)', 'Thérapie brève axée sur les solutions (TBS)'),
    what: bi(
      'Skips the archaeology — imagines the day the problem is gone and works backwards to the next small step.',
      'Sans archéologie — imagine le jour où le problème est parti et remonte jusqu’au prochain petit pas.',
    ),
    mira: bi(
      'The miracle question, scaling questions, hunting for exceptions.',
      'La question miracle, les questions d’échelle, la chasse aux exceptions.',
    ),
    note: null,
    ask: bi('Explain what SFBT is', 'Explique-moi ce qu’est la TBS'),
    practiceAsk: bi('Ask me the miracle question', 'Pose-moi la question miracle'),
    guided: true,
  },
  {
    id: 'coaching',
    name: bi('Life coaching', 'Coaching de vie'),
    what: bi(
      'Forward-looking goal work — what you want, what’s in the way, what you’ll do by when.',
      'Du travail sur les objectifs, vers l’avant — ce que vous voulez, ce qui bloque, ce que vous ferez et quand.',
    ),
    mira: bi(
      'Values-to-goals mapping, GROW-style questions, implementation intentions, a weekly review.',
      'Des valeurs vers les objectifs, des questions de type GROW, des intentions d’implémentation, une revue hebdomadaire.',
    ),
    note: null,
    ask: bi('Explain what life coaching is', 'Explique-moi ce qu’est le coaching de vie'),
    practiceAsk: bi('Coach me on a goal I keep circling', 'Coache-moi sur un objectif que je tourne en rond'),
    guided: true,
  },
  {
    id: 'mi',
    name: bi('Motivational interviewing (MI)', 'Entretien motivationnel (EM)'),
    what: bi(
      'A way of talking about change that hears both sides — the part that wants to and the part that doesn’t.',
      'Une façon de parler du changement qui écoute les deux côtés — celui qui veut et celui qui ne veut pas.',
    ),
    mira: bi(
      'Exploring ambivalence out loud, weighing the good and the hard of a change, naming your own reasons.',
      'Explorer l’ambivalence à voix haute, peser le bon et le difficile d’un changement, nommer vos propres raisons.',
    ),
    note: bi(
      'Mira runs the reflective version — the formal method belongs to counsellors.',
      'Mira en guide la version réflexive — la méthode formelle appartient aux intervenants.',
    ),
    ask: bi('Explain motivational interviewing', 'Explique-moi l’entretien motivationnel'),
    practiceAsk: bi('Help me think through a change I keep circling', 'Aide-moi à réfléchir à un changement que je tourne en rond'),
    guided: true,
  },
  {
    id: 'meditation',
    name: bi('Meditation', 'Méditation'),
    what: bi(
      'Attention practice, plain and simple — breath, body, or open noticing.',
      'Un entraînement de l’attention, tout simple — souffle, corps, ou observation ouverte.',
    ),
    mira: bi(
      'Breath counting, loving-kindness, noting practice, open monitoring.',
      'Comptage du souffle, bienveillance, pratique de notation, observation ouverte.',
    ),
    note: null,
    ask: bi('Explain meditation styles', 'Explique-moi les styles de méditation'),
    practiceAsk: bi('Lead a short meditation', 'Guide une courte méditation'),
    guided: true,
  },
  {
    id: 'spiritual',
    name: bi('Spiritual counselling', 'Accompagnement spirituel'),
    what: bi(
      'Meaning, values, and what you hold sacred — explored on your own terms, whatever they are.',
      'Le sens, les valeurs et ce qui est sacré pour vous — explorés dans vos propres termes.',
    ),
    mira: bi(
      'Questions of meaning, values reflection, gratitude and awe.',
      'Questions de sens, réflexion sur les valeurs, gratitude et émerveillement.',
    ),
    note: bi(
      'Mira reflects with you — she never speaks for a faith or a tradition.',
      'Mira réfléchit avec vous — elle ne parle jamais au nom d’une foi ou d’une tradition.',
    ),
    ask: bi('Explain spiritual counselling', 'Explique-moi l’accompagnement spirituel'),
    practiceAsk: bi('Sit with me on a question of meaning', 'Reste avec moi sur une question de sens'),
    guided: true,
  },
  {
    id: 'imagery',
    name: bi('Guided imagery', 'Imagerie guidée'),
    what: bi(
      'Building a calm place in detail — sight, sound, texture — so the nervous system has somewhere to land.',
      'Construire un lieu calme dans le détail — images, sons, textures — pour que le système nerveux ait où se poser.',
    ),
    mira: bi(
      'Calm-place visualization, a slow walk through a scene, imagery to pair with a hard moment later.',
      'Visualisation d’un lieu apaisant, traversée lente d’une scène, images à associer plus tard à un moment dur.',
    ),
    note: null,
    ask: bi('Explain guided imagery', 'Explique-moi l’imagerie guidée'),
    practiceAsk: bi('Walk me through a calm-place visualization', 'Guide-moi dans la visualisation d’un lieu apaisant'),
    guided: true,
  },
  {
    id: 'emdr',
    name: bi('EMDR', 'EMDR'),
    what: bi(
      'Trauma therapy using bilateral stimulation — guided eye movements while a memory is held.',
      'Thérapie du trauma par stimulation bilatérale — mouvements oculaires guidés pendant qu’un souvenir est évoqué.',
    ),
    mira: bi(
      'Mira can explain how it works and offer grounding or calm-place imagery — the processing itself needs a trained therapist in the room.',
      'Mira peut l’expliquer et offrir de l’ancrage ou des images apaisantes — le traitement lui-même demande un·e thérapeute formé·e.',
    ),
    note: bi(
      'Working through memories this way without containment can hurt more than it helps.',
      'Travailler des souvenirs ainsi sans contenant peut faire plus de mal que de bien.',
    ),
    ask: bi('Explain EMDR — what it is and how it works', 'Explique-moi l’EMDR — ce que c’est et comment ça marche'),
    practiceAsk: null,
    guided: false,
  },
  {
    id: 'hypnosis',
    name: bi('Hypnotherapy', 'Hypnothérapie'),
    what: bi(
      'Guided trance and suggestion for things like pain or habits — a focused state a clinician runs.',
      'Transe guidée et suggestion — douleur, habitudes — un état dirigé par un clinicien.',
    ),
    mira: bi(
      'Mira can explain what it is and guide ordinary relaxation or imagery — trance and suggestion stay with a trained hypnotherapist.',
      'Mira peut l’expliquer et guider une relaxation ou des images ordinaires — la transe et la suggestion relèvent d’un·e hypnothérapeute formé·e.',
    ),
    note: bi(
      'Trance work belongs with someone trained and accountable for it.',
      'Le travail de transe appartient à une personne formée et responsable.',
    ),
    ask: bi('Explain hypnotherapy — what it is and when it helps', 'Explique-moi l’hypnothérapie — ce que c’est et quand ça aide'),
    practiceAsk: null,
    guided: false,
  },
]
