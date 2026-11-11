// Server-only helpers. Only import inside server function handlers, never from routes/components.
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

/** Throws unless the caller is a signed-in admin. Call first in every admin server function. */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) throw new Error('Unauthorized')
  if (session.user.role !== 'admin') throw new Error('Forbidden')
  return session
}

/** Throws unless the caller is signed in (any role). Use in student-facing server functions. */
export async function requireUser() {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) throw new Error('Unauthorized')
  return session
}
