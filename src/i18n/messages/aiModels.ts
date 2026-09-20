import { defineMessages } from '../core'

/**
 * Settings → AI → "AI models" — registering self-hosted (local/LAN)
 * OpenAI-compatible providers and installing on-device browser models.
 * New surface, no prototype source: FR strings marked [FR self-authored].
 */
export const aiModelsMessages = defineMessages({
  /* ── Section chrome ─────────────────────────────────────────────────────── */
  aimodels_title: { en: 'AI models', fr: 'Modèles d’IA' },
  aimodels_note: {
    en: 'Where Advisor replies come from, and which models live on this device.',
    fr: 'D’où viennent les réponses du Conseiller, et quels modèles vivent sur cet appareil.',
  },

  /* ── Server providers (admin) ───────────────────────────────────────────── */
  aimodels_providers_title: { en: 'Model providers', fr: 'Fournisseurs de modèles' },
  aimodels_providers_note: {
    en: 'The Advisor calls the active route’s provider over an OpenAI-compatible endpoint. A local server (Ollama, LM Studio, vLLM) on your network works the same way — register its URL, then point a route at it. The URL must be reachable from Dutiva’s cloud, not just this browser — a LAN address needs a tunnel or a public hostname.',
    fr: 'Le Conseiller appelle le fournisseur de la route active via un point de terminaison compatible OpenAI. Un serveur local (Ollama, LM Studio, vLLM) sur votre réseau fonctionne de la même façon — enregistrez son URL, puis dirigez une route vers lui. L’URL doit être joignable depuis l’infonuagique de Dutiva, pas seulement depuis ce navigateur — une adresse de réseau local exige un tunnel ou un nom d’hôte public.',
  },
  aimodels_providers_empty: {
    en: 'No providers yet — register one below.',
    fr: 'Aucun fournisseur pour l’instant — enregistrez-en un ci-dessous.',
  },
  aimodels_col_provider: { en: 'Provider', fr: 'Fournisseur' },
  aimodels_col_endpoint: { en: 'Endpoint', fr: 'Point de terminaison' },
  aimodels_col_status: { en: 'Status', fr: 'Statut' },
  aimodels_status_active: { en: 'Active', fr: 'Actif' },
  aimodels_status_inactive: { en: 'Inactive', fr: 'Inactif' },
  aimodels_keyless: { en: 'No API key', fr: 'Sans clé API' },
  aimodels_keyed: { en: 'Key via env', fr: 'Clé via env.' },

  aimodels_register_title: {
    en: 'Register a local provider',
    fr: 'Enregistrer un fournisseur local',
  },
  aimodels_field_name: { en: 'Display name', fr: 'Nom affiché' },
  aimodels_field_name_ph: { en: 'e.g. Office Ollama', fr: 'p. ex. Ollama du bureau' },
  aimodels_field_url: { en: 'Base URL', fr: 'URL de base' },
  aimodels_field_url_ph: { en: 'https://llm.your-org.ca/v1', fr: 'https://llm.votre-org.ca/v1' },
  aimodels_field_secret: {
    en: 'Secret env name (optional)',
    fr: 'Nom de la variable secrète (facultatif)',
  },
  aimodels_field_secret_ph: { en: 'LOCAL_LLM_API_KEY', fr: 'LOCAL_LLM_API_KEY' },
  aimodels_field_secret_note: {
    en: 'Name of an edge-function secret holding the API key. Leave blank for keyless local servers.',
    fr: 'Nom d’un secret de fonction edge contenant la clé API. Laissez vide pour les serveurs locaux sans clé.',
  },
  aimodels_field_modalities: { en: 'Accepts', fr: 'Accepte' },
  aimodels_modality_text: { en: 'Text', fr: 'Texte' },
  aimodels_modality_image: { en: 'Images', fr: 'Images' },
  aimodels_modality_document: { en: 'Documents', fr: 'Documents' },
  aimodels_register_submit: { en: 'Register provider', fr: 'Enregistrer le fournisseur' },
  aimodels_register_done: { en: 'Provider registered.', fr: 'Fournisseur enregistré.' },
  aimodels_register_failed: {
    en: 'Couldn’t register the provider.',
    fr: 'Impossible d’enregistrer le fournisseur.',
  },
  aimodels_register_required: {
    en: 'A name and a base URL are required.',
    fr: 'Un nom et une URL de base sont requis.',
  },

  aimodels_probe: { en: 'Test', fr: 'Tester' },
  aimodels_probe_ok: {
    en: 'Reachable from this browser ({count} models listed).',
    fr: 'Joignable depuis ce navigateur ({count} modèles listés).',
  },
  aimodels_probe_fail: {
    en: 'Not reachable from this browser — CORS may still allow the server.',
    fr: 'Injoignable depuis ce navigateur — le CORS peut quand même autoriser le serveur.',
  },

  aimodels_route_title: { en: 'Advisor route', fr: 'Route du Conseiller' },
  aimodels_route_note: {
    en: 'Every Advisor turn resolves this route. Point it at a provider and model name — changes take effect on the next message.',
    fr: 'Chaque tour du Conseiller résout cette route. Dirigez-la vers un fournisseur et un nom de modèle — le changement s’applique au prochain message.',
  },
  aimodels_route_current: { en: 'Currently', fr: 'Actuellement' },
  aimodels_route_provider: { en: 'Provider', fr: 'Fournisseur' },
  aimodels_route_model: { en: 'Model name', fr: 'Nom du modèle' },
  aimodels_route_model_ph: { en: 'e.g. llama3.2-vision', fr: 'p. ex. llama3.2-vision' },
  aimodels_route_apply: { en: 'Point route here', fr: 'Diriger la route ici' },
  aimodels_route_saved: { en: 'Route updated.', fr: 'Route mise à jour.' },
  aimodels_route_failed: {
    en: 'Couldn’t update the route.',
    fr: 'Impossible de mettre à jour la route.',
  },
  aimodels_route_missing: {
    en: 'No advisor_chat route exists yet — routes are seeded server-side.',
    fr: 'Aucune route advisor_chat n’existe encore — les routes sont créées côté serveur.',
  },

  aimodels_deactivate: { en: 'Deactivate', fr: 'Désactiver' },
  aimodels_activate: { en: 'Activate', fr: 'Activer' },

  /* ── On-device models ───────────────────────────────────────────────────── */
  aimodels_device_title: { en: 'On this device', fr: 'Sur cet appareil' },
  aimodels_device_note: {
    en: 'Small models that download once and run in this browser — for on-device tasks like captioning an image or transcribing audio. They never power the Advisor itself.',
    fr: 'Petits modèles téléchargés une fois et exécutés dans ce navigateur — pour les tâches sur l’appareil comme décrire une image ou transcrire de l’audio. Ils n’alimentent jamais le Conseiller lui-même.',
  },
  aimodels_install: { en: 'Install', fr: 'Installer' },
  aimodels_installed: { en: 'Installed', fr: 'Installé' },
  aimodels_installing: { en: 'Installing…', fr: 'Installation…' },
  aimodels_remove: { en: 'Remove', fr: 'Supprimer' },
  aimodels_install_failed: {
    en: 'Install failed — the download may have been interrupted.',
    fr: 'Échec de l’installation — le téléchargement a peut-être été interrompu.',
  },
  aimodels_removed: { en: 'Model removed.', fr: 'Modèle supprimé.' },
  aimodels_storage: {
    en: '{used} of browser storage in use.',
    fr: '{used} de stockage navigateur utilisé.',
  },
  aimodels_size_mb: { en: '~{size} MB download', fr: 'Téléchargement ~{size} Mo' },

  /* ── Drive/folder import (File System Access prototype) ─────────────────── */
  aimodels_drive_title: {
    en: 'Load from a folder or drive',
    fr: 'Charger depuis un dossier ou un disque', // [FR self-authored]
  },
  aimodels_drive_note: {
    en: 'Point at a folder laid out as Org/Model/files (e.g. Xenova/whisper-tiny/onnx/model_quantized.onnx). Files are copied into browser storage — the drive is never mounted, and nothing loads until you pick it.',
    fr: 'Pointez vers un dossier structuré Organisation/Modèle/fichiers (p. ex. Xenova/whisper-tiny/onnx/model_quantized.onnx). Les fichiers sont copiés dans le stockage du navigateur — le disque n’est jamais monté, et rien ne se charge tant que vous ne l’avez pas choisi.', // [FR self-authored]
  },
  aimodels_drive_choose: {
    en: 'Choose folder',
    fr: 'Choisir un dossier', // [FR self-authored]
  },
  aimodels_drive_regrant: {
    en: 'Allow access again',
    fr: 'Autoriser l’accès de nouveau', // [FR self-authored]
  },
  aimodels_drive_linked: {
    en: 'Linked folder: {name}',
    fr: 'Dossier lié : {name}', // [FR self-authored]
  },
  aimodels_drive_importing: {
    en: 'Importing {done}/{total}…',
    fr: 'Importation {done}/{total}…', // [FR self-authored]
  },
  aimodels_drive_done: {
    en: 'Imported {count} file(s) across {repos} model(s).',
    fr: '{count} fichier(s) importé(s) pour {repos} modèle(s).', // [FR self-authored]
  },
  aimodels_drive_nothing: {
    en: 'No Organization/Model folders found in that folder.',
    fr: 'Aucun dossier Organisation/Modèle trouvé dans ce dossier.', // [FR self-authored]
  },
  aimodels_drive_unsupported: {
    en: 'Folder picking needs a Chromium-based browser — the download buttons above work everywhere.',
    fr: 'Le choix de dossier exige un navigateur Chromium — les boutons de téléchargement ci-dessus fonctionnent partout.', // [FR self-authored]
  },
})
