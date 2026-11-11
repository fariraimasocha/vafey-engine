// Lesson content is stored as Markdown. These are the Lexical nodes + Markdown transformers the
// editor uses to load and save it. Pure module (no React) so it can be tested headless:
// node scripts/check-markdown.ts
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  type ElementTransformer,
  type Transformer,
} from '@lexical/markdown'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table'
import { $isParagraphNode, $isTextNode, type LexicalNode } from 'lexical'

export const LESSON_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
]

// Everything except tables (used for content *inside* table cells) and checklists (not used in lessons).
const BASE_TRANSFORMERS: Transformer[] = [
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
].filter((t) => t !== CHECK_LIST)

// ---------- GFM tables (not shipped by @lexical/markdown; adapted from the Lexical playground) ----------

const ROW = /^\|(.+)\|\s?$/
const DIVIDER = /^(\|\s?:?-+:?\s?)+\|\s?$/
// Split on pipes that aren't escaped (`\|`).
const splitCells = (row: string) => row.split(/(?<!\\)\|/)

function $createCell(markdown: string) {
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS)
  $convertFromMarkdownString(markdown.trim().replace(/\\n/g, '\n'), BASE_TRANSFORMERS, cell)
  return cell
}

function parseRow(text: string) {
  const match = text.match(ROW)
  return match?.[1] ? splitCells(match[1]).map($createCell) : null
}

const columnCount = (table: LexicalNode) =>
  $isTableNode(table) ? ((table.getFirstChild() as TableRowNode | null)?.getChildrenSize() ?? 0) : 0

export const TABLE: ElementTransformer = {
  type: 'element',
  dependencies: [TableNode, TableRowNode, TableCellNode],
  regExp: ROW,
  export: (node) => {
    if (!$isTableNode(node)) return null
    const lines: string[] = []
    for (const row of node.getChildren()) {
      if (!$isTableRowNode(row)) continue
      let isHeader = false
      const cells = row.getChildren().flatMap((cell) => {
        if (!$isTableCellNode(cell)) return []
        if (cell.getHeaderStyles() & TableCellHeaderStates.ROW) isHeader = true
        return [$convertToMarkdownString(BASE_TRANSFORMERS, cell).replace(/\n/g, '\\n').replace(/(?<!\\)\|/g, '\\|').trim()]
      })
      lines.push(`| ${cells.join(' | ')} |`)
      if (isHeader) lines.push(`|${cells.map(() => '---').join('|')}|`)
    }
    return lines.join('\n')
  },
  replace: (parent, _children, match) => {
    // `|---|---|` marks the previous row as the header row.
    if (DIVIDER.test(match[0])) {
      const table = parent.getPreviousSibling()
      const lastRow = $isTableNode(table) ? table.getLastChild() : null
      if (!$isTableRowNode(lastRow)) return
      for (const cell of lastRow.getChildren())
        if ($isTableCellNode(cell)) cell.setHeaderStyles(TableCellHeaderStates.ROW, TableCellHeaderStates.ROW)
      parent.remove()
      return
    }

    const cells = parseRow(match[0])
    if (!cells) return

    // Rows typed earlier as plain paragraphs get pulled into the table too.
    const rows = [cells]
    let width = cells.length
    let sibling = parent.getPreviousSibling()
    while ($isParagraphNode(sibling) && sibling.getChildrenSize() === 1) {
      const text = sibling.getFirstChild()
      const prevCells = $isTextNode(text) ? parseRow(text.getTextContent()) : null
      if (!prevCells) break
      width = Math.max(width, prevCells.length)
      rows.unshift(prevCells)
      const prev = sibling.getPreviousSibling()
      sibling.remove()
      sibling = prev
    }

    const table = $createTableNode()
    for (const rowCells of rows) {
      const row = $createTableRowNode()
      for (let i = 0; i < width; i++) row.append(rowCells[i] ?? $createCell(''))
      table.append(row)
    }

    const previous = parent.getPreviousSibling()
    if ($isTableNode(previous) && columnCount(previous) === width) {
      previous.append(...table.getChildren())
      parent.remove()
    } else {
      parent.replace(table)
    }
  },
}

export const LESSON_TRANSFORMERS: Transformer[] = [TABLE, ...BASE_TRANSFORMERS]

export const $importLessonMarkdown = (markdown: string) =>
  $convertFromMarkdownString(markdown, LESSON_TRANSFORMERS)
export const $exportLessonMarkdown = () => $convertToMarkdownString(LESSON_TRANSFORMERS)
