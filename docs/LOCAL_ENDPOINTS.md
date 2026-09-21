# Self-hosted model endpoints — operator runbook

How to point an Advisor route at an OpenAI-compatible endpoint you run —
Ollama, LM Studio, vLLM, llama.cpp — on customer hardware or a LAN.
Pair with [LOCAL_INFERENCE.md](LOCAL_INFERENCE.md) (the decision record)
and the Settings → AI surface
(`src/features/app/views/settings/AiModelsSection.tsx`).

**Status:** implemented and verified end-to-end 2026-09-19 — deployed
`advisor-chat` on Supabase → temporary tunnel → Ollama `qwen2.5:1.5b`,
full Advisor envelope and persistence, then the route was restored.
See §6.

## 1. The requirement that bites

`advisor-chat` runs in Supabase's cloud edge runtime — not in the
browser, not on the customer's LAN. `base_url` is resolved **from the
edge**, so:

- `http://localhost:11434` is the edge server's own localhost, not yours.
- `http://192.168.x.x` / `10.x.x.x` are unroutable from the cloud.
- The Settings → AI "Test" probe only proves **your browser** can reach
  the endpoint — it is not evidence the edge can.

To make a LAN endpoint reachable from the edge, pick one:

| Option                                                    | When                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Public HTTPS endpoint (reverse proxy / firewall pinhole)  | Permanent deployment; you control TLS and auth                              |
| Named tunnel (Cloudflare Tunnel, Tailscale Funnel, ngrok) | No inbound firewall change; use a _named_ tunnel for anything beyond a test |
| Self-host Supabase (edge runtime on the LAN)              | Fully on-prem posture; the biggest lift                                     |

An ephemeral `trycloudflare.com` quick tunnel works for a smoke test —
it is public and short-lived, so never leave one pointed at a keyless
server.

## 2. The API contract

Dutiva speaks OpenAI chat-completions to whatever URL you register:

| Call                               | Purpose                                                |
| ---------------------------------- | ------------------------------------------------------ |
| `GET {base_url}/models`            | Settings → AI "Test" probe (browser-side reachability) |
| `POST {base_url}/chat/completions` | Every completion on routes that point at the provider  |

- **`base_url` must include the API prefix.** For Ollama that is
  `https://your-host/v1`, not the bare host — the adapter appends
  `/chat/completions` itself (`supabase/functions/_shared/modelUpstream.ts`).
- Defaults: LM Studio `http://host:1234/v1`, vLLM `http://host:8000/v1`,
  llama.cpp `llama-server` — same `/v1` shape.
- **Modalities:** a route only accepts the input types listed in its
  `config.modalities` (`text`, `image`, `document` — documents arrive as
  client-extracted text). A non-listed modality is refused before
  metering, and the client may fall back to an on-device caption pass.

## 3. Auth

| `secret_ref`     | Behaviour                                                            |
| ---------------- | -------------------------------------------------------------------- |
| empty            | No `Authorization` header — keyless LAN servers                      |
| `MY_SECRET_NAME` | Reads env var `MY_SECRET_NAME` on the edge runtime, sent as `Bearer` |

`secret_ref` is the **name** of an edge-function secret, never the key —
the key lives only in the edge environment (`supabase secrets set`). A
referenced secret that does not exist fails the call loudly; it never
silently downgrades to unauthenticated.

## 4. Register and route (Settings → AI)

1. Run the server (`ollama serve`, LM Studio's server, `vllm serve`, …)
   and pull the model (`ollama pull qwen2.5:7b`).
2. Expose it per §1; confirm `GET {base_url}/models` returns JSON.
3. Settings → AI → **Register a local provider**: display name, base URL
   with `/v1`, optional secret env name, accepted modalities.
4. **Advisor route** → pick the provider, enter the model name exactly
   as the server reports it (`qwen2.5:7b`, not a friendly name), apply.
5. Send one Advisor message. The reply still runs the full server-side
   path — retrieval, safety gates, usage metering, persistence.
6. Roll back: point the route at the prior provider/model, or deactivate
   the provider.

`config.timeout_ms` bounds the upstream wait per route. Local models on
CPU can be slow — 60–90s is a sane first value.

## 5. Security floor

- TLS on anything that leaves the LAN; a bearer key (`secret_ref`) on
  anything reachable beyond it. A keyless server on a public URL is an
  open inference proxy.
- Restrict ingress (tunnel ACL / firewall allowlist) so only the edge
  can reach the endpoint.
- The endpoint sees message content — treat its logs and disk as
  in-scope for the customer's privacy posture.

## 6. Verified state (2026-09-19)

Deployed `advisor-chat` → Cloudflare quick tunnel → Ollama 0.34.1 /
`qwen2.5:1.5b` on a workstation. Auth, workspace-membership gate,
retrieval, `advisor_response` envelope, and conversation persistence all
verified on a real user JWT. Route restored to `deepseek-3.2` afterward;
temporary provider, access grant, conversation, and user deleted.

## 7. What this is not

- Not "the Advisor runs on-device" — browser-installed models in
  Settings → AI handle on-device tasks only (LOCAL_INFERENCE.md §4, §8).
- Not private-by-default — prompts still reach Dutiva's edge for
  retrieval, metering, and safety; the endpoint move changes where the
  _completion_ is decoded.
