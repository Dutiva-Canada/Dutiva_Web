import fs from 'node:fs'
import path from 'node:path'

function slugToId(slug) {
  return slug.replace(/-/g, '_')
}

function splitContent(filePath, outDir, exportName) {
  const src = fs.readFileSync(filePath, 'utf8')
  const header = `import { bi } from '@/i18n/core'
import { li, p } from '../articleModel'
import type { ArticleSection } from '../articleModel'

export const sections: readonly ArticleSection[] = `
  const start = src.indexOf(`export const ${exportName}`)
  const objStart = src.indexOf('{', start)
  let depth = 0
  let i = objStart
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) {
        i++
        break
      }
    }
  }
  const objBody = src.slice(objStart, i)
  const slugRe = /'([^']+)':\s*\[/g
  const slugs = []
  let m
  while ((m = slugRe.exec(objBody))) {
    slugs.push({ slug: m[1], start: m.index + m[0].length - 1 })
  }
  fs.mkdirSync(outDir, { recursive: true })
  const imports = []
  for (const { slug, start: arrStart } of slugs) {
    let depth2 = 0
    let j = arrStart
    for (; j < objBody.length; j++) {
      if (objBody[j] === '[') depth2++
      else if (objBody[j] === ']') {
        depth2--
        if (depth2 === 0) {
          j++
          break
        }
      }
    }
    const arr = objBody.slice(arrStart, j)
    const outFile = path.join(outDir, `${slug}.ts`)
    fs.writeFileSync(outFile, header + arr + '\n')
    imports.push(`import { sections as ${slugToId(slug)} } from './${slug}'`)
  }
  const agg = `/**
 * Aggregated ${exportName === 'GUIDE_SECTIONS' ? 'guide' : 'blog'} sections — one file per slug.
 * Do not re-export from \`./index\` (article metadata); see content.ts.
 */
${imports.join('\n')}
import type { ArticleSection } from '../articleModel'

export const ${exportName}: Record<string, readonly ArticleSection[]> = {
${slugs.map((s) => `  '${s.slug}': ${slugToId(s.slug)},`).join('\n')}
}
`
  fs.writeFileSync(path.join(outDir, 'index.ts'), agg)
  console.log(`Split ${filePath} -> ${slugs.length} files in ${outDir}`)
}

const root = path.resolve(import.meta.dirname, '..')
splitContent(
  path.join(root, 'src/features/marketing/articles/guideContent.ts'),
  path.join(root, 'src/features/marketing/articles/guideContent'),
  'GUIDE_SECTIONS',
)
splitContent(
  path.join(root, 'src/features/marketing/articles/blogContent.ts'),
  path.join(root, 'src/features/marketing/articles/blogContent'),
  'BLOG_SECTIONS',
)
