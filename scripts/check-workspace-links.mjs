#!/usr/bin/env node
/**
 * Guard: no literal `/app/…` navigation targets in files that can render
 * under /demo or /fr/demo. The public demo shares the app route tree, so a
 * hardcoded `/app` link or navigate() call bounces a visitor to the
 * sign-in gate mid-tour — the bug fixed in workflows/knowledge, which had
 * escaped code review three times before this check existed.
 *
 * Fixes: `workspacePath(root, 'cases/…')` for <Link to>/<Navigate to>, or
 * `useWorkspaceNavigate()` for imperative calls (it rewrites /app paths to
 * the active root; passing the literal /app path to it is correct).
 *
 * Exempt by construction — files that can never render on a public root:
 *   - *ProductionView.tsx / ProductionEmptyState.tsx (signed-in /app only)
 *   - src/features/app/auth/** (the sign-in gate itself)
 *   - src/features/app/demo/** (banner/tour CTAs point at /app on purpose)
 *   - EntryStage (only mounted by /app/welcome)
 * …and `/app/welcome` targets anywhere: the gate lives at /app only, so
 * sending a demo visitor there is the intended conversion hop.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const SCAN_DIRS = ['src/features/app', 'src/components']

const EXEMPT_FILE = [
  /ProductionView\.tsx$/,
  /ProductionEmptyState\.tsx$/,
  /^src\/features\/app\/auth\//,
  /^src\/features\/app\/demo\//,
  /^src\/features\/app\/workspaceRoot\//,
  /shell\/EntryStage\.tsx$/,
  /\.test\.tsx?$/,
]

const LITERAL = /(?:to|href)=\{?["'`]\/app\/|navigate\(\s*["'`]\/app\//g
/** Elements that already rewrite /app targets — literals on them are correct. */
const ROOT_AWARE_TAGS = new Set(['WorkspaceLink', 'WorkspaceNavigate'])

/* Raw nav primitives in a demo-renderable file are the escape vector even
   when the /app literal sits in a variable, constant, or prop — see the
   repository docHref / wizard STUDIO_PATH / briefing go() bugs. WorkspaceLink,
   WorkspaceNavigate and useWorkspaceNavigate are strict supersets (non-/app
   targets pass through untouched), so there is no legitimate reason to import
   these from react-router-dom here. NavLink stays legal: its call sites take
   workspacePath()-resolved or relative targets and need isActive styling. */
const RAW_NAV_IMPORT = /import\s+\{([^}]+)\}\s+from\s+['"]react-router-dom['"]/g
const RAW_NAV_SPEC = /^(?:type\s+)?(Link|Navigate|useNavigate)\b/

/** Nearest JSX tag name opening before `pos` (scans back across lines). */
function enclosingTag(lines, lineIdx, colIdx) {
  for (let i = lineIdx; i >= Math.max(0, lineIdx - 8); i--) {
    const line = i === lineIdx ? lines[i].slice(0, colIdx) : lines[i]
    const lt = line.lastIndexOf('<')
    if (lt === -1) continue
    const gt = line.indexOf('>', lt)
    if (gt !== -1 && gt < (i === lineIdx ? colIdx : line.length)) continue // closed tag, keep looking up
    const name = /^<(\/?)([A-Za-z]+)/.exec(line.slice(lt))
    if (name && !name[1]) return name[2]
    if (name && name[1]) continue // a </close> tag — the opener is higher
  }
  return undefined
}

function* walk(dir) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) yield* walk(rel)
    else if (entry.name.endsWith('.tsx')) yield rel
  }
}

const errors = []
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    if (EXEMPT_FILE.some((re) => re.test(file))) continue
    const text = readFileSync(join(ROOT, file), 'utf8')
    for (const m of text.matchAll(RAW_NAV_IMPORT)) {
      for (const spec of m[1].split(',')) {
        const bad = RAW_NAV_SPEC.exec(spec.trim())
        if (bad) {
          const line = text.slice(0, m.index).split('\n').length
          errors.push(
            `${file}:${line} — raw ${bad[1]} import (use WorkspaceLink/WorkspaceNavigate or useWorkspaceNavigate())`,
          )
        }
      }
    }
    const hasWorkspaceNavigate = text.includes('useWorkspaceNavigate')
    // `WorkspaceLink as Link` / `WorkspaceNavigate as Navigate` aliases make
    // the local tag name root-aware too.
    const safeTags = new Set(ROOT_AWARE_TAGS)
    for (const m of text.matchAll(
      /import\s*\{\s*(WorkspaceLink|WorkspaceNavigate)\s+as\s+(\w+)\s*\}/g,
    )) {
      safeTags.add(m[2])
    }
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      const trimmed = line.trimStart()
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) return
      for (const match of line.matchAll(LITERAL)) {
        const hit = match[0]
        if (line.slice(match.index).startsWith(hit + 'welcome')) continue
        if (hit.startsWith('navigate') && hasWorkspaceNavigate) continue
        if (hit.startsWith('to') || hit.startsWith('href')) {
          const tag = enclosingTag(lines, i, match.index)
          if (tag && safeTags.has(tag)) continue
        }
        errors.push(
          `${file}:${i + 1} — ${hit}… (use WorkspaceLink/WorkspaceNavigate or useWorkspaceNavigate())`,
        )
      }
    })
  }
}

if (errors.length) {
  console.error(`check-workspace-links: FAIL\n  ${errors.join('\n  ')}`)
  process.exit(1)
}
console.log('check-workspace-links: OK')
