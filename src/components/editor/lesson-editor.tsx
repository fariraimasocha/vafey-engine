import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { cn } from '@/lib/utils'
import { $exportLessonMarkdown, $importLessonMarkdown, LESSON_NODES, LESSON_TRANSFORMERS } from './markdown'
import { Toolbar } from './toolbar'

// Lexical renders semantic tags (h2, ul, table…); `.lesson-prose` in styles.css styles them.
// Only things without a semantic tag need theme classes.
export const lessonTheme = {
  text: { bold: 'font-semibold', italic: 'italic', code: 'lesson-inline-code' },
  code: 'lesson-code-block',
  link: 'lesson-link',
  list: { nested: { listitem: 'list-none' } },
  tableCellHeader: 'lesson-th',
}

/**
 * Rich text editor for lessons. Loads and saves Markdown, so lessons stay portable
 * (seed files, the student app) while admins get a proper WYSIWYG editor.
 */
export function LessonEditor({
  defaultValue,
  onChange,
  className,
}: {
  defaultValue: string
  onChange: (markdown: string) => void
  className?: string
}) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'lesson',
        nodes: LESSON_NODES,
        theme: lessonTheme,
        editorState: () => $importLessonMarkdown(defaultValue),
        onError: (error) => {
          throw error
        },
      }}
    >
      <div className={cn('overflow-hidden rounded-lg border border-line bg-white focus-within:ring-2 focus-within:ring-ring/30', className)}>
        <Toolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label="Lesson content"
                className="lesson-prose max-h-[55dvh] min-h-72 overflow-y-auto px-5 py-4 outline-none"
              />
            }
            placeholder={
              <p className="pointer-events-none absolute top-4 left-5 text-ink-faint">
                Start writing… Type ## for a heading, - for a list, ``` for code.
              </p>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
      </div>
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin validateUrl={(url) => /^(https?:|mailto:|\/)/.test(url)} />
      <TablePlugin />
      <TabIndentationPlugin />
      <MarkdownShortcutPlugin transformers={LESSON_TRANSFORMERS} />
      <OnChangePlugin
        ignoreSelectionChange
        onChange={(editorState) => onChange(editorState.read(() => $exportLessonMarkdown()))}
      />
    </LexicalComposer>
  )
}
