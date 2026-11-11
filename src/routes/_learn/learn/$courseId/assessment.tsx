import { Link, createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { PhArrowLeft } from '@/components/icons/ph/arrow-left'
import { LearnError } from '@/components/learn/learn-error'
import { Spiral } from '@/components/loading-ui/spiral'
import { Button } from '@/components/ui/button'
import { assessmentQuery, learnFns, useAssessment, useLearnMutation } from '@/hooks/use-learn'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_learn/learn/$courseId/assessment')({
  loader: ({ context, params }) => context.queryClient.prefetchQuery(assessmentQuery(params.courseId)),
  errorComponent: LearnError,
  component: () => (
    <Suspense fallback={<Spiral className="mx-auto mt-16 block size-8 text-ink-faint" />}>
      <AssessmentPage />
    </Suspense>
  ),
})

type Result = { score: number; correct: number; total: number; passed: boolean; passMark: number }

function AssessmentPage() {
  const { courseId } = Route.useParams()
  const { data: a } = useAssessment(courseId)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Result | null>(null)
  const submit = useLearnMutation(learnFns.submitAssessment)
  const answered = Object.keys(answers).length

  const back = (
    <Link
      to="/learn/$courseId"
      params={{ courseId }}
      className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
    >
      <PhArrowLeft className="size-4" /> {a.courseTitle}
    </Link>
  )

  if (result)
    return (
      <div className="mx-auto max-w-xl">
        {back}
        <div
          className={cn(
            'mt-6 rounded-lg p-8 text-center sm:p-12',
            result.passed ? 'bg-night text-cream' : 'border border-line bg-white',
          )}
        >
          <p className={cn('text-sm', result.passed ? 'text-cream/70' : 'text-ink-soft')}>Your score</p>
          <p className={cn('mt-2 font-serif text-7xl tabular-nums', result.passed ? 'text-cream' : 'text-ink')}>
            {result.score}%
          </p>
          <p className={cn('mt-2 text-sm', result.passed ? 'text-cream/70' : 'text-ink-soft')}>
            {result.correct} of {result.total} correct · pass mark {result.passMark}%
          </p>
          <h1 className={cn('mt-8 font-serif text-4xl font-medium', result.passed ? 'text-cream' : 'text-ink')}>
            {result.passed ? (
              <>
                you <em className="text-brand">passed</em>
              </>
            ) : (
              <>
                not <em className="text-brand">quite</em> yet
              </>
            )}
          </h1>
          <p className={cn('mt-2 text-sm', result.passed ? 'text-cream/70' : 'text-ink-soft')}>
            {result.passed
              ? 'Congratulations, you have completed this course.'
              : 'Review the lessons and try again whenever you are ready.'}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {!result.passed && (
              <Button
                onClick={() => {
                  setAnswers({})
                  setResult(null)
                  window.scrollTo({ top: 0 })
                }}
              >
                Retake assessment
              </Button>
            )}
            <Button asChild variant="outline" className={result.passed ? 'border-cream/30 bg-transparent text-cream hover:bg-cream/10 hover:text-cream' : 'border-line'}>
              <Link to="/learn/$courseId" params={{ courseId }}>
                Back to course
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )

  return (
    <div className="mx-auto max-w-3xl">
      {back}
      <h1 className="mt-5 font-serif text-5xl font-medium tracking-tight text-ink">
        final <em className="text-brand">assessment</em>
      </h1>
      {a.instructions && <p className="mt-3 text-ink-soft">{a.instructions}</p>}

      <form
        className="mt-8 grid gap-5"
        onSubmit={async (e) => {
          e.preventDefault()
          const unanswered = a.questions.length - answered
          if (unanswered && !confirm(`${unanswered} question${unanswered === 1 ? ' is' : 's are'} unanswered and will count as wrong. Submit anyway?`))
            return
          setResult(await submit.mutateAsync({ courseId, answers }))
          window.scrollTo({ top: 0 })
        }}
      >
        {a.questions.map((q, qi) => (
          <fieldset key={q.id} className="rounded-lg border border-line bg-white p-5 sm:p-6">
            <legend className="sr-only">Question {qi + 1}</legend>
            <p className="flex gap-3 text-ink">
              <span className="font-serif text-xl text-brand tabular-nums">{qi + 1}.</span>
              <span className="pt-0.5 font-medium">{q.prompt}</span>
            </p>
            <div className="mt-4 grid gap-2 sm:ps-8">
              {q.options.map((o) => {
                const checked = answers[q.id] === o.id
                return (
                  <label
                    key={o.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors',
                      checked ? 'border-night bg-paper text-ink' : 'border-line text-ink-soft hover:border-ink-faint',
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={o.id}
                      checked={checked}
                      onChange={() => setAnswers((s) => ({ ...s, [q.id]: o.id }))}
                      className="size-4 accent-[var(--night)]"
                    />
                    {o.text}
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}

        <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
          <span className="text-sm text-ink-soft tabular-nums">
            {answered} of {a.questions.length} answered
          </span>
          <Button type="submit" disabled={submit.isPending} className="min-w-36">
            {submit.isPending ? <Spiral className="size-5" /> : 'Submit answers'}
          </Button>
        </div>
      </form>
    </div>
  )
}
