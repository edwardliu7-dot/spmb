import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function resolveDatabaseUrl(): string {
  // DATABASE_URL is the canonical runtime-managed name. REPLIT_DB_URL is
  // retained as a runtime compatibility fallback for existing API workflows.
  const databaseUrl =
    process.env.DATABASE_URL?.trim() || process.env.REPLIT_DB_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      "Koneksi PostgreSQL tidak tersedia. Pastikan database sudah terhubung ke layanan API.",
    );
  }

  try {
    const parsed = new URL(databaseUrl);
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
      throw new Error("protocol");
    }
  } catch {
    throw new Error("DATABASE_URL tidak valid untuk koneksi PostgreSQL.");
  }

  return databaseUrl;
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
