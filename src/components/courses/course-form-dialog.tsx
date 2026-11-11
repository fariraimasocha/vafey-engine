import { useState, type FormEvent, type ReactNode } from 'react'
import { Spiral } from '@/components/loading-ui/spiral'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type CourseFormValues = { title: string; description: string | null; passMark: number }

/** Create / edit a course's basic details. Pass `trigger`, or control it with `open`/`onOpenChange` (e.g. from a menu). */
export function CourseFormDialog({
  trigger,
  title,
  submitLabel,
  initial,
  onSubmit,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: ReactNode
  title: string
  submitLabel: string
  initial?: Partial<CourseFormValues>
  onSubmit: (values: CourseFormValues) => Promise<unknown>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [localOpen, setLocalOpen] = useState(false)
  const open = controlledOpen ?? localOpen
  const setOpen = onOpenChange ?? setLocalOpen
  const [pending, setPending] = useState(false)

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setPending(true)
    try {
      await onSubmit({
        title: String(f.get('title')),
        description: String(f.get('description')) || null,
        passMark: Number(f.get('passMark')),
      })
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="border-line sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-medium">{title}</DialogTitle>
          <DialogDescription>Students must reach the pass mark on the final assessment to pass.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={initial?.title} required maxLength={200} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ''} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="passMark">Pass mark (%)</Label>
            <Input
              id="passMark"
              name="passMark"
              type="number"
              min={0}
              max={100}
              defaultValue={initial?.passMark ?? 60}
              required
              className="w-28"
            />
          </div>
          <Button type="submit" disabled={pending} className="mt-2 h-10">
            {pending ? <Spiral className="size-5" /> : submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
