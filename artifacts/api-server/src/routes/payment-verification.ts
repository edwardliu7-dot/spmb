import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";

const router = Router();

export const paymentVerificationCookieName = "spmb_payment_verified";
const maxPaymentProofSize = 5 * 1024 * 1024;
const verificationWindowMs = 15 * 60 * 1000;
const verificationMaxRequests = 8;
const verificationAttempts = new Map<string, { count: number; resetAt: number }>();

class UnsupportedPaymentProofError extends Error {
  constructor() {
    super("Untuk verifikasi AI, unggah bukti bayar dalam format JPG atau PNG.");
    this.name = "UnsupportedPaymentProofError";
  }
}

const uploadPaymentProof = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxPaymentProofSize,
    files: 1,
    fields: 1,
    parts: 2,
  },
  fileFilter: (_request, file, callback) => {
    const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
    const validMime = file.mimetype === "image/jpeg" || file.mimetype === "image/png";
    const validExtension = extension === ".jpg" || extension === ".jpeg" || extension === ".png";
    if (!validMime || !validExtension) {
      callback(new UnsupportedPaymentProofError());
      return;
    }
    callback(null, true);
  },
}).single("bukti_bayar");

function getRateLimitKey(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function enforceVerificationRateLimit(request: Request, response: Response, next: NextFunction): void {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const current = verificationAttempts.get(key);

  if (!current || current.resetAt <= now) {
    verificationAttempts.set(key, { count: 1, resetAt: now + verificationWindowMs });
    next();
    return;
  }

  if (current.count >= verificationMaxRequests) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    response.setHeader("Retry-After", String(retryAfter));
    response.status(429).json({
      error: "Terlalu banyak percobaan verifikasi. Silakan coba lagi beberapa menit lagi.",
    });
    return;
  }

  current.count += 1;
  next();
}

function handlePaymentProofUpload(request: Request, response: Response, next: NextFunction): void {
  uploadPaymentProof(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Ukuran bukti bayar maksimal 5 MB."
          : error.code === "LIMIT_FILE_COUNT"
            ? "Unggah satu bukti bayar saja."
            : error.code === "LIMIT_UNEXPECTED_FILE"
              ? "Gunakan nama field bukti_bayar untuk berkas pembayaran."
              : error.code === "LIMIT_FIELD_COUNT"
                ? "Hanya satu berkas bukti bayar yang dapat dikirim."
                : error.code === "LIMIT_PART_COUNT"
                  ? "Format permintaan bukti bayar tidak valid."
              : "Bukti bayar tidak dapat diproses. Periksa format dan ukurannya.";
      response.status(400).json({ error: message });
      return;
    }

    if (error instanceof UnsupportedPaymentProofError) {
      response.status(400).json({ error: error.message });
      return;
    }

    next(error);
  });
}

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer: Buffer): boolean {
  return buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function extractJson(content: string): Record<string, unknown> | null {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 160) : null;
}

function confidenceValue(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(1, parsed));
}

function setVerificationCookie(response: Response): void {
  response.cookie(paymentVerificationCookieName, "verified", {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 60 * 1000,
    path: "/",
  });
}

router.post(
  "/payment/verify",
  enforceVerificationRateLimit,
  handlePaymentProofUpload,
  async (request, response): Promise<void> => {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      response.status(503).json({
        error: "Verifikasi AI belum tersedia. Silakan hubungi panitia SPMB.",
      });
      return;
    }

    const file = request.file;
    if (!file) {
      response.status(400).json({ error: "Bukti pembayaran wajib diunggah." });
      return;
    }

    const signatureValid = file.mimetype === "image/png" ? isPng(file.buffer) : isJpeg(file.buffer);
    if (!signatureValid) {
      response.status(400).json({
        error: "Isi bukti bayar tidak sesuai dengan format gambar yang dipilih.",
      });
      return;
    }

    const imageData = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "qwen/qwen3.6-27b",
          temperature: 0,
          max_completion_tokens: 500,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: [
                "Anda adalah pemeriksa awal bukti pembayaran SPMB.",
                "Tugas Anda hanya mengenali apakah gambar tampak seperti bukti transaksi pembayaran yang terbaca.",
                "Jangan pernah mengklaim bahwa dana benar-benar sudah diterima atau membuat keputusan hukum.",
                "Jika gambar bukan bukti transaksi, tidak terbaca, atau mencurigakan, jangan setujui.",
                "Balas HANYA JSON valid dengan format:",
                '{"decision":"verified|needs_review|rejected","confidence":0.0,"reason":"...","amount":"...","transaction_reference":"...","recipient":"...","transaction_date":"..."}',
                "Gunakan string kosong untuk detail yang tidak terbaca. decision verified hanya jika bukti tampak jelas dan confidence minimal 0.75.",
              ].join(" "),
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analisis bukti pembayaran ini untuk screening awal pendaftaran SPMB.",
                },
                {
                  type: "image_url",
                  image_url: { url: imageData },
                },
              ],
            },
          ],
        }),
      });

      if (!groqResponse.ok) {
        const providerError = (await groqResponse.text()).slice(0, 500);
        request.log.warn(
          { status: groqResponse.status, providerError },
          "Groq payment verification request rejected",
        );
        response.status(502).json({
          error: groqResponse.status === 401 || groqResponse.status === 403
            ? "Kredensial verifikasi AI belum dapat digunakan. Perbarui GROQ_API_KEY di Secrets."
            : "Layanan verifikasi AI sedang tidak dapat dihubungi. Silakan coba lagi.",
        });
        return;
      }

      const payload = await groqResponse.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      const analysis = typeof content === "string" ? extractJson(content) : null;
      if (!analysis) {
        response.status(502).json({
          error: "Hasil verifikasi AI tidak dapat dibaca. Silakan unggah gambar yang lebih jelas.",
        });
        return;
      }

      const decision = stringValue(analysis.decision);
      const confidence = confidenceValue(analysis.confidence);
      const verified = decision === "verified" && confidence >= 0.75;
      if (verified) setVerificationCookie(response);

      response.json({
        success: true,
        status: verified ? "verified" : decision === "rejected" ? "rejected" : "needs_review",
        message: verified
          ? "Bukti pembayaran berhasil dikenali. Anda dapat melanjutkan pendaftaran."
          : "Bukti pembayaran belum dapat diverifikasi otomatis. Periksa gambar atau hubungi panitia.",
        confidence,
        details: {
          amount: stringValue(analysis.amount),
          transactionReference: stringValue(analysis.transaction_reference),
          recipient: stringValue(analysis.recipient),
          transactionDate: stringValue(analysis.transaction_date),
        },
        reason: stringValue(analysis.reason) || "Detail transaksi belum cukup terbaca.",
      });
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "AbortError";
      request.log.error({ err: error }, "Groq payment verification request failed");
      response.status(502).json({
        error: isTimeout
          ? "Verifikasi AI terlalu lama. Silakan coba lagi dengan gambar yang lebih kecil."
          : "Terjadi kendala saat memeriksa bukti pembayaran. Silakan coba lagi.",
      });
    } finally {
      clearTimeout(timeout);
    }
  },
);

export default router;