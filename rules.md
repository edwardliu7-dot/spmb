# Aturan Aplikasi SPMB TISA 2027/2028

Dokumen ini adalah aturan sumber kebenaran untuk perubahan fitur, validasi
data, keamanan, dan pengelolaan aplikasi SPMB. Jika kebutuhan baru bertentangan
dengan aturan ini, klarifikasi harus dilakukan sebelum kode diubah.

## 1. Ruang lingkup produk

1. Aplikasi digunakan untuk penerimaan murid baru TISA Islamic School tahun
   ajaran 2027/2028.
2. Alur publik digunakan oleh calon peserta didik melalui orang tua atau wali.
3. Alur internal digunakan panitia dan administrator sekolah.
4. Bahasa antarmuka dan pesan pengguna harus menggunakan Bahasa Indonesia.
5. Jangan menambahkan modul agenda rapat atau arsip pengajuan ke navigasi baru.
   Tidak tampilnya menu bukan berarti data lama boleh dihapus.

## 2. Jenjang yang sah

Nilai `jenjang` hanya boleh salah satu dari:

- `Playgroup`
- `Daycare`
- `TK-A`
- `TK-B`
- `SD`
- `SMP`

Jangan membuat variasi ejaan atau label baru di API, database, filter, ekspor,
notifikasi, dan UI tanpa memperbarui kontrak serta seluruh pemakainya.

## 3. Aturan usia

Usia dihitung pada **1 Juli 2027**, bukan pada tanggal pengisian formulir.

| Jenjang | Usia minimum |
| --- | ---: |
| Playgroup | 3 tahun |
| TK-A | 4 tahun |
| TK-B | 5 tahun |
| SD | 6 tahun |
| Daycare | Tidak ada batas minimum aplikasi |
| SMP | Tidak ada batas minimum aplikasi |

Validasi usia harus dilakukan di frontend untuk membantu pengguna dan di server
untuk mencegah data tidak sah melewati API.

## 4. Aturan formulir

1. Field wajib pada kontrak API tetap harus divalidasi di server.
2. Data sekolah asal:
   - Wajib untuk `SD` dan `SMP`.
   - Opsional untuk `Playgroup`, `Daycare`, `TK-A`, dan `TK-B`.
3. `NIK anak` adalah NIK resmi dari dokumen kependudukan dan harus diisi dari
   dokumen resmi.
4. `NISN` adalah nomor nasional dan tetap menjadi field terpisah.
5. Nomor pengajuan dibuat server setelah pengajuan berhasil disimpan dan menjadi
   identitas utama pengajuan.
7. Pengajuan ganda dengan NIK anak yang sama ditandai untuk diperiksa; data
   tidak boleh otomatis digabung.
8. Pendaftar yang ditolak tetap tersimpan dengan riwayat statusnya.
9. Draft browser boleh membantu kenyamanan pengguna, tetapi bukan sumber
   kebenaran dan tidak menggantikan validasi server.

## 5. Berkas persyaratan

Lima berkas berikut wajib ada pada pengajuan:

1. `foto_3x4` — JPG atau PNG.
2. `akte_lahir` — PDF, JPG, atau PNG.
3. `kartu_keluarga` — PDF, JPG, atau PNG.
4. `ktp_orangtua` — PDF, JPG, atau PNG.
5. `bukti_bayar` — PDF, JPG, atau PNG.

Aturan upload:

- Ukuran setiap file maksimal 5 MB.
- Server harus memeriksa nama field, ukuran, MIME/format, dan signature file
  bila tersedia.
- Jika validasi pengajuan gagal, file sementara yang sudah diunggah harus
  dibersihkan.
- File yang hilang saat membuat ZIP dicatat di manifest dan tidak boleh
  menggagalkan seluruh ZIP.
- Nama file dan folder dalam ZIP harus disanitasi.
- Path absolut atau path asli server tidak boleh bocor ke browser, manifest,
  log, atau unduhan.

## 6. Status pengajuan

Status yang sah:

- `Baru`
- `Diverifikasi`
- `Perlu Perbaikan`
- `Diterima`
- `Ditolak`

Perubahan status:

1. Harus melalui endpoint yang memeriksa session panitia.
2. Harus memeriksa cakupan jenjang akun.
3. Tidak boleh menghapus data pendaftar.
4. Perubahan penting dicatat pada riwayat status dan audit log.
5. Nomor pengajuan tidak boleh berubah karena perubahan status.

## 7. Hak akses panitia

| Username | Label | Jenjang yang boleh diakses | Tema panel |
| --- | --- | --- | --- |
| `admin` | Administrator | Semua jenjang | Oranye |
| `datapgtk` | Data PGTK | Playgroup, Daycare, TK-A, TK-B | Hijau |
| `datasd` | Data SD | SD | Merah |
| `datasmp` | Data SMP | SMP | Biru |

Aturan akses wajib:

- Pembatasan jenjang harus ditegakkan di server.
- Akun hanya boleh melihat detail pendaftar dalam cakupannya.
- Akun hanya boleh mengubah status dalam cakupannya.
- Akun hanya boleh membuka berkas, mengunduh ZIP, dan mengekspor data dalam
  cakupannya.
- Filter frontend tidak dianggap sebagai mekanisme keamanan.
- Session memakai cookie `spmb_committee_session` yang bertanda tangan,
  HTTP-only, SameSite `lax`, dan masa berlaku terbatas.
- Password hash, salt, token, dan secret tidak boleh dikirim ke frontend,
  ditulis ke log, atau dimasukkan ke dokumentasi.

## 8. Aturan tampilan dan pengalaman pengguna

1. Frontend formulir publik tetap menggunakan HTML, CSS, dan
   JavaScript/TypeScript vanilla. Jangan memindahkan alur utama ke React tanpa
   keputusan terpisah.
2. Tema formulir:
   - Default: putih dan biru laut.
   - SMP: biru.
   - SD: merah.
   - Playgroup: oranye.
   - TK-A/TK-B: hijau.
   - Daycare: kuning.
3. Tema berubah segera setelah jenjang berubah dan kembali ke default saat
   pengajuan baru dimulai.
4. Tema panel mengikuti akun setelah login:
   - Administrator oranye.
   - Data SMP biru.
   - Data SD merah.
   - Data PGTK hijau.
5. Pesan error harus membantu pengguna memperbaiki data, tanpa membocorkan
   detail internal server.
6. State loading, error, kosong, berhasil, dan gagal harus terlihat jelas pada
   aksi yang membutuhkan waktu.
7. Jangan menampilkan NIK, nomor KK, atau dokumen keluarga pada grafik
   ringkasan observasi.

## 9. Aturan API dan database

1. `lib/api-spec/openapi.yaml` adalah sumber kebenaran kontrak API.
2. Setelah mengubah OpenAPI, jalankan codegen sebelum memakai tipe baru.
3. Jangan mengedit API client atau schema generated secara manual.
4. Semua endpoint internal harus melewati middleware autentikasi dan
   pemeriksaan `allowedJenjang`.
5. Jangan mengganti database yang sedang digunakan tanpa persetujuan eksplisit.
6. Sebelum menambah atau mengubah schema:
   - Periksa schema sumber.
   - Periksa schema database runtime.
   - Pertimbangkan database eksternal yang mungkin tertinggal dari source.
   - Gunakan perubahan nullable atau default aman untuk data lama.
   - Hindari migrasi destruktif.
7. Gunakan `DATABASE_URL` dari environment runtime. Jangan hardcode credential.
8. Simpan tanggal dan waktu secara konsisten dengan timezone database.
9. Error internal dicatat untuk operator secara aman, sedangkan response ke
   pengguna harus memakai pesan yang tidak membocorkan detail sensitif.

## 10. Aturan keamanan dan privasi

- Jangan membuat NIK resmi palsu atau memakai nomor pengajuan sebagai pengganti
  NIK/NISN.
- Jangan mengirim raw upload path ke browser.
- Jangan mengandalkan hidden field, query parameter, atau filter UI untuk
  membatasi akses.
- Jangan menampilkan secret, credential, password, hash, cookie, atau token.
- Jangan menghapus data produksi, data ditolak, atau data historis tanpa
  instruksi dan konfirmasi terpisah.
- Jangan mematikan rate limit atau validasi upload untuk mempermudah pengujian.
- Jangan memproses bukti pembayaran AI sebagai bukti bahwa dana benar-benar
  diterima.
- Gunakan secret manager/environment runtime untuk secret seperti database,
  session, dan layanan AI.

## 11. Aturan pengembangan dan rilis

Sebelum menyatakan perubahan selesai:

1. Jalankan:

   ```bash
   pnpm run typecheck
   pnpm run build
   ```

2. Periksa workflow frontend dan API dapat berjalan.
3. Periksa browser console dan log server untuk error baru.
4. Uji alur yang terkena perubahan, termasuk akses lintas jenjang jika
   menyentuh panel admin.
5. Jangan menghapus atau mengganti workflow yang sudah ada tanpa alasan.
6. Pertahankan struktur monorepo dan gunakan package workspace yang sudah ada.
7. Jangan menambahkan dependency baru jika fitur dapat dibuat dengan
   dependency yang tersedia.
8. Pertahankan pengaturan keamanan supply-chain pada `pnpm-workspace.yaml`;
   jangan menonaktifkan minimum release age tanpa alasan keamanan yang jelas.

## 12. Batasan yang tidak boleh dilanggar

- Jangan menghapus data produksi.
- Jangan mengganti database aktif.
- Jangan membuat NIK resmi secara otomatis.
- Jangan melewati middleware autentikasi.
- Jangan mengedit file generated API client secara manual.
- Jangan membocorkan path upload.
- Jangan menambahkan kembali agenda rapat atau arsip pengajuan ke alur baru.
- Jangan mengubah arti nomor pengajuan, NIK, atau NISN.
