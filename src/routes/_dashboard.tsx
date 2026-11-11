import { Outlet, createFileRoute, redirect, useMatches, useRouter } from '@tanstack/react-router'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { signOut } from '@/lib/auth-client'
import { getSession } from '#/server/auth/auth.functions'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/sign-in' })
    return { session }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const { session } = Route.useRouteContext()
  if (session.user.role !== 'admin') return <NoAccess />
  // Each page sets `staticData: { title }`; the deepest match is the current page.
  const title = useMatches({ select: (m) => m.at(-1)?.staticData.title })

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-background px-3 sm:px-6">
            {/* Desktop toggles from the sidebar header; phones need one here. */}
            <SidebarTrigger className="-ms-1 md:hidden" />
            <Separator orientation="vertical" className="me-1 h-4 md:hidden" />
            <p className="truncate text-base font-semibold text-ink">{title}</p>
          </header>
          <main className="min-w-0 flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

// Students can sign in (the student app will use the same accounts) but the admin dashboard is admin-only.
function NoAccess() {
  const router = useRouter()
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4">
      <div className="max-w-sm text-center">
        <Logo className="mb-8 justify-center" />
        <h1 className="font-serif text-4xl font-medium text-ink">
          admins <em className="text-brand">only</em>
        </h1>
        <p className="mt-3 text-ink-soft">Your account doesn't have access to the admin dashboard.</p>
        <Button
          variant="outline"
          className="mt-6 border-line"
          onClick={() => signOut().then(() => router.navigate({ to: '/sign-in' }))}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    title?: string
  }
}
