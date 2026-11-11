import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense, useEffect, useState } from 'react'
import { z } from 'zod'
import { PhMagnifyingGlass } from '@/components/icons/ph/magnifying-glass'
import { PhUserPlus } from '@/components/icons/ph/user-plus'
import { Spiral } from '@/components/loading-ui/spiral'
import { RoleBadge, SuspendedBadge, initials } from '@/components/students/user-badges'
import { AddUserDialog } from '@/components/students/user-dialogs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { studentFns, useStudentMutation, useUsers, usersQuery, type RoleFilter } from '@/hooks/use-students'
import { cn } from '@/lib/utils'

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  role: z.enum(['student', 'admin', 'all']).optional().catch(undefined),
})

export const Route = createFileRoute('/_dashboard/students/')({
  staticData: { title: 'Students' },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search: search.q, role: search.role ?? 'student' }),
  loader: ({ context, deps }) => context.queryClient.prefetchQuery(usersQuery(deps)),
  component: StudentsPage,
})

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'student', label: 'Students' },
  { value: 'admin', label: 'Admins' },
  { value: 'all', label: 'Everyone' },
]

function StudentsPage() {
  const { q, role = 'student' } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const create = useStudentMutation(studentFns.createUser, { success: 'Account created' })

  // Debounce typing into the URL so the list (and back button) follow the search.
  const [text, setText] = useState(q ?? '')
  useEffect(() => {
    const t = setTimeout(() => {
      if ((q ?? '') !== text) navigate({ search: (s) => ({ ...s, q: text || undefined }), replace: true })
    }, 250)
    return () => clearTimeout(t)
  }, [text, q, navigate])

  return (
    <div className="mx-auto max-w-6xl py-4 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl font-medium tracking-tight text-ink">
            your <em className="text-brand">people</em>
          </h1>
          <p className="mt-2 text-ink-soft">Enroll students, track their progress, and manage their accounts.</p>
        </div>
        <AddUserDialog
          onSubmit={async (v) => {
            const { id } = await create.mutateAsync(v)
            await navigate({ to: '/students/$userId', params: { userId: id } })
          }}
          trigger={
            <Button className="h-10 gap-2">
              <PhUserPlus className="size-4" /> Add user
            </Button>
          }
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Filter by role" className="inline-flex rounded-lg bg-paper p-1">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              role="tab"
              aria-selected={role === f.value}
              from={Route.fullPath}
              search={(s) => ({ ...s, role: f.value === 'student' ? undefined : f.value })}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                role === f.value ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <label className="relative min-w-60 flex-1 sm:max-w-sm">
          <span className="sr-only">Search by name or email</span>
          <PhMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by name or email"
            className="h-9 border-line bg-white ps-9"
          />
        </label>
      </div>

      <Suspense fallback={<Spiral className="mx-auto mt-16 block size-8 text-ink-faint" />}>
        <UserTable search={q} role={role} />
      </Suspense>
    </div>
  )
}

const joined = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' })

function UserTable({ search, role }: { search?: string; role: RoleFilter }) {
  const { data: users } = useUsers({ search, role })

  if (!users.length)
    return (
      <div className="mt-6 rounded-lg border border-dashed border-line bg-paper p-10 text-center">
        <p className="font-serif text-2xl text-ink">{search ? 'no matches' : 'nobody here yet'}</p>
        <p className="mt-1 text-sm text-ink-soft">
          {search ? `No one matches “${search}”.` : 'Add a user, or share the sign-up page with your students.'}
        </p>
      </div>
    )

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line bg-paper-soft text-ink-soft">
            <th className="px-4 py-2.5 text-start font-medium">Name</th>
            <th className="px-4 py-2.5 text-start font-medium">Role</th>
            <th className="px-4 py-2.5 text-end font-medium">Enrolled</th>
            <th className="px-4 py-2.5 text-end font-medium">Passed</th>
            <th className="px-4 py-2.5 text-end font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="group relative border-b border-line/70 last:border-0 hover:bg-paper-soft">
              <td className="px-4 py-3">
                {/* Whole row is the link; the stretched ::after covers the row. */}
                <Link
                  to="/students/$userId"
                  params={{ userId: u.id }}
                  className="flex items-center gap-3 after:absolute after:inset-0 focus-visible:outline-none"
                >
                  <Avatar className="size-9 rounded-md">
                    <AvatarFallback className="rounded-md bg-paper text-xs font-semibold text-ink">
                      {initials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{u.name}</span>
                    <span className="block truncate text-xs text-ink-soft">{u.email}</span>
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  <RoleBadge role={u.role} />
                  {u.banned && <SuspendedBadge />}
                </div>
              </td>
              <td className="px-4 py-3 text-end text-ink tabular-nums">{u.enrollments}</td>
              <td className="px-4 py-3 text-end text-ink tabular-nums">{u.passed}</td>
              <td className="px-4 py-3 text-end text-ink-soft tabular-nums">{joined.format(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
