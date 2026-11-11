// One final multiple-choice assessment per course.
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { course } from './courses'
import { id, timestamps } from './helpers'

export const assessment = sqliteTable('assessment', {
  id: id(),
  courseId: text('course_id')
    .notNull()
    .unique() // one per course
    .references(() => course.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  instructions: text('instructions'),
  ...timestamps,
})

export const question = sqliteTable(
  'question',
  {
    id: id(),
    assessmentId: text('assessment_id')
      .notNull()
      .references(() => assessment.id, { onDelete: 'cascade' }),
    prompt: text('prompt').notNull(),
    position: integer('position').notNull(),
    ...timestamps,
  },
  (t) => [index('question_assessment_idx').on(t.assessmentId, t.position)],
)

export const questionOption = sqliteTable(
  'question_option',
  {
    id: id(),
    questionId: text('question_id')
      .notNull()
      .references(() => question.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    isCorrect: integer('is_correct', { mode: 'boolean' }).notNull().default(false),
    position: integer('position').notNull(),
  },
  (t) => [index('option_question_idx').on(t.questionId, t.position)],
)
