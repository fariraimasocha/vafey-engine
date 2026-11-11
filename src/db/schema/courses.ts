// Content hierarchy: course → module → topic → lesson. `position` orders siblings.
import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { id, timestamps } from './helpers'

export const courseStatuses = ['draft', 'published'] as const

export const course = sqliteTable(
  'course',
  {
    id: id(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    imageKey: text('image_key'), // R2 object key
    passMark: integer('pass_mark').notNull().default(60), // percentage, editable per course
    status: text('status', { enum: courseStatuses }).notNull().default('draft'),
    ...timestamps,
  },
  (t) => [check('pass_mark_range', sql`${t.passMark} BETWEEN 0 AND 100`)],
)

export const module = sqliteTable(
  'module',
  {
    id: id(),
    courseId: text('course_id')
      .notNull()
      .references(() => course.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    position: integer('position').notNull(),
    ...timestamps,
  },
  (t) => [index('module_course_idx').on(t.courseId, t.position)],
)

export const topic = sqliteTable(
  'topic',
  {
    id: id(),
    moduleId: text('module_id')
      .notNull()
      .references(() => module.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    position: integer('position').notNull(),
    ...timestamps,
  },
  (t) => [index('topic_module_idx').on(t.moduleId, t.position)],
)

export const lesson = sqliteTable(
  'lesson',
  {
    id: id(),
    topicId: text('topic_id')
      .notNull()
      .references(() => topic.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull().default(''), // markdown
    position: integer('position').notNull(),
    ...timestamps,
  },
  (t) => [index('lesson_topic_idx').on(t.topicId, t.position)],
)
