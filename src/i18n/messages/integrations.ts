import { defineMessages } from '../core'

/**
 * Settings → Connections (workspace integrations, phase 1). Copy rules:
 * 'connected' only ever means a live provider probe succeeded — never "row
 * exists". 'Planned' is the honest state for OAuth providers (gmail,
 * outlook), Signal and inbound webhooks until those flows ship. FR strings
 * below are self-authored — no design handoff covers this surface yet.
 */
export const integrationsMessages = defineMessages({
  integ_title: { en: 'Connections', fr: 'Connexions' }, // [FR self-authored]
  integ_note: {
    en: 'Link this workspace to outside tools. Credentials are verified once, then kept in Supabase Vault — the table holds a reference, never the secret.',
    fr: 'Liez cet espace de travail à des outils externes. Les identifiants sont vérifiés une fois, puis conservés dans Supabase Vault — la table garde une référence, jamais le secret.', // [FR self-authored]
  },
  integ_empty: {
    en: 'No connections yet.',
    fr: 'Aucune connexion pour le moment.', // [FR self-authored]
  },
  integ_deferred_note: {
    en: 'Gmail, Outlook and Signal need OAuth sign-in or a supported API, so they stay planned until those flows exist — no unofficial workarounds.',
    fr: 'Gmail, Outlook et Signal exigent une connexion OAuth ou une API prise en charge; ils restent donc planifiés tant que ces flux n’existent pas — aucun contournement non officiel.', // [FR self-authored]
  },

  integ_status_connected: { en: 'Connected', fr: 'Connectée' }, // [FR self-authored]
  integ_status_pending: { en: 'Pending', fr: 'En attente' }, // [FR self-authored]
  integ_status_error: { en: 'Check failed', fr: 'Vérification échouée' }, // [FR self-authored]
  integ_status_disconnected: { en: 'Disconnected', fr: 'Déconnectée' }, // [FR self-authored]
  integ_status_planned: { en: 'Planned', fr: 'Prévue' }, // [FR self-authored]

  integ_connect: { en: 'Connect', fr: 'Connecter' }, // [FR self-authored]
  integ_setup: { en: 'Set up', fr: 'Configurer' }, // [FR self-authored]
  integ_test: { en: 'Test', fr: 'Tester' }, // [FR self-authored]
  integ_disconnect: { en: 'Disconnect', fr: 'Déconnecter' }, // [FR self-authored]
  integ_cancel: { en: 'Cancel', fr: 'Annuler' }, // [FR self-authored]
  integ_remove: { en: 'Remove', fr: 'Retirer' }, // [FR self-authored]

  integ_field_name: { en: 'Connection name', fr: 'Nom de la connexion' }, // [FR self-authored]
  integ_field_name_hint: {
    en: 'e.g. “GitHub — engineering org”',
    fr: 'p. ex. « GitHub — équipe ingénierie »', // [FR self-authored]
  },
  integ_field_instance: {
    en: 'Instance URL',
    fr: 'URL de l’instance', // [FR self-authored]
  },
  integ_field_instance_hint: {
    en: 'Leave blank for gitlab.com',
    fr: 'Laissez vide pour gitlab.com', // [FR self-authored]
  },
  integ_field_token: {
    en: 'Access token',
    fr: 'Jeton d’accès', // [FR self-authored]
  },
  integ_token_hint_github: {
    en: 'A personal access token with read access. We check it against github.com before storing it.',
    fr: 'Un jeton d’accès personnel avec accès en lecture. Nous le vérifions auprès de github.com avant de le conserver.', // [FR self-authored]
  },
  integ_token_hint_gitlab: {
    en: 'A personal access token with the read_api scope. We check it against your GitLab instance before storing it.',
    fr: 'Un jeton d’accès personnel avec la portée read_api. Nous le vérifions auprès de votre instance GitLab avant de le conserver.', // [FR self-authored]
  },
  integ_field_smtp_host: { en: 'SMTP host', fr: 'Hôte SMTP' }, // [FR self-authored]
  integ_field_smtp_port: { en: 'Port', fr: 'Port' }, // [FR self-authored]
  integ_field_smtp_user: {
    en: 'Username',
    fr: 'Nom d’utilisateur', // [FR self-authored]
  },
  integ_field_smtp_password: {
    en: 'Password',
    fr: 'Mot de passe', // [FR self-authored]
  },
  integ_smtp_note: {
    en: 'The password is stored in Vault, but sending can’t be verified from here — the connection stays pending until a first send succeeds.',
    fr: 'Le mot de passe est conservé dans Vault, mais l’envoi ne peut pas être vérifié ici — la connexion reste en attente jusqu’à ce qu’un premier envoi réussisse.', // [FR self-authored]
  },

  integ_account: { en: 'Account', fr: 'Compte' }, // [FR self-authored]
  integ_last_checked: {
    en: 'Checked {when}',
    fr: 'Vérifiée {when}', // [FR self-authored]
  },
  integ_never_checked: {
    en: 'Not verified yet',
    fr: 'Pas encore vérifiée', // [FR self-authored]
  },

  integ_toast_connected: {
    en: 'Connected as {account}.',
    fr: 'Connectée au compte {account}.', // [FR self-authored]
  },
  integ_toast_check_failed: {
    en: 'The provider rejected that credential. Check the token and try again.',
    fr: 'Le fournisseur a refusé cet identifiant. Vérifiez le jeton et réessayez.', // [FR self-authored]
  },
  integ_toast_disconnected: {
    en: 'Disconnected — the stored credential was removed.',
    fr: 'Déconnectée — l’identifiant conservé a été supprimé.', // [FR self-authored]
  },
  integ_toast_saved: { en: 'Saved.', fr: 'Enregistrée.' }, // [FR self-authored]
  integ_toast_save_failed: {
    en: 'Could not save the connection.',
    fr: 'Impossible d’enregistrer la connexion.', // [FR self-authored]
  },

  integ_provider_github_name: { en: 'GitHub', fr: 'GitHub' },
  integ_provider_github_blurb: {
    en: 'Link repositories and activity to workspace records.',
    fr: 'Liez des dépôts et leur activité aux dossiers de l’espace de travail.', // [FR self-authored]
  },
  integ_provider_gitlab_name: { en: 'GitLab', fr: 'GitLab' },
  integ_provider_gitlab_blurb: {
    en: 'Works with gitlab.com or a self-managed instance.',
    fr: 'Compatible avec gitlab.com ou une instance autogérée.', // [FR self-authored]
  },
  integ_provider_gmail_name: { en: 'Gmail', fr: 'Gmail' },
  integ_provider_gmail_blurb: {
    en: 'Send and read workspace email through a Gmail account.',
    fr: 'Envoyez et lisez le courriel de l’espace de travail via un compte Gmail.', // [FR self-authored]
  },
  integ_provider_outlook_name: { en: 'Outlook', fr: 'Outlook' },
  integ_provider_outlook_blurb: {
    en: 'Send and read workspace email through Microsoft 365.',
    fr: 'Envoyez et lisez le courriel de l’espace de travail via Microsoft 365.', // [FR self-authored]
  },
  integ_provider_smtp_name: { en: 'Email (SMTP)', fr: 'Courriel (SMTP)' }, // [FR self-authored]
  integ_provider_smtp_blurb: {
    en: 'Send workspace email through your own mail server.',
    fr: 'Envoyez le courriel de l’espace de travail via votre propre serveur.', // [FR self-authored]
  },
  integ_provider_webhook_name: {
    en: 'Incoming webhook',
    fr: 'Webhook entrant', // [FR self-authored]
  },
  integ_provider_webhook_blurb: {
    en: 'Receive events from other tools on a workspace URL.',
    fr: 'Recevez des événements d’autres outils sur une URL de l’espace de travail.', // [FR self-authored]
  },

  integ_webhook_create: {
    en: 'Create endpoint',
    fr: 'Créer le endpoint', // [FR self-authored]
  },
  integ_webhook_endpoint: { en: 'Endpoint URL', fr: 'URL du endpoint' }, // [FR self-authored]
  integ_webhook_secret: {
    en: 'Signing secret',
    fr: 'Secret de signature', // [FR self-authored]
  },
  integ_webhook_once: {
    en: 'Copy these now — the signing secret is shown once and kept only in Vault.',
    fr: 'Copiez-les maintenant — le secret de signature n’est affiché qu’une fois et conservé seulement dans Vault.', // [FR self-authored]
  },
  integ_webhook_hint: {
    en: 'Senders sign each request with the secret (X-Dutiva-Signature header) — the format is documented in docs/INTEGRATIONS.md.',
    fr: 'L’expéditeur signe chaque requête avec le secret (en-tête X-Dutiva-Signature) — le format est documenté dans docs/INTEGRATIONS.md.', // [FR self-authored]
  },
  integ_webhook_regenerate: { en: 'Regenerate', fr: 'Régénérer' }, // [FR self-authored]
  integ_webhook_copy: { en: 'Copy', fr: 'Copier' }, // [FR self-authored]
  integ_webhook_copied: { en: 'Copied.', fr: 'Copié.' }, // [FR self-authored]
  integ_webhook_done: { en: 'Done', fr: 'Terminé' }, // [FR self-authored]
  integ_toast_webhook_created: {
    en: 'Endpoint created — copy the URL and signing secret now.',
    fr: 'Endpoint créé — copiez l’URL et le secret de signature maintenant.', // [FR self-authored]
  },
  integ_events_title: {
    en: 'Recent events',
    fr: 'Événements récents', // [FR self-authored]
  },
  integ_events_empty: {
    en: 'No deliveries yet — send a signed POST to the endpoint.',
    fr: 'Aucune livraison pour l’instant — envoyez un POST signé au endpoint.', // [FR self-authored]
  },
  integ_events_notified: {
    en: 'notified',
    fr: 'notifié', // [FR self-authored]
  },
  integ_events_stored: {
    en: 'stored',
    fr: 'enregistré', // [FR self-authored]
  },

  integ_provider_inbound_name: {
    en: 'Inbound email',
    fr: 'Courriel entrant', // [FR self-authored]
  },
  integ_provider_inbound_blurb: {
    en: 'Receive mail on a workspace address — no mailbox login needed.',
    fr: 'Recevez du courriel sur une adresse de l’espace de travail — aucune connexion à une boîte requise.', // [FR self-authored]
  },
  integ_email_create: {
    en: 'Create address',
    fr: 'Créer l’adresse', // [FR self-authored]
  },
  integ_email_address: {
    en: 'Workspace address',
    fr: 'Adresse de l’espace', // [FR self-authored]
  },
  integ_email_ready: {
    en: 'Your workspace address — send mail here to land it in Dutiva.',
    fr: 'Votre adresse d’espace de travail — envoyez du courriel ici pour le recevoir dans Dutiva.', // [FR self-authored]
  },
  integ_email_hint: {
    en: 'Mail sent to this address lands in the workspace and notifies admins. Attachments are listed, not stored.',
    fr: 'Le courriel envoyé à cette adresse arrive dans l’espace de travail et notifie les admins. Les pièces jointes sont listées, pas conservées.', // [FR self-authored]
  },
  integ_email_dns: {
    en: 'Delivery needs the inbound domain (MX records + Resend webhook) configured once — see docs/INTEGRATIONS.md.',
    fr: 'La réception exige le domaine entrant (enregistrements MX + webhook Resend) configuré une fois — voir docs/INTEGRATIONS.md.', // [FR self-authored]
  },
  integ_toast_address_created: {
    en: 'Address created.',
    fr: 'Adresse créée.', // [FR self-authored]
  },
  integ_mail_title: {
    en: 'Recent mail',
    fr: 'Courriels récents', // [FR self-authored]
  },
  integ_mail_empty: {
    en: 'No mail received yet — send a message to the address.',
    fr: 'Aucun courriel reçu pour l’instant — envoyez un message à l’adresse.', // [FR self-authored]
  },
})
