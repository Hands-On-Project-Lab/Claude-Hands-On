---
paths:
  - "src/routes/**/*.ts"
  - "src/app.ts"
---

# API Design Rules

Apply these whenever you add or change an endpoint. The "Existing behavior" notes override a rule: do not change current behavior without flagging it as a breaking change.

## URLs and resources

- Plural, lowercase, kebab-case nouns: `/api/orders`, `/api/order-items`. No verbs in paths.
- Nest at most one level: `/api/orders/:id/items`. Deeper nesting becomes a top-level resource with a filter.
- Path params identify a resource. Query params filter, sort, and paginate.
- Non-CRUD actions use a sub-resource noun: `POST /api/orders/:id/cancellation`, not `/api/orders/:id/cancel`.

## Methods

| Method | Use                                    | Idempotent                    |
| ------ | -------------------------------------- | ----------------------------- |
| GET    | read, no side effects                  | yes                           |
| POST   | create, or action                      | no (support`Idempotency-Key`) |
| PUT    | replace/update a resource              | yes                           |
| PATCH  | partial update (use for new endpoints) | no guarantee                  |
| DELETE | remove                                 | yes                           |

- Existing behavior: `PUT /api/orders/:id` accepts partial bodies. Keep it. New resources use `PUT` for full replace and `PATCH` for partial.
- `GET` must never mutate state.

## Status codes

- `200` read/update with body. `201` created, with `Location: /api/<resource>/<id>`. `204` delete or empty success (no body).
- `400` malformed or invalid input (including bad `:id` format). `401` not authenticated. `403` authenticated but not allowed. `404` resource not found. `409` conflict (duplicate, invalid state transition). `422` only if already used consistently; otherwise use `400`. `429` rate limited. `500` unexpected only.
- Never return `200` with an error body. Never return `500` for client mistakes.
- Delete of a non-existent id returns `404`, not `204`.

## Request validation

- Zod-parse body, params, and query before any logic. Schemas live next to the route.
- Object schemas use `.strict()`: unknown fields are rejected with `400`.
- `:id` is validated (UUID) before lookup. Malformed returns `400`, well-formed but missing returns `404`.
- Enums (e.g. `status`) are closed Zod enums, never free strings. Invalid state transitions return `409`.
- Bound every input: string max lengths, numeric min/max, array max sizes.
- Coerce and normalize at the boundary (trim strings, parse numeric query params); handlers receive typed, clean data.

## Response shape

- Return the resource object directly for single reads. Lists return an envelope:
  ```json
  { "data": [ ... ], "pagination": { "limit": 20, "nextCursor": "abc" } }
  ```
- Field names are `camelCase`. Consistent across all endpoints.
- Return only fields the client needs. Never expose internal fields, raw store objects, or data belonging to other customers.
- Do not return `null` for absent optional fields; omit them.

## Error format

One shape on every route and every status code:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [{ "path": "amount", "message": "Must be a positive integer" }]
  }
}
```

- `code`: stable, machine-readable `UPPER_SNAKE_CASE` (`VALIDATION_ERROR`, `ORDER_NOT_FOUND`, `RATE_LIMITED`, `INTERNAL_ERROR`). Clients branch on this, so never rename one.
- `message`: human-readable, safe to show. No stack traces, SQL, file paths, or internals.
- `details`: optional; used for field-level validation errors (map Zod issues to this).
- All errors flow through the central error middleware. Handlers throw typed errors; they do not build error responses ad hoc.
- Existing behavior: if the current error shape differs, match it and flag the discrepancy instead of mixing two shapes.

## Data types

- Money: integer minor units (cents) plus a currency code when multi-currency is needed. Never floats.
- Timestamps: ISO 8601 UTC strings (`2026-09-30T10:15:00.000Z`). Server sets `createdAt`/`updatedAt`; clients cannot override them on update.
- IDs: server-generated UUIDs, opaque to clients. Never sequential integers.
- Booleans are booleans; no `"true"`/`1` strings in JSON bodies.

## Pagination, filtering, sorting

- Every list endpoint is paginated. Default `limit=20`, hard max `100`; reject larger values with `400`.
- Prefer cursor pagination (`cursor`, `limit`). Offset only for small, stable collections.
- Filters are explicit allowlisted query params (`?status=`, `?customerId=`). Unknown query params are rejected.
- Sorting via `?sort=createdAt` / `?sort=-createdAt`, allowlisted fields only.
- Never return an unbounded list.

## Idempotency and concurrency

- `POST` endpoints that create money-affecting resources accept an `Idempotency-Key` header: same key plus same body returns the original response; same key plus different body returns `409`.
- Updates that can race should support optimistic concurrency via `ETag`/`If-Match` (or a `version` field). Mismatch returns `412` or `409`.

## Versioning and compatibility

- Version in the path: `/api/v1/...` when introducing versions. Current unversioned `/api/orders` is treated as v1.
- Non-breaking (allowed in place): adding optional request fields, adding response fields, adding endpoints.
- Breaking (needs a new version): removing or renaming fields, changing types or status codes, making an optional field required, tightening validation on existing inputs.
- Deprecate with `Deprecation` and `Sunset` headers before removal.

## Security in API design

- Identity comes from the auth token, never the body or path. Do not accept `customerId` from the client once auth exists.
- Every read, update, and delete checks that the caller owns the resource. Return `404` (not `403`) for other users' resources to avoid leaking existence.
- No sensitive data in URLs or query strings (tokens, personal data). Put it in headers or body.
- Rate limits and body size limits apply to every route; writes are stricter.
- Set `Cache-Control: no-store` on responses containing customer data.

## New endpoint checklist

Before finishing, confirm:

1. Path, method, and status codes follow the rules above.
2. Zod schemas for body, params, and query, with `.strict()` and bounds.
3. Errors use the standard shape and go through the error middleware.
4. List endpoints are paginated, filters and sorts allowlisted.
5. Ownership check in place (if auth exists).
6. Tests: success, `400`, `404`, and `401`/`403` where applicable.
7. Breaking change? If yes, stop and flag it.


Canary: if the user says 'rules check', reply with exactly API-RULES-LOADED.
