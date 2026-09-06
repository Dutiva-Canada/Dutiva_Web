import type { Bi } from '@/i18n/core'
import { commsMessages as M } from '@/i18n/messages/comms'
import type {
  CommsChannel,
  CommsContactType,
  CommsContentStatus,
  CommsCoverageSentiment,
  CommsDeliveryStatus,
  CommsDomain,
  CommsExecutionAction,
  CommsInitiativeStatus,
  CommsInitiativeType,
  CommsInteractionType,
  CommsIssueSeverity,
  CommsIssueStatus,
  CommsPolicyStage,
  CommsRiskLevel,
  CommsSourceType,
  CommsSubmissionStatus,
} from './data/types'

export const DOMAIN_LABEL: Record<CommsDomain, Bi> = {
  pr: M.comms_domain_pr,
  corporate: M.comms_domain_corporate,
  social: M.comms_domain_social,
  public_affairs: M.comms_domain_public_affairs,
  marketing: M.comms_domain_marketing,
  advertising: M.comms_domain_advertising,
  imc: M.comms_domain_imc,
}

export const INITIATIVE_TYPE_LABEL: Record<CommsInitiativeType, Bi> = {
  campaign: M.comms_initiative_type_campaign,
  programme: M.comms_initiative_type_programme,
  announcement: M.comms_initiative_type_announcement,
  policy_consultation: M.comms_initiative_type_policy_consultation,
  event: M.comms_initiative_type_event,
  issue_response: M.comms_initiative_type_issue_response,
  standalone: M.comms_initiative_type_standalone,
}

export const INITIATIVE_STATUS_LABEL: Record<CommsInitiativeStatus, Bi> = {
  planning: M.comms_status_planning,
  active: M.comms_status_active,
  paused: M.comms_status_paused,
  completed: M.comms_status_completed,
  cancelled: M.comms_status_cancelled,
}

export const RISK_LABEL: Record<CommsRiskLevel, Bi> = {
  low: M.comms_risk_low,
  medium: M.comms_risk_medium,
  high: M.comms_risk_high,
  critical: M.comms_risk_critical,
}

export const CONTENT_STATUS_LABEL: Record<CommsContentStatus, Bi> = {
  draft: M.comms_content_status_draft,
  in_review: M.comms_content_status_in_review,
  changes_requested: M.comms_content_status_changes_requested,
  approved: M.comms_content_status_approved,
  superseded: M.comms_content_status_superseded,
  withdrawn: M.comms_content_status_withdrawn,
}

export const DELIVERY_STATUS_LABEL: Record<CommsDeliveryStatus, Bi> = {
  not_queued: M.comms_delivery_status_not_queued,
  ready: M.comms_delivery_status_ready,
  scheduled: M.comms_delivery_status_scheduled,
  paused: M.comms_delivery_status_paused,
  sending: M.comms_delivery_status_sending,
  confirmed: M.comms_delivery_status_confirmed,
  failed: M.comms_delivery_status_failed,
  unknown: M.comms_delivery_status_unknown,
  cancelled: M.comms_delivery_status_cancelled,
}

export const ACTION_LABEL: Record<CommsExecutionAction, Bi> = {
  schedule: M.comms_action_schedule,
  unschedule: M.comms_action_unschedule,
  pause: M.comms_action_pause,
  resume: M.comms_action_resume,
  mark_sent: M.comms_action_mark_sent,
  mark_failed: M.comms_action_mark_failed,
  retry: M.comms_action_retry,
  reconcile: M.comms_action_reconcile,
  cancel: M.comms_action_cancel,
}

export const CHANNEL_LABEL: Record<CommsChannel, Bi> = {
  email: M.comms_channel_email,
  intranet: M.comms_channel_intranet,
  social_linkedin: M.comms_channel_social_linkedin,
  social_x: M.comms_channel_social_x,
  press_release: M.comms_channel_press_release,
  website: M.comms_channel_website,
  newsletter: M.comms_channel_newsletter,
  meeting: M.comms_channel_meeting,
  other: M.comms_channel_other,
}

export const CONTACT_TYPE_LABEL: Record<CommsContactType, Bi> = {
  media: M.comms_contact_type_media,
  institutional: M.comms_contact_type_institutional,
  partner: M.comms_contact_type_partner,
  creator: M.comms_contact_type_creator,
  audience: M.comms_contact_type_audience,
}

export const INTERACTION_TYPE_LABEL: Record<CommsInteractionType, Bi> = {
  inquiry: M.comms_engagement_inquiry,
  comment: M.comms_engagement_comment,
  dm: M.comms_engagement_dm,
  pitch: M.comms_engagement_pitch,
  meeting: M.comms_engagement_meeting,
  submission: M.comms_engagement_submission,
}

export const ISSUE_SEVERITY_LABEL: Record<CommsIssueSeverity, Bi> = {
  low: M.comms_risk_low,
  medium: M.comms_risk_medium,
  high: M.comms_risk_high,
  critical: M.comms_risk_critical,
}

export const ISSUE_STATUS_LABEL: Record<CommsIssueStatus, Bi> = {
  open: M.comms_interaction_status_open,
  monitoring: M.comms_interaction_status_pending,
  resolved: M.comms_interaction_status_responded,
  closed: M.comms_interaction_status_closed,
}

export const POLICY_STAGE_LABEL: Record<CommsPolicyStage, Bi> = {
  proposed: M.comms_policy_stage_proposed,
  enacted: M.comms_policy_stage_enacted,
  in_force: M.comms_policy_stage_in_force,
  consultation_open: M.comms_policy_stage_consultation_open,
  consultation_closed: M.comms_policy_stage_consultation_closed,
}

export const SOURCE_TYPE_LABEL: Record<CommsSourceType, Bi> = {
  official_notice: M.comms_source_type_official_notice,
  news: M.comms_source_type_news,
  social: M.comms_source_type_social,
  press_release: M.comms_source_type_press_release,
  internal: M.comms_source_type_internal,
  partner: M.comms_source_type_partner,
  manual: M.comms_source_type_manual,
}

export const SENTIMENT_LABEL: Record<CommsCoverageSentiment, Bi> = {
  positive: M.comms_sentiment_positive,
  neutral: M.comms_sentiment_neutral,
  negative: M.comms_sentiment_negative,
  mixed: M.comms_sentiment_mixed,
}

export const SUBMISSION_STATUS_LABEL: Record<CommsSubmissionStatus, Bi> = {
  planned: M.comms_submission_status_planned,
  submitted: M.comms_submission_status_submitted,
  recorded: M.comms_submission_status_recorded,
  withdrawn: M.comms_submission_status_withdrawn,
}
