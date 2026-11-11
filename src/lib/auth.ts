// Server-only Better Auth instance.
import { env } from 'cloudflare:workers'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db, schema } from '#/db'

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      // input: false → users can't set their own role at sign-up
      role: { type: 'string', defaultValue: 'student', input: false },
    },
  },
  plugins: [tanstackStartCookies()], // must stay last
})

export type Session = typeof auth.$Infer.Session
