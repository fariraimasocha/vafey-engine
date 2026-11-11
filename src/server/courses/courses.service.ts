// Server-only. Course tree: course → module → topic → lesson, plus one final MCQ assessment.
// D1 has no interactive transactions, so multi-row writes go through db.batch (atomic).
import { asc, count, eq, max, sql } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { db, schema } from '#/db'
import type { AssessmentInput, CourseImport } from './courses.schema'

const { course, module, topic, lesson, assessment, question, questionOption, enrollment } = schema

// ---------- reads ----------

export async function listCourses() {
  const lessonCount = db
    .select({ n: count() })
    .from(lesson)
    .innerJoin(topic, eq(lesson.topicId, topic.id))
    .innerJoin(module, eq(topic.moduleId, module.id))
    .where(eq(module.courseId, course.id))

  return db
    .select({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      imageKey: course.imageKey,
      passMark: course.passMark,
      status: course.status,
      updatedAt: course.updatedAt,
      modules: sql<number>`(${db.select({ n: count() }).from(module).where(eq(module.courseId, course.id))})`,
      lessons: sql<number>`(${lessonCount})`,
      enrollments: sql<number>`(${db.select({ n: count() }).from(enrollment).where(eq(enrollment.courseId, course.id))})`,
    })
    .from(course)
    .orderBy(asc(course.title))
}

export async function getCourseTree(id: string) {
  return db.query.course.findFirst({
    where: eq(course.id, id),
    with: {
      modules: {
        orderBy: (t, { asc }) => [asc(t.position)],
        with: {
          topics: {
            orderBy: (t, { asc }) => [asc(t.position)],
            with: { lessons: { orderBy: (t, { asc }) => [asc(t.position)] } },
          },
        },
      },
      assessment: {
        with: {
          questions: {
            orderBy: (t, { asc }) => [asc(t.position)],
            with: { options: { orderBy: (t, { asc }) => [asc(t.position)] } },
          },
        },
      },
    },
  })
}

export type CourseTree = NonNullable<Awaited<ReturnType<typeof getCourseTree>>>

// ---------- course ----------

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'course'
}

async function uniqueSlug(title: string) {
  const base = slugify(title)
  const taken = await db.select({ id: course.id }).from(course).where(eq(course.slug, base)).limit(1)
  return taken.length ? `${base}-${crypto.randomUUID().slice(0, 6)}` : base
}

export async function createCourse(input: { title: string; description?: string | null; passMark: number }) {
  const [row] = await db
    .insert(course)
    .values({ ...input, slug: await uniqueSlug(input.title) })
    .returning()
  return row
}

export async function updateCourse({ id, ...patch }: { id: string } & Partial<typeof course.$inferInsert>) {
  const [row] = await db.update(course).set(patch).where(eq(course.id, id)).returning()
  if (!row) throw new Error('Course not found')
  return row
}

export async function deleteCourse(id: string) {
  await db.delete(course).where(eq(course.id, id))
}

// ---------- modules / topics / lessons ----------

async function nextPosition(table: typeof module | typeof topic | typeof lesson, where: ReturnType<typeof eq>) {
  const [row] = await db.select({ p: max(table.position) }).from(table).where(where)
  return (row?.p ?? -1) + 1
}

export async function addModule(input: { courseId: string; title: string; description?: string | null }) {
  const position = await nextPosition(module, eq(module.courseId, input.courseId))
  const [row] = await db.insert(module).values({ ...input, position }).returning()
  return row
}

export async function addTopic(input: { moduleId: string; title: string; description?: string | null }) {
  const position = await nextPosition(topic, eq(topic.moduleId, input.moduleId))
  const [row] = await db.insert(topic).values({ ...input, position }).returning()
  return row
}

export async function addLesson(input: { topicId: string; title: string; content: string }) {
  const position = await nextPosition(lesson, eq(lesson.topicId, input.topicId))
  const [row] = await db.insert(lesson).values({ ...input, position }).returning()
  return row
}

export const nodeTables = { module, topic, lesson } as const
export type NodeKind = keyof typeof nodeTables

export async function updateNode(
  kind: NodeKind,
  { id, ...patch }: { id: string; title?: string; description?: string | null; content?: string },
) {
  const table = nodeTables[kind]
  // Only lessons have content; modules/topics have description.
  const values = kind === 'lesson' ? { title: patch.title, content: patch.content } : { title: patch.title, description: patch.description }
  const [row] = await db.update(table).set(values).where(eq(table.id, id)).returning()
  if (!row) throw new Error(`${kind} not found`)
  return row
}

export async function deleteNode(kind: NodeKind, id: string) {
  const table = nodeTables[kind]
  await db.delete(table).where(eq(table.id, id))
}

// ---------- assessment ----------

/** Builds the insert statements for an assessment's questions + options. */
function questionInserts(assessmentId: string, questions: AssessmentInput['questions']) {
  const stmts: BatchItem<'sqlite'>[] = []
  questions.forEach((q, qi) => {
    const questionId = crypto.randomUUID()
    stmts.push(db.insert(question).values({ id: questionId, assessmentId, prompt: q.prompt, position: qi }))
    stmts.push(
      db.insert(questionOption).values(q.options.map((o, oi) => ({ questionId, text: o.text, isCorrect: o.isCorrect, position: oi }))),
    )
  })
  return stmts
}

/** Creates or fully replaces the course's single final assessment. */
export async function saveAssessment({ courseId, title, instructions, questions }: AssessmentInput) {
  const [existing] = await db.select({ id: assessment.id }).from(assessment).where(eq(assessment.courseId, courseId))
  const assessmentId = existing?.id ?? crypto.randomUUID()

  await db.batch([
    existing
      ? db.update(assessment).set({ title, instructions }).where(eq(assessment.id, assessmentId))
      : db.insert(assessment).values({ id: assessmentId, courseId, title, instructions }),
    // Replace questions wholesale; options cascade.
    // ponytail: wholesale replace changes question ids, fine until attempts reference questions by id at scale.
    db.delete(question).where(eq(question.assessmentId, assessmentId)),
    ...questionInserts(assessmentId, questions),
  ])
  return { id: assessmentId }
}

// ---------- bulk import ----------

/** Creates a whole course tree atomically. Returns the new course id. */
export async function importCourse(input: CourseImport) {
  const courseId = crypto.randomUUID()
  const stmts: BatchItem<'sqlite'>[] = [
    db.insert(course).values({
      id: courseId,
      title: input.title,
      slug: await uniqueSlug(input.title),
      description: input.description,
      passMark: input.passMark,
      status: input.status,
    }),
  ]

  input.modules.forEach((m, mi) => {
    const moduleId = crypto.randomUUID()
    stmts.push(db.insert(module).values({ id: moduleId, courseId, title: m.title, description: m.description, position: mi }))
    m.topics.forEach((t, ti) => {
      const topicId = crypto.randomUUID()
      stmts.push(db.insert(topic).values({ id: topicId, moduleId, title: t.title, description: t.description, position: ti }))
      if (t.lessons.length)
        stmts.push(db.insert(lesson).values(t.lessons.map((l, li) => ({ topicId, title: l.title, content: l.content, position: li }))))
    })
  })

  if (input.assessment) {
    const assessmentId = crypto.randomUUID()
    stmts.push(
      db.insert(assessment).values({
        id: assessmentId,
        courseId,
        title: input.assessment.title,
        instructions: input.assessment.instructions,
      }),
      ...questionInserts(assessmentId, input.assessment.questions),
    )
  }

  await db.batch(stmts as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])
  return { id: courseId }
}
