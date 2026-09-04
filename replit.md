# LumenPath Online E-Learning Platform

LumenPath is a responsive student learning space with Clerk accounts, lessons, quizzes, automatic scoring, progress tracking, and a protected admin operations area.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Clerk and App Storage environment values are provisioned by Replit and should be managed through the workspace secrets/integrations UI.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/online-learning-platform/src/App.tsx` — student and admin shells, routes, auth gates, and page UI
- `artifacts/online-learning-platform/src/index.css` — LumenPath visual tokens and responsive utility styles
- `artifacts/api-server/src/routes/learning.ts` — authenticated student and admin API handlers
- `artifacts/api-server/src/middlewares/auth.ts` — Clerk session and database role checks
- `artifacts/api-server/src/routes/storage.ts` — authenticated App Storage upload/object routes
- `artifacts/api-server/src/seed.ts` — idempotent demo curriculum seed
- `lib/api-spec/openapi.yaml` — API source of truth; regenerate clients after contract edits
- `lib/db/src/schema/learning.ts` — Drizzle source of truth for learning data

## Architecture decisions

- Clerk is the authentication provider; platform user records are provisioned on the first authenticated API request.
- Admin access is enforced server-side from the platform user role, not only by frontend routing.
- PostgreSQL stores curriculum, attempts, answers, progress, and notifications; App Storage stores uploaded material objects.
- API hooks and Zod request schemas are generated from the OpenAPI contract.

## Product

Students can sign up, browse subjects and lessons, complete lessons, take scored quizzes, review results, track progress, and edit their profile. Admins can manage students, subjects, lessons, quizzes, questions, results, reports, and their profile.

## User preferences

No additional preferences recorded.

## Gotchas

- Run API code generation after changing `lib/api-spec/openapi.yaml`.
- The Vite build expects `PORT` and `BASE_PATH`; the managed web workflow supplies them automatically.
- Protected API routes require a Clerk session; admin endpoints also require a matching `platform_users.role = 'admin'` record.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
