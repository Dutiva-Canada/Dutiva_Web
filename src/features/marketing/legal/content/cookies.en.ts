import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Cookie Policy',
  lastUpdated: 'August 26, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'Legal\nCookie Policy',
    'Dutiva uses strictly necessary cookies and browser storage to keep the website and application working. Dutiva does not use third-party advertising cookies or cross-site advertising trackers. Optional analytics, if enabled, are handled as described below.',
  ],
  sections: [
    {
      title: '1. What This Policy Covers',
      blocks: [
        {
          type: 'p',
          text: 'This Cookie Policy explains how Dutiva Canada Inc. ("Dutiva," "we," "us," or "our") uses cookies, local storage, session storage, and similar technologies on our website and application. These technologies store or read small pieces of information in your browser so the service can remember session, preference, security, and workflow state.',
        },
        {
          type: 'p',
          text: 'This Policy should be read together with our Privacy Policy.',
        },
      ],
    },
    {
      title: '2. Strictly Necessary Cookies and Storage',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva uses necessary cookies and browser storage to provide core service functions, including:',
        },
        {
          type: 'li',
          text: 'Authentication: Supabase session storage keeps you signed in and supports secure magic-link authentication.',
        },
        {
          type: 'li',
          text: 'Security and reliability: Infrastructure providers may use operational cookies, logs, and request metadata to route traffic, prevent abuse, maintain availability, and protect the service.',
        },
        {
          type: 'li',
          text: 'Public-site security trustmark: the marketing site loads TrustedSite (Halo Security) so visitors can see website security-scan status. That script may set cookies or similar storage on TrustedSite\'s domain. It is not loaded in the signed-in workspace and is not used for advertising.',
        },
        {
          type: 'li',
          text: 'Workflow continuity: In-browser state helps prevent disruption while you move through onboarding, document, Advisor, and workspace flows.',
        },
        {
          type: 'li',
          text: 'Billing and checkout: Stripe may use cookies or similar technologies when you access checkout, invoices, the billing portal, or related payment workflows.',
        },
        {
          type: 'li',
          text: 'Without necessary storage, account access, security features, billing workflows, and core application features may not work.',
        },
      ],
    },
    {
      title: '3. Preference Storage',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva stores preference values in browser storage so the interface remains usable across visits. Current examples include language, theme, onboarding context, workspace settings, and in-browser feature state.',
        },
        {
          type: 'p',
          text: 'Preference storage is not used for advertising, sale of personal information, or third-party marketing profiles.',
        },
      ],
    },
    {
      title: '4. Analytics',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva uses two kinds of analytics: first-party support analytics and optional third-party website analytics (Google Tag Manager / Google Analytics 4). Both are optional and off by default — nothing is collected until you accept analytics through the consent banner, and you can change your choice at any time from the "Cookie preferences" link in the footer. First-party support analytics (Help Centre searches, article views, helpfulness votes, and support ticket events) are sent to a Dutiva-operated edge function in Canada and do not use third-party cookies. These events carry a daily-rotated anonymous visitor identifier for Help Centre activity or the workspace (organization) identifier for authenticated ticket events, never an individual user identifier. Raw event data is retained for 90 days; daily aggregates are retained indefinitely.',
        },
        {
          type: 'p',
          text: 'Google Tag Manager, if enabled, loads only when a container ID is configured and the user has granted consent through the consent banner. Google Analytics 4 may then fire from that container, or load on its own when a measurement ID is configured and Tag Manager is not. Where analytics or similar optional technologies require consent, notice, or preference controls under applicable law, Dutiva will provide appropriate controls before using those technologies for that purpose.',
        },
        {
          type: 'li',
          text: 'Analytics are configured to minimize personal information, including IP anonymization, IP masking, or other privacy-preserving settings where supported.',
        },
        {
          type: 'li',
          text: 'Dutiva does not intentionally send sensitive document text, payment card numbers, social insurance numbers, medical records, bank details, or highly sensitive employee information in analytics events.',
        },
        {
          type: 'li',
          text: 'Analytics are not used for third-party advertising retargeting or cross-site marketing profiles.',
        },
      ],
    },
    {
      title: '5. Consent and Optional Technologies',
      blocks: [
        {
          type: 'p',
          text: 'Strictly necessary cookies and storage are used because they are required to deliver and secure the service. Optional analytics, marketing, tracking, profiling, or similar technologies are not required for core account access.',
        },
        {
          type: 'p',
          text: 'If Dutiva introduces optional technologies that collect personal information, identify or locate a person, perform profiling, or otherwise require consent or additional controls under applicable law, Dutiva will update this Policy and provide appropriate notice and controls before using them.',
        },
      ],
    },
    {
      title: '6. Marketing Cookies',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva does not currently use third-party advertising cookies, social media pixels, or cross-site marketing trackers. If we add optional marketing cookies later, we will update this Policy and provide appropriate notice and controls before using them.',
        },
      ],
    },
    {
      title: '7. Third-Party Providers',
      blocks: [
        {
          type: 'p',
          text: 'Our service providers may use cookies, browser storage, or similar technologies for operational purposes, including authentication, payment checkout, fraud prevention, hosting, performance, AI inference support, network security, and the public-site TrustedSite trustmark. These providers may include Supabase, Vercel, Stripe, Cloudflare, DigitalOcean Gradient AI, TrustedSite, and Google Tag Manager or Google Analytics if analytics are enabled.',
        },
        {
          type: 'p',
          text: 'Third-party providers process information according to their own terms and privacy notices when acting independently. When they act as Dutiva service providers, their processing is limited to the services they provide to Dutiva, subject to applicable contractual and legal requirements.',
        },
      ],
    },
    {
      title: '8. Your Controls',
      blocks: [
        {
          type: 'p',
          text: 'You can block, clear, or limit cookies and browser storage through your browser settings. If you clear required storage, you may be signed out and some preferences or in-progress workflows may reset.',
        },
        {
          type: 'p',
          text: 'Common browser controls include:',
        },
        {
          type: 'li',
          text: 'Chrome: Settings > Privacy and security > Delete browsing data.',
        },
        {
          type: 'li',
          text: 'Firefox: Settings > Privacy & Security > Cookies and Site Data.',
        },
        {
          type: 'li',
          text: 'Safari: Settings > Privacy > Manage Website Data.',
        },
        {
          type: 'li',
          text: 'Edge: Settings > Privacy, search, and services > Clear browsing data.',
        },
      ],
    },
    {
      title: '9. Retention',
      blocks: [
        {
          type: 'p',
          text: 'Session storage usually expires when your session expires, you log out, or your browser clears it. Preference storage remains until you change the preference, clear site data, or the application overwrites it. Infrastructure logs and analytics events are retained according to the applicable provider and Dutiva retention practices.',
        },
      ],
    },
    {
      title: '10. Changes to This Policy',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may update this Policy to reflect changes to the website, application, service providers, analytics configuration, legal requirements, or privacy practices. Material changes will be communicated through the website, application, email, or another reasonable method where required.',
        },
      ],
    },
    {
      title: '11. Contact',
      blocks: [
        {
          type: 'p',
          text: 'Questions about cookies, browser storage, or similar technologies can be sent to privacy@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
