// Student progress through a course and their final assessment attempts.
import { index, integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { assessment } from './assessments'
import { user } from './auth'
import { course, lesson } from './courses'
import { id, timestamps } from './helpers'

export const enrollmentStatuses = ['in_progress', 'passed', 'failed'] as const

export const enrollment = sqliteTable(
  'enrollment',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    status: text('status', { enum: enrollmentStatuses }).notNull().default('in_progress'),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    ...timestamps,
  },
  (t) => [unique('enrollment_user_course_uq').on(t.userId, t.courseId), index('enrollment_course_idx').on(t.courseId)],
)

export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    enrollmentId: text('enrollment_id')
      .notNull()
      .references(() => enrollment.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lesson.id, { onDelete: 'cascade' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.enrollmentId, t.lessonId] })],
)

export const assessmentAttempt = sqliteTable(
  'assessment_attempt',
  {
    id: id(),
    enrollmentId: text('enrollment_id')
      .notNull()
      .references(() => enrollment.id, { onDelete: 'cascade' }),
    assessmentId: text('assessment_id')
      .notNull()
      .references(() => assessment.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(), // percentage 0-100
    passed: integer('passed', { mode: 'boolean' }).notNull(),
    answers: text('answers', { mode: 'json' }).$type<Record<string, string>>().notNull(), // questionId → optionId
    submittedAt: integer('submitted_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('attempt_enrollment_idx').on(t.enrollmentId)],
)
