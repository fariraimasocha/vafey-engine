import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import * as fns from '#/server/learn/learn.functions'
import { useAdminMutation } from './use-admin-mutation'

export const myLearningQuery = queryOptions({ queryKey: ['learn'], queryFn: () => fns.fetchMyLearning() })

export const learnCourseQuery = (courseId: string) =>
  queryOptions({ queryKey: ['learn', courseId], queryFn: () => fns.fetchLearnCourse({ data: { courseId } }) })

export const lessonQuery = (courseId: string, lessonId: string) =>
  queryOptions({
    queryKey: ['learn', courseId, 'lesson', lessonId],
    queryFn: () => fns.fetchLesson({ data: { courseId, lessonId } }),
  })

export const assessmentQuery = (courseId: string) =>
  queryOptions({
    queryKey: ['learn', courseId, 'assessment'],
    queryFn: () => fns.fetchAssessment({ data: { courseId } }),
    staleTime: 0,
  })

export const useMyLearning = () => useSuspenseQuery(myLearningQuery)
export const useLearnCourse = (courseId: string) => useSuspenseQuery(learnCourseQuery(courseId))
export const useLesson = (courseId: string, lessonId: string) => useSuspenseQuery(lessonQuery(courseId, lessonId))
export const useAssessment = (courseId: string) => useSuspenseQuery(assessmentQuery(courseId))

/** Student writes. Refreshes their learning data (and admin views, if an admin is previewing). */
export const useLearnMutation = <TInput, TResult>(
  fn: (opts: { data: TInput }) => Promise<TResult>,
  opts: { success?: string } = {},
) => useAdminMutation(fn, { invalidate: [['learn'], ['users']], ...opts })

export const learnFns = fns
