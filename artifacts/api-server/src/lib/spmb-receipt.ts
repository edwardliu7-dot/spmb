import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import type { Pendaftar } from "@workspace/db";
import { readApplicationFile, type ApplicationDocumentField } from "./application-files";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.basename(moduleDirectory) === "lib"
  ? path.resolve(moduleDirectory, "../..")
  : path.resolve(moduleDirectory, "..");
const workspaceRoot = path.resolve(packageRoot, "../..");
const templatePath = path.join(packageRoot, "assets", "bukti-formulir-spmb-template.pdf");
const schoolLogoPath = path.join(workspaceRoot, "lib", "logo tisa.png");

type TopRect = {
  x: number;
  top: number;
  width: number;
  height: number;
};

type ImageAttachment = {
  pageIndex: number;
  field: ApplicationDocumentField;
  path: string | null;
  label: string;
  box: TopRect;
};

const studentRowBounds = [
  [184.5, 210.5],
  [210.5, 223.5],
  [223.5, 237.5],
  [237.5, 250.5],
  [250.5, 264.5],
  [264.5, 290.5],
  [290.5, 304.5],
  [304.5, 318.5],
  [318.5, 333.5],
  [333.5, 347.5],
  [347.5, 361.5],
  [361.5, 375.5],
  [375.5, 390.5],
  [390.5, 404.5],
  [404.5, 418.5],
  [418.5, 432.5],
  [432.5, 447.5],
  [447.5, 461.5],
  [461.5, 475.5],
  [475.5, 489.5],
  [489.5, 504.5],
  [504.5, 519.5],
] as const;

const parentRowBounds = [
  [547.5, 560.5],
  [560.5, 574.5],
  [574.5, 587.5],
  [587.5, 600.5],
  [600.5, 614.5],
  [614.5, 627.5],
  [627.5, 641.5],
  [641.5, 654.5],
  [654.5, 667.5],
  [667.5, 681.5],
  [681.5, 694.5],
  [694.5, 708.5],
  [708.5, 721.5],
  [721.5, 734.5],
  [734.5, 748.5],
  [748.5, 761.5],
  [761.5, 775.5],
  [775.5, 788.5],
  [788.5, 801.5],
] as const;

function textValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  const result = String(value)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return result || "-";
}

function formatPdfDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function toPdfRect(page: PDFPage, rect: TopRect) {
  return {
    x: rect.x,
    y: page.getHeight() - rect.top - rect.height,
    width: rect.width,
    height: rect.height,
  };
}

function clearRect(page: PDFPage, rect: TopRect): void {
  page.drawRectangle({
    ...toPdfRect(page, rect),
    color: rgb(1, 1, 1),
  });
}

function measure(font: PDFFont, text: string, size: number): number {
  return font.widthOfTextAtSize(text, size);
}

function fittedFontSize(font: PDFFont, text: string, maxWidth: number, preferred = 8.8): number {
  let size = preferred;
  while (size > 5.2 && measure(font, text, size) > maxWidth) size -= 0.25;
  return size;
}

function drawTextInRect(
  page: PDFPage,
  text: string,
  rect: TopRect,
  font: PDFFont,
  options: { preferredSize?: number; wrap?: boolean } = {},
): void {
  const value = textValue(text);
  const padding = 2;
  const maxWidth = rect.width - padding * 2;
  const preferredSize = options.preferredSize ?? 8.8;

  if (options.wrap && value.length > 24) {
    const words = value.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    let size = preferredSize;
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(font, candidate, size) <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    while (lines.length > 2 && size > 5.2) {
      size -= 0.25;
      lines.length = 0;
      line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (measure(font, candidate, size) <= maxWidth || !line) {
          line = candidate;
        } else {
          lines.push(line);
          line = word;
        }
      }
      if (line) lines.push(line);
    }
    const visibleLines = lines.slice(0, 2);
    const lineHeight = Math.min(9.5, rect.height / Math.max(visibleLines.length, 1));
    const bottomY = page.getHeight() - rect.top - rect.height + rect.height - lineHeight - 1;
    visibleLines.forEach((lineText, index) => {
      page.drawText(lineText, {
        x: rect.x + padding,
        y: bottomY - index * lineHeight,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    });
    return;
  }

  const size = fittedFontSize(font, value, maxWidth, preferredSize);
  const y = page.getHeight() - rect.top - rect.height + (rect.height - size) / 2 + 1;
  page.drawText(value, {
    x: rect.x + padding,
    y,
    size,
    font,
    color: rgb(0, 0, 0),
  });
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  rect: TopRect,
  font: PDFFont,
  preferredSize = 8.8,
): void {
  const value = textValue(text);
  const size = fittedFontSize(font, value, rect.width - 4, preferredSize);
  const width = measure(font, value, size);
  const pdfRect = toPdfRect(page, rect);
  page.drawText(value, {
    x: pdfRect.x + Math.max(2, (pdfRect.width - width) / 2),
    y: pdfRect.y + (pdfRect.height - size) / 2 + 1,
    size,
    font,
    color: rgb(0, 0, 0),
  });
}

function getReceiptSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required to create a receipt token.");
  return secret;
}

export function createReceiptToken(applicationId: number): string {
  return createHmac("sha256", getReceiptSecret()).update(String(applicationId)).digest("hex");
}

export function isValidReceiptToken(applicationId: number, token: string): boolean {
  return token === createReceiptToken(applicationId);
}

function splitCombinedValue(value: string): { institution: string; position: string } {
  const separator = " / ";
  const parts = value.split(separator);
  if (parts.length < 2) return { institution: value, position: "-" };
  return { institution: parts.slice(0, -1).join(separator), position: parts.at(-1) || "-" };
}

async function drawAttachment(
  document: PDFDocument,
  page: PDFPage,
  applicationId: number,
  attachment: ImageAttachment,
  font: PDFFont,
): Promise<void> {
  clearRect(page, attachment.box);
  const file = await readApplicationFile(applicationId, attachment.field, attachment.path);
  if (!file) {
    drawCenteredText(page, `${attachment.label} belum tersedia`, attachment.box, font, 10);
    return;
  }

  try {
    const bytes = file.data;
    const extension = path.extname(file.originalName).toLowerCase();
    if (extension === ".jpg" || extension === ".jpeg" || extension === ".png") {
      const image: PDFImage = extension === ".png"
        ? await document.embedPng(bytes)
        : await document.embedJpg(bytes);
      const pdfBox = toPdfRect(page, attachment.box);
      const dimensions = image.scaleToFit(pdfBox.width - 8, pdfBox.height - 8);
      page.drawImage(image, {
        x: pdfBox.x + (pdfBox.width - dimensions.width) / 2,
        y: pdfBox.y + (pdfBox.height - dimensions.height) / 2,
        width: dimensions.width,
        height: dimensions.height,
      });
      return;
    }

    if (extension === ".pdf") {
      drawCenteredText(page, `${attachment.label} tersedia pada halaman tambahan`, attachment.box, font, 9);
      const attachmentDocument = await PDFDocument.load(bytes);
      const copiedPages = await document.copyPages(attachmentDocument, attachmentDocument.getPageIndices());
      copiedPages.forEach((copiedPage) => document.addPage(copiedPage));
      return;
    }
  } catch {
    // Keep the receipt downloadable even when an uploaded attachment is unavailable.
  }

  drawCenteredText(page, `${attachment.label} belum tersedia`, attachment.box, font, 9);
}

export async function createSpmbReceipt(application: Pendaftar): Promise<Uint8Array> {
  const document = await PDFDocument.load(await readFile(templatePath));
  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
  const schoolLogo = await document.embedPng(await readFile(schoolLogoPath));
  const page1 = document.getPage(0);
  const page2 = document.getPage(1);
  const page7 = document.getPage(6);

  clearRect(page1, { x: 135, top: 32, width: 335, height: 39 });
  drawCenteredText(page1, "TISA Islamic School", { x: 135, top: 32, width: 335, height: 39 }, boldFont, 27);
  clearRect(page1, { x: 62, top: 32, width: 78, height: 76 });
  const page1LogoSize = schoolLogo.scaleToFit(70, 70);
  page1.drawImage(schoolLogo, {
    x: 101 - page1LogoSize.width / 2,
    y: page1.getHeight() - 32 - 76 + (76 - page1LogoSize.height) / 2,
    width: page1LogoSize.width,
    height: page1LogoSize.height,
  });
  clearRect(page1, { x: 220, top: 128, width: 160, height: 17 });
  drawCenteredText(page1, "TISA Islamic School", { x: 220, top: 128, width: 160, height: 17 }, boldFont, 10);
  clearRect(page1, { x: 220, top: 142, width: 160, height: 17 });
  drawCenteredText(page1, "TP. 2027 / 2028", { x: 220, top: 142, width: 160, height: 17 }, boldFont, 10);

  const studentValues = [
    application.nama_calon,
    application.nama_panggilan,
    application.jenis_kelamin,
    application.nisn,
    application.nik_anak,
    application.alamat_domisili,
    `${textValue(application.tempat_lahir)}, ${formatPdfDate(application.tanggal_lahir)}`,
    application.anak_ke,
    application.status_anak,
    application.warga_negara,
    application.agama,
    application.jumlah_saudara,
    application.riwayat_penyakit,
    `${textValue(application.tinggi_badan)} cm dan ${textValue(application.berat_badan)} kg`,
    application.transportasi,
    application.jarak_sekolah,
    application.email,
    application.nama_sekolah_asal,
    application.alamat_sekolah_asal,
    application.tahun_lulus,
    formatPdfDate(application.created_at),
    application.jenjang,
  ];
  studentValues.forEach((value, index) => {
    const [top, bottom] = studentRowBounds[index];
    const rect = { x: 286.5, top: top + 0.5, width: 166, height: bottom - top - 1 };
    clearRect(page1, rect);
    drawTextInRect(page1, textValue(value), rect, regularFont, {
      wrap: bottom - top > 20,
    });
  });

  const father = splitCombinedValue(textValue(application.instansi_jabatan_ayah));
  const mother = splitCombinedValue(textValue(application.instansi_jabatan_ibu));
  const parentValues = [
    application.nomor_kk,
    application.nik_ayah,
    application.nama_ayah,
    application.ttl_ayah,
    application.pekerjaan_ayah,
    application.pendidikan_ayah,
    father.institution,
    father.position,
    application.penghasilan_ayah,
    application.nik_ibu,
    application.nama_ibu,
    application.ttl_ibu,
    application.pekerjaan_ibu,
    application.pendidikan_ibu,
    mother.institution,
    mother.position,
    application.penghasilan_ibu,
    application.nomor_hp_orangtua,
    application.nama_wali,
  ];
  parentValues.forEach((value, index) => {
    const [top, bottom] = parentRowBounds[index];
    const rect = { x: 286.5, top: top + 0.5, width: 270, height: bottom - top - 1 };
    clearRect(page1, rect);
    drawTextInRect(page1, textValue(value), rect, regularFont);
  });

  clearRect(page1, { x: 458, top: 303, width: 99, height: 82 });
  const photoFile = await readApplicationFile(application.id, "foto_3x4", application.foto_3x4_path);
  if (photoFile) {
    const photoBytes = photoFile.data;
    const photoExtension = path.extname(photoFile.originalName).toLowerCase();
    if (photoExtension === ".png" || photoExtension === ".jpg" || photoExtension === ".jpeg") {
      const photo = photoExtension === ".png"
        ? await document.embedPng(photoBytes)
        : await document.embedJpg(photoBytes);
      const dimensions = photo.scaleToFit(84, 112);
      page1.drawImage(photo, {
        x: 507.5 - dimensions.width / 2,
        y: page1.getHeight() - 303 - 82 + (82 - dimensions.height) / 2,
        width: dimensions.width,
        height: dimensions.height,
      });
    }
  }

  const guardianRelationRect = { x: 286.5, top: 37.5, width: 270, height: 12 };
  clearRect(page2, guardianRelationRect);
  drawTextInRect(page2, textValue(application.hubungan_wali), guardianRelationRect, regularFont);
  clearRect(page2, { x: 320, top: 76, width: 240, height: 18 });
  drawCenteredText(page2, `Bekasi, ${formatPdfDate(application.created_at)}`, { x: 320, top: 76, width: 240, height: 18 }, regularFont, 10);
  clearRect(page2, { x: 320, top: 185, width: 240, height: 21 });
  drawCenteredText(page2, `${textValue(application.nama_ayah)} / ${textValue(application.nama_ibu)}`, { x: 320, top: 185, width: 240, height: 21 }, regularFont, 9);

  const attachments: ImageAttachment[] = [
    { pageIndex: 2, field: "akte_lahir", path: application.akte_lahir_path, label: "Akta kelahiran", box: { x: 42, top: 119, width: 512, height: 253 } },
    { pageIndex: 3, field: "kartu_keluarga", path: application.kartu_keluarga_path, label: "Kartu Keluarga", box: { x: 42, top: 102, width: 512, height: 271 } },
    { pageIndex: 4, field: "bukti_bayar", path: application.bukti_bayar_path, label: "Bukti pembayaran", box: { x: 42, top: 116, width: 512, height: 271 } },
    { pageIndex: 5, field: "ktp_orangtua", path: application.ktp_orangtua_path, label: "KTP orang tua", box: { x: 42, top: 135, width: 512, height: 270 } },
  ];
  for (const attachment of attachments) {
    await drawAttachment(document, document.getPage(attachment.pageIndex), application.id, attachment, regularFont);
  }

  clearRect(page7, { x: 70, top: 112, width: 78, height: 78 });
  const page7LogoSize = schoolLogo.scaleToFit(72, 72);
  page7.drawImage(schoolLogo, {
    x: 109 - page7LogoSize.width / 2,
    y: page7.getHeight() - 112 - 78 + (78 - page7LogoSize.height) / 2,
    width: page7LogoSize.width,
    height: page7LogoSize.height,
  });

  const statementValues = [
    { rect: { x: 214, top: 223, width: 340, height: 17 }, value: `: ${textValue(application.nama_ibu)}` },
    { rect: { x: 214, top: 242, width: 340, height: 17 }, value: `: ${textValue(application.alamat_domisili)}` },
    { rect: { x: 214, top: 261, width: 340, height: 17 }, value: `: ${textValue(application.nama_calon)}` },
    { rect: { x: 214, top: 280, width: 340, height: 17 }, value: `: ${textValue(application.nik_anak)}` },
    { rect: { x: 214, top: 299, width: 340, height: 17 }, value: `: ${textValue(application.tempat_lahir)}, ${formatPdfDate(application.tanggal_lahir)}` },
    { rect: { x: 214, top: 318, width: 340, height: 17 }, value: `: ${textValue(application.jenjang)}` },
  ];
  statementValues.forEach(({ rect, value }) => {
    clearRect(page7, rect);
    drawTextInRect(page7, textValue(value), rect, regularFont, { preferredSize: 9 });
  });
  clearRect(page7, { x: 320, top: 570, width: 240, height: 18 });
  drawCenteredText(page7, `Bekasi, ${formatPdfDate(application.created_at)}`, { x: 320, top: 570, width: 240, height: 18 }, regularFont, 10);
  clearRect(page7, { x: 320, top: 680, width: 180, height: 23 });
  drawCenteredText(page7, application.nama_ibu, { x: 320, top: 680, width: 180, height: 23 }, regularFont, 9);

  return document.save({ useObjectStreams: false });
}