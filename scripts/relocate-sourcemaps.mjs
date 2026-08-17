/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
/**
 * Move client source maps out of dist/ after `vite build`.
 *
 * build.sourcemap is 'hidden' (vite.config.ts): the .map files are emitted so
 * production error-report stack traces can be symbolicated, but the JS carries
 * no `sourceMappingURL` comment, so nothing auto-fetches them. Serving the maps
 * from dist/ would still expose the unminified source to anyone who guesses the
 * URL, so this step relocates every dist/**\/*.map into sourcemaps/<rev>/
 * (git-ignored) BEFORE the service worker precaches dist/assets and before
 * dist/ is deployed.
 *
 * IMPORTANT — this local dir is NOT a durable artifact. The deploy build (on
 * Vercel) discards everything outside the deployed output, so to symbolicate a
 * production trace the DEPLOY pipeline must archive sourcemaps/<rev>/ to private
 * storage keyed by the release SHA before its workspace is torn down (see
 * docs/ERROR_REPORTING.md → Source maps). Do not rely on rebuilding to
 * reproduce them: the client bundle bakes in build-time env values
 * (__RELEASE_SHA__) and preview builds add extra transforms, so an exact
 * rebuild is not guaranteed without replicating the original build environment.
 *
 * Runs in the `npm run build` pipeline between `vite build` and `build:ssr`.
 */

import { mkdir, readdir, rename } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const rev = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 12)
const outRoot = path.join(root, 'sourcemaps', rev)

/** Recursively collect every *.map file under a directory. */
async function collectMaps(dir) {
  const found = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (err) {
    // Only a genuinely absent directory is fine. A permission/I/O error must
    // fail the build — otherwise unreadable subtrees could leave .map files
    // under dist/ and ship them, breaking the never-deploy-source-maps rule.
    if (err?.code === 'ENOENT') return found
    throw err
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await collectMaps(full)))
    else if (entry.name.endsWith('.map')) found.push(full)
  }
  return found
}

const maps = await collectMaps(dist)
let moved = 0
for (const abs of maps) {
  const dest = path.join(outRoot, path.relative(dist, abs))
  await mkdir(path.dirname(dest), { recursive: true })
  await rename(abs, dest)
  moved += 1
}

console.log(
  `relocate-sourcemaps: moved ${moved} .map file(s) out of dist/ → sourcemaps/${rev}/ ` +
    '(never served, kept for symbolication)',
)
