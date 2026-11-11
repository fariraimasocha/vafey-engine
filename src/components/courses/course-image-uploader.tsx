import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { CourseCover } from '@/components/courses/course-cover'
import { Spiral } from '@/components/loading-ui/spiral'
import { Button } from '@/components/ui/button'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const MAX_BYTES = 5 * 1024 * 1024

/** Upload / replace / remove a course's cover image (stored in R2 via /api/admin/courses/:id/image). */
export function CourseImageUploader({ courseId, title, imageKey }: { courseId: string; title: string; imageKey: string | null }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()
  const endpoint = `/api/admin/courses/${courseId}/image`

  async function send(init: RequestInit, success: string) {
    setBusy(true)
    try {
      const res = await fetch(endpoint, init)
      if (!res.ok) throw new Error(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? 'Upload failed')
      await Promise.all(['courses', 'learn', 'users'].map((k) => queryClient.invalidateQueries({ queryKey: [k] })))
      toast.success(success)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  function onPick(file: File | undefined) {
    if (!file) return
    // Quick client-side checks for a fast message; the server re-checks the actual bytes.
    if (!ACCEPT.split(',').includes(file.type)) return void toast.error('Use a PNG, JPEG or WebP image')
    if (file.size > MAX_BYTES) return void toast.error('Image must be 5 MB or smaller')
    const body = new FormData()
    body.append('file', file)
    send({ method: 'POST', body }, imageKey ? 'Cover replaced' : 'Cover uploaded')
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-line">
      <CourseCover title={title} imageKey={imageKey} className="aspect-[3/1] max-h-64" />
      {busy && (
        <div className="absolute inset-0 grid place-items-center bg-night/50 text-cream">
          <Spiral className="size-8" />
        </div>
      )}
      <div className="absolute right-3 bottom-3 flex gap-2">
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          aria-label="Course cover image"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <Button size="sm" variant="secondary" disabled={busy} className="bg-white/90 text-ink backdrop-blur hover:bg-white" onClick={() => input.current?.click()}>
          {imageKey ? 'Replace cover' : 'Upload cover'}
        </Button>
        {imageKey && (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            className="bg-white/90 text-ink-soft backdrop-blur hover:bg-white hover:text-destructive"
            onClick={() => send({ method: 'DELETE' }, 'Cover removed')}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}
