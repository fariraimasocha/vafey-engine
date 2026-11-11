// Admin-only RPC for the course builder. Every handler calls requireAdmin() first.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from '#/server/auth/auth.service'
import * as courses from './courses.service'
import {
  assessmentInput,
  courseInput,
  courseUpdate,
  lessonInput,
  moduleInput,
  nodeRef,
  nodeUpdate,
  topicInput,
} from './courses.schema'

const kind = z.enum(['module', 'topic', 'lesson'])

export const fetchCourses = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()
  return courses.listCourses()
})

export const fetchCourse = createServerFn({ method: 'GET' })
  .validator(nodeRef)
  .handler(async ({ data }) => {
    await requireAdmin()
    const tree = await courses.getCourseTree(data.id)
    if (!tree) throw new Error('Course not found')
    return tree
  })

export const createCourse = createServerFn({ method: 'POST' })
  .validator(courseInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    return courses.createCourse(data)
  })

export const updateCourse = createServerFn({ method: 'POST' })
  .validator(courseUpdate)
  .handler(async ({ data }) => {
    await requireAdmin()
    return courses.updateCourse(data)
  })

export const deleteCourse = createServerFn({ method: 'POST' })
  .validator(nodeRef)
  .handler(async ({ data }) => {
    await requireAdmin()
    await courses.deleteCourse(data.id)
  })

export const addModule = createServerFn({ method: 'POST' })
  .validator(moduleInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    return courses.addModule(data)
  })

export const addTopic = createServerFn({ method: 'POST' })
  .validator(topicInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    return courses.addTopic(data)
  })

export const addLesson = createServerFn({ method: 'POST' })
  .validator(lessonInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    return courses.addLesson(data)
  })

export const updateNode = createServerFn({ method: 'POST' })
  .validator(nodeUpdate.extend({ kind }))
  .handler(async ({ data: { kind, ...patch } }) => {
    await requireAdmin()
    return courses.updateNode(kind, patch)
  })

export const deleteNode = createServerFn({ method: 'POST' })
  .validator(nodeRef.extend({ kind }))
  .handler(async ({ data }) => {
    await requireAdmin()
    await courses.deleteNode(data.kind, data.id)
  })

export const saveAssessment = createServerFn({ method: 'POST' })
  .validator(assessmentInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    return courses.saveAssessment(data)
  })
