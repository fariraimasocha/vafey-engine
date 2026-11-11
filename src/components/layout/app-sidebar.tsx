import { Link, useLocation, type LinkProps } from '@tanstack/react-router'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { Logo } from '@/components/layout/logo'
import { NavUser } from '@/components/layout/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'

export type NavItem = {
  title: string
  to: LinkProps['to'] & string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Only active on an exact path match (default: also active on child paths). */
  exact?: boolean
}

/** Shared menu button styling, also used by extra sidebar sections (e.g. the student's course list). */
export const sidebarButtonClass =
  'h-10 gap-3 rounded-lg px-2.5 text-sm font-semibold text-ink-soft hover:bg-sidebar-accent hover:text-ink data-[active=true]:bg-sidebar-accent data-[active=true]:text-ink [&>svg]:size-5 group-data-[collapsible=icon]:p-1.5!'

/**
 * Collapsible app sidebar used by both the admin dashboard and the student area.
 * `children` renders extra groups under the main nav.
 */
export function AppSidebar({ homeTo, items, children }: { homeTo: NavItem['to']; items: NavItem[]; children?: ReactNode }) {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  // Segment match so /courses/123 keeps "Courses" active; "/" and exact items only match themselves.
  const isActive = ({ to, exact }: NavItem) =>
    pathname === to || (!exact && to !== '/' && pathname.startsWith(`${to}/`))

  return (
    <Sidebar collapsible="icon" className="border-e border-line">
      {/* h-16 matches the top bar so both bottom borders form one line. */}
      <SidebarHeader className="group/header h-16 shrink-0 flex-row items-center justify-between gap-2 border-b border-line px-3 py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <Link
          to={homeTo}
          className="flex min-w-0 items-center gap-2 rounded-md md:group-data-[collapsible=icon]:group-hover/header:hidden"
        >
          <Logo className="group-data-[collapsible=icon]:[&_[data-wordmark]]:hidden group-data-[collapsible=icon]:[&_img]:h-4" />
        </Link>
        <SidebarTrigger className="hidden size-8 shrink-0 text-ink-soft hover:bg-sidebar-accent md:inline-flex md:group-data-[collapsible=icon]:sr-only md:group-data-[collapsible=icon]:group-hover/header:not-sr-only" />
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1 py-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="py-1">
          <SidebarMenu className="gap-1">
            {items.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item)} className={sidebarButtonClass}>
                  <Link to={item.to} onClick={() => isMobile && setOpenMobile(false)}>
                    <item.icon aria-hidden="true" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        {children}
      </SidebarContent>

      <SidebarFooter className="px-1 pb-3 group-data-[collapsible=icon]:px-0">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
