/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Post-build SEO validation — crawls the built dist/ output (not React
 * state) and fails the build on any violation. Checks, per prerendered
 * page: unique non-empty title and description, exactly one self-canonical,
 * robots policy, correct <html lang>, reciprocal hreflang (including
 * x-default and self), parseable JSON-LD on the canonical origin, exactly
 * one H1, a <main> landmark, substantive visible text, and no placeholder
 * junk. Site-wide: **exact coverage** of the route registry (every public
 * page prerendered, every indexable one in the sitemap, and nothing extra),
 * sitemap ↔ file ↔ canonical consistency, no private or noindex URL in the
 * sitemap or llms.txt, robots.txt policy, resolvable internal links, and a
 * noindex app shell + 404.
 */

process.env.NODE_ENV = 'production'

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const _rawOrigin = process.env.VITE_SITE_ORIGIN || 'https://dutiva.ca'
const ORIGIN = _rawOrigin.endsWith('/') ? _rawOrigin.slice(0, -1) : _rawOrigin

/** JSON-LD URLs must be on the canonical origin, schema.org, or a profile
 *  that is published on the site (LinkedIn, Facebook, Google Maps). */
function isAllowedJsonLdUrl(url, origin) {
  if (url.startsWith(origin) || url.startsWith('https://schema.org')) return true
  return (
    url.startsWith('https://www.linkedin.com/') ||
    url.startsWith('https://linkedin.com/') ||
    url.startsWith('https://www.facebook.com/') ||
    url.startsWith('https://facebook.com/') ||
    url.startsWith('https://www.google.com/maps') ||
    url.startsWith('https://maps.google.com/')
  )
}

/* The route registry, read back through the same SSR bundle the prerenderer
   used. Comparing dist/ against it (rather than against a hard-coded page
   count) is what makes "every public page is indexable" an enforced
   invariant instead of a smoke test: a registry entry that stops being
   rendered, or a stale directory left in dist/, fails the build. */
const { buildPrerenderManifest } = await import(
  pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href
)
const manifest = await buildPrerenderManifest()

const errors = []
const fail = (msg) => errors.push(msg)

/* ---------- collect prerendered pages ---------- */

async function collectPages(dir, base = '') {
  const pages = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'assets' || entry.name === 'brand') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      pages.push(...(await collectPages(full, `${base}/${entry.name}`)))
    } else if (entry.name === 'index.html') {
      pages.push({ route: base || '/', file: full })
    }
  }
  return pages
}

const pages = await collectPages(dist)

/* ---------- coverage: dist/ is exactly the route registry ---------- */

const expectedRoutes = new Set(manifest.map((entry) => entry.path))
const builtRoutes = new Set(pages.map((p) => p.route))
for (const route of expectedRoutes) {
  if (!builtRoutes.has(route)) fail(`registry page ${route} was not prerendered into dist/`)
}
for (const route of builtRoutes) {
  if (!expectedRoutes.has(route)) fail(`prerendered page ${route} is not in the route registry`)
}

const one = (doc, re, what, route) => {
  const matches = [...doc.matchAll(re)]
  if (matches.length !== 1) {
    fail(`${route}: expected exactly one ${what}, found ${matches.length}`)
    return undefined
  }
  return matches[0]
}

const PLACEHOLDER = /undefined|\[object Object\]|NaN|TODO|Lorem ipsum/
const seenTitles = new Map()
const seenCanonicals = new Map()
const canonicalByRoute = new Map()
const alternatesByRoute = new Map()

for (const { route, file } of pages) {
  const doc = await readFile(file, 'utf8')
  const head = doc.split('</head>')[0]
  const body = doc.split('<div id="root">')[1] ?? ''

  const title = one(head, /<title>([^<]*)<\/title>/g, '<title>', route)?.[1]
  if (title !== undefined) {
    if (!title.trim()) fail(`${route}: empty title`)
    if (PLACEHOLDER.test(title)) fail(`${route}: placeholder in title`)
    if (seenTitles.has(title)) fail(`${route}: duplicate title (also ${seenTitles.get(title)})`)
    seenTitles.set(title, route)
  }

  const description = one(
    head,
    /<meta name="description" content="([^"]*)"/g,
    'meta description',
    route,
  )?.[1]
  if (description !== undefined && description.trim().length < 40) {
    fail(`${route}: description too short`)
  }
  if (description && PLACEHOLDER.test(description)) fail(`${route}: placeholder in description`)

  const robots = one(head, /<meta name="robots" content="([^"]*)"/g, 'robots meta', route)?.[1]
  const indexable = robots?.includes('index,') || robots?.startsWith('index')
  if (!robots) fail(`${route}: missing robots meta`)

  const lang = /<html lang="([^"]*)"/.exec(doc)?.[1]
  const expectedLang = route === '/fr' || route.startsWith('/fr/') ? 'fr-CA' : 'en-CA'
  if (lang !== expectedLang) fail(`${route}: <html lang> is ${lang}, expected ${expectedLang}`)

  if (indexable) {
    const canonical = one(head, /<link rel="canonical" href="([^"]*)"/g, 'canonical', route)?.[1]
    if (canonical) {
      if (canonical !== `${ORIGIN}${route === '/' ? '/' : route}`) {
        fail(`${route}: canonical ${canonical} is not self-referencing`)
      }
      if (seenCanonicals.has(canonical)) {
        fail(`${route}: canonical shared with ${seenCanonicals.get(canonical)}`)
      }
      seenCanonicals.set(canonical, route)
      canonicalByRoute.set(route, canonical)
    }

    const alternates = Object.fromEntries(
      [...head.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)].map((m) => [
        m[1],
        m[2],
      ]),
    )
    for (const key of ['en-CA', 'fr-CA', 'x-default']) {
      if (!alternates[key]) fail(`${route}: missing hreflang ${key}`)
    }
    const self = `${ORIGIN}${route === '/' ? '/' : route}`
    if (alternates[expectedLang] !== self) {
      fail(`${route}: hreflang ${expectedLang} (${alternates[expectedLang]}) ≠ self (${self})`)
    }
    if (alternates['x-default'] !== alternates['en-CA']) {
      fail(`${route}: x-default must equal the en-CA alternate`)
    }
    alternatesByRoute.set(route, alternates)

    for (const [prop, count] of [
      ['og:title', 1],
      ['og:description', 1],
      ['og:url', 1],
      ['og:image', 1],
      ['og:locale', 1],
    ]) {
      const found = [...head.matchAll(new RegExp(`<meta property="${prop}" `, 'g'))].length
      if (found !== count) fail(`${route}: expected ${count} ${prop}, found ${found}`)
    }
    const ogImage = /<meta property="og:image" content="([^"]*)"/.exec(head)?.[1]
    if (ogImage) {
      const imgPath = ogImage.replace(ORIGIN, '')
      if (!existsSync(path.join(dist, imgPath))) fail(`${route}: og:image ${imgPath} missing`)
    }

    const jsonLdBlocks = [
      ...doc.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
    ]
    if (jsonLdBlocks.length !== 1) fail(`${route}: expected one JSON-LD block`)
    for (const [, block] of jsonLdBlocks) {
      try {
        const parsed = JSON.parse(block)
        const flat = JSON.stringify(parsed)
        if (PLACEHOLDER.test(flat)) fail(`${route}: placeholder value in JSON-LD`)
        for (const url of flat.matchAll(/"(https?:\/\/[^"]+)"/g)) {
          if (!isAllowedJsonLdUrl(url[1], ORIGIN)) {
            fail(`${route}: JSON-LD URL off canonical origin: ${url[1]}`)
          }
        }
        const graph = Array.isArray(parsed['@graph']) ? parsed['@graph'] : []
        const types = new Set(
          graph.flatMap((n) => (Array.isArray(n['@type']) ? n['@type'] : [n['@type']])),
        )
        const isEditorialArticle =
          /^\/guides\/(?!template-usage$)[^/]+$/.test(route) ||
          /^\/blog\/[^/]+$/.test(route) ||
          /^\/fr\/guides\/(?!utilisation-des-modeles$)[^/]+$/.test(route) ||
          /^\/fr\/blogue\/[^/]+$/.test(route)
        if (isEditorialArticle) {
          if (!types.has('Article')) fail(`${route}: editorial page missing Article JSON-LD`)
          const article = graph.find((n) => n['@type'] === 'Article')
          if (!article?.datePublished || !article?.dateModified) {
            fail(`${route}: Article JSON-LD missing datePublished/dateModified`)
          }
        }
        if (route === '/guides/template-usage' || route === '/fr/guides/utilisation-des-modeles') {
          if (!types.has('HowTo')) fail(`${route}: template-usage missing HowTo JSON-LD`)
        }
      } catch (e) {
        fail(`${route}: JSON-LD does not parse (${e.message})`)
      }
    }
  }

  const h1s = [...body.matchAll(/<h1[\s>]/g)].length
  if (h1s !== 1) fail(`${route}: expected exactly one <h1>, found ${h1s}`)
  if (!/<main[\s>]/.test(body)) fail(`${route}: missing <main> landmark`)
  const stripped = body.replace(/<script[\s\S]*?<\/script>/g, '')
  let visible = ''
  let inTag = false
  for (const ch of stripped) {
    if (ch === '<') {
      inTag = true
      visible += ' '
    } else if (ch === '>') inTag = false
    else if (!inTag) visible += ch
  }
  visible = visible.replace(/\s+/g, ' ')
  if (visible.length < 500) fail(`${route}: visible text too small (${visible.length} chars)`)
}

/* ---------- hreflang reciprocity across files ---------- */

for (const [route, alternates] of alternatesByRoute) {
  for (const key of ['en-CA', 'fr-CA']) {
    const target = alternates[key].replace(ORIGIN, '') || '/'
    const targetAlternates = alternatesByRoute.get(target)
    if (!targetAlternates) {
      fail(`${route}: hreflang ${key} points at ${target}, which is not a prerendered page`)
      continue
    }
    if (targetAlternates[key] !== alternates[key]) {
      fail(`${route}: hreflang ${key} not reciprocal with ${target}`)
    }
  }
  // EN and FR pages must never canonicalize to each other.
  const canonical = canonicalByRoute.get(route)
  const otherLocale = route === '/fr' || route.startsWith('/fr/') ? 'en-CA' : 'fr-CA'
  if (
    canonical &&
    canonical === alternates[otherLocale] &&
    alternates['en-CA'] !== alternates['fr-CA']
  ) {
    fail(`${route}: canonical points at the other locale`)
  }
}

/* ---------- sitemap ---------- */

const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8')
if (/&(?!amp;|lt;|gt;|quot;|apos;|#)/.test(sitemap)) fail('sitemap.xml: unescaped ampersand')
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('sitemap.xml: duplicate URLs')
for (const url of sitemapUrls) {
  if (!url.startsWith(`${ORIGIN}/`) && url !== `${ORIGIN}/`) {
    fail(`sitemap.xml: ${url} not on canonical origin`)
  }
  const route = url.replace(ORIGIN, '') || '/'
  if (route.startsWith('/app')) fail(`sitemap.xml: private URL ${url}`)
  if (/[?#]/.test(url)) fail(`sitemap.xml: URL with query/fragment ${url}`)
  const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route, 'index.html')
  if (!existsSync(file)) {
    fail(`sitemap.xml: ${url} has no prerendered file`)
    continue
  }
  const doc = await readFile(file, 'utf8')
  if (!/<meta name="robots" content="index/.test(doc)) {
    fail(`sitemap.xml: ${url} is not marked indexable`)
  }
}
for (const [route] of canonicalByRoute) {
  const url = `${ORIGIN}${route === '/' ? '/' : route}`
  if (!sitemapUrls.includes(url)) fail(`indexable page ${route} missing from sitemap.xml`)
}
/* Same check from the registry side, so a page that is indexable on paper but
   never reached dist/ (and therefore has no canonical to iterate) still
   fails, instead of quietly disappearing from search. */
for (const entry of manifest) {
  if (!entry.indexable) continue
  const url = `${ORIGIN}${entry.path === '/' ? '/' : entry.path}`
  if (!sitemapUrls.includes(url))
    fail(`indexable registry page ${entry.path} missing from sitemap.xml`)
}

/* <lastmod> must follow <loc> directly: the sitemaps.org 0.9 schema declares
   the sitemap-namespace children of <url> as an ordered sequence, so a
   lastmod trailing the xhtml:link alternates trips strict validators. */
for (const [, block] of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1]
  if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(block)) {
    fail(`sitemap.xml: ${loc} is missing an ISO <lastmod>`)
  }
  const order = [...block.matchAll(/<(lastmod|xhtml:link)\b/g)].map((m) => m[1])
  if (order.indexOf('lastmod') > order.indexOf('xhtml:link') && order.includes('lastmod')) {
    fail(`sitemap.xml: ${loc} has <lastmod> after the hreflang alternates`)
  }
}

/* ---------- robots.txt ---------- */

const robotsTxt = await readFile(path.join(dist, 'robots.txt'), 'utf8')
if (!robotsTxt.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) {
  fail('robots.txt: missing production sitemap reference')
}
if (!robotsTxt.includes('Content-Signal: search=yes, ai-input=yes, ai-train=yes')) {
  fail('robots.txt: missing Content-Signal opt-in (search / ai-input / ai-train)')
}
// Training crawlers (decided 2026-08-06, D4): opted in. All listed training
// bots must be present with Content-Signal + the same private-path exclusions.
for (const bot of ['GPTBot', 'ClaudeBot', 'CCBot', 'Amazonbot', 'Google-Extended']) {
  if (!robotsTxt.includes(`User-agent: ${bot}`))
    fail(`robots.txt: missing group for training bot ${bot}`)
  if (
    !new RegExp(
      String.raw`User-agent: ${bot}\nContent-Signal: search=yes, ai-input=yes, ai-train=yes\nDisallow: /app\n`,
    ).test(robotsTxt)
  ) {
    fail(`robots.txt: training bot ${bot} group must repeat Content-Signal + /app exclusions`)
  }
}
const searchAndFetchBots = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Googlebot',
  'bingbot',
  'Applebot-Extended',
  'meta-externalagent',
  '*',
]
for (const bot of searchAndFetchBots) {
  if (!robotsTxt.includes(`User-agent: ${bot}`)) fail(`robots.txt: missing group for ${bot}`)
}
// Named groups replace * entirely, so each must repeat Content-Signal + /app.
for (const bot of searchAndFetchBots.filter((b) => b !== '*')) {
  if (
    !new RegExp(
      String.raw`User-agent: ${bot}\nContent-Signal: search=yes, ai-input=yes, ai-train=yes\nDisallow: /app\n`,
    ).test(robotsTxt)
  ) {
    fail(`robots.txt: ${bot} group must repeat Content-Signal + /app exclusions`)
  }
}
if (
  !/User-agent: \*\nContent-Signal: search=yes, ai-input=yes, ai-train=yes\nDisallow: \/app\n/.test(
    robotsTxt,
  )
) {
  fail('robots.txt: general group must declare Content-Signal and disallow /app')
}

/* ---------- llms.txt ---------- */

const llms = await readFile(path.join(dist, 'llms.txt'), 'utf8')
/* Only markdown links count as navigation; prose may mention /app to state
   that it is private. */
for (const m of llms.matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
  const url = m[1]
  if (!url.startsWith(ORIGIN)) fail(`llms.txt: off-origin URL ${url}`)
  const route = url.replace(ORIGIN, '') || '/'
  if (route.startsWith('/app')) fail(`llms.txt: private URL ${url}`)
  const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route, 'index.html')
  if (!existsSync(file)) fail(`llms.txt: ${url} has no prerendered page`)
}

/* ---------- app shell + 404 ---------- */

const appShell = await readFile(path.join(dist, 'app.html'), 'utf8')
if (!appShell.includes('noindex, nofollow')) fail('app.html: missing noindex')
if (appShell.includes('rel="canonical"')) fail('app.html: must not carry a canonical')
if (appShell.includes('cdn.ywxi.net')) fail('app.html: must not load TrustedSite')
const homeHtml = await readFile(path.join(dist, 'index.html'), 'utf8')
if (!homeHtml.includes('https://cdn.ywxi.net/js/1.js')) {
  fail('index.html: missing TrustedSite main code')
}
const notFound = await readFile(path.join(dist, '404.html'), 'utf8')
if (!notFound.includes('noindex')) fail('404.html: missing noindex')

/* ---------- internal links resolve ---------- */

const knownRoutes = new Set(pages.map((p) => p.route))
for (const { route, file } of pages) {
  const doc = await readFile(file, 'utf8')
  const body = doc.split('<div id="root">')[1] ?? ''
  for (const m of body.matchAll(/href="(\/[^"#]*)(#[^"]*)?"/g)) {
    /* Drop the query before resolving, the same way the hash is already
       dropped: neither is part of route identity. `/contact?topic=sales`
       is the Contact page with a category preselected (ContactPage reads
       the param), not a route of its own — matching the raw href would
       report every deep link as a broken one. */
    const target = m[1].split('?')[0].replace(/\/$/, '') || '/'
    if (target.startsWith('/app')) continue // client-rendered surface
    if (target.startsWith('/assets') || target.startsWith('/brand')) {
      if (!existsSync(path.join(dist, target))) fail(`${route}: broken asset link ${target}`)
      continue
    }
    if (!knownRoutes.has(target)) fail(`${route}: internal link to unknown route ${target}`)
  }
}

/* ---------- report ---------- */

if (errors.length > 0) {
  console.error(`SEO validation failed with ${errors.length} problem(s):`)
  for (const error of errors.slice(0, 50)) console.error(`  - ${error}`)
  process.exit(1)
}
console.log(
  `SEO validation passed: ${pages.length} pages, ${sitemapUrls.length} sitemap URLs, ` +
    'reciprocal hreflang, valid JSON-LD, resolvable internal links.',
)
