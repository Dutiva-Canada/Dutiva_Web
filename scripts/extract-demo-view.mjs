/*
 *   Copyright (c) 2026
 *   All rights reserved.
 */
/**
 * One-time helper: move inline *DemoView from *View.tsx into *DemoView.tsx.
 * Usage: node scripts/extract-demo-view.mjs Calendar
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const name = process.argv[2]
if (!name) {
  console.error('Usage: node scripts/extract-demo-view.mjs <ComponentName>')
  process.exit(1)
}

const views = {
  Analytics: 'src/features/app/views/analytics',
  Calendar: 'src/features/app/views/calendar',
  Compliance: 'src/features/app/views/compliance',
  EmployeeProfile: 'src/features/app/views/employees',
  CaseDetail: 'src/features/app/views/cases',
  CaseMemory: 'src/features/app/views/memory',
  MemoryManager: 'src/features/app/views/memory',
  PersonMemory: 'src/features/app/views/memory',
  ChatRecall: 'src/features/app/views/memory',
}

const dir = views[name]
if (!dir) {
  console.error(`Unknown component: ${name}`)
  process.exit(1)
}

const viewPath = path.join(dir, `${name}View.tsx`)
const content = readFileSync(viewPath, 'utf8')
const viewFn = `export function ${name}View()`
const demoFn = `function ${name}DemoView()`
const viewIdx = content.indexOf(viewFn)
const demoIdx = content.indexOf(demoFn)

if (viewIdx === -1 || demoIdx === -1) {
  console.error(`Could not find view/demo markers in ${viewPath}`)
  process.exit(1)
}

const beforeView = content.slice(0, viewIdx)
const demoBlock = content
  .slice(demoIdx)
  .replace(`function ${name}DemoView`, `export function ${name}DemoView`)

const demoImports = beforeView
  .replace(/import \{ useWorkspaceMode \} from '@\/features\/app\/workspaceMode\/workspaceModeContext'\n/g, '')
  .replace(
    new RegExp(`import \\{ ${name}ProductionView \\} from '\\.\\/${name}ProductionView'\\n`, 'g'),
    '',
  )

const docMatch = beforeView.match(/\/\*\*[\s\S]*?\*\//)
const doc = docMatch ? `${docMatch[0]}\n\n` : ''

const demoPath = path.join(dir, `${name}DemoView.tsx`)
writeFileSync(demoPath, `${demoImports}/** Northgate fixtures — demo workspace and public \`/demo\` only. */\n${demoBlock}`)

const viewContent = `import { useWorkspaceMode } from '@/features/app/workspaceMode/workspaceModeContext'
import { ${name}DemoView } from './${name}DemoView'
import { ${name}ProductionView } from './${name}ProductionView'

${doc}export function ${name}View() {
  const { mode: workspaceMode } = useWorkspaceMode()
  if (workspaceMode === 'production') return <${name}ProductionView />
  return <${name}DemoView />
}
`

writeFileSync(viewPath, viewContent)
console.log(`extracted ${name} -> ${demoPath}`)
