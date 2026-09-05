import { readFile } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { applicationFileTable, db } from "@workspace/db";
import { resolveStoredUpload } from "./upload-storage";

export const applicationDocumentFields = [
  "foto_3x4",
  "akte_lahir",
  "kartu_keluarga",
  "ktp_orangtua",
  "bukti_bayar",
] as const;

export type ApplicationDocumentField = (typeof applicationDocumentFields)[number];

export type ApplicationFileInput = {
  field: ApplicationDocumentField;
  originalName: string;
  mimeType: string;
  data: Buffer;
};

export type ApplicationFileData = {
  originalName: string;
  mimeType: string;
  data: Buffer;
};

export async function getApplicationFile(
  applicationId: number,
  field: ApplicationDocumentField,
): Promise<ApplicationFileData | null> {
  try {
    const [file] = await db
      .select({
        originalName: applicationFileTable.original_name,
        mimeType: applicationFileTable.mime_type,
        data: applicationFileTable.data,
      })
      .from(applicationFileTable)
      .where(and(
        eq(applicationFileTable.application_id, applicationId),
        eq(applicationFileTable.field, field),
      ))
      .limit(1);

    return file ?? null;
  } catch {
    // Older deployments may not have the additive table yet. Legacy paths
    // remain readable until the schema is synchronized.
    return null;
  }
}

export async function getApplicationFileFields(applicationId: number): Promise<Set<ApplicationDocumentField>> {
  let rows: Array<{ field: string }>;
  try {
    rows = await db
      .select({ field: applicationFileTable.field })
      .from(applicationFileTable)
      .where(eq(applicationFileTable.application_id, applicationId));
  } catch {
    return new Set();
  }

  return new Set(
    rows
      .map((row) => row.field)
      .filter((field): field is ApplicationDocumentField =>
        applicationDocumentFields.includes(field as ApplicationDocumentField),
      ),
  );
}

export async function readApplicationFile(
  applicationId: number,
  field: ApplicationDocumentField,
  legacyPath: unknown,
): Promise<ApplicationFileData | null> {
  const storedFile = await getApplicationFile(applicationId, field);
  if (storedFile) return storedFile;

  const filePath = resolveStoredUpload(legacyPath);
  if (!filePath) return null;

  try {
    return {
      originalName: filePath.split(/[\\/]/).at(-1) || `${field}.bin`,
      mimeType: "application/octet-stream",
      data: await readFile(filePath),
    };
  } catch {
    return null;
  }
}