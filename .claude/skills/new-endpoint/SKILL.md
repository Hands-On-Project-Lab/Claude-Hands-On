---
name: new-endpoint
description: Scaffolds a new REST resource in this Express 4 + TypeScript + Zod API using a production layered layout (route -> service -> repository, with schema and tests) and mounts it under /api/<name> in src/app.ts. Use when asked to add, create, or scaffold a new endpoint, resource, or API route (e.g. "add a GET /customers endpoint"). Do not use for editing existing routes, bug fixes, refactoring orders, middleware-only changes, config, or general Express questions.
---

# new-endpoint

Scaffolds one new resource in a production-ready layered structure. `CLAUDE.md` and `.claude/rules/api-design.md` are authoritative. If this skill conflicts with them, follow them and tell the user.

## Target layout

    src/app.ts                               middleware + router mounting + central error middleware. No business logic.
    src/server.ts                            entry point only: listen() + graceful shutdown. Never imported by tests.
    src/routes/<name>.routes.ts              HTTP only: parse with Zod, call service, map result to response
    src/schemas/<name>.schema.ts             Zod schemas + z.infer types (single source of truth)
    src/services/<name>.service.ts           business logic. No Express types, no direct storage access
    src/repositories/<name>.repository.ts    repository interface + in-memory Map implementation
    src/errors/app-error.ts                  AppError(status, code, message) base class (shared)
    src/middleware/async-handler.ts          wraps async handlers so rejections reach the error middleware (shared)
    src/middleware/validate.ts               Zod validation for body, params, query (shared)
    src/middleware/error-handler.ts          central 4-arg error middleware, registered last (shared)
    src/routes/<name>.routes.test.ts         integration tests: vitest + supertest against exported `app`

Layering rule: route -> service -> repository. Routes never touch a repository. Services never import Express. Dependencies point one way only.

## Scope

- Create a new resource only. Never change existing routes, response shapes, or status codes. Do not refactor `orders`.
- Never add dependencies, a database/ORM, auth, or other "Target standard" items from CLAUDE.md unless the user asked.
- Implement only the requested method(s). No extra CRUD handlers.
- Shared files (`errors/`, `middleware/`) are created only if missing, and only with the minimum the new resource needs. If `orders.ts` already defines equivalents inline, do not edit it. Reuse the shared versions for the new resource and mention the duplication in the final report.

## Procedure

1. **Parse the request.** Derive the plural lowercase resource (`customers`), singular PascalCase type (`Customer`), and method(s). If the resource or its fields are unclear, ask one concise question before writing code.
2. **Inspect first.** Read `src/app.ts`, `src/routes/orders.ts`, `src/routes/orders.test.ts`, `.claude/rules/api-design.md`, and list `src/`. Note what already exists (shared middleware, error shape, export style). Never assume a target item exists.
3. **Guard against collisions.** If any file in the layout above for this resource exists, or `/api/<name>` is already mounted, stop and report. Never overwrite.
4. **Create shared pieces if missing** (see Scope), matching the existing error shape from `orders.ts`. Keep them small and dependency-free.
5. **Create the resource files** in this order: schema, repository, service, routes, tests.
6. **Mount** with `app.use("/api/<name>", <name>Router)` after existing routers and before the error middleware. Add no logic to `app.ts`.
7. **Verify** in order, stopping at the first failure:
   - `npx tsc --noEmit`
   - `npm run test:run`
   - `npm audit --omit=dev` (no high or critical issues)
     Fix the root cause and re-run. After 3 failed attempts, stop and report.

## Layer requirements

**Schema**

- Zod is the single source of truth. Types come from `z.infer`, with no hand-written parallel interfaces.
- `.strict()` on every object schema to reject unknown fields.
- Separate schemas for create input, update input (partial), route params (id), and query.
- Bound inputs: `.max()` on strings and arrays, `.min()`/`.max()` on numbers. Money is integer minor units, never floats.
- Never accept identity or ownership fields from the client beyond what `orders` already does.

**Repository**

- Define an interface (`find`, `findById`, `create`, `update`, `delete` as needed). The in-memory `Map` class implements it.
- Services depend on the interface, received via constructor or factory, not a module-level global. This is what lets a DB replace the Map later without touching services.
- Return copies, not references to stored objects.
- Export a way to reset state for tests.

**Service**

- Holds business rules and throws `AppError` (for example 404 not found). No `req`/`res`, no HTTP details beyond the status carried by `AppError`.

**Routes**

- Validate body, params, and query with the `validate` middleware before the handler runs.
- Wrap every async handler in `asyncHandler`.
- Status codes: 200 read/update, 201 create, 204 delete, 400 validation, 404 not found.
- Use plural nouns and no verbs in paths. Do not change existing response shapes.

**Errors**

- Zod errors map explicitly to the standard 400 error shape. They never fall through to 500.
- 500 responses are generic. No stack traces, internal paths, or raw exception messages to clients.
- Log details server-side through the project logger if one exists. Otherwise do not log.

## Code requirements

- TypeScript strict. No `any`, `@ts-ignore`, `@ts-expect-error` (without an explanatory comment), `console.log`, `eval`, or `new Function`.
- Use `unknown` and narrow instead of `any`.
- Prefer `async/await`. Named exports. No default exports.
- No hardcoded secrets, tokens, or connection strings. No real customer data in fixtures.
- Keep changes minimal and scoped to the new resource.

## Test requirements

- Import `app` from `src/app.ts`, never `src/server.ts`.
- Test over HTTP with supertest. Reset repository state in `beforeEach`. Tests must be independent and order-agnostic.
- Cover, where the endpoint can produce them: success, 400 validation failure (including an unknown field), 404 not found. Add 401/403 only once auth exists.
- Unit-test the service separately if it contains real business rules.
- Never weaken validation, skip, or delete tests to get a green run.
- Use `npm run test:run`, never `npm test` (watch mode).

## Definition of done

- Typecheck, tests, and audit all pass
- Router mounted before the error middleware
- Layers respect route -> service -> repository with no shortcuts
- No placeholder text, `TODO`, or dead code left behind
- `CLAUDE.md` Architecture section updated to list the new files (the project requires this when structure changes)

## Final report

1. Files created, shared files created, and files modified (`src/app.ts`, `CLAUDE.md`)
2. Endpoint(s) implemented (method + path)
3. Typecheck, test, and audit results
4. Assumptions, duplication with `orders`, and "Target standard" items intentionally not added (auth, rate limiting, helmet, etc.)
