/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Build-time prerendering + SEO artifact generation. Runs after the client
 * build (`vite build`) and the SSR build (`vite build --ssr`):
 *
 *   1. Renders every public page (EN + FR) through dist-ssr/entry-server.js
 *      and writes crawlable, page-specific HTML into dist/<path>/index.html
 *      — full head metadata (title, description, robots, canonical,
 *      hreflang, Open Graph, JSON-LD) plus the rendered page body.
 *   2. Writes dist/app.html — the empty client-rendered shell that Vercel
 *      rewrites /app/* to (noindex; the workspace is private).
 *   3. Writes dist/404.html — a real not-found page (noindex) served with a
 *      404 status for unknown URLs on static hosting.
 *   4. Generates sitemap.xml, robots.txt, and llms.txt from the same route
 *      registry the pages themselves use, so they can never drift.
 *
 * Everything here is deterministic: no build timestamps are written into
 * any artifact (sitemap lastmod comes from real content dates only).
 */

process.env.NODE_ENV = 'production'

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const entryUrl = pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href

const {
  renderPage,
  buildPrerenderManifest,
  serializeHead,
  SITE_ORIGIN,
  ORG,
  ORG_DESCRIPTION,
  FOUNDER,
} = await import(entryUrl)

const template = await readFile(path.join(dist, 'index.html'), 'utf8')

/** Optional search-engine verification tags, injected from the environment
    at build time (never hard-coded). */
function verificationTags() {
  const tags = []
  const google = process.env.GOOGLE_SITE_VERIFICATION
  const bing = process.env.BING_SITE_VERIFICATION
  if (google) tags.push(`<meta name="google-site-verification" content="${escapeAttr(google)}">`)
  if (bing) tags.push(`<meta name="msvalidate.01" content="${escapeAttr(bing)}">`)
  return tags
}

function escapeAttr(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

/** Replaces the template's generic title/description with a page's head. */
function composeDocument({ htmlLang, headHtml, bodyHtml }) {
  let doc = template
  doc = doc.replace(/<html lang="[^"]*"/, `<html lang="${htmlLang}"`)
  doc = doc.replace(/<title>[\s\S]*?<\/title>\n?/, '')
  // Remove the generic <meta name="description" … /> tag (and any preceding
  // whitespace on its line) without a regex — the linter flags any regex
  // with a variable-length prefix as super-linear-backtracking-prone.
  const metaStart = doc.indexOf('<meta name="description"')
  if (metaStart !== -1) {
    const metaEnd = doc.indexOf('/>', metaStart)
    if (metaEnd !== -1) {
      let lineStart = metaStart
      while (lineStart > 0 && (doc[lineStart - 1] === ' ' || doc[lineStart - 1] === '\t')) {
        lineStart--
      }
      let lineEnd = metaEnd + 2
      if (doc[lineEnd] === '\n') lineEnd++
      doc = doc.slice(0, lineStart) + doc.slice(lineEnd)
    }
  }
  const headBlock = [...verificationTags(), headHtml].filter(Boolean).join('\n    ')
  doc = doc.replace('</head>', `  ${headBlock}\n  </head>`)
  doc = doc.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
  return doc
}

function outputPathFor(pathname) {
  if (pathname === '/') return path.join(dist, 'index.html')
  return path.join(dist, ...pathname.replace(/^\//, '').split('/'), 'index.html')
}

async function writePage(pathname, contents) {
  const file = outputPathFor(pathname)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, contents)
}

/* ------------------------------------------------------------------ */
/* 1. Public pages                                                     */
/* ------------------------------------------------------------------ */

const manifest = await buildPrerenderManifest()
const problems = []

for (const entry of manifest) {
  const { html, head } = await renderPage(entry.path)
  if (!head) {
    problems.push(`${entry.path}: page rendered no <Seo> metadata`)
    continue
  }
  if (!html || html.length < 500) {
    problems.push(`${entry.path}: prerendered body suspiciously small (${html.length} bytes)`)
  }
  await writePage(
    entry.path,
    composeDocument({
      htmlLang: entry.htmlLang,
      headHtml: serializeHead(head),
      bodyHtml: html,
    }),
  )
}

/* ------------------------------------------------------------------ */
/* 2. App shell (client-rendered, noindex)                             */
/* ------------------------------------------------------------------ */

const appHead = [
  `<title>Dutiva</title>`,
  `<meta name="robots" content="noindex, nofollow" data-seo>`,
].join('\n    ')
await writeFile(
  path.join(dist, 'app.html'),
  composeDocument({ htmlLang: 'en-CA', headHtml: appHead, bodyHtml: '' }),
)

/* ------------------------------------------------------------------ */
/* 3. 404 page (noindex, real status from the static host)             */
/* ------------------------------------------------------------------ */

{
  const { html, head } = await renderPage('/__not-found__')
  await writeFile(
    path.join(dist, '404.html'),
    composeDocument({ htmlLang: 'en-CA', headHtml: serializeHead(head), bodyHtml: html }),
  )
}

{
  const { html, head } = await renderPage('/fr/__not-found__')
  await mkdir(path.join(dist, 'fr'), { recursive: true })
  await writeFile(
    path.join(dist, 'fr', '404.html'),
    composeDocument({ htmlLang: 'fr-CA', headHtml: serializeHead(head), bodyHtml: html }),
  )
}

/* ------------------------------------------------------------------ */
/* 4. sitemap.xml                                                      */
/* ------------------------------------------------------------------ */

const indexable = manifest.filter((entry) => entry.indexable)
const sitemapUrls = indexable
  .map((entry) => {
    /* Element order matters: the sitemaps.org 0.9 schema declares the
       sitemap-namespace children of <url> as an ordered sequence (loc,
       lastmod, …), so lastmod goes immediately after loc and the xhtml
       extension elements trail it. */
    const lines = ['  <url>', `    <loc>${SITE_ORIGIN}${entry.path}</loc>`]
    if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`)
    lines.push(
      `    <xhtml:link rel="alternate" hreflang="en-CA" href="${SITE_ORIGIN}${entry.alternates.en}"/>`,
      `    <xhtml:link rel="alternate" hreflang="fr-CA" href="${SITE_ORIGIN}${entry.alternates.fr}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}${entry.alternates.en}"/>`,
      '  </url>',
    )
    return lines.join('\n')
  })
  .join('\n')

await writeFile(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapUrls}
</urlset>
`,
)

/* ------------------------------------------------------------------ */
/* 5. robots.txt                                                       */
/* ------------------------------------------------------------------ */

/* Crawler policy (docs/SEO_GEO_IMPLEMENTATION.md):
   - Search discovery is welcome, including AI *search* crawlers that cite
     sources (OAI-SearchBot, Claude-SearchBot, PerplexityBot).
   - Foundation-model *training* crawlers are opted in (decided 2026-08-06,
     D4): GPTBot (OpenAI), ClaudeBot (Anthropic), CCBot (Common Crawl),
     Amazonbot (Amazon), Google-Extended (Google Gemini/Vertex). All get the
     same private-path exclusions as everyone else. This is a deliberate,
     reversible policy choice — to opt out, move a bot back to a Disallow: /
     block.
   - Private app surfaces are excluded for every crawler. robots.txt is not
     a security boundary: /app is also noindex and behind authentication. */
const PRIVATE_PATHS = ['/app', '/app/', '/app.html', '/404.html']
const disallowBlock = PRIVATE_PATHS.map((p) => `Disallow: ${p}`).join('\n')
const searchBots = ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot']
const trainingBots = ['GPTBot', 'ClaudeBot', 'CCBot', 'Amazonbot', 'Google-Extended']

await writeFile(
  path.join(dist, 'robots.txt'),
  [
    '# Dutiva crawler policy — see docs/SEO_GEO_IMPLEMENTATION.md',
    '# Generated at build time from the public route registry.',
    '',
    'User-agent: *',
    disallowBlock,
    '',
    '# AI search/retrieval crawlers (answer engines that cite sources):',
    '# welcome, with the same private-path exclusions as everyone else.',
    ...searchBots.flatMap((bot) => [`User-agent: ${bot}`, disallowBlock, '']),
    '# Foundation-model TRAINING crawlers: opted in (decided 2026-08-06, D4).',
    '# All get the same private-path exclusions as everyone else.',
    ...trainingBots.flatMap((bot) => [`User-agent: ${bot}`, disallowBlock, '']),
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n'),
)

/* ------------------------------------------------------------------ */
/* 6. llms.txt                                                         */
/* ------------------------------------------------------------------ */

const byKey = new Map(indexable.filter((e) => e.lang === 'en').map((e) => [e.key, e]))
const frByKey = new Map(indexable.filter((e) => e.lang === 'fr').map((e) => [e.key, e]))
const line = (key) => {
  const e = byKey.get(key)
  return e ? `- [${e.title}](${SITE_ORIGIN}${e.path}): ${e.description}` : null
}
const legalLine = (slug) => line(`legalDoc:${slug}`)

await writeFile(
  path.join(dist, 'llms.txt'),
  [
    `# ${ORG.name} (${ORG.legalName})`,
    '',
    `> ${ORG_DESCRIPTION.en}`,
    '',
    '- Audience: Canadian employers, HR teams, and business operators.',
    '- Country served: Canada. Jurisdiction-specific guidance currently covers Ontario, Quebec, and the federal labour regime; additional provinces are planned.',
    '- Languages: English (en-CA) and Canadian French (fr-CA). Every public page has a French equivalent under /fr (e.g. ' +
      `${SITE_ORIGIN}/fr).`,
    '- Dutiva provides practical HR workflow support and compliance-oriented guidance. It does not provide legal advice.',
    '- Dutiva is HR compliance and documentation software. It is not a payroll provider or payroll processor: it does not run payroll, remit source deductions, or issue pay.',
    `- Founder: ${FOUNDER.name}, ${FOUNDER.jobTitle.en}.`,
    `- The authenticated application (${SITE_ORIGIN}/app) is private customer workspace content and is not part of the public documentation.`,
    '',
    '## Product',
    line('home'),
    line('pricing'),
    line('templates'),
    '',
    '## Resources',
    line('guides'),
    line('templateUsage'),
    line('faq'),
    line('knownLimitations'),
    line('blog'),
    line('changelog'),
    line('vsHrdownloads'),
    line('vsSixfifty'),
    '',
    '## Legal & trust',
    line('about'),
    line('legal'),
    legalLine('privacy'),
    legalLine('terms'),
    legalLine('disclaimer'),
    legalLine('ai-technology'),
    legalLine('pipeda-compliance'),
    legalLine('quebec-law-25'),
    legalLine('security'),
    legalLine('accessibility'),
    '',
    '## Contact',
    `- Support: ${ORG.supportEmail}`,
    `- Legal: ${ORG.legalEmail}`,
    '',
    '## Version française',
    `- [${frByKey.get('home')?.title}](${SITE_ORIGIN}${frByKey.get('home')?.path}): ${frByKey.get('home')?.description}`,
    '',
  ]
    .filter((l) => l !== null)
    .join('\n'),
)

/* ------------------------------------------------------------------ */

if (problems.length > 0) {
  console.error('Prerender validation failed:')
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(
  `Prerendered ${manifest.length} pages (${indexable.length} indexable URLs in sitemap.xml), ` +
    'plus app.html, 404.html, robots.txt, llms.txt.',
)
