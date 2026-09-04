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
  applicationStatusHistoryTable,
  committeeAuditLogTable,
  committeeNotificationReadTable,
  committeeNotificationTable,
  pendaftarTable,
  type InsertPendaftar,
} from "@workspace/db";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.basename(moduleDirectory) === "lib"
  ? path.resolve(moduleDirectory, "../..")
  : path.resolve(moduleDirectory, "..");
export const uploadsDirectory = path.join(packageRoot, "uploads");

mkdirSync(uploadsDirectory, { recursive: true });

const nisLevelCode: Record<string, string> = {
  Playgroup: "PG",
  Daycare: "DC",
  "TK-A": "TKA",
  "TK-B": "TKB",
  SD: "SD",
  SMP: "SMP",
};

export function buildNis(jenjang: string, id: number): string {
  return `TISA-2027-${nisLevelCode[jenjang] || "SPMB"}-${String(id).padStart(6, "0")}`;
}

async function ensurePendaftarNis<T extends { id: number; jenjang: string; nis: string | null }>(item: T): Promise<T> {
  if (item.nis) return item;
  const nis = buildNis(item.jenjang, item.id);
  await db.update(pendaftarTable).set({ nis }).where(eq(pendaftarTable.id, item.id));
  return { ...item, nis };
}

export async function insertPendaftar(values: InsertPendaftar) {
  const [created] = await db
    .insert(pendaftarTable)
    .values(values)
    .returning({ id: pendaftarTable.id });

  if (!created) {
    throw new Error("Pendaftar tidak berhasil dibuat.");
  }

  const nis = buildNis(values.jenjang, created.id);
  await db.update(pendaftarTable).set({ nis }).where(eq(pendaftarTable.id, created.id));
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

  return { ...created, nis };
}

export async function listPendaftar(filters: {
  search?: string;
  jenjang?: string;
  status?: string;
  from?: string;
  to?: string;
  allowedJenjang?: readonly string[];
}) {
  try {
    return await queryApplicationList(filters, true);
  } catch (error) {
    // Older external databases may predate the server-generated NIS column.
    // Keep the read-only list usable until that database can be migrated.
    if (!isMissingSchemaColumn(error)) throw error;
    return queryApplicationList(filters, false);
  }
}

function buildApplicationConditions(filters: {
  search?: string;
  jenjang?: string;
  status?: string;
  from?: string;
  to?: string;
  allowedJenjang?: readonly string[];
}, includeNisSearch = true) {
  const conditions = [];
  const search = filters.search?.trim();

  if (search) {
    const searchConditions = [
      ilike(pendaftarTable.nama_calon, `%${search}%`),
      sql`CAST(${pendaftarTable.id} AS TEXT) ILIKE ${`%${search}%`}`,
      ilike(pendaftarTable.nama_sekolah_asal, `%${search}%`),
      ilike(pendaftarTable.nomor_hp_orangtua, `%${search}%`),
    ];
    if (includeNisSearch) searchConditions.push(ilike(pendaftarTable.nis, `%${search}%`));
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
  includeNis: boolean,
) {
  const conditions = buildApplicationConditions(filters, includeNis);
  const where = conditions.length ? and(...conditions) : undefined;
  if (includeNis) {
    const items = await db
      .select({
        id: pendaftarTable.id,
        nis: pendaftarTable.nis,
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

    return { items: await Promise.all(items.map(ensurePendaftarNis)), total: items.length };
  }

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

  return {
    items: items.map((item) => ({ ...item, nis: null })),
    total: items.length,
  };
}

export async function getPendaftar(id: number) {
  const [item] = await db
    .select()
    .from(pendaftarTable)
    .where(eq(pendaftarTable.id, id))
    .limit(1);
  return item ? ensurePendaftarNis(item) : item;
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

export async function updatePendaftarStatus(
  id: number,
  status: string,
  changedBy: string,
) {
  const current = await getPendaftar(id);
  if (!current) return current;
  const [item] = await db
    .update(pendaftarTable)
    .set({ status })
    .where(eq(pendaftarTable.id, id))
    .returning({
      id: pendaftarTable.id,
      status: pendaftarTable.status,
    });
  if (item && current.status !== status) {
    await db.insert(applicationStatusHistoryTable).values({
      application_id: id,
      previous_status: current.status,
      next_status: status,
      changed_by: changedBy,
    });
    await recordCommitteeAudit({
      username: changedBy,
      action: "status_change",
      applicationId: id,
      details: `${current.status} → ${status}`,
    });
    await db.insert(committeeNotificationTable).values({
      application_id: id,
      type: status === "Perlu Perbaikan" ? "needs_revision" : "status_changed",
      title: status === "Perlu Perbaikan" ? "Pengajuan membutuhkan perbaikan" : "Status pengajuan berubah",
      message: `${current.nama_calon}: ${current.status} → ${status}.`,
      jenjang: current.jenjang,
    });
  }
  return item;
}

export async function recordCommitteeAudit(input: {
  username: string;
  action: string;
  applicationId?: number;
  details?: string;
}) {
  await db.insert(committeeAuditLogTable).values({
    username: input.username,
    action: input.action,
    application_id: input.applicationId,
    details: input.details,
  });
}

export async function listNotifications(username: string, allowedJenjang: readonly string[], limit = 30) {
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
      nis: pendaftarTable.nis,
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
  await db.insert(committeeNotificationReadTable)
    .values({ notification_id: notificationId, username })
    .onConflictDoNothing();
}

export async function markAllNotificationsRead(username: string, allowedJenjang: readonly string[]) {
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
  return Promise.all(rows.map(ensurePendaftarNis));
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
      nis: pendaftarTable.nis,
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
  return Promise.all(rows.map(ensurePendaftarNis));
}