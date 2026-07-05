---
name: DB URL precedence
description: How the project resolves the PostgreSQL connection string — Neon vs. Replit-managed.
---

# Database URL Precedence

Both `lib/db/src/index.ts` and `lib/db/drizzle.config.ts` use:

```typescript
const connectionString = process.env["NEON_DATABASE_URL"] ?? process.env["DATABASE_URL"];
```

**Why:** Replit's runtime auto-populates `DATABASE_URL` with its own managed Postgres. The user's project uses Neon and deploys to Render. Preferring `NEON_DATABASE_URL` ensures local dev in Replit hits the right database. On Render, set `DATABASE_URL` to the Neon connection string (no `NEON_DATABASE_URL` needed there).
