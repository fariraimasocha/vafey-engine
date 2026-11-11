import { z } from 'zod'

const title = z.string().trim().min(1, 'Title is required').max(200)
const optionalText = z.string().trim().max(5000).nullish()
const id = z.string().min(1)

export const courseInput = z.object({
  title,
  description: optionalText,
  passMark: z.number().int().min(0).max(100).default(60),
})

export const courseUpdate = courseInput.partial().extend({
  id,
  status: z.enum(['draft', 'published']).optional(),
})

export const moduleInput = z.object({ courseId: id, title, description: optionalText })
export const topicInput = z.object({ moduleId: id, title, description: optionalText })
export const lessonInput = z.object({ topicId: id, title, content: z.string().max(100_000).default('') })

/** Rename/edit any node in the tree. */
export const nodeUpdate = z.object({
  id,
  title: title.optional(),
  description: optionalText,
  content: z.string().max(100_000).optional(),
})

export const nodeRef = z.object({ id })

export const questionInput = z
  .object({
    prompt: z.string().trim().min(1, 'Question prompt is required').max(2000),
    options: z
      .array(z.object({ text: z.string().trim().min(1).max(500), isCorrect: z.boolean() }))
      .min(2, 'Each question needs at least 2 options')
      .max(8),
  })
  .refine((q) => q.options.filter((o) => o.isCorrect).length === 1, {
    message: 'Each question needs exactly one correct option',
  })

export const assessmentInput = z.object({
  courseId: id,
  title,
  instructions: optionalText,
  questions: z.array(questionInput).max(200),
})

/** Whole course tree in one payload, used for bulk import / seeding. */
export const courseImport = courseInput.extend({
  status: z.enum(['draft', 'published']).default('draft'),
  modules: z.array(
    z.object({
      title,
      description: optionalText,
      topics: z.array(
        z.object({
          title,
          description: optionalText,
          lessons: z.array(z.object({ title, content: z.string().max(100_000) })),
        }),
      ),
    }),
  ),
  assessment: assessmentInput.omit({ courseId: true }).optional(),
})

export type CourseImport = z.infer<typeof courseImport>
export type AssessmentInput = z.infer<typeof assessmentInput>
