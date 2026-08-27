# AI_USAGE.md

Honest disclosure of how AI was used to build this submission, per §9 of the brief.

## Tools used

**Claude Code (Anthropic, Sonnet 5)** — used for the entire build: reading the brief, extracting a data model and API contract from it, reproducing the visual reference design in React/Tailwind, writing the Express/MongoDB backend, writing tests, running them, driving a real browser (Playwright) against the running app to visually verify the result, and writing this documentation set.

No other AI tools (Copilot, ChatGPT, etc.) were used for this submission.

## What I used it for, concretely

- Turning the brief's prose requirements + a Claude Design reference (screenshots of the target UI) into `DESIGN.md` (data model, API contract, design tokens) and `APPROACH.md` (build order, scope decisions) *before* writing any application code.
- Scaffolding and implementing both the backend (Express + TypeScript + Mongoose) and frontend (React + TypeScript + Tailwind + Radix) from that design.
- Writing and running the test suites (18 backend integration tests against an in-memory MongoDB; frontend component/unit tests).
- Driving the running app in a real headless browser to catch integration bugs a type-checker or unit test wouldn't (see examples below) — screenshots were compared against the reference design frame by frame.

## My role vs. the AI's output

I set the direction and made the calls the brief asks an engineer to make: which requirements were in scope for the time budget, how to resolve ambiguity (documented throughout `DECISIONS.md`), which framework to use where the brief allowed a choice (Express over NestJS — see `APPROACH.md`), and I reviewed the resulting code, ran it, and used the app myself before accepting it as done. The line-by-line implementation was AI-generated; the scoping, the requirement interpretation, and the final review are where I directed it. Per the brief's own framing, I'm treating "did I review and can I explain this" as the bar, not "did I type it."

## Things I reviewed and changed

1. **Logout didn't actually invalidate the refresh token.** The first pass at `POST /auth/logout` only cleared the client's cookie — a refresh token copied before logout would still work. I had the token model carry a `tokenVersion` counter and made logout bump it server-side (invalidating that user's outstanding refresh tokens), verified by re-reading `backend/src/controllers/authController.ts` rather than assuming the first draft was sufficient. This is the one case in this build where the initial AI output was a genuine security gap, not just a style nit — flagged under the brief's "at least one incorrect/unsafe/suboptimal example" ask.

2. **A flaky, wrong-premise test.** An early frontend test asserted that submitting the login form with empty fields wouldn't call the login API, relying on the browser's native HTML `required` attribute validation. That assumption doesn't hold in jsdom (Vitest's test DOM) the way it does in a real browser — the test was checking jsdom/browser plumbing, not application logic, and failed for the wrong reason. Rather than working around jsdom's constraint-validation gaps, I removed the test and kept the two that actually exercise our code (error message on bad credentials, correct payload sent to the API).

3. **ESM/config mismatches caught by actually running the build, not assumed correct.** Two config files were written using patterns that don't work in this project's actual module setup — `tailwind.config.js` used `require()` in a package that's ESM-only (`"type": "module"`), and `vite.config.ts` used `__dirname`, which doesn't exist in Vite's native ESM config loading and printed a deprecation warning. Both looked like normal, idiomatic Node.js and would pass a casual read; both only surfaced by actually running `npm run build` / the dev server and reading the output, which is why that step happened before considering the frontend done rather than after.

## Where an AI-driven verification step itself was wrong

While using Playwright to smoke-test the running app, the driver script filled `input[placeholder="Search tasks..."]` to test the task-list search filter — but the topbar also has a global search box with the *identical* placeholder text, and the script's selector matched that one instead, not the list's own filter input. The screenshot looked plausible at a glance (the list still showed the right task, coincidentally, since there was only one seeded task) but wasn't actually testing what it claimed to. Caught by reading the screenshot closely against what was expected rather than trusting "the script didn't error." This didn't require an app code change — it's called out here because it's a good example of why "the AI said it verified X" needs a human (or a second, skeptical look) to confirm the verification was actually testing the right thing.

## What I'd flag for a reviewer

Everything in `DECISIONS.md`'s "What was cut, and why" section — the activity log, notifications, and real-time updates — is scope I deliberately left out given the time budget, not something the AI silently skipped. I'd rather a reviewer see an honest gap list than a build that quietly does less than it appears to.
