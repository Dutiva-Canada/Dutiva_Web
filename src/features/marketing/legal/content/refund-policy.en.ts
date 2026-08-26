import type { PolicyEdition } from '../policyContent'

export default {
  title: 'Refund and Cancellation Policy',
  lastUpdated: 'August 26, 2026',
  effectiveDate: 'July 23, 2026',
  callout: [
    'This Refund and Cancellation Policy explains how to cancel a Dutiva subscription, what happens to your data and access after cancellation, refund eligibility criteria, prepaid Advisor reply packs, and how to reactivate your account. This policy applies to all paid Dutiva subscription plans and to optional prepaid Advisor reply packs.',
  ],
  sections: [
    {
      title: '1. How to Cancel',
      blocks: [
        {
          type: 'p',
          text: "To cancel your subscription, open the billing portal — from the Pricing page, select 'Manage billing' under Your plan. In the portal you can manage or cancel your subscription. Your cancellation takes effect at the end of your current billing period, and you will receive a confirmation email at the address on your account.",
        },
        {
          type: 'p',
          text: "You can also cancel by emailing support@dutiva.ca from the email address associated with your account with 'Cancel Subscription' in the subject line. Include your account email and confirm that you wish to cancel. We process email cancellation requests within 2 business days.",
        },
      ],
    },
    {
      title: '2. Access After Cancellation',
      blocks: [
        {
          type: 'p',
          text: 'Your access to paid Dutiva features remains active until the end of your current billing period (the date your subscription would next renew). You will not be charged again after your cancellation is processed.',
        },
        {
          type: 'p',
          text: 'After the billing period ends, your account is downgraded to the free tier. You can still sign in but will have limited access consistent with the free plan limits.',
        },
        {
          type: 'p',
          text: 'If an annual refund is issued (see Section 5), your paid access instead ends on the refund date rather than at the end of the billing period.',
        },
      ],
    },
    {
      title: '3. Data Retention After Cancellation',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva retains your account data, workspace data, and generated documents for 30 days after your subscription end date (the end of your paid period). During this period, you can sign in and export any documents you want to keep.',
        },
        {
          type: 'p',
          text: 'After 30 days, your data is scheduled for permanent deletion in accordance with our Data Retention and Deletion Policy. Some data may be retained longer where required by law. We strongly recommend exporting all documents you wish to retain before your subscription ends.',
        },
        {
          type: 'p',
          text: 'If you need more time to export your data, contact support@dutiva.ca before the 30-day window expires. We can extend the retention window in limited circumstances.',
        },
      ],
    },
    {
      title: '4. Refund Eligibility — Monthly Plans',
      blocks: [
        {
          type: 'p',
          text: 'Monthly subscriptions are generally non-refundable after the billing date. We do not provide partial-month refunds when you cancel partway through a billing cycle.',
        },
        {
          type: 'p',
          text: 'Exceptions may be made where there is a documented billing error (for example, a duplicate charge or an incorrect amount), or where a service outage on our side prevented access to the core platform for more than 24 consecutive hours. To request a refund exception, email support@dutiva.ca with supporting details within 14 days of the billing date.',
        },
      ],
    },
    {
      title: '5. Refund Eligibility — Annual Plans',
      blocks: [
        {
          type: 'p',
          text: 'New annual subscriptions include a 14-day money-back guarantee: if you cancel and request a refund within 14 days of your initial purchase, you receive a full refund.',
        },
        {
          type: 'p',
          text: 'After the initial 14-day window, you are eligible for a prorated refund based on the number of unused days remaining in your annual term, less a processing fee, when you cancel and request the refund by contacting support@dutiva.ca.',
        },
        {
          type: 'p',
          text: 'When a refund is issued, your paid access ends and your account is downgraded to the free tier as of the refund date. Annual renewals are non-refundable once 14 days have passed since the renewal date.',
        },
      ],
    },
    {
      title: '6. Downgrades',
      blocks: [
        {
          type: 'p',
          text: "You can downgrade your plan at any time from the billing portal (open it from the Pricing page under Your plan > Manage billing). Downgrades take effect at the end of the current billing period. You will retain access to your current plan's features until the period ends.",
        },
        {
          type: 'p',
          text: 'If a downgrade reduces your saved document limit, export limit, or other usage limits below your current usage, review your documents and export any you need before the downgrade takes effect.',
        },
      ],
    },
    {
      title: '7. Reactivation',
      blocks: [
        {
          type: 'p',
          text: 'You can reactivate your subscription by signing in and choosing a plan from the billing portal (open it from the Pricing page under Your plan > Manage billing) or by contacting support@dutiva.ca. Billing resumes on the reactivation date.',
        },
        {
          type: 'p',
          text: 'If you reactivate within 30 days of your subscription end date, your previous workspace, documents, and settings are restored. After 30 days, your previous workspace is no longer available for restoration (see Section 3), so reactivation starts a new workspace with no history on your existing account. Contact support@dutiva.ca before reactivating if you have questions about data recovery.',
        },
      ],
    },
    {
      title: '8. Consumer Protection',
      blocks: [
        {
          type: 'p',
          text: 'This policy is intended to comply with applicable Canadian consumer protection legislation, including the Consumer Protection Act (Ontario) and the Consumer Protection Act (Quebec). If you believe you have rights under consumer protection law that are not addressed in this policy, please contact support@dutiva.ca.',
        },
      ],
    },
    {
      title: '9. Prepaid Advisor Reply Packs',
      blocks: [
        {
          type: 'p',
          text: 'Prepaid Advisor reply packs are an optional one-time purchase. They are not a subscription plan feature. Unused pack replies are not refunded as cash, in the same way unused time on a monthly subscription is not refunded as cash when you cancel.',
        },
        {
          type: 'p',
          text: 'Where there is a documented billing error (for example a duplicate charge), email support@dutiva.ca within 14 days of the charge. Remaining pack replies stay on the account until used.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
