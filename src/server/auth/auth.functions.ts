import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

/**
 * Current user (or null). Callable from route loaders/beforeLoad on both server and client.
 * Returns only what the UI needs: never the session token, which must stay in its httpOnly cookie.
 */
export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) return null
  const { id, name, email, image, role } = session.user
  return { user: { id, name, email, image: image ?? null, role } }
})
