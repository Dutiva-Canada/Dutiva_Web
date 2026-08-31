import type { PolicyEdition } from '../policyContent'

export default {
  title: 'User Data Deletion Procedures',
  lastUpdated: 'June 1, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'Dutiva Canada Inc. provides users with the right to request deletion of their personal information in accordance with PIPEDA, Quebec Law 25, and our Privacy Policy. This document describes the process for requesting deletion, how Dutiva verifies requests, what data is deleted, what data may be retained for legal reasons, and the technical deletion process.',
  ],
  sections: [
    {
      title: '1. How to Request Deletion',
      blocks: [
        {
          type: 'p',
          text: "To request deletion of your personal information, email privacy@dutiva.ca with the subject line 'Deletion Request'. Include your full name and the email address associated with your Dutiva account. You may also specify whether you are requesting deletion of all personal data or a specific category of data.",
        },
        {
          type: 'p',
          text: 'Alternatively, users can initiate account deletion by cancelling their subscription and requesting deletion from the account settings where available, or by emailing privacy@dutiva.ca. Account cancellation alone does not trigger immediate deletion; a separate deletion request is required if you want data removed before the 30-day post-cancellation retention window expires.',
        },
      ],
    },
    {
      title: '2. Identity Verification',
      blocks: [
        {
          type: 'p',
          text: 'To protect against unauthorized deletion requests, Dutiva verifies the identity of the requestor before processing deletion. Verification is performed by confirming that the request comes from the email address on the account or by requesting additional identifying information where the account email cannot be verified.',
        },
        {
          type: 'p',
          text: 'Dutiva will acknowledge your deletion request within 5 business days. If we cannot verify your identity, we will contact you to request additional information. We will not process a deletion request we cannot verify.',
        },
      ],
    },
    {
      title: '3. Scope of Deletion',
      blocks: [
        {
          type: 'p',
          text: "A full deletion request will result in deletion of the following data associated with your account: account credentials and profile data; workspace configuration and preferences; generated documents and document history; Advisor conversation logs; billing history and payment method references (payment card data is stored by Stripe and subject to Stripe's data deletion terms); usage logs attributable to your account; and support communications except where retention is required.",
        },
        {
          type: 'p',
          text: 'Deletion does not extend to: anonymized or aggregated data that cannot be attributed to you; data we are required to retain for legal, tax, accounting, or audit purposes; or records of transactions that must be maintained under applicable financial regulations.',
        },
      ],
    },
    {
      title: '4. Deletion Timeline',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva will complete the deletion of your personal data within 30 days of receiving a verified deletion request. In complex cases, we may require up to 60 days and will notify you of the extension with an explanation.',
        },
        {
          type: 'p',
          text: 'Following deletion, residual copies of your data may remain in encrypted backup archives for up to an additional 30 days before those backups are purged in the normal rotation cycle. These residual copies are not accessible in the ordinary course of platform operations.',
        },
      ],
    },
    {
      title: '5. Legal Retention Obligations',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva may be required to retain certain data despite a deletion request in order to: comply with applicable law (including tax law, financial regulations, or audit requirements); maintain records required by our regulators; respond to ongoing legal proceedings, regulatory investigations, or formal legal demands; enforce our agreements; or prevent fraud or protect the security of the platform.',
        },
        {
          type: 'p',
          text: 'Where we retain data for legal reasons, we will notify you of this in our response to your deletion request and explain what is being retained and why, to the extent we are permitted to do so.',
        },
      ],
    },
    {
      title: '6. Technical Deletion Process',
      blocks: [
        {
          type: 'p',
          text: "Data deletion is implemented as a cascading deletion across Dutiva's database tables, file storage, and related records. Primary database records are deleted by hard deletion (not soft deletion) following verification. File storage objects (such as exported documents stored server-side) are purged from the storage bucket.",
        },
        {
          type: 'p',
          text: 'Where data has been shared with subprocessors (for example, AI API providers for processing, or Stripe for billing), we notify relevant subprocessors of the deletion where we have a contractual basis to do so, and request deletion of associated records where applicable.',
        },
      ],
    },
    {
      title: '7. Complaints',
      blocks: [
        {
          type: 'p',
          text: "If you are unsatisfied with our response to a deletion request, you may file a complaint with the Office of the Privacy Commissioner of Canada (OPC) at priv.gc.ca. Quebec residents may also file a complaint with the Commission d'accès à l'information (CAI) at cai.gouv.qc.ca.",
        },
        {
          type: 'p',
          text: 'For questions about data deletion, contact privacy@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
