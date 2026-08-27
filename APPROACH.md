# APPROACH.md — Engineering Approach

How I'm approaching this assessment, in order.

## 1. Read the brief as a product spec, not a checklist

The brief explicitly rewards "clear engineering thinking" over feature count, and gives a visual reference (the TaskFlow Claude Design artifact) as the source of truth for the frontend. So the approach is:
1. Extract a concrete design (data model + API contract + UI system) from the brief + the reference screens — **[DESIGN.md](./DESIGN.md)**.
2. Decide the build order and what's in/out of the ~6–10hr budget — this document.
3. Build backend → frontend → wire together → tests → docs, committing at each working milestone.

## 2. Tech choices (brief allowed a choice on framework — decision made once, applied consistently)

| Area | Choice | Why |
|---|---|---|
| Backend framework | **Express.js** (not NestJS) | Small surface area (5 resources, 1 auth flow) doesn't need NestJS's DI/module ceremony. Express + a thin layered structure (routes → controllers → models) is faster to build and easier to review in a takehome. |
| Language | TypeScript on both ends | Shared mental model of the data shape between FE/BE; catches contract drift at compile time. |
| DB | MongoDB + Mongoose | Required by brief. Mongoose gives schema validation + timestamps + population for `assignee`/`creator`/`author` refs with minimal boilerplate. |
| Frontend tooling | Vite + React + TS + Tailwind + ShadCN/UI | Matches the brief's stack exactly; ShadCN gives accessible unstyled primitives that are easy to reskin to the reference tokens rather than fighting a pre-themed component library. |
| Auth | JWT access token + httpOnly refresh cookie | Stateless, no session store to run/manage; refresh-in-cookie avoids `localStorage` XSS exposure for the long-lived credential. |
| Local DB during dev | Docker `mongo` container (docker is available on this machine) | Avoids a native MongoDB install; documented as an alternative to MongoDB Atlas free tier in README for reviewers without Docker. |
| Tests | Jest + Supertest + `mongodb-memory-server` (backend), Vitest + React Testing Library (frontend) | Integration tests hit a real (in-memory) Mongo instance rather than mocking the DB layer — catches schema/query bugs mocks would hide. |

## 3. Build order (dependency-driven, not file-count-driven)

1. **Backend scaffold** — Express app, DB connection, error handling, env config.
2. **Auth** — User model, register/login/refresh/logout/me, password hashing, JWT middleware. Everything else depends on this.
3. **Task CRUD + list/search/filter/sort/paginate** — the core of the assessment.
4. **Comments** — depends on tasks existing.
5. **Backend tests** for auth + tasks (the two things most likely to have real bugs: authorization edges, validation, pagination math).
6. **Frontend scaffold** — Vite + Tailwind + ShadCN, design tokens wired into `tailwind.config`, API client, AuthContext.
7. **Frontend screens** in the order a user would hit them: Login/Register → App shell (Sidebar/Topbar) → Task List (search/filter/sort/paginate/loading/empty/error states) → Task Detail (+ comments) → Edit Task → Create Task → Dashboard → Team (read-only, supports the assignee list).
8. **Frontend tests** — a handful of component/interaction tests (auth form validation, task filter behavior) rather than exhaustive coverage, per the brief's "meaningful" not "complete" bar.
9. **README / DECISIONS / AI_USAGE**, final pass, push to GitHub.

Dashboard and Team/Settings are intentionally **last and lightest** — the brief's core requirements (5.1–5.4) are auth, task CRUD, list/search/filter, and task detail/comments. Dashboard is a derived/aggregate view of the same task data, and Settings has no functional requirement in section 5, so both get the minimum needed to look and behave correctly rather than deep investment.

## 4. What's explicitly in scope vs. deferred

**In scope** (directly required by §5 of the brief):
- Register/login, protected routes, ≥2 seed-able users for assignment.
- Task CRUD with title/description/status/priority/assignee/creator/timestamps.
- Paginated list, search (title + description), filter (status/priority/assignee), sort, loading/empty/error states.
- Task detail view with editable fields + comments thread.

**Deferred / out of scope** (documented, not silently dropped — see DECISIONS.md for the full list):
- Full activity/audit log ("Sarah moved this to In Progress" feed shown in the reference's right rail) — implemented only if time remains after core requirements; otherwise the detail view ships without it and this is called out in README's "Known limitations."
- Role-based permissions beyond "any authenticated user can edit/assign any task" — the brief describes a small trusted team, and building real RBAC isn't asked for.
- Email notifications, file attachments, sub-tasks, drag-and-drop kanban — visible in the reference's Settings/notifications frame but not in §5's requirements.
- Real-time updates (websockets) — polling/refetch-on-focus is sufficient for a small team tool.

## 5. How ambiguity gets resolved

Per the brief's §7: assumption → implement consistently → document. Concretely, whenever the reference design or brief doesn't pin down behavior (e.g., "can a user delete someone else's task?", "what happens to comments when a task is deleted?", "is due date required?"), I pick the simplest behavior consistent with "small trusted internal team," implement it the same way everywhere, and log it in DECISIONS.md with the alternative I didn't take and why — not just as a footnote after the fact.

## 6. Definition of done for this assessment

- `docker compose up` (or documented Atlas connection string) + `npm run dev` in both `backend/` and `frontend/` gets a reviewer to a working login screen in under 5 minutes.
- Every §5 requirement has a working, clickable path in the UI backed by a real API call (no mocked data in the shipped app).
- `README.md`, `DECISIONS.md`, `AI_USAGE.md` are accurate to what's actually in the repo, not aspirational.
