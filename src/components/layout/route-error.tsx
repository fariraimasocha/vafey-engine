import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

/** App-wide error screen (router defaultErrorComponent). */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-4xl font-medium text-ink">
          something went <em className="text-brand">wrong</em>
        </h1>
        <p className="mt-3 text-sm text-ink-soft">{error instanceof Error && error.message ? error.message : 'An unexpected error occurred.'}</p>
        <Button
          variant="outline"
          className="mt-6 border-line"
          onClick={() => {
            reset()
            router.invalidate()
          }}
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
