import { barX, barY, colorLegend, colorLegendItems, defineChart, stack } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { useMemo, type ReactNode } from 'react'
import { useDashboardCharts } from '@/hooks/use-dashboard'
import type { DashboardCharts } from '#/server/dashboard/dashboard.service'

// Validated with the dataviz palette checker (CVD + contrast) against white.
// Failed sits under 3:1 contrast, so every chart with it has a legend and a table view.
const OUTCOME_COLORS = { in_progress: '#3b73c9', passed: '#2f7a4c', failed: '#e0805c' } as const
const OUTCOME_LABELS = { in_progress: 'In progress', passed: 'Passed', failed: 'Failed' } as const
const SINGLE_SERIES = '#2b2926' // night ink, for one-series bars

const integer = (n: number) => (Number.isInteger(n) ? String(n) : '')
const shortDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export function DashboardCharts() {
  const { data } = useDashboardCharts()
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
      <EnrollmentsCard rows={data.enrollmentsByDay} />
      <OutcomesCard rows={data.outcomesByCourse} />
      <ScoresCard rows={data.scoreBuckets} />
    </div>
  )
}

// ---------- enrollments per day ----------

function EnrollmentsCard({ rows }: { rows: DashboardCharts['enrollmentsByDay'] }) {
  const total = rows.reduce((s, r) => s + r.enrollments, 0)
  const definition = useMemo(() => {
    const data = rows.map((r) => ({ ...r, label: shortDate.format(new Date(r.day)) }))
    return defineChart({
      marks: [barY(data, { x: 'label', y: 'enrollments', fill: SINGLE_SERIES, radius: [3, 3, 0, 0], inset: 1 })],
      scales: {
        x: {
          scale: () => scaleBand<string>().padding(0.4),
          axis: { ticks: { size: 0 }, tickLabels: { thin: { minGap: 16, priority: 'ends' } } },
        },
        y: { scale: scaleLinear, nice: true, grid: true, axis: { ticks: { format: integer } } },
      },
      tooltip: {
        use: tooltip,
        items: [
          { channel: 'x', label: 'Day' },
          { channel: 'y', label: 'Enrollments' },
        ],
      },
    })
  }, [rows])

  return (
    <ChartCard
      className="lg:col-span-2"
      title="Enrollments"
      description={`New enrollments per day, last 30 days · ${total} total`}
      empty={total === 0 && 'No enrollments in the last 30 days.'}
    >
      <Chart definition={definition} height={240} ariaLabel="New enrollments per day over the last 30 days" />
    </ChartCard>
  )
}

// ---------- outcomes per course ----------

function OutcomesCard({ rows }: { rows: DashboardCharts['outcomesByCourse'] }) {
  const definition = useMemo(() => {
    const data = rows.map((r) => ({ ...r, outcome: OUTCOME_LABELS[r.status] }))
    const order = Object.values(OUTCOME_LABELS)
    return defineChart({
      marks: [
        barX(data, {
          x: 'count',
          y: 'course',
          color: 'outcome',
          layout: stack({ order }),
          stroke: '#ffffff', // 2px surface gap between segments
          strokeWidth: 2,
          maxThickness: 28,
        }),
      ],
      scales: {
        x: { scale: scaleLinear, nice: true, grid: true, axis: { ticks: { format: integer } } },
        y: { scale: () => scaleBand<string>().padding(0.3), axis: { ticks: { size: 0 } } },
      },
      color: {
        domain: order,
        range: order.map((label) => OUTCOME_COLORS[keyOf(label)]),
        legend: colorLegend({ placement: 'bottom', items: colorLegendItems({ justify: 'start', gap: 16 }) }),
      },
      tooltip: {
        use: tooltip,
        items: [
          { field: 'course', label: 'Course' },
          { field: 'outcome', label: 'Outcome' },
          { channel: 'x', label: 'Students' },
        ],
      },
    })
  }, [rows])

  const courses = [...new Set(rows.map((r) => r.course))]

  return (
    <ChartCard
      title="Course outcomes"
      description="Where enrolled students are, per course"
      empty={!rows.length && 'No enrollments yet.'}
      table={
        <DataTable
          head={['Course', ...Object.values(OUTCOME_LABELS)]}
          rows={courses.map((c) => [
            c,
            ...(Object.keys(OUTCOME_LABELS) as (keyof typeof OUTCOME_LABELS)[]).map(
              (s) => rows.find((r) => r.course === c && r.status === s)?.count ?? 0,
            ),
          ])}
        />
      }
    >
      <Chart
        definition={definition}
        height={Math.max(160, courses.length * 44 + 90)}
        ariaLabel="Enrollment outcomes per course: in progress, passed and failed"
      />
    </ChartCard>
  )
}

const keyOf = (label: string) =>
  (Object.entries(OUTCOME_LABELS).find(([, l]) => l === label)?.[0] ?? 'in_progress') as keyof typeof OUTCOME_COLORS

// ---------- score distribution ----------

const BUCKETS = ['0–9', '10–19', '20–29', '30–39', '40–49', '50–59', '60–69', '70–79', '80–89', '90–100']

function ScoresCard({ rows }: { rows: DashboardCharts['scoreBuckets'] }) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(rows, {
            x: 'bucket',
            y: 'attempts',
            color: 'result',
            layout: stack({ order: ['Passed', 'Failed'] }),
            stroke: '#ffffff',
            strokeWidth: 2,
          }),
        ],
        scales: {
          x: {
            scale: scaleBand<string>().domain(BUCKETS).padding(0.2), // instance, not factory: keeps empty buckets
            axis: { label: 'Score (%)', ticks: { size: 0 } },
          },
          y: { scale: scaleLinear, nice: true, grid: true, axis: { ticks: { format: integer } } },
        },
        color: {
          domain: ['Passed', 'Failed'],
          range: [OUTCOME_COLORS.passed, OUTCOME_COLORS.failed],
          legend: colorLegend({ placement: 'bottom', items: colorLegendItems({ justify: 'start', gap: 16 }) }),
        },
        tooltip: {
          use: tooltip,
          items: [
            { channel: 'x', label: 'Score' },
            { field: 'result', label: 'Result' },
            { channel: 'y', label: 'Attempts' },
          ],
        },
      }),
    [rows],
  )

  const total = rows.reduce((s, r) => s + r.attempts, 0)
  const passed = rows.filter((r) => r.result === 'Passed').reduce((s, r) => s + r.attempts, 0)

  return (
    <ChartCard
      title="Assessment scores"
      description={
        total ? `${total} final-assessment attempts · ${passed} passed` : 'Final-assessment attempts by score'
      }
      empty={!total && 'No assessment attempts yet.'}
      table={
        <DataTable
          head={['Score', 'Passed', 'Failed']}
          rows={BUCKETS.flatMap((b) => {
            const p = rows.find((r) => r.bucket === b && r.result === 'Passed')?.attempts ?? 0
            const f = rows.find((r) => r.bucket === b && r.result === 'Failed')?.attempts ?? 0
            return p + f ? [[b, p, f]] : []
          })}
        />
      }
    >
      <Chart
        definition={definition}
        height={260}
        ariaLabel="Distribution of final-assessment scores, split by pass and fail"
      />
    </ChartCard>
  )
}

// ---------- shared ----------

function ChartCard({
  title,
  description,
  empty,
  table,
  className,
  children,
}: {
  title: string
  description: string
  empty?: string | false
  table?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`rounded-lg border border-line bg-white p-5 ${className ?? ''}`}>
      <h2 className="font-serif text-2xl font-medium text-ink">{title}</h2>
      <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
      {empty ? (
        <div className="mt-4 grid h-40 place-items-center rounded-md border border-dashed border-line bg-paper-soft text-sm text-ink-faint">
          {empty}
        </div>
      ) : (
        <>
          {/* Chart text inherits `color`; ink-soft keeps axes recessive. */}
          <div className="mt-4 text-ink-soft">{children}</div>
          {table && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-ink-soft hover:text-ink">View as table</summary>
              <div className="mt-2">{table}</div>
            </details>
          )}
        </>
      )}
    </section>
  )
}

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-start text-ink-soft">
          {head.map((h, i) => (
            <th key={h} className={`py-1.5 font-medium ${i ? 'text-end' : 'text-start'}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={String(r[0])} className="border-b border-line/60">
            {r.map((cell, i) => (
              <td key={i} className={`py-1.5 text-ink ${i ? 'text-end tabular-nums' : ''}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
