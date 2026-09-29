/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * Mirror sync: GitLab main → GitHub mirror → Vercel production deploy.
 *
 * `main` lives on GitLab; Vercel builds production from the GitHub mirror's
 * `main`, which is protected (pull requests + verified signatures + linear
 * history + resolved conversations). Direct pushes and the older
 * github-sync.mjs Git-Data replay are both rejected by that protection, so
 * this script drives the PR path end to end:
 *
 *   1. Verify the working tree is clean and on main.
 *   2. Push a fresh mirror branch to GitHub.
 *   3. Open a PR via the stored git credential for github.com
 *      (MartinConstantineau-code — martinconstantineau itself cannot author
 *      API writes while its email is unverified).
 *   4. Try an immediate squash merge; if branch protection still reports
 *      blocked (e.g. a fresh Devin Review posted unresolved threads), arm
 *      auto-merge instead and poll the PR — whichever path lands the merge,
 *      verify github/main's resulting tree equals local main's before
 *      reporting success.
 *
 * Signing is opt-in (`--sign`) and normally unnecessary: a squash merge
 * produces a single commit authored and signed by GitHub's web flow, which
 * satisfies the mirror's signed-commits rule on its own. The rebase-sign
 * also cannot run on a repeat sync — merge-base(main, github/main) resolves
 * to the previous squash commit (linked into main's history only through
 * the back-merge), so `fork..main` still contains every GitLab-side commit
 * the squash flattened, and replaying them onto the squash tip conflicts
 * on every pick. Use --sign only if a future protection change makes the
 * branch commits themselves require signatures.
 *
 * Usage:  npm run mirror             — sync + PR + merge/auto-merge
 *         npm run mirror -- --resolve — additionally resolve all open review
 *                                       threads before merging (use after
 *                                       you've read them)
 *         npm run mirror -- --sign    — rebase-sign unsigned commits first
 *                                       (rewrites SHAs; GitLab is
 *                                       force-pushed to match)
 *
 * --sign prerequisite: the SSH signing key at ~/.ssh/dutiva_signing_ed25519
 * must exist and its .pub half must be registered as a *signing* key on the
 * GitHub account that owns the commit email.
 */

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const REPO = 'Dutiva-Canada/Dutiva_Web'
const MIRROR_BRANCH = `mirror/${Date.now().toString(36)}`
const HOME = process.env.USERPROFILE ?? process.env.HOME
const SIGNING_PUB = `${HOME}/.ssh/dutiva_signing_ed25519.pub`
const RESOLVE = process.argv.includes('--resolve')
const SIGN = process.argv.includes('--sign')

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const gitOk = (...args) => {
  try {
    execFileSync('git', args, { encoding: 'utf8', stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function ghToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN
  const out = execFileSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
  })
  return out.match(/^password=(.+)$/m)?.[1]
}

async function api(method, path, body, token) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok)
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)?.slice(0, 300)}`)
  return json
}

async function gql(query, variables, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(`graphql: ${JSON.stringify(json.errors).slice(0, 300)}`)
  return json.data
}

// --- guards ---------------------------------------------------------------

// Untracked files are harmless for a sync — only tracked drift matters.
if (!gitOk('diff', '--quiet') || !gitOk('diff', '--cached', '--quiet'))
  throw new Error('working tree has uncommitted changes — commit or stash first')
if (git('branch', '--show-current') !== 'main') throw new Error('run from main')

git('fetch', 'origin', 'main')
git('fetch', 'github', 'main')
const localTip = git('rev-parse', 'main')
const ghTree = git('rev-parse', 'github/main^{tree}')
const localTree = git('rev-parse', 'main^{tree}')
if (ghTree === localTree) {
  console.log('github/main already mirrors local main — nothing to sync')
  process.exit(0)
}

// --- signing ---------------------------------------------------------------

// Signature presence: read the raw object — %GG/%G? emit nothing for SSH
// signatures when local verification can't run (no allowedSignersFile).
const isSigned = (sha) => git('cat-file', 'commit', sha).includes('\ngpgsig ')
// github/main's tip is a squash commit that already contains the synced
// changes — replaying onto it conflicts every pick. The rebase base is the
// merge-base (the last commit both histories share). Even so, fork..main
// still lists every GitLab-side commit the squash flattened, so this range
// is only meaningful when --sign was explicitly requested.
const fork = SIGN ? git('merge-base', 'main', 'github/main') : ''
const unsigned = SIGN
  ? git('rev-list', `${fork}..${localTip}`)
      .split('\n')
      .filter(Boolean)
      .filter((sha) => !isSigned(sha))
  : []

if (SIGN && unsigned.length > 0) {
  if (!existsSync(SIGNING_PUB))
    throw new Error(
      `${unsigned.length} unsigned commits and no signing key at ${SIGNING_PUB} — ` +
        'create one (ssh-keygen -t ed25519) and register the .pub on GitHub as a Signing Key',
    )
  console.log(`signing ${unsigned.length} commits…`)
  const sshKeygen = existsSync('C:/Program Files/Git/usr/bin/ssh-keygen.exe')
    ? 'C:/Program Files/Git/usr/bin/ssh-keygen.exe'
    : 'ssh-keygen'
  const signingArgs = [
    '-c',
    'commit.gpgsign=true',
    '-c',
    'gpg.format=ssh',
    '-c',
    `user.signingkey=${SIGNING_PUB}`,
    '-c',
    `gpg.ssh.program=${sshKeygen}`,
    '-c',
    'user.name=Martin Constantineau',
    '-c',
    'user.email=Martin.Constantineau@dutiva.ca',
  ]
  if (!gitOk(...signingArgs, 'rebase', '--force-rebase', fork, 'main'))
    throw new Error('rebase-sign failed — check `git status` for a stopped rebase')
  const stillUnsigned = git('rev-list', `${fork}..HEAD`)
    .split('\n')
    .filter(Boolean)
    .filter((sha) => !isSigned(sha))
  if (stillUnsigned.length > 0)
    throw new Error(`signing incomplete — ${stillUnsigned.length} commits still unsigned`)
  // SHAs changed — keep GitLab and local in agreement
  git('push', 'origin', 'main', '--force-with-lease')
  console.log('signed + force-pushed GitLab main')
}

// --- push mirror branch + open PR ------------------------------------------

git('push', 'github', 'HEAD:refs/heads/' + MIRROR_BRANCH, '--force')
console.log(`pushed ${MIRROR_BRANCH}`)

const token = ghToken()
const pr = await api(
  'POST',
  'pulls',
  {
    title: `Mirror sync ${new Date().toISOString().slice(0, 10)}`,
    head: MIRROR_BRANCH,
    base: 'main',
    body: 'Automated GitLab → GitHub mirror sync. Generated by `npm run mirror`.',
  },
  token,
)
console.log(`PR #${pr.number} opened`)

// --- merge -------------------------------------------------------------------

if (RESOLVE) {
  const data = await gql(
    `{ repository(owner: "Dutiva-Canada", name: "Dutiva_Web") { pullRequest(number: ${pr.number}) { reviewThreads(first: 50) { nodes { id isResolved } } } } }`,
    {},
    token,
  )
  for (const t of data.repository.pullRequest.reviewThreads.nodes) {
    if (t.isResolved) continue
    await gql(
      `mutation($id: ID!) { resolveReviewThread(input: { threadId: $id }) { thread { isResolved } } }`,
      { id: t.id },
      token,
    )
  }
  console.log('all review threads resolved')
}

let merged = false
try {
  await api(
    'PUT',
    `pulls/${pr.number}/merge`,
    {
      merge_method: 'squash',
      commit_title: `${pr.title} (#${pr.number})`,
    },
    token,
  )
  merged = true
  console.log(`merged — Vercel builds from github/main now (watch: vercel ls)`)
} catch (err) {
  // Blocked merge (fresh review threads, pending checks) — arm auto-merge so
  // it completes the moment protection clears, then surface the reason.
  try {
    await gql(
      `mutation($pr: ID!) { enablePullRequestAutoMerge(input: { pullRequestId: $pr, mergeMethod: SQUASH }) { pullRequest { autoMergeRequest { enabledAt } } } }`,
      { pr: pr.node_id },
      token,
    )
    console.log('auto-merge armed (squash) — will complete when protection clears')
  } catch {
    console.log('auto-merge could not be armed')
  }
  console.log(`merge deferred: ${err.message}`)
  console.log(`review it at https://github.com/${REPO}/pull/${pr.number}`)
}

// --- verify: github/main's tree must equal local main's ----------------------
// A squash merge applies a three-way diff against the real merge-base, not a
// snapshot of our tree — if the merge-base already contains a head-side
// change, git keeps the base side and the mirrored file silently diverges
// (observed 2026-09-29: `export` dropped from localAudit.ts, breaking the
// Vercel build). Compare trees after every merge — including merges GitHub
// completes later via auto-merge, which can otherwise publish a divergent
// tree without this script noticing.
function verifyMirror() {
  git('fetch', 'github', 'main')
  const ghTree = git('rev-parse', 'FETCH_HEAD^{tree}')
  const glTree = git('rev-parse', 'main^{tree}')
  if (ghTree === glTree) {
    console.log('verified: github/main tree == main tree')
    return
  }
  console.error('mirror verify FAILED — github/main tree differs from local main:')
  try {
    console.error(git('diff', '--stat', 'github/main', 'main'))
  } catch {}
  console.error(
    'Recovery: commit a change on the divergent file(s) in GitLab so the ' +
      'head-side diff is non-empty, re-run npm run mirror, and resolve ' +
      'conflicts with `git merge -s ours github/main` on the mirror branch.',
  )
  process.exitCode = 1
}

if (!merged) {
  // Deferred merge — poll until GitHub completes it (bounded), then verify.
  const deadline = Date.now() + 10 * 60_000
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 20_000))
    const state = await api('GET', `pulls/${pr.number}`, undefined, token)
    if (state.merged) {
      merged = true
      break
    }
    if (state.state === 'closed') break
  }
  if (!merged) {
    console.error(
      `mirror PR #${pr.number} still unmerged — re-run \`npm run mirror\` once it lands to verify the tree`,
    )
    process.exit(2)
  }
}
verifyMirror()
