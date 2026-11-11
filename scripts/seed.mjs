// Import a course JSON through the admin import API.
// Usage: npm run seed -- [file=seed/computer-architecture.json] [baseUrl=$BETTER_AUTH_URL]
// Signs in with SEED_EMAIL/SEED_PASSWORD, falling back to TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD from .env.
import { readFile } from 'node:fs/promises'

process.loadEnvFile?.('.env')
const [file = 'seed/computer-architecture.json', baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'] =
  process.argv.slice(2)
const email = process.env.SEED_EMAIL ?? process.env.TEST_ADMIN_EMAIL
const password = process.env.SEED_PASSWORD ?? process.env.TEST_ADMIN_PASSWORD
if (!email || !password) throw new Error('Set SEED_EMAIL/SEED_PASSWORD or TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD in .env')

const headers = { 'Content-Type': 'application/json', Origin: baseUrl }

const signIn = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ email, password }),
})
if (!signIn.ok) throw new Error(`Sign-in failed: ${signIn.status} ${await signIn.text()}`)
const cookie = signIn.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')

const res = await fetch(`${baseUrl}/api/admin/courses/import`, {
  method: 'POST',
  headers: { ...headers, Cookie: cookie },
  body: await readFile(file, 'utf8'),
})
const body = await res.json()
if (!res.ok) {
  console.error(`Import failed (${res.status}):`, JSON.stringify(body, null, 2))
  process.exit(1)
}
console.log(`Imported ${file} → course ${body.id}`)
