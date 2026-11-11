// Server-only Better Auth instance.
import { env } from 'cloudflare:workers'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins/admin'
import { adminAc, userAc } from 'better-auth/plugins/admin/access'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db, schema } from '#/db'

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true },
  databaseHooks: {
    user: {
      create: {
        // Bootstrap: the very first account becomes admin. After that, sign-ups are students
        // (the admin plugin strips `role` from sign-up input) and admins can pick a role when creating users.
        // ponytail: count-then-insert can race if two people sign up in the same instant on an empty DB.
        before: async (user) => {
          const first = await db.select({ id: schema.user.id }).from(schema.user).limit(1)
          return { data: { ...user, role: first.length ? (user.role ?? 'student') : 'admin' } }
        },
      },
    },
  },
  plugins: [
    // User management: create, set role, ban, set password, revoke sessions, remove.
    admin({
      defaultRole: 'student',
      adminRoles: ['admin'],
      roles: { admin: adminAc, student: userAc },
      bannedUserMessage: 'Your account is suspended. Please contact your course administrator.',
    }),
    tanstackStartCookies(), // must stay last
  ],
})

export type Session = typeof auth.$Infer.Session
