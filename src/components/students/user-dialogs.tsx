// Small form dialogs for user management. Each takes a trigger, or open/onOpenChange when opened from a menu.
import { useState, type FormEvent, type ReactNode } from 'react'
import { Spiral } from '@/components/loading-ui/spiral'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type DialogControl = { trigger?: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }

/** Shared shell: title, description, a form, and a pending-aware submit button. Closes on success. */
function FormDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  children,
}: DialogControl & {
  title: string
  description?: string
  submitLabel: string
  onSubmit: (form: FormData) => Promise<unknown>
  children: ReactNode
}) {
  const [localOpen, setLocalOpen] = useState(false)
  const open = controlledOpen ?? localOpen
  const setOpen = onOpenChange ?? setLocalOpen
  const [pending, setPending] = useState(false)

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    try {
      await onSubmit(new FormData(e.currentTarget))
      setOpen(false)
    } catch {
      // The mutation already toasted the error; keep the dialog open so the admin can fix it.
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="border-line sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-medium">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handle} className="grid gap-4">
          {children}
          <Button type="submit" disabled={pending} className="mt-1 h-10">
            {pending ? <Spiral className="size-5" /> : submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`f-${name}`}>{label}</Label>
      <Input id={`f-${name}`} name={name} {...props} />
    </div>
  )
}

const selectClass =
  'h-9 w-full rounded-md border border-line bg-white px-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none'

export function AddUserDialog({
  onSubmit,
  ...control
}: DialogControl & {
  onSubmit: (v: { name: string; email: string; password: string; role: 'student' | 'admin' }) => Promise<unknown>
}) {
  return (
    <FormDialog
      {...control}
      title="Add a user"
      description="They can sign in straight away with this email and password. Share the password with them securely."
      submitLabel="Create account"
      onSubmit={(f) =>
        onSubmit({
          name: String(f.get('name')),
          email: String(f.get('email')),
          password: String(f.get('password')),
          role: f.get('role') === 'admin' ? 'admin' : 'student',
        })
      }
    >
      <Field label="Full name" name="name" required maxLength={200} autoComplete="off" />
      <Field label="Email" name="email" type="email" required autoComplete="off" />
      <Field label="Temporary password" name="password" type="password" minLength={8} required autoComplete="new-password" />
      <div className="grid gap-2">
        <Label htmlFor="f-role">Role</Label>
        <select id="f-role" name="role" defaultValue="student" className={selectClass}>
          <option value="student">Student</option>
          <option value="admin">Admin: full access to this dashboard</option>
        </select>
      </div>
    </FormDialog>
  )
}

export function EnrollDialog({
  courses,
  enrolledCourseIds,
  onSubmit,
  ...control
}: DialogControl & {
  courses: { id: string; title: string; status: string }[]
  enrolledCourseIds: Set<string>
  onSubmit: (courseId: string) => Promise<unknown>
}) {
  const available = courses.filter((c) => !enrolledCourseIds.has(c.id))
  return (
    <FormDialog
      {...control}
      title="Enroll in a course"
      description={available.length ? 'They start at the first lesson.' : 'Already enrolled in every course.'}
      submitLabel="Enroll"
      onSubmit={(f) => onSubmit(String(f.get('courseId')))}
    >
      <div className="grid gap-2">
        <Label htmlFor="f-course">Course</Label>
        <select id="f-course" name="courseId" required disabled={!available.length} className={selectClass}>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
              {c.status === 'draft' ? ' (draft)' : ''}
            </option>
          ))}
        </select>
      </div>
    </FormDialog>
  )
}

export function PasswordDialog({
  onSubmit,
  ...control
}: DialogControl & { onSubmit: (newPassword: string) => Promise<unknown> }) {
  return (
    <FormDialog
      {...control}
      title="Set a new password"
      description="This signs them out everywhere. Share the new password with them securely."
      submitLabel="Set password"
      onSubmit={(f) => onSubmit(String(f.get('password')))}
    >
      <Field label="New password" name="password" type="password" minLength={8} required autoComplete="new-password" />
    </FormDialog>
  )
}

export function SuspendDialog({
  name,
  onSubmit,
  ...control
}: DialogControl & { name: string; onSubmit: (reason: string) => Promise<unknown> }) {
  return (
    <FormDialog
      {...control}
      title={`Suspend ${name.split(' ')[0]}?`}
      description="They're signed out now and can't sign in until you lift the suspension. Their progress is kept."
      submitLabel="Suspend account"
      onSubmit={(f) => onSubmit(String(f.get('reason')))}
    >
      <Field label="Reason (optional, shown to them)" name="reason" maxLength={500} />
    </FormDialog>
  )
}
