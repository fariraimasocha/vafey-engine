import { Badge } from '@/components/ui/badge'

export const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export function RoleBadge({ role }: { role: string }) {
  return role === 'admin' ? (
    <Badge variant="outline" className="border-brand/30 bg-brand-soft text-brand-dark">
      Admin
    </Badge>
  ) : (
    <Badge variant="outline" className="border-line text-ink-soft">
      Student
    </Badge>
  )
}

export function SuspendedBadge() {
  return (
    <Badge variant="outline" className="border-destructive/30 bg-destructive/5 text-destructive">
      Suspended
    </Badge>
  )
}

const STATUS = {
  in_progress: { label: 'In progress', className: 'border-[#3b73c9]/30 bg-[#3b73c9]/8 text-[#2c5aa0]' },
  passed: { label: 'Passed', className: 'border-success/30 bg-success-soft text-success' },
  failed: { label: 'Failed', className: 'border-[#e0805c]/40 bg-brand-soft text-brand-dark' },
} as const

/** Enrollment outcome, same colors as the dashboard charts. */
export function StatusBadge({ status }: { status: keyof typeof STATUS }) {
  return (
    <Badge variant="outline" className={STATUS[status].className}>
      {STATUS[status].label}
    </Badge>
  )
}
