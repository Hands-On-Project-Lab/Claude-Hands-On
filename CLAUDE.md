# orders-api

Express.js + TypeScript REST API for customer orders. CRUD over an in-memory store, validated with Zod. Reference/prototype service: no persistence, no auth yet.

## Commands

```bash
npm install                 # install deps (use `npm ci` in CI)
npm run dev                 # dev server, auto-reload via tsx, http://localhost:3000
npm run test:run            # all tests once (use this for verification)
npm test                    # vitest watch mode (interactive only)
npx tsc --noEmit            # typecheck (strict)
npm audit --omit=dev        # dependency vulnerability check
```

- `PORT` overrides the default 3000.
- Definition of done (all must pass): `npx tsc --noEmit`, `npm run test:run`, `npm audit --omit=dev` shows no high/critical issues.
- Never run `npm test` (watch mode) in non-interactive contexts.

## Current state vs target

Claude Code must not assume a target item exists. Check the code first, and implement target items only when asked or when touching that area.

| Area             | Current         | Target standard                                       |
| ---------------- | --------------- | ----------------------------------------------------- |
| Storage          | in-memory`Map`  | swap behind a repository interface before adding a DB |
| Auth             | none            | JWT/OAuth2 bearer, per-route authorization            |
| Security headers | none            | `helmet`                                              |
| CORS             | none            | explicit origin allowlist                             |
| Rate limiting    | none            | `express-rate-limit` (stricter on writes)             |
| Body size limit  | Express default | `express.json({ limit: '10kb' })`                     |
| Logging          | none            | structured JSON (pino) with request IDs               |
| Config           | `PORT` only     | Zod-validated env at startup, fail fast               |
| Shutdown         | none            | graceful on SIGTERM/SIGINT                            |
| Lint/format      | none            | ESLint + Prettier, enforced in CI                     |

## Architecture

Production-ready layered structure: routes (HTTP) → services (business logic) → repositories (storage).

```
src/app.ts                            Express app: middleware + router mounting. Exports `app`. Never calls listen().
src/server.ts                         Entry point only: import app, listen(), handle shutdown signals.
src/routes/orders.routes.ts           HTTP handlers: parse requests, call service, map responses
src/routes/orders.routes.test.ts      Integration tests (vitest + supertest)
src/services/orders.service.ts        Business logic: validates, throws AppError, never touches Express/storage
src/repositories/orders.repository.ts Repository interface + in-memory Map implementation. Services never touch storage directly.
src/schemas/orders.schema.ts          Zod schemas: single source of truth. Validate body, params, query.
src/errors/app-error.ts               Custom error class (status, code, message, details). Shared.
src/middleware/error-handler.ts       Central 4-arg error handler. Catches all AppError and unexpected errors.
src/middleware/async-handler.ts       Wraps async handlers to forward promise rejections to error middleware.
src/middleware/validate.ts            Zod validation middleware for body and params. Applies defaults.
```

Endpoints:

- `GET /health`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders` body `{ customerId, amount, status?, createdAt? }`
- `PUT /api/orders/:id` partial or full update
- `DELETE /api/orders/:id`

Request flow: middleware (security, parsing, logging) -> router -> Zod parse -> handler -> store -> response. Errors go to one central error-handling middleware registered last in `app.ts`.

Layering rule when the code grows: route (HTTP only) -> service (business logic) -> repository (storage). Routes never touch storage directly once a service layer exists.

## Conventions

### Code

- TypeScript strict. No `any`; use `unknown` and narrow. Derive types from Zod: `z.infer<typeof Schema>`. Zod is the single source of truth, with no parallel hand-written interfaces.
- Prefer `async/await`. Wrap async handlers so rejections reach the error middleware (Express 4 does not catch them automatically).
- Keep `app.ts` free of business logic. New resources get a file in `src/routes/` mounted under `/api/<resource>`.
- Minimal, scoped changes. No unrelated refactors in the same change.

### API contract

- API design rules: see .claude/rules/api-design.md

### Testing

- Colocate `*.test.ts` next to code. Test over HTTP with supertest against the exported `app`.
- Every endpoint change covers: success, validation failure (400), not-found (404), and auth failure (401/403) once auth exists.
- Tests must be independent: reset store state in `beforeEach`. No reliance on execution order.
- Bug fix = failing test first, then the fix.

### Git / PR

- Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`). Small, single-purpose PRs.
- CI runs: `npm ci`, typecheck, tests, `npm audit --omit=dev`. A red pipeline blocks merge.
- Update this file when commands, structure, or conventions change.

## Security

- **Validate all input** with Zod at the boundary: body, params, query. Use `.strict()` on object schemas to reject unknown fields (prevents mass assignment).
- **Never trust client data for identity or ownership.** When auth is added, derive `customerId` from the token, not the request body, and check the caller owns the order on every read/update/delete (prevents IDOR).
- **Secrets** come from environment variables only. Commit `.env.example` with placeholder values; never commit `.env`. Never hardcode keys, tokens, or connection strings.
- **Errors**: return generic messages on 500. Log details server-side; never return stack traces, internal paths, or raw exception messages to clients.
- **Logging**: never log secrets, tokens, or full request bodies containing personal data. Redact sensitive fields.
- **Headers/transport**: `helmet`, explicit CORS allowlist (never `*` with credentials), HTTPS terminated at the proxy, `app.disable('x-powered-by')`.
- **Abuse protection**: rate limit all routes, stricter on `POST/PUT/DELETE`. Cap request body size.
- **Dependencies**: commit the lockfile, run `npm audit` in CI, add dependencies only with approval and prefer well-maintained packages. Pin the Node version via `.nvmrc`/`engines`.
- **No dynamic code execution**: no `eval`, `new Function`, or shell calls built from user input.

## Observability and operations

- `GET /health` = liveness (process up). Add `GET /ready` when dependencies exist (readiness).
- Structured JSON logs with a per-request ID (accept `X-Request-Id` or generate one; echo it in the response).
- Graceful shutdown: on SIGTERM/SIGINT stop accepting connections, finish in-flight requests, then exit with a timeout.
- Config is validated once at startup with Zod. Missing or invalid env = crash immediately with a clear message.

## Do not

- Do not import `src/server.ts` in tests (binds a port). Import `app` from `src/app.ts`.
- Do not skip or weaken Zod validation to make a test pass.
- Do not add a database, ORM, or persistence layer without explicit approval.
- Do not add dependencies without explicit approval.
- Do not return stack traces or internal error messages to clients.
- Do not use `console.log` in committed code; use the logger.
- Do not use `any`, `@ts-ignore`, or `@ts-expect-error` without a comment explaining why.
- Do not use floats for money.
- Do not accept `customerId`/ownership from the client once auth exists.
- Do not commit `.env`, secrets, or real customer data (including in test fixtures).
- Do not use `cors({ origin: '*' })` in production code.
- Do not change the tsconfig exclusion of test files from the dist build.
- Do not disable or delete failing tests to get a green run.
- Do not change response shapes or status codes of existing endpoints without flagging it as a breaking change.

## Gotchas

- In-memory store: state is shared across tests in one run and lost on restart. Reset the `Map` in `beforeEach`. Also, it is not safe for multiple instances: running 2+ replicas gives each its own data.
- `type: commonjs` with ES2020 code: ESM-only packages cannot be `require`d. Check a package's module format before installing.
- `tsx` (dev) does not typecheck. A running dev server does not mean the code compiles; run `npx tsc --noEmit`.
- Tests are excluded from `dist`, so test-only type errors will not fail a build. The typecheck command catches them.
- `PUT` accepts partial bodies, so it behaves like PATCH. Preserve this unless told otherwise.
- `status` and `createdAt` are optional on create; defaults are applied in the route. Read the handler before changing them.
- Express 4 does not forward rejected promises from async handlers to the error middleware. Wrap handlers or use a helper, otherwise requests hang.
- The error middleware must be registered after all routes, and must have four parameters `(err, req, res, next)` to be recognized by Express.
- Zod errors must be mapped to the standard 400 error shape explicitly; do not let them fall through to 500.
