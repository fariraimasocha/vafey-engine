import { Link, useLocation } from '@tanstack/react-router'
import { Suspense } from 'react'
import { PhHouse } from '@/components/icons/ph/house'
import { PhShieldCheck } from '@/components/icons/ph/shield-check'
import { AppSidebar, sidebarButtonClass, type NavItem } from '@/components/layout/app-sidebar'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useMyLearning } from '@/hooks/use-learn'
import { imageUrl } from '@/lib/utils'

export function LearnSidebar({ isAdmin }: { isAdmin: boolean }) {
  const items: NavItem[] = [
    { title: 'My learning', to: '/learn', icon: PhHouse, exact: true },
    ...(isAdmin ? [{ title: 'Admin dashboard', to: '/', icon: PhShieldCheck } satisfies NavItem] : []),
  ]
  return (
    <AppSidebar homeTo="/learn" items={items}>
      <Suspense fallback={null}>
        <MyCourses />
      </Suspense>
    </AppSidebar>
  )
}

/** The student's enrolled courses, with progress, as quick links. */
function MyCourses() {
  const { data } = useMyLearning()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  if (!data.enrolled.length) return null

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel className="text-xs font-medium text-ink-faint">Your courses</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {data.enrolled.map((c) => {
          const pct = c.totalLessons ? Math.round((c.completedLessons / c.totalLessons) * 100) : 0
          return (
            <SidebarMenuItem key={c.courseId}>
              <SidebarMenuButton
                asChild
                tooltip={`${c.title} · ${pct}%`}
                isActive={pathname.startsWith(`/learn/${c.courseId}`)}
                className={sidebarButtonClass}
              >
                <Link
                  to="/learn/$courseId"
                  params={{ courseId: c.courseId }}
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  {/* Cover thumbnail, or the initial on the night tile. Also the icon when collapsed. */}
                  {c.imageKey ? (
                    <img src={imageUrl(c.imageKey)} alt="" className="size-5 shrink-0 rounded object-cover" />
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-5 shrink-0 place-items-center rounded bg-night font-serif text-[11px] text-cream"
                    >
                      {c.title.charAt(0)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <span
                    className={`text-xs tabular-nums ${c.status === 'passed' ? 'text-success' : 'text-ink-faint'}`}
                  >
                    {c.status === 'passed' ? 'Passed' : `${pct}%`}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
