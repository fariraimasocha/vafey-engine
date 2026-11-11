import { cn } from '@/lib/utils'

export function ProgressBar({ done, total, className }: { done: number; total: number; className?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-label="Lessons completed"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 overflow-hidden rounded-full bg-line/60', className)}
    >
      <div className="h-full rounded-full bg-night transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}
