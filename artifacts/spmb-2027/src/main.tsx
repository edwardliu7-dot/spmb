import { healthCheck, submitApplication } from '@workspace/api-client-react';
import './index.css';

type FieldKind = 'text' | 'email' | 'date' | 'number' | 'textarea' | 'select';

const requiredMark = '<span class="req" aria-hidden="true">*</span>';

function inputField(
  name: string,
  label: string,
  kind: FieldKind = 'text',
  options: string[] = [],
  hint = '',
  span = false,
): string {
  const required = `required aria-required="true"`;
  const hintMarkup = hint ? `<span class="hint">${hint}</span>` : '';
  let control = '';
  if (kind === 'textarea') {
    control = `<textarea id="${name}" name="${name}" ${required} placeholder="Tulis ${label.toLowerCase()}"></textarea>`;
  } else if (kind === 'select') {
    control = `<select id="${name}" name="${name}" ${required} data-testid="select-${name}">
      <option value="">Pilih ${label.toLowerCase()}</option>
      ${options.map((option) => `<option value="${option}">${option}</option>`).join('')}
    </select>`;
  } else {
    const inputMode = ['number'].includes(kind) ? ' inputmode="numeric"' : '';
    const placeholder =
      kind === 'date' ? '' : ` placeholder="Tulis ${label.toLowerCase()}"`;
    control = `<input id="${name}" name="${name}" type="${kind}" ${required}${inputMode}${placeholder} data-testid="input-${name}" />`;
  }
  return `<div class="field${span ? ' span-2' : ''}" data-field="${name}">
    <label for="${name}">${label} ${requiredMark} ${hintMarkup}</label>
    ${control}
    <span class="error-message" aria-live="polite"></span>
  </div>`;
}

function section(index: string, title: string, description: string, content: string, id: string): string {
  return `<fieldset class="field-section" id="${id}" data-section="${index}">
    <div class="section-heading">
      <span class="section-index">${index}</span>
      <div><h3>${title}</h3><p>${description}</p></div>
    </div>
    <div class="field-grid">${content}</div>
  </fieldset>`;
}

function fileField(name: string, label: string, detail: string): string {
  return `<div class="upload-box" data-upload="${name}">
     <div class="upload-copy">
       <strong>${label} ${requiredMark}</strong>
      <span data-file-name="${name}">${detail}</span>
    </div>
    <div class="upload-action">
      <span class="choose-file">Pilih berkas</span>
       <input id="${name}" name="${name}" type="file" accept=".pdf,.jpg,.jpeg,.png" required aria-required="true" data-testid="input-file-${name}" />
    </div>
  </div>`;
}

const studentFields = [
  inputField('jenjang', 'Jenjang yang dituju', 'select', ['TK', 'SD', 'SMP', 'SMA']),
  inputField('nama_calon', 'Nama lengkap calon peserta didik'),
  inputField('nama_panggilan', 'Nama panggilan'),
  inputField('jenis_kelamin', 'Jenis kelamin', 'select', ['Laki-laki', 'Perempuan']),
  inputField('tempat_lahir', 'Tempat lahir'),
  inputField('tanggal_lahir', 'Tanggal lahir', 'date'),
  inputField('nisn', 'NISN', 'text', [], '10 digit bila sudah memiliki'),
  inputField('nik_anak', 'NIK anak'),
  inputField('alamat_domisili', 'Alamat domisili saat ini', 'textarea', [], '', true),
  inputField('anak_ke', 'Anak ke-', 'number'),
  inputField('jumlah_saudara', 'Jumlah saudara kandung', 'number'),
  inputField('status_anak', 'Status anak', 'select', ['Anak kandung', 'Anak tiri', 'Anak angkat']),
  inputField('agama', 'Agama', 'select', ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']),
  inputField('warga_negara', 'Kewarganegaraan'),
  inputField('tinggi_badan', 'Tinggi badan', 'number', [], 'dalam cm'),
  inputField('berat_badan', 'Berat badan', 'number', [], 'dalam kg'),
  inputField('riwayat_penyakit', 'Riwayat penyakit yang perlu diketahui', 'textarea', [], 'Tulis “Tidak ada” bila tidak memiliki riwayat', true),
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
  inputField('nama_wali', 'Nama lengkap wali'),
  inputField('hubungan_wali', 'Hubungan dengan calon peserta didik'),
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
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="/" data-testid="link-home">
        <span class="brand-mark" aria-hidden="true">S</span>
        <span class="brand-copy"><span class="brand-name">SPMB</span><span class="brand-sub">Penerimaan murid baru</span></span>
      </a>
      <div class="topbar-note"><span class="health-dot" id="health-dot" aria-hidden="true"></span><span id="health-status" data-testid="status-health">Memeriksa layanan</span></div>
    </header>

    <section class="hero" aria-labelledby="page-title">
      <div class="hero-inner">
        <div class="eyebrow">Tahun ajaran 2027 / 2028</div>
        <h1 id="page-title">Satu langkah kecil menuju <em>sekolah baru.</em></h1>
        <p class="hero-intro">Lengkapi data calon peserta didik dengan tenang. Kami menyimpan pengajuan Anda dengan aman untuk membantu proses penerimaan murid baru berjalan jelas dan tertata.</p>
        <div class="hero-meta"><span class="meta-pill">Pengajuan baru</span><span class="meta-pill">Waktu pengisian sekitar 10 menit</span></div>
      </div>
    </section>

    <main class="main-layout">
      <aside class="progress-panel" aria-label="Kemajuan formulir">
        <p class="progress-title">Kemajuan pengisian</p>
        <ol class="progress-list">
          <li><button class="progress-item is-active" type="button" data-go-section="section-student" data-testid="button-progress-student"><span class="progress-number">01</span><span class="progress-label">Calon peserta didik<small>Identitas utama</small></span></button></li>
          <li><button class="progress-item" type="button" data-go-section="section-school" data-testid="button-progress-school"><span class="progress-number">02</span><span class="progress-label">Sekolah asal<small>Riwayat pendidikan</small></span></button></li>
          <li><button class="progress-item" type="button" data-go-section="section-parent" data-testid="button-progress-parent"><span class="progress-number">03</span><span class="progress-label">Orang tua & wali<small>Kontak keluarga</small></span></button></li>
          <li><button class="progress-item" type="button" data-go-section="section-upload" data-testid="button-progress-upload"><span class="progress-number">04</span><span class="progress-label">Upload berkas<small>Dokumen pendukung</small></span></button></li>
        </ol>
      </aside>

      <section class="form-card" aria-label="Formulir pendaftaran SPMB">
        <div class="form-top">
          <div><h2>Formulir pengajuan</h2><p>Mohon isi sesuai dokumen resmi yang Anda miliki.</p></div>
          <div class="required-note"><b>*</b> Wajib diisi</div>
        </div>
        <div class="form-body" id="form-body">
          <div class="form-alert error" id="form-error" role="alert" data-testid="alert-form-error"></div>
          <form id="application-form" novalidate>
            ${section('01', 'Data Calon Peserta Didik', 'Ceritakan identitas dan keseharian calon peserta didik.', studentFields, 'section-student')}
            ${section('02', 'Data Sekolah Asal', 'Informasi pendidikan terakhir calon peserta didik.', schoolFields, 'section-school')}
            ${section('03', 'Data Orang Tua & Wali', 'Kontak keluarga untuk komunikasi proses penerimaan.', parentFields, 'section-parent')}
            <fieldset class="field-section" id="section-upload" data-section="04">
              <div class="section-heading"><span class="section-index">04</span><div><h3>Upload Berkas</h3><p>Siapkan dokumen yang terbaca jelas. Berkas dapat berupa PDF, JPG, atau PNG.</p></div></div>
              <div class="upload-grid">${uploadFields}</div>
            </fieldset>
            <div class="submit-area">
              <div class="consent-row">
                <input id="consent" name="consent" type="checkbox" required data-testid="input-consent" />
                <label for="consent">Saya memastikan data yang diisi <b>benar dan dapat dipertanggungjawabkan</b>.</label>
              </div>
              <div class="submit-row">
                <span class="submit-info">Periksa kembali data sebelum mengirim.<br />Pengajuan akan diproses oleh panitia SPMB.</span>
                <button class="submit-button" type="submit" id="submit-button" data-testid="button-submit-application">Kirim pengajuan</button>
              </div>
            </div>
          </form>
        </div>
        <div class="success-view" id="success-view" aria-live="polite" data-testid="status-submission-success">
          <div class="success-mark" aria-hidden="true">OK</div>
          <h2>Pengajuan sudah diterima.</h2>
          <p>Terima kasih. Data Anda telah masuk ke sistem SPMB. Simpan nomor pengajuan ini untuk referensi Anda.</p>
          <span class="success-id" id="submission-id"></span>
          <button class="reset-button" type="button" id="reset-button" data-testid="button-new-application">Buat pengajuan baru</button>
        </div>
      </section>
    </main>

    <footer class="footer"><p>SPMB 2027/2028 · Layanan pengajuan penerimaan murid baru</p><span class="footer-code">FORM / 01</span></footer>
  </div>
`;

const form = document.getElementById('application-form') as HTMLFormElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const errorAlert = document.getElementById('form-error') as HTMLDivElement;
const formBody = document.getElementById('form-body') as HTMLDivElement;
const successView = document.getElementById('success-view') as HTMLDivElement;
const submissionId = document.getElementById('submission-id') as HTMLSpanElement;
const resetButton = document.getElementById('reset-button') as HTMLButtonElement;
const healthStatus = document.getElementById('health-status') as HTMLSpanElement;
const healthDot = document.getElementById('health-dot') as HTMLSpanElement;

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
    errorAlert.textContent = 'Masih ada data yang perlu dilengkapi. Silakan ikuti penanda pada formulir.';
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
    if (sectionElement.offsetTop <= marker) activeIndex = index;
    const required = Array.from(sectionElement.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]'));
    const complete = required.length > 0 && required.every((control) =>
      control instanceof HTMLInputElement && control.type === 'checkbox'
        ? control.checked
        : Boolean(control.value.trim()),
    );
    const item = document.querySelector<HTMLElement>(`[data-go-section="${sectionElement.id}"]`);
    item?.classList.toggle('is-complete', complete && index < activeIndex);
  });
  document.querySelectorAll<HTMLElement>('.progress-item').forEach((item, index) => item.classList.toggle('is-active', index === activeIndex));
}

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
    if (label) label.textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Belum ada berkas dipilih';
    updateProgress();
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateForm()) return;
  submitButton.disabled = true;
  submitButton.classList.add('is-loading');
  submitButton.textContent = 'Mengirim pengajuan';
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
    formBody.classList.add('is-hidden');
    successView.classList.add('is-visible');
    const cardTop = document.querySelector('.form-card')?.getBoundingClientRect().top ?? 0;
    window.scrollTo({ top: cardTop + window.scrollY - 25, behavior: 'smooth' });
  } catch (error) {
    errorAlert.textContent = error instanceof Error ? error.message : 'Pengajuan belum dapat dikirim. Silakan coba lagi.';
    errorAlert.className = 'form-alert error is-visible';
    submitButton.disabled = false;
    submitButton.classList.remove('is-loading');
    submitButton.textContent = 'Kirim pengajuan';
  }
});

resetButton.addEventListener('click', () => {
  successView.classList.remove('is-visible');
  formBody.classList.remove('is-hidden');
  updateProgress();
  document.getElementById('section-student')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

healthCheck()
  .then((status) => {
    healthStatus.textContent = status.status === 'ok' ? 'Layanan siap menerima pengajuan' : 'Layanan sedang diperiksa';
  })
  .catch(() => {
    healthDot.style.backgroundColor = 'hsl(10 60% 54%)';
    healthStatus.textContent = 'Koneksi perlu diperiksa';
  });
}
