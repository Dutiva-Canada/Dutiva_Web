-- Provider delivery tracking for Dutiva Signature invite emails on recipients.
--
-- WHY: `last_invite_sent_at` records when we handed the message to Resend;
-- delivery verdicts (bounce, complaint, delay) arrive asynchronously via the
-- resend-webhook function. Same vocabulary as support_notifications (0018).
--
-- ROLLBACK:
--   drop index if exists hr_document_recipients_invite_undelivered_idx;
--   drop index if exists hr_document_recipients_invite_provider_msg_idx;
--   alter table public.hr_document_recipients
--     drop column if exists invite_delivery_updated_at,
--     drop column if exists invite_delivery_detail,
--     drop column if exists invite_delivery_status,
--     drop column if exists invite_provider_message_id,
--     drop column if exists last_invite_sent_at;

alter table public.hr_document_recipients
  add column if not exists last_invite_sent_at timestamptz,
  add column if not exists invite_provider_message_id text,
  add column if not exists invite_delivery_status text
    check (invite_delivery_status is null or invite_delivery_status in (
      'delivered', 'bounced', 'complained', 'delayed'
    )),
  add column if not exists invite_delivery_detail text,
  add column if not exists invite_delivery_updated_at timestamptz;

create index if not exists hr_document_recipients_invite_provider_msg_idx
  on public.hr_document_recipients (invite_provider_message_id)
  where invite_provider_message_id is not null;

create index if not exists hr_document_recipients_invite_undelivered_idx
  on public.hr_document_recipients (invite_delivery_status)
  where invite_delivery_status in ('bounced', 'complained');
