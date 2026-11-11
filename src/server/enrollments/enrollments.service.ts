// Server-only. A student's journey through one course: enrollment → lesson progress → final attempts.
import { eq } from 'drizzle-orm'
import { db, schema } from '#/db'

const { enrollment, lessonProgress, assessmentAttempt } = schema
type Status = (typeof schema.enrollmentStatuses)[number]

export async function enroll(userId: string, courseId: string) {
  // The (user, course) unique constraint is the duplicate check.
  try {
    const [row] = await db.insert(enrollment).values({ userId, courseId }).returning()
    return row
  } catch (e) {
    if (String(e).includes('UNIQUE')) throw new Error('This student is already enrolled in that course')
    throw e
  }
}

/** Admin override of the outcome (e.g. after an appeal). */
export async function setEnrollmentStatus(enrollmentId: string, status: Status) {
  const [row] = await db
    .update(enrollment)
    .set({ status, completedAt: status === 'in_progress' ? null : new Date() })
    .where(eq(enrollment.id, enrollmentId))
    .returning()
  if (!row) throw new Error('Enrollment not found')
  return row
}

/** Start the course over: clears lesson progress and assessment attempts. */
export async function resetEnrollment(enrollmentId: string) {
  await db.batch([
    db.delete(lessonProgress).where(eq(lessonProgress.enrollmentId, enrollmentId)),
    db.delete(assessmentAttempt).where(eq(assessmentAttempt.enrollmentId, enrollmentId)),
    db.update(enrollment).set({ status: 'in_progress', completedAt: null }).where(eq(enrollment.id, enrollmentId)),
  ])
}

export async function unenroll(enrollmentId: string) {
  await db.delete(enrollment).where(eq(enrollment.id, enrollmentId))
}
