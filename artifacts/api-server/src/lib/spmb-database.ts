import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const packageRoot = path.resolve(process.cwd(), "artifacts/api-server");
export const uploadsDirectory = path.join(packageRoot, "uploads");
const dataDirectory = path.join(packageRoot, "data");
const databasePath = path.join(dataDirectory, "pendaftar.sqlite");

mkdirSync(uploadsDirectory, { recursive: true });
mkdirSync(dataDirectory, { recursive: true });

export const sqlite = new DatabaseSync(databasePath);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS pendaftar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jenjang TEXT NOT NULL,
    nama_calon TEXT NOT NULL,
    nama_panggilan TEXT NOT NULL,
    jenis_kelamin TEXT NOT NULL,
    tempat_lahir TEXT NOT NULL,
    tanggal_lahir TEXT NOT NULL,
    nisn TEXT NOT NULL,
    nik_anak TEXT NOT NULL,
    alamat_domisili TEXT NOT NULL,
    anak_ke INTEGER NOT NULL,
    jumlah_saudara INTEGER NOT NULL,
    status_anak TEXT NOT NULL,
    agama TEXT NOT NULL,
    warga_negara TEXT NOT NULL,
    tinggi_badan REAL NOT NULL,
    berat_badan REAL NOT NULL,
    riwayat_penyakit TEXT NOT NULL,
    transportasi TEXT NOT NULL,
    jarak_sekolah TEXT NOT NULL,
    nama_sekolah_asal TEXT NOT NULL,
    tahun_lulus INTEGER NOT NULL,
    alamat_sekolah_asal TEXT NOT NULL,
    nomor_kk TEXT NOT NULL,
    nik_orangtua TEXT NOT NULL,
    nomor_hp_orangtua TEXT NOT NULL,
    email TEXT NOT NULL,
    nama_ayah TEXT NOT NULL,
    ttl_ayah TEXT NOT NULL,
    pendidikan_ayah TEXT NOT NULL,
    pekerjaan_ayah TEXT NOT NULL,
    penghasilan_ayah TEXT NOT NULL,
    instansi_jabatan_ayah TEXT NOT NULL,
    nama_ibu TEXT NOT NULL,
    ttl_ibu TEXT NOT NULL,
    pendidikan_ibu TEXT NOT NULL,
    pekerjaan_ibu TEXT NOT NULL,
    penghasilan_ibu TEXT NOT NULL,
    instansi_jabatan_ibu TEXT NOT NULL,
    nama_wali TEXT NOT NULL,
    hubungan_wali TEXT NOT NULL,
    foto_3x4_path TEXT,
    akte_lahir_path TEXT,
    kartu_keluarga_path TEXT,
    ktp_orangtua_path TEXT,
    bukti_bayar_path TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

export const insertPendaftar = sqlite.prepare(`
  INSERT INTO pendaftar (
    jenjang, nama_calon, nama_panggilan, jenis_kelamin, tempat_lahir,
    tanggal_lahir, nisn, nik_anak, alamat_domisili, anak_ke, jumlah_saudara,
    status_anak, agama, warga_negara, tinggi_badan, berat_badan,
    riwayat_penyakit, transportasi, jarak_sekolah, nama_sekolah_asal,
    tahun_lulus, alamat_sekolah_asal, nomor_kk, nik_orangtua,
    nomor_hp_orangtua, email, nama_ayah, ttl_ayah, pendidikan_ayah,
    pekerjaan_ayah, penghasilan_ayah, instansi_jabatan_ayah, nama_ibu,
    ttl_ibu, pendidikan_ibu, pekerjaan_ibu, penghasilan_ibu,
    instansi_jabatan_ibu, nama_wali, hubungan_wali, foto_3x4_path,
    akte_lahir_path, kartu_keluarga_path, ktp_orangtua_path, bukti_bayar_path
  ) VALUES (${Array.from({ length: 45 }, () => "?").join(", ")})
`);