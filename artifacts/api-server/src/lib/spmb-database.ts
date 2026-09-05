import { unlink } from "node:fs/promises";
import path from "node:path";
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
  applicationFileTable,
  applicationStatusHistoryTable,
  committeeAuditLogTable,
  committeeNotificationReadTable,
  committeeNotificationTable,
  pendaftarTable,
  type InsertPendaftar,
  type Pendaftar,
} from "@workspace/db";
import type { ApplicationFileInput } from "./application-files";
import { logger } from "./logger";
import { resolveStoredUpload, uploadsDirectory } from "./upload-storage";
import { getQuotaDefinition, RegistrationQuotaFullError } from "./registration-quota";

export { uploadsDirectory } from "./upload-storage";

const storedDocumentFields = [
  "foto_3x4_path",
  "akte_lahir_path",
  "kartu_keluarga_path",
  "ktp_orangtua_path",
  "bukti_bayar_path",
] as const;

type SchemaMetadata = {
  pendaftarColumns: Set<string>;
  tables: Set<string>;
};

let schemaMetadataPromise: Promise<SchemaMetadata> | undefined;

async function getSchemaMetadata(): Promise<SchemaMetadata> {
  if (!schemaMetadataPromise) {
    schemaMetadataPromise = (async () => {
      const [columnResult, tableResult] = await Promise.all([
        db.execute(sql`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'pendaftar'
        `),
        db.execute(sql`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
        `),
      ]);
      const columns = columnResult.rows as Array<{ column_name: string }>;
      const tables = tableResult.rows as Array<{ table_name: string }>;
      return {
        pendaftarColumns: new Set(columns.map((row) => row.column_name)),
        tables: new Set(tables.map((row) => row.table_name)),
      };
    })();
  }
  return schemaMetadataPromise;
}

export async function insertPendaftar(values: InsertPendaftar, files: ApplicationFileInput[] = []) {
  const { pendaftarColumns, tables } = await getSchemaMetadata();
  const compatibleValues = Object.fromEntries(
    Object.entries(values).filter(([key]) => pendaftarColumns.has(key)),
  ) as InsertPendaftar;
  const created = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(2027202701)`);
    const quotaDefinition = getQuotaDefinition(values.jenjang);
    if (quotaDefinition?.quota !== null && quotaDefinition?.quota !== undefined) {
      const [levelCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(pendaftarTable)
        .where(eq(pendaftarTable.jenjang, values.jenjang));
      if (Number(levelCount?.count || 0) >= quotaDefinition.quota) {
        throw new RegistrationQuotaFullError(values.jenjang, null, quotaDefinition.quota);
      }

      if (quotaDefinition.genderQuotas) {
        const genderQuota = quotaDefinition.genderQuotas[values.jenis_kelamin as keyof typeof quotaDefinition.genderQuotas];
        if (genderQuota) {
          const [genderCount] = await tx
            .select({ count: sql<number>`count(*)` })
            .from(pendaftarTable)
            .where(and(
              eq(pendaftarTable.jenjang, values.jenjang),
              eq(pendaftarTable.jenis_kelamin, values.jenis_kelamin),
            ));
          if (Number(genderCount?.count || 0) >= genderQuota) {
            throw new RegistrationQuotaFullError(values.jenjang, values.jenis_kelamin, genderQuota);
          }
        }
      }
    }

    const [inserted] = await tx
      .insert(pendaftarTable)
      .values(compatibleValues)
      .returning({ id: pendaftarTable.id });

    if (!inserted) {
      throw new Error("Pendaftar tidak berhasil dibuat.");
    }

    if (files.length) {
      if (!tables.has("application_file")) {
        const error = new Error("Tabel penyimpanan berkas belum tersedia.");
        Object.assign(error, { code: "42P01" });
        throw error;
      }
      await tx.insert(applicationFileTable).values(files.map((file) => ({
        application_id: inserted.id,
        field: file.field,
        original_name: file.originalName,
        mime_type: file.mimeType || "application/octet-stream",
        data: file.data,
      })));
    }

    return inserted;
  });

  if (tables.has("committee_notification")) {
    try {
      await db.insert(committeeNotificationTable).values([
        {
          application_id: created.id,
          type: "new_application",
          title: "Pendaftar baru masuk",
          message: `${values.nama_calon} mengirim pengajuan baru.`,
          jenjang: values.jenjang,
        },
        {
          application_id: created.id,
          type: "document_review",
          title: "Berkas perlu diperiksa",
          message: `Periksa kelengkapan berkas ${values.nama_calon}.`,
          jenjang: values.jenjang,
        },
        {
          application_id: created.id,
          type: "not_verified",
          title: "Pengajuan belum diverifikasi",
          message: `${values.nama_calon} menunggu verifikasi panitia.`,
          jenjang: values.jenjang,
        },
      ]);
    } catch (error) {
      logger.warn({ err: error, applicationId: created.id }, "Optional committee notifications could not be created");
    }
  }

  return created;
}

export async function listPendaftar(filters: {
  search?: string;
  jenjang?: string;
  status?: string;
  from?: string;
  to?: string;
  allowedJenjang?: readonly string[];
}) {
  return queryApplicationList(filters);
}

function buildApplicationConditions(filters: {
  search?: string;
  jenjang?: string;
  status?: string;
  from?: string;
  to?: string;
  allowedJenjang?: readonly string[];
}) {
  const conditions = [];
  const search = filters.search?.trim();

  if (search) {
    const searchConditions = [
      ilike(pendaftarTable.nama_calon, `%${search}%`),
      sql`CAST(${pendaftarTable.id} AS TEXT) ILIKE ${`%${search}%`}`,
      ilike(pendaftarTable.nama_sekolah_asal, `%${search}%`),
      ilike(pendaftarTable.nomor_hp_orangtua, `%${search}%`),
    ];
    conditions.push(or(...searchConditions));
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

  if (filters.from) conditions.push(sql`${pendaftarTable.created_at} >= ${new Date(`${filters.from}T00:00:00.000Z`)}`);
  if (filters.to) {
    const end = new Date(`${filters.to}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    conditions.push(sql`${pendaftarTable.created_at} < ${end}`);
  }

  return conditions;
}

function isMissingSchemaColumn(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /column .* does not exist/i.test(message);
}

async function queryApplicationList(
  filters: {
    search?: string;
    jenjang?: string;
    status?: string;
    from?: string;
    to?: string;
    allowedJenjang?: readonly string[];
  },
) {
  const conditions = buildApplicationConditions(filters);
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
  try {
    const [item] = await db
      .select()
      .from(pendaftarTable)
      .where(eq(pendaftarTable.id, id))
      .limit(1);
    return item;
  } catch (error) {
    if (!isMissingSchemaColumn(error)) throw error;
    const result = await db.execute(sql`
      SELECT *
      FROM "pendaftar"
      WHERE "id" = ${id}
      LIMIT 1
    `);
    const [legacyItem] = result.rows as Array<Record<string, unknown>>;
    if (!legacyItem) return undefined;
    return {
      ...legacyItem,
      nik_ayah: legacyItem.nik_ayah ?? legacyItem.nik_orangtua ?? null,
      nik_ibu: legacyItem.nik_ibu ?? null,
    } as Pendaftar;
  }
}

export async function getPublicPendaftarStatus(id: number) {
  const [item] = await db
    .select({
      id: pendaftarTable.id,
      nama_calon: pendaftarTable.nama_calon,
      jenjang: pendaftarTable.jenjang,
      status: pendaftarTable.status,
      created_at: pendaftarTable.created_at,
    })
    .from(pendaftarTable)
    .where(eq(pendaftarTable.id, id))
    .limit(1);
  return item;
}

function resolveStoredUploadForDeletion(relativePath: unknown): string | null {
  return resolveStoredUpload(relativePath);
}

export async function deletePendaftar(id: number, deletedBy: string) {
  const application = await getPendaftar(id);
  if (!application) return null;

  const files = storedDocumentFields
    .map((field) => resolveStoredUploadForDeletion(application[field]))
    .filter((filePath): filePath is string => Boolean(filePath));
  const { tables } = await getSchemaMetadata();

  await db.transaction(async (tx) => {
    if (tables.has("committee_notification")) {
      await tx.delete(committeeNotificationTable)
        .where(eq(committeeNotificationTable.application_id, id));
    }
    if (tables.has("application_status_history")) {
      await tx.delete(applicationStatusHistoryTable)
        .where(eq(applicationStatusHistoryTable.application_id, id));
    }
    if (tables.has("committee_audit_log")) {
      await tx.insert(committeeAuditLogTable).values({
        username: deletedBy,
        action: "application_delete",
        application_id: id,
        details: `Menghapus pendaftar #${id}.`,
      });
    }

    const [deleted] = await tx.delete(pendaftarTable)
      .where(eq(pendaftarTable.id, id))
      .returning({ id: pendaftarTable.id });
    if (!deleted) throw new Error("Pendaftar tidak ditemukan.");
  });

  let filesRemoved = 0;
  for (const filePath of files) {
    try {
      await unlink(filePath);
      filesRemoved += 1;
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
      if (code !== "ENOENT") {
        logger.warn({ err: error, filePath }, "Berkas pendaftar tidak dapat dihapus setelah data dihapus");
      }
    }
  }

  return { id, filesRemoved };
}

export async function updatePendaftarStatus(
  id: number,
  status: string,
  changedBy: string,
) {
  const current = await getPendaftar(id);
  if (!current) return current;
  const { tables } = await getSchemaMetadata();
  const [item] = await db
    .update(pendaftarTable)
    .set({ status })
    .where(eq(pendaftarTable.id, id))
    .returning({
      id: pendaftarTable.id,
      status: pendaftarTable.status,
    });
  if (item && current.status !== status) {
    if (tables.has("application_status_history")) {
      try {
        await db.insert(applicationStatusHistoryTable).values({
          application_id: id,
          previous_status: current.status,
          next_status: status,
          changed_by: changedBy,
        });
      } catch (error) {
        logger.warn({ err: error, applicationId: id }, "Optional application status history could not be created");
      }
    }
    if (tables.has("committee_audit_log")) {
      try {
        await recordCommitteeAudit({
          username: changedBy,
          action: "status_change",
          applicationId: id,
          details: `${current.status} → ${status}`,
        });
      } catch (error) {
        logger.warn({ err: error, applicationId: id }, "Optional committee audit entry could not be created");
      }
    }
    if (tables.has("committee_notification")) {
      try {
        await db.insert(committeeNotificationTable).values({
          application_id: id,
          type: status === "Observasi" ? "observation" : "status_changed",
          title: status === "Observasi" ? "Pengajuan masuk tahap observasi" : "Status pengajuan berubah",
          message: `${current.nama_calon}: ${current.status} → ${status}.`,
          jenjang: current.jenjang,
        });
      } catch (error) {
        logger.warn({ err: error, applicationId: id }, "Optional committee notification could not be created");
      }
    }
  }
  return item;
}

export async function recordCommitteeAudit(input: {
  username: string;
  action: string;
  applicationId?: number;
  details?: string;
}) {
  const { tables } = await getSchemaMetadata();
  if (!tables.has("committee_audit_log")) return;
  await db.insert(committeeAuditLogTable).values({
    username: input.username,
    action: input.action,
    application_id: input.applicationId,
    details: input.details,
  });
}

export async function listNotifications(username: string, allowedJenjang: readonly string[], limit = 30) {
  const { tables } = await getSchemaMetadata();
  if (!tables.has("committee_notification") || !tables.has("committee_notification_read")) return [];
  const rows = await db
    .select({
      id: committeeNotificationTable.id,
      application_id: committeeNotificationTable.application_id,
      type: committeeNotificationTable.type,
      title: committeeNotificationTable.title,
      message: committeeNotificationTable.message,
      jenjang: committeeNotificationTable.jenjang,
      created_at: committeeNotificationTable.created_at,
      read_at: committeeNotificationReadTable.read_at,
       nama_calon: pendaftarTable.nama_calon,
    })
    .from(committeeNotificationTable)
    .leftJoin(
      committeeNotificationReadTable,
      and(
        eq(committeeNotificationReadTable.notification_id, committeeNotificationTable.id),
        eq(committeeNotificationReadTable.username, username),
      ),
    )
    .leftJoin(pendaftarTable, eq(pendaftarTable.id, committeeNotificationTable.application_id))
    .where(inArray(committeeNotificationTable.jenjang, [...allowedJenjang]))
    .orderBy(desc(committeeNotificationTable.created_at))
    .limit(limit);
  return rows.map((row) => ({ ...row, read: Boolean(row.read_at) }));
}

export async function markNotificationRead(notificationId: number, username: string) {
  const { tables } = await getSchemaMetadata();
  if (!tables.has("committee_notification_read")) return;
  await db.insert(committeeNotificationReadTable)
    .values({ notification_id: notificationId, username })
    .onConflictDoNothing();
}

export async function markAllNotificationsRead(username: string, allowedJenjang: readonly string[]) {
  const { tables } = await getSchemaMetadata();
  if (!tables.has("committee_notification") || !tables.has("committee_notification_read")) return 0;
  const unread = await db
    .select({ id: committeeNotificationTable.id })
    .from(committeeNotificationTable)
    .leftJoin(
      committeeNotificationReadTable,
      and(
        eq(committeeNotificationReadTable.notification_id, committeeNotificationTable.id),
        eq(committeeNotificationReadTable.username, username),
      ),
    )
    .where(and(
      inArray(committeeNotificationTable.jenjang, [...allowedJenjang]),
      sql`${committeeNotificationReadTable.id} IS NULL`,
    ));
  for (const item of unread) await markNotificationRead(item.id, username);
  return unread.length;
}

export async function listMasterPendaftar(filters: {
  search?: string;
  jenjang?: string;
  status?: string;
  from?: string;
  to?: string;
  allowedJenjang?: readonly string[];
}) {
  const rows = await db
    .select()
    .from(pendaftarTable)
    .where((() => {
      const conditions = buildApplicationConditions(filters);
      return conditions.length ? and(...conditions) : undefined;
    })())
    .orderBy(desc(pendaftarTable.created_at), desc(pendaftarTable.id));
  return rows;
}

export async function getObservationRows(filters: {
  jenjang?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  allowedJenjang?: readonly string[];
}) {
  const rows = await db
    .select({
       id: pendaftarTable.id,
      nama_calon: pendaftarTable.nama_calon,
      jenjang: pendaftarTable.jenjang,
      jenis_kelamin: pendaftarTable.jenis_kelamin,
      tanggal_lahir: pendaftarTable.tanggal_lahir,
      nama_sekolah_asal: pendaftarTable.nama_sekolah_asal,
      alamat_domisili: pendaftarTable.alamat_domisili,
      status: pendaftarTable.status,
      created_at: pendaftarTable.created_at,
      foto_3x4_path: pendaftarTable.foto_3x4_path,
      akte_lahir_path: pendaftarTable.akte_lahir_path,
      kartu_keluarga_path: pendaftarTable.kartu_keluarga_path,
      ktp_orangtua_path: pendaftarTable.ktp_orangtua_path,
      bukti_bayar_path: pendaftarTable.bukti_bayar_path,
    })
    .from(pendaftarTable)
    .where((() => {
      const conditions = buildApplicationConditions(filters);
      return conditions.length ? and(...conditions) : undefined;
    })())
    .orderBy(desc(pendaftarTable.created_at));
  return rows;
}