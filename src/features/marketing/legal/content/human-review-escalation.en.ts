import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Human Review Escalation Policy',
  lastUpdated: 'July 15, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    "This policy defines when AI-generated outputs on the Dutiva platform are reviewed by Dutiva personnel or flagged for human attention, the criteria that trigger review, the standards applied, response timelines, and how users are notified. This policy is part of Dutiva's responsible AI use framework.",
  ],
  sections: [
    {
      title: '1. Purpose of Human Review',
      blocks: [
        {
          type: 'p',
          text: "Dutiva's AI features — including Dutiva Advisor and the document generator — are designed to operate autonomously in most situations. However, Dutiva recognizes that AI outputs can cause harm if they are factually wrong, biased, unsafe, or used to make high-risk employment decisions without qualified review.",
        },
        {
          type: 'p',
          text: 'This policy establishes how Dutiva identifies, escalates, and reviews outputs that may require human attention, and how users can request review where they believe an output is problematic.',
        },
      ],
    },
    {
      title: '2. Automatic Escalation Triggers',
      blocks: [
        {
          type: 'p',
          text: "The following types of content or interactions may trigger automatic escalation to Dutiva's content or safety review queue:",
        },
        {
          type: 'li',
          text: 'Advisor responses or generated content that contains potential safety concerns, including references to self-harm, workplace violence, or emergency situations.',
        },
        {
          type: 'li',
          text: 'Content flagged by automated safety classifiers as potentially harmful, discriminatory, or outside the scope of HR compliance guidance.',
        },
        {
          type: 'li',
          text: 'Repeated user feedback signals indicating that a particular type of Advisor response or template output is consistently incorrect, unhelpful, or potentially harmful.',
        },
        {
          type: 'li',
          text: 'Attempted use of the platform for purposes that fall outside the permitted scope of the Acceptable Use Policy, as detected by platform monitoring.',
        },
      ],
    },
    {
      title: '3. User-Initiated Escalation',
      blocks: [
        {
          type: 'p',
          text: 'Users can request human review of a specific AI output at any time by:',
        },
        {
          type: 'li',
          text: 'Using the feedback or flag mechanism within the Advisor interface (where available) to mark a response as incorrect, harmful, or unhelpful.',
        },
        {
          type: 'li',
          text: "Emailing support@dutiva.ca with the subject line 'AI Output Review Request', including a description of the output you believe is problematic and why. Do not include sensitive personal data beyond what is necessary to describe the issue.",
        },
      ],
    },
    {
      title: '4. Review Standards',
      blocks: [
        {
          type: 'p',
          text: "Human review of escalated AI outputs is conducted by Dutiva personnel with appropriate knowledge of Canadian HR compliance, employment standards, and the platform's intended use cases. Reviewers apply the following standards:",
        },
        {
          type: 'li',
          text: 'Is the output factually correct with respect to applicable Canadian employment standards, privacy law, or HR guidance?',
        },
        {
          type: 'li',
          text: 'Is the output free from discriminatory language, harmful assumptions, or content that could be used to harm employees or circumvent employment law?',
        },
        {
          type: 'li',
          text: 'Is the output within the scope of general HR compliance guidance rather than specific legal advice?',
        },
        {
          type: 'li',
          text: "Is the output consistent with Dutiva's Acceptable Use Policy, AI Usage Disclosure, and AI Risk Disclosure Framework?",
        },
      ],
    },
    {
      title: '5. Response Timelines',
      blocks: [
        {
          type: 'p',
          text: 'Safety-flagged content (potential harm, violence, or emergency): reviewed within 24 hours of detection.',
        },
        {
          type: 'p',
          text: 'User-submitted review requests classified as P1 (content causing or at risk of causing immediate harm): reviewed within 1 business day.',
        },
        {
          type: 'p',
          text: 'User-submitted review requests classified as P2 (factual accuracy concern, non-emergency): reviewed within 3 business days.',
        },
        {
          type: 'p',
          text: 'Systematic output quality reviews triggered by repeated feedback signals: reviewed within the next scheduled content review cycle (at minimum monthly).',
        },
      ],
    },
    {
      title: '6. User Notification',
      blocks: [
        {
          type: 'p',
          text: 'Where a user submits a review request, Dutiva will acknowledge receipt by email within 2 business days and provide an update upon completion of the review. If the review identifies a material error in guidance content, Dutiva will update the relevant content and may proactively communicate the update to affected users where practicable.',
        },
        {
          type: 'p',
          text: 'For automatically escalated content, users may not be notified unless the review results in a platform change, account action, or content update that affects them.',
        },
      ],
    },
    {
      title: '7. Limitations of This Policy',
      blocks: [
        {
          type: 'p',
          text: "This policy governs Dutiva's internal review processes. It does not guarantee that every AI output error will be caught, escalated, or corrected. Users remain responsible for reviewing all AI-generated outputs before use and for seeking qualified professional advice for high-risk employment decisions.",
        },
        {
          type: 'p',
          text: 'For questions about this policy, contact support@dutiva.ca.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
