import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { CourseCover } from '@/components/courses/course-cover'
import { CourseFormDialog } from '@/components/courses/course-form-dialog'
import { PhBookOpen } from '@/components/icons/ph/book-open'
import { PhDotsThree } from '@/components/icons/ph/dots-three'
import { PhPencilSimple } from '@/components/icons/ph/pencil-simple'
import { PhPlus } from '@/components/icons/ph/plus'
import { PhTrash } from '@/components/icons/ph/trash'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spiral } from '@/components/loading-ui/spiral'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MinimalCard, MinimalCardDescription, MinimalCardTitle } from '@/components/ui/minimal-card'
import { courseFns, coursesQuery, useCourseMutation, useCourses } from '@/hooks/use-courses'

type CourseListItem = ReturnType<typeof useCourses>['data'][number]

export const Route = createFileRoute('/_dashboard/courses/')({
  staticData: { title: 'Courses' },
  loader: ({ context }) => context.queryClient.prefetchQuery(coursesQuery),
  component: CoursesPage,
})

function CoursesPage() {
  const navigate = useNavigate()
  const create = useCourseMutation(courseFns.createCourse, { success: 'Course created' })

  return (
    <div className="mx-auto max-w-6xl py-4 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl font-medium tracking-tight text-ink">
            your <em className="text-brand">courses</em>
          </h1>
          <p className="mt-2 text-ink-soft">Each course runs module → topic → lesson, then one final assessment.</p>
        </div>
        <CourseFormDialog
          title="New course"
          submitLabel="Create course"
          trigger={
            <Button className="h-10 gap-2">
              <PhPlus className="size-4" /> New course
            </Button>
          }
          onSubmit={async (values) => {
            const course = await create.mutateAsync(values)
            await navigate({ to: '/courses/$courseId', params: { courseId: course.id } })
          }}
        />
      </div>

      <Suspense fallback={<Spiral className="mx-auto mt-16 block size-8 text-ink-faint" />}>
        <CourseGrid />
      </Suspense>
    </div>
  )
}

function CourseGrid() {
  const { data: courses } = useCourses()

  if (!courses.length)
    return (
      <div className="mt-10 rounded-lg border border-dashed border-line bg-paper p-10 text-center">
        <p className="font-serif text-2xl text-ink">no courses yet</p>
        <p className="mt-1 text-sm text-ink-soft">Create your first course to get started.</p>
      </div>
    )

  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <div key={c.id} className="relative">
          <CourseCardMenu course={c} />
          <Link
            to="/courses/$courseId"
            params={{ courseId: c.id }}
            className="block h-full rounded-[24px] focus-visible:outline-2"
          >
            <MinimalCard className="h-full bg-paper-soft hover:bg-paper">
              <CourseCover title={c.title} imageKey={c.imageKey} className="mb-4 h-36 rounded-[18px]" />
              <div className="flex items-center gap-2 px-1">
                <Badge
                  variant="outline"
                  className={
                    c.status === 'published'
                      ? 'border-success/30 bg-success-soft text-success'
                      : 'border-line text-ink-soft'
                  }
                >
                  {c.status}
                </Badge>
                <span className="text-xs text-ink-faint">Pass mark {c.passMark}%</span>
              </div>
              <MinimalCardTitle className="text-ink">{c.title}</MinimalCardTitle>
              <MinimalCardDescription className="mb-2 line-clamp-2 pb-0 text-ink-soft">
                {c.description}
              </MinimalCardDescription>
              <p className="px-1 pb-2 text-xs text-ink-faint">
                {c.modules} modules · {c.lessons} lessons · {c.enrollments} enrolled
              </p>
            </MinimalCard>
          </Link>
        </div>
      ))}
    </div>
  )
}

/** Edit / delete without opening the builder. Sits above the card link. */
function CourseCardMenu({ course }: { course: CourseListItem }) {
  const [editing, setEditing] = useState(false)
  const update = useCourseMutation(courseFns.updateCourse, { success: 'Course updated' })
  const remove = useCourseMutation(courseFns.deleteCourse, { success: 'Course deleted' })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${course.title}`}
            className="absolute top-4 right-4 z-10 size-8 rounded-full bg-night/60 text-cream backdrop-blur hover:bg-night hover:text-cream"
          >
            <PhDotsThree className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to="/courses/$courseId" params={{ courseId: course.id }}>
              <PhBookOpen className="size-4" /> Open builder
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <PhPencilSimple className="size-4" /> Edit details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              if (confirm(`Delete "${course.title}" with all its content and enrolments? This can't be undone.`))
                remove.mutate({ id: course.id })
            }}
          >
            <PhTrash className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CourseFormDialog
        open={editing}
        onOpenChange={setEditing}
        title="Course details"
        submitLabel="Save"
        initial={course}
        onSubmit={(v) => update.mutateAsync({ id: course.id, ...v })}
      />
    </>
  )
}
