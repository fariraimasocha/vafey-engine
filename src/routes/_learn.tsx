import { Outlet, createFileRoute, redirect, useMatches } from '@tanstack/react-router'
import { LearnError } from '@/components/learn/learn-error'
import { LearnSidebar } from '@/components/learn/learn-sidebar'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { myLearningQuery } from '@/hooks/use-learn'
import { getSession } from '#/server/auth/auth.functions'

// The student area. Any signed-in user may use it; admins get a link back to the dashboard.
export const Route = createFileRoute('/_learn')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/sign-in' })
    return { session }
  },
  // The sidebar lists the student's courses.
  loader: ({ context }) => context.queryClient.prefetchQuery(myLearningQuery),
  errorComponent: LearnError,
  component: LearnLayout,
})

function LearnLayout() {
  const { session } = Route.useRouteContext()
  // Each page sets `staticData: { title }`; the deepest match is the current page.
  const title = useMatches({ select: (m) => m.at(-1)?.staticData.title })

  return (
    <TooltipProvider>
      <SidebarProvider>
        <LearnSidebar isAdmin={session.user.role === 'admin'} />
        <SidebarInset className="min-w-0 bg-paper">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-paper/90 px-3 backdrop-blur sm:px-6">
            {/* Desktop toggles from the sidebar header; phones need one here. */}
            <SidebarTrigger className="-ms-1 md:hidden" />
            <Separator orientation="vertical" className="me-1 h-4 md:hidden" />
            <p className="truncate text-base font-semibold text-ink">{title}</p>
          </header>
          <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 sm:py-10">
            <div className="mx-auto max-w-4xl">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
