import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { cn } from '@/lib/utils'
import { lessonTheme } from './lesson-editor'
import { $importLessonMarkdown, LESSON_NODES } from './markdown'

/**
 * Read-only lesson renderer for students. Same Lexical nodes, Markdown import and theme as the admin
 * editor, so a lesson looks identical to what the admin wrote. `key` on the caller remounts per lesson.
 */
export function LessonViewer({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'lesson-view',
        nodes: LESSON_NODES,
        theme: lessonTheme,
        editable: false,
        editorState: () => $importLessonMarkdown(markdown),
        onError: (error) => {
          throw error
        },
      }}
    >
      <RichTextPlugin
        contentEditable={<ContentEditable aria-label="Lesson" className={cn('lesson-prose outline-none', className)} />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <LinkPlugin validateUrl={(url) => /^(https?:|mailto:|\/)/.test(url)} />
      <TablePlugin />
    </LexicalComposer>
  )
}
