import { Link, createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { PhArrowLeft } from '@/components/icons/ph/arrow-left'
import { PhArrowRight } from '@/components/icons/ph/arrow-right'
import { PhCheckCircleFill } from '@/components/icons/ph/check-circle-fill'
import { PhCircle } from '@/components/icons/ph/circle'
import { PhLockSimple } from '@/components/icons/ph/lock-simple'
import { ProgressBar } from '@/components/learn/progress-bar'
import { LearnError } from '@/components/learn/learn-error'
import { Spiral } from '@/components/loading-ui/spiral'
import { StatusBadge } from '@/components/students/user-badges'
import { Button } from '@/components/ui/button'
import { learnCourseQuery, useLearnCourse } from '@/hooks/use-learn'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_learn/learn/$courseId/')({
  staticData: { title: 'Course' },
  loader: ({ context, params }) => context.queryClient.prefetchQuery(learnCourseQuery(params.courseId)),
  errorComponent: LearnError,
  component: () => (
    <Suspense fallback={<Spiral className="mx-auto mt-16 block size-8 text-ink-faint" />}>
      <CourseOverview />
    </Suspense>
  ),
})

function CourseOverview() {
  const { courseId } = Route.useParams()
  const { data: c } = useLearnCourse(courseId)
  const a = c.assessment
  const started = c.completedLessons > 0

  return (
    <div>
      <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <PhArrowLeft className="size-4" /> My learning
      </Link>

      <header className="mt-5">
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} />
          <span className="text-sm text-ink-faint">Pass mark {c.passMark}%</span>
        </div>
        <h1 className="mt-3 font-serif text-5xl font-medium tracking-tight text-ink sm:text-6xl">{c.title}</h1>
        {c.description && <p className="mt-3 max-w-2xl text-ink-soft">{c.description}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-6 rounded-lg border border-line bg-white p-5">
          <div className="min-w-56 flex-1">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-ink-soft">Your progress</span>
              <span className="text-ink tabular-nums">
                {c.completedLessons} / {c.totalLessons} lessons
              </span>
            </div>
            <ProgressBar done={c.completedLessons} total={c.totalLessons} />
          </div>
          {c.nextLessonId ? (
            <Button asChild className="gap-2">
              <Link to="/learn/$courseId/lessons/$lessonId" params={{ courseId, lessonId: c.nextLessonId }}>
                {started ? 'Continue' : 'Start course'} <PhArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            a && (
              <Button asChild className="gap-2">
                <Link to="/learn/$courseId/assessment" params={{ courseId }}>
                  {a.attempts ? 'Retake assessment' : 'Take the final assessment'} <PhArrowRight className="size-4" />
                </Link>
              </Button>
            )
          )}
        </div>
      </header>

      <ol className="mt-10 grid gap-5">
        {c.modules.map((m, mi) => (
          <li key={m.id} className="rounded-lg border border-line bg-white">
            <div className="flex items-start gap-3 border-b border-line p-5">
              <span className="mt-1 font-serif text-2xl text-brand tabular-nums">{String(mi + 1).padStart(2, '0')}</span>
              <div>
                <h2 className="font-serif text-2xl font-medium text-ink">{m.title}</h2>
                {m.description && <p className="mt-1 text-sm text-ink-soft">{m.description}</p>}
              </div>
            </div>
            <div className="grid gap-4 p-5">
              {m.topics.map((t) => (
                <div key={t.id}>
                  <h3 className="text-sm font-semibold text-ink">{t.title}</h3>
                  <ul className="mt-2 grid gap-1">
                    {t.lessons.map((l) => (
                      <li key={l.id}>
                        <LessonRow courseId={courseId} lesson={l} isNext={l.id === c.nextLessonId} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {a && (
        <section
          className={cn(
            'mt-5 rounded-lg border p-6',
            a.unlocked ? 'border-night bg-night text-cream' : 'border-dashed border-line bg-white/60',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className={cn('font-serif text-3xl font-medium', a.unlocked ? 'text-cream' : 'text-ink')}>
                final <em className="text-brand">assessment</em>
              </h2>
              <p className={cn('mt-1 text-sm', a.unlocked ? 'text-cream/70' : 'text-ink-soft')}>
                {a.questionCount} multiple-choice questions · you need {c.passMark}% to pass
                {a.attempts > 0 && ` · ${a.attempts} attempt${a.attempts === 1 ? '' : 's'}, best ${a.bestScore}%`}
              </p>
            </div>
            {a.unlocked ? (
              <Button asChild variant="secondary" className="gap-2 bg-cream text-night hover:bg-white">
                <Link to="/learn/$courseId/assessment" params={{ courseId }}>
                  {a.attempts ? 'Retake' : 'Begin'} <PhArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-ink-faint">
                <PhLockSimple className="size-4" /> Unlocks after all {c.totalLessons} lessons
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function LessonRow({
  courseId,
  lesson: l,
  isNext,
}: {
  courseId: string
  lesson: { id: string; title: string; completed: boolean; locked: boolean }
  isNext: boolean
}) {
  const icon = l.completed ? (
    <PhCheckCircleFill className="size-5 text-success" aria-label="Completed" />
  ) : l.locked ? (
    <PhLockSimple className="size-4 text-ink-faint" aria-label="Locked" />
  ) : (
    <PhCircle className="size-5 text-brand" aria-label="Up next" />
  )

  if (l.locked)
    return (
      <span className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-ink-faint">
        <span className="grid size-5 place-items-center">{icon}</span>
        {l.title}
      </span>
    )

  return (
    <Link
      to="/learn/$courseId/lessons/$lessonId"
      params={{ courseId, lessonId: l.id }}
      className={cn(
        'flex items-center gap-3 rounded-md px-2 py-2 text-sm text-ink hover:bg-paper',
        isNext && 'bg-brand-soft font-semibold',
      )}
    >
      <span className="grid size-5 place-items-center">{icon}</span>
      <span className="flex-1">{l.title}</span>
      {isNext && <span className="text-xs font-medium text-brand-dark">Up next</span>}
    </Link>
  )
}
