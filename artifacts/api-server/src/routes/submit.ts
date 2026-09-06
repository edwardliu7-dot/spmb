import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import { SubmitApplicationBody } from "@workspace/api-zod";
import { getPendaftar, getPublicPendaftarStatus, insertPendaftar } from "../lib/spmb-database";
import { type ApplicationFileInput } from "../lib/application-files";
import { allJenjang } from "../middlewares/committee-auth";
import { createReceiptToken, createSpmbReceipt, isValidReceiptToken } from "../lib/spmb-receipt";
import { getRegistrationQuotaSummary, RegistrationQuotaFullError } from "../lib/registration-quota";

const router = Router();

router.get("/quotas", async (request, response) => {
  try {
    return response.json(await getRegistrationQuotaSummary());
  } catch (error) {
    request.log.error({ err: error }, "Failed to load registration quotas");
    return response.status(500).json({ error: "Informasi kuota belum dapat dimuat." });
  }
});

const documentFields = [
  "foto_3x4",
  "akte_lahir",
  "kartu_keluarga",
  "ktp_orangtua",
  "bukti_bayar",
] as const;

const documentLabels: Record<(typeof documentFields)[number], string> = {
  foto_3x4: "Pas foto 3×4",
  akte_lahir: "Akta kelahiran",
  kartu_keluarga: "Kartu Keluarga",
  ktp_orangtua: "KTP orang tua",
  bukti_bayar: "Bukti pembayaran",
};

const maxFileSize = 5 * 1024 * 1024;
const submitRateLimitWindowMs = 15 * 60 * 1000;
const submitRateLimitMaxRequests = 5;
const submitAttempts = new Map<string, { count: number; resetAt: number }>();

class UnsupportedFileTypeError extends Error {
  constructor() {
    super("Format berkas tidak didukung. Gunakan PDF, JPG, atau PNG.");
    this.name = "UnsupportedFileTypeError";
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSize,
    files: documentFields.length,
    fields: 50,
    parts: 55,
    fieldNameSize: 100,
    fieldSize: 16 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const allowedMimesByExtension: Record<string, string[]> = {
      ".jpg": ["image/jpeg", "image/jpg"],
      ".jpeg": ["image/jpeg", "image/jpg"],
      ".png": ["image/png"],
      ".pdf": ["application/pdf"],
    };
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();
    const acceptsGenericMime =
      mimeType === "" ||
      mimeType === "application/octet-stream" ||
      mimeType === "application/x-download";
    if (
      !allowedMimesByExtension[extension] ||
      (!acceptsGenericMime && !allowedMimesByExtension[extension].includes(mimeType))
    ) {
      callback(new UnsupportedFileTypeError());
      return;
    }
    callback(null, true);
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
  "nik_ayah",
  "nik_ibu",
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
const optionalTextFields = new Set<TextField>([
  "nisn",
  "riwayat_penyakit",
  "nama_wali",
  "hubungan_wali",
]);
const requiredTextFields = textFields.filter((field) => !optionalTextFields.has(field));
const schoolTextFields = new Set<TextField>([
  "nama_sekolah_asal",
  "tahun_lulus",
  "alamat_sekolah_asal",
]);
const earlyEducationLevels = new Set(["Playgroup", "Daycare", "TK-A", "TK-B"]);
const minimumAgeByLevel: Record<string, number> = {
  Playgroup: 3,
  "TK-A": 4,
  "TK-B": 5,
  SD: 6,
};
const validFieldValues: Partial<Record<TextField, readonly string[]>> = {
  status_anak: ["Anak kandung", "Anak tiri", "Anak angkat"],
  agama: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"],
  transportasi: ["Jalan kaki", "Kendaraan pribadi", "Kendaraan umum", "Antar-jemput"],
};

const uploadMiddleware = upload.fields(
  documentFields.map((name) => ({ name, maxCount: 1 })),
);

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function getValue(request: Request, field: TextField): string {
  const value = request.body?.[field];
  return typeof value === "string" ? value.trim() : "";
}

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string") return code;
  const cause = (error as { cause?: unknown }).cause;
  return cause ? getErrorCode(cause) : null;
}

function getSubmissionFailureMessage(error: unknown): string {
  const code = getErrorCode(error);
  if (code === "23502") {
    return "Database pendaftaran belum disinkronkan dengan formulir terbaru. Kolom sekolah asal harus boleh kosong untuk Playgroup, Daycare, TK-A, dan TK-B.";
  }
  if (code === "42P01" || code === "42703") {
    return "Struktur database pendaftaran belum sinkron. Jalankan migrasi database lalu coba lagi.";
  }
  if (code === "08001" || code === "08003" || code === "08006" || code === "57P01") {
    return "Layanan database sedang tidak tersedia. Silakan coba lagi beberapa saat.";
  }
  return "Pendaftaran belum dapat disimpan. Silakan coba lagi.";
}

function getUploadedFile(
  request: Request,
  field: (typeof documentFields)[number],
): Express.Multer.File | undefined {
  const files = request.files as Record<string, Express.Multer.File[]> | undefined;
  return files?.[field]?.[0];
}

function consumeSubmitRateLimit(request: Request): number | null {
  const key = request.ip || request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = submitAttempts.get(key);

  if (!current || current.resetAt <= now) {
    if (submitAttempts.size > 10_000) {
      for (const [storedKey, storedValue] of submitAttempts) {
        if (storedValue.resetAt <= now) submitAttempts.delete(storedKey);
      }
    }
    submitAttempts.set(key, { count: 1, resetAt: now + submitRateLimitWindowMs });
    return null;
  }

  if (current.count >= submitRateLimitMaxRequests) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  }

  current.count += 1;
  return null;
}

function enforceSubmitRateLimit(request: Request, response: Parameters<typeof uploadMiddleware>[1], next: Parameters<typeof uploadMiddleware>[2]) {
  const retryAfter = consumeSubmitRateLimit(request);
  if (!retryAfter) {
    next();
    return;
  }

  response.setHeader("Retry-After", String(retryAfter));
  response.status(429).json({
    error: "Terlalu banyak pengajuan dari jaringan ini. Silakan coba lagi beberapa menit lagi.",
  });
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === Number(value.slice(0, 4)) &&
    date.getUTCMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getUTCDate() === Number(value.slice(8, 10))
  );
}

function isDigits(value: string, length: number): boolean {
  return new RegExp(`^\\d{${length}}$`).test(value);
}

function isValidPhoneNumber(value: string): boolean {
  const normalized = value.replace(/[^\d+]/g, "");
  return /^(?:\+62|62|0)8\d{8,12}$/.test(normalized);
}

function getMinimumAgeError(level: string, birthDateValue: string): string | null {
  const minimumAge = minimumAgeByLevel[level];
  if (!minimumAge) return null;

  const birthDate = new Date(`${birthDateValue}T00:00:00.000Z`);
  const latestAllowedBirthDate = Date.UTC(2027 - minimumAge, 6, 31);
  return birthDate.getTime() <= latestAllowedBirthDate
    ? null
    : `Untuk jenjang ${level}, calon peserta didik harus berusia minimal ${minimumAge} tahun pada 31 Juli 2027.`;
}

function getFileSignatureError(file: Express.Multer.File, bytes: Buffer): string | null {
  const extension = path.extname(file.originalname).toLowerCase();
  const isPdf = bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  if (extension === ".pdf" && !isPdf) return "Isi berkas PDF tidak valid.";
  if ((extension === ".jpg" || extension === ".jpeg") && !isJpeg) return "Isi berkas JPG tidak valid.";
  if (extension === ".png" && !isPng) return "Isi berkas PNG tidak valid.";
  return null;
}

async function validateUploadedFiles(request: Request): Promise<string[]> {
  const invalidFiles: string[] = [];
  for (const field of documentFields) {
    const file = getUploadedFile(request, field);
    if (!file) continue;
    try {
      const error = getFileSignatureError(file, file.buffer);
      if (error) invalidFiles.push(`${field}: ${error}`);
    } catch {
      invalidFiles.push(`${field}: Berkas tidak dapat dibaca.`);
    }
  }
  return invalidFiles;
}

async function removeUploadedFiles(request: Request) {
  // Multer uses memoryStorage: there are no temporary files to clean up.
  void request;
}

function handleUpload(request: Request, response: Parameters<typeof uploadMiddleware>[1], next: Parameters<typeof uploadMiddleware>[2]) {
  uploadMiddleware(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    const respondAfterCleanup = (status: number, message: string) => {
      void removeUploadedFiles(request).finally(() => {
        request.log.error({ err: error }, "Failed to process multipart submission upload");
        response.status(status).json({ error: message });
      });
    };

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Ukuran setiap berkas maksimal 5 MB."
          : error.code === "LIMIT_FILE_COUNT"
            ? "Maksimal 5 berkas dapat diunggah."
            : error.code === "LIMIT_UNEXPECTED_FILE"
              ? `Nama berkas "${error.field || "tidak dikenal"}" tidak dapat diunggah.`
              : error.code === "LIMIT_FIELD_COUNT" || error.code === "LIMIT_PART_COUNT"
                ? "Formulir memiliki terlalu banyak bagian data."
                : error.code === "LIMIT_FIELD_VALUE"
                  ? "Ukuran salah satu isian teks terlalu besar."
            : "Berkas tidak dapat diproses. Periksa format dan ukuran berkas.";
      respondAfterCleanup(400, message);
      return;
    }

    if (error instanceof UnsupportedFileTypeError) {
      respondAfterCleanup(400, error.message);
      return;
    }

    const errorCode = typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
    const message = errorCode === "ENOSPC"
      ? "Penyimpanan server penuh. Berkas belum dapat diterima."
      : errorCode === "EACCES" || errorCode === "EPERM"
        ? "Folder penyimpanan berkas tidak dapat ditulis oleh server."
        : "Berkas belum dapat disimpan. Periksa ukuran dan format berkas, lalu coba lagi.";
    respondAfterCleanup(500, message);
  });
}

router.post("/submit", enforceSubmitRateLimit, handleUpload, async (request, response): Promise<void> => {
  const email = getValue(request, "email");
  const jenjang = getValue(request, "jenjang");
  const schoolDataRequired = !earlyEducationLevels.has(jenjang);
  const invalidFields = requiredTextFields
    .filter((field) => !schoolTextFields.has(field) || schoolDataRequired)
    .filter((field) => !getValue(request, field));
  const jenisKelamin = getValue(request, "jenis_kelamin");
  const validLevels = allJenjang;
  const validGenders = ["Laki-laki", "Perempuan"];
  const bodyForValidation = Object.fromEntries([
    ...textFields.map((field) => {
      const value = getValue(request, field);
      // Nullish optional values are accepted by the generated contract
      // schema; an empty string would still fail patterns such as NISN.
       return [
         field,
         (optionalTextFields.has(field) || (schoolTextFields.has(field) && !schoolDataRequired)) && !value
           ? null
           : value,
       ];
    }),
    // The generated multipart contract represents uploads as strings. Use
    // their original names for contract validation while Multer keeps the
    // actual files available for signature and size checks below.
    ...documentFields.map((field) => [field, getUploadedFile(request, field)?.originalname]),
  ]);
  const contractResult = SubmitApplicationBody.safeParse(bodyForValidation);
  const schemaFields = contractResult.success
    ? []
    : Object.keys(contractResult.error.flatten().fieldErrors);

  const numericRules: Record<string, { min: number; max: number; integer: boolean }> = {
    anak_ke: { min: 1, max: 20, integer: true },
    jumlah_saudara: { min: 0, max: 50, integer: true },
    tinggi_badan: { min: 30, max: 250, integer: false },
    berat_badan: { min: 2, max: 250, integer: false },
    tahun_lulus: { min: 1900, max: new Date().getFullYear() + 1, integer: true },
  };
  const numericFields = Object.keys(numericRules);
  const invalidNumbers = numericFields.filter((field) => {
    if (!schoolDataRequired && field === "tahun_lulus") return false;
    const value = Number(getValue(request, field as TextField));
    const rule = numericRules[field];
    return (
      !Number.isFinite(value) ||
      value < rule.min ||
      value > rule.max ||
      (rule.integer && !Number.isInteger(value))
    );
  });
  const missingFiles = documentFields.filter((field) => !getUploadedFile(request, field));
  const invalidFormats: string[] = [];
  const nisn = getValue(request, "nisn");
  const nikAnak = getValue(request, "nik_anak");
  const nikAyah = getValue(request, "nik_ayah");
  const nikIbu = getValue(request, "nik_ibu");
  const nomorKk = getValue(request, "nomor_kk");
  const nomorHp = getValue(request, "nomor_hp_orangtua");
  if (nisn && !isDigits(nisn, 10)) invalidFormats.push("nisn");
  if (nikAnak && !isDigits(nikAnak, 16)) invalidFormats.push("nik_anak");
  if (nikAyah && !isDigits(nikAyah, 16)) invalidFormats.push("nik_ayah");
  if (nikIbu && !isDigits(nikIbu, 16)) invalidFormats.push("nik_ibu");
  if (nomorKk && !isDigits(nomorKk, 16)) invalidFormats.push("nomor_kk");
  if (nomorHp && !isValidPhoneNumber(nomorHp)) invalidFormats.push("nomor_hp_orangtua");
  for (const [field, allowedValues] of Object.entries(validFieldValues)) {
    const value = getValue(request, field as TextField);
    if (value && !allowedValues?.includes(value)) invalidFormats.push(field);
  }
  const birthDate = getValue(request, "tanggal_lahir");
  let ageRequirementError: string | null = null;
  if (!isValidDate(birthDate)) {
    invalidFormats.push("tanggal_lahir");
  } else {
    const parsedBirthDate = new Date(`${birthDate}T00:00:00.000Z`);
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    if (parsedBirthDate.getTime() > todayUtc || parsedBirthDate.getUTCFullYear() < 1900) {
      invalidFormats.push("tanggal_lahir");
    } else {
      ageRequirementError = getMinimumAgeError(jenjang, birthDate);
      if (ageRequirementError) invalidFormats.push("tanggal_lahir");
    }
  }
  if (getValue(request, "nama_wali") !== "" && getValue(request, "hubungan_wali") === "") {
    invalidFormats.push("hubungan_wali");
  }
  if (getValue(request, "nama_wali") === "" && getValue(request, "hubungan_wali") !== "") {
    invalidFormats.push("nama_wali");
  }
  const maxLengths: Partial<Record<TextField, number>> = {
    alamat_domisili: 1000,
    alamat_sekolah_asal: 1000,
    riwayat_penyakit: 1000,
  };
  const oversizedFields = textFields.filter((field) => {
    const maxLength = maxLengths[field] ?? 255;
    return getValue(request, field).length > maxLength;
  });
  const invalidFiles = await validateUploadedFiles(request);
  const invalidFormatFields = [...new Set([...schemaFields, ...invalidFormats, ...oversizedFields])];
  const invalidFileFields = [...missingFiles, ...invalidFiles];

  if (
    invalidFields.length ||
    invalidNumbers.length ||
    missingFiles.length ||
    invalidFormatFields.length ||
    invalidFiles.length ||
    !(validLevels as readonly string[]).includes(jenjang) ||
    !validGenders.includes(jenisKelamin) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    await removeUploadedFiles(request);
    response.status(400).json({
      error: invalidFiles.length
        ? invalidFiles[0]
        : missingFiles.length
          ? `${documentLabels[missingFiles[0]]} wajib diunggah.`
          : invalidNumbers.length
            ? `Nilai ${invalidNumbers[0].replaceAll("_", " ")} berada di luar batas yang diperbolehkan.`
            : ageRequirementError
              ? ageRequirementError
            : "Mohon lengkapi semua kolom dan pastikan format data sudah benar.",
      fields: [...new Set([...invalidFields, ...invalidNumbers, ...invalidFileFields, ...invalidFormatFields])],
    });
    return;
  }

  try {
    const uploadedFiles: ApplicationFileInput[] = documentFields.flatMap((field) => {
      const file = getUploadedFile(request, field);
      return file
        ? [{
            field,
            originalName: file.originalname,
            mimeType: file.mimetype,
            data: file.buffer,
          }]
        : [];
    });
    const values = {
      jenjang,
      nama_calon: getValue(request, "nama_calon"),
      nama_panggilan: getValue(request, "nama_panggilan"),
      jenis_kelamin: jenisKelamin,
      tempat_lahir: getValue(request, "tempat_lahir"),
      tanggal_lahir: getValue(request, "tanggal_lahir"),
      nisn: getValue(request, "nisn") || null,
      nik_anak: getValue(request, "nik_anak"),
      alamat_domisili: getValue(request, "alamat_domisili"),
      anak_ke: Number(getValue(request, "anak_ke")),
      jumlah_saudara: Number(getValue(request, "jumlah_saudara")),
      status_anak: getValue(request, "status_anak"),
      agama: getValue(request, "agama"),
      warga_negara: getValue(request, "warga_negara"),
      tinggi_badan: Number(getValue(request, "tinggi_badan")),
      berat_badan: Number(getValue(request, "berat_badan")),
      riwayat_penyakit: getValue(request, "riwayat_penyakit") || null,
      transportasi: getValue(request, "transportasi"),
      jarak_sekolah: getValue(request, "jarak_sekolah"),
       nama_sekolah_asal: getValue(request, "nama_sekolah_asal") || null,
       tahun_lulus: getValue(request, "tahun_lulus") ? Number(getValue(request, "tahun_lulus")) : null,
       alamat_sekolah_asal: getValue(request, "alamat_sekolah_asal") || null,
      nomor_kk: getValue(request, "nomor_kk"),
       nik_ayah: getValue(request, "nik_ayah"),
       nik_ibu: getValue(request, "nik_ibu"),
      nomor_hp_orangtua: getValue(request, "nomor_hp_orangtua"),
      email,
      nama_ayah: getValue(request, "nama_ayah"),
      ttl_ayah: getValue(request, "ttl_ayah"),
      pendidikan_ayah: getValue(request, "pendidikan_ayah"),
      pekerjaan_ayah: getValue(request, "pekerjaan_ayah"),
      penghasilan_ayah: getValue(request, "penghasilan_ayah"),
      instansi_jabatan_ayah: getValue(request, "instansi_jabatan_ayah"),
      nama_ibu: getValue(request, "nama_ibu"),
      ttl_ibu: getValue(request, "ttl_ibu"),
      pendidikan_ibu: getValue(request, "pendidikan_ibu"),
      pekerjaan_ibu: getValue(request, "pekerjaan_ibu"),
      penghasilan_ibu: getValue(request, "penghasilan_ibu"),
      instansi_jabatan_ibu: getValue(request, "instansi_jabatan_ibu"),
      nama_wali: getValue(request, "nama_wali") || null,
      hubungan_wali: getValue(request, "hubungan_wali") || null,
      foto_3x4_path: null,
      akte_lahir_path: null,
      kartu_keluarga_path: null,
      ktp_orangtua_path: null,
      bukti_bayar_path: null,
    };

    const result = await insertPendaftar(values, uploadedFiles);
    const id = Number(result.id);
    request.log.info({ applicationId: id }, "SPMB application submitted");

    response.status(201).json({
      success: true,
      message: "Pendaftaran berhasil dikirim.",
      id,
      receiptUrl: `/api/submissions/${id}/receipt?token=${createReceiptToken(id)}`,
    });
    return;
  } catch (error) {
    if (error instanceof RegistrationQuotaFullError) {
      await removeUploadedFiles(request);
      response.status(409).json({
        error: error.message,
        fields: ["jenjang", ...(error.jenisKelamin ? ["jenis_kelamin"] : [])],
      });
      return;
    }
    request.log.error({ err: error, errorCode: getErrorCode(error) }, "Failed to save SPMB application");
    await removeUploadedFiles(request);
    response.status(500).json({
      error: getSubmissionFailureMessage(error),
    });
    return;
  }
});

function parseApplicationNumber(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  const match = /^(?:SPMB-)?(\d+)$/.exec(normalized);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

router.get("/submissions/status", async (request, response) => {
  const id = parseApplicationNumber(request.query.number);
  if (!id) {
    return response.status(400).json({
      error: "Masukkan nomor pengajuan dengan format SPMB-000001.",
    });
  }

  try {
    const application = await getPublicPendaftarStatus(id);
    if (!application) {
      return response.status(404).json({
        error: "Nomor pengajuan tidak ditemukan. Periksa kembali nomor pada bukti pendaftaran.",
      });
    }

    return response.json({
      id: application.id,
      applicationNumber: `SPMB-${String(application.id).padStart(6, "0")}`,
      nama_calon: application.nama_calon,
      jenjang: application.jenjang,
      status: application.status,
      created_at: application.created_at,
    });
  } catch (error) {
    request.log.error({ err: error, applicationId: id }, "Failed to check SPMB application status");
    return response.status(500).json({ error: "Status pengajuan belum dapat diperiksa." });
  }
});

router.get("/submissions/:id/receipt", async (request, response) => {
  const id = parseId(request.params.id);
  const token = typeof request.query.token === "string" ? request.query.token : "";
  if (!id || !token || !/^[a-f0-9]{64}$/i.test(token)) {
    return response.status(404).json({ error: "Bukti formulir tidak ditemukan." });
  }

  try {
    if (!isValidReceiptToken(id, token)) {
      return response.status(404).json({ error: "Bukti formulir tidak ditemukan." });
    }
    const application = await getPendaftar(id);
    if (!application) {
      return response.status(404).json({ error: "Bukti formulir tidak ditemukan." });
    }

    const pdf = await createSpmbReceipt(application);
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename="bukti-formulir-spmb-${id}.pdf"`);
    return response.end(Buffer.from(pdf));
  } catch (error) {
    request.log.error({ err: error, applicationId: id }, "Failed to create SPMB receipt");
    return response.status(500).json({ error: "Bukti formulir belum dapat dibuat." });
  }
});

export default router;