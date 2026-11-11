// Promote an existing account to admin. Only needed to bootstrap the first admin of a fresh database;
// after that, admins promote people from the dashboard ("Make admin" / "Add user").
//
// Usage:
//   npm run make-admin -- someone@example.com            # live D1 (uses CLOUDFLARE_* from .env)
//   npm run make-admin -- someone@example.com --local    # local dev database
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

process.loadEnvFile?.('.env')
const email = process.argv[2]?.toLowerCase()
const local = process.argv.includes('--local')
if (!email || !email.includes('@')) {
  console.error('Usage: npm run make-admin -- <email> [--local]')
  process.exit(1)
}

const SQL = "UPDATE user SET role = 'admin', updated_at = ? WHERE lower(email) = ?"
const params = [Date.now(), email]

let changed
if (local) {
  const { DatabaseSync } = await import('node:sqlite')
  const dir = '.cloudflare/state/v3/d1/miniflare-D1DatabaseObject'
  const file = readdirSync(dir).find((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
  if (!file) throw new Error(`No local database in ${dir}; run npm run dev and db:migrate:local first`)
  changed = new DatabaseSync(join(dir, file)).prepare(SQL).run(...params).changes
} else {
  const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_DATABASE_ID: database, CLOUDFLARE_D1_TOKEN: token } = process.env
  if (!account || !database || !token) throw new Error('Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID and CLOUDFLARE_D1_TOKEN in .env')
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: SQL, params }),
  })
  const body = await res.json()
  if (!body.success) throw new Error(`D1 query failed: ${JSON.stringify(body.errors)}`)
  changed = body.result[0].meta.changes
}

if (!changed) {
  console.error(`No account with email ${email}. They need to sign up first.`)
  process.exit(1)
}
console.log(`${email} is now an admin${local ? ' (local)' : ''}. They may need to sign out and back in.`)
