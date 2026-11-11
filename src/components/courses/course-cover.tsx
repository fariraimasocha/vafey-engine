import { cn, imageUrl } from '@/lib/utils'

/** Course cover: the uploaded R2 image, or the night tile with the course initial. Size it with className. */
export function CourseCover({
  title,
  imageKey,
  className,
}: {
  title: string
  imageKey?: string | null
  className?: string
}) {
  if (imageKey)
    return (
      <img
        src={imageUrl(imageKey)}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn('w-full bg-night object-cover', className)}
      />
    )
  return (
    <div aria-hidden className={cn('relative grid w-full place-items-center overflow-hidden bg-night', className)}>
      <span className="font-serif text-5xl text-cream">{title.charAt(0)}</span>
      <span className="absolute -right-10 -bottom-10 size-32 rounded-full border border-brand/40" />
    </div>
  )
}
