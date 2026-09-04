import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import {
  db,
  pendaftarTable,
  type InsertPendaftar,
} from "@workspace/db";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.basename(moduleDirectory) === "lib"
  ? path.resolve(moduleDirectory, "../..")
  : path.resolve(moduleDirectory, "..");
export const uploadsDirectory = path.join(packageRoot, "uploads");

mkdirSync(uploadsDirectory, { recursive: true });

export async function insertPendaftar(values: InsertPendaftar) {
  const [created] = await db
    .insert(pendaftarTable)
    .values(values)
    .returning({ id: pendaftarTable.id });

  if (!created) {
    throw new Error("Pendaftar tidak berhasil dibuat.");
  }

  return created;
}

export async function listPendaftar(filters: {
  search?: string;
  jenjang?: string;
  status?: string;
  allowedJenjang?: readonly string[];
}) {
  const conditions = [];
  const search = filters.search?.trim();

  if (search) {
    conditions.push(
      or(
        ilike(pendaftarTable.nama_calon, `%${search}%`),
        sql`CAST(${pendaftarTable.id} AS TEXT) ILIKE ${`%${search}%`}`,
      ),
    );
  }

  if (filters.jenjang && filters.jenjang !== "Semua") {
    conditions.push(eq(pendaftarTable.jenjang, filters.jenjang));
  }

  if (filters.status && filters.status !== "Semua") {
    conditions.push(eq(pendaftarTable.status, filters.status));
  }

  if (filters.allowedJenjang?.length) {
    conditions.push(inArray(pendaftarTable.jenjang, [...filters.allowedJenjang]));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const items = await db
    .select({
      id: pendaftarTable.id,
      nama_calon: pendaftarTable.nama_calon,
      jenjang: pendaftarTable.jenjang,
      nama_sekolah_asal: pendaftarTable.nama_sekolah_asal,
      email: pendaftarTable.email,
      status: pendaftarTable.status,
      created_at: pendaftarTable.created_at,
    })
    .from(pendaftarTable)
    .where(where)
    .orderBy(desc(pendaftarTable.created_at), desc(pendaftarTable.id));

  return { items, total: items.length };
}

export async function getPendaftar(id: number) {
  const [item] = await db
    .select()
    .from(pendaftarTable)
    .where(eq(pendaftarTable.id, id))
    .limit(1);
  return item;
}

export async function updatePendaftarStatus(
  id: number,
  status: string,
) {
  const [item] = await db
    .update(pendaftarTable)
    .set({ status })
    .where(eq(pendaftarTable.id, id))
    .returning({
      id: pendaftarTable.id,
      status: pendaftarTable.status,
    });
  return item;
}