import { getSubmissionStatus, healthCheck, submitApplication } from '@workspace/api-client-react';
import schoolLogoUrl from '../../../lib/logo tisa.png';
import './index.css';
import './form-board.css';

type FieldKind = 'text' | 'email' | 'date' | 'number' | 'textarea' | 'select';

type IconName = 'bell' | 'calendar' | 'check' | 'chevron' | 'clipboard' | 'file' | 'file-check' | 'folder' | 'info' | 'instagram' | 'lock' | 'menu' | 'shield' | 'tiktok' | 'upload' | 'youtube';

const icons: Record<IconName, string> = {
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 12h6M9 16h4"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  'file-check': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 15l2 2 4-4"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M3 9h18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z"/><path d="m8 12 2.5 2.5L16 9"/>',
  tiktok: '<path d="M15 3v10.4a4.6 4.6 0 1 1-3.2-4.4"/><path d="M15 3c.5 2.7 2.1 4.5 5 4.9"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  youtube: '<path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.6 2.6 0 0 0-1.8 1.8A27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8Z"/><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none"/>',
};

function icon(name: IconName): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const requiredMark = '<span class="form-board-required" aria-hidden="true">*</span>';

function inputField(
  name: string,
  label: string,
  kind: FieldKind = 'text',
  options: string[] = [],
  hint = '',
  span = false,
  required = true,
): string {
  const requiredAttribute = required ? 'required aria-required="true"' : '';
  const requirementLabel = `<span class="form-board-field-requirement">${
    required ? requiredMark : '<span class="form-board-optional">opsional</span>'
  }</span>`;
  const hintMarkup = hint ? `<span class="hint">${hint}</span>` : '';
  let control = '';
  if (kind === 'textarea') {
    control = `<textarea id="${name}" name="${name}" ${requiredAttribute} placeholder="Tulis ${label.toLowerCase()}"></textarea>`;
  } else if (kind === 'select') {
    control = `<span class="form-board-select-wrap"><select id="${name}" name="${name}" ${requiredAttribute} data-testid="select-${name}">
      <option value="">Pilih ${label.toLowerCase()}</option>
      ${options.map((option) => `<option value="${option}">${option}</option>`).join('')}
    </select>${icon('chevron')}</span>`;
  } else {
    const inputMode = ['number'].includes(kind) ? ' inputmode="numeric"' : '';
    const placeholder =
      kind === 'date' ? '' : ` placeholder="Tulis ${label.toLowerCase()}"`;
    control = `<input id="${name}" name="${name}" type="${kind}" ${requiredAttribute}${inputMode}${placeholder} data-testid="input-${name}" />`;
  }
  return `<div class="form-board-field${span ? ' form-board-field-span' : ''}" data-field="${name}">
    <label for="${name}">${label} ${requirementLabel} ${hintMarkup}</label>
    ${control}
    <span class="error-message" aria-live="polite"></span>
  </div>`;
}

function section(index: string, title: string, description: string, content: string, id: string): string {
  return `<fieldset class="form-board-section" id="${id}" data-section="${index}">
    <div class="form-board-section-heading">
      <span class="form-board-section-index">${index}</span>
      <div class="form-board-section-copy">
        <div class="form-board-section-kicker"><span>Bagian ${index}</span><span class="form-board-section-rule"></span></div>
        <h3>${title}</h3>${description ? `<p>${description}</p>` : ''}
      </div>
      <span class="form-board-section-check"><span></span></span>
    </div>
    <div class="form-board-field-grid">${content}</div>
  </fieldset>`;
}

function fileField(name: string, label: string, detail: string): string {
  return `<div class="form-board-upload" data-upload="${name}">
     <div class="form-board-upload-icon">${icon('upload')}</div>
     <div class="form-board-upload-copy">
       <strong>${label} ${requiredMark}</strong>
       <small data-file-name="${name}">${detail}</small>
    </div>
     <label class="form-board-upload-button" for="${name}">Pilih berkas
       <input id="${name}" name="${name}" type="file" accept=".pdf,.jpg,.jpeg,.png" required aria-required="true" data-testid="input-file-${name}" />
     </label>
     <span class="form-board-upload-error" data-file-error="${name}" role="alert"></span>
  </div>`;
}

const studentFields = [
  inputField(
    'jenjang',
    'Jenjang yang dituju',
    'select',
    ['Playgroup', 'Daycare', 'TK-A', 'TK-B', 'SD', 'SMP'],
    'Usia minimum pada 1 Juli 2027: PG 3 tahun, TK-A 4 tahun, TK-B 5 tahun, SD 6 tahun; Daycare dan SMP tanpa batas minimum',
  ),
  inputField('nama_calon', 'Nama lengkap calon peserta didik'),
  inputField('nama_panggilan', 'Nama panggilan'),
  inputField('jenis_kelamin', 'Jenis kelamin', 'select', ['Laki-laki', 'Perempuan']),
  inputField('tempat_lahir', 'Tempat lahir'),
  inputField('tanggal_lahir', 'Tanggal lahir', 'date', [], 'Usia dihitung pada 1 Juli 2027'),
  inputField('nisn', 'NISN', 'text', [], '10 digit bila sudah memiliki', false, false),
  inputField('nik_anak', 'NIK anak'),
  inputField('alamat_domisili', 'Alamat domisili saat ini', 'textarea', [], '', true),
  inputField('anak_ke', 'Anak ke-', 'number'),
  inputField('jumlah_saudara', 'Jumlah saudara kandung', 'number'),
  inputField('status_anak', 'Status anak', 'select', ['Anak kandung', 'Anak tiri', 'Anak angkat']),
  inputField('agama', 'Agama', 'select', ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']),
  inputField('warga_negara', 'Kewarganegaraan'),
  inputField('tinggi_badan', 'Tinggi badan', 'number', [], 'dalam cm'),
  inputField('berat_badan', 'Berat badan', 'number', [], 'dalam kg'),
  inputField('riwayat_penyakit', 'Riwayat penyakit yang perlu diketahui', 'textarea', [], 'Tulis “Tidak ada” bila tidak memiliki riwayat', true, false),
  inputField('transportasi', 'Transportasi ke sekolah', 'select', ['Jalan kaki', 'Kendaraan pribadi', 'Kendaraan umum', 'Antar-jemput']),
  inputField('jarak_sekolah', 'Perkiraan jarak ke sekolah', 'text', [], 'Contoh: 2 km'),
].join('');

const schoolFields = [
  inputField('nama_sekolah_asal', 'Nama sekolah asal', 'text', [], '', false, false),
  inputField('tahun_lulus', 'Tahun lulus', 'number', [], '', false, false),
  inputField('alamat_sekolah_asal', 'Alamat sekolah asal', 'textarea', [], '', true, false),
].join('');

const parentFields = [
  inputField('nomor_kk', 'Nomor Kartu Keluarga'),
  inputField('nik_ayah', 'NIK ayah'),
  inputField('nomor_hp_orangtua', 'Nomor WhatsApp orang tua', 'text', [], 'Nomor WhatsApp yang aktif menerima informasi'),
  inputField('email', 'Email orang tua', 'email'),
  inputField('nama_ayah', 'Nama lengkap ayah'),
  inputField('ttl_ayah', 'Tempat, tanggal lahir ayah'),
  inputField('pendidikan_ayah', 'Pendidikan terakhir ayah'),
  inputField('pekerjaan_ayah', 'Pekerjaan ayah'),
  inputField('penghasilan_ayah', 'Penghasilan per bulan ayah'),
  inputField('instansi_jabatan_ayah', 'Instansi atau jabatan ayah'),
  inputField('nik_ibu', 'NIK ibu'),
  inputField('nama_ibu', 'Nama lengkap ibu'),
  inputField('ttl_ibu', 'Tempat, tanggal lahir ibu'),
  inputField('pendidikan_ibu', 'Pendidikan terakhir ibu'),
  inputField('pekerjaan_ibu', 'Pekerjaan ibu'),
  inputField('penghasilan_ibu', 'Penghasilan per bulan ibu'),
  inputField('instansi_jabatan_ibu', 'Instansi atau jabatan ibu'),
  inputField('nama_wali', 'Nama lengkap wali', 'text', [], '', false, false),
  inputField('hubungan_wali', 'Hubungan dengan calon peserta didik', 'text', [], '', false, false),
].join('');

const uploadFields = [
  fileField('foto_3x4', 'Pas foto 3×4', 'Belum ada berkas dipilih'),
  fileField('akte_lahir', 'Akta kelahiran', 'Belum ada berkas dipilih'),
  fileField('kartu_keluarga', 'Kartu Keluarga', 'Belum ada berkas dipilih'),
  fileField('ktp_orangtua', 'KTP orang tua', 'Belum ada berkas dipilih'),
  fileField('bukti_bayar', 'Bukti pembayaran', 'Belum ada berkas dipilih'),
].join('');

const sectionIds = ['section-student', 'section-school', 'section-parent', 'section-upload'];
const uploadFieldNames = ['foto_3x4', 'akte_lahir', 'kartu_keluarga', 'ktp_orangtua', 'bukti_bayar'];
const draftStorageKey = 'spmb-2027-form-draft';
const draftFilesDatabase = 'spmb-2027-draft-files';
const draftFilesStore = 'files';

if (window.location.pathname.replace(/\/+$/, '') === '/panitia') {
  void import('./panitia');
} else {
  const root = document.getElementById('root');
  if (!root) throw new Error('Elemen root tidak ditemukan.');

root.innerHTML = `
  <div class="form-board-shell">
    <header class="form-board-topbar">
      <div class="form-board-topbar-inner">
        <div class="form-board-brand-group">
          <button type="button" class="form-board-menu-button" aria-label="Buka navigasi" aria-expanded="false">${icon('menu')}</button>
          <a class="form-board-brand" href="#form-board-content" data-testid="link-home" aria-label="SPMB TISA Islamic School">
            <span class="form-board-brand-mark"><img src="${schoolLogoUrl}" alt="TISA Islamic School" /></span>
            <span><strong>SPMB TISA</strong><small>TISA Islamic School</small></span>
          </a>
        </div>
        <nav class="form-board-nav" aria-label="Navigasi pendaftaran">
           <button type="button" class="form-board-nav-active" data-page-view="registration">Pendaftaran</button>
           <button type="button" data-page-view="status">Status pengajuan</button>
          <button type="button" data-page-view="guide">Panduan</button>
        </nav>
        <div class="form-board-topbar-actions">
          <span class="form-board-service-status"><i id="health-dot"></i><span id="health-status" data-testid="status-health">Memeriksa layanan</span></span>
        </div>
      </div>
    </header>

    <main id="form-board-content" class="form-board-main">
      <div class="form-board-intro">
        <div class="form-board-intro-copy">
          <div class="form-board-eyebrow"><span></span>Ruang pendaftaran · tahun ajaran 2027 / 2028</div>
          <h1 id="page-title">Formulir pendaftaran <em>SPMB.</em></h1>
          <div class="form-board-header-notice" aria-label="Informasi pendaftaran dan kontak">
            <div class="form-board-header-notice-lead">
              <strong>Pendaftaran dibuka 5 September 2026</strong>
              <span>Hubungi admin → lakukan pembayaran dan konfirmasi → terima link pendaftaran → isi formulir → unduh bukti pendaftaran → gabung grup WhatsApp → tunggu info selanjutnya.</span>
            </div>
            <div class="form-board-contact-details">
              <span class="form-board-contact-item"><span class="form-board-contact-label">Kantor</span><span>Kp. Cimahi RT.07/04, Sukamahi, Kec. Cikarang Pusat, Kab. Bekasi, Jawa Barat</span></span>
              <a class="form-board-contact-item" href="tel:+6288807842958"><span class="form-board-contact-label">Telepon</span><span>+62 888 0784 2958</span></a>
              <a class="form-board-contact-item" href="mailto:tsislamics@gmail.com"><span class="form-board-contact-label">Email</span><span>tsislamics@gmail.com</span></a>
              <span class="form-board-contact-item"><span class="form-board-contact-label">Jam layanan</span><span>08:00–14:00 WIB</span></span>
              <span class="form-board-contact-socials"><span class="form-board-contact-label">Bantuan di</span><a href="https://www.instagram.com/tisa.islamicschool/" target="_blank" rel="noreferrer" aria-label="Instagram @tisa.islamicschool" title="Instagram @tisa.islamicschool">${icon('instagram')}</a><a href="https://www.youtube.com/@TisaIslamicSchool" target="_blank" rel="noreferrer" aria-label="YouTube @TisaIslamicSchool" title="YouTube @TisaIslamicSchool">${icon('youtube')}</a><a href="https://www.tiktok.com/@tisaislamic" target="_blank" rel="noreferrer" aria-label="TikTok @tisaislamic" title="TikTok @tisaislamic">${icon('tiktok')}</a></span>
            </div>
          </div>
        </div>
        <div class="form-board-date">
          <div class="form-board-date-mark">${icon('calendar')}<span>BARU</span></div>
          <div><strong>Pengajuan baru</strong></div>
        </div>
      </div>

      <section class="form-board-stats" aria-label="Ringkasan formulir">
        <div class="form-board-stat"><div><span>TAHAP PENGISIAN</span>${icon('clipboard')}</div><strong>04</strong><small>identitas, sekolah, keluarga, berkas</small></div>
        <div class="form-board-stat"><div><span>WAKTU PENGISIAN</span>${icon('file-check')}</div><strong>10<span class="form-board-stat-unit">mnt</span></strong><small>siapkan dokumen resmi di dekat Anda</small></div>
        <div class="form-board-stat"><div><span>DOKUMEN PENDUKUNG</span>${icon('folder')}</div><strong>05</strong><small>PDF, JPG, atau PNG · maksimal 5 MB</small></div>
      </section>

       <section class="form-board-status-view" id="status-view" hidden aria-labelledby="status-view-title">
         <div class="form-board-status-intro">
           <div>
             <div class="form-board-panel-kicker">${icon('clipboard')}Lacak pengajuan</div>
             <h2 id="status-view-title">Cek status <em>pendaftaran.</em></h2>
             <p>Masukkan nomor yang tercetak pada bukti pendaftaran untuk melihat perkembangan pengajuan Anda.</p>
           </div>
           <span class="form-board-status-badge">${icon('shield')}Akses publik</span>
         </div>
         <form class="form-board-status-search" id="status-form">
           <label for="status-number">Nomor pengajuan</label>
           <div class="form-board-status-search-row">
             <input id="status-number" name="number" type="text" inputmode="text" autocomplete="off" placeholder="Contoh: SPMB-000001" aria-describedby="status-number-hint" required />
             <button type="submit" id="status-submit-button"><span>Cek status</span>${icon('chevron')}</button>
           </div>
           <small id="status-number-hint">Nomor pendaftaran menggunakan format SPMB-000001.</small>
         </form>
         <div class="form-board-status-alert" id="status-alert" role="alert" hidden></div>
         <article class="form-board-status-result" id="status-result" hidden aria-live="polite">
           <div class="form-board-status-result-head">
             <div>
               <span class="form-board-status-kicker">PENGAJUAN DITEMUKAN</span>
               <h3 id="status-result-number"></h3>
             </div>
             <span class="form-board-status-current" id="status-result-current"></span>
           </div>
           <div class="form-board-status-facts">
             <div><span>Nama calon peserta didik</span><strong id="status-result-name"></strong></div>
             <div><span>Jenjang</span><strong id="status-result-level"></strong></div>
             <div><span>Dikirim pada</span><strong id="status-result-date"></strong></div>
           </div>
           <div class="form-board-status-timeline" id="status-result-timeline"></div>
           <div class="form-board-status-note" id="status-result-note"></div>
         </article>
       </section>

       <section class="form-board-guide-view" id="guide-view" hidden aria-labelledby="guide-view-title">
         <div class="form-board-guide-hero">
           <div>
             <div class="form-board-panel-kicker">${icon('file')}Panduan pendaftaran</div>
             <h2 id="guide-view-title">Daftar dengan <em>tenang.</em></h2>
             <p>Ikuti alur berikut agar data lengkap, berkas mudah diverifikasi, dan Anda tidak melewatkan informasi penting.</p>
           </div>
           <div class="form-board-guide-year"><strong>SPMB</strong><span>2027 / 2028</span></div>
         </div>
         <div class="form-board-guide-grid">
           <article class="form-board-guide-card form-board-guide-card-primary">
             <div class="form-board-guide-card-top"><span>01 — ALUR UTAMA</span>${icon('clipboard')}</div>
             <h3>Empat langkah sampai selesai</h3>
             <ol class="form-board-guide-steps">
               <li><span>01</span><div><strong>Siapkan data dan berkas</strong><small>Gunakan dokumen resmi dan pastikan foto/scan dapat dibaca.</small></div></li>
               <li><span>02</span><div><strong>Isi formulir pendaftaran</strong><small>Lengkapi identitas calon peserta didik, sekolah, serta orang tua atau wali.</small></div></li>
               <li><span>03</span><div><strong>Periksa lalu kirim</strong><small>Centang pernyataan kebenaran data sebelum menekan tombol kirim.</small></div></li>
               <li><span>04</span><div><strong>Simpan bukti dan pantau</strong><small>Unduh bukti PDF, simpan nomor SPMB, lalu cek status secara berkala.</small></div></li>
             </ol>
           </article>
           <article class="form-board-guide-card">
             <div class="form-board-guide-card-top"><span>02 — YANG DISIAPKAN</span>${icon('folder')}</div>
             <h3>Dokumen pendukung</h3>
             <ul class="form-board-guide-checklist">
               <li>${icon('check')}Pas foto 3×4</li>
               <li>${icon('check')}Akta kelahiran</li>
               <li>${icon('check')}Kartu Keluarga</li>
               <li>${icon('check')}KTP orang tua</li>
               <li>${icon('check')}Bukti pembayaran</li>
             </ul>
             <div class="form-board-guide-tip">${icon('info')}Format PDF, JPG, atau PNG · maksimal 5 MB per berkas.</div>
           </article>
         </div>
         <div class="form-board-guide-bottom">
           <div class="form-board-guide-contact">
             <span class="form-board-guide-card-top">03 — CATATAN PENTING</span>
             <strong>Nomor WhatsApp harus aktif.</strong>
             <p>Panitia dapat menghubungi orang tua atau wali melalui nomor WhatsApp yang dicantumkan di formulir.</p>
           </div>
           <div class="form-board-guide-actions">
             <button type="button" class="form-board-guide-action form-board-guide-action-primary" data-open-view="registration">Mulai isi formulir ${icon('chevron')}</button>
             <button type="button" class="form-board-guide-action form-board-guide-action-secondary" data-open-view="status">Cek status pengajuan</button>
           </div>
         </div>
       </section>

       <div class="form-board-workspace" id="registration-workspace">
        <aside class="form-board-sidebar" aria-label="Kemajuan formulir">
          <div class="form-board-sidebar-head">
            <div><div class="form-board-panel-kicker">${icon('file')}Tahapan pendaftaran</div><h2>Formulir<br /><em>pendaftaran.</em></h2></div>
            <span class="form-board-progress-count"><span id="progress-current">01</span><span>/04</span></span>
          </div>
          <ol class="form-board-step-list">
            <li><button class="form-board-step progress-item form-board-step-active is-active" type="button" data-go-section="section-student" data-testid="button-progress-student"><span class="form-board-step-number">01</span><span><strong>Calon peserta didik</strong><small>Identitas utama</small></span></button></li>
            <li><button class="form-board-step progress-item" type="button" data-go-section="section-school" data-testid="button-progress-school"><span class="form-board-step-number">02</span><span><strong>Sekolah asal</strong><small>Riwayat pendidikan</small></span></button></li>
            <li><button class="form-board-step progress-item" type="button" data-go-section="section-parent" data-testid="button-progress-parent"><span class="form-board-step-number">03</span><span><strong>Orang tua & wali</strong><small>Kontak keluarga</small></span></button></li>
            <li><button class="form-board-step progress-item" type="button" data-go-section="section-upload" data-testid="button-progress-upload"><span class="form-board-step-number">04</span><span><strong>Upload berkas</strong><small>Dokumen pendukung</small></span></button></li>
          </ol>
          <div class="form-board-sidebar-note">${icon('lock')}<div><strong>Data tersimpan aman</strong><p>Informasi Anda hanya digunakan untuk proses penerimaan murid baru.</p></div></div>
          <div class="form-board-sidebar-help">${icon('info')}<span>Wajib diisi ditandai dengan <b>*</b></span></div>
        </aside>

        <section class="form-board-form-panel" aria-label="Formulir pendaftaran SPMB">
          <div class="form-board-form-header">
             <div><div class="form-board-panel-kicker">${icon('file-check')}Formulir pengajuan</div><h2>Data calon peserta didik</h2><p><b>*</b> wajib diisi · label <span class="form-board-optional">opsional</span> boleh dikosongkan.</p></div>
            <span class="form-board-draft-badge"><i></i>Draft baru</span>
          </div>
          <div class="form-body" id="form-body">
            <div class="form-alert error" id="form-error" role="alert" data-testid="alert-form-error"></div>
            <form id="application-form" novalidate>
              ${section('01', 'Data Calon Peserta Didik', '', studentFields, 'section-student')}
               ${section('02', 'Data Sekolah Asal', 'Tidak wajib untuk Playgroup, Daycare, TK-A, dan TK-B.', schoolFields, 'section-school')}
              ${section('03', 'Data Orang Tua & Wali', '', parentFields, 'section-parent')}
              <fieldset class="form-board-section" id="section-upload" data-section="04">
                <div class="form-board-section-heading">
                  <span class="form-board-section-index">04</span>
                  <div class="form-board-section-copy"><div class="form-board-section-kicker"><span>Bagian 04</span><span class="form-board-section-rule"></span></div><h3>Upload Berkas</h3><p>Format PDF, JPG, atau PNG. Maksimal 5 MB per berkas.</p></div>
                  <span class="form-board-section-check"><span></span></span>
                </div>
                <div class="form-board-upload-grid">${uploadFields}</div>
              </fieldset>
              <div class="form-board-step-navigation" id="step-navigation">
                <button class="form-board-step-button form-board-step-button-secondary" type="button" id="step-back" data-testid="button-step-back">${icon('chevron')}<span>Kembali</span></button>
                <span class="form-board-step-navigation-copy" id="step-navigation-copy">Lengkapi bagian ini, lalu lanjutkan.</span>
                <button class="form-board-step-button form-board-step-button-primary" type="button" id="step-next" data-testid="button-step-next"><span>Lanjut</span>${icon('chevron')}</button>
              </div>
              <div class="form-board-submit-area">
                <label class="form-board-consent"><input id="consent" name="consent" type="checkbox" required data-testid="input-consent" /><span>Saya memastikan data yang diisi <b>benar dan dapat dipertanggungjawabkan</b>.</span></label>
                <div class="form-board-submit-row">
                  <div class="form-board-submit-info">${icon('shield')}<span>Periksa kembali data sebelum mengirim.<small>Pengajuan akan diproses oleh panitia SPMB.</small></span></div>
                  <button class="form-board-submit-button submit-button" type="submit" id="submit-button" data-testid="button-submit-application"><span class="submit-label">Kirim pengajuan</span>${icon('check')}</button>
                </div>
              </div>
            </form>
          </div>
          <div class="success-view" id="success-view" aria-live="polite" data-testid="status-submission-success">
            <div class="success-mark" aria-hidden="true">${icon('check')}</div>
            <h2>Pengajuan sudah diterima.</h2>
            <p>Data Anda telah masuk ke sistem SPMB. Simpan nomor pengajuan ini dan unduh bukti formulir.</p>
            <span class="success-id" id="submission-id"></span>
            <a class="receipt-download-button" id="receipt-download" href="#" download hidden data-testid="link-download-receipt">Unduh bukti formulir (PDF)</a>
             <button class="reset-button" type="button" id="success-status-button">Cek status pengajuan</button>
             <button class="reset-button" type="button" id="reset-button" data-testid="button-new-application">Buat pengajuan baru</button>
          </div>
        </section>
      </div>

      <footer class="form-board-footer"><span>SPMB 2027/2028 · TISA Islamic School</span><span>${icon('lock')} Data pendaftar tersimpan aman</span></footer>
    </main>
    <div class="form-board-notice" id="form-notice" role="status" aria-live="polite" hidden>${icon('check')}<span></span></div>
  </div>
`;

const form = document.getElementById('application-form') as HTMLFormElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const errorAlert = document.getElementById('form-error') as HTMLDivElement;
const formBody = document.getElementById('form-body') as HTMLDivElement;
const successView = document.getElementById('success-view') as HTMLDivElement;
const submissionId = document.getElementById('submission-id') as HTMLSpanElement;
const receiptDownload = document.getElementById('receipt-download') as HTMLAnchorElement;
const resetButton = document.getElementById('reset-button') as HTMLButtonElement;
const successStatusButton = document.getElementById('success-status-button') as HTMLButtonElement;
const healthStatus = document.getElementById('health-status') as HTMLSpanElement;
const healthDot = document.getElementById('health-dot') as HTMLElement;
const formNotice = document.getElementById('form-notice') as HTMLDivElement;
const formNoticeText = formNotice.querySelector('span') as HTMLSpanElement;
const menuButton = document.querySelector<HTMLButtonElement>('.form-board-menu-button');
const navigation = document.querySelector<HTMLElement>('.form-board-nav');
const pageViewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-page-view]'));
const registrationWorkspace = document.getElementById('registration-workspace') as HTMLDivElement;
const statusView = document.getElementById('status-view') as HTMLElement;
const guideView = document.getElementById('guide-view') as HTMLElement;
const statusForm = document.getElementById('status-form') as HTMLFormElement;
const statusNumberInput = document.getElementById('status-number') as HTMLInputElement;
const statusSubmitButton = document.getElementById('status-submit-button') as HTMLButtonElement;
const statusAlert = document.getElementById('status-alert') as HTMLDivElement;
const statusResult = document.getElementById('status-result') as HTMLElement;
const statusResultNumber = document.getElementById('status-result-number') as HTMLHeadingElement;
const statusResultCurrent = document.getElementById('status-result-current') as HTMLSpanElement;
const statusResultName = document.getElementById('status-result-name') as HTMLElement;
const statusResultLevel = document.getElementById('status-result-level') as HTMLElement;
const statusResultDate = document.getElementById('status-result-date') as HTMLElement;
const statusResultTimeline = document.getElementById('status-result-timeline') as HTMLElement;
const statusResultNote = document.getElementById('status-result-note') as HTMLElement;
const progressCurrent = document.getElementById('progress-current') as HTMLSpanElement;
const stepNavigation = document.getElementById('step-navigation') as HTMLDivElement;
const stepNavigationCopy = document.getElementById('step-navigation-copy') as HTMLSpanElement;
const stepBack = document.getElementById('step-back') as HTMLButtonElement;
const stepNext = document.getElementById('step-next') as HTMLButtonElement;
const submitArea = document.querySelector<HTMLElement>('.form-board-submit-area');

const statusDescriptions: Record<string, string> = {
  Baru: 'Pengajuan sudah diterima dan menunggu pemeriksaan panitia.',
  Diverifikasi: 'Berkas dan data sedang diperiksa oleh panitia.',
  'Perlu Perbaikan': 'Panitia membutuhkan perbaikan atau kelengkapan data.',
  Diterima: 'Pengajuan telah diterima. Ikuti informasi lanjutan dari sekolah.',
  Ditolak: 'Pengajuan belum dapat diterima pada proses seleksi ini.',
};
const statusSteps = ['Baru', 'Diverifikasi', 'Perlu Perbaikan', 'Diterima'];

type CachedFileMetadata = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

type DraftState = {
  fields: Record<string, string | boolean>;
  files: Record<string, CachedFileMetadata>;
  currentSection: number;
};

let activeSectionIndex = 0;
let cachedFileMetadata: Record<string, CachedFileMetadata> = {};

function readDraft(): DraftState | null {
  try {
    const stored = localStorage.getItem(draftStorageKey);
    if (!stored) return null;
    const draft = JSON.parse(stored) as Partial<DraftState>;
    return {
      fields: draft.fields && typeof draft.fields === 'object' ? draft.fields : {},
      files: draft.files && typeof draft.files === 'object' ? draft.files : {},
      currentSection: typeof draft.currentSection === 'number' ? draft.currentSection : 0,
    };
  } catch {
    return null;
  }
}

function saveDraft(): void {
  try {
    const fields: Record<string, string | boolean> = {};
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach((control) => {
      if (control.type === 'file') return;
      fields[control.name] = control instanceof HTMLInputElement && control.type === 'checkbox'
        ? control.checked
        : control.value;
    });
    localStorage.setItem(draftStorageKey, JSON.stringify({
      fields,
      files: cachedFileMetadata,
      currentSection: activeSectionIndex,
    } satisfies DraftState));
  } catch {
    // Form submission remains available if browser storage is unavailable.
  }
}

function openDraftFilesDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Penyimpanan berkas lokal tidak tersedia.'));
      return;
    }
    const request = window.indexedDB.open(draftFilesDatabase, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(draftFilesStore);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Penyimpanan berkas lokal gagal dibuka.'));
  });
}

async function cacheDraftFile(name: string, file: File): Promise<void> {
  const database = await openDraftFilesDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(draftFilesStore, 'readwrite');
    transaction.objectStore(draftFilesStore).put(file, name);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Berkas tidak dapat disimpan sementara.'));
  }).finally(() => database.close());
}

async function getCachedDraftFile(name: string): Promise<File | null> {
  try {
    const database = await openDraftFilesDatabase();
    return await new Promise<File | null>((resolve, reject) => {
      const request = database.transaction(draftFilesStore, 'readonly').objectStore(draftFilesStore).get(name);
      request.onsuccess = () => resolve(request.result instanceof File ? request.result : null);
      request.onerror = () => reject(request.error || new Error('Berkas sementara tidak dapat dibaca.'));
    }).finally(() => database.close());
  } catch {
    return null;
  }
}

async function removeCachedDraftFile(name: string): Promise<void> {
  try {
    const database = await openDraftFilesDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(draftFilesStore, 'readwrite');
      transaction.objectStore(draftFilesStore).delete(name);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Berkas sementara tidak dapat dihapus.'));
    }).finally(() => database.close());
  } catch {
    // A missing local cache should not block a new file selection.
  }
}

async function clearCachedDraftFiles(): Promise<void> {
  try {
    const database = await openDraftFilesDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(draftFilesStore, 'readwrite');
      transaction.objectStore(draftFilesStore).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Berkas sementara tidak dapat dihapus.'));
    }).finally(() => database.close());
  } catch {
    // The text draft can still be cleared independently.
  }
}

function clearDraft(): void {
  cachedFileMetadata = {};
  try {
    localStorage.removeItem(draftStorageKey);
  } catch {
    // Ignore unavailable browser storage.
  }
  void clearCachedDraftFiles();
}

function restoreDraft(): void {
  const draft = readDraft();
  if (!draft) return;
  cachedFileMetadata = draft.files;
  activeSectionIndex = Math.min(Math.max(draft.currentSection, 0), sectionIds.length - 1);
  Object.entries(draft.fields).forEach(([name, value]) => {
    const control = getFieldControl(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (!control) return;
    if (control instanceof HTMLInputElement && control.type === 'checkbox') {
      control.checked = value === true;
    } else if (typeof value === 'string') {
      control.value = value;
    }
  });
  Object.entries(cachedFileMetadata).forEach(([name, file]) => {
    const label = document.querySelector<HTMLElement>(`[data-file-name="${name}"]`);
    if (label) label.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  });
}

function setError(field: HTMLElement, message: string): void {
  const wrapper = field.closest<HTMLElement>('[data-field]');
  if (!wrapper) return;
  wrapper.classList.add('field-error');
  field.setAttribute('aria-invalid', 'true');
  const messageElement = wrapper.querySelector<HTMLElement>('.error-message');
  if (messageElement) messageElement.textContent = message;
}

function clearError(field: HTMLElement): void {
  const wrapper = field.closest<HTMLElement>('[data-field]');
  if (!wrapper) return;
  wrapper.classList.remove('field-error');
  field.removeAttribute('aria-invalid');
  const messageElement = wrapper.querySelector<HTMLElement>('.error-message');
  if (messageElement) messageElement.textContent = '';
}

const numericRules: Record<string, { min: number; max: number; integer: boolean }> = {
  anak_ke: { min: 1, max: 20, integer: true },
  jumlah_saudara: { min: 0, max: 50, integer: true },
  tinggi_badan: { min: 30, max: 250, integer: false },
  berat_badan: { min: 2, max: 250, integer: false },
  tahun_lulus: { min: 1900, max: new Date().getFullYear() + 1, integer: true },
};

const earlyEducationLevels = new Set(['Playgroup', 'Daycare', 'TK-A', 'TK-B']);
const minimumAgeByLevel: Record<string, number> = {
  Playgroup: 3,
  'TK-A': 4,
  'TK-B': 5,
  SD: 6,
};

function getMinimumAgeError(level: string, birthDateValue: string): string | null {
  const minimumAge = minimumAgeByLevel[level];
  if (!minimumAge || !/^\d{4}-\d{2}-\d{2}$/.test(birthDateValue)) return null;

  const birthDate = new Date(`${birthDateValue}T00:00:00.000Z`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const latestAllowedBirthDate = Date.UTC(2027 - minimumAge, 6, 1);
  return birthDate.getTime() <= latestAllowedBirthDate
    ? null
    : `Untuk jenjang ${level}, calon peserta didik harus berusia minimal ${minimumAge} tahun pada 1 Juli 2027.`;
}

function updateSchoolFieldsRequirement(): void {
  const jenjang = (getFieldControl('jenjang') as HTMLSelectElement | null)?.value || '';
  const required = !earlyEducationLevels.has(jenjang);
  const labels: Record<string, string> = {
    nama_sekolah_asal: 'Nama sekolah asal',
    tahun_lulus: 'Tahun lulus',
    alamat_sekolah_asal: 'Alamat sekolah asal',
  };

  Object.keys(labels).forEach((name) => {
    const control = getFieldControl(name) as HTMLInputElement | HTMLTextAreaElement | null;
    const wrapper = control?.closest<HTMLElement>('[data-field]');
    const requirement = wrapper?.querySelector<HTMLElement>('.form-board-field-requirement');
    if (!control || !requirement) return;
    control.required = required;
    if (required) {
      control.setAttribute('aria-required', 'true');
      requirement.innerHTML = requiredMark;
    } else {
      control.removeAttribute('aria-required');
      requirement.innerHTML = '<span class="form-board-optional">opsional</span>';
    }
  });
}

function applyPublicTheme(jenjang: string): void {
  const shell = document.querySelector<HTMLElement>('.form-board-shell');
  if (!shell) return;
  const normalizedTheme = jenjang === 'SMP'
    ? 'smp'
    : jenjang === 'SD'
      ? 'sd'
      : jenjang === 'Playgroup'
        ? 'pg'
        : jenjang === 'Daycare'
          ? 'daycare'
          : ['TK-A', 'TK-B'].includes(jenjang)
            ? 'tk'
            : 'default';
  shell.dataset.theme = normalizedTheme;
  shell.dataset.selectedJenjang = jenjang || 'Belum dipilih';
}

const digitRules: Record<string, number> = {
  nisn: 10,
  nik_anak: 16,
  nik_ayah: 16,
  nik_ibu: 16,
  nomor_kk: 16,
};

function getFieldControl(name: string): HTMLElement | null {
  return document.getElementById(name);
}

function getFieldLabel(name: string): string {
  const label = document.querySelector<HTMLElement>(`[data-field="${name}"] label`);
  return label?.textContent?.replace(/\s+/g, ' ').replace(' *', '').replace(' opsional', '').trim() || name;
}

function isValidPhone(value: string): boolean {
  return /^(?:\+62|62|0)8\d{8,12}$/.test(value.replace(/[^\d+]/g, ''));
}

async function validateForm(scope: ParentNode = form): Promise<boolean> {
  let firstInvalid: HTMLElement | null = null;
  const invalidNames = new Set<string>();
  const markInvalid = (control: HTMLElement, message: string) => {
    setError(control, message);
    invalidNames.add(control.id);
    if (!firstInvalid) firstInvalid = control;
  };
  const controls = Array.from(scope.querySelectorAll<HTMLElement>('input, select, textarea'));
  for (const control of controls) {
    clearError(control);
    const input = control as HTMLInputElement;
    if (input.type === 'file') {
      const hasFile = Boolean(input.files?.[0]) || Boolean(await getCachedDraftFile(input.name));
      if (!hasFile && input.required) markInvalid(control, 'Berkas ini wajib diunggah.');
      continue;
    }
    const empty = input.type === 'checkbox' ? !input.checked : !input.value.trim();
    if (empty) {
      if (input.required) {
        markInvalid(control, input.type === 'checkbox' ? 'Persetujuan diperlukan sebelum mengirim.' : 'Bagian ini wajib diisi.');
      }
    } else if (input.type === 'email' && !input.validity.valid) {
      markInvalid(control, 'Masukkan alamat email yang valid.');
    } else if (input.type !== 'checkbox') {
      const value = input.value.trim();
      const digitLength = digitRules[input.name];
      const numericRule = numericRules[input.name];
      if (digitLength && !new RegExp(`^\\d{${digitLength}}$`).test(value)) {
        markInvalid(control, `${getFieldLabel(input.name)} harus terdiri dari ${digitLength} digit angka.`);
      } else if (numericRule) {
        const numberValue = Number(value);
        const invalidNumber =
          !Number.isFinite(numberValue) ||
          numberValue < numericRule.min ||
          numberValue > numericRule.max ||
          (numericRule.integer && !Number.isInteger(numberValue));
        if (invalidNumber) {
          markInvalid(control, `${getFieldLabel(input.name)} harus berada di antara ${numericRule.min} dan ${numericRule.max}${numericRule.integer ? ' dan berupa bilangan bulat' : ''}.`);
        }
      } else if (input.name === 'nomor_hp_orangtua' && !isValidPhone(value)) {
        markInvalid(control, 'Masukkan nomor WhatsApp Indonesia yang aktif, misalnya 081234567890.');
      } else if (input.name === 'tanggal_lahir') {
        const birthDate = new Date(`${value}T00:00:00.000Z`);
        const today = new Date();
        const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
        if (Number.isNaN(birthDate.getTime()) || birthDate.getTime() > todayUtc || birthDate.getUTCFullYear() < 1900) {
          markInvalid(control, 'Tanggal lahir harus valid dan tidak boleh melebihi hari ini.');
        } else {
          const level = (scope.querySelector('#jenjang') as HTMLSelectElement | null)?.value
            || (getFieldControl('jenjang') as HTMLSelectElement | null)?.value
            || '';
          const ageError = getMinimumAgeError(level, value);
          if (ageError) markInvalid(control, ageError);
        }
      }
    }
  }

  const guardianName = scope.querySelector<HTMLInputElement>('#nama_wali');
  const guardianRelation = scope.querySelector<HTMLInputElement>('#hubungan_wali');
  if (guardianName?.value.trim() && !guardianRelation?.value.trim()) {
    markInvalid(guardianRelation || guardianName, 'Isi hubungan dengan wali.');
  } else if (guardianRelation?.value.trim() && !guardianName?.value.trim()) {
    markInvalid(guardianName || guardianRelation, 'Isi nama wali.');
  }

  const invalidControl = firstInvalid as HTMLElement | null;
  if (invalidControl) {
    if (scope === form) {
      const invalidSection = invalidControl.closest<HTMLElement>('[data-section]');
      const invalidSectionIndex = invalidSection ? sectionIds.indexOf(invalidSection.id) : -1;
      if (invalidSectionIndex >= 0 && invalidSectionIndex !== activeSectionIndex) {
        activeSectionIndex = invalidSectionIndex;
        updateProgress();
      }
    }
    (invalidControl as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).focus();
    const labels = [...invalidNames].map(getFieldLabel);
    errorAlert.textContent = labels.length === 1
      ? `Periksa kolom ${labels[0]}.`
      : `Periksa ${labels.length} kolom yang ditandai merah: ${labels.slice(0, 4).join(', ')}${labels.length > 4 ? ', dan lainnya' : ''}.`;
    errorAlert.className = 'form-alert error is-visible';
    return false;
  }
  errorAlert.className = 'form-alert error';
  return true;
}

function goToSection(index: number, shouldScroll = true): void {
  activeSectionIndex = Math.min(Math.max(index, 0), sectionIds.length - 1);
  updateProgress();
  saveDraft();
  if (shouldScroll) {
    document.getElementById(sectionIds[activeSectionIndex])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateProgress(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
  const activeIndex = Math.min(activeSectionIndex, sections.length - 1);
  activeSectionIndex = activeIndex;
  sections.forEach((sectionElement, index) => {
    const required = Array.from(sectionElement.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]'));
    const complete = required.length > 0 && required.every((control) =>
      control instanceof HTMLInputElement && control.type === 'checkbox'
        ? control.checked
        : control instanceof HTMLInputElement && control.type === 'file'
          ? Boolean(control.files?.[0]) || Boolean(cachedFileMetadata[control.name])
          : Boolean(control.value.trim()),
    );
    const isCurrent = index === activeIndex;
    sectionElement.hidden = !isCurrent;
    sectionElement.classList.toggle('form-board-section-active', isCurrent);
    const kicker = sectionElement.querySelector<HTMLElement>('.form-board-section-kicker span');
    if (kicker) kicker.textContent = isCurrent ? 'Sedang diisi' : 'Belum diisi';
    sectionElement.querySelector('.form-board-section-check > span')?.classList.toggle('form-board-section-dot', isCurrent);
    const item = document.querySelector<HTMLElement>(`[data-go-section="${sectionElement.id}"]`);
    item?.classList.toggle('is-complete', complete && index < activeIndex);
    item?.classList.toggle('form-board-step-complete', complete && index < activeIndex);
  });
  document.querySelectorAll<HTMLElement>('.progress-item').forEach((item, index) => {
    item.classList.toggle('is-active', index === activeIndex);
    item.classList.toggle('form-board-step-active', index === activeIndex);
  });
  progressCurrent.textContent = String(activeIndex + 1).padStart(2, '0');
  stepBack.hidden = activeIndex === 0;
  stepNext.hidden = activeIndex === sections.length - 1;
  stepNavigation.classList.toggle('is-final', activeIndex === sections.length - 1);
  submitArea?.classList.toggle('is-visible', activeIndex === sections.length - 1);
  stepNavigationCopy.textContent = activeIndex === sections.length - 1
    ? 'Periksa kembali semua berkas sebelum mengirim pengajuan.'
    : 'Lengkapi bagian ini, lalu lanjutkan.';
}

function showNotice(message: string): void {
  formNoticeText.textContent = message;
  formNotice.hidden = false;
  window.setTimeout(() => { formNotice.hidden = true; }, 2800);
}

function setPageView(view: 'registration' | 'status' | 'guide', shouldScroll = true): void {
  const isRegistrationView = view === 'registration';
  const isStatusView = view === 'status';
  registrationWorkspace.hidden = !isRegistrationView;
  statusView.hidden = !isStatusView;
  guideView.hidden = view !== 'guide';
  pageViewButtons.forEach((button) => {
    button.classList.toggle('form-board-nav-active', button.dataset.pageView === view);
  });
  navigation?.classList.remove('form-board-nav-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  if (shouldScroll) {
    const target = isStatusView ? statusView : view === 'guide' ? guideView : registrationWorkspace;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (isStatusView) {
      window.setTimeout(() => statusNumberInput.focus({ preventScroll: true }), 350);
    }
  }
}

function formatStatusDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

function renderStatusResult(result: Awaited<ReturnType<typeof getSubmissionStatus>>): void {
  const currentIndex = statusSteps.indexOf(result.status);
  const isRejected = result.status === 'Ditolak';
  const statusLabel = result.status === 'Baru' ? 'Diterima sistem' : result.status;

  statusResultNumber.textContent = result.applicationNumber;
  statusResultCurrent.textContent = statusLabel;
  statusResultName.textContent = result.nama_calon;
  statusResultLevel.textContent = result.jenjang;
  statusResultDate.textContent = formatStatusDate(result.created_at);
  statusResultTimeline.innerHTML = statusSteps.map((step, index) => {
    const isCurrent = step === result.status;
    const isComplete = !isRejected && currentIndex > index;
    const stateClass = isCurrent ? 'is-current' : isComplete ? 'is-complete' : '';
    return `<div class="form-board-status-step ${stateClass}">
      <span class="form-board-status-step-dot">${isComplete ? icon('check') : ''}</span>
      <div><strong>${escapeHtml(step === 'Baru' ? 'Pengajuan diterima' : step)}</strong><small>${escapeHtml(statusDescriptions[step])}</small></div>
    </div>`;
  }).join('');
  statusResultNote.className = `form-board-status-note${isRejected ? ' is-rejected' : result.status === 'Diterima' ? ' is-success' : ''}`;
  statusResultNote.innerHTML = `<strong>${escapeHtml(statusLabel)}</strong><span>${escapeHtml(statusDescriptions[result.status] || 'Status pengajuan sedang diperbarui.')}</span>`;
  statusResult.hidden = false;
}

function getStatusErrorMessage(error: unknown): string {
  const candidate = error && typeof error === 'object'
    ? error as { message?: unknown; data?: unknown }
    : {};
  const data = candidate.data && typeof candidate.data === 'object'
    ? candidate.data as { error?: unknown }
    : null;
  return typeof data?.error === 'string'
    ? data.error
    : typeof candidate.message === 'string'
      ? candidate.message
      : 'Status pengajuan belum dapat diperiksa. Silakan coba lagi.';
}

menuButton?.addEventListener('click', () => {
  const open = navigation?.classList.toggle('form-board-nav-open') ?? false;
  menuButton.setAttribute('aria-expanded', String(open));
});

pageViewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const view = button.dataset.pageView;
    setPageView(view === 'status' ? 'status' : view === 'guide' ? 'guide' : 'registration');
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-open-view]').forEach((button) => {
  button.addEventListener('click', () => {
    const view = button.dataset.openView;
    setPageView(view === 'status' ? 'status' : 'registration');
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-notice]').forEach((button) => {
  button.addEventListener('click', () => {
    showNotice(button.dataset.notice || '');
    navigation?.classList.remove('form-board-nav-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll<HTMLElement>('[data-go-section]').forEach((button) => {
  button.addEventListener('click', () => {
    const index = sectionIds.indexOf(button.dataset.goSection || '');
    if (index >= 0) goToSection(index);
  });
});

form.querySelectorAll<HTMLElement>('input, select, textarea').forEach((control) => {
  control.addEventListener('input', () => {
    clearError(control);
    saveDraft();
  });
  control.addEventListener('change', () => {
    clearError(control);
    saveDraft();
  });
});

getFieldControl('jenjang')?.addEventListener('change', () => {
  applyPublicTheme((getFieldControl('jenjang') as HTMLSelectElement).value);
  updateSchoolFieldsRequirement();
  saveDraft();
});

statusForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const number = statusNumberInput.value.trim().toUpperCase();
  statusAlert.hidden = true;
  statusResult.hidden = true;
  if (!/^(?:SPMB-)?\d+$/.test(number)) {
    statusAlert.textContent = 'Masukkan nomor pengajuan dengan format SPMB-000001.';
    statusAlert.hidden = false;
    statusNumberInput.focus();
    return;
  }

  statusSubmitButton.disabled = true;
  statusSubmitButton.querySelector('span')!.textContent = 'Memeriksa';
  try {
    const result = await getSubmissionStatus({ number });
    renderStatusResult(result);
  } catch (error) {
    statusAlert.textContent = getStatusErrorMessage(error);
    statusAlert.hidden = false;
  } finally {
    statusSubmitButton.disabled = false;
    statusSubmitButton.querySelector('span')!.textContent = 'Cek status';
  }
});

successStatusButton.addEventListener('click', () => {
  setPageView('status');
  statusForm.requestSubmit();
});

restoreDraft();
applyPublicTheme((getFieldControl('jenjang') as HTMLSelectElement | null)?.value || '');
updateSchoolFieldsRequirement();

document.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => {
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    const label = document.querySelector<HTMLElement>(`[data-file-name="${input.name}"]`);
    const upload = input.closest<HTMLElement>('[data-upload]');
    const error = document.querySelector<HTMLElement>(`[data-file-error="${input.name}"]`);
    const extension = file?.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const invalidType = Boolean(file && (!extension || !allowedExtensions.includes(extension) || (file.type && !allowedMimeTypes.includes(file.type))));
    const invalidSize = Boolean(file && file.size > 5 * 1024 * 1024);
    upload?.classList.remove('is-invalid');
    if (error) error.textContent = '';
    if (file && (invalidType || invalidSize)) {
      input.value = '';
      delete cachedFileMetadata[input.name];
      void removeCachedDraftFile(input.name);
      if (label) label.textContent = 'Belum ada berkas dipilih';
      if (error) error.textContent = invalidSize ? 'Ukuran maksimal 5 MB.' : 'Format harus PDF, JPG, atau PNG.';
      upload?.classList.add('is-invalid');
      saveDraft();
      updateProgress();
      return;
    }
    if (label) label.textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Belum ada berkas dipilih';
    if (file) {
      cachedFileMetadata[input.name] = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
      void cacheDraftFile(input.name, file).catch(() => undefined);
      showNotice(`${input.closest<HTMLElement>('[data-upload]')?.querySelector('strong')?.textContent?.replace(' *', '') || 'Berkas'} berhasil dipilih.`);
    } else {
      delete cachedFileMetadata[input.name];
      void removeCachedDraftFile(input.name);
    }
    saveDraft();
    updateProgress();
  });
});

stepBack.addEventListener('click', () => goToSection(activeSectionIndex - 1));
stepNext.addEventListener('click', async () => {
  stepNext.disabled = true;
  const currentSection = document.getElementById(sectionIds[activeSectionIndex]);
  const valid = currentSection ? await validateForm(currentSection) : true;
  stepNext.disabled = false;
  if (valid) goToSection(activeSectionIndex + 1);
});

function showSubmissionError(error: unknown): void {
  const candidate = error && typeof error === 'object'
    ? error as { message?: unknown; data?: unknown }
    : {};
  const data = candidate.data && typeof candidate.data === 'object'
    ? candidate.data as { error?: unknown; fields?: unknown }
    : null;
  const fields = data && Array.isArray(data.fields)
    ? data.fields.filter((field): field is string => typeof field === 'string')
    : [];
  const normalizedFields = [...new Set(fields.map((field) => field.split(':', 1)[0]))];
  const serverError = typeof data?.error === 'string' ? data.error : '';
  normalizedFields.forEach((name) => {
    const control = getFieldControl(name);
    if (control) {
      const message = name === 'tanggal_lahir' && serverError.includes('berusia minimal')
        ? serverError
        : name.includes('nik') || name === 'nomor_kk'
        ? `${getFieldLabel(name)} harus berupa angka dengan panjang yang benar.`
        : name.includes('file') || ['foto_3x4', 'akte_lahir', 'kartu_keluarga', 'ktp_orangtua', 'bukti_bayar'].includes(name)
          ? 'Berkas ini perlu diperiksa dan diunggah ulang.'
          : 'Periksa kembali isian ini.';
      setError(control, message);
    }
  });

  if (normalizedFields.length) {
    const labels = normalizedFields.map(getFieldLabel);
    errorAlert.textContent = `Data belum dapat dikirim. Periksa: ${labels.slice(0, 4).join(', ')}${labels.length > 4 ? ', dan lainnya' : ''}.`;
    const firstField = getFieldControl(normalizedFields[0]);
    const invalidSection = firstField?.closest<HTMLElement>('[data-section]');
    const invalidSectionIndex = invalidSection ? sectionIds.indexOf(invalidSection.id) : -1;
    if (invalidSectionIndex >= 0) goToSection(invalidSectionIndex);
    firstField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    errorAlert.textContent = serverError
      || (typeof candidate.message === 'string'
        ? candidate.message
        : 'Pengajuan belum dapat dikirim. Silakan coba lagi.');
  }
  errorAlert.className = 'form-alert error is-visible';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!(await validateForm())) return;
  submitButton.disabled = true;
  submitButton.classList.add('is-loading');
  submitButton.querySelector('.submit-label')!.textContent = 'Mengirim pengajuan';
  errorAlert.className = 'form-alert error';
  try {
    const formData = new FormData(form);
    for (const name of uploadFieldNames) {
      const input = getFieldControl(name) as HTMLInputElement | null;
      if (input?.files?.[0]) continue;
      const cachedFile = await getCachedDraftFile(name);
      if (cachedFile) formData.set(name, cachedFile, cachedFile.name);
    }
    const payload: Record<string, string | File> = {};
    formData.forEach((value, key) => {
      if (key !== 'consent' && (typeof value === 'string' ? value : value.name)) payload[key] = value;
    });
    const result = await submitApplication(payload as unknown as Parameters<typeof submitApplication>[0]);
    form.reset();
    clearDraft();
    document.querySelectorAll<HTMLElement>('[data-file-name]').forEach((label) => { label.textContent = 'Belum ada berkas dipilih'; });
    document.querySelectorAll<HTMLElement>('[data-field]').forEach((field) => field.classList.remove('field-error'));
    submissionId.textContent = `Nomor pengajuan: SPMB-${String(result.id).padStart(6, '0')}`;
    statusNumberInput.value = `SPMB-${String(result.id).padStart(6, '0')}`;
    receiptDownload.href = result.receiptUrl;
    receiptDownload.hidden = false;
    formBody.classList.add('is-hidden');
    successView.classList.add('is-visible');
    const cardTop = document.querySelector('.form-card')?.getBoundingClientRect().top ?? 0;
    window.scrollTo({ top: cardTop + window.scrollY - 25, behavior: 'smooth' });
  } catch (error) {
    showSubmissionError(error);
    submitButton.disabled = false;
    submitButton.classList.remove('is-loading');
    submitButton.querySelector('.submit-label')!.textContent = 'Kirim pengajuan';
  }
});

resetButton.addEventListener('click', () => {
  clearDraft();
  successView.classList.remove('is-visible');
  receiptDownload.hidden = true;
  receiptDownload.removeAttribute('href');
  formBody.classList.remove('is-hidden');
  submitButton.disabled = false;
  submitButton.classList.remove('is-loading');
  submitButton.querySelector('.submit-label')!.textContent = 'Kirim pengajuan';
  activeSectionIndex = 0;
  applyPublicTheme('');
  updateProgress();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

updateProgress();

healthCheck()
  .then((status) => {
    healthDot.style.backgroundColor = status.database === 'ok' ? 'hsl(153 52% 42%)' : 'hsl(10 60% 54%)';
    healthStatus.textContent = status.status === 'ok' ? 'Layanan siap menerima pengajuan' : 'Layanan sedang diperiksa';
  })
  .catch(() => {
    healthDot.style.backgroundColor = 'hsl(10 60% 54%)';
    healthStatus.textContent = 'Koneksi perlu diperiksa';
  });
}
