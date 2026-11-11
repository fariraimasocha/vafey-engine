import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense } from 'react'
import { AssessmentEditor } from '@/components/courses/assessment-editor'
import { ContentTree } from '@/components/courses/content-tree'
import { CourseFormDialog } from '@/components/courses/course-form-dialog'
import { CourseImageUploader } from '@/components/courses/course-image-uploader'
import { PhArrowLeft } from '@/components/icons/ph/arrow-left'
import { Spiral } from '@/components/loading-ui/spiral'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { courseFns, courseQuery, useCourse, useCourseMutation } from '@/hooks/use-courses'

export const Route = createFileRoute('/_dashboard/courses/$courseId')({
  staticData: { title: 'Course builder' },
  loader: ({ context, params }) => context.queryClient.prefetchQuery(courseQuery(params.courseId)),
  component: CoursePage,
})

function CoursePage() {
  return (
    <Suspense fallback={<Spiral className="mx-auto mt-16 block size-8 text-ink-faint" />}>
      <CourseBuilder />
    </Suspense>
  )
}

function CourseBuilder() {
  const { courseId } = Route.useParams()
  const navigate = useNavigate()
  const { data: course } = useCourse(courseId)
  const update = useCourseMutation(courseFns.updateCourse, { success: 'Course updated' })
  const remove = useCourseMutation(courseFns.deleteCourse, { success: 'Course deleted' })

  const lessons = course.modules.flatMap((m) => m.topics.flatMap((t) => t.lessons)).length
  const questions = course.assessment?.questions.length ?? 0
  const published = course.status === 'published'
  // A course is publishable once it has lessons and a final assessment.
  const canPublish = lessons > 0 && questions > 0

  return (
    <div className="mx-auto max-w-4xl py-2 sm:py-6">
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <PhArrowLeft className="size-4" /> All courses
      </Link>

      <div className="mt-4">
        <CourseImageUploader courseId={course.id} title={course.title} imageKey={course.imageKey} />
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={published ? 'border-success/30 bg-success-soft text-success' : 'border-line text-ink-soft'}
            >
              {course.status}
            </Badge>
            <span className="text-sm text-ink-faint">Pass mark {course.passMark}%</span>
          </div>
          <h1 className="mt-2 font-serif text-5xl font-medium tracking-tight text-ink">{course.title}</h1>
          {course.description && <p className="mt-2 max-w-2xl text-ink-soft">{course.description}</p>}
          <p className="mt-3 text-sm text-ink-faint">
            {course.modules.length} modules · {lessons} lessons · {questions} assessment questions
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <CourseFormDialog
            title="Course details"
            submitLabel="Save"
            initial={course}
            onSubmit={(v) => update.mutateAsync({ id: course.id, ...v })}
            trigger={
              <Button variant="outline" className="border-line">
                Edit details
              </Button>
            }
          />
          <Button
            disabled={update.isPending || (!published && !canPublish)}
            title={!published && !canPublish ? 'Add lessons and a final assessment first' : undefined}
            onClick={() => update.mutate({ id: course.id, status: published ? 'draft' : 'published' })}
          >
            {published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button
            variant="ghost"
            className="text-ink-soft hover:text-destructive"
            onClick={async () => {
              if (!confirm(`Delete "${course.title}" with all its content and enrolments? This can't be undone.`)) return
              // Leave first: refreshing this page's (now deleted) course after the delete would fail and retry.
              await navigate({ to: '/courses' })
              remove.mutate({ id: course.id })
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="mt-8">
        <TabsList className="bg-paper">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="assessment">Final assessment</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="mt-5">
          <ContentTree course={course} />
        </TabsContent>
        <TabsContent value="assessment" className="mt-5">
          {/* key: reset the draft when server data changes after save */}
          <AssessmentEditor key={course.assessment?.updatedAt?.toString() ?? 'new'} course={course} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
