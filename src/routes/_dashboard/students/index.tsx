import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/students/')({
  staticData: { title: 'Students' },
  component: StudentsPage,
})

function StudentsPage() {
  return <p className="text-ink-soft">Students coming soon.</p>
}
