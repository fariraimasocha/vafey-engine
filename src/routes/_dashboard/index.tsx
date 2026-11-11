import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/')({
  staticData: { title: 'Overview' },
  component: OverviewPage,
})

function OverviewPage() {
  return <p className="text-ink-soft">Overview coming soon.</p>
}
