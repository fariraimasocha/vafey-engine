// Round-trip check: every lesson in seed/*.json must survive Markdown → Lexical → Markdown
// without losing content. Run: node scripts/check-markdown.ts
import { readFileSync, readdirSync } from 'node:fs'
import { createHeadlessEditor } from '@lexical/headless'
import { $exportLessonMarkdown, $importLessonMarkdown, LESSON_NODES } from '../src/components/editor/markdown.ts'

function roundTrip(markdown: string) {
  const editor = createHeadlessEditor({ nodes: LESSON_NODES, onError: (e) => { throw e } })
  editor.update(() => $importLessonMarkdown(markdown), { discrete: true })
  return editor.getEditorState().read(() => $exportLessonMarkdown())
}

// Compare ignoring whitespace/blank-line differences, table divider style, and `\~` escapes
// (Lexical escapes `~` so it can't start strikethrough; it renders identically).
const normalize = (md: string) =>
  md
    .replace(/\\~/g, '~')
    .replace(/^\|[\s:|-]+\|$/gm, '|---|')
    .replace(/\s+/g, ' ')
    .trim()

let failures = 0
let checked = 0
for (const file of readdirSync('seed').filter((f) => f.endsWith('.json'))) {
  const course = JSON.parse(readFileSync(`seed/${file}`, 'utf8'))
  for (const m of course.modules)
    for (const t of m.topics)
      for (const l of t.lessons) {
        checked++
        const once = roundTrip(l.content)
        const twice = roundTrip(once)
        const lossless = normalize(once) === normalize(l.content)
        const stable = once === twice
        if (!lossless || !stable) {
          failures++
          console.log(`✗ ${file} › ${l.title} (${!lossless ? 'content changed' : 'not stable'})`)
          const a = normalize(l.content)
          const b = normalize(once)
          let i = 0
          while (a[i] === b[i]) i++
          console.log(`  original: …${a.slice(Math.max(0, i - 60), i + 80)}…`)
          console.log(`  saved:    …${b.slice(Math.max(0, i - 60), i + 80)}…`)
        }
      }
}
console.log(`${checked - failures}/${checked} lessons round-trip cleanly`)
process.exit(failures ? 1 : 0)
