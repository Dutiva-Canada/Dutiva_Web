/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Mirror the GitHub wiki (Dutiva_Web.wiki) into docs/wiki/.
 *
 * The wiki lives in a separate GitHub repo. This script keeps a full in-repo
 * copy so agents and reviewers can read it without cloning the wiki.
 *
 * Usage:
 *   npm run wiki:sync
 *   npm run wiki:sync -- --pull
 *   npm run wiki:sync -- --push
 *   WIKI_REPO=/path/to/Dutiva_Web-wiki npm run wiki:sync
 */

import { copyFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dest = path.join(root, 'docs', 'wiki')
const mirrorReadme = path.join(dest, 'README.md')

const defaultWikiRepo = path.resolve(root, '..', 'Dutiva_Web-wiki')
const wikiRepo = process.env.WIKI_REPO ? path.resolve(process.env.WIKI_REPO) : defaultWikiRepo

const args = new Set(process.argv.slice(2))
const pull = args.has('--pull')
const push = args.has('--push')

if (pull && push) {
  console.error('sync-wiki: use --pull or --push, not both')
  process.exit(1)
}

async function listMarkdown(dir) {
  const entries = await readdir(dir)
  return entries.filter((name) => name.endsWith('.md')).sort()
}

async function copyDir(fromDir, toDir, { skip = new Set() } = {}) {
  const names = await listMarkdown(fromDir)
  let copied = 0
  for (const name of names) {
    if (skip.has(name)) continue
    await copyFile(path.join(fromDir, name), path.join(toDir, name))
    copied += 1
  }
  return { names: names.filter((n) => !skip.has(n)), copied }
}

async function ensureWikiRepo() {
  try {
    await stat(wikiRepo)
  } catch {
    console.error(`sync-wiki: wiki repo not found at ${wikiRepo}`)
    console.error('Clone it: git clone https://github.com/Dutiva-Canada/Dutiva_Web.wiki.git')
    console.error('Or set WIKI_REPO to your local clone path.')
    process.exit(1)
  }
}

async function main() {
  await ensureWikiRepo()

  if (pull) {
    console.log(`sync-wiki: git pull in ${wikiRepo}`)
    execSync('git pull --ff-only origin master', { cwd: wikiRepo, stdio: 'inherit' })
  }

  if (push) {
    console.log(`sync-wiki: copying docs/wiki → ${wikiRepo}`)
    const { copied, names } = await copyDir(dest, wikiRepo, { skip: new Set(['README.md']) })
    console.log(`sync-wiki: updated ${copied} file(s) in wiki repo`)
    console.log('Next: commit and push from the wiki clone if the diff looks right.')
    if (names.length === 0) process.exit(1)
    return
  }

  console.log(`sync-wiki: copying ${wikiRepo} → docs/wiki`)
  const { copied, names } = await copyDir(wikiRepo, dest, { skip: new Set(['README.md']) })
  console.log(`sync-wiki: copied ${copied} file(s)`)
  console.log(`sync-wiki: mirror readme preserved at ${path.relative(root, mirrorReadme)}`)

  if (names.length === 0) {
    console.error('sync-wiki: no markdown files found in wiki repo')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
