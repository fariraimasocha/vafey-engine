import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

// ponytail: no auth guard yet; add an admin check in beforeLoad once the sign-in page exists.
export const Route = createFileRoute('/_dashboard')({ component: DashboardLayout })

function DashboardLayout() {
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

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    title?: string
  }
}
