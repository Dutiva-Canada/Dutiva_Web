/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
import { fileURLToPath } from 'node:url'
import { defineConfig, configDefaults } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { parse } from '@babel/parser'
import MagicString from 'magic-string'

/**
 * Vite transform that stamps every host (lowercase) JSX element with a
 * `data-loc="src/…/File.tsx:line"` attribute, so the in-app Dev Annotations
 * overlay (src/devtools/) can map any clicked element back to its exact
 * source location. Runs `pre`, on the raw TSX before the React/oxc JSX
 * transform, and inserts inline (no new lines) so source maps and Fast
 * Refresh are unaffected. Added only for `vite dev` and Vercel *preview*
 * builds (see `stampSource`) — production JSX is never touched, so live
 * dutiva.ca markup carries no data-loc attributes and no dev tooling.
 *
 * (@vitejs/plugin-react v6 is oxc-based and takes no Babel plugins, hence a
 * standalone transform here rather than a JSX Babel visitor.)
 */
function devSourceLocation(): Plugin {
  return {
    name: 'dutiva-dev-source-location',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0] ?? id
      if (!/\.[jt]sx$/.test(file) || file.includes('/node_modules/')) return null
      const rel = file.replace(/\\/g, '/').split('/src/').pop()
      if (!rel) return null

      let ast
      try {
        ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
      } catch {
        return null // never let a parse hiccup break the dev/preview build
      }

      const s = new MagicString(code)
      let touched = false
      walkAst(ast.program, (node) => {
        if (node.type !== 'JSXOpeningElement') return
        const name = node.name
        if (!name || name.type !== 'JSXIdentifier' || !/^[a-z]/.test(name.name)) return
        const line = node.loc?.start?.line
        if (typeof name.end !== 'number' || !line) return
        s.appendLeft(name.end, ` data-loc="src/${rel}:${line}"`)
        touched = true
      })
      if (!touched) return null
      return { code: s.toString(), map: s.generateMap({ hires: true }) }
    },
  }
}

/** Depth-first walk over a Babel AST, visiting every node with a `type`. */
function walkAst(node: any, visit: (n: any) => void): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) walkAst(child, visit)
    return
  }
  if (typeof node.type === 'string') visit(node)
  for (const key in node) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue
    walkAst(node[key], visit)
  }
}

/**
 * After the build emits hashed Montserrat latin woff2, inject a `<link
 * rel="preload">` into every HTML entry so the hero H1 (font-display) can
 * start downloading in parallel with CSS instead of waiting for @font-face
 * discovery. Dev skips this — CSS url() resolution is enough locally.
 */
function preloadLcpFont(): Plugin {
  const MARK = 'montserrat-latin-wght-normal'
  return {
    name: 'dutiva-preload-lcp-font',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html
        const asset = Object.values(ctx.bundle).find(
          (item) =>
            item.type === 'asset' &&
            typeof item.fileName === 'string' &&
            item.fileName.includes(MARK) &&
            item.fileName.endsWith('.woff2'),
        )
        if (!asset || asset.type !== 'asset') return html
        const tag = `    <link rel="preload" href="/${asset.fileName}" as="font" type="font/woff2" crossorigin />\n`
        return html.replace('</head>', `${tag}</head>`)
      },
    },
  }
}

/* The eager runtime core — the only packages the `vendor` chunk claims.
   Everything else in node_modules falls through to rolldown's default
   chunking, which is what keeps lazy-only dependencies lazy: a catch-all
   vendor group instead hoisted every non-excluded module into the eager
   graph, and the exclusion list could never keep up — 175 lucide-react
   icon modules shipped eagerly although marketing's entry uses a small
   fraction of them, and transitive deps (onnxruntime-common, redux,
   nested pdf-lib/node_modules/tslib copies) leaked past a regex that
   inspected only one path segment. */
const VENDOR_PACKAGES = new Set([
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  'scheduler',
  'web-vitals',
])

/** Every package name appearing at a `node_modules/` boundary in `id`,
    outermost→innermost. The vendor test uses the innermost segment — the
    module's own package — so `react-router/node_modules/tslib` counts as
    tslib, not react-router. */
function packageOfModule(id: string): string | undefined {
  const seg = id.split(/[\\/]node_modules[\\/]/).at(-1)
  if (!seg || seg === id) return undefined
  return seg
    .split(/[\\/]/)
    .slice(0, seg.startsWith('@') ? 2 : 1)
    .join('/')
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  /* Stamp source locations for local dev and Vercel preview builds only —
     never production (VERCEL_ENV === 'production' or unset) and never under
     Vitest, whose transformed output tests may inspect. */
  const stampSource =
    !process.env.VITEST && (command === 'serve' || process.env.VERCEL_ENV === 'preview')

  return {
    plugins: [
      ...(stampSource ? [devSourceLocation()] : []),
      react(),
      tailwindcss(),
      preloadLcpFont(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        sharp: fileURLToPath(new URL('./src/lib/sharp-stub.ts', import.meta.url)),
      },
    },
    optimizeDeps: {
      /* @huggingface/transformers ships ESM source and resolves fine served raw.
         onnxruntime-web needs the explicit include: the dep scanner never
         reaches it (its only importer is excluded), and its browser entry is
         a UMD webpack bundle that crashes (registerBackend on undefined) when
         Vite dev serves it as a native module. Prebundling wraps it in CJS
         interop. */
      include: ['onnxruntime-web'],
      exclude: ['@huggingface/transformers'],
    },
    define: {
      /* Bake Vercel's VERCEL_ENV system var ('production' | 'preview' |
         'development') into the client bundle at build time. It's a build-only
         env var, not VITE_-prefixed, so it isn't otherwise exposed to the
         browser — this is the one place it crosses into client code. Unset
         locally and in tests, where it collapses to '' (see src/lib/deployEnv).
         Consumed by RequireAdminSession to drop the invite-only gate on
         preview deployments only — never production, and by src/devtools to
         enable the annotation overlay on preview. */
      __VERCEL_ENV__: JSON.stringify(process.env.VERCEL_ENV ?? ''),
      /* Commit SHA of the deployed build (Vercel system var), baked in so
         client error reports (src/lib/errorReporting) can be tied back to the
         exact release and its source maps. Unset locally and under Vitest,
         where it collapses to '' (see src/lib/release). */
      __RELEASE_SHA__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA ?? ''),
    },
    build: {
      /* 'hidden' emits .map files but omits the `//# sourceMappingURL` comment,
         so browsers and crawlers never auto-fetch them. They exist only to
         symbolicate error-report stack traces; scripts/relocate-sourcemaps.mjs
         then moves them out of dist/ so they are never publicly served. */
      sourcemap: 'hidden',
      /* Tour-stop previews are `lazy()` from the landing path. Without this
         filter Vite still modulepreloads that chunk on every public page, so
         the "lazy" split never leaves the eager graph. */
      modulePreload: {
        resolveDependencies: (_filename, deps) =>
          deps.filter(
            (dep) => !dep.includes('tour-stop-preview') && !dep.includes('TourStopPreviewBody'),
          ),
      },
      rolldownOptions: {
        output: {
          /* Splits third-party deps (react, react-router-dom, lucide-react, …)
             into their own chunk so app code changes don't invalidate vendor
             caching, and to keep the main entry chunk under the 500kB warning.
             supabase-js gets its own group: only the app surface and /pricing
             import it (lazily), so prerendered marketing pages never download
             or preload it. */
          codeSplitting: {
            groups: [
              {
                name: 'tour-stop-preview',
                test: /[\\/]src[\\/]features[\\/]marketing[\\/]demos[\\/](TourStopPreviewBody\.tsx|tourStopDemoFixtures\.ts)$/,
                includeDependenciesRecursively: false,
              },
              /* The i18n catalogue splits along the same boundary
                 src/i18n/messages/{marketing,workspace,shared}.ts enforce at
                 the type level (TODO.md EF6a): ForcedLangProvider (every
                 marketing page) and src/seo/routes.ts read marketing.ts +
                 shared.ts through `t()`; LangProvider (/app, always behind a
                 lazy() boundary — see src/app/appSurface.tsx) reads the full
                 catalogue, including workspace.ts's ~29 modules.

                 A first attempt (2026-08-05) split this into two named groups
                 and measured 671.5kB eager — unchanged from the single-group
                 671.3kB baseline. Root cause: `includeDependenciesRecursively`
                 defaults to `true` (rolldown's CodeSplittingGroup type), so a
                 group's `test` only controls which modules can SEED it —
                 every dependency of a seed module rides along regardless of
                 whether that dependency's own id would exclude it. shell.ts
                 and workspaceMode.ts are dependencies of workspace.ts (a
                 seed), so excluding just those two files from the `test`
                 regex did nothing; they were never seeds needing exclusion,
                 they were riders. Setting `includeDependenciesRecursively:
                 false` on the workspace group is the actual fix — every
                 remaining module in it still matches `test` on its own id, so
                 nothing legitimate falls out, but shell.ts and
                 workspaceMode.ts (excluded from `test`, no longer dragged in
                 as dependencies) fall to default chunking instead, right next
                 to their other real importers: navLabels.ts and
                 ProductionEmptyState.tsx, both in ALLOWED_APP_MODULES below,
                 eager by construction because appViews.tsx's route objects
                 reference them directly.

                 Without any grouping, default chunking still puts all ~40
                 feature modules in one chunk: workspace.ts and marketing.ts
                 both flow through index.ts, so anything that imports index.ts
                 (LangProvider does, for the app surface) shares a chunk with
                 everything index.ts imports. The single-group 'messages' rule
                 this replaced predates the source split and existed for the
                 opposite reason: left to default chunking with no split at
                 all, the catalogue became 25+ separate files, each
                 modulepreloaded from every prerendered page. */
              /* Message catalogues split per consumer so a lazy page's
                 strings ride its own chunk instead of one eager bundle —
                 ForcedLangProvider keeps only common + seoMeta + landing
                 chrome/footer eagerly (see LangScope.tsx), and those stay
                 OUT of every group below: one eager member would make the
                 whole grouped chunk a preload again.

                 messages-marketing: pure-marketing sections (pages scope
                 them via LangScope). messages-shared: the dual-surface set
                 (support/helpCenter back /contact and in-app forms; shared.ts
                 is the aggregate both providers merge). landing/*: left
                 ungrouped — the leaf modules follow their importers
                 (LandingPage/PricingPage scopes, the workspace catalogue via
                 shared.ts), which is finer-grained than a 55kB forced chunk.
                 common.ts, seoMeta.ts and landing/{chrome,footer}.ts are
                 excluded everywhere and fall through to the entry chunk. */
              {
                name: 'messages-marketing',
                test: /[\\/]src[\\/]i18n[\\/]messages[\\/](marketing|pricing|templatesPreview|guidesIndex|about|faq|blog|templateUsage|knownLimitations|legalHub|changelog|comparison|jurisdictionTool)\.ts$/,
                /* false matters as much as the test: the default true pulls
                   each member's whole dependency subtree into the chunk —
                   marketing.ts → shared.ts → common.ts + all of landing/*,
                   and landing/pricing.ts → config/plans.ts → messages/index.ts
                   — which re-captures the eager chrome modules and pins the
                   chunk back onto every page. */
                includeDependenciesRecursively: false,
              },
              {
                name: 'messages-shared',
                test: /[\\/]src[\\/]i18n[\\/]messages[\\/](shared|support|helpCenter)\.ts$/,
                includeDependenciesRecursively: false,
              },
              {
                name: 'messages-workspace',
                test: /[\\/]src[\\/]i18n[\\/]messages[\\/](?!shell\.ts$)(?!workspaceMode\.ts$)(?!common\.ts$)(?!seoMeta\.ts$)(?!landing[\\/])/,
                includeDependenciesRecursively: false,
              },
              /* vendor is a whitelist (VENDOR_PACKAGES), not a catch-all:
                 only the eager runtime core belongs here. Everything else —
                 @supabase (lazy app surface + /pricing), react-markdown
                 (~158kB, Advisor replies), recharts + d3/redux (~430kB, one
                 ```chart block), pdf-lib + pako (~500kB, signed-PDF export),
                 docx/jszip (Word export), read-excel-file (XLSX import),
                 @huggingface/transformers + onnxruntime (browser AI), zod (lazy
                 API schemas), and every lucide icon only workspace screens
                 use — follows its importers and stays off the marketing
                 landing path. Giving any of those a named group would
                 backfire: a shared chunk attracts the vite/preload-helper
                 and gets pulled back into the eager entry graph, and a
                 dynamic-import tree like ChatChart's would turn into a
                 static chunk AdvisorView preloads. */
              {
                name: 'vendor',
                test: (id: string) => {
                  const pkg = packageOfModule(id)
                  return pkg !== undefined && VENDOR_PACKAGES.has(pkg)
                },
              },
            ],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      /* The e2e/ specs are Playwright's (*.spec.ts), driven by its own runner
         and a real browser — keep Vitest's default glob from claiming them. */
      exclude: [...configDefaults.exclude, 'e2e/**'],
      css: false,
      /* First test per worker pays the fixture-module transform cost; on a
         loaded machine that alone can exceed the 5s default. */
      testTimeout: 20000,
      hookTimeout: 20000,
      /* Force the doclib data layer onto its bundled fixtures, independent of
         any local .env: Vite loads .env for `vitest` same as `vite dev`, and a
         real Supabase read returns updated_at-sorted rows instead of the
         fixture order tests assert against. */
      env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
      /* Thresholds set a few points under the measured baseline (statements
         83.7%, branches 69.9%, functions 80.5%, lines 85.1%) so normal
         fluctuation doesn't flake CI, while a real coverage regression still
         fails `npm run test:coverage`. */
      coverage: {
        provider: 'v8',
        thresholds: {
          statements: 80,
          branches: 65,
          functions: 75,
          lines: 80,
        },
      },
    },
  }
})
