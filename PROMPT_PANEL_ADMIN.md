# Prompt Implementasi Panel Admin SPMB 2027/2028

## Peran

Anda adalah senior full-stack engineer yang melanjutkan aplikasi SPMB 2027/2028 TISA Islamic School. Implementasikan pembaruan panel admin secara bertahap, aman, dan tetap mengikuti struktur monorepo yang sudah ada.

## Tujuan utama

Bangun panel admin yang berfokus pada:

1. Pengelolaan pendaftar berdasarkan jenjang.
2. Notifikasi yang benar-benar berisi pekerjaan admin.
3. Data observasi untuk setiap jenjang.
4. Master data pendaftar dengan NIS yang dibuat otomatis oleh server.
5. Ekspor master data ke Excel.
6. Download berkas pendaftar secara massal dalam ZIP.

Jangan membuat modul agenda rapat atau arsip pengajuan baru. Jika modul tersebut masih tersedia di UI atau route lama, hilangkan dari navigasi dan alurnya. Jangan menghapus data pendaftar secara permanen tanpa instruksi dan konfirmasi terpisah.

---

## Konteks aplikasi yang harus dipertahankan

- Frontend pendaftar berada di `artifacts/spmb-2027`.
- Panel admin berada di `artifacts/spmb-2027/src/panitia.ts`.
- Styling panel admin berada di `artifacts/spmb-2027/src/panitia-dashboard.css`.
- API berada di `artifacts/api-server`.
- Schema database pendaftar berada di `lib/db/src/schema/pendaftar.ts`.
- Kontrak API berada di `lib/api-spec/openapi.yaml`.
- API client dan Zod types adalah hasil codegen; jangan mengedit generated file secara manual.
- Gunakan endpoint dan client yang sudah ada bila masih sesuai.
- Setelah mengubah OpenAPI, jalankan codegen sebelum menggunakan tipe baru.

## Aturan akses yang wajib

Panel admin menggunakan akun panitia dengan cakupan jenjang. Cakupan tersebut harus ditegakkan di server, bukan hanya disembunyikan di frontend.

- Admin hanya boleh melihat data dari jenjang yang diizinkan.
- Admin hanya boleh mengubah status pendaftar dari jenjang yang diizinkan.
- Admin hanya boleh mengunduh Excel dari jenjang yang diizinkan.
- Admin hanya boleh mengunduh berkas ZIP dari jenjang yang diizinkan.
- Jangan pernah mengirim raw upload path ke browser.
- Endpoint ekspor dan download harus menggunakan session panitia yang sudah ada.
- Jangan menampilkan password hash, token, atau data rahasia di UI maupun log.

---

## Struktur navigasi panel admin

Pertahankan atau susun ulang navigasi menjadi:

1. Dashboard
2. Data pendaftar
3. Observasi per jenjang
4. Master data
5. Notifikasi
6. Keluar

Hapus dari navigasi:

- Agenda rapat
- Arsip pengajuan

Penghapusan menu tidak berarti menghapus rekam data dari database. Data tetap tersedia untuk master data, observasi, audit, dan ekspor sesuai hak akses.

---

## Fitur 1 — Notifikasi admin

### Tujuan

Ganti notifikasi placeholder menjadi daftar notifikasi yang membantu panitia menemukan pekerjaan yang harus dilakukan.

### Jenis notifikasi minimal

- Pendaftar baru masuk.
- Ada berkas baru yang perlu diperiksa.
- Pengajuan perlu perbaikan.
- Pengajuan belum diverifikasi.
- Status pengajuan berubah.
- Ada pengajuan baru pada jenjang yang menjadi cakupan admin.

### Informasi tiap notifikasi

- Jenis notifikasi.
- Nomor pengajuan, contoh `SPMB-000014`.
- NIS jika sudah tersedia.
- Nama calon peserta didik.
- Jenjang.
- Waktu kejadian.
- Status sudah dibaca atau belum.
- Aksi `Lihat pendaftar`.

### Interaksi

- Ikon notifikasi menampilkan jumlah belum dibaca.
- Klik ikon membuka dropdown atau panel notifikasi.
- Sediakan `Tandai sudah dibaca`.
- Sediakan `Tandai semua sudah dibaca`.
- Klik notifikasi membuka detail pendaftar.
- Jika belum ada notifikasi, tampilkan empty state yang jelas.
- Tampilkan loading dan error state.

### Arsitektur yang disarankan

- Simpan notifikasi atau event perubahan secara persisten agar tidak hilang setelah refresh.
- Simpan waktu dibaca dan akun yang membaca.
- Gunakan polling sederhana setiap 30–60 detik sebelum mempertimbangkan WebSocket.
- Filter notifikasi berdasarkan `allowedJenjang` di server.
- Jangan membuat notifikasi untuk agenda rapat.

Jika histori status belum tersedia, tambahkan pencatatan perubahan status yang menyimpan:

- ID pendaftar.
- Status lama.
- Status baru.
- Waktu perubahan.
- Akun panitia yang mengubah.

---

## Fitur 2 — Observasi per jenjang

Buat halaman dengan filter jenjang:

- Semua jenjang
- Playgroup
- Daycare
- TK-A
- TK-B
- SD
- SMP

### Kartu ringkasan

Untuk jenjang yang dipilih tampilkan:

- Total pendaftar.
- Baru.
- Diverifikasi.
- Perlu Perbaikan.
- Diterima.
- Ditolak.
- Berkas belum lengkap.

### Data observasi

Sediakan tabel atau visualisasi sederhana untuk:

- Jumlah pendaftar per tanggal atau periode.
- Distribusi jenis kelamin.
- Kelompok usia berdasarkan tanggal 1 Juli 2027.
- Asal sekolah.
- Wilayah domisili jika datanya tersedia.
- Kelengkapan dokumen.
- Perbandingan status pengajuan.

### Filter observasi

- Jenjang.
- Status.
- Rentang tanggal pengajuan.
- Asal sekolah.
- Kelengkapan berkas.
- Pencarian nama atau nomor pengajuan.

Data NIK, nomor KK, dan dokumen keluarga jangan ditampilkan pada grafik ringkasan. Data tersebut hanya muncul pada detail atau master data dengan akses yang sesuai.

---

## Fitur 3 — NIS otomatis

### Klarifikasi istilah yang wajib diikuti

Yang dimaksud dengan “NIK otomatis” pada konsep awal adalah **NIS**, bukan NIK.

- **NIS (Nomor Induk Siswa)** adalah nomor internal yang dibuat oleh sistem/sekolah untuk kebutuhan administrasi SPMB.
- **NIK anak** adalah NIK resmi dari dokumen kependudukan dan harus diisi berdasarkan dokumen resmi. Sistem tidak boleh membuat atau mengubah NIK anak secara otomatis.
- **NISN** adalah Nomor Induk Siswa Nasional dan tetap menjadi field yang terpisah dari NIS.

Pada seluruh UI, API, database, notifikasi, Excel, ZIP, manifest, dan dokumentasi gunakan istilah **NIS** untuk nomor otomatis. Jangan memberi label “NIK otomatis”, “NIK internal”, atau istilah lain yang dapat membingungkan operator.

### Aturan penting

Jangan membuat NIK resmi Dukcapil secara otomatis. Field `nik_anak` yang sudah ada tetap berarti NIK resmi dari dokumen kependudukan.

Field identitas internal yang dibuat otomatis harus menggunakan nama yang jelas:

- `nis`, atau
- `nomor_induk_siswa`.

Label UI yang disarankan:

> NIS

### Format yang disarankan

Contoh format yang mudah dibaca:

```text
TISA-2027-SD-000014
```

Jika sekolah menghendaki format numerik, gunakan:

```text
2027000014
```

Pilih satu format dan gunakan secara konsisten pada UI, Excel, ZIP, manifest, dan notifikasi. Format boleh disesuaikan dengan kebijakan sekolah, tetapi harus terdokumentasi dan tidak boleh menyerupai atau menggantikan NIK/NISN.

### Aturan pembuatan

- Dibuat oleh server saat pengajuan berhasil disimpan, bukan oleh browser.
- Unik.
- Tidak berubah ketika status berubah.
- Tidak dipakai sebagai pengganti NIK anak atau NISN.
- Tidak dibuat ulang ketika halaman dimuat.
- Tidak boleh bergantung pada input dari browser.
- Jika ada pengajuan ganda dengan NIK anak yang sama, tandai sebagai duplikat untuk diperiksa; jangan otomatis menggabungkan data.
- Pengajuan yang ditolak tetap memiliki NIS dan tetap tersimpan di master data.
- Jika data lama belum memiliki NIS, lakukan pengisian secara aman dan idempotent tanpa mengubah NIK anak atau NISN.

---

## Fitur 4 — Master data pendaftar

Buat halaman master data dengan kolom:

- NIS.
- Nomor pengajuan.
- Nama calon peserta didik.
- Jenjang.
- NIK anak.
- NISN.
- Jenis kelamin.
- Tempat dan tanggal lahir.
- Alamat domisili.
- Nama orang tua atau wali.
- Nomor WhatsApp orang tua.
- Email.
- Asal sekolah.
- Status pengajuan.
- Kelengkapan berkas.
- Tanggal pengajuan.

### Fungsi master data

- Pencarian.
- Filter jenjang.
- Filter status.
- Filter tanggal.
- Sortir berdasarkan nama, nomor, jenjang, status, dan tanggal.
- Buka detail pendaftar.
- Ekspor data sesuai filter.
- Pilih beberapa pendaftar untuk download ZIP.

Master data tidak boleh menghapus data hanya karena status berubah menjadi Ditolak.

---

## Fitur 5 — Ekspor Excel

Sediakan tombol `Download Excel` dari master data dan halaman observasi.

### Pilihan ekspor

- Semua data yang boleh diakses akun.
- Jenjang tertentu.
- Status tertentu.
- Rentang tanggal.
- Hasil filter aktif.

### Format file

Gunakan `.xlsx`, bukan CSV saja.

Contoh nama file:

```text
master-data-spmb-2027-sd.xlsx
```

Workbook dapat berisi:

1. `Master Pendaftar`
2. `Ringkasan Jenjang`
3. `Ringkasan Status`
4. `Kelengkapan Berkas`

Pastikan kolom NIK, KK, nomor WhatsApp, dan email tidak berubah menjadi format angka yang kehilangan angka nol di depan. Formatkan sebagai teks.

### Keamanan ekspor

- Query ekspor harus memeriksa session dan allowed jenjang di server.
- Jangan hanya mengandalkan filter frontend.
- Catat siapa yang melakukan ekspor, waktu, jenjang, dan jumlah baris.
- Jangan menaruh data pendaftar lain di luar scope akun.

---

## Fitur 6 — Download berkas ZIP

### ZIP satu pendaftar

Dari detail pendaftar, sediakan tombol `Download semua berkas`.

Contoh nama:

```text
SPMB-000014_Nama-Pendaftar.zip
```

Struktur:

```text
SPMB-000014_Nama-Pendaftar/
├── pas-foto-3x4.jpg
├── akta-kelahiran.pdf
├── kartu-keluarga.pdf
├── ktp-orang-tua.pdf
├── bukti-pembayaran.pdf
└── manifest.txt
```

### ZIP massal

Dari master data, admin dapat memilih:

- Pendaftar tertentu.
- Semua hasil filter.
- Satu jenjang.
- Satu status.

Contoh struktur:

```text
spmb-2027-sd-berkas.zip
├── SPMB-000014_Nama-Pendaftar/
│   ├── pas-foto-3x4.jpg
│   └── ...
├── SPMB-000015_Nama-Pendaftar/
│   ├── pas-foto-3x4.jpg
│   └── ...
└── manifest.csv
```

`manifest.csv` minimal berisi:

- Nomor pengajuan.
- NIS.
- Nama.
- Jenjang.
- Status.
- Berkas yang tersedia.
- Berkas yang belum tersedia.

### Aturan ZIP

- Berkas yang hilang tidak boleh membuat seluruh ZIP gagal.
- Nama file dan folder harus disanitasi.
- Jangan memasukkan path server asli.
- Endpoint harus memeriksa hak akses setiap pendaftar.
- Untuk ZIP besar, gunakan proses server yang aman dari timeout.
- Beri feedback loading, progress, sukses, dan gagal.
- Catat aktivitas download massal.

---

## API dan database

Tambahkan endpoint baru hanya jika diperlukan, dengan pola:

- Endpoint ringkasan observasi berdasarkan jenjang.
- Endpoint notifikasi dan status dibaca.
- Endpoint master data dengan filter.
- Endpoint ekspor Excel.
- Endpoint ZIP satu pendaftar.
- Endpoint ZIP massal.

Semua endpoint internal wajib melewati middleware autentikasi panitia dan pemeriksaan `allowedJenjang`.

Sebelum membuat schema baru:

1. Periksa schema pendaftar yang sudah ada.
2. Periksa database runtime karena schema database eksternal dapat tertinggal dari source.
3. Buat migrasi yang aman dan tidak menghapus data.
4. Pastikan kolom baru nullable atau memiliki default yang aman untuk data lama.
5. Uji dengan data pendaftar yang sudah ada.

---

## Tahapan pengerjaan

Implementasikan dalam urutan berikut:

### Tahap 1 — Penyederhanaan panel

- Hapus agenda rapat dan arsip dari navigasi/alur.
- Pastikan data pendaftar lama tetap aman.
- Siapkan struktur menu baru.

### Tahap 2 — Notifikasi

- Model event/notifikasi.
- Endpoint notifikasi.
- Unread count.
- Dropdown/panel notifikasi.
- Mark read.
- Link ke detail pendaftar.

### Tahap 3 — Observasi per jenjang

- Endpoint agregasi.
- Kartu ringkasan.
- Filter.
- Tabel/grafik observasi.

### Tahap 4 — Master data dan NIS otomatis

- Tambah NIS server-side.
- Tampilkan NIS di detail dan daftar.
- Tambahkan deteksi duplikasi yang aman.

### Tahap 5 — Ekspor

- Ekspor `.xlsx`.
- ZIP satu pendaftar.
- ZIP massal.
- Manifest.
- Audit log.

---

## Kriteria selesai

Fitur dianggap selesai jika:

- Admin hanya melihat data sesuai jenjangnya.
- Notifikasi menampilkan kejadian nyata dan dapat ditandai sudah dibaca.
- Agenda rapat dan arsip tidak lagi muncul di panel.
- Observasi dapat difilter per jenjang.
- Setiap pengajuan baru memiliki NIS yang stabil.
- NIK resmi anak tidak digantikan oleh nomor otomatis.
- NISN tetap menjadi field terpisah dan tidak ditimpa oleh NIS.
- Master data dapat diekspor ke `.xlsx`.
- Berkas satu atau banyak pendaftar dapat diunduh sebagai ZIP.
- Berkas yang tidak tersedia dicatat di manifest tanpa menggagalkan seluruh ZIP.
- Tidak ada raw file path yang bocor.
- Typecheck, build, dan pengujian hak akses berhasil.
- Endpoint ekspor dan ZIP menolak akses lintas jenjang.
- Data lama tetap dapat dibuka dan tidak hilang.

## Batasan implementasi

- Jangan menghapus data produksi.
- Jangan mengganti database yang sedang digunakan.
- Jangan membuat NIK resmi palsu.
- Jangan melewati middleware auth untuk mempermudah frontend.
- Jangan mengedit generated API client secara manual.
- Jangan mengimplementasikan agenda rapat atau arsip baru.