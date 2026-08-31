import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Cross-Border Data Transfer Disclosure',
  lastUpdated: 'August 26, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'Dutiva Canada Inc. operates a platform that relies on third-party cloud infrastructure and services, most of which are based in the United States. This disclosure explains which personal information is transferred outside Canada, why, what safeguards apply, and what rights you have in connection with those transfers.',
  ],
  sections: [
    {
      title: '1. What Data Is Transferred and Where',
      blocks: [
        {
          type: 'p',
          text: 'The following categories of personal data may be transferred to subprocessors located outside Canada, primarily in the United States:',
        },
        {
          type: 'li',
          text: 'Account data (email address, name, account metadata): processed by Supabase Inc. (United States) for authentication, database storage, and API operations.',
        },
        {
          type: 'li',
          text: 'Workspace and document data (company name, jurisdiction, document inputs, generated documents): stored by Supabase Inc. (United States); delivered by Vercel Inc. (United States and global CDN).',
        },
        {
          type: 'li',
          text: 'Billing information (billing address, subscription status, transaction records): processed by Stripe, Inc. (United States). Full payment card numbers are stored by Stripe, not Dutiva.',
        },
        {
          type: 'li',
          text: "Error telemetry (coarse error message, route pattern, release identifier, coarse browser and operating-system family; no user, session, or authentication identifiers and no input content): stored by Supabase Inc. (United States) in Dutiva's own error-reporting table. Dutiva does not use a third-party error-tracking service.",
        },
        {
          type: 'li',
          text: 'Public-website security-scan signals (visitor IP address and browser or device signals on marketing pages): processed by TrustedSite / Halo Security (United States) when the trustmark script loads. The signed-in workspace does not load this script.',
        },
      ],
    },
    {
      title: '2. Safeguards for Cross-Border Transfers',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva takes the following steps to protect personal information transferred outside Canada:',
        },
        {
          type: 'li',
          text: 'Contractual safeguards: We enter into data processing agreements with our subprocessors that impose obligations to protect personal information consistent with Canadian privacy law standards.',
        },
        {
          type: 'li',
          text: 'Encryption: All data transfers use TLS encryption in transit. Data at rest is encrypted by our infrastructure providers using AES-256.',
        },
        {
          type: 'li',
          text: "Minimization: We transfer only the personal data necessary for each subprocessor's specific function.",
        },
        {
          type: 'li',
          text: 'Vendor assessment: We review the security and privacy practices of subprocessors before use and on an ongoing basis.',
        },
      ],
    },
    {
      title: '3. PIPEDA and Cross-Border Transfers',
      blocks: [
        {
          type: 'p',
          text: 'Under PIPEDA, Dutiva remains accountable for personal information transferred to third-party service providers for processing, including transfers outside Canada. Dutiva uses contractual means to require our subprocessors to provide a comparable level of protection to the information.',
        },
        {
          type: 'p',
          text: 'Personal information transferred to U.S. service providers is subject to U.S. law, including potential access by U.S. government authorities under applicable laws. We make this disclosure in accordance with our obligation under PIPEDA to inform users of this risk before or at the time of collection.',
        },
      ],
    },
    {
      title: '4. Quebec Law 25 Requirements',
      blocks: [
        {
          type: 'p',
          text: 'For Quebec residents, the Act Respecting the Protection of Personal Information in the Private Sector (Law 25) requires that Dutiva conduct a privacy impact assessment (PIA) before communicating personal information outside Quebec, and that we ensure the information will receive adequate protection.',
        },
        {
          type: 'p',
          text: 'Dutiva has conducted PIAs for its primary cross-border data flows to Supabase, Vercel, and Stripe and maintains documentation of these assessments. The results are used to implement appropriate safeguards and to inform this disclosure.',
        },
        {
          type: 'p',
          text: 'Quebec residents have the right to request information about the protection of their personal information following a cross-border transfer. Contact privacy@dutiva.ca for more information.',
        },
      ],
    },
    {
      title: '5. Your Rights',
      blocks: [
        {
          type: 'p',
          text: 'You have the right to access the personal information Dutiva holds about you, to request corrections, and to request deletion, subject to applicable legal limitations. See the Privacy Policy and the User Data Deletion Procedures for how to exercise these rights.',
        },
        {
          type: 'p',
          text: 'For questions about cross-border data transfers, contact privacy@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
