# Draft — DigitalOcean support ticket: data-residency confirmation for Gradient serverless inference

*Prepared 2026-07-26 for Martin Constantineau to send via the DigitalOcean support portal
(Support → New ticket, category: Gradient AI / Serverless Inference). Not sent by the assistant.
Replace the bracketed placeholders before sending.*

---

**Subject:** Written confirmation of processing location (data residency) for Gradient serverless inference

Hello,

I operate a production workload on Gradient AI serverless inference (account: [account email / team name],
API endpoint `https://inference.do-ai.run/v1`) for a Canadian HR-compliance product. Our privacy
documentation and legal obligations under PIPEDA and Quebec's Law 25 depend on where inference
processing physically occurs, so I need the following confirmed **in writing**:

1. **Processing location.** For DigitalOcean-hosted open-weight models served through serverless
   inference — specifically `deepseek-3.2`, which our production route now uses — in which
   datacenter region(s) does inference processing occur for our account's requests? We previously
   received confirmation (July 2026) that our inference ran in Toronto (TOR1); that confirmation
   covered our prior model (`mistral-3-14B` / Ministral 3 14B). Please confirm whether the same
   applies to `deepseek-3.2`.

2. **Region guarantee.** Your public documentation lists TOR1 only for Dedicated Inference and
   BYOM, and the serverless endpoint has no region selector. Can serverless inference traffic for
   our account be constrained or pinned to Canadian datacenters (TOR1)? If yes, how is that
   configured and is it contractually guaranteed?

3. **Failover behaviour.** If TOR1 capacity is unavailable, does serverless inference for our
   account fail over to non-Canadian datacenters (e.g. NYC2, ATL1, RIC1), or does it queue/fail
   within region?

4. **Fallback option.** If serverless region pinning is not available or not guaranteeable in
   writing, please provide pricing and provisioning details for **Dedicated Inference in TOR1**
   capable of serving `deepseek-3.2` (or the closest available large open-weight model), so we can
   evaluate moving this workload to a guaranteed-residency deployment.

For clarity: we do not use any third-party proxied models (Anthropic/OpenAI commercial) on this
account for this workload — only DigitalOcean-hosted open-weight models — and our data-privacy
posture relies on your published statement that inputs/outputs are not stored and not used for
training.

A written response we can reference in our compliance documentation would be greatly appreciated.

Thank you,
[Name]
[Company / account details]

---

## Why this matters (internal note, do not paste)

- Five public legal documents (ai-technology, privacy, cookies, data-processing-agreement,
  subprocessors) state the Advisor's AI processing location as **Toronto, Canada**. That claim is
  load-bearing: Toronto-in-Canada means no PIPEDA cross-border transfer; outside-Quebec means a
  Law-25 out-of-Quebec communication for QC residents (already disclosed).
- The claim currently rests on the July 2026 confirmation obtained for the previous model. The
  model changed to `deepseek-3.2` on 2026-07-26; the confirmation should be renewed to cover it.
- DO's public docs (checked 2026-07-26): serverless inference is a single global endpoint with no
  published region guarantee; the availability table lists TOR1 for Dedicated Inference/BYOM only;
  their data-privacy page states DO-hosted model inference happens on DO infrastructure with no
  storage of inputs/outputs and no training use.
- If DO will not confirm in writing: options are (a) Dedicated Inference TOR1 (guaranteed, higher
  fixed cost), or (b) revise the legal docs' location language to match what DO will actually
  commit to. Decision is Martin's; no legal-doc changes have been made.
- On-device / customer-LAN inference is a **separate** product question (privacy SKU, not
  residency of Gradient). Cost, fit, and phasing: [LOCAL_INFERENCE.md](LOCAL_INFERENCE.md).
  Dedicated TOR1 is still Dutiva-operated cloud; do not describe it as local.
