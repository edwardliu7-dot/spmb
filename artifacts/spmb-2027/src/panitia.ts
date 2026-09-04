type ApplicationListItem = {
  id: number;
  nama_calon: string;
  jenjang: string;
  nama_sekolah_asal: string;
  status: string;
  created_at: string;
};

type ApplicationFile = {
  field: string;
  label: string;
  url: string;
  available: boolean;
};

type ApplicationDetail = ApplicationListItem & Record<string, unknown> & {
  files: ApplicationFile[];
};

type AuthUser = {
  username: string;
  label: string;
  allowedJenjang: string[];
};

const statuses = ["Baru", "Diverifikasi", "Perlu Perbaikan", "Diterima", "Ditolak"];
const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Elemen root tidak ditemukan.");
const root = rootElement;

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: unknown): string {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function applicationNumber(id: number): string {
  return `SPMB-${String(id).padStart(6, "0")}`;
}

function statusClass(status: string): string {
  return status.toLowerCase().replaceAll(" ", "-");
}

async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Permintaan belum dapat diproses.");
  return payload;
}

function renderLogin(errorMessage = "") {
  root.innerHTML = `
    <div class="committee-auth-shell">
      <header class="committee-topbar">
        <a class="brand" href="/" aria-label="Kembali ke formulir SPMB">
          <span class="brand-mark" aria-hidden="true">S</span>
          <span class="brand-copy"><span class="brand-name">SPMB</span><span class="brand-sub">Ruang kerja panitia</span></span>
        </a>
        <a class="back-link" href="/">Kembali ke formulir</a>
      </header>
      <main class="committee-auth-main">
        <div class="committee-auth-ornament" aria-hidden="true"><span>SPMB</span><small>2027 / 2028</small></div>
        <section class="committee-auth-card">
          <p class="eyebrow">Akses internal · panitia</p>
          <h1>Selamat datang <em>kembali.</em></h1>
          <p class="auth-lede">Masuk untuk meninjau dan mengelola data pendaftar sesuai tanggung jawab jenjang Anda.</p>
          <form id="committee-login-form" class="committee-login-form">
            <label for="committee-username">Username</label>
            <input id="committee-username" name="username" type="text" autocomplete="username" placeholder="Masukkan username" required />
            <label for="committee-password">Password</label>
            <input id="committee-password" name="password" type="password" autocomplete="current-password" placeholder="Masukkan password" required />
            ${errorMessage ? `<p class="auth-error" role="alert">${escapeHtml(errorMessage)}</p>` : ""}
            <button type="submit" class="auth-submit">Masuk ke panel <span aria-hidden="true">→</span></button>
          </form>
          <p class="auth-note">Gunakan akun panitia yang telah diberikan oleh administrator.</p>
        </section>
      </main>
      <footer class="footer committee-footer"><p>SPMB 2027/2028 · Panel panitia</p><span class="footer-code">INTERNAL / 01</span></footer>
    </div>
  `;

  const form = document.getElementById("committee-login-form") as HTMLFormElement;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (button) {
      button.disabled = true;
      button.innerHTML = "Memeriksa…";
    }
    try {
      const result = await requestJSON<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      renderDashboard(result.user);
    } catch (error) {
      renderLogin(error instanceof Error ? error.message : "Login belum berhasil.");
    }
  });
}

function field(label: string, value: unknown, className = "") {
  return `<div class="detail-field ${className}"><dt>${label}</dt><dd>${escapeHtml(value || "—")}</dd></div>`;
}

function renderLegacyDashboard(user: AuthUser) {
  const allowedLevels = user.allowedJenjang;
  root.innerHTML = `
  <div class="committee-shell">
    <header class="committee-topbar">
      <a class="brand" href="/" aria-label="Kembali ke formulir SPMB">
        <span class="brand-mark" aria-hidden="true">S</span>
        <span class="brand-copy"><span class="brand-name">SPMB</span><span class="brand-sub">Ruang kerja panitia</span></span>
      </a>
      <div class="committee-topbar-actions">
        <span class="committee-user"><strong>${escapeHtml(user.username)}</strong><small>${escapeHtml(user.label)}</small></span>
        <button class="logout-button" id="logout-button" type="button">Keluar</button>
        <a class="back-link" href="/">Kembali ke formulir</a>
      </div>
    </header>

    <main class="committee-main">
      <section class="committee-intro">
        <div>
          <p class="eyebrow">Panel pengelolaan · 2027 / 2028</p>
          <h1>Ruang kerja <em>panitia.</em></h1>
          <p class="committee-lede">Tinjau pengajuan yang masuk, periksa dokumen pendukung, dan catat perkembangan setiap calon peserta didik dari satu tempat.</p>
        </div>
        <div class="committee-intro-mark" aria-hidden="true"><span>SPMB</span><small>Internal</small></div>
      </section>

      <section class="committee-stats" aria-label="Ringkasan pendaftaran">
        <div class="committee-stat"><span>Total pengajuan</span><strong id="total-count">—</strong><small>Semua jenjang</small></div>
        <div class="committee-stat"><span>Menunggu tinjauan</span><strong id="new-count">—</strong><small>Status baru</small></div>
        <div class="committee-stat"><span>Diterima</span><strong id="accepted-count">—</strong><small>Siap ditindaklanjuti</small></div>
      </section>

      <section class="committee-workspace">
        <div class="committee-list-panel">
          <div class="list-panel-heading">
            <div><p class="eyebrow">Pengajuan masuk</p><h2>Daftar pendaftar</h2></div>
            <span class="list-count" id="list-count">—</span>
          </div>
          <form class="committee-toolbar" id="committee-filter-form">
            <label class="search-field">
              <span class="sr-only">Cari nama atau nomor pengajuan</span>
              <span class="search-icon" aria-hidden="true">⌕</span>
              <input id="search-input" type="search" placeholder="Cari nama atau nomor pengajuan" autocomplete="off" />
            </label>
            <label class="filter-field">
              <span class="sr-only">Filter jenjang</span>
              <select id="level-filter">
                <option value="Semua">Semua jenjang</option>
                ${allowedLevels.map((level) => `<option value="${escapeHtml(level)}">${escapeHtml(level)}</option>`).join("")}
              </select>
            </label>
            <label class="filter-field">
              <span class="sr-only">Filter status</span>
              <select id="status-filter">
                <option value="Semua">Semua status</option>
                ${statuses.map((status) => `<option value="${status}">${status}</option>`).join("")}
              </select>
            </label>
            <button class="refresh-button" type="submit">Terapkan</button>
          </form>
          <div class="committee-list" id="application-list" aria-live="polite" aria-busy="false"></div>
        </div>

        <aside class="committee-detail-panel" id="detail-panel" aria-live="polite">
          <div class="detail-empty">
            <span class="detail-empty-mark" aria-hidden="true">01</span>
            <h2>Pilih satu pengajuan</h2>
            <p>Detail calon peserta didik dan dokumen pendukung akan muncul di sini setelah Anda memilih dari daftar.</p>
          </div>
        </aside>
      </section>
    </main>
    <footer class="footer committee-footer"><p>SPMB 2027/2028 · Panel panitia</p><span class="footer-code">INTERNAL / 01</span></footer>
  </div>
`;

const listElement = document.getElementById("application-list") as HTMLDivElement;
const detailElement = document.getElementById("detail-panel") as HTMLElement;
const filterForm = document.getElementById("committee-filter-form") as HTMLFormElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const levelFilter = document.getElementById("level-filter") as HTMLSelectElement;
const statusFilter = document.getElementById("status-filter") as HTMLSelectElement;

function setListMessage(message: string, variant = "") {
  listElement.innerHTML = `<div class="list-message ${variant}"><span aria-hidden="true">—</span><p>${escapeHtml(message)}</p></div>`;
}

function renderStats(items: ApplicationListItem[], total: number) {
  const totalElement = document.getElementById("total-count");
  const newElement = document.getElementById("new-count");
  const acceptedElement = document.getElementById("accepted-count");
  if (totalElement) totalElement.textContent = String(total);
  if (newElement) newElement.textContent = String(items.filter((item) => item.status === "Baru").length);
  if (acceptedElement) acceptedElement.textContent = String(items.filter((item) => item.status === "Diterima").length);
}

function renderList(items: ApplicationListItem[], total: number) {
  renderStats(items, total);
  const countElement = document.getElementById("list-count");
  if (countElement) countElement.textContent = `${total} pengajuan`;
  if (!items.length) {
    setListMessage("Belum ada pengajuan yang sesuai dengan pencarian.", "is-empty");
    return;
  }

  listElement.innerHTML = items.map((item) => `
    <button class="application-row" type="button" data-application-id="${item.id}">
      <span class="application-avatar">${escapeHtml(item.nama_calon.slice(0, 1).toUpperCase())}</span>
      <span class="application-row-main">
        <strong>${escapeHtml(item.nama_calon)}</strong>
        <small>${escapeHtml(applicationNumber(item.id))} · ${escapeHtml(item.jenjang)} · ${escapeHtml(item.nama_sekolah_asal)}</small>
      </span>
      <span class="application-row-side">
        <span class="status-badge status-${escapeHtml(statusClass(item.status))}">${escapeHtml(item.status)}</span>
        <small>${escapeHtml(formatDate(item.created_at))}</small>
      </span>
      <span class="row-chevron" aria-hidden="true">→</span>
    </button>
  `).join("");

  listElement.querySelectorAll<HTMLButtonElement>("[data-application-id]").forEach((row) => {
    row.addEventListener("click", () => loadDetail(Number(row.dataset.applicationId)));
  });
}

async function loadList() {
  listElement.setAttribute("aria-busy", "true");
  setListMessage("Memuat pengajuan…");
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (levelFilter.value !== "Semua") params.set("jenjang", levelFilter.value);
  if (statusFilter.value !== "Semua") params.set("status", statusFilter.value);
  try {
    const result = await requestJSON<{ items: ApplicationListItem[]; total: number }>(`/api/applications?${params.toString()}`);
    renderList(result.items, result.total);
  } catch (error) {
    setListMessage(error instanceof Error ? error.message : "Daftar belum dapat dimuat.", "is-error");
  } finally {
    listElement.setAttribute("aria-busy", "false");
  }
}

function renderDetail(application: ApplicationDetail) {
  const documents = application.files.map((file) => file.available
    ? `<a class="document-link" href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer"><span>${escapeHtml(file.label)}</span><small>Buka berkas →</small></a>`
    : `<div class="document-link is-unavailable"><span>${escapeHtml(file.label)}</span><small>Belum tersedia</small></div>`).join("");

  detailElement.innerHTML = `
    <div class="detail-scroll">
      <div class="detail-heading">
        <div><p class="eyebrow">Detail pengajuan</p><h2>${escapeHtml(application.nama_calon)}</h2><span class="detail-number">${escapeHtml(applicationNumber(application.id))} · Dikirim ${escapeHtml(formatDate(application.created_at))}</span></div>
        <span class="status-badge status-${escapeHtml(statusClass(application.status))}">${escapeHtml(application.status)}</span>
      </div>
      <div class="status-editor">
        <label for="application-status">Perbarui status</label>
        <select id="application-status">
          ${statuses.map((status) => `<option value="${status}" ${status === application.status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
        <span class="status-feedback" id="status-feedback" aria-live="polite"></span>
      </div>
      <section class="detail-section"><h3>Calon peserta didik</h3><dl class="detail-grid">
        ${field("Nama lengkap", application.nama_calon)}${field("Nama panggilan", application.nama_panggilan)}${field("Jenjang", application.jenjang)}${field("Jenis kelamin", application.jenis_kelamin)}${field("Tempat, tanggal lahir", `${application.tempat_lahir || "—"}, ${application.tanggal_lahir || "—"}`)}${field("NISN", application.nisn)}${field("NIK anak", application.nik_anak)}${field("Alamat domisili", application.alamat_domisili, "span-2")}${field("Anak ke-", application.anak_ke)}${field("Jumlah saudara", application.jumlah_saudara)}${field("Status anak", application.status_anak)}${field("Agama", application.agama)}${field("Kewarganegaraan", application.warga_negara)}${field("Tinggi / berat", `${application.tinggi_badan || "—"} cm / ${application.berat_badan || "—"} kg`)}${field("Transportasi", application.transportasi)}${field("Jarak ke sekolah", application.jarak_sekolah)}${field("Riwayat penyakit", application.riwayat_penyakit, "span-2")}
      </dl></section>
      <section class="detail-section"><h3>Sekolah asal</h3><dl class="detail-grid">${field("Nama sekolah", application.nama_sekolah_asal, "span-2")}${field("Tahun lulus", application.tahun_lulus)}${field("Alamat sekolah", application.alamat_sekolah_asal, "span-2")}</dl></section>
      <section class="detail-section"><h3>Orang tua & wali</h3><dl class="detail-grid">${field("Nomor Kartu Keluarga", application.nomor_kk)}${field("NIK orang tua", application.nik_orangtua)}${field("Nomor HP / WA", application.nomor_hp_orangtua)}${field("Email", application.email)}${field("Nama ayah", application.nama_ayah)}${field("TTL ayah", application.ttl_ayah)}${field("Pendidikan ayah", application.pendidikan_ayah)}${field("Pekerjaan ayah", application.pekerjaan_ayah)}${field("Penghasilan ayah", application.penghasilan_ayah)}${field("Instansi / jabatan ayah", application.instansi_jabatan_ayah)}${field("Nama ibu", application.nama_ibu)}${field("TTL ibu", application.ttl_ibu)}${field("Pendidikan ibu", application.pendidikan_ibu)}${field("Pekerjaan ibu", application.pekerjaan_ibu)}${field("Penghasilan ibu", application.penghasilan_ibu)}${field("Instansi / jabatan ibu", application.instansi_jabatan_ibu)}${field("Nama wali", application.nama_wali)}${field("Hubungan wali", application.hubungan_wali)}</dl></section>
      <section class="detail-section"><h3>Dokumen pendukung</h3><div class="document-list">${documents}</div></section>
    </div>
  `;

  document.getElementById("application-status")?.addEventListener("change", async (event) => {
    const select = event.currentTarget as HTMLSelectElement;
    const feedback = document.getElementById("status-feedback");
    select.disabled = true;
    if (feedback) feedback.textContent = "Menyimpan…";
    try {
      const result = await requestJSON<{ status: string }>(`/api/applications/${application.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: select.value }),
      });
      application.status = result.status;
      if (feedback) {
        feedback.textContent = "Tersimpan";
        feedback.className = "status-feedback is-success";
      }
      await loadList();
    } catch (error) {
      select.value = application.status;
      if (feedback) {
        feedback.textContent = error instanceof Error ? error.message : "Belum tersimpan";
        feedback.className = "status-feedback is-error";
      }
    } finally {
      select.disabled = false;
    }
  });
}

async function loadDetail(id: number) {
  detailElement.innerHTML = `<div class="detail-loading"><span class="loading-line"></span><span class="loading-line short"></span><span class="loading-line"></span><p>Memuat detail pengajuan…</p></div>`;
  try {
    const result = await requestJSON<ApplicationDetail>(`/api/applications/${id}`);
    renderDetail(result);
    detailElement.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    detailElement.innerHTML = `<div class="detail-empty is-error"><span class="detail-empty-mark" aria-hidden="true">!</span><h2>Detail belum tersedia</h2><p>${escapeHtml(error instanceof Error ? error.message : "Detail belum dapat dimuat.")}</p></div>`;
  }
}

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void loadList();
});

document.getElementById("logout-button")?.addEventListener("click", async () => {
  await requestJSON("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  renderLogin();
});

void loadList();
}

function renderDashboard(user: AuthUser) {
  const allowedLevels = user.allowedJenjang;
  let selectedId: number | null = null;
  let selectedApplication: ApplicationDetail | null = null;
  let noticeTimer: number | undefined;

  root.innerHTML = `
    <div class="decision-desk-shell">
      <aside class="decision-rail" id="decision-rail">
        <div class="decision-rail-brand">
          <a class="decision-brand" href="/" aria-label="Kembali ke formulir SPMB">
            <span class="decision-brand-mark" aria-hidden="true">S</span>
            <span><span class="decision-brand-name">SPMB</span><span class="decision-brand-sub">Decision desk</span></span>
          </a>
          <button class="rail-close-button" id="rail-close-button" type="button" aria-label="Tutup navigasi">×</button>
        </div>
        <div class="decision-rail-section">
          <p class="decision-rail-label">Workspace</p>
          <nav class="decision-nav" aria-label="Navigasi panel panitia">
            <button class="decision-nav-item is-active" type="button" data-nav-message="Ruang keputusan sedang aktif."><span aria-hidden="true">▦</span>Ruang keputusan<i></i></button>
            <button class="decision-nav-item" type="button" data-nav-message="Agenda rapat akan tersedia setelah sinkronisasi."><span aria-hidden="true">◷</span>Agenda rapat</button>
            <button class="decision-nav-item" type="button" data-nav-message="Arsip pengajuan akan tersedia setelah sinkronisasi."><span aria-hidden="true">▤</span>Arsip pengajuan</button>
          </nav>
        </div>
        <div class="decision-rail-bottom">
          <div class="decision-profile">
            <span class="decision-profile-avatar">${escapeHtml(user.username.slice(0, 2).toUpperCase())}</span>
            <span><strong>${escapeHtml(user.label)}</strong><small>${escapeHtml(user.username)} · panitia</small></span>
          </div>
          <button class="decision-help-button" type="button" data-nav-message="Pusat panduan verifikasi dibuka."><span aria-hidden="true">?</span> Butuh bantuan?</button>
        </div>
      </aside>
      <button class="rail-scrim" id="rail-scrim" type="button" aria-label="Tutup menu"></button>

      <main class="decision-main">
        <header class="decision-header">
          <div class="decision-header-left">
            <button class="rail-menu-button" id="rail-menu-button" type="button" aria-label="Buka navigasi">☰</button>
            <div><p class="decision-kicker">Panitia / Workspace</p><p class="decision-header-title">Ruang keputusan</p></div>
          </div>
          <div class="decision-header-actions">
            <span class="decision-date">PANEL INTERNAL · 2027 / 2028</span>
            <button class="decision-icon-button" type="button" aria-label="Notifikasi" data-nav-message="Tidak ada notifikasi baru.">◌<i></i></button>
            <button class="decision-note-button" type="button" data-nav-message="Catatan baru siap ditambahkan.">＋ Catatan</button>
            <button class="decision-logout-button" id="logout-button" type="button">Keluar</button>
          </div>
        </header>

        <div class="decision-content">
          <section class="decision-briefing">
            <div class="decision-briefing-copy">
              <p class="decision-kicker decision-accent">✦ Briefing pagi · data live</p>
              <h1>Keputusan yang <em>jelas.</em></h1>
              <p>Satu meja untuk membaca bukti, menyamakan catatan, dan menutup pengajuan tanpa kehilangan konteks.</p>
            </div>
            <div class="decision-forum-callout">
              <div><p class="decision-kicker">Status sesi</p><strong>Siap meninjau</strong><small>Ruang keputusan · akses ${escapeHtml(user.label)}</small></div>
              <span class="decision-completion-ring" id="completion-ring"><b id="completion-value">0%</b><small>diproses</small></span>
            </div>
          </section>

          <section class="decision-metrics" aria-label="Ringkasan pendaftaran">
            <button class="decision-metric" type="button" data-metric-status="Semua"><span>Total masuk<i></i></span><strong id="total-count">00</strong><small>hasil antrean aktif</small></button>
            <button class="decision-metric" type="button" data-metric-status="Baru"><span>Menunggu review<i class="is-coral"></i></span><strong id="new-count">00</strong><small>perlu mata kedua</small></button>
            <button class="decision-metric" type="button" data-metric-status="Diverifikasi"><span>Siap dibahas<i class="is-gold"></i></span><strong id="ready-count">00</strong><small>masuk forum hari ini</small></button>
            <button class="decision-metric" type="button" data-metric-status="Diterima"><span>Disetujui<i class="is-green"></i></span><strong id="accepted-count">00</strong><small>keputusan tersimpan</small></button>
          </section>

          <section class="decision-workspace">
            <div class="evidence-ledger">
              <div class="ledger-heading">
                <div><p class="decision-kicker decision-accent">◈ Evidence ledger</p><h2>Berkas yang perlu mata Anda.</h2></div>
                <div class="ledger-actions"><span class="ledger-count" id="list-count">—</span><button class="ledger-filter-button" id="filter-toggle" type="button" aria-expanded="false">☷ Filter</button><button class="ledger-refresh-button" id="refresh-button" type="button" aria-label="Segarkan data">↻</button></div>
              </div>
              <form class="ledger-filters" id="committee-filter-form" hidden>
                <label class="ledger-search"><span aria-hidden="true">⌕</span><input id="search-input" type="search" placeholder="Cari nama, nomor, sekolah, atau wali" autocomplete="off" /></label>
                <label><span class="sr-only">Filter jenjang</span><select id="level-filter"><option value="Semua">Semua jenjang</option>${allowedLevels.map((level) => `<option value="${escapeHtml(level)}">${escapeHtml(level)}</option>`).join("")}</select></label>
                <label><span class="sr-only">Filter status</span><select id="status-filter"><option value="Semua">Semua status</option>${statuses.map((status) => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`).join("")}</select></label>
                <button class="ledger-clear-button" id="clear-filters" type="button">Bersihkan</button>
              </form>
              <div class="ledger-subheading"><span>◫ Antrean verifikasi</span><small>PRIORITAS · TERBARU</small></div>
              <div class="decision-list" id="application-list" aria-live="polite" aria-busy="false"></div>
              <div class="ledger-footer"><span>↑↓ Pilih berkas untuk membuka inspector</span><button id="sync-button" type="button">Sinkronkan data</button></div>
            </div>

            <aside class="decision-inspector" id="detail-panel" aria-live="polite">
              <div class="inspector-empty"><span>01</span><h2>Pilih satu pengajuan</h2><p>Detail, bukti pendukung, dan tindakan keputusan akan muncul di sini setelah Anda memilih dari antrean.</p></div>
            </aside>
          </section>

          <footer class="decision-footer"><span>SPMB 2027/2028 · Decision desk panitia</span><span>◈ Data internal terlindungi</span></footer>
        </div>
      </main>
      <div class="decision-toast" id="decision-toast" role="status" aria-live="polite" hidden></div>
    </div>
  `;

  const listElement = document.getElementById("application-list") as HTMLDivElement;
  const detailElement = document.getElementById("detail-panel") as HTMLElement;
  const filterForm = document.getElementById("committee-filter-form") as HTMLFormElement;
  const filterToggle = document.getElementById("filter-toggle") as HTMLButtonElement;
  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  const levelFilter = document.getElementById("level-filter") as HTMLSelectElement;
  const statusFilter = document.getElementById("status-filter") as HTMLSelectElement;

  function showNotice(message: string) {
    const toast = document.getElementById("decision-toast");
    if (!toast) return;
    toast.textContent = `✓  ${message}`;
    toast.hidden = false;
    if (noticeTimer) window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => { toast.hidden = true; }, 3600);
  }

  function formatMetric(value: number) {
    return String(value).padStart(2, "0");
  }

  function renderStats(items: ApplicationListItem[], total: number) {
    const newCount = items.filter((item) => item.status === "Baru").length;
    const readyCount = items.filter((item) => item.status === "Diverifikasi").length;
    const acceptedCount = items.filter((item) => item.status === "Diterima").length;
    const totalCount = document.getElementById("total-count");
    const newElement = document.getElementById("new-count");
    const readyElement = document.getElementById("ready-count");
    const acceptedElement = document.getElementById("accepted-count");
    if (totalCount) totalCount.textContent = formatMetric(total);
    if (newElement) newElement.textContent = formatMetric(newCount);
    if (readyElement) readyElement.textContent = formatMetric(readyCount);
    if (acceptedElement) acceptedElement.textContent = formatMetric(acceptedCount);
    const completion = total ? Math.round((acceptedCount / total) * 100) : 0;
    const completionValue = document.getElementById("completion-value");
    if (completionValue) completionValue.textContent = `${completion}%`;
  }

  function setListMessage(message: string, variant = "") {
    listElement.innerHTML = `<div class="ledger-message ${variant}"><span aria-hidden="true">${variant === "is-error" ? "!" : "—"}</span><p>${escapeHtml(message)}</p></div>`;
  }

  function renderList(items: ApplicationListItem[], total: number) {
    renderStats(items, total);
    const countElement = document.getElementById("list-count");
    if (countElement) countElement.textContent = `${total} pengajuan`;
    if (!items.length) {
      setListMessage("Belum ada pengajuan yang sesuai dengan pencarian.", "is-empty");
      return;
    }
    listElement.innerHTML = items.map((item) => {
      const initials = item.nama_calon.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
      const selected = selectedId === item.id;
      const statusLabel = item.status === "Baru" ? "Menunggu review" : item.status;
      return `
        <button class="decision-application-row${selected ? " is-selected" : ""}" type="button" data-application-id="${item.id}" aria-label="Buka berkas ${escapeHtml(item.nama_calon)}" aria-current="${selected ? "true" : "false"}">
          <span class="decision-avatar">${escapeHtml(initials)}</span>
          <span class="decision-row-main"><strong>${escapeHtml(item.nama_calon)}</strong><small>${escapeHtml(applicationNumber(item.id))} · ${escapeHtml(item.jenjang)} · ${escapeHtml(item.nama_sekolah_asal)}</small><span class="decision-row-meta"><b>${escapeHtml(item.jenjang)}</b><span>${escapeHtml(statusLabel)}</span></span></span>
          <span class="decision-row-date">${escapeHtml(formatDate(item.created_at))}</span><span class="decision-row-arrow" aria-hidden="true">›</span>
        </button>
      `;
    }).join("");
    listElement.querySelectorAll<HTMLButtonElement>("[data-application-id]").forEach((row) => {
      row.addEventListener("click", () => void loadDetail(Number(row.dataset.applicationId), true));
    });
  }

  async function loadList() {
    listElement.setAttribute("aria-busy", "true");
    listElement.innerHTML = `<div class="ledger-skeletons">${[1, 2, 3, 4].map(() => `<div class="ledger-skeleton"><i></i><span><b></b><small></small><em></em></span></div>`).join("")}</div>`;
    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
    if (levelFilter.value !== "Semua") params.set("jenjang", levelFilter.value);
    if (statusFilter.value !== "Semua") params.set("status", statusFilter.value);
    try {
      const result = await requestJSON<{ items: ApplicationListItem[]; total: number }>(`/api/applications?${params.toString()}`);
      renderList(result.items, result.total);
    } catch (error) {
      setListMessage(error instanceof Error ? error.message : "Daftar belum dapat dimuat.", "is-error");
    } finally {
      listElement.setAttribute("aria-busy", "false");
    }
  }

  function renderDetail(application: ApplicationDetail) {
    selectedApplication = application;
    const availableDocuments = application.files.filter((file) => file.available).length;
    const totalDocuments = application.files.length;
    const completion = totalDocuments ? Math.round((availableDocuments / totalDocuments) * 100) : 0;
    const documents = application.files.map((file) => file.available
      ? `<a class="inspector-document" href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer"><span class="document-check">✓</span><span><strong>${escapeHtml(file.label)}</strong><small>Verifikasi berkas · buka preview ↗</small></span><b>›</b></a>`
      : `<div class="inspector-document is-missing"><span class="document-check">!</span><span><strong>${escapeHtml(file.label)}</strong><small>Belum tersedia · perlu cek</small></span></div>`).join("");
    detailElement.className = "decision-inspector is-open";
    detailElement.innerHTML = `
      <div class="inspector-scroll">
        <div class="inspector-header">
          <div><p class="decision-kicker">▣ Decision inspector</p><h2>${escapeHtml(application.nama_calon)}</h2><span>${escapeHtml(applicationNumber(application.id))} · dikirim ${escapeHtml(formatDate(application.created_at))}</span></div>
          <button class="inspector-close" id="inspector-close" type="button" aria-label="Tutup inspector">×</button>
        </div>
        <div class="inspector-tags"><span>${escapeHtml(application.jenjang)}</span><span>${escapeHtml(application.status)}</span><span class="is-priority">${application.status === "Baru" ? "● Prioritas review" : "● Dalam proses"}</span></div>
        <div class="inspector-note"><p>CATATAN REVIEWER</p><strong>${application.status === "Baru" ? "Pengajuan baru menunggu pembacaan pertama." : "Pastikan setiap bukti pendukung sudah sesuai sebelum keputusan akhir."}</strong></div>
        <dl class="inspector-facts">${field("Sekolah asal", application.nama_sekolah_asal)}${field("Alamat domisili", application.alamat_domisili)}${field("Nomor HP / WA", application.nomor_hp_orangtua)}${field("Email", application.email)}</dl>
        <section class="inspector-section"><div class="inspector-section-title"><h3>Bukti pendukung</h3><b>${availableDocuments}/${totalDocuments || 0} lengkap</b></div><div class="inspector-progress"><i style="width: ${completion}%"></i></div><div class="inspector-documents">${documents || `<p class="inspector-muted">Belum ada daftar dokumen.</p>`}</div></section>
        <section class="inspector-section inspector-actions"><p class="decision-kicker">TINDAKAN KEPUTUSAN</p><div class="decision-action-grid"><button type="button" data-decision="Diterima" class="decision-action is-approve">✓<span>Sahkan</span></button><button type="button" data-decision="Diverifikasi" class="decision-action is-hold">◷<span>Tahan</span></button><button type="button" data-decision="Perlu Perbaikan" class="decision-action is-return">↻<span>Kembalikan</span></button></div><p class="decision-feedback" id="status-feedback" aria-live="polite"></p><label class="manual-status-label" for="application-status">Status manual</label><select id="application-status">${statuses.map((status) => `<option value="${escapeHtml(status)}" ${status === application.status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}</select></section>
        <section class="inspector-section detail-section"><h3>Calon peserta didik</h3><dl class="detail-grid">${field("Nama lengkap", application.nama_calon)}${field("Nama panggilan", application.nama_panggilan)}${field("Jenis kelamin", application.jenis_kelamin)}${field("Tempat, tanggal lahir", `${application.tempat_lahir || "—"}, ${application.tanggal_lahir || "—"}`)}${field("NISN", application.nisn)}${field("NIK anak", application.nik_anak)}${field("Alamat domisili", application.alamat_domisili, "span-2")}${field("Anak ke-", application.anak_ke)}${field("Jumlah saudara", application.jumlah_saudara)}${field("Status anak", application.status_anak)}${field("Agama", application.agama)}${field("Kewarganegaraan", application.warga_negara)}${field("Tinggi / berat", `${application.tinggi_badan || "—"} cm / ${application.berat_badan || "—"} kg`)}${field("Transportasi", application.transportasi)}${field("Jarak ke sekolah", application.jarak_sekolah)}${field("Riwayat penyakit", application.riwayat_penyakit, "span-2")}</dl></section>
        <section class="inspector-section detail-section"><h3>Sekolah asal</h3><dl class="detail-grid">${field("Nama sekolah", application.nama_sekolah_asal, "span-2")}${field("Tahun lulus", application.tahun_lulus)}${field("Alamat sekolah", application.alamat_sekolah_asal, "span-2")}</dl></section>
        <section class="inspector-section detail-section"><h3>Orang tua & wali</h3><dl class="detail-grid">${field("Nomor Kartu Keluarga", application.nomor_kk)}${field("NIK orang tua", application.nik_orangtua)}${field("Nama ayah", application.nama_ayah)}${field("Pekerjaan ayah", application.pekerjaan_ayah)}${field("Penghasilan ayah", application.penghasilan_ayah)}${field("Nama ibu", application.nama_ibu)}${field("Pekerjaan ibu", application.pekerjaan_ibu)}${field("Penghasilan ibu", application.penghasilan_ibu)}${field("Nama wali", application.nama_wali)}${field("Hubungan wali", application.hubungan_wali)}</dl></section>
      </div>
    `;
    document.getElementById("inspector-close")?.addEventListener("click", () => detailElement.classList.remove("is-open"));
    detailElement.querySelectorAll<HTMLButtonElement>("[data-decision]").forEach((button) => {
      button.addEventListener("click", () => void updateStatus(button.dataset.decision || "", "Tindakan keputusan tersimpan."));
    });
    document.getElementById("application-status")?.addEventListener("change", (event) => {
      void updateStatus((event.currentTarget as HTMLSelectElement).value, "Status pengajuan diperbarui.");
    });
  }

  async function loadDetail(id: number, shouldScroll: boolean) {
    selectedId = id;
    detailElement.className = "decision-inspector is-open";
    detailElement.innerHTML = `<div class="inspector-loading"><i></i><i></i><i></i><p>Memuat decision inspector…</p></div>`;
    try {
      const result = await requestJSON<ApplicationDetail>(`/api/applications/${id}`);
      renderDetail(result);
      renderCurrentListSelection();
      if (shouldScroll && window.matchMedia("(max-width: 980px)").matches) detailElement.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      detailElement.innerHTML = `<div class="inspector-empty is-error"><span>!</span><h2>Detail belum tersedia</h2><p>${escapeHtml(error instanceof Error ? error.message : "Detail belum dapat dimuat.")}</p></div>`;
    }
  }

  function renderCurrentListSelection() {
    listElement.querySelectorAll<HTMLElement>("[data-application-id]").forEach((row) => {
      const isSelected = Number(row.dataset.applicationId) === selectedId;
      row.classList.toggle("is-selected", isSelected);
      row.setAttribute("aria-current", isSelected ? "true" : "false");
    });
  }

  async function updateStatus(nextStatus: string, successMessage: string) {
    if (!selectedApplication || !selectedId || !statuses.includes(nextStatus)) return;
    const feedback = document.getElementById("status-feedback");
    const controls = detailElement.querySelectorAll<HTMLButtonElement | HTMLSelectElement>("[data-decision], #application-status");
    controls.forEach((control) => { control.disabled = true; });
    if (feedback) feedback.textContent = "Menyimpan keputusan…";
    try {
      const result = await requestJSON<{ status: string }>(`/api/applications/${selectedId}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
      selectedApplication.status = result.status;
      renderDetail(selectedApplication);
      await loadList();
      showNotice(successMessage);
    } catch (error) {
      if (feedback) {
        feedback.textContent = error instanceof Error ? error.message : "Belum tersimpan.";
        feedback.className = "decision-feedback is-error";
      }
    }
  }

  let searchTimer: number | undefined;
  function scheduleListLoad() {
    if (searchTimer) window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => { void loadList(); }, 240);
  }

  filterToggle.addEventListener("click", () => {
    const shouldOpen = filterForm.hidden;
    filterForm.hidden = !shouldOpen;
    filterToggle.setAttribute("aria-expanded", String(shouldOpen));
    filterToggle.classList.toggle("is-active", shouldOpen);
    if (shouldOpen) searchInput.focus();
  });
  filterForm.addEventListener("submit", (event) => { event.preventDefault(); void loadList(); });
  searchInput.addEventListener("input", scheduleListLoad);
  levelFilter.addEventListener("change", () => void loadList());
  statusFilter.addEventListener("change", () => void loadList());
  document.getElementById("clear-filters")?.addEventListener("click", () => {
    searchInput.value = "";
    levelFilter.value = "Semua";
    statusFilter.value = "Semua";
    void loadList();
  });
  document.getElementById("refresh-button")?.addEventListener("click", () => { void loadList(); showNotice("Berkas terbaru sedang dimuat."); });
  document.getElementById("sync-button")?.addEventListener("click", () => { void loadList(); showNotice("Sinkronisasi data dimulai."); });
  document.querySelectorAll<HTMLButtonElement>("[data-metric-status]").forEach((button) => {
    button.addEventListener("click", () => {
      const metricStatus = button.dataset.metricStatus || "Semua";
      statusFilter.value = metricStatus;
      filterForm.hidden = false;
      filterToggle.setAttribute("aria-expanded", "true");
      filterToggle.classList.add("is-active");
      void loadList();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-nav-message]").forEach((button) => {
    button.addEventListener("click", () => showNotice(button.dataset.navMessage || ""));
  });
  const rail = document.getElementById("decision-rail");
  const closeRail = () => { rail?.classList.remove("is-mobile-open"); document.getElementById("rail-scrim")?.classList.remove("is-visible"); };
  document.getElementById("rail-menu-button")?.addEventListener("click", () => { rail?.classList.add("is-mobile-open"); document.getElementById("rail-scrim")?.classList.add("is-visible"); });
  document.getElementById("rail-close-button")?.addEventListener("click", closeRail);
  document.getElementById("rail-scrim")?.addEventListener("click", closeRail);
  document.getElementById("logout-button")?.addEventListener("click", async () => {
    await requestJSON("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    renderLogin();
  });

  void loadList();
}

async function bootstrap() {
  try {
    const result = await requestJSON<{ user: AuthUser }>("/api/auth/me");
    renderDashboard(result.user);
  } catch {
    renderLogin();
  }
}

void bootstrap();

export {};