# DECISIONS.md

Technical decisions, assumptions, alternatives considered, and tradeoffs made while building this. Organized by area; each entry follows the brief's rule: assumption → implemented consistently → documented here.

## Authentication & authorization

**JWT access token + httpOnly refresh cookie, instead of server sessions.**
- Alternative considered: session cookie + server-side session store (e.g. Redis).
- Why not: adds a stateful dependency for no real benefit at this scale — a takehome task app doesn't need session revocation lists or shared session state across instances.
- Tradeoff accepted: logout requires an explicit server round-trip to invalidate the refresh token (via a `tokenVersion` bump on the user document) rather than just deleting a session row; this is a few extra lines, not a real cost.

**Access token held in memory (JS variable), never `localStorage`.**
- Why: `localStorage` is readable by any script on the page — an XSS bug anywhere in the app (or a dependency) can exfiltrate a long-lived token. Keeping it in memory means a page refresh loses it, which is why the refresh-cookie flow exists (silent re-auth on load via `/auth/refresh`).
- Tradeoff: a hard refresh briefly shows a loading spinner while the app re-authenticates. Acceptable for an internal tool.

**Any authenticated user can view, edit, assign, or delete any task.**
- Assumption: the brief describes "a small engineering team" using an internal tool — the realistic failure mode there is not malicious teammates, it's accidental overreach, which isn't solved by ACLs anyway.
- Alternative considered: only the creator or assignee can edit/delete a task.
- Why not: the reference design's task list shows a delete action on every row regardless of who created it, and building real RBAC wasn't asked for in §5. Documented here rather than silently generalized.
- Where I *did* restrict: comment deletion is author-or-admin only, because comments are personal statements ("Sarah said X") in a way task fields aren't, and it was a small addition once `role` existed on the user model.

**Registration is open (no invite-only / admin-approval flow).**
- The brief just needs "at least two users" to demonstrate assignment. An invite flow is out of scope; anyone can self-register, which is fine for a demo/assessment build and is called out as a real limitation for a production version.

## Data model

**Comments are a separate collection, not embedded in the Task document.**
- Alternative: embed comments as an array field on `Task`.
- Why not: MongoDB documents have a 16MB cap and embedded arrays that grow unboundedly are a well-known anti-pattern; a separate collection also lets comments be paginated independently of the task and indexed on `task` for fast lookups.

**Deleting a task cascades to delete its comments.**
- Assumption: orphaned comments referencing a deleted task have no product value and would just be dead data. The reference design's delete-confirmation dialog literally says "and its comments will be permanently removed" — so this was actually specified, not just assumed.

**`status` and `priority` are fixed enums, not a user-editable list.**
- The brief's suggested values (Todo/In Progress/Done for status; Low/Medium/High for priority) were extended to match the reference design exactly: status gets a 5th value `in_review` and `blocked`; priority gets a 4th value `urgent`. Kept as backend-enforced enums (not free text) so filtering/sorting stay meaningful — a "make statuses configurable" feature was explicitly out of scope per §7 ("not every implementation detail is specified... use engineering judgment").

**`dueDate` is optional.**
- Not listed as a required field in §5.2's minimum task fields; added because the reference design's Create/Edit Task forms include it, but nothing in the brief said every task must have one.

## API design

**Consistent response envelope (`{success, data, meta?}` / `{success:false, error}`) across every endpoint.**
- Makes the frontend's API client and error handling uniform instead of special-casing each resource's response shape.

**Server-side validation via `zod` schemas on every mutating route; client-side validation mirrors but never replaces it.**
- The brief explicitly requires server-side validation ("important user input should be validated on the server") — treated client-side checks as UX sugar only.

**Pagination is offset-based (`page`/`limit`), not cursor-based.**
- Alternative considered: cursor pagination (better for large, frequently-mutated lists).
- Why not: this app's expected data volume (a small team's tasks) doesn't justify cursor pagination's added complexity; offset pagination also makes "page 1 of 5, jump to page 3" trivial, which cursor pagination doesn't support well — and the reference design shows page numbers, not infinite scroll.

## Frontend

**ShadCN/UI components hand-built on Radix primitives + Tailwind, rather than running the `shadcn` CLI.**
- The CLI needs to reach npm's component registry at generation time; hand-authoring the same primitives (Button, Dialog, Select, DropdownMenu, Table, Toast, etc.) directly against `@radix-ui/react-*` and Tailwind produces the same result — Radix for accessible interaction primitives (focus trap, keyboard nav, portals), Tailwind classes styled to the reference design's exact tokens (colors, radius, spacing) documented in DESIGN.md §4.

**Edit Task is a mode toggle on the Task Detail route (`/tasks/:id?edit=1`), not a separate route/page.**
- The reference design shows "Edit task" as a visually distinct screen. Implementing it as a toggled state on the same component (same data already loaded, same route) is functionally identical for the user and avoids duplicating the fetch-task-by-id logic and layout across two page components.

**Create Task is a centered Dialog on both desktop and mobile, not a full-screen Sheet on mobile.**
- The reference only shows a desktop create flow implicitly (via the "Create Task" button) and an explicit **mobile** full-screen-sheet frame. Building a real Sheet primitive (slide-in from an edge, separate from Dialog) for one screen size was judged not worth the added component surface for this scope — the Dialog is still fully usable at 390px width. If this shipped past a takehome, Radix's `Dialog` can be swapped for a proper `Sheet` on mobile without touching the form logic.

**Mobile navigation is a centered Dialog listing nav links, not a slide-out drawer.**
- Same reasoning as above: the reference shows a left-edge slide-out sheet; a from-scratch Sheet primitive wasn't worth building for a single menu. The Dialog approach is fully keyboard/screen-reader accessible via Radix and functionally equivalent (open menu → pick a destination → menu closes).

**Mobile task tables scroll horizontally instead of reflowing into stacked cards.**
- The reference's responsive frame shows table rows becoming cards on mobile. Given the 6–10hr budget, a second card-layout renderer for the same data was deprioritized behind getting every §5 requirement working end-to-end first; the existing table is still fully usable via horizontal scroll at 390px.

**"Forgot password," Settings profile editing, Team → "Invite Member," and comment @mentions render but aren't functional.**
- All four appear in the reference design but none are in §5's requirements. Rather than omit them (and diverge visually from the reference) or fully build them (auth reset flow, invite emails, mention autocomplete — real features, not quick additions), they're present in the UI and surface an honest "not available in this demo" toast/note when interacted with. This was a deliberate call to prioritize visual fidelity to the reference without silently overbuilding beyond §5.

**Dashboard stats are computed via 4 lightweight `GET /tasks?limit=1&status=X` calls (reading `meta.total`) rather than a dedicated `/stats` endpoint.**
- A real product would add an aggregation endpoint. For this scope, reusing the existing list endpoint's pagination metadata avoids adding a new backend endpoint + Mongo aggregation pipeline for four numbers, at the cost of 4 small parallel requests on dashboard load — an acceptable tradeoff at this data volume, called out here rather than hidden.

## What was cut, and why

Everything below appears in the reference design's frames but is genuinely absent from this build (not stubbed):

- **Activity/audit log** (the right-rail "Sarah moved this to In Progress" feed). Would need an `ActivityLog` collection + writes on every mutation path (status change, priority change, assignment, comment) — real scope, not a quick add, and not in §5.
- **Notifications** (the bell icon is present but not wired to anything).
- **Real-time updates** — no websockets; the app relies on refetch-on-navigation.

If more time were available, activity logging would be the first addition (it's the highest-value gap relative to effort — one write path, reused across several mutation points).
