# OA12 — Delete idle Google Calendar GCP project

Calendar sync for scheduled support calls was **deliberately abandoned** on
2026-08-07. Propose/confirm still works; customers just do not get an automatic
Google Calendar invite. See [SUPPORT_CALL_SCHEDULING.md](SUPPORT_CALL_SCHEDULING.md).

The abandoned setup left an **unused** Google Cloud project and service account.
Neither holds a JSON key or IAM roles, but the project is still an identity
surface and should be removed.

## Resources to delete

| Resource | ID |
| --- | --- |
| Project name | `dutiva-support-calendar` |
| Project ID | `sunny-mender-504801-m9` |
| Service account | `dutiva-calendar@sunny-mender-504801-m9.iam.gserviceaccount.com` |

## Owner steps (Google Cloud Console or gcloud)

Requires a Google account with **Project Deleter** (or org admin) on the
`dutiva.ca` organization.

### Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → project
   picker → **dutiva-support-calendar** (`sunny-mender-504801-m9`).
2. **IAM & Admin → Service Accounts** — confirm `dutiva-calendar@…` has no keys
   and no roles (expected).
3. **IAM & Admin → Settings → Shut down** — delete the project. Google holds
   it in a 30-day pending-deletion state, then purges it.

### gcloud (optional)

```bash
gcloud projects delete sunny-mender-504801-m9
```

## After deletion

- Record the date in `docs/TODO.md` OA12.
- No code changes required — `googleCalendar.ts` and edge functions already
  skip sync when Calendar secrets are unset.

## Do not do

- Grant `roles/orgpolicy.policyAdmin` to mint a service-account key for
  calendar invites (see OA12 rationale in TODO.md).
- Recreate the project unless revisiting D3 with Workload Identity Federation
  or a project **outside** the `dutiva.ca` org.
