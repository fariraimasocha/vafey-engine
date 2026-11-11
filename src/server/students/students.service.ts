// Server-only. User management (via the Better Auth admin plugin) and per-student progress reads.
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, asc, count, desc, eq, like, max, or, sql } from 'drizzle-orm'
import { db, schema } from '#/db'
import { auth } from '#/lib/auth'

const { user, enrollment, course, module, topic, lesson, lessonProgress, assessmentAttempt } = schema

// ---------- reads ----------

export async function listUsers({ search, role }: { search?: string; role: 'student' | 'admin' | 'all' }) {
  const q = search ? `%${search}%` : null
  const enrolled = db.select({ n: count() }).from(enrollment).where(eq(enrollment.userId, user.id))
  const passed = db
    .select({ n: count() })
    .from(enrollment)
    .where(and(eq(enrollment.userId, user.id), eq(enrollment.status, 'passed')))

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt,
      enrollments: sql<number>`(${enrolled})`,
      passed: sql<number>`(${passed})`,
    })
    .from(user)
    .where(
      and(
        role === 'all' ? undefined : eq(user.role, role),
        q ? or(like(user.name, q), like(user.email, q)) : undefined,
      ),
    )
    .orderBy(desc(user.createdAt))
    .limit(500) // ponytail: no pagination yet; add cursor paging past a few hundred students
}

export async function getUserDetail(userId: string) {
  const [profile] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId))
  if (!profile) throw new Error('User not found')

  const lessonsPerCourse = db
    .select({ n: count() })
    .from(lesson)
    .innerJoin(topic, eq(lesson.topicId, topic.id))
    .innerJoin(module, eq(topic.moduleId, module.id))
    .where(eq(module.courseId, enrollment.courseId))

  // Not db.batch: D1 batch rows are keyed by column name, so enrollment.id and course.id
  // collide and shift every later field. Separate queries map by position.
  const [enrollments, courses] = await Promise.all([
    db
      .select({
        id: enrollment.id,
        courseId: course.id,
        courseTitle: course.title,
        passMark: course.passMark,
        status: enrollment.status,
        enrolledAt: enrollment.createdAt,
        completedAt: enrollment.completedAt,
        totalLessons: sql<number>`(${lessonsPerCourse})`,
        completedLessons: sql<number>`(${db.select({ n: count() }).from(lessonProgress).where(eq(lessonProgress.enrollmentId, enrollment.id))})`,
        attempts: sql<number>`(${db.select({ n: count() }).from(assessmentAttempt).where(eq(assessmentAttempt.enrollmentId, enrollment.id))})`,
        bestScore: sql<number | null>`(${db.select({ s: max(assessmentAttempt.score) }).from(assessmentAttempt).where(eq(assessmentAttempt.enrollmentId, enrollment.id))})`,
      })
      .from(enrollment)
      .innerJoin(course, eq(enrollment.courseId, course.id))
      .where(eq(enrollment.userId, userId))
      .orderBy(desc(enrollment.createdAt)),
    // Every course, for the "Enroll in course" picker.
    db.select({ id: course.id, title: course.title, status: course.status }).from(course).orderBy(asc(course.title)),
  ])

  return { ...profile, enrollments, courses }
}

export type UserDetail = Awaited<ReturnType<typeof getUserDetail>>

// ---------- writes (admin plugin; it re-checks the caller is an admin) ----------

const headers = () => getRequestHeaders()

/** Stop admins locking themselves out. */
function assertNotSelf(actorId: string, targetId: string, action: string) {
  if (actorId === targetId) throw new Error(`You can't ${action} your own account`)
}

export async function createUser(input: { name: string; email: string; password: string; role: 'student' | 'admin' }) {
  const { user: created } = await auth.api.createUser({ body: input, headers: headers() })
  return { id: created.id }
}

export async function setRole(actorId: string, userId: string, role: 'student' | 'admin') {
  assertNotSelf(actorId, userId, 'change the role of')
  await auth.api.setRole({ body: { userId, role }, headers: headers() })
}

export async function banUser(actorId: string, userId: string, reason?: string) {
  assertNotSelf(actorId, userId, 'suspend')
  // Banning also revokes their sessions, so they're signed out immediately.
  await auth.api.banUser({ body: { userId, banReason: reason || undefined }, headers: headers() })
}

export async function unbanUser(userId: string) {
  await auth.api.unbanUser({ body: { userId }, headers: headers() })
}

export async function setPassword(userId: string, newPassword: string) {
  await auth.api.setUserPassword({ body: { userId, newPassword }, headers: headers() })
  await auth.api.revokeUserSessions({ body: { userId }, headers: headers() })
}

export async function removeUser(actorId: string, userId: string) {
  assertNotSelf(actorId, userId, 'delete')
  // Cascades to sessions, accounts, enrollments, progress and attempts.
  await auth.api.removeUser({ body: { userId }, headers: headers() })
}
