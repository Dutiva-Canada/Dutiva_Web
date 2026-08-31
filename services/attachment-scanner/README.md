# attachment-scanner

The malware-scan endpoint behind `SUPPORT_ATTACHMENT_SCAN_URL` (TODO.md **OA5**).
ClamAV plus a ~200-line dependency-free Node service, in one container.

Self-hosted on purpose. The scanner fetches the **actual file bytes** of customer
support attachments — HR documents, in a product that makes PIPEDA claims and has
an open data-residency question ([OA9](../../docs/TODO.md)). Handing those to a
US SaaS scanner is a decision with a compliance story attached; running it in a
Canadian region is not. See [SUPPORT_RUNBOOK.md § Attachment malware
scanning](../../docs/SUPPORT_RUNBOOK.md).

## The contract

`support-attachment-scan` POSTs one file per request to `POST /scan`, with
`Authorization: Bearer $SCAN_TOKEN`:

```json
{
  "url": "<5-minute signed URL>",
  "file_name": "notice.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 18422,
  "reference": "<uuid>"
}
```

We answer in the shape [`attachmentScan.ts`](../../src/features/support/attachmentScan.ts)
holds us to — that module is the tested source of truth, not this README:

| Response                                    | Worker records                                   |
| ------------------------------------------- | ------------------------------------------------ |
| `200 {"status":"clean"}`                    | `clean` — downloads released                     |
| `200 {"status":"infected","signature":"…"}` | `flagged` — downloads refused permanently        |
| `200 {"status":"unsupported","reason":"…"}` | `skipped` — never established as safe            |
| any non-2xx                                 | `pending`, retried up to 5 times, then `skipped` |

**The 200-vs-502 split is the design.** `unsupported` is settled: retrying will
not change it. A 502 means "we don't know yet". So an expired signed URL, a
network blip, or a sick clamd must be a 502 — as `unsupported` they would
permanently mark a perfectly good file un-scannable. `GET /health` returns
clamd's PING/PONG for platform health checks.

## Memory — read this before choosing an instance size

**clamd needs ~2 GB of RAM.** It loads the entire signature database into
memory. On a 512 MB or 1 GB instance it is OOM-killed partway through startup;
the container then fails its health check, and every attachment comes back
`scanner_unreachable`. That reads like a network fault and isn't one. Budget a
2 GB instance (~$12–25/mo).

## Verify the service logic (no Docker needed)

```bash
node services/attachment-scanner/harness.cjs
```

Starts a mock `clamd` that speaks the real INSTREAM wire protocol, a local file
server, and the actual `server.js`, then asserts the whole contract: auth, URL
and host validation, the 4-byte-big-endian framing and zero-length terminator,
reply parsing, and the exact JSON bodies the worker consumes. Fourteen checks;
run it after any change to `server.js`.

The one it exists for: a 27 MiB file must come back `unsupported`, with clamd
instructed to say "clean". If the size cap ever stops working, that test returns
`clean` for an oversized file — the worst wrong answer this service can give.

**What it does not cover:** ClamAV itself. The mock answers what a real clamd
would, but signature loading, actual detection, and the freshclam lifecycle are
only exercised by building the image — see below. Verified 2026-08-06: all
fourteen checks pass.

## Verified against real ClamAV, 2026-08-06

Built and run under Podman 6.0.2. `freshclam` baked main.cvd (3,287,027
signatures), daily.cvd (355,598) and bytecode.cvd (80) at build time; clamd
loaded them and the entrypoint held the endpoint back until PING answered.
Driven from inside the container against the live daemon:

| Case               | Result                                                         |
| ------------------ | -------------------------------------------------------------- |
| `GET /health`      | `{"ok":true,"clamd":"PONG"}`                                   |
| EICAR test file    | `200 {"status":"infected","signature":"Eicar-Test-Signature"}` |
| ordinary text file | `200 {"status":"clean"}`                                       |
| origin returns 404 | `502` — retryable, not a verdict                               |
| wrong bearer token | `401`                                                          |

Two notes from that run. **`podman build` reports success even when `freshclam`
fails** — the first cut of this Dockerfile set `LogFile` in `freshclam.conf`
(a clamd-only option; freshclam refuses to parse it), so no signatures were
baked and the failure was swallowed by a `|| true`. That `|| true` is gone; if
signatures cannot be fetched, the build now fails. **And Podman ignores
`HEALTHCHECK`** in OCI image format — harmless here, since DO App Platform and
Fly are configured with the `/health` path directly, but it means the
in-container health check only exists under Docker.

## Build and test locally

```bash
docker build -t attachment-scanner services/attachment-scanner
```

First build downloads ~250 MB of signatures. Then:

```bash
docker run --rm -p 8080:8080 -e SCAN_TOKEN=dev-token -e ALLOW_HTTP_FETCH=1 attachment-scanner
```

Startup holds until clamd finishes parsing the database — 30–90s, by design, so
it never serves a wrong answer while warming up. Wait for health:

```bash
curl -s localhost:8080/health
```

Then scan the [EICAR test file](https://www.eicar.org/download-anti-malware-testfile/)
— the industry-standard AV test string, not real malware. Serve it from a
throwaway directory and point the scanner at it:

```bash
printf 'X5O!P%%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > /tmp/eicar.txt
```

```bash
curl -s -X POST localhost:8080/scan -H 'Authorization: Bearer dev-token' -H 'Content-Type: application/json' -d '{"url":"http://host.docker.internal:9000/eicar.txt","reference":"local-test"}'
```

Expect `{"status":"infected","signature":"Win.Test.EICAR_HDB-1"}`. A normal PDF
should give `{"status":"clean"}`. `ALLOW_HTTP_FETCH` is local-only — never set it
in a deployed environment.

## Deploy

Either platform works; pick the Canadian region. The service needs public egress
so it can fetch the Supabase signed URL — this cannot sit behind a VPN.

**DigitalOcean App Platform** (Toronto, `tor1` — matches the existing footprint):
create an app from this directory, Dockerfile build, instance size with **2 GB**
RAM, HTTP port `8080`, health check path `/health`, and set `SCAN_TOKEN` as an
encrypted env var.

**Fly.io** (`yyz`):

```bash
fly launch --no-deploy --region yyz --vm-memory 2048 --dockerfile Dockerfile
```

```bash
fly secrets set SCAN_TOKEN="$(openssl rand -hex 32)"
```

Then tighten the fetch allow-list so an authenticated caller can't use this as a
generic URL fetcher:

```bash
fly secrets set ALLOWED_FETCH_HOST=khtwpxnvziiyplaflwru.supabase.co
```

## Wire it up

Supabase secrets are **project-wide** (Dashboard → Edge Functions → Secrets), not
per-function — both `support-attachment-scan` and `support-attachment-action`
read the URL:

```bash
npx supabase secrets set SUPPORT_ATTACHMENT_SCAN_URL=https://<your-app>/scan SUPPORT_ATTACHMENT_SCAN_KEY=<the SCAN_TOKEN> --project-ref khtwpxnvziiyplaflwru
```

> **Setting the URL arms the download gate, not just the worker.**
> `support-attachment-action` refuses to sign a download for anything not
> `clean` the moment scanning is enabled. Verify the endpoint with curl
> _before_ setting the secret. Right now `support_attachments` is empty, so
> there is no backlog to lock out — that makes this the cheapest moment to
> turn it on.

## Verify end to end

```sql
select public.trigger_attachment_scan();
```

Then read the HTTP response, not the trigger's return value — that distinction
is what hid a 403 here for a full day:

```sql
select status_code, content from net._http_response order by id desc limit 3;
```

The `{"note":"no_scanner"}` should be gone. Upload an EICAR `.txt` (on the MIME
allow-list) to a test ticket and within 10 minutes:

```sql
select scan_status, scan_detail, scanned_at from public.support_attachments order by created_at desc limit 5;
```

Expect `flagged` with the signature name in `scan_detail`. `skipped` with
`scanner_unreachable` or `http_5xx` means the wrapper, not the worker.
