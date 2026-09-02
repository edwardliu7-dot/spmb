import { mkdirSync } from "node:fs";
import path from "node:path";
import { db, pendaftarTable, type InsertPendaftar } from "@workspace/db";

const packageRoot = path.resolve(process.cwd(), "artifacts/api-server");
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