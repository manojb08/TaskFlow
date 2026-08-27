# AI_USAGE.md

Honest disclosure of how AI was used to build this submission, per §9 of the brief.

## Tools used

**Claude Code (Anthropic, Sonnet 5)** — used for the entire build: reading the brief, extracting a data model and API contract from it, reproducing the visual reference design in React/Tailwind, writing the Express/MongoDB backend, writing tests, running them, driving a real browser (Playwright) against the running app to visually verify the result, orchestrating multiple agents in parallel for a later round of additions (see below), and writing this documentation set.

No other AI tools (Copilot, ChatGPT, etc.) were used for this submission.

## What I used it for, concretely

- Turning the brief's prose requirements + a Claude Design reference (screenshots of the target UI) into `DESIGN.md` (data model, API contract, design tokens) and `APPROACH.md` (build order, scope decisions) *before* writing any application code.
- Scaffolding and implementing both the backend (Express + TypeScript + Mongoose) and frontend (React + TypeScript + Tailwind + Radix) from that design.
- Writing and running the test suites (42 backend integration tests against an in-memory MongoDB; 20 frontend component/unit tests).
- Driving the running app in a real headless browser to catch integration bugs a type-checker or unit test wouldn't (see examples below) — screenshots were compared against the reference design frame by frame.

## My role vs. the AI's output

I set the direction and made the calls the brief asks an engineer to make: which requirements were in scope for the time budget, how to resolve ambiguity (documented throughout `DECISIONS.md`), which framework to use where the brief allowed a choice (Express over NestJS — see `APPROACH.md`), and I reviewed the resulting code, ran it, and used the app myself before accepting it as done. The line-by-line implementation was AI-generated; the scoping, the requirement interpretation, and the final review are where I directed it. Per the brief's own framing, I'm treating "did I review and can I explain this" as the bar, not "did I type it."

## Things I reviewed and changed

1. **Logout didn't actually invalidate the refresh token.** The first pass at `POST /auth/logout` only cleared the client's cookie — a refresh token copied before logout would still work. I had the token model carry a `tokenVersion` counter and made logout bump it server-side (invalidating that user's outstanding refresh tokens), verified by re-reading `backend/src/controllers/authController.ts` rather than assuming the first draft was sufficient. This is the one case in this build where the initial AI output was a genuine security gap, not just a style nit — flagged under the brief's "at least one incorrect/unsafe/suboptimal example" ask.

2. **A flaky, wrong-premise test.** An early frontend test asserted that submitting the login form with empty fields wouldn't call the login API, relying on the browser's native HTML `required` attribute validation. That assumption doesn't hold in jsdom (Vitest's test DOM) the way it does in a real browser — the test was checking jsdom/browser plumbing, not application logic, and failed for the wrong reason. Rather than working around jsdom's constraint-validation gaps, I removed the test and kept the two that actually exercise our code (error message on bad credentials, correct payload sent to the API).

3. **ESM/config mismatches caught by actually running the build, not assumed correct.** Two config files were written using patterns that don't work in this project's actual module setup — `tailwind.config.js` used `require()` in a package that's ESM-only (`"type": "module"`), and `vite.config.ts` used `__dirname`, which doesn't exist in Vite's native ESM config loading and printed a deprecation warning. Both looked like normal, idiomatic Node.js and would pass a casual read; both only surfaced by actually running `npm run build` / the dev server and reading the output, which is why that step happened before considering the frontend done rather than after.

## Where an AI-driven verification step itself was wrong

While using Playwright to smoke-test the running app, the driver script filled `input[placeholder="Search tasks..."]` to test the task-list search filter — but the topbar also has a global search box with the *identical* placeholder text, and the script's selector matched that one instead, not the list's own filter input. The screenshot looked plausible at a glance (the list still showed the right task, coincidentally, since there was only one seeded task) but wasn't actually testing what it claimed to. Caught by reading the screenshot closely against what was expected rather than trusting "the script didn't error." This didn't require an app code change — it's called out here because it's a good example of why "the AI said it verified X" needs a human (or a second, skeptical look) to confirm the verification was actually testing the right thing.

## Round 2 — orchestrating multiple agents for parallel feature work

After the core submission (§5, above) was complete and pushed, I used Claude Code's multi-agent workflow orchestration to build several independent additions in parallel rather than one at a time: an activity log, a shared invite/forgot-password credential flow, comment @mentions, and real dashboard metrics. Each ran as a paired backend-then-frontend agent, briefed with the exact API contract and file ownership to avoid two agents editing the same file concurrently; a dedicated agent then adversarially reviewed the new auth code specifically for security issues. I did the smaller, purely mechanical pieces (Settings save, mobile navigation, mobile card layout) myself directly rather than delegating them — not everything benefits from being handed to a subagent, and small self-contained edits are often faster and easier to verify done by hand.

**What the adversarial security review actually found and I fixed:**

1. **Timing side-channel in forgot-password.** The response body was correctly identical whether or not an email existed (preventing enumeration by content), but the "email exists" code path did an extra database write before responding, making it measurably slower — a timing oracle achieving the same enumeration the identical-response-body was supposed to prevent. Fixed by making both paths perform exactly one `findOneAndUpdate` attempt regardless of match.
2. **Non-atomic token consumption.** The original set-password handler looked up a user by token, then separately cleared the token fields in a second write — a window where two requests racing the same still-valid token could both pass the lookup before either write landed, defeating the "single-use" intent. Fixed with a single atomic `findOneAndUpdate` that looks up and consumes the token in one operation.

Both are the kind of subtle-but-real security bugs that pass a functional test (the feature "works") while remaining genuinely exploitable — exactly why I asked a separate agent to specifically hunt for them rather than trusting the implementing agent's own self-report that it was secure.

**What running the app live caught that no test did.** After the workflow finished, I drove the app in a real browser rather than trusting the agents' own "tsc passed, tests passed" reports. That's how I found that editing a task's status/priority didn't refresh the Activity panel — the frontend only fetched activity once on mount, so a save that visibly changed the badges left the Activity feed showing stale (empty) data until a full page reload. Every unit and integration test passed, because none of them asserted "does the UI reflect a change made without navigating away" — the backend correctly recorded the activity entry (I confirmed with a raw API call), the bug was entirely in the frontend not re-fetching. This is the same lesson as the search-selector mistake above, generalized: agent self-reports of "verified" describe what they checked, not what's actually true, and passing tests only cover what someone thought to assert.

## What I'd flag for a reviewer

`DECISIONS.md`'s "Still not built — deliberately" list (real-time updates, notification delivery, and Settings beyond name-editing) is scope I chose not to build, not something silently skipped — real-time/notifications in particular would need infrastructure (websockets or a poll/email layer) that's disproportionate to what an assessment app needs. I'd rather a reviewer see an honest, current gap list than a build that quietly claims more than it does — which is also why this file and `DECISIONS.md` were both revised after Round 2, rather than left describing features (activity log, invite flow, mobile responsive polish) that no longer match what's actually in the repo.
