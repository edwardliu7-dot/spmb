import { useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  FileText,
  FolderOpen,
  Info,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Upload,
} from "lucide-react";

import "./_group.css";
import "./Current.css";

type Field = {
  name: string;
  label: string;
  kind?: "text" | "email" | "date" | "number" | "textarea" | "select";
  hint?: string;
  options?: string[];
  span?: boolean;
};

const studentFields: Field[] = [
  { name: "jenjang", label: "Jenjang yang dituju", kind: "select", options: ["Playgroup", "Daycare", "TK-A", "TK-B", "SD", "SMP"] },
  { name: "nama_calon", label: "Nama lengkap calon peserta didik" },
  { name: "nama_panggilan", label: "Nama panggilan" },
  { name: "jenis_kelamin", label: "Jenis kelamin", kind: "select", options: ["Laki-laki", "Perempuan"] },
  { name: "tempat_lahir", label: "Tempat lahir" },
  { name: "tanggal_lahir", label: "Tanggal lahir", kind: "date" },
  { name: "nisn", label: "NISN", hint: "10 digit bila sudah memiliki" },
  { name: "nik_anak", label: "NIK anak" },
  { name: "alamat_domisili", label: "Alamat domisili saat ini", kind: "textarea", span: true },
  { name: "anak_ke", label: "Anak ke-", kind: "number" },
  { name: "jumlah_saudara", label: "Jumlah saudara kandung", kind: "number" },
  { name: "status_anak", label: "Status anak", kind: "select", options: ["Anak kandung", "Anak tiri", "Anak angkat"] },
  { name: "agama", label: "Agama", kind: "select", options: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"] },
  { name: "warga_negara", label: "Kewarganegaraan" },
  { name: "tinggi_badan", label: "Tinggi badan", kind: "number", hint: "dalam cm" },
  { name: "berat_badan", label: "Berat badan", kind: "number", hint: "dalam kg" },
  { name: "riwayat_penyakit", label: "Riwayat penyakit yang perlu diketahui", kind: "textarea", hint: "Tulis “Tidak ada” bila tidak memiliki riwayat", span: true },
  { name: "transportasi", label: "Transportasi ke sekolah", kind: "select", options: ["Jalan kaki", "Kendaraan pribadi", "Kendaraan umum", "Antar-jemput"] },
  { name: "jarak_sekolah", label: "Perkiraan jarak ke sekolah", hint: "Contoh: 2 km" },
];

const schoolFields: Field[] = [
  { name: "nama_sekolah_asal", label: "Nama sekolah asal" },
  { name: "tahun_lulus", label: "Tahun lulus", kind: "number" },
  { name: "alamat_sekolah_asal", label: "Alamat sekolah asal", kind: "textarea", span: true },
];

const parentFields: Field[] = [
  { name: "nomor_kk", label: "Nomor Kartu Keluarga" },
  { name: "nik_orangtua", label: "NIK orang tua" },
  { name: "nomor_hp_orangtua", label: "Nomor HP orang tua", hint: "Nomor yang aktif menerima informasi" },
  { name: "email", label: "Email orang tua", kind: "email" },
  { name: "nama_ayah", label: "Nama lengkap ayah" },
  { name: "ttl_ayah", label: "Tempat, tanggal lahir ayah" },
  { name: "pendidikan_ayah", label: "Pendidikan terakhir ayah" },
  { name: "pekerjaan_ayah", label: "Pekerjaan ayah" },
  { name: "penghasilan_ayah", label: "Penghasilan per bulan ayah" },
  { name: "instansi_jabatan_ayah", label: "Instansi atau jabatan ayah" },
  { name: "nama_ibu", label: "Nama lengkap ibu" },
  { name: "ttl_ibu", label: "Tempat, tanggal lahir ibu" },
  { name: "pendidikan_ibu", label: "Pendidikan terakhir ibu" },
  { name: "pekerjaan_ibu", label: "Pekerjaan ibu" },
  { name: "penghasilan_ibu", label: "Penghasilan per bulan ibu" },
  { name: "instansi_jabatan_ibu", label: "Instansi atau jabatan ibu" },
  { name: "nama_wali", label: "Nama lengkap wali" },
  { name: "hubungan_wali", label: "Hubungan dengan calon peserta didik" },
];

const uploads = [
  ["foto_3x4", "Pas foto 3×4"],
  ["akte_lahir", "Akta kelahiran"],
  ["kartu_keluarga", "Kartu Keluarga"],
  ["ktp_orangtua", "KTP orang tua"],
  ["bukti_bayar", "Bukti pembayaran"],
];

const steps = [
  ["01", "Calon peserta didik", "Identitas utama"],
  ["02", "Sekolah asal", "Riwayat pendidikan"],
  ["03", "Orang tua & wali", "Kontak keluarga"],
  ["04", "Upload berkas", "Dokumen pendukung"],
];

function FieldControl({ field }: { field: Field }) {
  const placeholder = `Tulis ${field.label.toLowerCase()}`;

  return (
    <div className={`form-board-field${field.span ? " form-board-field-span" : ""}`}>
      <label htmlFor={field.name}>
        {field.label}
        <span className="form-board-required" aria-hidden="true">*</span>
        {field.hint && <span className="form-board-hint">{field.hint}</span>}
      </label>
      {field.kind === "textarea" ? (
        <textarea id={field.name} placeholder={placeholder} />
      ) : field.kind === "select" ? (
        <span className="form-board-select-wrap">
          <select id={field.name} defaultValue="">
            <option value="">Pilih {field.label.toLowerCase()}</option>
            {field.options?.map((option) => <option key={option}>{option}</option>)}
          </select>
          <ChevronDown aria-hidden="true" />
        </span>
      ) : (
        <input id={field.name} type={field.kind ?? "text"} placeholder={field.kind === "date" ? "" : placeholder} />
      )}
    </div>
  );
}

function Section({
  id,
  index,
  title,
  description,
  fields,
  active,
  onActivate,
}: {
  id: string;
  index: string;
  title: string;
  description: string;
  fields: Field[];
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <fieldset id={id} className={`form-board-section${active ? " form-board-section-active" : ""}`} onFocus={onActivate}>
      <div className="form-board-section-heading">
        <span className="form-board-section-index">{index}</span>
        <div className="form-board-section-copy">
          <div className="form-board-section-kicker">
            <span>{active ? "Sedang diisi" : "Tahap berikutnya"}</span>
            <span className="form-board-section-rule" />
          </div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span className="form-board-section-check" aria-label={active ? "Tahap aktif" : "Belum diisi"}>
          {active ? <span className="form-board-section-dot" /> : <span />}
        </span>
      </div>
      <div className="form-board-field-grid">
        {fields.map((field) => <FieldControl key={field.name} field={field} />)}
      </div>
    </fieldset>
  );
}

export function Current() {
  const [activeStep, setActiveStep] = useState("01");
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const goToStep = (step: string) => {
    setActiveStep(step);
    document.getElementById(`form-board-step-${step}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  return (
    <div className="form-board-shell">
      <header className="form-board-topbar">
        <div className="form-board-topbar-inner">
          <div className="form-board-brand-group">
            <button type="button" className="form-board-menu-button" aria-label="Buka navigasi" onClick={() => setMobileMenu((open) => !open)}>
              <Menu aria-hidden="true" />
            </button>
            <a className="form-board-brand" href="#form-board-content" aria-label="SPMB">
              <span className="form-board-brand-mark">S</span>
              <span>
                <strong>SPMB</strong>
                <small>Penerimaan murid baru</small>
              </span>
            </a>
          </div>
          <nav className={`form-board-nav${mobileMenu ? " form-board-nav-open" : ""}`} aria-label="Navigasi pendaftaran">
            <button type="button" className="form-board-nav-active" onClick={() => showNotice("Anda sedang berada di formulir pendaftaran.")}>Pendaftaran</button>
            <button type="button" onClick={() => showNotice("Status pengajuan dapat dicek setelah formulir dikirim.")}>Status pengajuan</button>
            <button type="button" onClick={() => showNotice("Panduan pendaftaran akan membantu Anda menyiapkan dokumen.")}>Panduan</button>
          </nav>
          <div className="form-board-topbar-actions">
            <button type="button" className="form-board-icon-button" aria-label="Notifikasi" onClick={() => showNotice("Tidak ada notifikasi baru.")}>
              <Bell aria-hidden="true" />
              <span />
            </button>
            <span className="form-board-service-status"><i />Layanan siap</span>
          </div>
        </div>
      </header>

      <main id="form-board-content" className="form-board-main">
        <div className="form-board-intro">
          <div className="form-board-intro-copy">
            <div className="form-board-eyebrow"><span />Ruang pendaftaran · tahun ajaran 2027 / 2028</div>
            <h1>Mulai dari data yang <em>paling penting.</em></h1>
            <p>Isi pengajuan dengan tenang. Setiap bagian tersusun sebagai catatan yang jelas untuk membantu panitia meninjau data calon peserta didik.</p>
          </div>
          <div className="form-board-date">
            <div className="form-board-date-mark"><CalendarDays aria-hidden="true" /><span>BARU</span></div>
            <div><strong>Pengajuan baru</strong><small>Disiapkan untuk Anda</small></div>
          </div>
        </div>

        <section className="form-board-stats" aria-label="Ringkasan formulir">
          <div className="form-board-stat">
            <div><span>TAHAP PENGISIAN</span><ClipboardCheck aria-hidden="true" /></div>
            <strong>04</strong>
            <small>identitas, sekolah, keluarga, berkas</small>
          </div>
          <div className="form-board-stat">
            <div><span>WAKTU PENGISIAN</span><FileCheck2 aria-hidden="true" /></div>
            <strong>10<span className="form-board-stat-unit">mnt</span></strong>
            <small>siapkan dokumen resmi di dekat Anda</small>
          </div>
          <div className="form-board-stat">
            <div><span>DOKUMEN PENDUKUNG</span><FolderOpen aria-hidden="true" /></div>
            <strong>05</strong>
            <small>PDF, JPG, atau PNG · maksimal 5 MB</small>
          </div>
        </section>

        <div className="form-board-workspace">
          <aside className="form-board-sidebar">
            <div className="form-board-sidebar-head">
              <div>
                <div className="form-board-panel-kicker"><FileText aria-hidden="true" />Alur pengajuan</div>
                <h2>Lengkapi satu<br /><em>per satu.</em></h2>
              </div>
              <span className="form-board-progress-count">01<span>/04</span></span>
            </div>
            <ol className="form-board-step-list">
              {steps.map(([number, title, subtitle], index) => (
                <li key={number}>
                  <button type="button" className={`form-board-step${activeStep === number ? " form-board-step-active" : ""}${index === 0 && activeStep !== "01" ? " form-board-step-complete" : ""}`} onClick={() => goToStep(number)}>
                    <span className="form-board-step-number">{index === 0 && activeStep !== "01" ? <Check aria-hidden="true" /> : number}</span>
                    <span><strong>{title}</strong><small>{subtitle}</small></span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="form-board-sidebar-note">
              <LockKeyhole aria-hidden="true" />
              <div><strong>Data tersimpan aman</strong><p>Informasi Anda hanya digunakan untuk proses penerimaan murid baru.</p></div>
            </div>
            <div className="form-board-sidebar-help">
              <Info aria-hidden="true" />
              <span>Wajib diisi ditandai dengan <b>*</b></span>
            </div>
          </aside>

          <section className="form-board-form-panel" aria-label="Formulir pendaftaran SPMB">
            <div className="form-board-form-header">
              <div>
                <div className="form-board-panel-kicker"><FileCheck2 aria-hidden="true" />Formulir pengajuan</div>
                <h2>Data calon peserta didik</h2>
                <p>Mohon isi sesuai dokumen resmi yang Anda miliki.</p>
              </div>
              <span className="form-board-draft-badge"><i />Draft baru</span>
            </div>

            <form onSubmit={(event) => event.preventDefault()}>
              <Section id="form-board-step-01" index="01" title="Data Calon Peserta Didik" description="Ceritakan identitas dan keseharian calon peserta didik." fields={studentFields} active={activeStep === "01"} onActivate={() => setActiveStep("01")} />
              <Section id="form-board-step-02" index="02" title="Data Sekolah Asal" description="Informasi pendidikan terakhir calon peserta didik." fields={schoolFields} active={activeStep === "02"} onActivate={() => setActiveStep("02")} />
              <Section id="form-board-step-03" index="03" title="Data Orang Tua & Wali" description="Kontak keluarga untuk komunikasi proses penerimaan." fields={parentFields} active={activeStep === "03"} onActivate={() => setActiveStep("03")} />

              <fieldset id="form-board-step-04" className={`form-board-section${activeStep === "04" ? " form-board-section-active" : ""}`} onFocus={() => setActiveStep("04")}>
                <div className="form-board-section-heading">
                  <span className="form-board-section-index">04</span>
                  <div className="form-board-section-copy">
                    <div className="form-board-section-kicker"><span>{activeStep === "04" ? "Sedang diisi" : "Tahap berikutnya"}</span><span className="form-board-section-rule" /></div>
                    <h3>Upload Berkas</h3>
                    <p>Siapkan dokumen yang terbaca jelas. Berkas dapat berupa PDF, JPG, atau PNG.</p>
                  </div>
                  <span className="form-board-section-check"><span className={activeStep === "04" ? "form-board-section-dot" : ""} /></span>
                </div>
                <div className="form-board-upload-grid">
                  {uploads.map(([name, label]) => (
                    <div className="form-board-upload" key={name}>
                      <div className="form-board-upload-icon"><Upload aria-hidden="true" /></div>
                      <div className="form-board-upload-copy"><strong>{label} <span className="form-board-required">*</span></strong><small>{fileNames[name] ?? "Belum ada berkas dipilih"}</small></div>
                      <label className="form-board-upload-button" htmlFor={name}>Pilih berkas<input id={name} name={name} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setFileNames((current) => ({ ...current, [name]: `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` })); showNotice(`${label} berhasil dipilih.`); } }} /></label>
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="form-board-submit-area">
                <label className="form-board-consent"><input type="checkbox" /><span>Saya memastikan data yang diisi <b>benar dan dapat dipertanggungjawabkan</b>.</span></label>
                <div className="form-board-submit-row">
                  <div className="form-board-submit-info"><ShieldCheck aria-hidden="true" /><span>Periksa kembali data sebelum mengirim.<small>Pengajuan akan diproses oleh panitia SPMB.</small></span></div>
                  <button className="form-board-submit-button" type="submit" onClick={() => showNotice("Formulir siap dikirim setelah semua bagian lengkap.")}>Kirim pengajuan <Check aria-hidden="true" /></button>
                </div>
              </div>
            </form>
          </section>
        </div>

        <footer className="form-board-footer">
          <span>SPMB 2027/2028 · Ruang pendaftaran</span>
          <span><LockKeyhole aria-hidden="true" /> Data pendaftar tersimpan aman</span>
        </footer>
      </main>

      {notice && <div className="form-board-notice" role="status"><Check aria-hidden="true" /><span>{notice}</span></div>}
    </div>
  );
}