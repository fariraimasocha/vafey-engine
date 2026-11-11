import { z } from 'zod'

const id = z.string().min(1)
export const role = z.enum(['student', 'admin'])

export const userListInput = z.object({
  search: z.string().trim().max(200).optional(),
  role: z.enum(['student', 'admin', 'all']).default('student'),
})

export const userRef = z.object({ userId: id })

export const createUserInput = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: z.email('Enter a valid email').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: role.default('student'),
})

export const setRoleInput = z.object({ userId: id, role })
export const banInput = z.object({ userId: id, reason: z.string().trim().max(500).optional() })
export const setPasswordInput = z.object({ userId: id, newPassword: createUserInput.shape.password })

export const enrollInput = z.object({ userId: id, courseId: id })
export const enrollmentRef = z.object({ enrollmentId: id })
export const enrollmentStatusInput = z.object({
  enrollmentId: id,
  status: z.enum(['in_progress', 'passed', 'failed']),
})
