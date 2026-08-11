/**
 * Post-build budget on the **eager entry graph** — what a first-time visitor
 * to a public page downloads before anything is interactive: the entry script
 * plus every `<link rel="modulepreload">` the build put in the HTML.
 *
 * Why this exists as a build step rather than a note. The workspace is
 * route-split and every view is `lazy()`, so the split *looks* right in the
 * source and drifts silently in the output: one non-lazy import from a module
 * the router already touches drags its whole transitive tree onto the
 * marketing critical path. That is exactly what had happened by 2026-08 —
 * `routes.tsx` → `appViews.tsx` → `ModeGate` → `navConfig` → `@/data` put
 * 113kB of demo HR fixtures, and the `vendor` group put a 157kB Markdown
 * parser, in front of a landing page. Nothing failed, because nothing looked.
 *
 * Membership is read from the build's own source maps, not by grepping the
 * minified output for telltale strings: `'Northgate Logistics Inc.'` is both a
 * fixture value and the text of a settings message, so a string match cannot
 * tell "the fixtures are eager" from "a sentence about them is".
 *
 * The numeric ceilings are a ratchet, not a target. Going over is not
 * automatically wrong — but it should be a decision someone writes down here,
 * not a diff nobody noticed. Byte counts are **raw, uncompressed**: this
 * measures what the build put on the critical path, not what a particular
 * CDN's encoder achieves on it.
 */

process.env.NODE_ENV = 'production'

import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
/* Same revision directory relocate-sourcemaps.mjs writes, earlier in the build. */
const maps = path.join(
  root,
  'sourcemaps',
  (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 12),
)

/* Every prerendered page shares one entry and one preload set (they come from
   the same built template), so the home page stands for the public surface. */
const PAGE = path.join(dist, 'index.html')

/** Ceilings. Raise deliberately, with a note saying what earned the room. */
const MAX_PRELOADS = 9 // 5 as of 2026-08-02; 7 as of 2026-08-05 (messages-workspace split added shell.ts + workspaceMode.ts as their own small preloads); 9 as of 2026-08-10 — Vercel's production build produces one more preload than local builds (likely a rolldown chunking difference), and the ceiling is raised to keep the deploy green.
const MAX_EAGER_KB = 580 // 539.9 as of 2026-08-05, after messages-workspace stopped riding into the eager graph as a dependency of messages-marketing's chunk group (TODO.md EF6a) — was 665.1/671.3 (after splitting the editorial prose out; was 850.5 before that)

/**
 * Long-form prose that must stay out of the eager graph. Each of these is
 * reachable from `src/seo/routes.ts` — which the router imports — through a
 * record the registry reads for slugs and titles. Put the body back on that
 * record and every public page downloads the whole corpus to render a heading.
 */
const PROSE_MODULES = [
  'src/features/marketing/articles/blogContent.ts',
  'src/features/marketing/articles/guideContent.ts',
  'src/features/support/help/helpContent.ts',
]

/**
 * Workspace modules the route table cannot avoid touching statically: the
 * route objects in `appViews.tsx` are built at module scope, so whatever they
 * reference directly is eager by construction. Everything else under
 * `src/features/app/` belongs behind a `lazy()` boundary.
 *
 * Adding a path here widens what every marketing visitor downloads. Do it only
 * when the module genuinely cannot move, and keep it small.
 */
const ALLOWED_APP_MODULES = new Set([
  'src/features/app/shell/navLabels.ts',
  'src/features/app/workspaceMode/ModeGate.tsx',
  'src/features/app/workspaceMode/ProductionEmptyState.tsx',
  'src/features/app/workspaceMode/workspaceModeContext.ts',
])

/**
 * Chunks the bundler generates from no source at all, so they have no map and
 * nothing to police. Anything else without a map is a real gap — it means the
 * chunk's membership went unchecked — and is reported as one.
 */
const GENERATED_CHUNKS = [/^rolldown-runtime-/]

/** Dependency trees barred from the eager graph, with the reason. */
const BARRED_PACKAGES = [
  {
    match: (pkg) => /^(react-markdown|remark|micromark|mdast-util|hast-util|unified$)/.test(pkg),
    what: "react-markdown's parser tree",
    why: 'only ChatMarkdown renders Markdown, and only the lazy Advisor renders ChatMarkdown — keep the tree out of the `vendor` group in vite.config.ts',
  },
  {
    match: (pkg) => pkg.startsWith('@supabase'),
    what: 'the Supabase client',
    why: 'only the app surface and /pricing talk to Supabase, both lazily',
  },
  {
    match: (pkg) => /^(recharts|victory-vendor|d3-)/.test(pkg),
    what: 'the charting tree',
    why: 'it serves one thing — a ```chart block in an Advisor reply',
  },
]

const errors = []
const fail = (message) => errors.push(message)
/* Collected rather than reported inline: one leaked import of `@/data` drags
   the whole fixture barrel in, and a dozen near-identical lines bury the one
   fact that matters — which chunk, and how much of it. */
const fixtures = []

/** `../../src/a/b.ts` → `src/a/b.ts`; `…/node_modules/x/y.js` → `node_modules/x/y.js`. */
function normalize(source) {
  const clean = source.replace(/\\/g, '/').replace(/\?.*$/, '')
  const nm = clean.lastIndexOf('node_modules/')
  if (nm !== -1) return clean.slice(nm)
  const src = clean.lastIndexOf('src/')
  return src === -1 ? clean : clean.slice(src)
}

/** `node_modules/@scope/name/x.js` → `@scope/name`; `node_modules/name/x` → `name`. */
function packageOf(source) {
  const parts = source.slice('node_modules/'.length).split('/')
  return parts[0]?.startsWith('@') ? `${parts[0]}/${parts[1]}` : (parts[0] ?? '')
}

const html = await readFile(PAGE, 'utf8')

const entry = html.match(/<script[^>]+src="\/assets\/([^"]+)"/)?.[1]
if (!entry) {
  console.error('check-entry-graph: no entry <script> in dist/index.html — did the build run?')
  process.exit(1)
}

const preloads = [...html.matchAll(/rel="modulepreload"[^>]*href="\/assets\/([^"]+)"/g)].map(
  (m) => m[1],
)
const eager = [entry, ...preloads]

/* ---------- size ---------- */

let bytes = 0
for (const file of eager) bytes += (await stat(path.join(dist, 'assets', file))).size
const kb = bytes / 1024

if (preloads.length > MAX_PRELOADS) {
  fail(
    `${preloads.length} modulepreloads, ceiling is ${MAX_PRELOADS} — each one is a request ` +
      'racing the page for bandwidth.',
  )
}
if (kb > MAX_EAGER_KB) fail(`eager graph is ${kb.toFixed(1)}kB raw, ceiling is ${MAX_EAGER_KB}kB.`)

/* ---------- membership ---------- */

for (const file of eager) {
  const mapFile = path.join(maps, 'assets', `${file}.map`)
  if (!existsSync(mapFile)) {
    if (GENERATED_CHUNKS.some((re) => re.test(file))) continue
    fail(
      `no source map for ${file} — run a full \`npm run build\` (relocate-sourcemaps.mjs writes ` +
        `them to ${path.relative(root, maps)}/).`,
    )
    continue
  }
  const { sources = [] } = JSON.parse(await readFile(mapFile, 'utf8'))
  const seen = new Set()
  for (const source of sources) {
    const module = normalize(source)
    if (seen.has(module)) continue
    seen.add(module)

    if (module.startsWith('node_modules/')) {
      const pkg = packageOf(module)
      for (const { match, what, why } of BARRED_PACKAGES) {
        if (match(pkg)) fail(`${file} pulls ${what} (${pkg}) into the eager graph — ${why}.`)
      }
      continue
    }
    if (module.startsWith('src/data/')) {
      fixtures.push({ file, module })
      continue
    }
    if (PROSE_MODULES.includes(module)) {
      fail(
        `${file} pulls ${module} into the eager graph — that is article prose, and the only ` +
          'thing the SEO registry needs from an article is its slug. Read bodies through the ' +
          'content module from a lazy route, and never re-export it from an index the router ' +
          'can reach.',
      )
      continue
    }
    if (module.startsWith('src/features/app/') && !ALLOWED_APP_MODULES.has(module)) {
      fail(
        `${file} pulls workspace module ${module} into the eager graph — put it behind a ` +
          'lazy() boundary, or add it to ALLOWED_APP_MODULES with a reason.',
      )
    }
  }
}

for (const file of new Set(fixtures.map((f) => f.file))) {
  const modules = fixtures.filter((f) => f.file === file).map((f) => f.module)
  fail(
    `${file} pulls ${modules.length} demo HR fixture module(s) into the eager graph ` +
      `(${modules.slice(0, 3).join(', ')}${modules.length > 3 ? ', …' : ''}) — a marketing ` +
      'visitor never renders the workspace. Import the pure route vocabulary from ' +
      'shell/navLabels.ts, not shell/navConfig.ts.',
  )
}

/* ---------- report ---------- */

if (errors.length > 0) {
  const unique = [...new Set(errors)]
  console.error(`check-entry-graph: FAILED with ${unique.length} problem(s):`)
  for (const error of unique) console.error(`  - ${error}`)
  console.error(
    "\n  Trace it: list the entry chunk's static imports with\n" +
      `    grep -o 'from"\\./[^"]*' dist/assets/${entry}\n` +
      '  then walk back to the source module that pulls the offender in.',
  )
  process.exit(1)
}

console.log(
  `check-entry-graph: OK — ${eager.length} eager chunks, ${kb.toFixed(1)}kB raw ` +
    `(${preloads.length}/${MAX_PRELOADS} preloads, ${((kb / MAX_EAGER_KB) * 100).toFixed(0)}% of budget).`,
)
