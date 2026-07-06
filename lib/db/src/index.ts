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

// If the connection string declares any SSL mode, explicitly pass
// ssl: { rejectUnauthorized: true } (verify-full semantics) to suppress
// the pg-connection-string v2 deprecation warning about sslmode aliases.
const sslRequired = /sslmode=(require|prefer|verify-ca|verify-full)/i.test(
  connectionString ?? "",
);
export const pool = new Pool({
  connectionString,
  ...(sslRequired ? { ssl: { rejectUnauthorized: true } } : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
