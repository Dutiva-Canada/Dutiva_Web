# Loading on-device models from a drive or folder (File System Access)

The web-feasible slice of "models on an external drive", shipped as a
prototype in Settings → AI → "Load from a folder or drive"
(`src/lib/localModels/driveImport.ts` + the `DriveImportPanel` in
`AiModelsSection.tsx`).

## What it does

1. The user picks a folder through `showDirectoryPicker` — an external
   drive, a synced folder, any directory the OS exposes.
2. The handle is remembered in IndexedDB (`dutiva-drive-models`), so on
   return visits the folder shows as "linked"; permission may need one
   click to re-grant.
3. "Import" copies every file under each `<org>/<repo>/` tree into the
   `transformers-cache` Cache Storage bucket, keyed by the exact
   huggingface.co `resolve/main/…` URL transformers.js will request.
4. From then on the runtime loads those files from cache — including
   offline — and fetches anything missing from HF on first use, so a
   partial snapshot degrades to a partial offline set, never a broken
   model.

## Folder layout

The Hugging Face repo tree, two levels deep:

```
<picked folder>/
  Xenova/
    whisper-tiny/
      config.json
      tokenizer.json
      onnx/
        model_quantized.onnx
```

The same layout `env.localModelPath` uses — a folder prepared for import
is forward-compatible with a real runtime mount later.

## What it deliberately is not

- **No live streaming off the drive.** Browsers can't mount filesystems;
  import copies into browser storage. Running weights straight off the
  drive needs a service-worker route or a desktop runtime — future work,
  documented in LOCAL_INFERENCE.md.
- **No silent USB mounting.** Nothing loads when a drive is plugged in;
  the picker requires a user gesture every session where permission isn't
  already granted.
- **Not the Advisor.** Imported files feed the on-device task models only
  (captioning, transcription, short rewrites, embeddings). The Advisor
  stays server-routed and metered.
- **Chromium only.** `showDirectoryPicker` has no Safari/Firefox support
  at writing; the UI shows a one-line note and the download buttons keep
  working everywhere.

## Failure modes worth knowing

- Browser quota can evict cached files later; "installed" is always
  re-probed (`installedRepoIds`), so an evicted import simply reverts to
  "not installed".
- A folder that doesn't match `<org>/<repo>/…` imports nothing — the toast
  says so rather than guessing a layout.
