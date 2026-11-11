import { cn } from '@/lib/utils'

/** Vafey mark (public/logo-mark.png) + wordmark. `tone="light"` for dark backgrounds. */
export function Logo({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <img src="/logo-mark.png" alt="" width={231} height={91} className="h-6 w-auto shrink-0" />
      <span
        data-wordmark
        className={cn('truncate text-xl font-semibold tracking-tight', tone === 'dark' ? 'text-ink' : 'text-cream')}
      >
        Vafey
      </span>
    </span>
  )
}
