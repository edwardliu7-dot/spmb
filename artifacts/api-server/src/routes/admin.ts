import { Router } from "express";
import path from "node:path";
import { canAccessJenjang, requireCommitteeAuth } from "../middlewares/committee-auth";
import {
  getObservationRows,
  getPendaftar,
  listMasterPendaftar,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  recordCommitteeAudit,
} from "../lib/spmb-database";
import { createXlsx, createZip } from "../lib/export-files";
import { getApplicationFileFields, readApplicationFile } from "../lib/application-files";
import { resolveStoredUpload } from "./applications";
import { createSpmbReceipt } from "../lib/spmb-receipt";
import { getSubmissionMonitoring } from "../lib/submission-monitor";

const router = Router();
router.use("/admin", requireCommitteeAuth);

const documentFields = [
  { key: "foto_3x4_path", field: "foto_3x4", file: "foto-3x4" },
  { key: "akte_lahir_path", field: "akte_lahir", file: "akta-kelahiran" },
  { key: "kartu_keluarga_path", field: "kartu_keluarga", file: "kartu-keluarga" },
  { key: "ktp_orangtua_path", field: "ktp_orangtua", file: "ktp-orang-tua" },
  { key: "bukti_bayar_path", field: "bukti_bayar", file: "bukti-pembayaran" },
] as const;

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function queryFilters(query: Record<string, unknown>, allowedJenjang: readonly string[]) {
  const jenjang = queryString(query.jenjang);
  return {
    search: queryString(query.q),
    jenjang: jenjang === "Semua" ? undefined : jenjang,
    status: queryString(query.status),
    from: queryString(query.from),
    to: queryString(query.to),
    allowedJenjang,
  };
}

function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function ageAtReference(birthDate: string): number | null {
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  const reference = new Date("2027-07-31T00:00:00.000Z");
  if (Number.isNaN(birth.getTime())) return null;
  let age = reference.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayNotReached =
    reference.getUTCMonth() < birth.getUTCMonth()
    || (reference.getUTCMonth() === birth.getUTCMonth() && reference.getUTCDate() < birth.getUTCDate());
  if (birthdayNotReached) age -= 1;
  return age;
}

function ageGroup(age: number | null): string {
  if (age === null) return "Tidak diketahui";
  if (age < 3) return "< 3 tahun";
  if (age <= 5) return "3–5 tahun";
  if (age <= 9) return "6–9 tahun";
  if (age <= 12) return "10–12 tahun";
  return "13+ tahun";
}

function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((result, item) => {
    const key = getKey(item) || "Tidak diketahui";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function safeFilePart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "pendaftar";
}

function csvCell(value: unknown): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function applicationNumber(id: number): string {
  return `SPMB-${String(id).padStart(6, "0")}`;
}

function rowsForMasterData(items: Awaited<ReturnType<typeof listMasterPendaftar>>): string[][] {
  return [
    ["Nomor pengajuan", "Nama calon peserta didik", "Jenjang", "NIK anak", "NISN", "Jenis kelamin", "Tempat lahir", "Tanggal lahir", "Alamat domisili", "Nama orang tua/wali", "Nomor WhatsApp orang tua", "Email", "Asal sekolah", "Status pengajuan", "Tanggal pengajuan", "Kelengkapan berkas"],
    ...items.map((item) => [
      applicationNumber(item.id),
      item.nama_calon,
      item.jenjang,
      item.nik_anak,
      item.nisn || "",
      item.jenis_kelamin,
      item.tempat_lahir,
      item.tanggal_lahir,
      item.alamat_domisili,
      item.nama_ayah || item.nama_ibu || item.nama_wali || "",
      item.nomor_hp_orangtua,
      item.email,
      item.nama_sekolah_asal || "",
      item.status,
      item.created_at.toISOString(),
      documentFields.filter(({ key }) => Boolean(item[key])).length === documentFields.length ? "Lengkap" : "Belum lengkap",
    ]),
  ];
}

router.get("/admin/notifications", async (request, response) => {
  const user = request.committeeAccount!;
  const limit = Math.min(Math.max(Number(request.query.limit) || 30, 1), 100);
  try {
    const items = await listNotifications(user.username, user.allowedJenjang, limit);
    return response.json({
      items,
      unreadCount: items.filter((item) => !item.read).length,
    });
  } catch (error) {
    request.log.error({ err: error }, "Failed to list committee notifications");
    return response.status(500).json({ error: "Notifikasi belum dapat dimuat." });
  }
});

router.get("/admin/submission-monitoring", (request, response) => {
  request.log.info({ event: "spmb_submission_monitoring_viewed", username: request.committeeAccount!.username }, "SPMB submission monitoring viewed");
  return response.json(getSubmissionMonitoring());
});

router.post("/admin/notifications/read-all", async (request, response) => {
  const user = request.committeeAccount!;
  try {
    const count = await markAllNotificationsRead(user.username, user.allowedJenjang);
    return response.json({ success: true, count });
  } catch (error) {
    request.log.error({ err: error }, "Failed to mark committee notifications read");
    return response.status(500).json({ error: "Notifikasi belum dapat diperbarui." });
  }
});

router.post("/admin/notifications/:id/read", async (request, response) => {
  const id = parseId(request.params.id);
  const user = request.committeeAccount!;
  if (!id) return response.status(400).json({ error: "Notifikasi tidak valid." });
  try {
    const items = await listNotifications(user.username, user.allowedJenjang, 100);
    const notification = items.find((item) => item.id === id);
    if (!notification) return response.status(404).json({ error: "Notifikasi tidak ditemukan." });
    await markNotificationRead(id, user.username);
    return response.json({ success: true });
  } catch (error) {
    request.log.error({ err: error, notificationId: id }, "Failed to mark committee notification read");
    return response.status(500).json({ error: "Notifikasi belum dapat diperbarui." });
  }
});

router.get("/admin/observations", async (request, response) => {
  const user = request.committeeAccount!;
  try {
    const rows = await getObservationRows(queryFilters(request.query as Record<string, unknown>, user.allowedJenjang));
    const statuses = ["Baru", "Lolos Verifikasi Berkas", "Observasi", "Lolos Observasi", "Diterima"];
    const storedFieldsByApplication = new Map<number, Set<string>>();
    await Promise.all(rows.map(async (row) => {
      storedFieldsByApplication.set(row.id, await getApplicationFileFields(row.id));
    }));
    const completeDocuments = (row: typeof rows[number]) =>
      documentFields.filter(({ key, field }) =>
        storedFieldsByApplication.get(row.id)?.has(field)
        || Boolean(row[key] && resolveStoredUpload(row[key]!)),
      ).length;
    return response.json({
      jenjang: queryString(request.query.jenjang) || "Semua",
      total: rows.length,
      counts: Object.fromEntries(statuses.map((status) => [status, rows.filter((row) => row.status === status).length])),
      incompleteDocuments: rows.filter((row) => completeDocuments(row) < documentFields.length).length,
      trends: Object.entries(countBy(rows, (row) => row.created_at.toISOString().slice(0, 10))).map(([date, count]) => ({ date, count })),
      breakdowns: {
        jenisKelamin: countBy(rows, (row) => row.jenis_kelamin),
        kelompokUsia: countBy(rows, (row) => ageGroup(ageAtReference(row.tanggal_lahir))),
        asalSekolah: countBy(rows, (row) => row.nama_sekolah_asal || "Tidak diisi"),
        status: countBy(rows, (row) => row.status),
        kelengkapan: {
          lengkap: rows.filter((row) => completeDocuments(row) === documentFields.length).length,
          belumLengkap: rows.filter((row) => completeDocuments(row) < documentFields.length).length,
        },
      },
    });
  } catch (error) {
    request.log.error({ err: error }, "Failed to build committee observation");
    return response.status(500).json({ error: "Data observasi belum dapat dimuat." });
  }
});

router.get("/admin/master-data", async (request, response) => {
  const user = request.committeeAccount!;
  try {
    const items = await listMasterPendaftar(queryFilters(request.query as Record<string, unknown>, user.allowedJenjang));
    return response.json({ items, total: items.length });
  } catch (error) {
    request.log.error({ err: error }, "Failed to list committee master data");
    return response.status(500).json({ error: "Master data belum dapat dimuat." });
  }
});

router.get("/admin/export.xlsx", async (request, response) => {
  const user = request.committeeAccount!;
  try {
    const items = await listMasterPendaftar(queryFilters(request.query as Record<string, unknown>, user.allowedJenjang));
    const statusRows = Object.entries(countBy(items, (item) => item.status)).map(([status, count]) => [status, String(count)]);
    const levelRows = Object.entries(countBy(items, (item) => item.jenjang)).map(([jenjang, count]) => [jenjang, String(count)]);
    const workbook = createXlsx([
      { name: "Master Pendaftar", rows: rowsForMasterData(items) },
      { name: "Ringkasan Jenjang", rows: [["Jenjang", "Jumlah"], ...levelRows] },
      { name: "Ringkasan Status", rows: [["Status", "Jumlah"], ...statusRows] },
    ]);
    const level = queryString(request.query.jenjang);
    const filename = `master-data-spmb-2027-${safeFilePart(level && level !== "Semua" ? level.toLowerCase() : "semua")}.xlsx`;
    request.log.info({ username: user.username, jenjang: level || "Semua", count: items.length }, "Master data exported");
    await recordCommitteeAudit({
      username: user.username,
      action: "export_master_data",
      details: JSON.stringify({ jenjang: level || "Semua", count: items.length }),
    });
    response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return response.end(workbook);
  } catch (error) {
    request.log.error({ err: error }, "Failed to export master data");
    return response.status(500).json({ error: "Excel belum dapat dibuat." });
  }
});

async function createApplicationZip(id: number, user: NonNullable<Express.Request["committeeAccount"]>) {
  const item = await getPendaftar(id);
  if (!item || !canAccessJenjang(user, item.jenjang)) return null;
  const folder = `${applicationNumber(item.id)}_${safeFilePart(item.nama_calon)}`;
  const entries = [];
  const available: string[] = [];
  const missing: string[] = [];
  for (const document of documentFields) {
    const storedFile = await readApplicationFile(item.id, document.field, item[document.key]);
    if (storedFile) {
      available.push(document.file);
      const extension = path.extname(storedFile.originalName).replace(".", "").toLowerCase() || "bin";
      entries.push({ name: `${folder}/${document.file}.${safeFilePart(extension)}`, data: storedFile.data });
    } else {
      missing.push(document.file);
    }
  }
  entries.push({
    name: `${folder}/manifest.txt`,
    data: Buffer.from([
      `Nomor pengajuan: ${applicationNumber(item.id)}`,
      `Nama: ${item.nama_calon}`,
      `Jenjang: ${item.jenjang}`,
      `Status: ${item.status}`,
      `Berkas tersedia: ${available.join(", ") || "Tidak ada"}`,
      `Berkas belum tersedia: ${missing.join(", ") || "Tidak ada"}`,
    ].join("\n")),
  });
  return { item, data: createZip(entries) };
}

router.get("/admin/applications/:id/files.zip", async (request, response) => {
  const id = parseId(request.params.id);
  const user = request.committeeAccount!;
  if (!id) return response.status(404).json({ error: "Pendaftar tidak ditemukan." });
  try {
    const result = await createApplicationZip(id, user);
    if (!result) return response.status(404).json({ error: "Pendaftar tidak ditemukan." });
    request.log.info({ username: user.username, applicationId: id }, "Application files downloaded");
    await recordCommitteeAudit({ username: user.username, action: "download_application_zip", applicationId: id });
    response.setHeader("Content-Type", "application/zip");
    response.setHeader("Content-Disposition", `attachment; filename="${applicationNumber(id)}_${safeFilePart(result.item.nama_calon)}.zip"`);
    return response.end(result.data);
  } catch (error) {
    request.log.error({ err: error, applicationId: id }, "Failed to create application ZIP");
    return response.status(500).json({ error: "ZIP berkas belum dapat dibuat." });
  }
});

router.get("/admin/applications/:id/receipt", async (request, response) => {
  const id = parseId(request.params.id);
  const user = request.committeeAccount!;
  if (!id) return response.status(404).json({ error: "Pendaftar tidak ditemukan." });

  try {
    const item = await getPendaftar(id);
    if (!item || !canAccessJenjang(user, item.jenjang)) {
      return response.status(404).json({ error: "Pendaftar tidak ditemukan." });
    }

    const pdf = await createSpmbReceipt(item);
    request.log.info({ username: user.username, applicationId: id }, "Application receipt downloaded");
    await recordCommitteeAudit({
      username: user.username,
      action: "download_application_receipt",
      applicationId: id,
    });
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${applicationNumber(id)}_bukti-formulir.pdf"`,
    );
    response.setHeader("Content-Length", String(pdf.byteLength));
    return response.end(Buffer.from(pdf));
  } catch (error) {
    request.log.error({ err: error, applicationId: id }, "Failed to create application receipt");
    return response.status(500).json({ error: "Bukti pendaftaran belum dapat dibuat." });
  }
});

router.post("/admin/files.zip", async (request, response) => {
  const user = request.committeeAccount!;
  const ids = Array.isArray(request.body?.ids)
    ? (request.body.ids as unknown[]).map(parseId).filter((id: number | null): id is number => id !== null).slice(0, 100)
    : [];
  try {
    const entries = [];
    const manifest = [["Nomor pengajuan", "Nama", "Jenjang", "Status", "Berkas tersedia", "Berkas belum tersedia"]];
    for (const id of ids) {
      const item = await getPendaftar(id);
      if (!item || !canAccessJenjang(user, item.jenjang)) continue;
      const folder = `${applicationNumber(item.id)}_${safeFilePart(item.nama_calon)}`;
      const available: string[] = [];
      const missing: string[] = [];
      for (const document of documentFields) {
        const storedFile = await readApplicationFile(item.id, document.field, item[document.key]);
        if (storedFile) {
          available.push(document.file);
          const extension = path.extname(storedFile.originalName).replace(".", "").toLowerCase() || "bin";
          entries.push({ name: `${folder}/${document.file}.${safeFilePart(extension)}`, data: storedFile.data });
        } else {
          missing.push(document.file);
        }
      }
      manifest.push([applicationNumber(item.id), item.nama_calon, item.jenjang, item.status, available.join(", "), missing.join(", ")]);
    }
    if (!entries.length && !ids.length) return response.status(400).json({ error: "Pilih minimal satu pendaftar." });
    entries.push({ name: "manifest.csv", data: Buffer.from(manifest.map((row) => row.map(csvCell).join(",")).join("\n")) });
    const data = createZip(entries);
    request.log.info({ username: user.username, count: manifest.length - 1 }, "Bulk application files downloaded");
    await recordCommitteeAudit({
      username: user.username,
      action: "download_bulk_zip",
      details: JSON.stringify({ count: manifest.length - 1, ids }),
    });
    response.setHeader("Content-Type", "application/zip");
    response.setHeader("Content-Disposition", 'attachment; filename="spmb-2027-berkas.zip"');
    return response.end(data);
  } catch (error) {
    request.log.error({ err: error, count: ids.length }, "Failed to create bulk application ZIP");
    return response.status(500).json({ error: "ZIP massal belum dapat dibuat." });
  }
});

export default router;