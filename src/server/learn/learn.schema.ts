import { z } from 'zod'

const id = z.string().min(1).max(100)

export const courseRef = z.object({ courseId: id })
export const lessonRef = z.object({ courseId: id, lessonId: id })
export const submitInput = z.object({
  courseId: id,
  answers: z.record(id, id), // questionId → optionId; unanswered questions count as wrong
})
