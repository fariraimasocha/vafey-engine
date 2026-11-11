import { Link, createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Spiral } from '@/components/loading-ui/spiral'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { dashboardChartsQuery, dashboardStatsQuery, useDashboardStats } from '@/hooks/use-dashboard'

export const Route = createFileRoute('/_dashboard/')({
  staticData: { title: 'Overview' },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.prefetchQuery(dashboardStatsQuery),
      context.queryClient.prefetchQuery(dashboardChartsQuery),
    ]),
  component: OverviewPage,
})

function OverviewPage() {
  const { session } = Route.useRouteContext()
  const firstName = session.user.name.split(' ')[0]

  return (
    <div className="mx-auto max-w-5xl py-4 sm:py-8">
      <h1 className="font-serif text-5xl font-medium tracking-tight text-ink sm:text-6xl">
        welcome back, <em className="text-brand">{firstName}</em>
      </h1>
      <p className="mt-3 text-ink-soft">Here's how Vafey is doing today.</p>

      <Suspense
        fallback={
          <div className="mt-10 grid h-32 place-items-center text-ink-faint">
            <Spiral className="size-8" />
          </div>
        }
      >
        <Stats />
        <DashboardCharts />
      </Suspense>
    </div>
  )
}

function Stats() {
  const { data } = useDashboardStats()

  const stats = [
    { label: 'Courses', value: data.courses, hint: `${data.publishedCourses} published` },
    { label: 'Students', value: data.students, hint: 'registered accounts' },
    { label: 'Enrollments', value: data.enrollments, hint: 'across all courses' },
    { label: 'Pass rate', value: data.passRate === null ? '—' : `${data.passRate}%`, hint: 'of finished attempts' },
  ]

  return (
    <>
      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-5">
            <dt className="text-sm font-medium text-ink-soft">{s.label}</dt>
            <dd className="mt-2 font-serif text-4xl font-medium text-ink tabular-nums">{s.value}</dd>
            <dd className="mt-1 text-xs text-ink-faint">{s.hint}</dd>
          </div>
        ))}
      </dl>

      {data.courses === 0 && (
        <section className="mt-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-line bg-paper p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-2xl font-medium text-ink">
              start with your <em className="text-brand">first course</em>
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Add modules, topics and lessons, then one final multiple-choice assessment.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex h-10 shrink-0 items-center rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            Go to courses
          </Link>
        </section>
      )}
    </>
  )
}
