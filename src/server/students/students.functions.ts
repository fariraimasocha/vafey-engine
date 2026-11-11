// Admin-only RPC for managing users and their enrollments. Every handler calls requireAdmin() first.
import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '#/server/auth/auth.service'
import * as enrollments from '#/server/enrollments/enrollments.service'
import * as students from './students.service'
import {
  banInput,
  createUserInput,
  enrollInput,
  enrollmentRef,
  enrollmentStatusInput,
  setPasswordInput,
  setRoleInput,
  userListInput,
  userRef,
} from './students.schema'

export const fetchUsers = createServerFn({ method: 'GET' })
  .validator(userListInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    return students.listUsers(data)
  })

export const fetchUser = createServerFn({ method: 'GET' })
  .validator(userRef)
  .handler(async ({ data }) => {
    await requireAdmin()
    return students.getUserDetail(data.userId)
  })

export const createUser = createServerFn({ method: 'POST' })
  .validator(createUserInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    return students.createUser(data)
  })

export const setUserRole = createServerFn({ method: 'POST' })
  .validator(setRoleInput)
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    await students.setRole(session.user.id, data.userId, data.role)
  })

export const banUser = createServerFn({ method: 'POST' })
  .validator(banInput)
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    await students.banUser(session.user.id, data.userId, data.reason)
  })

export const unbanUser = createServerFn({ method: 'POST' })
  .validator(userRef)
  .handler(async ({ data }) => {
    await requireAdmin()
    await students.unbanUser(data.userId)
  })

export const setUserPassword = createServerFn({ method: 'POST' })
  .validator(setPasswordInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    await students.setPassword(data.userId, data.newPassword)
  })

export const removeUser = createServerFn({ method: 'POST' })
  .validator(userRef)
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    await students.removeUser(session.user.id, data.userId)
  })

export const enrollUser = createServerFn({ method: 'POST' })
  .validator(enrollInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    return enrollments.enroll(data.userId, data.courseId)
  })

export const setEnrollmentStatus = createServerFn({ method: 'POST' })
  .validator(enrollmentStatusInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    return enrollments.setEnrollmentStatus(data.enrollmentId, data.status)
  })

export const resetEnrollment = createServerFn({ method: 'POST' })
  .validator(enrollmentRef)
  .handler(async ({ data }) => {
    await requireAdmin()
    await enrollments.resetEnrollment(data.enrollmentId)
  })

export const unenroll = createServerFn({ method: 'POST' })
  .validator(enrollmentRef)
  .handler(async ({ data }) => {
    await requireAdmin()
    await enrollments.unenroll(data.enrollmentId)
  })
