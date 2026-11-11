// POST /api/admin/courses/import — create a whole course tree from JSON (admin session required).
import { createFileRoute } from '@tanstack/react-router'
import { auth } from '#/lib/auth'
import { courseImport } from '#/server/courses/courses.schema'
import { importCourse } from '#/server/courses/courses.service'

export const Route = createFileRoute('/api/admin/courses/import')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        if (session.user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

        const parsed = courseImport.safeParse(await request.json().catch(() => null))
        if (!parsed.success) return Response.json({ error: 'Invalid course', issues: parsed.error.issues }, { status: 400 })

        return Response.json(await importCourse(parsed.data), { status: 201 })
      },
    },
  },
})
