import { healthCheck, submitApplication, verifyPayment } from '@workspace/api-client-react';
import schoolLogoUrl from '../../../lib/logo tisa.png';
import './index.css';
import './form-board.css';

type FieldKind = 'text' | 'email' | 'date' | 'number' | 'textarea' | 'select';

type IconName = 'bell' | 'calendar' | 'check' | 'chevron' | 'clipboard' | 'file' | 'file-check' | 'folder' | 'info' | 'lock' | 'menu' | 'shield' | 'upload';

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
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z"/><path d="m8 12 2.5 2.5L16 9"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
};

function icon(name: IconName): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
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
  const requirementLabel = required
    ? requiredMark
    : '<span class="form-board-optional">opsional</span>';
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
  inputField('jenjang', 'Jenjang yang dituju', 'select', ['Playgroup', 'Daycare', 'TK-A', 'TK-B', 'SD', 'SMP']),
  inputField('nama_calon', 'Nama lengkap calon peserta didik'),
  inputField('nama_panggilan', 'Nama panggilan'),
  inputField('jenis_kelamin', 'Jenis kelamin', 'select', ['Laki-laki', 'Perempuan']),
  inputField('tempat_lahir', 'Tempat lahir'),
  inputField('tanggal_lahir', 'Tanggal lahir', 'date'),
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
  inputField('nama_sekolah_asal', 'Nama sekolah asal'),
  inputField('tahun_lulus', 'Tahun lulus', 'number'),
  inputField('alamat_sekolah_asal', 'Alamat sekolah asal', 'textarea', [], '', true),
].join('');

const parentFields = [
  inputField('nomor_kk', 'Nomor Kartu Keluarga'),
  inputField('nik_orangtua', 'NIK orang tua'),
  inputField('nomor_hp_orangtua', 'Nomor HP orang tua', 'text', [], 'Nomor yang aktif menerima informasi'),
  inputField('email', 'Email orang tua', 'email'),
  inputField('nama_ayah', 'Nama lengkap ayah'),
  inputField('ttl_ayah', 'Tempat, tanggal lahir ayah'),
  inputField('pendidikan_ayah', 'Pendidikan terakhir ayah'),
  inputField('pekerjaan_ayah', 'Pekerjaan ayah'),
  inputField('penghasilan_ayah', 'Penghasilan per bulan ayah'),
  inputField('instansi_jabatan_ayah', 'Instansi atau jabatan ayah'),
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
          <button type="button" class="form-board-nav-active" data-notice="Anda sedang berada di formulir pendaftaran.">Pendaftaran</button>
          <button type="button" data-notice="Status pengajuan dapat dicek setelah formulir dikirim.">Status pengajuan</button>
          <button type="button" data-notice="Panduan belum tersedia.">Panduan</button>
        </nav>
        <div class="form-board-topbar-actions">
          <button type="button" class="form-board-icon-button" aria-label="Notifikasi" data-notice="Tidak ada notifikasi baru.">${icon('bell')}<span></span></button>
          <span class="form-board-service-status"><i id="health-dot"></i><span id="health-status" data-testid="status-health">Memeriksa layanan</span></span>
        </div>
      </div>
    </header>

    <main id="form-board-content" class="form-board-main">
      <div class="form-board-intro">
        <div class="form-board-intro-copy">
          <div class="form-board-eyebrow"><span></span>Ruang pendaftaran · tahun ajaran 2027 / 2028</div>
          <h1 id="page-title">Formulir pendaftaran <em>SPMB.</em></h1>
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

      <section class="form-board-payment-gate" id="payment-gate" aria-labelledby="payment-gate-title">
        <div class="form-board-payment-copy">
          <div class="form-board-panel-kicker">${icon('shield')}Langkah awal · verifikasi pembayaran</div>
          <h2 id="payment-gate-title">Pastikan bukti bayar<br /><em>sudah siap.</em></h2>
          <p>Unggah tangkapan layar atau foto bukti pembayaran. AI akan mengenali detail transaksi yang terbaca sebelum Anda mengisi formulir pendaftaran.</p>
          <small>Screening AI ini adalah pemeriksaan awal. Panitia tetap melakukan verifikasi penerimaan dana.</small>
        </div>
        <form class="form-board-payment-form" id="payment-verification-form">
          <label class="form-board-payment-dropzone" for="payment-proof">
            <span class="form-board-payment-dropzone-icon">${icon('upload')}</span>
            <strong id="payment-proof-label">Pilih bukti bayar</strong>
            <span id="payment-proof-name">JPG atau PNG · maksimal 5 MB</span>
            <input id="payment-proof" name="bukti_bayar" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" required aria-required="true" />
          </label>
          <div class="form-board-payment-error" id="payment-error" role="alert" aria-live="polite"></div>
          <button class="form-board-payment-button" id="payment-verify-button" type="submit">
            <span class="payment-verify-label">Verifikasi bukti bayar</span>${icon('check')}
          </button>
          <p class="form-board-payment-privacy">${icon('lock')}Berkas hanya digunakan untuk screening dan tidak disimpan sebagai data pendaftaran pada tahap ini.</p>
        </form>
        <div class="form-board-payment-result" id="payment-result" aria-live="polite" hidden>
          <div class="form-board-payment-result-mark">${icon('check')}</div>
          <div>
            <strong id="payment-result-title">Bukti bayar dikenali</strong>
            <p id="payment-result-message"></p>
            <dl>
              <div><dt>Nominal</dt><dd id="payment-detail-amount">—</dd></div>
              <div><dt>Referensi</dt><dd id="payment-detail-reference">—</dd></div>
              <div><dt>Penerima</dt><dd id="payment-detail-recipient">—</dd></div>
              <div><dt>Tanggal</dt><dd id="payment-detail-date">—</dd></div>
            </dl>
            <button type="button" class="form-board-payment-continue" id="payment-continue-button">Lanjut ke formulir pendaftaran ${icon('chevron')}</button>
          </div>
        </div>
      </section>

      <div class="form-board-workspace is-hidden" id="registration-workspace">
        <aside class="form-board-sidebar" aria-label="Kemajuan formulir">
          <div class="form-board-sidebar-head">
            <div><div class="form-board-panel-kicker">${icon('file')}Tahapan pendaftaran</div><h2>Formulir<br /><em>pendaftaran.</em></h2></div>
            <span class="form-board-progress-count">01<span>/04</span></span>
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
              ${section('02', 'Data Sekolah Asal', '', schoolFields, 'section-school')}
              ${section('03', 'Data Orang Tua & Wali', '', parentFields, 'section-parent')}
              <fieldset class="form-board-section" id="section-upload" data-section="04">
                <div class="form-board-section-heading">
                  <span class="form-board-section-index">04</span>
                  <div class="form-board-section-copy"><div class="form-board-section-kicker"><span>Bagian 04</span><span class="form-board-section-rule"></span></div><h3>Upload Berkas</h3><p>Format PDF, JPG, atau PNG. Maksimal 5 MB per berkas.</p></div>
                  <span class="form-board-section-check"><span></span></span>
                </div>
                <div class="form-board-upload-grid">${uploadFields}</div>
              </fieldset>
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
const healthStatus = document.getElementById('health-status') as HTMLSpanElement;
const healthDot = document.getElementById('health-dot') as HTMLElement;
const formNotice = document.getElementById('form-notice') as HTMLDivElement;
const formNoticeText = formNotice.querySelector('span') as HTMLSpanElement;
const paymentForm = document.getElementById('payment-verification-form') as HTMLFormElement;
const paymentProofInput = document.getElementById('payment-proof') as HTMLInputElement;
const paymentProofLabel = document.getElementById('payment-proof-label') as HTMLElement;
const paymentProofName = document.getElementById('payment-proof-name') as HTMLElement;
const paymentError = document.getElementById('payment-error') as HTMLElement;
const paymentVerifyButton = document.getElementById('payment-verify-button') as HTMLButtonElement;
const paymentVerifyLabel = paymentVerifyButton.querySelector('.payment-verify-label') as HTMLElement;
const paymentResult = document.getElementById('payment-result') as HTMLDivElement;
const paymentResultTitle = document.getElementById('payment-result-title') as HTMLElement;
const paymentResultMessage = document.getElementById('payment-result-message') as HTMLElement;
const paymentDetailAmount = document.getElementById('payment-detail-amount') as HTMLElement;
const paymentDetailReference = document.getElementById('payment-detail-reference') as HTMLElement;
const paymentDetailRecipient = document.getElementById('payment-detail-recipient') as HTMLElement;
const paymentDetailDate = document.getElementById('payment-detail-date') as HTMLElement;
const paymentContinueButton = document.getElementById('payment-continue-button') as HTMLButtonElement;
const paymentGate = document.getElementById('payment-gate') as HTMLElement;
const registrationWorkspace = document.getElementById('registration-workspace') as HTMLElement;
const menuButton = document.querySelector<HTMLButtonElement>('.form-board-menu-button');
const navigation = document.querySelector<HTMLElement>('.form-board-nav');
let paymentVerified = false;

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

function validateForm(): boolean {
  let firstInvalid: HTMLElement | null = null;
  const controls = Array.from(form.querySelectorAll<HTMLElement>('input[required], select[required], textarea[required]'));
  controls.forEach((control) => {
    clearError(control);
    const input = control as HTMLInputElement;
    const empty = input.type === 'checkbox' ? !input.checked : !input.value.trim();
    if (empty) {
      setError(control, input.type === 'checkbox' ? 'Persetujuan diperlukan sebelum mengirim.' : 'Bagian ini wajib diisi.');
      if (!firstInvalid) firstInvalid = control;
    } else if (input.type === 'email' && !input.validity.valid) {
      setError(control, 'Masukkan alamat email yang valid.');
      if (!firstInvalid) firstInvalid = control;
    }
  });
  if (firstInvalid) {
    (firstInvalid as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).focus();
     errorAlert.textContent = 'Masih ada data yang perlu dilengkapi. Kolom bertanda * wajib diisi.';
    errorAlert.className = 'form-alert error is-visible';
    return false;
  }
  errorAlert.className = 'form-alert error';
  return true;
}

function updateProgress(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
  const marker = window.scrollY + 165;
  let activeIndex = 0;
  sections.forEach((sectionElement, index) => {
    const active = sectionElement.offsetTop <= marker;
    if (active) activeIndex = index;
    const required = Array.from(sectionElement.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]'));
    const complete = required.length > 0 && required.every((control) =>
      control instanceof HTMLInputElement && control.type === 'checkbox'
        ? control.checked
        : Boolean(control.value.trim()),
    );
    const isCurrent = sectionElement.offsetTop <= marker && (index === sections.length - 1 || sections[index + 1].offsetTop > marker);
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
}

function showNotice(message: string): void {
  formNoticeText.textContent = message;
  formNotice.hidden = false;
  window.setTimeout(() => { formNotice.hidden = true; }, 2800);
}

menuButton?.addEventListener('click', () => {
  const open = navigation?.classList.toggle('form-board-nav-open') ?? false;
  menuButton.setAttribute('aria-expanded', String(open));
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
    document.getElementById(button.dataset.goSection || '')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

form.querySelectorAll<HTMLElement>('input, select, textarea').forEach((control) => {
  control.addEventListener('input', () => clearError(control));
  control.addEventListener('change', () => clearError(control));
});

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
      if (label) label.textContent = 'Belum ada berkas dipilih';
      if (error) error.textContent = invalidSize ? 'Ukuran maksimal 5 MB.' : 'Format harus PDF, JPG, atau PNG.';
      upload?.classList.add('is-invalid');
      updateProgress();
      return;
    }
    if (label) label.textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Belum ada berkas dipilih';
    if (file) showNotice(`${input.closest<HTMLElement>('[data-upload]')?.querySelector('strong')?.textContent?.replace(' *', '') || 'Berkas'} berhasil dipilih.`);
    updateProgress();
  });
});

paymentProofInput.addEventListener('change', () => {
  const file = paymentProofInput.files?.[0];
  const extension = file?.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  const validType = Boolean(file && ['.jpg', '.jpeg', '.png'].includes(extension || '') && ['image/jpeg', 'image/png'].includes(file.type));
  const invalidSize = Boolean(file && file.size > 5 * 1024 * 1024);
  paymentError.textContent = '';
  paymentProofInput.removeAttribute('aria-invalid');
  paymentGate.classList.remove('is-invalid');
  if (file && (!validType || invalidSize)) {
    paymentProofInput.value = '';
    paymentProofLabel.textContent = 'Pilih bukti bayar';
    paymentProofName.textContent = 'JPG atau PNG · maksimal 5 MB';
    paymentError.textContent = invalidSize
      ? 'Ukuran bukti bayar maksimal 5 MB.'
      : 'Untuk verifikasi AI, gunakan gambar JPG atau PNG.';
    paymentProofInput.setAttribute('aria-invalid', 'true');
    paymentGate.classList.add('is-invalid');
    return;
  }
  paymentProofLabel.textContent = file ? 'Bukti bayar siap' : 'Pilih bukti bayar';
  paymentProofName.textContent = file
    ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`
    : 'JPG atau PNG · maksimal 5 MB';
});

paymentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = paymentProofInput.files?.[0];
  if (!file) {
    paymentError.textContent = 'Bukti pembayaran wajib dipilih.';
    paymentGate.classList.add('is-invalid');
    paymentProofInput.focus();
    return;
  }

  paymentVerifyButton.disabled = true;
  paymentVerifyButton.classList.add('is-loading');
  paymentVerifyLabel.textContent = 'Memeriksa bukti bayar';
  paymentError.textContent = '';
  try {
    const result = await verifyPayment({ bukti_bayar: file as unknown as string });
    paymentResultTitle.textContent = result.status === 'verified'
      ? 'Bukti bayar berhasil dikenali'
      : 'Bukti bayar perlu diperiksa';
    paymentResultMessage.textContent = result.message;
    paymentDetailAmount.textContent = result.details.amount || 'Tidak terbaca';
    paymentDetailReference.textContent = result.details.transactionReference || 'Tidak terbaca';
    paymentDetailRecipient.textContent = result.details.recipient || 'Tidak terbaca';
    paymentDetailDate.textContent = result.details.transactionDate || 'Tidak terbaca';
    paymentResult.hidden = false;
    if (result.status === 'verified') {
      paymentVerified = true;
      paymentGate.classList.remove('is-invalid');
      paymentGate.classList.add('is-verified');
      paymentError.textContent = '';
      paymentContinueButton.focus();
    } else {
      paymentVerified = false;
      paymentGate.classList.add('is-invalid');
      paymentError.textContent = result.reason;
    }
  } catch (error) {
    paymentVerified = false;
    paymentGate.classList.add('is-invalid');
    paymentError.textContent = error instanceof Error
      ? error.message
      : 'Verifikasi belum dapat dilakukan. Silakan coba lagi.';
  } finally {
    paymentVerifyButton.disabled = false;
    paymentVerifyButton.classList.remove('is-loading');
    paymentVerifyLabel.textContent = 'Verifikasi bukti bayar';
  }
});

paymentContinueButton.addEventListener('click', () => {
  if (!paymentVerified) return;
  registrationWorkspace.classList.remove('is-hidden');
  paymentGate.classList.add('is-collapsed');
  registrationWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!paymentVerified) {
    paymentGate.scrollIntoView({ behavior: 'smooth', block: 'start' });
    paymentError.textContent = 'Verifikasi pembayaran diperlukan sebelum mengirim pendaftaran.';
    paymentGate.classList.add('is-invalid');
    return;
  }
  if (!validateForm()) return;
  submitButton.disabled = true;
  submitButton.classList.add('is-loading');
  submitButton.querySelector('.submit-label')!.textContent = 'Mengirim pengajuan';
  errorAlert.className = 'form-alert error';
  try {
    const formData = new FormData(form);
    const payload: Record<string, string | File> = {};
    formData.forEach((value, key) => {
      if (key !== 'consent' && (typeof value === 'string' ? value : value.name)) payload[key] = value;
    });
    const result = await submitApplication(payload as unknown as Parameters<typeof submitApplication>[0]);
    form.reset();
    document.querySelectorAll<HTMLElement>('[data-file-name]').forEach((label) => { label.textContent = 'Belum ada berkas dipilih'; });
    document.querySelectorAll<HTMLElement>('[data-field]').forEach((field) => field.classList.remove('field-error'));
    submissionId.textContent = `Nomor pengajuan: SPMB-${String(result.id).padStart(6, '0')}`;
    receiptDownload.href = result.receiptUrl;
    receiptDownload.hidden = false;
    formBody.classList.add('is-hidden');
    successView.classList.add('is-visible');
    const cardTop = document.querySelector('.form-card')?.getBoundingClientRect().top ?? 0;
    window.scrollTo({ top: cardTop + window.scrollY - 25, behavior: 'smooth' });
  } catch (error) {
    errorAlert.textContent = error instanceof Error ? error.message : 'Pengajuan belum dapat dikirim. Silakan coba lagi.';
    errorAlert.className = 'form-alert error is-visible';
    submitButton.disabled = false;
    submitButton.classList.remove('is-loading');
    submitButton.querySelector('.submit-label')!.textContent = 'Kirim pengajuan';
  }
});

resetButton.addEventListener('click', () => {
  successView.classList.remove('is-visible');
  receiptDownload.hidden = true;
  receiptDownload.removeAttribute('href');
  formBody.classList.remove('is-hidden');
  submitButton.disabled = false;
  submitButton.classList.remove('is-loading');
  submitButton.querySelector('.submit-label')!.textContent = 'Kirim pengajuan';
  paymentVerified = false;
  paymentForm.reset();
  paymentResult.hidden = true;
  paymentGate.classList.remove('is-verified', 'is-collapsed', 'is-invalid');
  paymentError.textContent = '';
  paymentProofLabel.textContent = 'Pilih bukti bayar';
  paymentProofName.textContent = 'JPG atau PNG · maksimal 5 MB';
  registrationWorkspace.classList.add('is-hidden');
  updateProgress();
  paymentGate.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

window.addEventListener('scroll', updateProgress, { passive: true });
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
