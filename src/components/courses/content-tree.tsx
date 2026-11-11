import type { ReactNode } from 'react'
import { NodeDialog, type NodeKind } from '@/components/courses/node-dialog'
import { PhFileText } from '@/components/icons/ph/file-text'
import { PhPencilSimple } from '@/components/icons/ph/pencil-simple'
import { PhPlus } from '@/components/icons/ph/plus'
import { PhTrash } from '@/components/icons/ph/trash'
import { Button } from '@/components/ui/button'
import { courseFns, useCourseMutation } from '@/hooks/use-courses'
import type { CourseTree } from '#/server/courses/courses.service'

/** Module → topic → lesson editor. */
export function ContentTree({ course }: { course: CourseTree }) {
  const addModule = useCourseMutation(courseFns.addModule, { success: 'Module added' })

  return (
    <div className="grid gap-5">
      {course.modules.map((m, mi) => (
        <section key={m.id} className="rounded-lg border border-line bg-white">
          <header className="flex items-start gap-3 border-b border-line p-5">
            <span className="mt-1 font-serif text-2xl text-brand tabular-nums">{String(mi + 1).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-2xl font-medium text-ink">{m.title}</h3>
              {m.description && <p className="mt-1 text-sm text-ink-soft">{m.description}</p>}
            </div>
            <NodeActions kind="module" node={m} />
          </header>

          <div className="grid gap-4 p-5">
            {m.topics.map((t) => (
              <div key={t.id} className="rounded-lg bg-paper-soft p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-ink">{t.title}</h4>
                    {t.description && <p className="text-sm text-ink-soft">{t.description}</p>}
                  </div>
                  <NodeActions kind="topic" node={t} />
                </div>
                <ul className="mt-3 grid gap-1">
                  {t.lessons.map((l) => (
                    <li key={l.id} className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white">
                      <PhFileText className="size-4 shrink-0 text-ink-faint" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{l.title}</span>
                      <NodeActions kind="lesson" node={l} />
                    </li>
                  ))}
                </ul>
                <AddNode kind="lesson" parentId={t.id}>
                  Add lesson
                </AddNode>
              </div>
            ))}
            <AddNode kind="topic" parentId={m.id}>
              Add topic
            </AddNode>
          </div>
        </section>
      ))}

      <NodeDialog
        kind="module"
        onSubmit={(v) => addModule.mutateAsync({ courseId: course.id, title: v.title, description: v.description })}
        trigger={
          <Button variant="outline" className="h-12 gap-2 border-dashed border-line bg-paper text-ink-soft hover:text-ink">
            <PhPlus className="size-4" /> Add module
          </Button>
        }
      />
    </div>
  )
}

function AddNode({ kind, parentId, children }: { kind: 'topic' | 'lesson'; parentId: string; children: ReactNode }) {
  const addTopic = useCourseMutation(courseFns.addTopic)
  const addLesson = useCourseMutation(courseFns.addLesson)

  return (
    <NodeDialog
      kind={kind}
      onSubmit={(v) =>
        kind === 'topic'
          ? addTopic.mutateAsync({ moduleId: parentId, title: v.title, description: v.description })
          : addLesson.mutateAsync({ topicId: parentId, title: v.title, content: v.content ?? '' })
      }
      trigger={
        <button className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-ink-soft hover:bg-white hover:text-ink">
          <PhPlus className="size-3.5" /> {children}
        </button>
      }
    />
  )
}

function NodeActions({
  kind,
  node,
}: {
  kind: NodeKind
  node: { id: string; title: string; description?: string | null; content?: string }
}) {
  const update = useCourseMutation(courseFns.updateNode, { success: 'Saved' })
  const remove = useCourseMutation(courseFns.deleteNode, { success: `${kind[0].toUpperCase()}${kind.slice(1)} deleted` })

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <NodeDialog
        kind={kind}
        initial={node}
        onSubmit={(v) => update.mutateAsync({ kind, id: node.id, ...v })}
        trigger={
          <Button variant="ghost" size="icon" className="size-8 text-ink-faint hover:text-ink" aria-label={`Edit ${kind}`}>
            <PhPencilSimple className="size-4" />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-ink-faint hover:text-destructive"
        aria-label={`Delete ${kind}`}
        disabled={remove.isPending}
        onClick={() => {
          const extra = kind === 'lesson' ? '' : ` and everything inside it`
          if (confirm(`Delete "${node.title}"${extra}? This can't be undone.`)) remove.mutate({ kind, id: node.id })
        }}
      >
        <PhTrash className="size-4" />
      </Button>
    </div>
  )
}
