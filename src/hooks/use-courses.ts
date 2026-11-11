import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { useAdminMutation } from './use-admin-mutation'
import * as fns from '#/server/courses/courses.functions'

export const coursesQuery = queryOptions({
  queryKey: ['courses'],
  queryFn: () => fns.fetchCourses(),
})

export const courseQuery = (id: string) =>
  queryOptions({
    queryKey: ['courses', id],
    queryFn: () => fns.fetchCourse({ data: { id } }),
  })

export const useCourses = () => useSuspenseQuery(coursesQuery)
export const useCourse = (id: string) => useSuspenseQuery(courseQuery(id))

export const useCourseMutation = <TInput, TResult>(
  fn: (opts: { data: TInput }) => Promise<TResult>,
  opts: { success?: string } = {},
) => useAdminMutation(fn, { invalidate: [['courses'], ['users']], ...opts })

export const courseFns = fns
