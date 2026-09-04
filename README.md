# SPMB TISA Islamic School 2027/2028

Sistem Penerimaan Murid Baru (SPMB) TISA Islamic School untuk tahun ajaran
2027/2028. Aplikasi ini menyediakan formulir pendaftaran publik untuk calon
peserta didik dan panel internal panitia untuk mengelola pengajuan sesuai
jenjang yang menjadi tanggung jawab setiap akun.

## Identitas aplikasi

- **Nama:** SPMB TISA Islamic School 2027/2028
- **Jenis:** Aplikasi web pendaftaran siswa baru
- **Bahasa antarmuka:** Bahasa Indonesia
- **Pengguna utama:**
  - Orang tua atau wali calon peserta didik
  - Panitia pendaftaran dan administrator sekolah
- **Tahun ajaran:** 2027/2028
- **Artifact web:** `artifacts/spmb-2027`
- **Artifact API:** `artifacts/api-server`

## Fitur utama

### Formulir publik

- Pendaftaran untuk jenjang Playgroup, Daycare, TK-A, TK-B, SD, dan SMP.
- Formulir dibagi menjadi empat bagian:
  1. Data calon peserta didik
  2. Sekolah asal
  3. Orang tua dan wali
  4. Berkas persyaratan
- Penyimpanan draft di browser agar isian tidak mudah hilang saat halaman
  dimuat ulang.
- Validasi sisi browser dan validasi ulang di server.
- Tema warna berubah langsung berdasarkan jenjang yang dipilih:
  - Default: putih dan biru laut
  - SMP: biru
  - SD: merah
  - Playgroup: oranye
  - TK-A dan TK-B: hijau
  - Daycare: kuning
- Unggah lima berkas persyaratan:
  - Pas foto 3×4
  - Akta kelahiran
  - Kartu Keluarga
  - KTP orang tua
  - Bukti pembayaran
- Nomor pengajuan dan bukti pendaftaran PDF setelah pengajuan berhasil.
- Pengecekan status pengajuan menggunakan nomor pada bukti pendaftaran.
- Penyaringan awal bukti pembayaran menggunakan Groq Vision jika layanan AI
  dikonfigurasi. Hasil AI bukan konfirmasi penerimaan dana.

### Panel panitia

- Login panitia dengan session cookie bertanda tangan dan HTTP-only.
- Dashboard pengelolaan pendaftar.
- Daftar dan detail pendaftar.
- Filter berdasarkan pencarian, jenjang, dan status.
- Pembaruan status: `Baru`, `Diverifikasi`, `Perlu Perbaikan`, `Diterima`,
  atau `Ditolak`.
- Notifikasi pekerjaan panitia dan penandaan telah dibaca.
- Observasi agregat per jenjang.
- Master data pendaftar.
- Ekspor master data ke XLSX.
- Download berkas satu pendaftar atau beberapa pendaftar dalam ZIP.
- Tema dashboard mengikuti akun setelah login:
  - Administrator: oranye
  - Data SMP: biru
  - Data SD: merah
  - Data PGTK: hijau

## Teknologi

- pnpm workspaces
- Node.js 24
- TypeScript 5.9
- Vite 7
- Frontend publik: HTML, CSS, dan JavaScript/TypeScript vanilla
- API: Express 5
- Upload: Multer
- Database: PostgreSQL
- ORM: Drizzle ORM
- Kontrak API: OpenAPI
- API code generation: Orval dan Zod
- Pembuatan PDF: `pdf-lib`
- Bundling API: esbuild

## Struktur proyek

```text
.
├── artifacts/
│   ├── spmb-2027/              # Frontend formulir publik dan panel panitia
│   ├── api-server/             # Server API Express
│   └── mockup-sandbox/         # Server preview komponen desain
├── lib/
│   ├── api-spec/               # Source of truth kontrak OpenAPI
│   ├── api-client-react/       # API client hasil code generation
│   ├── api-zod/                # Schema/tip hasil code generation
│   └── db/                     # Drizzle schema dan akses PostgreSQL
├── scripts/                    # Script workspace
├── replit.md                   # Konteks dan keputusan proyek
├── rules.md                    # Aturan bisnis, keamanan, dan pengembangan
└── pnpm-workspace.yaml
```

File penting:

- `artifacts/spmb-2027/src/main.tsx` — alur formulir publik.
- `artifacts/spmb-2027/src/panitia.ts` — login dan panel panitia.
- `artifacts/spmb-2027/src/form-board.css` — styling formulir publik.
- `artifacts/spmb-2027/src/panitia-dashboard.css` — styling panel panitia.
- `artifacts/api-server/src/routes/submit.ts` — pengajuan multipart dan status
  publik.
- `artifacts/api-server/src/routes/applications.ts` — daftar, detail, status,
  dan akses berkas pendaftar.
- `artifacts/api-server/src/routes/admin.ts` — notifikasi, observasi, master
  data, ekspor, dan ZIP.
- `artifacts/api-server/src/middlewares/committee-auth.ts` — autentikasi dan
  pembatasan cakupan jenjang.
- `lib/db/src/schema/pendaftar.ts` — schema tabel pendaftar dan audit terkait.
- `lib/api-spec/openapi.yaml` — kontrak API yang menjadi sumber kebenaran.

## Menjalankan aplikasi secara lokal

### Prasyarat

- Node.js 24 atau versi yang kompatibel dengan workspace.
- pnpm.
- PostgreSQL yang dapat diakses melalui `DATABASE_URL`.
- Environment variable yang diperlukan tersedia melalui Replit Secrets atau
  environment runtime.

Jangan menaruh nilai secret langsung di source code, dokumentasi, atau commit.

### Menjalankan API

```bash
pnpm --filter @workspace/api-server run dev
```

API berjalan pada port yang dikonfigurasi oleh workflow. Endpoint pemeriksaan
kesehatan:

```text
GET /api/healthz
```

### Menjalankan frontend

```bash
pnpm --filter @workspace/spmb-2027 run dev
```

Halaman utama formulir berada di `/`. Panel panitia berada di `/panitia`.

### Perintah validasi

```bash
# Typecheck seluruh workspace
pnpm run typecheck

# Typecheck dan build seluruh package
pnpm run build

# Regenerasi client dan schema dari OpenAPI
pnpm --filter @workspace/api-spec run codegen
```

Jalankan codegen setelah mengubah `lib/api-spec/openapi.yaml`, lalu gunakan
hasil generate yang baru. Jangan mengedit file generated secara manual.

## API ringkas

Semua path berikut menggunakan prefix `/api`.

| Method | Endpoint | Keterangan | Akses |
| --- | --- | --- | --- |
| `GET` | `/healthz` | Status server dan database | Publik |
| `POST` | `/submit` | Mengirim pendaftaran dan berkas | Publik |
| `POST` | `/payment/verify` | Penyaringan awal bukti pembayaran | Publik |
| `GET` | `/submissions/status` | Mengecek status pengajuan | Publik |
| `GET` | `/submissions/:id/receipt` | Mengunduh bukti pendaftaran bertoken | Bertoken |
| `POST` | `/auth/login` | Login panitia | Publik |
| `GET` | `/auth/me` | Membaca sesi panitia | Panitia |
| `POST` | `/auth/logout` | Keluar dari panel | Panitia |
| `GET` | `/applications` | Daftar pendaftar | Panitia |
| `GET` | `/applications/:id` | Detail pendaftar | Panitia |
| `PATCH` | `/applications/:id/status` | Mengubah status pendaftar | Panitia |
| `GET` | `/applications/:id/files/:field` | Membuka satu berkas | Panitia |
| `GET` | `/admin/notifications` | Daftar notifikasi | Panitia |
| `GET` | `/admin/observations` | Data observasi | Panitia |
| `GET` | `/admin/master-data` | Data master | Panitia |
| `GET` | `/admin/export.xlsx` | Ekspor XLSX | Panitia |
| `GET` | `/admin/applications/:id/files.zip` | ZIP satu pendaftar | Panitia |
| `POST` | `/admin/files.zip` | ZIP beberapa pendaftar | Panitia |

Detail field dan response tersedia di `lib/api-spec/openapi.yaml`.

## Penyimpanan data

- Data pendaftar disimpan di PostgreSQL pada tabel `pendaftar`.
- Setiap pengajuan dikenali dengan nomor pengajuan yang dibuat server.
- Berkas diunggah ke penyimpanan server pada `artifacts/api-server/uploads/`
  atau lokasi upload yang dikonfigurasi runtime.
- Database menyimpan path relatif berkas, bukan isi berkas.
- Path server asli tidak boleh dikirim ke browser.
- Notifikasi, riwayat perubahan status, dan audit panitia disimpan pada tabel
  terkait.

## Catatan keamanan

- Endpoint internal wajib menggunakan session panitia.
- Pembatasan `allowedJenjang` harus ditegakkan di server, bukan hanya di UI.
- Password, password hash, token, cookie, dan secret tidak boleh ditampilkan
  dalam UI atau log.
- NIK resmi anak tidak boleh dibuat otomatis.
- File yang diunduh harus melalui pemeriksaan kepemilikan akses jenjang.
- Penghapusan data produksi tidak dilakukan oleh aplikasi tanpa instruksi dan
  konfirmasi terpisah.

## Dokumen aturan

Lihat [`rules.md`](rules.md) untuk aturan bisnis dan pengembangan yang harus
dipertahankan saat aplikasi diubah.
