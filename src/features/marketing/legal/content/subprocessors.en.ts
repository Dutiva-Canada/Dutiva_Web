import type { PolicyEdition } from '../policyContent'

export default {
  "title": "Subprocessor List",
  "lastUpdated": "August 26, 2026",
  "effectiveDate": "June 1, 2026",
  "callout": [
    "Dutiva Canada Inc. (\"Dutiva\") uses third-party service providers (\"subprocessors\") to operate and improve the platform. This page lists the subprocessors we currently use, their purpose, the location of their data processing operations, and the categories of data they may access. This list is updated when we add or change subprocessors."
  ],
  "sections": [
    {
      "title": "1. Infrastructure and Hosting",
      "blocks": [
        {
          "type": "p",
          "text": "Supabase Inc. — Purpose: Database, authentication, file storage, and backend API infrastructure. Data processed: Account data, workspace data, generated documents, usage logs. Processing location: United States (AWS infrastructure; Canada region available and used where configured)."
        },
        {
          "type": "p",
          "text": "Vercel Inc. — Purpose: Frontend hosting, edge network delivery, and deployment infrastructure. Data processed: Web traffic, request metadata, static assets. Processing location: United States and global CDN edge nodes."
        }
      ]
    },
    {
      "title": "2. AI and Language Model Services",
      "blocks": [
        {
          "type": "p",
          "text": "DigitalOcean Gradient AI — Purpose: AI model routing and inference services powering Dutiva Advisor responses and document generation. Data processed: Advisor message text, jurisdiction context, selected template inputs, retrieved guidance context. Processing location: Toronto, Canada. Data submitted for inference is subject to the provider's data processing terms and is not used to train third-party foundation models under Dutiva's arrangement."
        }
      ]
    },
    {
      "title": "3. Payment Processing",
      "blocks": [
        {
          "type": "p",
          "text": "Stripe, Inc. — Purpose: Payment processing, subscription management, and billing portal. Data processed: Payment card data (stored and processed by Stripe; Dutiva does not store full card numbers), billing address, transaction records, subscription status. Processing location: United States."
        }
      ]
    },
    {
      "title": "4. Email and Transactional Communication",
      "blocks": [
        {
          "type": "p",
          "text": "Resend Inc. (or equivalent transactional email provider) — Purpose: Transactional email delivery including account verification, password reset, document notifications, billing receipts, and support communications. Data processed: Email address, message content, delivery metadata. Processing location: United States."
        }
      ]
    },
    {
      "title": "5. Error Monitoring",
      "blocks": [
        {
          "type": "p",
          "text": "Dutiva does not use a third-party error-tracking subprocessor (such as Sentry or Datadog). When the application encounters an error, a minimized report is sent to a Dutiva-operated function and stored in Dutiva's own database (Supabase, listed in Section 1). Each report is limited to a coarse error message, the route pattern, a release identifier, coarse browser and operating-system family, and locale — it carries no user, session, or authentication identifiers and no input content. Processing and storage follow the Supabase entry above."
        }
      ]
    },
    {
      "title": "6. Analytics",
      "blocks": [
        {
          "type": "p",
          "text": "First-party analytics are processed in-house. Help Centre and support-funnel events (searches, article views, helpfulness votes, and support ticket events) are sent to a Dutiva-operated edge function pinned to the Canada (ca-central-1) region and stored in Dutiva's own database (Supabase, Section 1). They carry a daily-rotated anonymous identifier or a workspace (organization) identifier, never an individual user identifier, and are not shared with any third-party analytics provider. These events are collected only after the visitor consents through the consent banner."
        },
        {
          "type": "p",
          "text": "Optional third-party website analytics: Google Analytics 4 (Google LLC — United States). Where used, GA4 loads only when a measurement ID is configured and the visitor has granted consent through the consent banner, with IP anonymization enabled. Where no measurement ID is configured, no website-analytics data is sent to Google."
        }
      ]
    },
    {
      "title": "7. Bot Protection and CAPTCHA",
      "blocks": [
        {
          "type": "p",
          "text": "To protect public forms (such as beta-signup and support requests) from spam and automated abuse, Dutiva may use a CAPTCHA / bot-protection provider: Cloudflare, Inc. (Cloudflare Turnstile) by default, or Intuition Machines, Inc. (hCaptcha) where configured. When enabled, the provider evaluates technical signals from the visitor's browser — including IP address and interaction signals — to distinguish humans from automated clients. This protection is engaged only on public submission forms and only when bot-protection keys are configured. Cloudflare may also provide DNS, network-security, and availability services where used. Processing location: United States and global edge network."
        },
        {
          "type": "p",
          "text": "TrustedSite (Halo Security) — Purpose: public-website security-scan trustmark. Data processed: visitor IP address and browser or device signals when the trustmark script loads on marketing pages. The signed-in workspace does not load this script. Processing location: United States."
        }
      ]
    },
    {
      "title": "8. Cross-Border Data Transfers",
      "blocks": [
        {
          "type": "p",
          "text": "Most of Dutiva's subprocessors are based in the United States. Personal data transferred to U.S.-based subprocessors is subject to U.S. law, including potential access by U.S. government authorities under applicable surveillance laws. We select subprocessors that maintain appropriate technical and contractual safeguards, including data processing agreements aligned with PIPEDA requirements."
        },
        {
          "type": "p",
          "text": "For Quebec residents: cross-border transfers of personal information are subject to requirements under Quebec Law 25 (Act Respecting the Protection of Personal Information in the Private Sector). We conduct privacy impact assessments for cross-border transfers where required and maintain documentation of transfer safeguards."
        }
      ]
    },
    {
      "title": "9. Subprocessor Changes",
      "blocks": [
        {
          "type": "p",
          "text": "Dutiva will update this list when subprocessors are added, changed, or removed. We aim to provide reasonable notice of material changes to our subprocessor list. Enterprise customers with data processing agreements may be entitled to specific notice periods as set out in their agreement."
        },
        {
          "type": "p",
          "text": "For questions about subprocessors or data transfers, contact privacy@dutiva.ca."
        }
      ]
    }
  ]
} satisfies PolicyEdition
