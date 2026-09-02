import { Router } from "express";
import path from "node:path";
import { getPendaftar, listPendaftar, updatePendaftarStatus, uploadsDirectory } from "../lib/spmb-database";

const router = Router();
const statuses = ["Baru", "Diverifikasi", "Perlu Perbaikan", "Diterima", "Ditolak"] as const;
const documentFields = {
  foto_3x4_path: { field: "foto_3x4", label: "Pas foto 3×4" },
  akte_lahir_path: { field: "akte_lahir", label: "Akta kelahiran" },
  kartu_keluarga_path: { field: "kartu_keluarga", label: "Kartu Keluarga" },
  ktp_orangtua_path: { field: "ktp_orangtua", label: "KTP orang tua" },
  bukti_bayar_path: { field: "bukti_bayar", label: "Bukti pembayaran" },
} as const;

function parseId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

router.get("/applications", async (request, response) => {
  try {
    const result = await listPendaftar({
      search: typeof request.query.q === "string" ? request.query.q : undefined,
      jenjang: typeof request.query.jenjang === "string" ? request.query.jenjang : undefined,
      status: typeof request.query.status === "string" ? request.query.status : undefined,
    });
    return response.json(result);
  } catch (error) {
    request.log.error({ err: error }, "Failed to list SPMB applications");
    return response.status(500).json({ error: "Daftar pendaftar belum dapat dimuat." });
  }
});

router.get("/applications/:id/files/:field", async (request, response) => {
  const id = parseId(request.params.id);
  const field = request.params.field;
  if (!id || !Object.values(documentFields).some((item) => item.field === field)) {
    return response.status(404).json({ error: "Berkas tidak ditemukan." });
  }

  const application = await getPendaftar(id);
  const column = Object.entries(documentFields).find(([, item]) => item.field === field)?.[0] as keyof typeof documentFields | undefined;
  const relativePath = column && application?.[column];
  if (!relativePath || typeof relativePath !== "string") {
    return response.status(404).json({ error: "Berkas belum tersedia." });
  }

  const uploadRoot = path.resolve(uploadsDirectory);
  const filePath = path.resolve(path.dirname(uploadRoot), relativePath);
  if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
    return response.status(404).json({ error: "Berkas tidak ditemukan." });
  }

  return response.sendFile(filePath, (error) => {
    if (error && !response.headersSent) {
      response.status(404).json({ error: "Berkas tidak ditemukan." });
    }
  });
});

router.get("/applications/:id", async (request, response) => {
  const id = parseId(request.params.id);
  if (!id) return response.status(404).json({ error: "Pendaftar tidak ditemukan." });

  try {
    const application = await getPendaftar(id);
    if (!application) return response.status(404).json({ error: "Pendaftar tidak ditemukan." });

    const files = Object.entries(documentFields).map(([column, item]) => ({
      field: item.field,
      label: item.label,
      url: `/api/applications/${id}/files/${item.field}`,
      available: Boolean(application[column as keyof typeof application]),
    }));

    return response.json({ ...application, files });
  } catch (error) {
    request.log.error({ err: error, applicationId: id }, "Failed to load SPMB application");
    return response.status(500).json({ error: "Detail pendaftar belum dapat dimuat." });
  }
});

router.patch("/applications/:id/status", async (request, response) => {
  const id = parseId(request.params.id);
  const status = typeof request.body?.status === "string" ? request.body.status : "";
  if (!id || !statuses.includes(status as (typeof statuses)[number])) {
    return response.status(400).json({ error: "Status pendaftar tidak valid." });
  }

  try {
    const updated = await updatePendaftarStatus(id, status);
    if (!updated) return response.status(404).json({ error: "Pendaftar tidak ditemukan." });
    request.log.info({ applicationId: id, status }, "SPMB application status updated");
    return response.json({
      success: true,
      message: "Status pendaftar berhasil diperbarui.",
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    request.log.error({ err: error, applicationId: id }, "Failed to update SPMB application status");
    return response.status(500).json({ error: "Status pendaftar belum dapat diperbarui." });
  }
});

export default router;