import { Router, type Request } from "express";
import multer from "multer";
import path from "node:path";
import { unlink } from "node:fs/promises";
import { uploadsDirectory, insertPendaftar } from "../lib/spmb-database";

const router = Router();

const documentFields = [
  "foto_3x4",
  "akte_lahir",
  "kartu_keluarga",
  "ktp_orangtua",
  "bukti_bayar",
] as const;

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 48);
    callback(null, `${Date.now()}-${safeBaseName || "dokumen"}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];
    callback(null, allowedMimeTypes.includes(file.mimetype));
  },
});

const textFields = [
  "jenjang",
  "nama_calon",
  "nama_panggilan",
  "jenis_kelamin",
  "tempat_lahir",
  "tanggal_lahir",
  "nisn",
  "nik_anak",
  "alamat_domisili",
  "anak_ke",
  "jumlah_saudara",
  "status_anak",
  "agama",
  "warga_negara",
  "tinggi_badan",
  "berat_badan",
  "riwayat_penyakit",
  "transportasi",
  "jarak_sekolah",
  "nama_sekolah_asal",
  "tahun_lulus",
  "alamat_sekolah_asal",
  "nomor_kk",
  "nik_orangtua",
  "nomor_hp_orangtua",
  "email",
  "nama_ayah",
  "ttl_ayah",
  "pendidikan_ayah",
  "pekerjaan_ayah",
  "penghasilan_ayah",
  "instansi_jabatan_ayah",
  "nama_ibu",
  "ttl_ibu",
  "pendidikan_ibu",
  "pekerjaan_ibu",
  "penghasilan_ibu",
  "instansi_jabatan_ibu",
  "nama_wali",
  "hubungan_wali",
] as const;

type TextField = (typeof textFields)[number];

const uploadMiddleware = upload.fields(
  documentFields.map((name) => ({ name, maxCount: 1 })),
);

function getValue(request: Request, field: TextField): string {
  const value = request.body[field];
  return typeof value === "string" ? value.trim() : "";
}

function getUploadedFile(
  request: Request,
  field: (typeof documentFields)[number],
): Express.Multer.File | undefined {
  const files = request.files as Record<string, Express.Multer.File[]> | undefined;
  return files?.[field]?.[0];
}

async function removeUploadedFiles(request: Request) {
  for (const field of documentFields) {
    const file = getUploadedFile(request, field);
    if (file) {
      await unlink(file.path).catch(() => undefined);
    }
  }
}

router.post("/submit", uploadMiddleware, async (request, response) => {
  const invalidFields = textFields.filter((field) => !getValue(request, field));
  const email = getValue(request, "email");
  const jenjang = getValue(request, "jenjang");
  const jenisKelamin = getValue(request, "jenis_kelamin");
  const validLevels = ["TK", "SD", "SMP", "SMA"];
  const validGenders = ["Laki-laki", "Perempuan"];

  const numericMinimums: Record<string, number> = {
    anak_ke: 1,
    jumlah_saudara: 0,
    tinggi_badan: 1,
    berat_badan: 1,
    tahun_lulus: 1900,
  };
  const numericFields = Object.keys(numericMinimums);
  const invalidNumbers = numericFields.filter((field) => {
    const value = Number(request.body[field]);
    return !Number.isFinite(value) || value < numericMinimums[field];
  });
  const missingFiles = documentFields.filter((field) => !getUploadedFile(request, field));

  if (
    invalidFields.length ||
    invalidNumbers.length ||
    missingFiles.length ||
    !validLevels.includes(jenjang) ||
    !validGenders.includes(jenisKelamin) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    await removeUploadedFiles(request);
    return response.status(400).json({
      error: "Mohon lengkapi semua kolom dan pastikan format data sudah benar.",
      fields: [...invalidFields, ...invalidNumbers, ...missingFiles],
    });
  }

  try {
    const values = [
      ...textFields.map((field) =>
        numericFields.includes(field)
          ? Number(getValue(request, field))
          : getValue(request, field),
      ),
      ...documentFields.map((field) => {
        const file = getUploadedFile(request, field);
        return file ? path.relative(path.resolve(uploadsDirectory, ".."), file.path) : null;
      }),
    ];

    const result = insertPendaftar.run(...values);
    const id = Number(result.lastInsertRowid);
    request.log.info({ applicationId: id }, "SPMB application submitted");

    return response.status(201).json({
      success: true,
      message: "Pendaftaran berhasil dikirim.",
      id,
    });
  } catch (error) {
    request.log.error({ err: error }, "Failed to save SPMB application");
    await removeUploadedFiles(request);
    return response.status(500).json({
      error: "Pendaftaran belum dapat disimpan. Silakan coba lagi.",
    });
  }
});

export default router;