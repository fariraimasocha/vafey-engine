import { asc, count, eq, gte, sql } from 'drizzle-orm'
import { db, schema } from '#/db'

export type DashboardStats = {
  courses: number
  publishedCourses: number
  students: number
  enrollments: number
  passRate: number | null // % of finished enrollments that passed; null when none finished
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [[courses], [published], [students], enrollmentsByStatus] = await db.batch([
    db.select({ n: count() }).from(schema.course),
    db.select({ n: count() }).from(schema.course).where(eq(schema.course.status, 'published')),
    db.select({ n: count() }).from(schema.user).where(eq(schema.user.role, 'student')),
    db
      .select({ status: schema.enrollment.status, n: count() })
      .from(schema.enrollment)
      .groupBy(schema.enrollment.status),
  ])

  const by = Object.fromEntries(enrollmentsByStatus.map((r) => [r.status, r.n]))
  const passed = by.passed ?? 0
  const finished = passed + (by.failed ?? 0)

  return {
    courses: courses.n,
    publishedCourses: published.n,
    students: students.n,
    enrollments: enrollmentsByStatus.reduce((sum, r) => sum + r.n, 0),
    passRate: finished ? Math.round((passed / finished) * 100) : null,
  }
}

// ---------- charts ----------

const DAY_MS = 86_400_000
export const ENROLLMENT_WINDOW_DAYS = 30

export type EnrollmentStatus = (typeof schema.enrollmentStatuses)[number]

export type DashboardCharts = {
  /** One row per day for the last 30 days (zero-filled), oldest first. */
  enrollmentsByDay: { day: string; enrollments: number }[]
  /** Enrollment outcomes per course; courses with no enrollments are omitted. */
  outcomesByCourse: { course: string; status: EnrollmentStatus; count: number }[]
  /** Final-assessment attempts in 10-point score buckets, split by pass/fail. */
  scoreBuckets: { bucket: string; result: 'Passed' | 'Failed'; attempts: number }[]
}

export async function getDashboardCharts(): Promise<DashboardCharts> {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const since = new Date(today.getTime() - (ENROLLMENT_WINDOW_DAYS - 1) * DAY_MS)
  const { enrollment, course, assessmentAttempt } = schema

  const dayExpr = sql<string>`date(${enrollment.createdAt} / 1000, 'unixepoch')`
  const bucketExpr = sql<number>`min(${assessmentAttempt.score} / 10, 9)` // 100 joins the 90–100 bucket

  const [daily, outcomes, scores] = await db.batch([
    db
      .select({ day: dayExpr, n: count() })
      .from(enrollment)
      .where(gte(enrollment.createdAt, since))
      .groupBy(dayExpr),
    db
      .select({ course: course.title, status: enrollment.status, n: count() })
      .from(enrollment)
      .innerJoin(course, eq(enrollment.courseId, course.id))
      .groupBy(course.id, enrollment.status)
      .orderBy(asc(course.title)),
    db
      .select({ bucket: bucketExpr, passed: assessmentAttempt.passed, n: count() })
      .from(assessmentAttempt)
      .groupBy(bucketExpr, assessmentAttempt.passed),
  ])

  const byDay = new Map(daily.map((r) => [r.day, r.n]))
  const enrollmentsByDay = Array.from({ length: ENROLLMENT_WINDOW_DAYS }, (_, i) => {
    const iso = new Date(since.getTime() + i * DAY_MS).toISOString().slice(0, 10)
    return { day: iso, enrollments: byDay.get(iso) ?? 0 }
  })

  const label = (b: number) => (b === 9 ? '90–100' : `${b * 10}–${b * 10 + 9}`)
  const scoreBuckets = scores
    .map((r) => ({ bucket: label(r.bucket), result: (r.passed ? 'Passed' : 'Failed') as 'Passed' | 'Failed', attempts: r.n }))

  return {
    enrollmentsByDay,
    outcomesByCourse: outcomes.map((r) => ({ course: r.course, status: r.status, count: r.n })),
    scoreBuckets,
  }
}
