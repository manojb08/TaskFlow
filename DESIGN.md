# DESIGN.md — TaskFlow (Multi-User Task Management App)

This document describes the system design for the assessment: a multi-user task management application. It covers architecture, data model, API contract, and the UI design system (reproduced from the provided Claude Design reference artifact).

---

## 1. High-Level Architecture

```
┌─────────────────────┐        HTTPS / JSON         ┌──────────────────────┐
│   Frontend (SPA)     │ ───────────────────────────▶ │   Backend (REST API)  │
│ React + TS + Tailwind│ ◀─────────────────────────── │ Node.js + Express + TS│
│  Vite dev server     │        JWT (Bearer)          │                        │
└─────────────────────┘                               └──────────┬────────────┘
                                                                    │ Mongoose
                                                                    ▼
                                                          ┌──────────────────┐
                                                          │   MongoDB         │
                                                          │ users / tasks /   │
                                                          │ comments          │
                                                          └──────────────────┘
```

- **Monorepo layout**: `backend/` and `frontend/` as independent npm projects, each with their own `package.json`, so they can be developed, tested, and deployed independently.
- **Communication**: Frontend talks to the backend exclusively over a versioned REST API (`/api/v1/...`). No server-side rendering / no shared runtime — a clean client/server boundary keeps the assessment's two hardest concerns (auth, data modeling) testable in isolation.
- **Auth model**: Stateless JWT access tokens (short-lived) + httpOnly refresh token cookie (rotation). Chosen over server sessions because it needs no session store and keeps the API stateless/horizontally scalable — reasonable for a small internal tool without over-engineering.

---

## 2. Data Model (MongoDB / Mongoose)

### User
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required |
| `email` | String | required, unique, lowercase, indexed |
| `passwordHash` | String | bcrypt hash, **never returned** in API responses |
| `role` | enum `admin` \| `member` | default `member` (kept minimal — full RBAC is out of scope) |
| `createdAt` / `updatedAt` | Date | timestamps |

### Task
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `title` | String | required, 1–200 chars |
| `description` | String | optional, markdown-flavored plain text, max 2000 chars |
| `status` | enum `todo` \| `in_progress` \| `in_review` \| `done` \| `blocked` | default `todo` |
| `priority` | enum `low` \| `medium` \| `high` \| `urgent` | default `medium` |
| `assignee` | ObjectId ref `User` | nullable (unassigned allowed) |
| `creator` | ObjectId ref `User` | required, set from authenticated user, immutable |
| `dueDate` | Date | optional |
| `createdAt` / `updatedAt` | Date | timestamps (Mongoose auto) |

Indexes: `{ status: 1 }`, `{ priority: 1 }`, `{ assignee: 1 }`, text index on `{ title: 'text', description: 'text' }` for search.

### Comment
Modeled as a **separate collection** (not embedded) referencing the task, so a task's comment count doesn't cause its document to grow unbounded and the comments list can be paginated independently.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `task` | ObjectId ref `Task` | required, indexed |
| `author` | ObjectId ref `User` | required |
| `body` | String | required, 1–2000 chars |
| `createdAt` / `updatedAt` | Date | timestamps |

*(Activity/audit log shown in the design's "Activity" panel — e.g. "Sarah moved this to In Progress" — is a nice-to-have, out of scope for the 6–10hr budget; see DECISIONS.md. If time remains it's implemented as a lightweight `ActivityLog` collection written on every task mutation.)*

---

## 3. API Contract (REST, versioned `/api/v1`)

All responses use a consistent envelope:
```json
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 42 } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create user, returns access token + sets refresh cookie |
| POST | `/auth/login` | — | Validate credentials, returns access token + sets refresh cookie |
| POST | `/auth/refresh` | refresh cookie | Issues new access token |
| POST | `/auth/logout` | — | Clears refresh cookie |
| GET | `/auth/me` | Bearer | Current user profile |

### Users (minimal — needed for assignee pickers)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users` | Bearer | List users (id, name, email) for assignee dropdowns |

### Tasks
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/tasks` | Bearer | List, paginated. Query: `page, limit, search, status, priority, assignee, sortBy, sortOrder` |
| POST | `/tasks` | Bearer | Create task (creator = current user) |
| GET | `/tasks/:id` | Bearer | Task detail |
| PATCH | `/tasks/:id` | Bearer | Partial update (title/description/status/priority/assignee/dueDate) |
| DELETE | `/tasks/:id` | Bearer | Delete task (cascades: deletes its comments) |

### Comments
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/tasks/:id/comments` | Bearer | List comments for a task, paginated |
| POST | `/tasks/:id/comments` | Bearer | Add comment (author = current user) |
| DELETE | `/comments/:id` | Bearer | Delete own comment (author or admin only) |

**Authorization rule** (documented assumption — see DECISIONS.md): any authenticated user can view/edit/assign any task (small trusted team, matches "internal tool used by a small engineering team"). Delete of a *comment* is restricted to its author or an admin. Delete of a *task* is unrestricted among authenticated users, matching the design's per-row "Delete task" action being available to any team member.

---

## 4. UI Design System (from the provided Claude Design reference)

Reproduced 1:1 from the reference artifact's "Foundations" frame — treated as the source of truth for the frontend implementation.

**Colors**
| Token | Hex | Usage |
|---|---|---|
| Ink / primary | `#0A0A0A` | text, primary buttons |
| Accent | `#3B82F6` | links, "In Progress" badge, focus ring |
| Success | `#16A34A` | "Done" badge |
| Warning | `#CA8A04` | "In Review" badge, high priority dot |
| Destructive | `#DC2626` | "Blocked" badge, urgent priority, delete actions |
| App canvas | `#FCFCFC` | page background |
| Sidebar / topbar | `#F9F9F9` | nav surfaces |
| Border | `#E5E5E5` | dividers, input borders |

**Typography**: `Outfit` for headings (page title 24/700, section heading 20/600), `Geist` for body/UI text (table cell emphasis 14/500, body 14/400, metadata/timestamps 12/400). Both loaded via Google Fonts with system-font fallback stacks.

**Layout metrics**: sidebar 215px, topbar 46px, radius 8px, table row height 56px, content padding 40px, 8pt spacing grid, badge 22px tall / 6px radius / 1px border / 12px-500 label.

**Statuses**: To Do (gray), In Progress (blue), In Review (amber), Done (green), Blocked (red).
**Priorities**: Low, Medium (gray dots), High (amber dot), Urgent (red dot).

**Screens reproduced** (desktop 1440×900 + mobile 390×844, from the reference):
1. Login (+ Register)
2. Dashboard — stat cards + recent tasks table
3. Tasks list — search, Status/Priority/Assignee filters, sort, paginated table, row actions
4. Task Detail — description, comments thread + composer, right rail (task info + activity feed)
5. Edit Task — inline edit with unsaved-changes summary + danger zone (delete)
6. Team — member roster (used for the assignee list)
7. Settings — profile (kept minimal / stretch)
8. States — loading (skeleton), empty ("No tasks found"), error (toast + destructive confirm dialog)
9. Responsive — sidebar collapses to a slide-out sheet, table rows become cards, filters collapse into a "Filters (n)" trigger, create task becomes a full-screen sheet.

Components are built as reusable primitives (Button, Input, Select, Badge, Table, Dialog, Sheet, Avatar, Toast) via **ShadCN/UI** on top of Tailwind, matching the tokens above, so every screen composes the same primitives rather than one-off styles.

---

## 5. Frontend Structure

```
frontend/src/
  api/            # typed fetch client, one module per resource (auth, tasks, comments, users)
  components/
    ui/           # shadcn primitives (button, input, badge, dialog, ...)
    layout/       # Sidebar, Topbar, AppShell
    tasks/        # TaskTable, TaskFilters, TaskCard, StatusBadge, PriorityBadge
    comments/     # CommentList, CommentComposer
  pages/          # Login, Register, Dashboard, TaskList, TaskDetail, TaskEdit, Team
  hooks/          # useAuth, useTasks, useDebouncedValue
  context/        # AuthContext
  types/          # shared TS types mirroring the API contract
  lib/            # utils (cn, date formatting)
```

## 6. Backend Structure

```
backend/src/
  config/         # env, db connection
  models/         # User, Task, Comment (Mongoose schemas)
  controllers/    # authController, taskController, commentController, userController
  routes/         # one router per resource, mounted under /api/v1
  middleware/     # requireAuth, errorHandler, validateRequest (zod), rateLimiter
  validators/     # zod schemas per endpoint
  utils/          # jwt, password hashing, ApiError, asyncHandler
  app.ts          # express app (middleware wiring)
  server.ts       # http server bootstrap + db connect
tests/
  unit/           # model/util tests
  integration/    # supertest against routes, mongodb-memory-server
```

---

## 7. Security

- Passwords hashed with **bcrypt** (cost 12), never stored/returned in plaintext.
- JWT access token (15 min) in `Authorization: Bearer`, refresh token (7 days) in **httpOnly, sameSite=strict** cookie — mitigates XSS token theft on the access token's short window and keeps the refresh token off `localStorage`.
- `requireAuth` middleware rejects any protected route without a valid access token (`401`).
- Input validation on every mutating endpoint via **zod**, server-side (client-side validation mirrors it for UX but is never trusted).
- Rate limiting on `/auth/*` (login/register) to blunt brute force.
- Mongoose schema-level constraints + `helmet` + CORS locked to the frontend origin.
- No secrets committed — `.env.example` documents required vars, real `.env` is gitignored.
