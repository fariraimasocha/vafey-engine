import { Link, Outlet, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { LearnError } from '@/components/learn/learn-error'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'
import { getSession } from '#/server/auth/auth.functions'

// The student area. Any signed-in user may use it; admins get a link back to the dashboard.
export const Route = createFileRoute('/_learn')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/sign-in' })
    return { session }
  },
  errorComponent: LearnError,
  component: LearnLayout,
})

function LearnLayout() {
  const { session } = Route.useRouteContext()
  const router = useRouter()

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link to="/learn" aria-label="My learning">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/learn"
              activeOptions={{ exact: true }}
              className="rounded-md px-3 py-1.5 font-medium text-ink-soft hover:text-ink data-[status=active]:bg-white data-[status=active]:text-ink"
            >
              My learning
            </Link>
            {session.user.role === 'admin' && (
              <Link to="/" className="rounded-md px-3 py-1.5 font-medium text-ink-soft hover:text-ink">
                Admin
              </Link>
            )}
          </nav>
          <div className="ms-auto flex items-center gap-3">
            <span className="hidden truncate text-sm text-ink-soft sm:block">{session.user.name}</span>
            <Button
              variant="outline"
              size="sm"
              className="border-line bg-white"
              onClick={() => signOut().then(() => router.navigate({ to: '/sign-in' }))}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>
    </div>
  )
}
