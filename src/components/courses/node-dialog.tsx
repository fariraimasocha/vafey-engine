import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { LessonEditor } from '@/components/editor/lesson-editor'
import { Spiral } from '@/components/loading-ui/spiral'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type NodeKind = 'module' | 'topic' | 'lesson'
export type NodeValues = { title: string; description?: string | null; content?: string }

/** One dialog for creating or editing any node in the course tree. Lessons get a markdown body. */
export function NodeDialog({
  kind,
  trigger,
  initial,
  onSubmit,
}: {
  kind: NodeKind
  trigger: ReactNode
  initial?: NodeValues
  onSubmit: (values: NodeValues) => Promise<unknown>
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const isLesson = kind === 'lesson'
  // Latest Markdown from the editor; a ref so typing doesn't re-render the dialog.
  const contentRef = useRef(initial?.content ?? '')

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const title = String(f.get('title'))
    setPending(true)
    try {
      await onSubmit(
        isLesson
          ? { title, content: contentRef.current }
          : { title, description: String(f.get('description')) || null },
      )
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={isLesson ? 'max-h-[95dvh] overflow-y-auto border-line sm:max-w-4xl' : 'border-line sm:max-w-lg'}>
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-medium">
            {initial ? 'Edit' : 'New'} {kind}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handle} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="node-title">Title</Label>
            <Input id="node-title" name="title" defaultValue={initial?.title} required maxLength={200} />
          </div>
          {isLesson ? (
            <div className="grid gap-2">
              <Label>Content</Label>
              <LessonEditor defaultValue={initial?.content ?? ''} onChange={(md) => (contentRef.current = md)} />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="node-description">Description</Label>
              <Textarea id="node-description" name="description" rows={3} defaultValue={initial?.description ?? ''} />
            </div>
          )}
          <Button type="submit" disabled={pending} className="h-10">
            {pending ? <Spiral className="size-5" /> : initial ? 'Save' : `Add ${kind}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
