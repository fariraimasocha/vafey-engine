import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { Logo } from '@/components/layout/logo'
import { getSession } from '#/server/auth/auth.functions'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: '/' })
  },
  component: AuthLayout,
})

// Split screen after zen-browser.app: a calm dark panel with a serif headline, form on paper.
function AuthLayout() {
  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-night p-10 text-cream lg:flex">
        <Logo tone="light" />
        <div className="max-w-xl">
          <h2 className="font-serif text-6xl leading-[1.05] font-medium tracking-tight xl:text-7xl">
            a calmer way to <em className="text-brand">teach</em>
          </h2>
          <p className="mt-6 max-w-sm text-base text-cream/70">
            Build courses, guide students from module to lesson, and see who passes. One clear path at a time.
          </p>
        </div>
        <p className="text-sm text-cream/50">Vafey · Bikita Institute of Technology</p>
        {/* Concentric rings, a nod to zen's mark. Decorative only. */}
        <div aria-hidden className="pointer-events-none absolute -right-40 -bottom-40 size-[34rem] rounded-full border border-cream/10">
          <div className="absolute inset-16 rounded-full border border-cream/10" />
          <div className="absolute inset-32 rounded-full border border-brand/40" />
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <Outlet />
        </div>
      </main>
    </div>
  )
}
