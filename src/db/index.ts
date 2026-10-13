import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

function buildPoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;
  // During `next build` DATABASE_URL may be missing — use a dummy so imports don't crash.
  // Real queries will fail loudly at runtime if it's still missing.
  const connectionString =
    databaseUrl ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
  const needsSsl =
    /sslmode=require/i.test(connectionString) ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co") ||
    process.env.PGSSL === "1" ||
    process.env.VERCEL === "1";

  return {
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
}

const globalForDb = globalThis as typeof globalThis & {
  __rizzFadePool?: Pool;
};

export const pool: Pool =
  globalForDb.__rizzFadePool ?? new Pool(buildPoolConfig());

if (process.env.NODE_ENV !== "production") {
  globalForDb.__rizzFadePool = pool;
}

export const db = drizzle(pool);
