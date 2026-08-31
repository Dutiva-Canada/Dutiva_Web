import type { PolicyEdition } from '../policyContent'

export default {
  title: 'SaaS Subscription Agreement',
  lastUpdated: 'June 1, 2026',
  effectiveDate: 'June 1, 2026',
  callout: [
    'This SaaS Subscription Agreement ("Agreement") governs subscriptions to Dutiva\'s platform between Dutiva Canada Inc. ("Dutiva") and the subscribing customer ("Customer"). By subscribing to a paid plan, Customer agrees to the terms of this Agreement, the Dutiva Terms of Service, the Privacy Policy, and (where applicable) the Data Processing Agreement, all of which are incorporated by reference.',
  ],
  sections: [
    {
      title: '1. Subscription and Access',
      blocks: [
        {
          type: 'p',
          text: 'Dutiva grants Customer a non-exclusive, non-transferable, limited right to access and use the Dutiva platform during the Subscription Term, subject to the usage limits, features, and restrictions of the selected plan.',
        },
        {
          type: 'p',
          text: "The specific features, usage limits, and pricing applicable to Customer's subscription are set out on the pricing page at dutiva.ca/pricing as of the date of subscription, or as set out in an Order Form executed between the parties for Enterprise subscriptions.",
        },
      ],
    },
    {
      title: '2. Subscription Term',
      blocks: [
        {
          type: 'p',
          text: 'Monthly subscriptions: The initial Subscription Term begins on the date of the first successful payment and continues for one calendar month. The Subscription Term renews automatically on the same date each month unless cancelled in accordance with the Refund and Cancellation Policy.',
        },
        {
          type: 'p',
          text: 'Annual subscriptions: The initial Subscription Term begins on the date of the first successful payment and continues for twelve months. The Subscription Term renews automatically on the anniversary of the start date unless cancelled in accordance with the Refund and Cancellation Policy.',
        },
      ],
    },
    {
      title: '3. Payment Terms',
      blocks: [
        {
          type: 'p',
          text: 'All fees are payable in Canadian dollars (CAD) before applicable taxes. Payment is due in advance at the start of each Subscription Term. Fees are processed through Stripe. Customer authorizes Dutiva to charge the payment method on file for all amounts due.',
        },
        {
          type: 'p',
          text: 'If a payment fails, Dutiva will notify Customer and provide a grace period to update payment information. Dutiva reserves the right to suspend access to the platform if outstanding amounts remain unpaid after reasonable notice.',
        },
        {
          type: 'p',
          text: "Applicable Canadian federal and provincial sales taxes (GST, HST, QST) will be added to fees based on Customer's billing address.",
        },
      ],
    },
    {
      title: '4. Auto-Renewal and Cancellation',
      blocks: [
        {
          type: 'p',
          text: 'Subscriptions renew automatically unless Customer cancels before the renewal date in accordance with the Refund and Cancellation Policy. Dutiva will send a reminder email before annual renewals.',
        },
        {
          type: 'p',
          text: 'Cancellation does not entitle Customer to a refund for the current paid period except as provided in the Refund and Cancellation Policy. Access continues until the end of the current Subscription Term, except where a refund is issued under that policy, in which case access ends on the refund date.',
        },
      ],
    },
    {
      title: '5. Usage Limits',
      blocks: [
        {
          type: 'p',
          text: 'Each plan includes defined monthly usage limits for Advisor messages, document generations, saved documents, exports, compliance reviews, and other features as set out on the pricing page. Usage resets at the start of each billing cycle. Unused entitlements do not carry over.',
        },
        {
          type: 'p',
          text: 'Dutiva reserves the right to enforce usage limits, throttle access at or above plan limits, and to require a plan upgrade to access additional capacity. Dutiva will provide reasonable notice before enforcing new limits on existing subscriptions.',
        },
      ],
    },
    {
      title: '6. Incorporated Documents',
      blocks: [
        {
          type: 'p',
          text: 'This Agreement incorporates by reference: the Dutiva Terms of Service (dutiva.ca/terms); the Privacy Policy (dutiva.ca/privacy); the Data Processing Agreement (dutiva.ca/data-processing-agreement); and the Acceptable Use Policy (dutiva.ca/acceptable-use). In the event of a conflict between this Agreement and the Terms of Service, the terms of this Agreement govern for enterprise subscriptions; the Terms of Service govern for standard subscriptions.',
        },
      ],
    },
    {
      title: '7. Enterprise Order Forms',
      blocks: [
        {
          type: 'p',
          text: 'Enterprise subscriptions may be governed by a separate Order Form executed between Dutiva and Customer. Order Forms set out plan pricing, term length, seat count, usage limits, custom support terms, and any other mutually agreed terms. Order Forms take precedence over this Agreement where they conflict.',
        },
        {
          type: 'p',
          text: 'To discuss an Enterprise subscription, contact support@dutiva.ca.',
        },
      ],
    },
    {
      title: '8. Disclaimer and Limitation of Liability',
      blocks: [
        {
          type: 'p',
          text: 'THE DUTIVA PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." DUTIVA DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS. THE PLATFORM DOES NOT PROVIDE LEGAL ADVICE. CUSTOMER IS SOLELY RESPONSIBLE FOR REVIEWING AND VERIFYING ALL GENERATED OUTPUTS BEFORE USE.',
        },
        {
          type: 'p',
          text: "DUTIVA'S TOTAL LIABILITY UNDER THIS AGREEMENT FOR ANY CLAIM ARISING OUT OF OR RELATED TO THE SUBSCRIPTION SHALL NOT EXCEED THE FEES PAID BY CUSTOMER IN THE TWELVE MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM. DUTIVA IS NOT LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.",
        },
      ],
    },
    {
      title: '9. Governing Law',
      blocks: [
        {
          type: 'p',
          text: 'This Agreement is governed by the laws of the Province of Ontario and the applicable federal laws of Canada. Any dispute arising under this Agreement shall be subject to the exclusive jurisdiction of the courts of Ontario.',
        },
      ],
    },
  ],
} satisfies PolicyEdition
