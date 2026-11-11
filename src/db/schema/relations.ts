// Enables `db.query.*.findMany({ with: { ... } })` across the hierarchy.
import { relations } from 'drizzle-orm'
import { assessment, question, questionOption } from './assessments'
import { session, user } from './auth'
import { course, lesson, module, topic } from './courses'
import { assessmentAttempt, enrollment, lessonProgress } from './enrollments'

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  enrollments: many(enrollment),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const courseRelations = relations(course, ({ many, one }) => ({
  modules: many(module),
  assessment: one(assessment),
  enrollments: many(enrollment),
}))

export const moduleRelations = relations(module, ({ one, many }) => ({
  course: one(course, { fields: [module.courseId], references: [course.id] }),
  topics: many(topic),
}))

export const topicRelations = relations(topic, ({ one, many }) => ({
  module: one(module, { fields: [topic.moduleId], references: [module.id] }),
  lessons: many(lesson),
}))

export const lessonRelations = relations(lesson, ({ one }) => ({
  topic: one(topic, { fields: [lesson.topicId], references: [topic.id] }),
}))

export const assessmentRelations = relations(assessment, ({ one, many }) => ({
  course: one(course, { fields: [assessment.courseId], references: [course.id] }),
  questions: many(question),
}))

export const questionRelations = relations(question, ({ one, many }) => ({
  assessment: one(assessment, { fields: [question.assessmentId], references: [assessment.id] }),
  options: many(questionOption),
}))

export const questionOptionRelations = relations(questionOption, ({ one }) => ({
  question: one(question, { fields: [questionOption.questionId], references: [question.id] }),
}))

export const enrollmentRelations = relations(enrollment, ({ one, many }) => ({
  user: one(user, { fields: [enrollment.userId], references: [user.id] }),
  course: one(course, { fields: [enrollment.courseId], references: [course.id] }),
  lessonProgress: many(lessonProgress),
  attempts: many(assessmentAttempt),
}))

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  enrollment: one(enrollment, { fields: [lessonProgress.enrollmentId], references: [enrollment.id] }),
  lesson: one(lesson, { fields: [lessonProgress.lessonId], references: [lesson.id] }),
}))

export const assessmentAttemptRelations = relations(assessmentAttempt, ({ one }) => ({
  enrollment: one(enrollment, { fields: [assessmentAttempt.enrollmentId], references: [enrollment.id] }),
  assessment: one(assessment, { fields: [assessmentAttempt.assessmentId], references: [assessment.id] }),
}))
