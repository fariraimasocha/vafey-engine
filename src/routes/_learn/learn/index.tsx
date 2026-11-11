import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense } from 'react'
import { CourseCover } from '@/components/courses/course-cover'
import { PhArrowRight } from '@/components/icons/ph/arrow-right'
import { ProgressBar } from '@/components/learn/progress-bar'
import { LearnError } from '@/components/learn/learn-error'
import { Spiral } from '@/components/loading-ui/spiral'
import { StatusBadge } from '@/components/students/user-badges'
import { Button } from '@/components/ui/button'
import { MinimalCard, MinimalCardDescription, MinimalCardTitle } from '@/components/ui/minimal-card'
import { learnFns, myLearningQuery, useLearnMutation, useMyLearning } from '@/hooks/use-learn'

export const Route = createFileRoute('/_learn/learn/')({
  staticData: { title: 'My learning' },
  head: () => ({ meta: [{ title: 'My learning · Vafey' }] }),
  loader: ({ context }) => context.queryClient.prefetchQuery(myLearningQuery),
  errorComponent: LearnError,
  component: () => (
    <Suspense fallback={<Spiral className="mx-auto mt-16 block size-8 text-ink-faint" />}>
      <MyLearning />
    </Suspense>
  ),
})

function Cover({ title, imageKey }: { title: string; imageKey: string | null }) {
  return <CourseCover title={title} imageKey={imageKey} className="mb-4 h-32 rounded-[18px]" />
}

function MyLearning() {
  const { session } = Route.useRouteContext()
  const { data } = useMyLearning()
  const navigate = useNavigate()
  const enroll = useLearnMutation(learnFns.enrollInCourse, { success: "You're enrolled" })

  return (
    <div>
      <h1 className="font-serif text-5xl font-medium tracking-tight text-ink sm:text-6xl">
        hello, <em className="text-brand">{session.user.name.split(' ')[0]}</em>
      </h1>
      <p className="mt-3 text-ink-soft">One lesson at a time. Finish them all to unlock the final assessment.</p>

      <section className="mt-12">
        <h2 className="font-serif text-3xl font-medium text-ink">
          your <em className="text-brand">courses</em>
        </h2>
        {data.enrolled.length ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {data.enrolled.map((c) => (
              <Link key={c.courseId} to="/learn/$courseId" params={{ courseId: c.courseId }} className="rounded-[24px]">
                <MinimalCard className="h-full bg-white hover:bg-paper-soft">
                  <Cover title={c.title} imageKey={c.imageKey} />
                  <div className="flex items-center gap-2 px-1">
                    <StatusBadge status={c.status} />
                    {c.bestScore !== null && <span className="text-xs text-ink-faint">Best score {c.bestScore}%</span>}
                  </div>
                  <MinimalCardTitle className="text-ink">{c.title}</MinimalCardTitle>
                  <div className="px-1 pt-3 pb-2">
                    <div className="mb-1.5 flex justify-between text-xs text-ink-soft">
                      <span>Lessons</span>
                      <span className="tabular-nums">
                        {c.completedLessons} / {c.totalLessons}
                      </span>
                    </div>
                    <ProgressBar done={c.completedLessons} total={c.totalLessons} />
                  </div>
                </MinimalCard>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-line bg-white/60 p-8 text-center text-sm text-ink-soft">
            You're not enrolled in anything yet. Pick a course below to get started.
          </p>
        )}
      </section>

      {data.available.length > 0 && (
        <section className="mt-14">
          <h2 className="font-serif text-3xl font-medium text-ink">
            explore <em className="text-brand">courses</em>
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {data.available.map((c) => (
              <MinimalCard key={c.courseId} className="bg-white">
                <Cover title={c.title} imageKey={c.imageKey} />
                <MinimalCardTitle className="text-ink">{c.title}</MinimalCardTitle>
                <MinimalCardDescription className="mb-1 line-clamp-3 pb-0 text-ink-soft">{c.description}</MinimalCardDescription>
                <div className="flex items-center justify-between gap-3 px-1 pt-3 pb-2">
                  <span className="text-xs text-ink-faint">
                    {c.totalLessons} lessons · pass mark {c.passMark}%
                  </span>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={enroll.isPending}
                    onClick={async () => {
                      await enroll.mutateAsync({ courseId: c.courseId })
                      await navigate({ to: '/learn/$courseId', params: { courseId: c.courseId } })
                    }}
                  >
                    Enroll <PhArrowRight className="size-4" />
                  </Button>
                </div>
              </MinimalCard>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
