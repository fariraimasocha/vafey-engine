// POST   /api/admin/courses/:courseId/image  (multipart form, field "file") → { imageKey }
// DELETE /api/admin/courses/:courseId/image  → removes the cover
// Admin session required.
import { createFileRoute } from '@tanstack/react-router'
import { auth } from '#/lib/auth'
import { removeCourseImage, setCourseImage } from '#/server/courses/courses.service'

async function adminOnly(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

const fail = (e: unknown) => Response.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 400 })

export const Route = createFileRoute('/api/admin/courses/$courseId/image')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const denied = await adminOnly(request)
        if (denied) return denied
        const form = await request.formData().catch(() => null)
        const file = form?.get('file')
        if (!(file instanceof File)) return Response.json({ error: 'Attach an image in the "file" field' }, { status: 400 })
        try {
          return Response.json({ imageKey: await setCourseImage(params.courseId, file) })
        } catch (e) {
          return fail(e)
        }
      },
      DELETE: async ({ request, params }) => {
        const denied = await adminOnly(request)
        if (denied) return denied
        try {
          await removeCourseImage(params.courseId)
          return new Response(null, { status: 204 })
        } catch (e) {
          return fail(e)
        }
      },
    },
  },
})
