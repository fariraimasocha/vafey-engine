import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { PhArrowCounterClockwise } from '@/components/icons/ph/arrow-counter-clockwise'
import { PhArrowLeft } from '@/components/icons/ph/arrow-left'
import { PhCheckCircle } from '@/components/icons/ph/check-circle'
import { PhDotsThree } from '@/components/icons/ph/dots-three'
import { PhGraduationCap } from '@/components/icons/ph/graduation-cap'
import { PhKey } from '@/components/icons/ph/key'
import { PhProhibit } from '@/components/icons/ph/prohibit'
import { PhShieldCheck } from '@/components/icons/ph/shield-check'
import { PhTrash } from '@/components/icons/ph/trash'
import { PhXCircle } from '@/components/icons/ph/x-circle'
import { Spiral } from '@/components/loading-ui/spiral'
import { RoleBadge, StatusBadge, SuspendedBadge, initials } from '@/components/students/user-badges'
import { EnrollDialog, PasswordDialog, SuspendDialog } from '@/components/students/user-dialogs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { studentFns, useStudentMutation, useUser, userQuery } from '@/hooks/use-students'
import type { UserDetail } from '#/server/students/students.service'

export const Route = createFileRoute('/_dashboard/students/$userId')({
  staticData: { title: 'Student' },
  loader: ({ context, params }) => context.queryClient.prefetchQuery(userQuery(params.userId)),
  component: () => (
    <Suspense fallback={<Spiral className="mx-auto mt-16 block size-8 text-ink-faint" />}>
      <UserPage />
    </Suspense>
  ),
})

const date = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' })

function UserPage() {
  const { userId } = Route.useParams()
  const { session } = Route.useRouteContext()
  const { data: user } = useUser(userId)
  const isSelf = session.user.id === user.id
  const enroll = useStudentMutation(studentFns.enrollUser, { success: 'Enrolled' })

  return (
    <div className="mx-auto max-w-4xl py-2 sm:py-6">
      <Link to="/students" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <PhArrowLeft className="size-4" /> All people
      </Link>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-16 rounded-xl">
            <AvatarFallback className="rounded-xl bg-night font-serif text-2xl text-cream">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">{user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <span className="truncate">{user.email}</span>
              <RoleBadge role={user.role} />
              {user.banned && <SuspendedBadge />}
              {isSelf && <span className="text-ink-faint">· you</span>}
            </div>
            <p className="mt-1 text-xs text-ink-faint">Joined {date.format(user.createdAt)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <EnrollDialog
            courses={user.courses}
            enrolledCourseIds={new Set(user.enrollments.map((e) => e.courseId))}
            onSubmit={(courseId) => enroll.mutateAsync({ userId: user.id, courseId })}
            trigger={
              <Button className="gap-2">
                <PhGraduationCap className="size-4" /> Enroll in course
              </Button>
            }
          />
          <AccountMenu user={user} isSelf={isSelf} />
        </div>
      </header>

      {user.banned && (
        <p className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          This account is suspended{user.banReason ? `: ${user.banReason.replace(/[.!?]?$/, '.')}` : '.'} They can't sign in.
        </p>
      )}

      <section className="mt-10">
        <h2 className="font-serif text-3xl font-medium text-ink">
          courses <em className="text-brand">&amp; progress</em>
        </h2>
        {user.enrollments.length ? (
          <div className="mt-4 grid gap-4">
            {user.enrollments.map((e) => (
              <EnrollmentCard key={e.id} enrollment={e} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-line bg-paper p-8 text-center text-sm text-ink-soft">
            Not enrolled in any course yet.
          </div>
        )}
      </section>
    </div>
  )
}

// ---------- account actions ----------

function AccountMenu({ user, isSelf }: { user: UserDetail; isSelf: boolean }) {
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<'password' | 'suspend' | null>(null)
  const setRole = useStudentMutation(studentFns.setUserRole, { success: 'Role updated' })
  const ban = useStudentMutation(studentFns.banUser, { success: 'Account suspended' })
  const unban = useStudentMutation(studentFns.unbanUser, { success: 'Suspension lifted' })
  const password = useStudentMutation(studentFns.setUserPassword, { success: 'Password updated' })
  const remove = useStudentMutation(studentFns.removeUser, { success: 'Account deleted' })
  const first = user.name.split(' ')[0]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="border-line" aria-label="Account actions">
            <PhDotsThree className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => setDialog('password')}>
            <PhKey className="size-4" /> Set new password
          </DropdownMenuItem>
          {/* Admins can't demote, suspend or delete themselves; that's how you lock everyone out. */}
          {!isSelf && (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  const next = user.role === 'admin' ? 'student' : 'admin'
                  const msg =
                    next === 'admin'
                      ? `Make ${first} an admin? They'll get full access to this dashboard.`
                      : `Remove ${first}'s admin access?`
                  if (confirm(msg)) setRole.mutate({ userId: user.id, role: next })
                }}
              >
                <PhShieldCheck className="size-4" /> {user.role === 'admin' ? 'Make student' : 'Make admin'}
              </DropdownMenuItem>
              {user.banned ? (
                <DropdownMenuItem onSelect={() => unban.mutate({ userId: user.id })}>
                  <PhCheckCircle className="size-4" /> Lift suspension
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setDialog('suspend')}>
                  <PhProhibit className="size-4" /> Suspend account
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={async () => {
                  if (!confirm(`Delete ${user.name}'s account and all their progress? This can't be undone.`)) return
                  // Leave first so the refresh after deleting doesn't try to reload this (now missing) user.
                  await navigate({ to: '/students' })
                  remove.mutate({ userId: user.id })
                }}
              >
                <PhTrash className="size-4" /> Delete account
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <PasswordDialog
        open={dialog === 'password'}
        onOpenChange={(o) => setDialog(o ? 'password' : null)}
        onSubmit={(newPassword) => password.mutateAsync({ userId: user.id, newPassword })}
      />
      <SuspendDialog
        name={user.name}
        open={dialog === 'suspend'}
        onOpenChange={(o) => setDialog(o ? 'suspend' : null)}
        onSubmit={(reason) => ban.mutateAsync({ userId: user.id, reason })}
      />
    </>
  )
}

// ---------- one enrollment ----------

function EnrollmentCard({ enrollment: e }: { enrollment: UserDetail['enrollments'][number] }) {
  const setStatus = useStudentMutation(studentFns.setEnrollmentStatus, { success: 'Status updated' })
  const reset = useStudentMutation(studentFns.resetEnrollment, { success: 'Progress reset' })
  const unenroll = useStudentMutation(studentFns.unenroll, { success: 'Removed from course' })
  const pct = e.totalLessons ? Math.round((e.completedLessons / e.totalLessons) * 100) : 0

  return (
    <article className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to="/courses/$courseId"
            params={{ courseId: e.courseId }}
            className="font-serif text-2xl font-medium text-ink hover:underline"
          >
            {e.courseTitle}
          </Link>
          <p className="mt-0.5 text-xs text-ink-faint">
            Enrolled {date.format(e.enrolledAt)}
            {e.completedAt && ` · finished ${date.format(e.completedAt)}`}
          </p>
        </div>
        <StatusBadge status={e.status} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-ink-faint" aria-label={`Manage ${e.courseTitle} enrollment`}>
              <PhDotsThree className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {e.status !== 'passed' && (
              <DropdownMenuItem onSelect={() => setStatus.mutate({ enrollmentId: e.id, status: 'passed' })}>
                <PhCheckCircle className="size-4" /> Mark as passed
              </DropdownMenuItem>
            )}
            {e.status !== 'failed' && (
              <DropdownMenuItem onSelect={() => setStatus.mutate({ enrollmentId: e.id, status: 'failed' })}>
                <PhXCircle className="size-4" /> Mark as failed
              </DropdownMenuItem>
            )}
            {e.status !== 'in_progress' && (
              <DropdownMenuItem onSelect={() => setStatus.mutate({ enrollmentId: e.id, status: 'in_progress' })}>
                <PhGraduationCap className="size-4" /> Back to in progress
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={() => {
                if (confirm('Reset this course? Their lesson progress and assessment attempts are cleared.'))
                  reset.mutate({ enrollmentId: e.id })
              }}
            >
              <PhArrowCounterClockwise className="size-4" /> Reset progress
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                if (confirm(`Remove them from ${e.courseTitle}? Their progress in it is deleted.`))
                  unenroll.mutate({ enrollmentId: e.id })
              }}
            >
              <PhTrash className="size-4" /> Remove from course
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end sm:gap-8">
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-soft">Lessons</span>
            <span className="text-ink tabular-nums">
              {e.completedLessons} / {e.totalLessons}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Lessons completed"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2 h-2 overflow-hidden rounded-full bg-paper"
          >
            <div className="h-full rounded-full bg-night transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Metric label="Attempts" value={e.attempts} />
        <Metric
          label={`Best score · pass ${e.passMark}%`}
          value={e.bestScore === null ? '—' : `${e.bestScore}%`}
          tone={e.bestScore === null ? undefined : e.bestScore >= e.passMark ? 'good' : 'bad'}
        />
      </div>
    </article>
  )
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: 'good' | 'bad' }) {
  return (
    <div className="sm:text-end">
      <p className="text-xs text-ink-faint">{label}</p>
      <p
        className={`font-serif text-2xl tabular-nums ${tone === 'good' ? 'text-success' : tone === 'bad' ? 'text-brand-dark' : 'text-ink'}`}
      >
        {value}
      </p>
    </div>
  )
}
