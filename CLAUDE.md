# Vafey Engine: Admin Dashboard + API

Vafey is a learning platform (LMS) for teaching and assessing programming skills. The first institution using it is
Bikita Institute of Technology (BIT), and the first course is Software Engineering.

This repo is the **admin dashboard and public API**. Admins use it to create courses and manage
student enrolment. A separate student-facing app will use the API, so every endpoint
must be well-defined, typed and documented.

## MVP scope

Content hierarchy (strict, in this order):

Course → Module → Topic → Lesson, then **one final Assessment per course**

- Admins create, edit and delete courses, modules, topics, lessons and the course's assessment.
- The assessment is **multiple choice only** for now.
- Students enrol in a course and work through it **in order**. They cannot skip
  modules, topics or lessons. The final assessment unlocks once all lessons are complete.
- The final assessment score decides whether the student **passes or fails** the course.
- Pass mark: each course has a `passMark` field (a percentage) that defaults to **60%**. Admins can change it
  for each course from the dashboard. Don't hardcode 60 anywhere else.
- Admins can see enrolled students, their progress and their results (basic reporting).

### Out of scope for MVP (in the spec, but later phases)
- Coding exercises, the browser editor (OpenVSCode), code execution with Judge0
- AI technical defence and interviews
- Git/Gitea, team projects
- Prior-experience skip-ahead and appeals

Don't build scaffolding for these. Keep the data model open to them, but nothing more.

## Stack

- Framework: TanStack Start (React 19, TanStack Router, Vite), Tailwind v4
- Runtime: Cloudflare Workers, configured in `cloudflare.config.ts` (use the `cf` CLI, not Wrangler)
- Database: Cloudflare D1 (`vafey-engine`) via Drizzle ORM. The binding is `env.DB`
- File storage: Cloudflare R2 (`vafey-engine` bucket) for course images. The binding is `env.BUCKET`; the S3 creds are in `.env`
- Auth: Better Auth (email + password) with a `role` field on the user: `admin` | `student` (default)
- Validation: zod

## Design

- Colors are ported from the fitmycv app: warm paper sidebar (`bg-paper`), white content area, ink text
  (`text-ink`, `text-ink-soft`, `text-ink-faint`), hairline borders (`border-line`), and a terracotta accent
  (`brand`, `brand-dark`, `brand-soft`). All tokens are in `src/styles.css`. Use them, never raw hex.
- Font: Bricolage Grotesque (same as zen-browser.app), self-hosted via `@fontsource-variable`.
- Flat style: hairline borders, no heavy shadows, 8px radius. Light theme only for now.
- Dashboard shell: `src/routes/_dashboard.tsx` (sidebar + top bar). Each page sets `staticData: { title }`
  for the top bar. Add nav items in `src/components/layout/app-sidebar.tsx`.

## Project structure (follow this — keep the app maintainable)

```
src/
  routes/                 # Thin. Pages + API handlers only: parse input → call server/ → return.
    api/                  # Public JSON API consumed by the student app
  server/<domain>/        # Business logic, one folder per domain (courses, assessments, enrollments)
    <domain>.service.ts   # DB queries + rules (grading, pass/fail, progression checks)
    <domain>.schema.ts    # zod input schemas (shared by API routes + server functions)
  db/
    schema/               # Drizzle models: one file per domain + relations.ts + index.ts barrel
    index.ts              # `db` client (server-only)
  lib/                    # Shared infrastructure: auth.ts, auth-client.ts, r2.ts, utils.ts
  components/
    ui/                   # shadcn generated components (don't hand-edit)
    <domain>/             # Feature components (e.g. components/courses/CourseCard.tsx)
  hooks/                  # TanStack Query hooks per domain (useCourses, useCourse…)
  stores/                 # Zustand stores (UI/global state only)
drizzle/                  # Generated migrations. Never edit by hand
```

Rules:
- Business logic lives in `server/`, never in routes or components.
- Server-only modules (`db/`, `lib/auth.ts`, `server/`) must never be imported by client code.
  Import types only with `import type`.
- Change the schema in `src/db/schema/*`, then run `npm run db:generate`. Never write migration SQL by hand.
- Import with the `#/` alias (`#/db`, `#/lib/auth`), not long relative paths.
- Check the role in every admin endpoint and admin server function. Check that the user is signed in on every student endpoint.
- Create folders when the first file needs them. Don't add empty scaffolding.

## Commands

- `npm run dev`: local dev on :3000 (local D1/R2 simulation, env vars from `.env`)
- `npm run typecheck`: regenerates Worker types, then runs tsc
- `npm run db:generate`: generates a migration from schema changes
- `npm run db:migrate:local` / `npm run db:migrate:remote`: apply migrations
- `npm run db:studio`: Drizzle Studio against remote D1
- `npm run deploy`: `cf deploy`. Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` as production secrets first
- Data fetching: TanStack Query
- Global state: Zustand (only for real global state; server data lives in Query)
- Components: shadcn/ui
- Toasts: react-hot-toast
- Icons: https://icons0.dev/, Phosphor set. Add with `npx shadcn@latest add @icons0/ph/<name>`;
  they land in `src/components/icons/ph/`. Don't add lucide icons in app code.
- Cards (courses, modules, lessons, etc.):
  - https://www.cult-ui.com/docs/components/cutout-card
  - https://www.cult-ui.com/docs/components/minimal-card
- Loader (use this one everywhere): https://www.loading-ui.com/docs/components/spiral

## API rules

- REST resources follow the hierarchy, e.g. `/api/courses/:id/modules`.
- Validate input at the boundary and return consistent JSON error shapes.
- Keep endpoints the student app needs (catalog, enrol, progress, submit assessment,
  result) separate from admin-only endpoints, and protect the admin-only ones.

## Reference

Full product spec: https://docs.google.com/document/d/1yX0mRO-NqTmns4E9Frua-zE4TJonxcKvGn1KSXPUDNk/edit?tab=t.0
