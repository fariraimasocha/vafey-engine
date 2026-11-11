import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/courses/')({
  staticData: { title: 'Courses' },
  component: CoursesPage,
})

function CoursesPage() {
  return <p className="text-ink-soft">Courses coming soon.</p>
}
