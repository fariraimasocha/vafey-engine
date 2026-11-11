// Student-facing RPC. Every handler calls requireUser() and uses the session's user id, never one from the client.
import { createServerFn } from '@tanstack/react-start'
import { requireUser } from '#/server/auth/auth.service'
import { courseRef, lessonRef, submitInput } from './learn.schema'
import * as learn from './learn.service'

export const fetchMyLearning = createServerFn({ method: 'GET' }).handler(async () => {
  const { user } = await requireUser()
  return learn.getMyLearning(user.id)
})

export const enrollInCourse = createServerFn({ method: 'POST' })
  .validator(courseRef)
  .handler(async ({ data }) => {
    const { user } = await requireUser()
    await learn.enrollSelf(user.id, data.courseId)
  })

export const fetchLearnCourse = createServerFn({ method: 'GET' })
  .validator(courseRef)
  .handler(async ({ data }) => {
    const { user } = await requireUser()
    return learn.getCourseForStudent(user.id, data.courseId)
  })

export const fetchLesson = createServerFn({ method: 'GET' })
  .validator(lessonRef)
  .handler(async ({ data }) => {
    const { user } = await requireUser()
    return learn.getLesson(user.id, data.courseId, data.lessonId)
  })

export const completeLesson = createServerFn({ method: 'POST' })
  .validator(lessonRef)
  .handler(async ({ data }) => {
    const { user } = await requireUser()
    return learn.completeLesson(user.id, data.courseId, data.lessonId)
  })

export const fetchAssessment = createServerFn({ method: 'GET' })
  .validator(courseRef)
  .handler(async ({ data }) => {
    const { user } = await requireUser()
    return learn.getAssessmentForStudent(user.id, data.courseId)
  })

export const submitAssessment = createServerFn({ method: 'POST' })
  .validator(submitInput)
  .handler(async ({ data }) => {
    const { user } = await requireUser()
    return learn.submitAssessment(user.id, data.courseId, data.answers)
  })
