# Local inference for the Advisor — decision record

**Status: undecided.** Written 2026-08-26 so the owner can choose later
without re-deriving the architecture. This is an internal product/engineering
record, not public copy. Do not quote it in marketing, legal pages, or
investor materials as a shipped capability.

**Recommended default until a decision says otherwise:** keep DigitalOcean
Gradient serverless (`deepseek-3.2`) as the Advisor completion path. Do not
build in-browser WebGPU, an OS-model desktop shell, or a Dutiva Local Runtime
as the default Advisor. If the live issue is _where DigitalOcean runs_, that
is OA9 (residency), not local inference.

Read alongside:

- [`AI_USAGE_STRATEGY.md`](AI_USAGE_STRATEGY.md) — LLM only for open-ended
  language; retrieval, documents, notice math stay deterministic.
- [`do-residency-confirmation-request.md`](do-residency-confirmation-request.md)
  — open Gradient processing-location question (OA9).
- [`CANONICAL_FACTS.md`](CANONICAL_FACTS.md) — plan prices, Advisor reply
  packs, and claims that must not be made (including PIPEDA).
- [`ASSESSMENT/IP_AND_DATA_BOUNDARY.md`](../ASSESSMENT/IP_AND_DATA_BOUNDARY.md)
  — the guidance corpus and prompts are Dutiva IP.

The code outranks this file. Current completion path:
`supabase/functions/advisor-chat/index.ts` → `ai_model_routes` /
`ai_model_providers` → OpenAI-compatible `POST {base_url}/chat/completions`.

---

## 1. The question this answers

Can customers use a local model without first downloading it themselves, and
without using the cloud?

**Short answers**

| Question                                          | Answer                                                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Zero bytes on their machine **and** no cloud?     | **No.** Physics.                                                                                                           |
| Invisible acquisition (no Ollama, no GGUF hunt)?  | **Yes.** Browser cache, OS-shipped model, installer, or LAN appliance.                                                     |
| Compatible with DigitalOcean Gradient?            | **Complementary, not integrated.** Gradient cannot run on-device. Dedicated Inference TOR1 is still Dutiva-operated cloud. |
| Replace today’s Advisor with on-device inference? | **Not as the default.** Quality, grounding, metering, and bilingual HR bar do not survive a 1–4B browser model.            |
| Implementable in this repo if we later choose to? | **Yes in layers** — see §8. A provider swap is days. A Local Runtime is a product line.                                    |

---

## 2. Physics — where weights can live

Inference runs where the weights are. There is no fifth location.

| Location                                        | Customer “downloads a model”?                     | Prompt leaves their premises?    | Who pays the GPU?             |
| ----------------------------------------------- | ------------------------------------------------- | -------------------------------- | ----------------------------- |
| A. Customer device (browser, OS, helper)        | Automatic or OS-managed, still bytes on disk/VRAM | No (unless you also call Dutiva) | Customer electricity / NPU    |
| B. Customer LAN / appliance                     | IT installs once for the org                      | No external cloud                | Customer (or a GPU they rent) |
| C. Dutiva server (Gradient, Dedicated, Droplet) | No                                                | Yes — Dutiva’s provider          | Dutiva                        |
| D. Third-party API                              | No                                                | Yes                              | Dutiva                        |

“The browser cached it” is still A. “Apple/Windows already had a model” is
still A. “Dedicated Inference in TOR1” is still C.

---

## 3. What the Advisor actually is today

Advisor is not a chat widget. A turn currently does all of the following:

1. Authenticate the user (Supabase JWT).
2. **Claim** commercial + abuse usage (`claim_ai_usage`) _before_ the model
   call — 80 included replies / calendar month UTC, then packs, then optional
   overage. Abuse rails (burst, 120 req/day, 250k tokens/day, platform 2,000)
   are never for sale. See `src/config/advisorUsage.ts` and
   `supabase/functions/_shared/aiUsage.ts`.
3. Retrieve curated chunks from Postgres (`advisor_guidance_chunks`).
4. Inject the **server-side** system prompt, current-time line, notice
   schedule, and selected memory facts.
5. Call Gradient with the last 20 messages; default `max_tokens` 800.
6. Finalize telemetry (`ai_telemetry_events` — provider, model, tokens,
   latency, status; **not** message bodies).
7. Persist the turn; the client renders Markdown + the deterministic
   `advisor_response` payload (risk, citations, gates).

Documents, citations, notice math, crisis resources, and triage stay
**off** the model. Moving only step 5 off-cloud does not make the product
“fully local.” Moving steps 3–4 to the device either ships proprietary
corpus/prompt IP to every laptop or stops being fully local.

A fully client-local completion also **never hits the usage ledger** unless
you invent a new trust model. Do not assume packs/overage keep working.

---

## 4. Options (capability vs Dutiva fit)

| Option                                                                                                 | Manual download?                                                  | Leaves device?                                                        | Call from dutiva.ca?                                                                                | Fit as **the** Advisor                                   | Notes                                                                                                                              |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Browser WebGPU (WebLLM, Transformers.js, ONNX Runtime Web)                                             | No — first visit still fetches 0.5–5 GB, then IndexedDB/Cache API | No after cache                                                        | Yes                                                                                                 | **Prototype / non-legal draft only**                     | Practical ceiling ~1–4B on ordinary laptops; 7–8B needs high-end VRAM. WebGPU is uneven on locked-down corporate browsers and iOS. |
| OS model (Apple Foundation Models ~3B; Windows AI / Phi Silica → Aion Instruct from 2026-11-24 retail) | Usually no; OS distributes                                        | On-device yes. Apple **Private Cloud Compute is still Apple’s cloud** | **No** — needs a signed native or Electron/Tauri shell                                              | Future provider inside a desktop runtime                 | Hardware-gated (Apple Intelligence devices; Copilot+ NPU or listed GPUs). Too small to own statute-aware bilingual dialogue.       |
| Dutiva Local Runtime (installer + localhost OpenAI API)                                                | One component, not “a GGUF”                                       | No                                                                    | Web app talks to localhost or via `advisor-chat`                                                    | **Best true-local SKU**, later                           | New product: updates, GPU detect, support.                                                                                         |
| Customer LAN GPU / appliance                                                                           | IT once                                                           | No external cloud                                                     | Yes if they expose OpenAI-compatible HTTPS your Edge Function can reach (or a browser talks to LAN) | Best for larger employers                                | Same contract as Gradient: `/chat/completions`.                                                                                    |
| Gradient **serverless** (current)                                                                      | No                                                                | Yes                                                                   | Yes                                                                                                 | **Correct default**                                      | Pay per token. No public region selector. Prepaid balance on DigitalOcean.                                                         |
| Gradient **Dedicated Inference TOR1**                                                                  | No                                                                | Yes — pinable to Toronto                                              | Yes — swap `base_url`                                                                               | Right next step if the goal is **Canada**, not on-device | Billed per GPU-hour whether traffic is 1 or 10,000 rpm.                                                                            |
| GPU Droplet TOR1 + vLLM                                                                                | No                                                                | Yes                                                                   | Yes                                                                                                 | DIY Dedicated                                            | You operate the box. Still Dutiva cloud.                                                                                           |

DigitalOcean does **not** stream weights into the browser, wrap Apple/Windows
on-device APIs, or offer “Gradient but local.” BYOM is for loading _your_
weights onto _their_ reserved GPU.

---

## 5. DigitalOcean compatibility

What you have now is already the DO-native architecture: server-side secret,
OpenAI-compatible client, route table so the model can change without a
deploy.

| Need                             | DO product                                                                                                               | Local?    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------- |
| Keep shipping Advisor on the web | Serverless Gradient, `deepseek-3.2`                                                                                      | No        |
| Written Canadian processing      | Ask OA9; if serverless will not pin, Dedicated TOR1 (public availability also lists NYC2, ATL1, RIC1 for Dedicated/BYOM) | No        |
| Custom / fine-tuned weights      | Dedicated + BYOM (~USD $5/mo weight storage plus GPU-hours)                                                              | No        |
| Tenant uses their own GPU        | Not a DO feature — point `ai_model_providers.base_url` at them                                                           | Their LAN |
| On-device inference              | None                                                                                                                     | —         |

**Do not** describe Dedicated TOR1 as “local” or “on-device.” It is
Dutiva-operated cloud in Toronto. That can still be the right privacy _and_
cost move (see §6.3) without pretending the laptop ran the model.

---

## 6. Cost effectiveness

Money here is **Dutiva COGS** (what we pay DigitalOcean and engineering
time), not what the customer pays for electricity. DigitalOcean bills in
**USD**. Plans and Advisor packs are **CAD**
([`CANONICAL_FACTS.md`](CANONICAL_FACTS.md), `src/config/advisorUsage.ts`).
FX below uses **1.35 CAD / USD** as a planning stub only — not a treasury
rate.

### 6.1 Current unit cost (Gradient serverless)

Public DigitalOcean Inference pricing, last checked **2026-08-24**:

| Model (serverless)                                              | Input / 1M tokens | Output / 1M tokens | Cache read / 1M |
| --------------------------------------------------------------- | ----------------- | ------------------ | --------------- |
| **DeepSeek V3.2** (`deepseek-3.2`, production)                  | USD $0.25         | USD $0.80          | USD $0.075      |
| Ministral 3 14B Instruct (prior Advisor model)                  | USD $0.20         | USD $0.20          | —               |
| DeepSeek V4 Flash (cheaper, **not evaluated** for this product) | USD $0.068        | USD $0.168         | USD $0.017      |

We do not have a live p50 token count in this document. Engineering bounds
for a planning estimate:

- History is capped at the last **20** messages.
- Completion is capped at `route.config.max_tokens ?? 800`.
- The system prompt + retrieval block + memory are on every call (input-heavy).

**Planning turn** (replace with `ai_telemetry_events` averages before any
spend decision): 4,000 input + 500 output tokens, no cache hit.

```
4,000 × $0.25 / 1e6  = $0.00100
  500 × $0.80 / 1e6  = $0.00040
                       --------
                       $0.00140 USD / turn
                       ≈ $0.0019 CAD / turn
```

Sensitivity (same rates):

| Turn shape   | Input / output | USD / turn |
| ------------ | -------------- | ---------- |
| Light        | 2,000 / 300    | $0.00074   |
| Planning     | 4,000 / 500    | $0.00140   |
| Heavy thread | 8,000 / 800    | $0.00264   |

At the planning turn, **80 included replies** cost Dutiva about
**USD $0.11 / user / month** if every user maxes the included budget.
That is the expensive commercial case, and it is still small next to a
Starter plan at **$24 CAD/mo**.

### 6.2 Revenue vs inference COGS (why local does not “save the business” at current scale)

| Commercial object   | Customer pays                                       | Approx. Dutiva GPU COGS (planning turn) |
| ------------------- | --------------------------------------------------- | --------------------------------------- |
| Included 80 / month | Bundled in Free waitlist or paid support membership | ~USD $0.11 if fully used                |
| Pack 50             | **$5 CAD** ($0.10 CAD / reply)                      | ~USD $0.07 for 50 turns                 |
| Pack 200            | **$15 CAD** ($0.075 CAD / reply)                    | ~USD $0.28 for 200 turns                |
| Overage             | **$0.12 CAD / reply**, cap 500, paid + opt-in       | ~USD $0.0014 / reply                    |

Pack and overage gross margin on _inference_ is extremely high. The 80
included replies are a product cost, not a GPU crisis. Abuse rails exist so
one account cannot turn “included” into an unbounded Gradient bill
(120 req / 250k tokens / day, platform 2,000).

**Implication:** local inference is a weak cost lever until you have
**orders of magnitude** more Advisor volume, or you are buying Dedicated
GPUs that sit idle. The expensive line items at this stage of the company
are founder time, support, legal review of the corpus, and a mistaken
Dedicated reservation — not `$0.0014` turns.

### 6.3 Dedicated Inference — when the cloud _does_ get expensive

Dedicated is billed **per GPU-hour whether or not anyone is chatting**.
DigitalOcean list prices (2026-08-24):

| GPU              | USD / hour | ≈ USD / 730-hour month if left on |
| ---------------- | ---------- | --------------------------------- |
| AMD MI300X (1×)  | $2.59      | $1,890                            |
| NVIDIA H100 (1×) | $4.41      | $3,219                            |
| NVIDIA H200 (1×) | $4.47      | $3,263                            |
| NVIDIA H100 (8×) | $30.32     | $22,134                           |

Break-even vs serverless at **$0.0014 / turn**:

| Dedicated SKU | Idle monthly | Turns / month before serverless would have cost the same |
| ------------- | ------------ | -------------------------------------------------------- |
| MI300X 1×     | ~$1,890      | ~1.35 million                                            |
| H100 1×       | ~$3,219      | ~2.3 million                                             |

Even if real turns are 3× more expensive than the planning estimate
(~$0.004), an always-on H100 still needs on the order of **~800k turns /
month** to match serverless on _raw GPU spend_. That is far above a small
Canadian HR SaaS’s near-term Advisor volume.

**Buy Dedicated when** you need a **contractual TOR1 pin** (OA9 fails for
serverless), isolation, or a custom model — and you accept idle cost as
the price of that guarantee. **Do not** buy it to “save money” at tens or
hundreds of users.

Serverless is **prepaid** on DigitalOcean: a $0 balance suspends inference.
That is a cash-ops detail, not a reason to reserve a GPU.

### 6.4 On-device / local — Dutiva’s bill vs the real bill

| Path              | Dutiva GPU COGS                            | What you actually pay                                                                                                                                                                        |
| ----------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WebGPU in the SPA | ~$0 / turn after you stop calling Gradient | CDN/bandwidth for first-load weights; weeks of engineering; QA on hardware you do not control; support when Chrome evicts IndexedDB; **quality/liability** if a 2B model invents ESA figures |
| OS models         | $0                                         | Native/Electron product; store/signing; hardware matrix; still a small model                                                                                                                 |
| Local Runtime     | $0 for those tenants                       | Installer, auto-update, GPU/NPU matrix, “it doesn’t start on this laptop,” macOS notarization, Windows SmartScreen. This dominates GPU savings at Dutiva’s scale                             |
| Customer LAN      | $0                                         | Sales + implementation. Price it as an **enterprise SKU**, not as a discount on Starter                                                                                                      |

Local also **destroys the current pack story** unless you replace it:
credits assume Dutiva paid Gradient. If inference is free for you,
either (a) still charge packs as a convenience/quality add-on for _cloud_
Advisor, (b) sell a higher-priced “on-prem inference” membership, or
(c) give local users cloud fallback metered as today. Decide that before
building.

### 6.5 Short term vs long term

**Short term (now → first few hundred paying orgs)**

Cheapest _and_ highest-quality path:

1. Stay on Gradient serverless `deepseek-3.2` **only if** subprocessors'
   cross-border disclosure (CA / US / NL) is acceptable to counsel.
2. ~~Close OA9.~~ **Done 2026-08-27** — DO confirmed serverless will **not**
   pin TOR1; failover to US/NL. Dedicated TOR1 is the **residency** path, not
   a savings purchase. See
   [do-residency-confirmation-response-2026-08-27.md](do-residency-confirmation-response-2026-08-27.md).
3. Tune COGS without new architecture: prompt caching if the route
   supports it; keep history at 20; do not put embeddings/RAG on Gradient
   Knowledge Bases unless you have a reason (Dutiva already retrieves in
   Postgres). Optionally evaluate a cheaper _evaluated_ model for
   `support-firstline` only — never silently cheapen Advisor legal
   dialogue.
4. Use telemetry (`prompt_tokens`, `completion_tokens`) to replace the
   planning estimate in §6.1 before any GPU reservation.

Do **not** spend a quarter building WebGPU or a helper to save tens of
dollars a month.

**Long term (thousands of orgs, or a buyer who will pay for premises)**

Local (or customer-GPU) becomes rational when **at least one** of these is
true:

- A customer will **pay extra** for “case facts inferred on our hardware”
  (privacy SKU). The GPU savings accrue to them; Dutiva’s win is price and
  differentiation, not COGS.
- Cloud volume is high enough that **Dedicated idle < serverless**, _and_
  you want TOR1 isolation anyway.
- You are losing deals because prompts leave the customer network, and the
  alternative is no deal.

Even then, keep Gradient (or Dedicated) as **fallback**. Hardware support
for WebGPU / Apple FM / Windows AI will never be 100% of Canadian HR
laptops.

### 6.6 Cost of being wrong (usually larger than GPU)

A weaker on-device Advisor that invents a notice period is not a cheaper
token. It is a product defect. The standing disclaimer does not license
that. Corpus review (TODO L5) and deterministic gates exist because the
model is already treated as untrusted. Shrinking the model without keeping
server-side retrieval and hedges makes that worse.

Do not claim PIPEDA / Law 25 “compliance” because inference moved on-device.
Employee records still live in Postgres today
([CANONICAL_FACTS.md](CANONICAL_FACTS.md) § claims to stop making). Local
completion only changes **where that one prompt is decoded**.

---

## 7. Privacy split that is honest if you ever sell “local”

If the pitch is “sensitive employee facts never sit on Dutiva’s inference
GPU,” you do not have to move the whole product off the cloud.

| Stays on Dutiva (and usually DigitalOcean)           | Can stay on customer hardware                            |
| ---------------------------------------------------- | -------------------------------------------------------- |
| Auth, org, Stripe, packs for _cloud_ turns           | Names, tenure, wages, case narrative in the user message |
| Curated guidance retrieval (or chunk ids)            | Completion against retrieved text + local facts          |
| Templates, ClauseGate, notice math, citation table   | Optional embeddings of the employer’s own PDFs           |
| Crisis resources verbatim, statutory-figure detector | GPU / NPU / Apple FM / Windows AI                        |

Honest line if shipped: _sensitive case facts can be inferred on your
hardware._ Not “PIPEDA-compliant because local.” Not “no download.” Not
“DigitalOcean local mode.”

Two implementation shapes:

- **(a) Completion-only local** — `advisor-chat` still does RAG, prompt,
  safety, and metering of cloud-assisted turns; only `/chat/completions`
  goes to localhost or a tenant URL. Implementable without shipping the
  corpus as a product. **Recommended** if you ever do this.
- **(b) Fully on-device RAG** — corpus replica on the device. Stronger
  privacy story, leaks retrieval IP, update/sync problem, new product.

---

## 8. If you decide to implement (phased)

Nothing below is scheduled. Effort is order-of-magnitude for a solo
founder-plus-agents shop.

| Phase | Work                                                                           | Effort                                     | Spend                   | Do when                                       |
| ----- | ------------------------------------------------------------------------------ | ------------------------------------------ | ----------------------- | --------------------------------------------- |
| **0** | Keep Gradient. Send OA9. Measure real $/turn from telemetry.                   | Hours                                      | Current serverless      | Default                                       |
| **1** | Dedicated TOR1 **or** rewrite public Toronto language                          | Days (provider row + secrets + legal copy) | GPU-hours or legal time | Residency, not savings                        |
| **2** | Tenant-scoped `ai_model_providers` row → customer OpenAI-compatible URL        | Days–weeks + enterprise support            | Sales, not GPUs         | A paying customer has a GPU and a contract    |
| **3** | Dutiva Local Runtime (localhost `/v1/chat/completions`) with Gradient fallback | A product line (months, then forever)      | Support >> GPU          | Recurring demand for (a) in §7                |
| **4** | OS models / WebGPU as extra providers inside that runtime                      | Extra matrix                               | QA                      | Only after 3 exists; never as the web Advisor |

The route table is the extension point. Do not fork `advisor-chat` into a
second product to try WebGPU.

### Out of scope unless a later decision says so

- Shipping GGUF/ONNX in the Vite bundle or service worker as the Advisor.
- Calling Apple Foundation Models or Windows AI from the marketing site or
  `/app` SPA.
- Moving document generation onto a local LLM (forbidden by
  `AI_USAGE_STRATEGY.md` — documents stay merge tokens + ClauseGate).
- Using DigitalOcean Knowledge Bases as a substitute for
  `advisor_guidance_chunks` just because they are on the same invoice.

---

## 9. Open questions to settle when you decide

1. Is the goal **Canadian processing**, **prompts off Dutiva GPUs**, or
   **lower COGS**? Those three have three different answers (OA9 /
   Dedicated, Local Runtime SKU, stay serverless).
2. What does live `ai_telemetry_events` say for p50/p95 tokens per `chat`
   turn over 30 days?
3. Will a customer pay for (2) as a line item, or are we hoping to save
   GPU money?
4. If local exists, what happens to the 80 included replies and packs for
   that tenant?
5. Are we willing to support Windows + macOS helpers, or only “bring your
   own OpenAI-compatible endpoint”?

---

## 10. Sources (dated)

- This repository: `advisor-chat`, `aiUsage.ts`, `advisorUsage.ts`,
  `CANONICAL_FACTS.md`, `AI_USAGE_STRATEGY.md`.
- DigitalOcean Inference pricing and availability, checked 2026-08-24:
  [pricing](https://docs.digitalocean.com/products/inference/details/pricing/),
  [availability](https://docs.digitalocean.com/products/inference/details/availability/)
  (Dedicated / BYOM include TOR1).
- Apple Foundation Models (on-device vs Private Cloud Compute): Apple
  Developer documentation, 2026.
- Windows AI / Phi Silica hardware notes; Aion Instruct retail replacement
  of Phi Silica reported for **2026-11-24** — re-verify against Microsoft
  Learn before building anything on Windows AI APIs.
- WebLLM / WebGPU: practical browser ceiling 1–4B on ordinary VRAM; 7–8B
  high-end only; first load is a real download even when the UI hides it.

When DigitalOcean list prices or the production `model_name` change, update
§6 in the same change that updates the route — this file is not
CI-enforced.
