# DigitalOcean support ticket — data-residency confirmation for Gradient serverless inference

**Status:** **Closed 2026-08-27** — ticket **#12739848**. Written reply filed in
[do-residency-confirmation-response-2026-08-27.md](do-residency-confirmation-response-2026-08-27.md).

**Why:** Five public legal documents state the Advisor's AI processing location as Toronto,
Canada. That claim rested on a July 2026 confirmation for the _previous_ model
(`mistral-3-14B` / Ministral 3 14B). Production moved to `deepseek-3.2` on 2026-07-26.
Renew the confirmation in writing before upgrading CANONICAL_FACTS §2 or any customer-facing
PIPEDA/residency language.

**Submit at:** [DigitalOcean support portal](https://cloudsupport.digitalocean.com) → **New
Ticket** → **Agentic Inference Cloud** → **Inference** → **Serverless Inference**.

**After sending:** Record the ticket ID and date in the tracking table below. File DO's
written reply in this folder as `do-residency-confirmation-response-YYYY-MM-DD.md` (or
attach PDF). Then update CANONICAL_FACTS §2, LEGAL_REVIEW_INVENTORY.md, and TODO.md OA9.

---

## Copy-paste ticket

**Subject:** Written confirmation of processing location (data residency) for Gradient serverless inference

**Body:**

Hello,

I operate a production workload on Gradient AI serverless inference for **Dutiva Canada
Inc.** (Federal CBCA corporation no. 1780679-5), a Canadian HR-compliance product
(dutiva.ca). Our API calls use the serverless endpoint `https://inference.do-ai.run/v1`.
Our privacy documentation and legal obligations under PIPEDA and Quebec's Law 25 depend on
where inference processing physically occurs, so I need the following confirmed **in
writing**:

1. **Processing location.** For DigitalOcean-hosted open-weight models served through
   serverless inference — specifically **`deepseek-3.2`**, which our production route now
   uses — in which datacenter region(s) does inference processing occur for our account's
   requests? We previously received confirmation (July 2026) that our inference ran in
   Toronto (TOR1); that confirmation covered our prior model (`mistral-3-14B` / Ministral
   3 14B). Please confirm whether the same applies to `deepseek-3.2`.

2. **Region guarantee.** Your public documentation lists TOR1 only for Dedicated Inference
   and BYOM, and the serverless endpoint has no region selector. Can serverless inference
   traffic for our account be constrained or pinned to Canadian datacenters (TOR1)? If yes,
   how is that configured and is it contractually guaranteed?

3. **Failover behaviour.** If TOR1 capacity is unavailable, does serverless inference for
   our account fail over to non-Canadian datacenters (e.g. NYC2, ATL1, RIC1), or does it
   queue/fail within region?

4. **Fallback option.** If serverless region pinning is not available or not guaranteeable
   in writing, please provide pricing and provisioning details for **Dedicated Inference in
   TOR1** capable of serving `deepseek-3.2` (or the closest available large open-weight
   model), so we can evaluate moving this workload to a guaranteed-residency deployment.

For clarity: we do not use any third-party proxied models (Anthropic/OpenAI commercial) on
this account for this workload — only DigitalOcean-hosted open-weight models — and our
data-privacy posture relies on your published statement that inputs/outputs are not stored
and not used for training.

Our related footprint in Toronto (`tor`) includes a DigitalOcean App Platform service
(`dutiva-attachment-scanner`) that processes customer attachment bytes; a single written
answer covering Gradient serverless inference and whether it shares the same residency
commitments would help our compliance documentation.

A written response we can reference in our compliance documentation would be greatly
appreciated.

Thank you,

Martin Constantineau  
Founder & CEO, Dutiva Canada Inc.  
support@dutiva.ca · 1 (800) 349-0297  
2967 Dundas St. W., Suite 1485, Toronto, ON M6P 1Z2

---

## Tracking

| Field | Value |
| --- | --- |
| Prepared | 2026-07-26 |
| Finalized for send | 2026-08-27 |
| Sent date | 2026-08-27 |
| Ticket ID | [#12739848](https://cloudsupport.digitalocean.com) |
| Topic | Agentic Inference Cloud → Inference → Serverless Inference |
| DO reply date | 2026-08-27 |
| Outcome | **Serverless not pinable** — processing in CA, US, or NL; likely TOR1 for Toronto callers; failover to US/NL. **Dedicated TOR1** required for Canada-only. Pricing via Control Panel / Customer Success. Subprocessors updated; production routing unchanged until owner chooses Dedicated. |

---

## Internal note (do not paste into ticket)

- The subprocessors list stated the Advisor's AI processing location as
  **Toronto, Canada** — **revised 2026-08-27** to CA / US / NL per ticket
  #12739848. That claim was load-bearing: Toronto-in-Canada would mean no
  PIPEDA cross-border transfer for inference alone; serverless routing outside
  Canada requires the disclosed cross-border language (Law 25 out-of-Quebec
  communication for QC residents remains in other legal pages).
- DO's public docs (checked 2026-07-26): serverless inference is a single global endpoint
  with no published region guarantee; the availability table lists TOR1 for Dedicated
  Inference/BYOM only; their data-privacy page states DO-hosted model inference happens on
  DO infrastructure with no storage of inputs/outputs and no training use.
- If DO will not confirm in writing: options are (a) Dedicated Inference TOR1 (guaranteed,
  higher fixed cost), or (b) revise the legal docs' location language to match what DO will
  actually commit to. Decision is Martin's; no legal-doc changes until the reply lands.
- On-device / customer-LAN inference is a **separate** product question (privacy SKU, not
  residency of Gradient). See [LOCAL_INFERENCE.md](LOCAL_INFERENCE.md). Dedicated TOR1 is
  still Dutiva-operated cloud; do not describe it as local.
