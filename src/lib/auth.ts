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
  // Brute-force protection. Database storage so counters are shared across Worker instances.
  // `enabled: true` explicitly: Better Auth's "is production" detection doesn't see NODE_ENV on Workers,
  // so its default would leave this off in production. Built-in rules: 100 req / 10s per IP, and
  // stricter limits on sign-in / sign-up.
  rateLimit: { enabled: true, storage: 'database' },
  // Per-visitor limits need the real client IP; on Cloudflare that's cf-connecting-ip.
  // Without it every visitor shares one bucket and a few bad sign-ins lock everyone out.
  advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
  plugins: [
    // Every sign-up is a student (sign-up rejects a `role` field). Only admins create admins:
    // "Add user" with role Admin, or "Make admin" on a student. Bootstrap a fresh DB with scripts/make-admin.mjs.
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
