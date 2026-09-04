import { Router } from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { deletePendaftar, getPendaftar, listPendaftar, updatePendaftarStatus, uploadsDirectory } from "../lib/spmb-database";
import { canAccessJenjang, committeeStatuses, requireAdministrator, requireCommitteeAuth } from "../middlewares/committee-auth";

const router = Router();
const documentFields = {
  foto_3x4_path: { field: "foto_3x4", label: "Pas foto 3×4" },
  akte_lahir_path: { field: "akte_lahir", label: "Akta kelahiran" },
  kartu_keluarga_path: { field: "kartu_keluarga", label: "Kartu Keluarga" },
  ktp_orangtua_path: { field: "ktp_orangtua", label: "KTP orang tua" },
  bukti_bayar_path: { field: "bukti_bayar", label: "Bukti pembayaran" },
} as const;

router.use("/applications", requireCommitteeAuth);

function parseId(value: string | string[]) {
  if (Array.isArray(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const uploadRoot = path.resolve(uploadsDirectory);
const legacyUploadRoot = path.resolve(path.dirname(uploadRoot), "artifacts/api-server/uploads");

export function resolveStoredUpload(relativePath: string): string | null {
  const roots = [uploadRoot, legacyUploadRoot];
  for (const root of roots) {
    const filePath = path.resolve(path.dirname(root), relativePath);
    if (
      filePath.startsWith(`${root}${path.sep}`)
      && existsSync(filePath)
    ) {
      return filePath;
    }
  }
  return null;
}

router.get("/applications", async (request, response) => {
  try {
    const result = await listPendaftar({
      search: typeof request.query.q === "string" ? request.query.q : undefined,
      jenjang: typeof request.query.jenjang === "string" ? request.query.jenjang : undefined,
      status: typeof request.query.status === "string" ? request.query.status : undefined,
      allowedJenjang: request.committeeAccount?.allowedJenjang,
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
  if (!application || !request.committeeAccount || !canAccessJenjang(request.committeeAccount, application.jenjang)) {
    return response.status(404).json({ error: "Berkas tidak ditemukan." });
  }
  const column = Object.entries(documentFields).find(([, item]) => item.field === field)?.[0] as keyof typeof documentFields | undefined;
  const relativePath = column && application?.[column];
  if (!relativePath || typeof relativePath !== "string") {
    return response.status(404).json({ error: "Berkas belum tersedia." });
  }

  const filePath = resolveStoredUpload(relativePath);
  if (!filePath) {
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
    if (!application || !request.committeeAccount || !canAccessJenjang(request.committeeAccount, application.jenjang)) {
      return response.status(404).json({ error: "Pendaftar tidak ditemukan." });
    }

    const files = Object.entries(documentFields).map(([column, item]) => {
      const relativePath = application[column as keyof typeof application];
      return {
      field: item.field,
      label: item.label,
      url: `/api/applications/${id}/files/${item.field}`,
        available: typeof relativePath === "string" && Boolean(resolveStoredUpload(relativePath)),
      };
    });

    return response.json({ ...application, files });
  } catch (error) {
    request.log.error({ err: error, applicationId: id }, "Failed to load SPMB application");
    return response.status(500).json({ error: "Detail pendaftar belum dapat dimuat." });
  }
});

router.delete("/applications/:id", requireAdministrator, async (request, response) => {
  const id = parseId(request.params.id);
  if (!id) return response.status(400).json({ error: "ID pendaftar tidak valid." });

  try {
    const deleted = await deletePendaftar(id, request.committeeAccount!.username);
    if (!deleted) return response.status(404).json({ error: "Pendaftar tidak ditemukan." });
    request.log.info({ applicationId: id, deletedBy: request.committeeAccount!.username }, "SPMB application deleted");
    return response.json({
      success: true,
      message: "Data pendaftar berhasil dihapus.",
      id: deleted.id,
      filesRemoved: deleted.filesRemoved,
    });
  } catch (error) {
    request.log.error({ err: error, applicationId: id }, "Failed to delete SPMB application");
    return response.status(500).json({ error: "Data pendaftar belum dapat dihapus." });
  }
});

router.patch("/applications/:id/status", async (request, response) => {
  const id = parseId(request.params.id);
  const status = typeof request.body?.status === "string" ? request.body.status : "";
  if (!id || !committeeStatuses.includes(status as (typeof committeeStatuses)[number])) {
    return response.status(400).json({ error: "Status pendaftar tidak valid." });
  }

  try {
    const application = await getPendaftar(id);
    if (!application || !request.committeeAccount || !canAccessJenjang(request.committeeAccount, application.jenjang)) {
      return response.status(404).json({ error: "Pendaftar tidak ditemukan." });
    }
    const updated = await updatePendaftarStatus(id, status, request.committeeAccount.username);
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