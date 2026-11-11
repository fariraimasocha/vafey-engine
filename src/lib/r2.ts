// Server-only. Course images in the R2 bucket (binding `env.BUCKET`).
import { env } from 'cloudflare:workers'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_PREFIX = 'courses/'

/**
 * Detect the real image type from the file's first bytes. The browser-supplied MIME type is
 * not trusted. SVG is never accepted: it can carry scripts.
 */
export function sniffImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const b = bytes
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: 'image/png', ext: 'png' }
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' }
  return null
}

/** Stores an image under a fresh key (so it can be cached forever) and returns the key. */
export async function putCourseImage(courseId: string, bytes: Uint8Array, type: { mime: string; ext: string }) {
  const key = `${IMAGE_PREFIX}${courseId}/${crypto.randomUUID()}.${type.ext}`
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: type.mime } })
  return key
}

export async function deleteObject(key: string | null | undefined) {
  if (key) await env.BUCKET.delete(key)
}

export function getObject(key: string) {
  return env.BUCKET.get(key)
}
