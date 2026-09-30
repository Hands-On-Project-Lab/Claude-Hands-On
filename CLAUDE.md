# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**orders-api** is a lightweight REST API built with Express.js and TypeScript for managing customer orders. It implements CRUD operations on orders with runtime validation using Zod.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (auto-reload with tsx)
npm run dev

# Run tests once
npm run test:run

# Run tests in watch mode
npm test
```

The development server runs on `http://localhost:3000` by default. Set `PORT` environment variable to override.

## Architecture

### Directory Structure
- **src/app.ts** — Express app configuration and middleware setup
- **src/server.ts** — Server startup (listens on port 3000)
- **src/routes/orders.ts** — Orders API routes and business logic
- **src/routes/orders.test.ts** — Integration tests for orders routes

### Design Patterns

1. **Router-based organization** — Orders are handled via an Express Router under `/api/orders` prefix
2. **In-memory storage** — Orders stored in a Map (no database); data resets on restart
3. **Zod validation** — Request bodies validated with Zod schemas before processing
4. **Error handling** — Validation errors return 400; missing resources return 404; unknown errors return 500

### Key APIs

- `GET /api/orders` — List all orders
- `GET /api/orders/:id` — Retrieve a specific order
- `POST /api/orders` — Create a new order (body: `{customerId, amount, status?, createdAt?}`)
- `PUT /api/orders/:id` — Update an order (partial or full updates)
- `DELETE /api/orders/:id` — Delete an order
- `GET /health` — Health check endpoint

## Testing

Tests use **vitest** with **supertest** for HTTP assertions. Run tests with `npm test` (watch mode) or `npm run test:run` (single run).

When adding features, colocate tests in `*.test.ts` files alongside the code being tested. The tsconfig excludes test files from the dist build.

## Notes

- The project uses `type: commonjs` in package.json but leverages modern ES2020 features
- TypeScript strict mode is enabled
- Port is configurable via `PORT` environment variable (defaults to 3000)
