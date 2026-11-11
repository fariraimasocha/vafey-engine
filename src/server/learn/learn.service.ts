// Server-only. The student's side of a course. Every function takes the *signed-in* userId (never a
// client-supplied one), so students can only ever touch their own enrollment.
// Rules enforced here, not in the UI:
//   - lessons unlock strictly in order (module → topic → lesson positions)
//   - the final assessment unlocks only when every lesson is complete
//   - the answer key never leaves the server; grading happens here
//   - unlimited retakes; once passed, a course stays passed
import { and, asc, count, desc, eq, inArray, max, notInArray, sql } from 'drizzle-orm'
import { db, schema } from '#/db'
import { getCourseTree, type CourseTree } from '#/server/courses/courses.service'
import { enroll } from '#/server/enrollments/enrollments.service'

const { course, module, topic, lesson, enrollment, lessonProgress, assessmentAttempt } = schema

// ---------- helpers ----------

/** Lessons in the order a student takes them. */
export function orderedLessons(tree: CourseTree) {
  return tree.modules.flatMap((m) => m.topics.flatMap((t) => t.lessons))
}

async function requireEnrollment(userId: string, courseId: string) {
  const [row] = await db
    .select()
    .from(enrollment)
    .where(and(eq(enrollment.userId, userId), eq(enrollment.courseId, courseId)))
  if (!row) throw new Error('Enroll in this course to view it')
  return row
}

/** Tree + enrollment + this student's completed lesson ids, with lock state computed. */
async function loadProgress(userId: string, courseId: string) {
  const [tree, enr] = await Promise.all([getCourseTree(courseId), requireEnrollment(userId, courseId)])
  if (!tree) throw new Error('Course not found')
  const done = new Set(
    (
      await db
        .select({ lessonId: lessonProgress.lessonId })
        .from(lessonProgress)
        .where(eq(lessonProgress.enrollmentId, enr.id))
    ).map((r) => r.lessonId),
  )
  const lessons = orderedLessons(tree)
  // A lesson is unlocked when every lesson before it is done.
  const firstIncomplete = lessons.findIndex((l) => !done.has(l.id))
  const unlockedUpTo = firstIncomplete === -1 ? lessons.length - 1 : firstIncomplete
  const allDone = lessons.length > 0 && firstIncomplete === -1
  return { tree, enr, done, lessons, unlockedUpTo, allDone }
}

// ---------- my learning ----------

export async function getMyLearning(userId: string) {
  const lessonsPerCourse = db
    .select({ n: count() })
    .from(lesson)
    .innerJoin(topic, eq(lesson.topicId, topic.id))
    .innerJoin(module, eq(topic.moduleId, module.id))
    .where(eq(module.courseId, course.id))

  // Not db.batch: joined rows with duplicate column names shift in D1 batches (see CLAUDE.md).
  const enrolled = await db
    .select({
      enrollmentId: enrollment.id,
      courseId: course.id,
      title: course.title,
      description: course.description,
      passMark: course.passMark,
      status: enrollment.status,
      enrolledAt: enrollment.createdAt,
      totalLessons: sql<number>`(${lessonsPerCourse})`,
      completedLessons: sql<number>`(${db.select({ n: count() }).from(lessonProgress).where(eq(lessonProgress.enrollmentId, enrollment.id))})`,
      bestScore: sql<number | null>`(${db.select({ s: max(assessmentAttempt.score) }).from(assessmentAttempt).where(eq(assessmentAttempt.enrollmentId, enrollment.id))})`,
    })
    .from(enrollment)
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .where(eq(enrollment.userId, userId))
    .orderBy(desc(enrollment.createdAt))

  const enrolledIds = enrolled.map((e) => e.courseId)
  const available = await db
    .select({
      courseId: course.id,
      title: course.title,
      description: course.description,
      passMark: course.passMark,
      totalLessons: sql<number>`(${lessonsPerCourse})`,
    })
    .from(course)
    .where(and(eq(course.status, 'published'), enrolledIds.length ? notInArray(course.id, enrolledIds) : undefined))
    .orderBy(asc(course.title))

  return { enrolled, available }
}

export async function enrollSelf(userId: string, courseId: string) {
  const [c] = await db.select({ status: course.status }).from(course).where(eq(course.id, courseId))
  if (!c || c.status !== 'published') throw new Error('This course is not open for enrollment')
  return enroll(userId, courseId)
}

// ---------- course overview ----------

export async function getCourseForStudent(userId: string, courseId: string) {
  const { tree, enr, done, lessons, unlockedUpTo, allDone } = await loadProgress(userId, courseId)
  const index = new Map(lessons.map((l, i) => [l.id, i]))

  const [attempts] = await db
    .select({ n: count(), best: max(assessmentAttempt.score) })
    .from(assessmentAttempt)
    .where(eq(assessmentAttempt.enrollmentId, enr.id))

  const nextLesson = lessons.find((l) => !done.has(l.id))

  return {
    id: tree.id,
    title: tree.title,
    description: tree.description,
    passMark: tree.passMark,
    status: enr.status,
    totalLessons: lessons.length,
    completedLessons: lessons.filter((l) => done.has(l.id)).length,
    nextLessonId: nextLesson?.id ?? null,
    // Titles and lock state only: no lesson content, no answer key.
    modules: tree.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      topics: m.topics.map((t) => ({
        id: t.id,
        title: t.title,
        lessons: t.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          completed: done.has(l.id),
          locked: index.get(l.id)! > unlockedUpTo,
        })),
      })),
    })),
    assessment: tree.assessment
      ? {
          title: tree.assessment.title,
          questionCount: tree.assessment.questions.length,
          unlocked: allDone,
          attempts: attempts?.n ?? 0,
          bestScore: attempts?.best ?? null,
        }
      : null,
  }
}

// ---------- lessons ----------

export async function getLesson(userId: string, courseId: string, lessonId: string) {
  const { tree, done, lessons, unlockedUpTo } = await loadProgress(userId, courseId)
  const i = lessons.findIndex((l) => l.id === lessonId)
  if (i === -1) throw new Error('Lesson not found')
  if (i > unlockedUpTo) throw new Error('Finish the previous lessons first')

  const where = tree.modules.flatMap((m) =>
    m.topics.filter((t) => t.lessons.some((l) => l.id === lessonId)).map((t) => ({ module: m.title, topic: t.title })),
  )[0]

  return {
    id: lessons[i].id,
    title: lessons[i].title,
    content: lessons[i].content,
    courseTitle: tree.title,
    module: where?.module ?? '',
    topic: where?.topic ?? '',
    position: i + 1,
    total: lessons.length,
    completed: done.has(lessonId),
    prevId: i > 0 ? lessons[i - 1].id : null,
    nextId: i < lessons.length - 1 ? lessons[i + 1].id : null,
    hasAssessment: !!tree.assessment,
  }
}

/** Marks a lesson done. Returns where to go next: the next lesson id, or 'assessment' / 'course'. */
export async function completeLesson(userId: string, courseId: string, lessonId: string) {
  const { tree, enr, lessons, unlockedUpTo } = await loadProgress(userId, courseId)
  const i = lessons.findIndex((l) => l.id === lessonId)
  if (i === -1) throw new Error('Lesson not found')
  if (i > unlockedUpTo) throw new Error('Finish the previous lessons first')

  await db.insert(lessonProgress).values({ enrollmentId: enr.id, lessonId }).onConflictDoNothing()

  if (i < lessons.length - 1) return { next: lessons[i + 1].id }
  return { next: tree.assessment ? ('assessment' as const) : ('course' as const) }
}

// ---------- final assessment ----------

export async function getAssessmentForStudent(userId: string, courseId: string) {
  const { tree, allDone } = await loadProgress(userId, courseId)
  if (!tree.assessment) throw new Error('This course has no final assessment yet')
  if (!allDone) throw new Error('Finish all lessons to unlock the final assessment')

  return {
    title: tree.assessment.title,
    instructions: tree.assessment.instructions,
    passMark: tree.passMark,
    courseTitle: tree.title,
    // isCorrect is deliberately dropped.
    questions: tree.assessment.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  }
}

export async function submitAssessment(userId: string, courseId: string, answers: Record<string, string>) {
  const { tree, enr, allDone } = await loadProgress(userId, courseId)
  const a = tree.assessment
  if (!a || !a.questions.length) throw new Error('This course has no final assessment yet')
  if (!allDone) throw new Error('Finish all lessons to unlock the final assessment')

  const correctOption = new Map(a.questions.map((q) => [q.id, q.options.find((o) => o.isCorrect)?.id]))
  // Only keep answers to this assessment's questions.
  const clean = Object.fromEntries(Object.entries(answers).filter(([qid]) => correctOption.has(qid)))
  const correct = a.questions.filter((q) => clean[q.id] && clean[q.id] === correctOption.get(q.id)).length
  const total = a.questions.length
  const score = Math.round((correct / total) * 100)
  const passed = score >= tree.passMark

  await db.batch([
    db.insert(assessmentAttempt).values({ enrollmentId: enr.id, assessmentId: a.id, score, passed, answers: clean }),
    passed
      ? db.update(enrollment).set({ status: 'passed', completedAt: new Date() }).where(eq(enrollment.id, enr.id))
      : // A failed retake never undoes an earlier pass.
        db
          .update(enrollment)
          .set({ status: 'failed', completedAt: new Date() })
          .where(and(eq(enrollment.id, enr.id), inArray(enrollment.status, ['in_progress', 'failed']))),
  ])

  return { score, correct, total, passed, passMark: tree.passMark }
}
