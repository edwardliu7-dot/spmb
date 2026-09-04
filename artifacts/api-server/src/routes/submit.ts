import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import { readFile, unlink } from "node:fs/promises";
import { SubmitApplicationBody } from "@workspace/api-zod";
import { getPendaftar, insertPendaftar, uploadsDirectory } from "../lib/spmb-database";
import { allJenjang } from "../middlewares/committee-auth";
import { createReceiptToken, createSpmbReceipt, isValidReceiptToken } from "../lib/spmb-receipt";
import { paymentVerificationCookieName } from "./payment-verification";

const router = Router();

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
  limits: {
    fileSize: maxFileSize,
    files: documentFields.length,
    fields: 50,
    parts: 55,
    fieldNameSize: 100,
    fieldSize: 16 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const allowedExtensionsByMime: Record<string, string[]> = {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    };
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensionsByMime[file.mimetype]?.includes(extension)) {
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
const optionalTextFields = new Set<TextField>([
  "nisn",
  "riwayat_penyakit",
  "nama_wali",
  "hubungan_wali",
]);
const requiredTextFields = textFields.filter((field) => !optionalTextFields.has(field));
const validFieldValues: Partial<Record<TextField, readonly string[]>> = {
  status_anak: ["Anak kandung", "Anak tiri", "Anak angkat"],
  agama: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"],
  transportasi: ["Jalan kaki", "Kendaraan pribadi", "Kendaraan umum", "Antar-jemput"],
};

const uploadMiddleware = upload.fields(
  documentFields.map((name) => ({ name, maxCount: 1 })),
);

function requirePaymentVerification(request: Request, response: Response, next: NextFunction): void {
  if (request.signedCookies?.[paymentVerificationCookieName] === "verified") {
    next();
    return;
  }
  response.status(403).json({
    error: "Verifikasi pembayaran diperlukan sebelum mengirim pendaftaran.",
  });
}

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

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
      const bytes = await readFile(file.path);
      const error = getFileSignatureError(file, bytes);
      if (error) invalidFiles.push(`${field}: ${error}`);
    } catch {
      invalidFiles.push(`${field}: Berkas tidak dapat dibaca.`);
    }
  }
  return invalidFiles;
}

async function removeUploadedFiles(request: Request) {
  for (const field of documentFields) {
    const file = getUploadedFile(request, field);
    if (file) {
      await unlink(file.path).catch(() => undefined);
    }
  }
}

function handleUpload(request: Request, response: Parameters<typeof uploadMiddleware>[1], next: Parameters<typeof uploadMiddleware>[2]) {
  uploadMiddleware(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

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
      response.status(400).json({ error: message });
      return;
    }

    if (error instanceof UnsupportedFileTypeError) {
      response.status(400).json({ error: error.message });
      return;
    }

    next(error);
  });
}

router.post("/submit", enforceSubmitRateLimit, requirePaymentVerification, handleUpload, async (request, response): Promise<void> => {
  const invalidFields = requiredTextFields.filter((field) => !getValue(request, field));
  const email = getValue(request, "email");
  const jenjang = getValue(request, "jenjang");
  const jenisKelamin = getValue(request, "jenis_kelamin");
  const validLevels = allJenjang;
  const validGenders = ["Laki-laki", "Perempuan"];
  const bodyForValidation = Object.fromEntries([
    ...textFields.map((field) => {
      const value = getValue(request, field);
      // Nullish optional values are accepted by the generated contract
      // schema; an empty string would still fail patterns such as NISN.
      return [field, optionalTextFields.has(field) && !value ? null : value];
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
  const nikOrangtua = getValue(request, "nik_orangtua");
  const nomorKk = getValue(request, "nomor_kk");
  const nomorHp = getValue(request, "nomor_hp_orangtua");
  if (nisn && !isDigits(nisn, 10)) invalidFormats.push("nisn");
  if (nikAnak && !isDigits(nikAnak, 16)) invalidFormats.push("nik_anak");
  if (nikOrangtua && !isDigits(nikOrangtua, 16)) invalidFormats.push("nik_orangtua");
  if (nomorKk && !isDigits(nomorKk, 16)) invalidFormats.push("nomor_kk");
  if (nomorHp && !isValidPhoneNumber(nomorHp)) invalidFormats.push("nomor_hp_orangtua");
  for (const [field, allowedValues] of Object.entries(validFieldValues)) {
    const value = getValue(request, field as TextField);
    if (value && !allowedValues?.includes(value)) invalidFormats.push(field);
  }
  const birthDate = getValue(request, "tanggal_lahir");
  if (!isValidDate(birthDate)) {
    invalidFormats.push("tanggal_lahir");
  } else {
    const parsedBirthDate = new Date(`${birthDate}T00:00:00.000Z`);
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    if (parsedBirthDate.getTime() > todayUtc || parsedBirthDate.getUTCFullYear() < 1900) {
      invalidFormats.push("tanggal_lahir");
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
            : "Mohon lengkapi semua kolom dan pastikan format data sudah benar.",
      fields: [...new Set([...invalidFields, ...invalidNumbers, ...invalidFileFields, ...invalidFormatFields])],
    });
    return;
  }

  try {
    const uploadedPath = (field: (typeof documentFields)[number]) => {
      const file = getUploadedFile(request, field);
      return file ? path.relative(path.resolve(uploadsDirectory, ".."), file.path) : null;
    };
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
      nama_sekolah_asal: getValue(request, "nama_sekolah_asal"),
      tahun_lulus: Number(getValue(request, "tahun_lulus")),
      alamat_sekolah_asal: getValue(request, "alamat_sekolah_asal"),
      nomor_kk: getValue(request, "nomor_kk"),
      nik_orangtua: getValue(request, "nik_orangtua"),
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
      foto_3x4_path: uploadedPath("foto_3x4"),
      akte_lahir_path: uploadedPath("akte_lahir"),
      kartu_keluarga_path: uploadedPath("kartu_keluarga"),
      ktp_orangtua_path: uploadedPath("ktp_orangtua"),
      bukti_bayar_path: uploadedPath("bukti_bayar"),
    };

    const result = await insertPendaftar(values);
    const id = Number(result.id);
    response.clearCookie(paymentVerificationCookieName, { path: "/" });
    request.log.info({ applicationId: id }, "SPMB application submitted");

    response.status(201).json({
      success: true,
      message: "Pendaftaran berhasil dikirim.",
      id,
      receiptUrl: `/api/submissions/${id}/receipt?token=${createReceiptToken(id)}`,
    });
    return;
  } catch (error) {
    request.log.error({ err: error }, "Failed to save SPMB application");
    await removeUploadedFiles(request);
    response.status(500).json({
      error: "Pendaftaran belum dapat disimpan. Silakan coba lagi.",
    });
    return;
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