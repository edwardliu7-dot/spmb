import { Router, type Request } from "express";
import path from "node:path";
import { canAccessJenjang, isKnownJenjang, requireCommitteeAuth } from "../middlewares/committee-auth";
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
import {
  getRegistrationQuotaSummary,
  listRegistrationQuotaAdjustments,
  registrationQuotaDefinitions,
  saveRegistrationQuotaAdjustments,
} from "../lib/registration-quota";
import {
  createWaitingListEntry,
  deleteWaitingListEntry,
  decideWaitingListMatch,
  findWaitingListMatches,
  listWaitingList,
} from "../lib/waiting-list";

const router = Router();
router.use("/admin", requireCommitteeAuth);

function isAdministrator(request: Request): boolean {
  return request.committeeAccount?.username.toLowerCase() === "admin";
}

router.get("/admin/quota-adjustments", async (request, response) => {
  if (!isAdministrator(request)) return response.status(403).json({ error: "Hanya administrator yang dapat mengatur kuota terisi." });
  try {
    return response.json({
      items: await listRegistrationQuotaAdjustments(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    request.log.error({ err: error }, "Failed to load registration quota adjustments");
    return response.status(500).json({ error: "Pengaturan kuota terisi belum dapat dimuat." });
  }
});

router.put("/admin/quota-adjustments", async (request, response) => {
  if (!isAdministrator(request)) return response.status(403).json({ error: "Hanya administrator yang dapat mengatur kuota terisi." });
  const rawAdjustments = request.body?.adjustments;
  if (!Array.isArray(rawAdjustments) || rawAdjustments.length !== registrationQuotaDefinitions.reduce(
    (total, definition) => total + (definition.genderQuotas ? Object.keys(definition.genderQuotas).length : 1),
    0,
  )) {
    return response.status(400).json({ error: "Data kuota terisi belum lengkap." });
  }

  const allowedScopes = new Set(
    registrationQuotaDefinitions.flatMap((definition) => definition.genderQuotas
      ? Object.keys(definition.genderQuotas).map((jenisKelamin) => `${definition.jenjang}:${jenisKelamin}`)
      : [definition.jenjang]),
  );
  const seenScopes = new Set<string>();
  const adjustments = [];
  for (const item of rawAdjustments) {
    const jenjang = typeof item?.jenjang === "string" ? item.jenjang : "";
    const jenisKelamin = item?.jenisKelamin === null || item?.jenisKelamin === undefined
      ? null
      : typeof item.jenisKelamin === "string" ? item.jenisKelamin : "";
    const filled = Number(item?.filled);
    const scope = jenisKelamin ? `${jenjang}:${jenisKelamin}` : jenjang;
    if (
      !allowedScopes.has(scope)
      || seenScopes.has(scope)
      || !Number.isSafeInteger(filled)
      || filled < 0
      || filled > 100000
    ) {
      return response.status(400).json({ error: "Nilai tambahan kuota harus berupa bilangan bulat 0 atau lebih." });
    }
    seenScopes.add(scope);
    adjustments.push({ jenjang, jenisKelamin, filled });
  }

  if (seenScopes.size !== allowedScopes.size) {
    return response.status(400).json({ error: "Data kuota terisi belum mencakup semua jenjang." });
  }

  try {
    const saved = await saveRegistrationQuotaAdjustments(adjustments, request.committeeAccount!.username);
    await recordCommitteeAudit({
      username: request.committeeAccount!.username,
      action: "update_quota_adjustments",
      details: JSON.stringify(adjustments),
    });
    return response.json({
      items: saved,
      summary: await getRegistrationQuotaSummary(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    request.log.error({ err: error }, "Failed to save registration quota adjustments");
    return response.status(500).json({ error: "Pengaturan kuota terisi belum dapat disimpan." });
  }
});

router.get("/admin/waiting-list", async (request, response) => {
  if (!isAdministrator(request)) return response.status(403).json({ error: "Hanya administrator yang dapat mengelola waiting list." });
  const user = request.committeeAccount!;
  try {
    const items = await listWaitingList(user.allowedJenjang);
    const applications = (await listMasterPendaftar({ allowedJenjang: user.allowedJenjang })).map((item) => ({
      id: item.id,
      nama_calon: item.nama_calon,
      jenjang: item.jenjang,
      jenis_kelamin: item.jenis_kelamin,
      tanggal_lahir: item.tanggal_lahir,
      created_at: item.created_at,
    }));
    const matches = await findWaitingListMatches(items, applications);
    const matchesByWaiting = new Map<number, typeof matches>();
    matches.forEach((match) => {
      const current = matchesByWaiting.get(match.waitingListId) || [];
      current.push(match);
      matchesByWaiting.set(match.waitingListId, current);
    });
    return response.json({
      items: items.map((item) => ({
        ...item,
        matches: (matchesByWaiting.get(item.id) || []).sort((left, right) => right.confidence - left.confidence),
      })),
      aiEnabled: Boolean(process.env.GROQ_API_KEY),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    request.log.error({ err: error }, "Failed to load waiting list");
    return response.status(500).json({ error: "Waiting list belum dapat dimuat." });
  }
});

router.post("/admin/waiting-list", async (request, response) => {
  if (!isAdministrator(request)) return response.status(403).json({ error: "Hanya administrator yang dapat menambah waiting list." });
  const nama = typeof request.body?.nama === "string" ? request.body.nama.trim() : "";
  const jenjang = typeof request.body?.jenjang === "string" ? request.body.jenjang.trim() : "";
  const jenisKelamin = request.body?.jenisKelamin === null || request.body?.jenisKelamin === undefined || request.body?.jenisKelamin === ""
    ? null
    : typeof request.body.jenisKelamin === "string" ? request.body.jenisKelamin.trim() : "";
  const catatan = typeof request.body?.catatan === "string" ? request.body.catatan.trim() : "";
  if (nama.length < 2 || nama.length > 120) return response.status(400).json({ error: "Nama siswa harus diisi 2–120 karakter." });
  if (!isKnownJenjang(jenjang)) return response.status(400).json({ error: "Jenjang waiting list tidak valid." });
  if (jenisKelamin && !["Laki-laki", "Perempuan"].includes(jenisKelamin)) {
    return response.status(400).json({ error: "Jenis kelamin waiting list tidak valid." });
  }
  if (jenjang === "SD" && !jenisKelamin) {
    return response.status(400).json({ error: "Jenis kelamin wajib diisi untuk waiting list SD agar kuota putra/putri tepat." });
  }
  if (catatan.length > 500) return response.status(400).json({ error: "Catatan maksimal 500 karakter." });
  try {
    const item = await createWaitingListEntry({
      nama,
      jenjang,
      jenisKelamin,
      catatan: catatan || null,
      addedBy: request.committeeAccount!.username,
    });
    await recordCommitteeAudit({
      username: request.committeeAccount!.username,
      action: "waiting_list_add",
      details: JSON.stringify({ id: item?.id, nama, jenjang, jenisKelamin }),
    });
    return response.status(201).json({ item });
  } catch (error) {
    request.log.error({ err: error }, "Failed to add waiting list item");
    return response.status(500).json({ error: "Nama siswa belum dapat ditambahkan ke waiting list." });
  }
});

router.delete("/admin/waiting-list/:id", async (request, response) => {
  if (!isAdministrator(request)) return response.status(403).json({ error: "Hanya administrator yang dapat menghapus waiting list." });
  const waitingListId = parseId(request.params.id);
  if (!waitingListId) return response.status(400).json({ error: "ID waiting list tidak valid." });
  try {
    const deleted = await deleteWaitingListEntry(waitingListId);
    if (!deleted) return response.status(404).json({ error: "Nama waiting list tidak ditemukan atau sudah dihapus." });
    await recordCommitteeAudit({
      username: request.committeeAccount!.username,
      action: "waiting_list_deleted",
      details: JSON.stringify(deleted),
    });
    return response.json({ success: true, item: deleted });
  } catch (error) {
    request.log.error({ err: error, waitingListId }, "Failed to delete waiting list item");
    return response.status(500).json({ error: "Nama waiting list belum dapat dihapus." });
  }
});

router.post("/admin/waiting-list/:id/match-decision", async (request, response) => {
  if (!isAdministrator(request)) return response.status(403).json({ error: "Hanya administrator yang dapat mengonfirmasi kecocokan waiting list." });
  const waitingListId = parseId(request.params.id);
  const applicationId = parseId(request.body?.applicationId);
  const decision = request.body?.decision;
  if (!waitingListId || !applicationId || !["confirmed", "rejected"].includes(decision)) {
    return response.status(400).json({ error: "Keputusan kecocokan belum lengkap." });
  }
  try {
    const result = await decideWaitingListMatch({
      waitingListId,
      applicationId,
      decision,
      decidedBy: request.committeeAccount!.username,
    });
    if (!result) return response.status(404).json({ error: "Waiting list atau pendaftar tidak ditemukan, atau jenjangnya berbeda." });
    await recordCommitteeAudit({
      username: request.committeeAccount!.username,
      action: decision === "confirmed" ? "waiting_list_match_confirmed" : "waiting_list_match_rejected",
      applicationId,
      details: JSON.stringify({ waitingListId }),
    });
    return response.json({ success: true, ...result });
  } catch (error) {
    request.log.error({ err: error, waitingListId, applicationId, decision }, "Failed to save waiting list match decision");
    return response.status(500).json({ error: "Keputusan kecocokan belum dapat disimpan." });
  }
});

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
    const statuses = ["Baru", "Perlu Perbaikan Data", "Lolos Verifikasi Berkas", "Observasi", "Lolos Observasi", "Diterima"];
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