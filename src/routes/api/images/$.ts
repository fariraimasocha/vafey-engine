// GET /api/images/<key>: public, read-only access to course images in R2.
// Keys are unique per upload, so responses can be cached forever.
import { createFileRoute } from '@tanstack/react-router'
import { IMAGE_PREFIX, getObject } from '#/lib/r2'

export const Route = createFileRoute('/api/images/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat ?? ''
        // Only course images; never arbitrary bucket paths.
        if (!key.startsWith(IMAGE_PREFIX) || key.includes('..')) return new Response('Not found', { status: 404 })
        const object = await getObject(key)
        if (!object) return new Response('Not found', { status: 404 })
        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
            ETag: object.httpEtag,
          },
        })
      },
    },
  },
})
