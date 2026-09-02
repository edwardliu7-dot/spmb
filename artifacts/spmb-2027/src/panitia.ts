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

function renderDashboard(user: AuthUser) {
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

function field(label: string, value: unknown, className = "") {
  return `<div class="detail-field ${className}"><dt>${label}</dt><dd>${escapeHtml(value || "—")}</dd></div>`;
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