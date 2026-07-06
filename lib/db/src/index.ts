import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Prefer NEON_DATABASE_URL (explicit Neon connection) over DATABASE_URL
// (which Replit may auto-populate with its own managed Postgres).
// On Render, set DATABASE_URL to your Neon connection string.
const connectionString =
  process.env["NEON_DATABASE_URL"] ?? process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error(
    "NEON_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
