import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

// Messages thrown on purpose by server/learn/learn.service.ts. Safe and useful to show students in production.
const FRIENDLY = new Set([
  'Finish the previous lessons first',
  'Finish all lessons to unlock the final assessment',
  'Enroll in this course to view it',
  'This course is not open for enrollment',
  'This course has no final assessment yet',
  'Lesson not found',
  'Course not found',
])

export function LearnError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const message = error instanceof Error && FRIENDLY.has(error.message) ? error.message : null
  return (
    <div className="grid min-h-[50dvh] place-items-center text-center">
      <div className="max-w-md">
        <h1 className="font-serif text-4xl font-medium text-ink">
          {message ? (
            <>
              not <em className="text-brand">yet</em>
            </>
          ) : (
            <>
              something went <em className="text-brand">wrong</em>
            </>
          )}
        </h1>
        <p className="mt-3 text-ink-soft">{message ?? 'Please try again in a moment.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to="/learn">My learning</Link>
          </Button>
          {!message && (
            <Button
              variant="outline"
              className="border-line"
              onClick={() => {
                reset()
                router.invalidate()
              }}
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
