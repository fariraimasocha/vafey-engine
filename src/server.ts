// Worker entrypoint: TanStack Start's handler plus security headers on every response.
import handler from '@tanstack/react-start/server-entry'

const CSP = [
  "default-src 'self'",
  // TanStack Start's SSR hydration emits inline scripts, so 'unsafe-inline' is required here.
  // ponytail: tighten to nonces if TanStack Start exposes them for its inline scripts.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Vite HMR needs a websocket in dev only.
  import.meta.env.DEV ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
}

export default {
  async fetch(request: Request, ...rest: unknown[]) {
    const response = await handler.fetch(request, ...(rest as []))
    // Re-wrap: some responses (redirects, fetch passthroughs) have immutable headers.
    const secured = new Response(response.body, response)
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      if (!secured.headers.has(name)) secured.headers.set(name, value)
    }
    return secured
  },
}
