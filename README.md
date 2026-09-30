# Orders API

A production-ready Express.js REST API built with TypeScript, Zod validation, and a clean layered architecture (Routes → Services → Repositories).

## Features

- **Type-Safe**: Full TypeScript with strict mode enabled
- **Validation**: Zod schema validation at all boundaries (body, params, query)
- **Layered Architecture**: Clean separation of concerns (HTTP → Business Logic → Storage)
- **Error Handling**: Centralized error handling with standard error responses
- **Security**: Helmet for HTTP headers, request body size limits, input validation
- **Testing**: Comprehensive integration tests with vitest + supertest
- **Production Ready**: Graceful error handling, proper logging structure, security best practices

## Architecture

```
src/
├── app.ts                          Express app configuration
├── server.ts                       Entry point: listen() and graceful shutdown
├── routes/
│   ├── orders.routes.ts            HTTP handlers (request → response)
│   └── orders.routes.test.ts       Integration tests
├── services/
│   └── orders.service.ts           Business logic layer
├── repositories/
│   └── orders.repository.ts        Data access layer (interface + in-memory implementation)
├── schemas/
│   └── orders.schema.ts            Zod schemas (single source of truth)
├── middleware/
│   ├── error-handler.ts            Central error handling
│   ├── async-handler.ts            Async handler wrapper (ensures rejections reach error middleware)
│   └── validate.ts                 Zod validation middleware
└── errors/
    └── app-error.ts                Custom error class
```

### Request Flow

```
HTTP Request → Middleware (security, parsing) → Validation → Handler → Service → Repository
↓
Response ← Error Handler (catches errors at any layer)
```

## Installation

```bash
npm install
```

## Development

### Start dev server with auto-reload

```bash
npm run dev
# Server runs at http://localhost:3000
# Port can be overridden: PORT=8080 npm run dev
```

### Run tests

```bash
npm run test:run        # Run all tests once (use in CI/CD)
npm test                # Interactive watch mode (development only)
```

### Type checking

```bash
npx tsc --noEmit        # Strict TypeScript checks (no output)
```

### Security audit

```bash
npm audit --omit=dev    # Check for vulnerabilities (no dev dependencies)
```

## API Endpoints

All endpoints require `Content-Type: application/json` headers.

### Health Check

```http
GET /health
```

Response:
```json
{ "status": "ok" }
```

### List Orders

```http
GET /api/orders
```

Response:
```json
{
  "data": [
    {
      "id": "abc12345",
      "customerId": "cust1",
      "amount": 1000,
      "status": "pending",
      "createdAt": "2026-10-01T10:00:00.000Z",
      "updatedAt": "2026-10-01T10:00:00.000Z"
    }
  ]
}
```

### Get Order by ID

```http
GET /api/orders/:id
```

Response (200):
```json
{
  "id": "abc12345",
  "customerId": "cust1",
  "amount": 1000,
  "status": "pending",
  "createdAt": "2026-10-01T10:00:00.000Z",
  "updatedAt": "2026-10-01T10:00:00.000Z"
}
```

Error (404):
```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found"
  }
}
```

### Create Order

```http
POST /api/orders
Content-Type: application/json

{
  "customerId": "cust1",
  "amount": 1000,
  "status": "pending"
}
```

- `customerId` (required): Customer identifier
- `amount` (required): Order amount in cents (positive integer)
- `status` (optional): `pending` | `completed` | `cancelled` (default: `pending`)

Response (201):
```json
{
  "id": "abc12345",
  "customerId": "cust1",
  "amount": 1000,
  "status": "pending",
  "createdAt": "2026-10-01T10:00:00.000Z",
  "updatedAt": "2026-10-01T10:00:00.000Z"
}
```

### Update Order

```http
PUT /api/orders/:id
Content-Type: application/json

{
  "customerId": "cust2",
  "amount": 2000,
  "status": "completed"
}
```

All fields are optional. Omitted fields preserve their current values.

Response (200):
```json
{
  "id": "abc12345",
  "customerId": "cust2",
  "amount": 2000,
  "status": "completed",
  "createdAt": "2026-10-01T10:00:00.000Z",
  "updatedAt": "2026-10-01T10:00:00.000Z"
}
```

### Delete Order

```http
DELETE /api/orders/:id
```

Response (204 No Content):
```
[empty body]
```

## Error Handling

All errors follow a standard format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [
      {
        "path": "fieldName",
        "message": "Field-specific error"
      }
    ]
  }
}
```

### Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200  | Success (read/update) | GET order, PUT order |
| 201  | Created | POST order |
| 204  | Success (no body) | DELETE order |
| 400  | Invalid input | Missing field, wrong type, unknown fields |
| 404  | Not found | Order ID doesn't exist |
| 500  | Internal error | Unexpected server error |

### Common Error Codes

- `VALIDATION_ERROR`: Request body/params validation failed
- `ORDER_NOT_FOUND`: Order ID doesn't exist
- `INTERNAL_ERROR`: Unexpected server error

## Production Best Practices

### Security

- **Input Validation**: All inputs are validated with Zod before processing
- **Strict Schemas**: Object schemas use `.strict()` to reject unknown fields (prevents mass assignment)
- **Body Size Limits**: Max 10KB request body size to prevent abuse
- **Security Headers**: Helmet.js adds protection headers (X-Frame-Options, X-Content-Type-Options, etc.)
- **No Stack Traces**: Error responses never expose stack traces or internal details
- **Disabled Fingerprinting**: X-Powered-By header disabled

### Error Handling

- **Centralized**: All errors flow through a single error handler middleware
- **Typed**: Custom `AppError` class with status code, error code, and message
- **Safe**: No raw exception messages or internal details in responses
- **Logged**: Details logged server-side (ready for structured logging integration)

### Code Quality

- **Type Safety**: Strict TypeScript mode, no `any` types
- **Async Safety**: All async handlers wrapped with `asyncHandler` to catch promise rejections
- **Single Source of Truth**: Zod schemas define request/response shape
- **Separation of Concerns**: 
  - Routes handle HTTP only
  - Services contain business logic
  - Repositories handle data access
  - Middleware handles cross-cutting concerns

### Testing

- **Integration Tests**: Test via HTTP with real request/response cycle
- **Independent Tests**: Each test resets shared state (in-memory store)
- **Coverage**: All endpoints tested (success, validation errors, not found)
- **No Mocks**: Tests hit real implementation (builds confidence)

## Environment Configuration

Currently, the API accepts the following environment variables:

- `PORT`: Server port (default: 3000)

### Future: Environment Validation

Add a `.env.example` file with placeholder values:
```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

Use Zod to validate environment at startup (fail fast if missing/invalid).

## Database Migration

The current implementation uses an in-memory Map for storage. To add a database:

1. **Create a new repository implementation** that implements the `IOrderRepository` interface
2. **Update `orderRepository` export** to use the new implementation
3. **Services and routes need no changes** (thanks to layered architecture)

Example:
```typescript
// repositories/orders.postgres.ts
export const orderRepository: IOrderRepository = {
  async findAll() {
    return db.query('SELECT * FROM orders');
  },
  // ... implement other methods
};
```

## Deployment

### Pre-deployment Checklist

```bash
# 1. Verify all tests pass
npm run test:run

# 2. Verify type safety
npx tsc --noEmit

# 3. Check for security vulnerabilities
npm audit --omit=dev

# 4. Review environment setup
cat .env.example
```

### Running in Production

```bash
npm ci                    # Clean install (use in CI/CD)
npm run build            # (add if you want to pre-compile TypeScript)
npm start                # Start the server
```

### Health Checks

```bash
curl http://localhost:3000/health
# { "status": "ok" }
```

## Extending the API

### Adding a New Endpoint

1. Create schema in `src/schemas/resource.schema.ts`
2. Create repository interface in `src/repositories/resource.repository.ts`
3. Create service in `src/services/resource.service.ts`
4. Create routes in `src/routes/resource.routes.ts`
5. Add tests in `src/routes/resource.routes.test.ts`
6. Mount router in `src/app.ts` before error middleware

### Adding Middleware

1. Create middleware function in `src/middleware/`
2. Add to `app.use()` in `src/app.ts` in the correct order
3. Remember: middleware order matters! (validation before routes, error handler last)

## Troubleshooting

### Tests fail with "Order not found"

**Cause**: Tests are not independent or store isn't reset between tests.

**Fix**: Ensure `beforeEach` calls `resetOrderStore()` to clear state.

### Validation passes but defaults aren't applied

**Cause**: The validate middleware wasn't storing parsed data in `req.body`.

**Fix**: Ensure `validate` middleware does `req.body = schema.parse(req.body)`.

### Async errors cause hanging requests

**Cause**: Async handler not wrapped with `asyncHandler`.

**Fix**: Wrap all async route handlers: `asyncHandler(async (req, res) => { ... })`.

### TypeScript errors with `req.params.id`

**Cause**: Express types allow `req.params.id` to be `string | string[]`.

**Fix**: Convert to string: `const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id`.

## License

ISC
