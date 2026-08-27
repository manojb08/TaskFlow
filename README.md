# TaskFlow — Multi-User Task Management App

A small internal task-management tool for a team: create/assign/track tasks with search, filters, and comments.

Built for a full-stack engineering assessment. See also: [DESIGN.md](./DESIGN.md) (architecture & data model), [APPROACH.md](./APPROACH.md) (how the build was sequenced), [DECISIONS.md](./DECISIONS.md) (assumptions & tradeoffs), [AI_USAGE.md](./AI_USAGE.md).

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Radix UI primitives (hand-built ShadCN-style components)
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: JWT access token (in memory) + httpOnly refresh cookie
- **Tests**: Jest + Supertest + mongodb-memory-server (backend), Vitest + React Testing Library (frontend)

## Project layout

```
backend/    Express API server
frontend/   React SPA
DESIGN.md       architecture, data model, API contract, UI design system
APPROACH.md     engineering approach & build order
DECISIONS.md    assumptions, alternatives considered, tradeoffs
AI_USAGE.md     how AI tools were used in this submission
docker-compose.yml  local MongoDB
```

## Setup

### Prerequisites

- Node.js 20+
- MongoDB, one of:
  - **Docker** (recommended): `docker compose up -d` from the repo root starts MongoDB on `localhost:27017`.
  - A local MongoDB install, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster — put its connection string in `MONGODB_URI`.

### 1. Database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env    # defaults already point at the docker-compose Mongo instance
npm install
npm run seed             # creates 2 demo users + 1 sample task
npm run dev               # http://localhost:4000
```

Seeded accounts (for testing task assignment between two users):

| Email | Password |
|---|---|
| `alex@taskflow.io` | `password123` |
| `sarah@taskflow.io` | `password123` |

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Open `http://localhost:5173`, log in with either seeded account.

### Running tests

```bash
cd backend && npm test      # 18 integration tests (auth, tasks, comments) against an in-memory MongoDB
cd frontend && npm test      # component/unit tests
```

## Environment variables

**backend/.env**
| Var | Description |
|---|---|
| `PORT` | API port (default `4000`) |
| `MONGODB_URI` | MongoDB connection string |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS (default `http://localhost:5173`) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Random secrets for signing tokens — generate with `openssl rand -hex 32` |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (default `15m` / `7d`) |

**frontend/.env**
| Var | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (default `http://localhost:4000/api/v1`) |

## Architecture overview

Two independent apps talking over a versioned REST API (`/api/v1`) — no server-side rendering, no shared runtime. See [DESIGN.md](./DESIGN.md) for the full breakdown (data model, folder structure, security). In short:

- **Auth**: register/login issue a short-lived JWT access token (returned in the response body, held in memory on the client) plus a long-lived refresh token in an httpOnly cookie. The frontend's API client automatically retries a request once after a silent refresh if it gets a `401`.
- **Tasks**: standard CRUD, with server-side pagination, text search (title + description), and filtering by status/priority/assignee.
- **Comments**: a separate collection referencing a task, so a task document doesn't grow unbounded and comments can be paginated independently. Deleting a task cascades to its comments.

## API overview

All endpoints are under `/api/v1`. Full contract in [DESIGN.md §3](./DESIGN.md#3-api-contract-rest-versioned-apiv1).

```
POST   /auth/register          POST   /auth/login          POST /auth/refresh
POST   /auth/logout            GET    /auth/me

GET    /users                  (id/name/email — for assignee pickers)

GET    /tasks                  ?page&limit&search&status&priority&assignee&sortBy&sortOrder
POST   /tasks
GET    /tasks/:id
PATCH  /tasks/:id
DELETE /tasks/:id

GET    /tasks/:id/comments
POST   /tasks/:id/comments
DELETE /comments/:commentId
```

Responses use a consistent envelope: `{ success, data, meta? }` or `{ success: false, error: { code, message, details? } }`.

## Known limitations

Documented as deliberate scope decisions in [DECISIONS.md](./DECISIONS.md) — the short version:

- **No activity/audit log.** The reference design's right-rail "Activity" feed (e.g. "Sarah moved this to In Progress") isn't implemented — it wasn't in the assessment's core requirements (§5) and didn't fit the time budget alongside the required features.
- **No real-time updates.** Comments/tasks update on refetch, not via websockets — reasonable for a small team tool.
- **Role model is minimal.** Any authenticated user can edit/assign/delete any task (matches "small trusted team"); comment deletion is restricted to the author or an admin.
- **Settings, Team → Invite Member, "Forgot password," and @mentions are visual-only.** They render (to match the reference design) but aren't wired to real functionality — none were in §5's requirements.
- **Mobile nav uses a centered dialog, not a slide-out sheet**, and mobile task tables scroll horizontally rather than reflowing into cards — a scope simplification, not a missing Radix primitive.
- **No file attachments, sub-tasks, or kanban/drag-and-drop.**

## AI usage

Disclosed in full in [AI_USAGE.md](./AI_USAGE.md).
