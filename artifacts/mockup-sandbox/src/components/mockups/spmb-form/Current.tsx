import "./_group.css";

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

function FieldControl({ field }: { field: Field }) {
  const placeholder = `Tulis ${field.label.toLowerCase()}`;

  return (
    <div className={`field${field.span ? " span-2" : ""}`}>
      <label htmlFor={field.name}>
        {field.label} <span className="req" aria-hidden="true">*</span>
        {field.hint && <span className="hint">{field.hint}</span>}
      </label>
      {field.kind === "textarea" ? (
        <textarea id={field.name} placeholder={placeholder} />
      ) : field.kind === "select" ? (
        <select id={field.name} defaultValue="">
          <option value="">Pilih {field.label.toLowerCase()}</option>
          {field.options?.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : (
        <input id={field.name} type={field.kind ?? "text"} placeholder={field.kind === "date" ? "" : placeholder} />
      )}
    </div>
  );
}

function Section({ index, title, description, fields }: { index: string; title: string; description: string; fields: Field[] }) {
  return (
    <fieldset className="field-section">
      <div className="section-heading">
        <span className="section-index">{index}</span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="field-grid">
        {fields.map((field) => <FieldControl key={field.name} field={field} />)}
      </div>
    </fieldset>
  );
}

export function Current() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#formulir" aria-label="SPMB">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span className="brand-copy">
            <span className="brand-name">SPMB</span>
            <span className="brand-sub">Penerimaan murid baru</span>
          </span>
        </a>
        <div className="topbar-note">
          <span className="health-dot" aria-hidden="true" />
          <span>Layanan siap menerima pengajuan</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-inner">
          <div className="eyebrow">Tahun ajaran 2027 / 2028</div>
          <h1 id="page-title">Satu langkah kecil menuju <em>sekolah baru.</em></h1>
          <p className="hero-intro">
            Lengkapi data calon peserta didik dengan tenang. Kami menyimpan pengajuan Anda dengan aman untuk membantu proses penerimaan murid baru berjalan jelas dan tertata.
          </p>
          <div className="hero-meta">
            <span className="meta-pill">Pengajuan baru</span>
            <span className="meta-pill">Waktu pengisian sekitar 10 menit</span>
          </div>
        </div>
      </section>

      <main className="main-layout" id="formulir">
        <aside className="progress-panel" aria-label="Kemajuan formulir">
          <p className="progress-title">Kemajuan pengisian</p>
          <ol className="progress-list">
            {[
              ["01", "Calon peserta didik", "Identitas utama"],
              ["02", "Sekolah asal", "Riwayat pendidikan"],
              ["03", "Orang tua & wali", "Kontak keluarga"],
              ["04", "Upload berkas", "Dokumen pendukung"],
            ].map(([number, title, subtitle], index) => (
              <li key={number}>
                <button className={`progress-item${index === 0 ? " is-active" : ""}`} type="button">
                  <span className="progress-number">{number}</span>
                  <span className="progress-label">{title}<small>{subtitle}</small></span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className="form-card" aria-label="Formulir pendaftaran SPMB">
          <div className="form-top">
            <div>
              <h2>Formulir pengajuan</h2>
              <p>Mohon isi sesuai dokumen resmi yang Anda miliki.</p>
            </div>
            <div className="required-note"><b>*</b> Wajib diisi</div>
          </div>

          <form>
            <Section index="01" title="Data Calon Peserta Didik" description="Ceritakan identitas dan keseharian calon peserta didik." fields={studentFields} />
            <Section index="02" title="Data Sekolah Asal" description="Informasi pendidikan terakhir calon peserta didik." fields={schoolFields} />
            <Section index="03" title="Data Orang Tua & Wali" description="Kontak keluarga untuk komunikasi proses penerimaan." fields={parentFields} />

            <fieldset className="field-section">
              <div className="section-heading">
                <span className="section-index">04</span>
                <div>
                  <h3>Upload Berkas</h3>
                  <p>Siapkan dokumen yang terbaca jelas. Berkas dapat berupa PDF, JPG, atau PNG.</p>
                </div>
              </div>
              <div className="upload-grid">
                {uploads.map(([name, label]) => (
                  <div className="upload-box" key={name}>
                    <div className="upload-copy">
                      <strong>{label} <span className="req" aria-hidden="true">*</span></strong>
                      <span>Belum ada berkas dipilih</span>
                    </div>
                    <div className="upload-action">
                      <span className="choose-file">Pilih berkas</span>
                      <input id={name} name={name} type="file" accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="submit-area">
              <div className="consent-row">
                <input id="consent" type="checkbox" />
                <label htmlFor="consent">Saya memastikan data yang diisi <b>benar dan dapat dipertanggungjawabkan</b>.</label>
              </div>
              <div className="submit-row">
                <span className="submit-info">Periksa kembali data sebelum mengirim.<br />Pengajuan akan diproses oleh panitia SPMB.</span>
                <button className="submit-button" type="button">Kirim pengajuan</button>
              </div>
            </div>
          </form>
        </section>
      </main>

      <footer className="footer">
        <p>SPMB 2027/2028 · Layanan pengajuan penerimaan murid baru</p>
        <span className="footer-code">FORM / 01</span>
      </footer>
    </div>
  );
}