import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense } from 'react'
import { LessonViewer } from '@/components/editor/lesson-viewer'
import { PhArrowLeft } from '@/components/icons/ph/arrow-left'
import { PhArrowRight } from '@/components/icons/ph/arrow-right'
import { PhCheckCircleFill } from '@/components/icons/ph/check-circle-fill'
import { ProgressBar } from '@/components/learn/progress-bar'
import { LearnError } from '@/components/learn/learn-error'
import { Spiral } from '@/components/loading-ui/spiral'
import { Button } from '@/components/ui/button'
import { learnFns, lessonQuery, useLearnMutation, useLesson } from '@/hooks/use-learn'

export const Route = createFileRoute('/_learn/learn/$courseId/lessons/$lessonId')({
  staticData: { title: 'Lesson' },
  loader: ({ context, params }) => context.queryClient.prefetchQuery(lessonQuery(params.courseId, params.lessonId)),
  errorComponent: LearnError,
  component: () => (
    <Suspense fallback={<Spiral className="mx-auto mt-16 block size-8 text-ink-faint" />}>
      <LessonPage />
    </Suspense>
  ),
})

function LessonPage() {
  const { courseId, lessonId } = Route.useParams()
  const { data: l } = useLesson(courseId, lessonId)
  const navigate = useNavigate()
  const complete = useLearnMutation(learnFns.completeLesson)

  async function next() {
    const { next } = await complete.mutateAsync({ courseId, lessonId })
    if (next === 'assessment') await navigate({ to: '/learn/$courseId/assessment', params: { courseId } })
    else if (next === 'course') await navigate({ to: '/learn/$courseId', params: { courseId } })
    else await navigate({ to: '/learn/$courseId/lessons/$lessonId', params: { courseId, lessonId: next } })
    window.scrollTo({ top: 0 })
  }

  const isLast = !l.nextId

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/learn/$courseId"
        params={{ courseId }}
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <PhArrowLeft className="size-4" /> {l.courseTitle}
      </Link>

      <div className="mt-5 flex items-center gap-3 text-xs text-ink-faint">
        <span>
          {l.module} · {l.topic}
        </span>
        <span className="ms-auto tabular-nums">
          Lesson {l.position} of {l.total}
        </span>
      </div>
      <ProgressBar done={l.position} total={l.total} className="mt-2 h-1" />

      <article className="mt-8 min-h-[50dvh] rounded-lg border border-line bg-white px-5 py-8 sm:px-10 sm:py-12">
        {/* key: remount the read-only editor for each lesson */}
        <LessonViewer key={l.id} markdown={l.content} />
      </article>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {l.prevId ? (
          <Button asChild variant="ghost" className="gap-2 text-ink-soft">
            <Link to="/learn/$courseId/lessons/$lessonId" params={{ courseId, lessonId: l.prevId }}>
              <PhArrowLeft className="size-4" /> Previous
            </Link>
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {l.completed && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success">
              <PhCheckCircleFill className="size-4" /> Completed
            </span>
          )}
          <Button onClick={next} disabled={complete.isPending} className="min-w-44 gap-2">
            {complete.isPending ? (
              <Spiral className="size-5" />
            ) : (
              <>
                {l.completed ? 'Next' : 'Mark complete'}
                {isLast ? (l.hasAssessment ? ' · go to assessment' : ' · finish') : ' & continue'}
                <PhArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
