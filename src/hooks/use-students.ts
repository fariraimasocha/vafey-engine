import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import * as fns from '#/server/students/students.functions'
import { useAdminMutation } from './use-admin-mutation'

export type RoleFilter = 'student' | 'admin' | 'all'

export const usersQuery = (filter: { search?: string; role: RoleFilter }) =>
  queryOptions({
    queryKey: ['users', 'list', filter],
    queryFn: () => fns.fetchUsers({ data: filter }),
  })

export const userQuery = (userId: string) =>
  queryOptions({
    queryKey: ['users', userId],
    queryFn: () => fns.fetchUser({ data: { userId } }),
  })

export const useUsers = (filter: { search?: string; role: RoleFilter }) => useSuspenseQuery(usersQuery(filter))
export const useUser = (userId: string) => useSuspenseQuery(userQuery(userId))

export const useStudentMutation = <TInput, TResult>(
  fn: (opts: { data: TInput }) => Promise<TResult>,
  opts: { success?: string } = {},
) => useAdminMutation(fn, { invalidate: [['users'], ['courses']], ...opts })

export const studentFns = fns
