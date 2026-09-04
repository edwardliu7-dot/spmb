import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function resolveDatabaseUrl(): string {
  // DATABASE_URL is the canonical runtime-managed name. REPLIT_DB_URL is
  // retained as a runtime compatibility fallback for existing API workflows.
  const candidates = [process.env.DATABASE_URL, process.env.REPLIT_DB_URL]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "postgres:" || parsed.protocol === "postgresql:") {
        return candidate;
      }
    } catch {
      // Some managed workflows expose the same database through PG* vars.
    }
  }

  const host = process.env.PGHOST?.trim();
  const port = process.env.PGPORT?.trim();
  const database = process.env.PGDATABASE?.trim();
  const user = process.env.PGUSER?.trim();
  const password = process.env.PGPASSWORD;
  if (host && port && database && user && password) {
    const url = new URL("postgresql://localhost");
    url.hostname = host;
    url.port = port;
    url.pathname = `/${database}`;
    url.username = user;
    url.password = password;
    // The development PostgreSQL endpoint exposed through PG* is local and
    // does not advertise SSL; a complete DATABASE_URL remains untouched.
    url.searchParams.set("sslmode", "disable");
    return url.toString();
  }

  if (candidates.length) {
    throw new Error(
      "DATABASE_URL tidak valid untuk koneksi PostgreSQL dan detail PG* tidak lengkap.",
    );
  }
  throw new Error(
    "Koneksi PostgreSQL tidak tersedia. Pastikan database sudah terhubung ke layanan API.",
  );
}

const databaseUrl = resolveDatabaseUrl();

export const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
