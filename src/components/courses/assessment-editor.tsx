import { useState } from 'react'
import { PhPlus } from '@/components/icons/ph/plus'
import { PhTrash } from '@/components/icons/ph/trash'
import { Spiral } from '@/components/loading-ui/spiral'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { courseFns, useCourseMutation } from '@/hooks/use-courses'
import { cn } from '@/lib/utils'
import type { CourseTree } from '#/server/courses/courses.service'

type Draft = { prompt: string; options: { text: string; isCorrect: boolean }[] }

const blankQuestion = (): Draft => ({
  prompt: '',
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
})

/** Edits the course's single final MCQ assessment as a local draft, saved in one go. */
export function AssessmentEditor({ course }: { course: CourseTree }) {
  const a = course.assessment
  const [title, setTitle] = useState(a?.title ?? `${course.title}: Final Assessment`)
  const [instructions, setInstructions] = useState(a?.instructions ?? '')
  const [questions, setQuestions] = useState<Draft[]>(
    a?.questions.map((q) => ({ prompt: q.prompt, options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) })) ?? [
      blankQuestion(),
    ],
  )
  const save = useCourseMutation(courseFns.saveAssessment, { success: 'Assessment saved' })

  const patch = (qi: number, fn: (q: Draft) => Draft) => setQuestions((qs) => qs.map((q, i) => (i === qi ? fn(q) : q)))

  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate({ courseId: course.id, title, instructions: instructions || null, questions })
      }}
    >
      <div className="grid gap-4 rounded-lg border border-line bg-white p-5">
        <div className="grid gap-2">
          <Label htmlFor="a-title">Assessment title</Label>
          <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="a-instructions">Instructions</Label>
          <Textarea id="a-instructions" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </div>
        <p className="text-sm text-ink-soft">
          {questions.length} questions · students need <strong className="text-ink">{course.passMark}%</strong> to pass the course.
        </p>
      </div>

      {questions.map((q, qi) => (
        <fieldset key={qi} className="rounded-lg border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <legend className="sr-only">Question {qi + 1}</legend>
            <span className="mt-1.5 font-serif text-xl text-brand tabular-nums">{qi + 1}.</span>
            <Textarea
              aria-label={`Question ${qi + 1} prompt`}
              rows={2}
              value={q.prompt}
              placeholder="Question prompt"
              required
              onChange={(e) => patch(qi, (d) => ({ ...d, prompt: e.target.value }))}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-ink-faint hover:text-destructive"
              aria-label={`Remove question ${qi + 1}`}
              onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}
            >
              <PhTrash className="size-4" />
            </Button>
          </div>

          <div className="mt-4 grid gap-2 sm:ps-8">
            {q.options.map((o, oi) => (
              <label
                key={oi}
                className={cn(
                  'flex items-center gap-3 rounded-md border px-3 py-1.5',
                  o.isCorrect ? 'border-success/40 bg-success-soft' : 'border-line',
                )}
              >
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={o.isCorrect}
                  onChange={() => patch(qi, (d) => ({ ...d, options: d.options.map((x, i) => ({ ...x, isCorrect: i === oi })) }))}
                  className="size-4 accent-[var(--success)]"
                  aria-label={`Mark option ${oi + 1} correct`}
                />
                <Input
                  value={o.text}
                  placeholder={`Option ${oi + 1}`}
                  required
                  onChange={(e) =>
                    patch(qi, (d) => ({ ...d, options: d.options.map((x, i) => (i === oi ? { ...x, text: e.target.value } : x)) }))
                  }
                  className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
                {q.options.length > 2 && (
                  <button
                    type="button"
                    className="text-ink-faint hover:text-destructive"
                    aria-label={`Remove option ${oi + 1}`}
                    onClick={() =>
                      patch(qi, (d) => {
                        const options = d.options.filter((_, i) => i !== oi)
                        // Keep exactly one correct answer.
                        if (!options.some((x) => x.isCorrect)) options[0] = { ...options[0], isCorrect: true }
                        return { ...d, options }
                      })
                    }
                  >
                    <PhTrash className="size-3.5" />
                  </button>
                )}
              </label>
            ))}
            {q.options.length < 8 && (
              <button
                type="button"
                className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink"
                onClick={() => patch(qi, (d) => ({ ...d, options: [...d.options, { text: '', isCorrect: false }] }))}
              >
                <PhPlus className="size-3.5" /> Add option
              </button>
            )}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Button
          type="button"
          variant="outline"
          className="gap-2 border-line"
          onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
        >
          <PhPlus className="size-4" /> Add question
        </Button>
        <Button type="submit" disabled={save.isPending} className="min-w-36">
          {save.isPending ? <Spiral className="size-5" /> : 'Save assessment'}
        </Button>
      </div>
    </form>
  )
}
