import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  FileCheck2,
  FileText,
  Flag,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

type ReviewState = "Menunggu" | "Siap dibahas" | "Disetujui";
type Level = "SMP" | "SMA" | "SMK";
type Decision = "Sahkan" | "Tahan" | "Kembalikan";

type Application = {
  id: string;
  name: string;
  initials: string;
  level: Level;
  school: string;
  route: string;
  submitted: string;
  queue: number;
  domicile: string;
  guardian: string;
  docs: number;
  totalDocs: number;
  note: string;
  state: ReviewState;
  priority: "Kritis" | "Normal";
  reviewer: string;
};

const seedApplications: Application[] = [
  {
    id: "SPMB-270184",
    name: "Naila Putri Ramadhani",
    initials: "NP",
    level: "SMA",
    school: "SMP Negeri 5 Yogyakarta",
    route: "Domisili",
    submitted: "08.42 WIB",
    queue: 1,
    domicile: "Umbulharjo, Yogyakarta",
    guardian: "Rina Wulandari",
    docs: 3,
    totalDocs: 4,
    note: "Rapor semester terakhir menunggu pengecekan silang.",
    state: "Menunggu",
    priority: "Kritis",
    reviewer: "Dewi Wulandari",
  },
  {
    id: "SPMB-270179",
    name: "Raka Aditya Pranowo",
    initials: "RA",
    level: "SMK",
    school: "SMP Negeri 2 Sleman",
    route: "Afirmasi",
    submitted: "08.18 WIB",
    queue: 2,
    domicile: "Ngaglik, Sleman",
    guardian: "Dwi Prasetyo",
    docs: 3,
    totalDocs: 4,
    note: "Foto kartu keluarga kurang terbaca pada bagian nomor NIK.",
    state: "Menunggu",
    priority: "Kritis",
    reviewer: "Fajar Nugroho",
  },
  {
    id: "SPMB-270166",
    name: "Salsabila Nur Aini",
    initials: "SN",
    level: "SMA",
    school: "SMP Muhammadiyah 3 Bantul",
    route: "Domisili",
    submitted: "Kemarin, 13.05",
    queue: 3,
    domicile: "Kasihan, Bantul",
    guardian: "Nurhayati",
    docs: 4,
    totalDocs: 4,
    note: "Data dan dokumen sesuai. Menunggu forum penetapan akhir.",
    state: "Siap dibahas",
    priority: "Normal",
    reviewer: "Dewi Wulandari",
  },
  {
    id: "SPMB-270141",
    name: "Bagas Mahendra Wijaya",
    initials: "BM",
    level: "SMP",
    school: "SD Negeri Kotagede 1",
    route: "Domisili",
    submitted: "16 Jun, 11.26",
    queue: 4,
    domicile: "Kotagede, Yogyakarta",
    guardian: "Arif Wijaya",
    docs: 4,
    totalDocs: 4,
    note: "Seluruh data telah disahkan pada forum verifikasi 16 Juni.",
    state: "Disetujui",
    priority: "Normal",
    reviewer: "Maya Lestari",
  },
  {
    id: "SPMB-270128",
    name: "Kiara Ayu Lestari",
    initials: "KA",
    level: "SMK",
    school: "SMP Negeri 1 Wonosari",
    route: "Domisili",
    submitted: "15 Jun, 09.11",
    queue: 5,
    domicile: "Wonosari, Gunungkidul",
    guardian: "Maya Lestari",
    docs: 3,
    totalDocs: 4,
    note: "Pengecekan alamat pada Kartu Keluarga belum selesai.",
    state: "Menunggu",
    priority: "Normal",
    reviewer: "Fajar Nugroho",
  },
  {
    id: "SPMB-270103",
    name: "Fauzan Alfarizi",
    initials: "FA",
    level: "SMP",
    school: "SD Islam Terpadu Luqman Al Hakim",
    route: "Prestasi",
    submitted: "13 Jun, 14.37",
    queue: 6,
    domicile: "Depok, Sleman",
    guardian: "Hendra Alfarizi",
    docs: 4,
    totalDocs: 4,
    note: "Tidak memenuhi ketentuan jarak pada jalur yang dipilih.",
    state: "Disetujui",
    priority: "Normal",
    reviewer: "Maya Lestari",
  },
];

const stateMeta: Record<ReviewState, { label: string; color: string; bg: string; icon: typeof Circle }> = {
  Menunggu: { label: "Menunggu review", color: "#d35f49", bg: "#f8e2d9", icon: Circle },
  "Siap dibahas": { label: "Siap dibahas", color: "#b17a1f", bg: "#f8eecf", icon: Clock3 },
  Disetujui: { label: "Disetujui", color: "#347267", bg: "#dcece3", icon: CheckCircle2 },
};

function Metric({
  value,
  label,
  detail,
  accent,
  onClick,
  active,
}: {
  value: string;
  label: string;
  detail: string;
  accent: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#89929a]">{label}</span>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <strong className="font-['Georgia'] text-[38px] leading-none tracking-[-.08em] text-[#18333c]">{value}</strong>
        <span className="mb-1 text-right text-[10px] leading-4 text-[#89929a]">{detail}</span>
      </div>
    </>
  );

  if (!onClick) return <div className="border-l border-[#d8d9d2] px-5 py-5 first:border-l-0">{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-l border-[#d8d9d2] px-5 py-5 text-left transition first:border-l-0 hover:bg-[#f8f5ec] ${active ? "bg-[#f8f1dc]" : ""}`}
    >
      {content}
    </button>
  );
}

function ApplicationRow({
  application,
  selected,
  onSelect,
}: {
  application: Application;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = stateMeta[application.state];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full border-b border-[#e0e2dc] px-5 py-4 text-left transition sm:px-6 ${
        selected ? "bg-[#183d45] text-[#f7f4ec]" : "bg-[#fffdf7] text-[#24414a] hover:bg-[#f7f3e8]"
      }`}
      aria-label={`Buka berkas ${application.name}`}
    >
      {selected && <span className="absolute inset-y-0 left-0 w-1 bg-[#e6b34d]" />}
      <div className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-[9px] font-mono text-[11px] font-bold ${
            selected ? "bg-[#e6b34d] text-[#18333c]" : application.priority === "Kritis" ? "bg-[#f5d8ce] text-[#ad513f]" : "bg-[#dce9e1] text-[#317063]"
          }`}
        >
          {application.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <strong className="truncate text-[12px] font-bold">{application.name}</strong>
            <span className={`shrink-0 font-mono text-[9px] ${selected ? "text-[#a9c5c1]" : "text-[#9da39d]"}`}>{application.submitted}</span>
          </span>
          <span className={`mt-1 block truncate font-mono text-[9px] ${selected ? "text-[#9db7b3]" : "text-[#9ba29d]"}`}>
            {application.id} <span className="px-1">·</span> {application.school}
          </span>
          <span className="mt-3 flex items-center gap-2">
            <span className={`rounded px-1.5 py-1 text-[9px] font-bold ${selected ? "bg-[#2b5960] text-[#dce9e1]" : "bg-[#eef0e8] text-[#648078]"}`}>{application.level}</span>
            <span className={`text-[9px] ${selected ? "text-[#b7ccc5]" : "text-[#7f8d87]"}`}>{application.route}</span>
            <span className="ml-auto flex items-center gap-1 text-[9px] font-bold" style={{ color: selected ? "#e9c46b" : meta.color }}>
              <Icon className="h-3 w-3" />
              {application.state}
            </span>
          </span>
        </span>
        <ChevronRight className={`mt-3 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${selected ? "text-[#e8c166]" : "text-[#bdc4bc]"}`} />
      </div>
    </button>
  );
}

function DocumentRow({ name, available, onClick }: { name: string; available: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-[#e2e2da] py-3 text-left transition last:border-b-0 hover:bg-[#f6f3e8] ${
        available ? "text-[#294e4b]" : "text-[#a1968e]"
      }`}
    >
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${available ? "bg-[#dbeae1] text-[#317266]" : "bg-[#f2ddd5] text-[#c26b55]"}`}>
        {available ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{name}</span>
      <span className="font-mono text-[9px] uppercase tracking-[.08em]">{available ? "terverifikasi" : "perlu cek"}</span>
    </button>
  );
}

export function CommitteeDashboardQueueVariant() {
  const [applications, setApplications] = useState(seedApplications);
  const [selectedId, setSelectedId] = useState(seedApplications[0].id);
  const [stateFilter, setStateFilter] = useState<"Semua status" | ReviewState>("Semua status");
  const [levelFilter, setLevelFilter] = useState<"Semua jenjang" | Level>("Semua jenjang");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [mobileRail, setMobileRail] = useState(false);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [activeDocument, setActiveDocument] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 520);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleApplications = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesQuery = !normalized || `${application.name} ${application.id} ${application.school} ${application.guardian}`.toLowerCase().includes(normalized);
      const matchesState = stateFilter === "Semua status" || application.state === stateFilter;
      const matchesLevel = levelFilter === "Semua jenjang" || application.level === levelFilter;
      return matchesQuery && matchesState && matchesLevel;
    });
  }, [applications, levelFilter, query, stateFilter]);

  const selected = applications.find((application) => application.id === selectedId) ?? null;
  const waitingCount = applications.filter((application) => application.state === "Menunggu").length;
  const readyCount = applications.filter((application) => application.state === "Siap dibahas").length;
  const approvedCount = applications.filter((application) => application.state === "Disetujui").length;
  const completion = Math.round((approvedCount / applications.length) * 100);

  const showNotice = (message: string) => setNotice(message);

  const setStatus = (id: string, nextState: ReviewState, message: string) => {
    setApplications((current) => current.map((application) => (application.id === id ? { ...application, state: nextState, priority: nextState === "Menunggu" ? application.priority : "Normal" } : application)));
    setDecision(null);
    showNotice(message);
  };

  const commitDecision = (nextDecision: Decision) => {
    if (!selected) return;
    setDecision(nextDecision);
    if (nextDecision === "Sahkan") setStatus(selected.id, "Disetujui", `${selected.name} disahkan untuk daftar keputusan.`);
    if (nextDecision === "Tahan") setStatus(selected.id, "Siap dibahas", `${selected.name} ditambahkan ke agenda rapat.`);
    if (nextDecision === "Kembalikan") setStatus(selected.id, "Menunggu", `${selected.name} dikembalikan ke antrean review.`);
  };

  const refresh = () => {
    setIsLoading(true);
    setHasError(false);
    window.setTimeout(() => {
      if (query.trim().toLowerCase() === "error") {
        setHasError(true);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        showNotice("Berkas terbaru sudah dimuat.");
      }
    }, 720);
  };

  const clearFilters = () => {
    setQuery("");
    setStateFilter("Semua status");
    setLevelFilter("Semua jenjang");
  };

  return (
    <div className="min-h-[100dvh] bg-[#e9ece7] text-[#24414a]">
      <style>{`
        @keyframes desk-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes desk-shimmer { 0% { background-position: 130% 0 } 100% { background-position: -130% 0 } }
        .desk-rise { animation: desk-rise .54s cubic-bezier(.2,.75,.25,1) both }
        .desk-delay { animation-delay: .12s }
        .desk-delay-2 { animation-delay: .2s }
        .desk-skeleton { background: linear-gradient(100deg,#d8dfd8 20%,#edf0e8 40%,#d8dfd8 60%); background-size: 220% 100%; animation: desk-shimmer 1.35s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .desk-rise, .desk-skeleton { animation: none } }
      `}</style>

      <div className="flex min-h-[100dvh]">
        <aside className={`${mobileRail ? "fixed inset-y-0 left-0 z-50 flex w-[250px]" : "hidden"} flex-col bg-[#163840] text-[#f7f4ec] lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[250px] lg:shrink-0`}>
          <div className="flex items-center justify-between border-b border-[#48646a] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-[10px_10px_4px_10px] border border-[#e5b44d] text-[#e5b44d]">
                <span className="font-['Georgia'] text-xl font-bold">S</span>
              </div>
              <div>
                <p className="m-0 text-[12px] font-bold tracking-[.2em]">SPMB</p>
                <p className="m-0 mt-1 font-mono text-[8px] uppercase tracking-[.13em] text-[#a9c4bf]">Decision desk</p>
              </div>
            </div>
            <button type="button" aria-label="Tutup navigasi" className="rounded-md p-1 text-[#a9c4bf] hover:bg-[#2c545a] lg:hidden" onClick={() => setMobileRail(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 py-6">
            <p className="px-3 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#7fa09b]">Workspace</p>
            <nav className="mt-3 space-y-1">
              {[
                { label: "Ruang keputusan", icon: LayoutDashboard, active: true },
                { label: "Agenda rapat", icon: Clock3, active: false },
                { label: "Arsip pengajuan", icon: Archive, active: false },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => showNotice(item.active ? "Ruang keputusan sedang aktif." : `${item.label} akan dibuka setelah sinkronisasi.`)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[11px] font-bold transition ${item.active ? "bg-[#e5b44d] text-[#173740]" : "text-[#c0d2cd] hover:bg-[#285158]"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {item.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#b84e3e]" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-[#48646a] p-5">
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-[#214850] p-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#e5b44d] text-[10px] font-bold text-[#173740]">DW</div>
              <div className="min-w-0">
                <p className="m-0 truncate text-[11px] font-bold">Dewi Wulandari</p>
                <p className="m-0 mt-1 font-mono text-[8px] uppercase tracking-[.1em] text-[#9ebbb5]">Koordinator data</p>
              </div>
              <button type="button" aria-label="Pengaturan akun" className="ml-auto text-[#9ebbb5] hover:text-[#e5b44d]" onClick={() => showNotice("Pengaturan akun dibuka.")}>
                <Settings2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <button type="button" className="flex items-center gap-2 text-[10px] font-bold text-[#a9c4bf] hover:text-[#f3ce78]" onClick={() => showNotice("Pusat panduan verifikasi dibuka.")}>
              <MessageSquareText className="h-3.5 w-3.5" /> Butuh bantuan?
            </button>
          </div>
        </aside>

        {mobileRail && <button type="button" aria-label="Tutup menu" className="fixed inset-0 z-40 bg-[#122e35]/50 lg:hidden" onClick={() => setMobileRail(false)} />}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[#d9dfd9] bg-[#f7f6ef]/95 backdrop-blur">
            <div className="flex min-h-[68px] items-center justify-between gap-4 px-5 sm:px-8 xl:px-12">
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Buka navigasi" className="rounded-lg p-2 text-[#315b5a] hover:bg-[#e6ece5] lg:hidden" onClick={() => setMobileRail(true)}>
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="m-0 font-mono text-[9px] font-bold uppercase tracking-[.15em] text-[#9a9f98]">Panitia / Workspace</p>
                  <p className="m-0 mt-1 text-[12px] font-bold text-[#2b4b50]">Ruang keputusan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden rounded-full border border-[#d4dbd4] bg-[#fbfaf4] px-3 py-2 font-mono text-[9px] text-[#788782] sm:inline">18 JUN 2027 · 09.14 WIB</span>
                <button type="button" aria-label="Notifikasi" className="relative rounded-lg border border-[#d4dbd4] bg-[#fbfaf4] p-2 text-[#426966] hover:border-[#9cb5aa]" onClick={() => showNotice("Tidak ada notifikasi baru.")}>
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#d35f49]" />
                </button>
                <button type="button" className="hidden items-center gap-2 rounded-lg bg-[#183d45] px-3 py-2 text-[10px] font-bold text-[#f6f2e7] transition hover:bg-[#24545a] sm:flex" onClick={() => showNotice("Catatan baru siap ditambahkan.")}>
                  <MessageSquareText className="h-3.5 w-3.5 text-[#e6b34d]" /> Catatan
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 pb-12 pt-8 sm:px-8 xl:px-12 xl:pt-11">
            <section className="desk-rise flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
              <div className="max-w-[720px]">
                <div className="mb-4 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.18em] text-[#c05c49]">
                  <Sparkles className="h-3.5 w-3.5" /> Briefing pagi · batch 04
                </div>
                <h1 className="m-0 font-['Georgia'] text-[clamp(2.55rem,6vw,5.25rem)] font-bold leading-[.9] tracking-[-.075em] text-[#18333c]">
                  Keputusan yang <span className="text-[#c05c49]">jelas.</span>
                </h1>
                <p className="mt-5 max-w-[575px] text-[13px] leading-6 text-[#697b78] sm:text-[14px]">
                  Satu meja untuk membaca bukti, menyamakan catatan, dan menutup pengajuan tanpa kehilangan konteks.
                </p>
              </div>
              <div className="flex items-center gap-4 border-l-2 border-[#e5b44d] pl-4 sm:pl-5">
                <div>
                  <p className="m-0 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#8b9690]">Forum berikutnya</p>
                  <p className="m-0 mt-2 font-['Georgia'] text-[24px] font-bold leading-none text-[#18333c]">14.00 WIB</p>
                  <p className="m-0 mt-2 text-[10px] text-[#7b8983]">Ruang Sidang 2 · 6 berkas</p>
                </div>
                <div className="grid h-16 w-16 place-items-center rounded-full border border-[#d9c177] bg-[#faf2d7] text-center text-[#a16f1e]">
                  <div><strong className="block font-['Georgia'] text-[21px] leading-none">{completion}%</strong><span className="mt-1 block font-mono text-[7px] uppercase tracking-[.1em]">selesai</span></div>
                </div>
              </div>
            </section>

            <section className="desk-rise desk-delay mt-9 grid overflow-hidden rounded-[14px] border border-[#d8dcd5] bg-[#fffdf7] shadow-[0_18px_50px_rgba(40,65,66,.07)] sm:grid-cols-4">
              <Metric value={String(applications.length).padStart(2, "0")} label="Total masuk" detail="batch berjalan" accent="#3e7c70" />
              <Metric value={String(waitingCount).padStart(2, "0")} label="Menunggu review" detail="perlu mata kedua" accent="#d35f49" active={stateFilter === "Menunggu"} onClick={() => setStateFilter(stateFilter === "Menunggu" ? "Semua status" : "Menunggu")} />
              <Metric value={String(readyCount).padStart(2, "0")} label="Siap dibahas" detail="masuk forum hari ini" accent="#b17a1f" active={stateFilter === "Siap dibahas"} onClick={() => setStateFilter(stateFilter === "Siap dibahas" ? "Semua status" : "Siap dibahas")} />
              <Metric value={String(approvedCount).padStart(2, "0")} label="Disetujui" detail="keputusan tersimpan" accent="#347267" active={stateFilter === "Disetujui"} onClick={() => setStateFilter(stateFilter === "Disetujui" ? "Semua status" : "Disetujui")} />
            </section>

            <section className="desk-rise desk-delay-2 mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
              <div className="overflow-hidden rounded-[14px] border border-[#d8dcd5] bg-[#fffdf7] shadow-[0_16px_42px_rgba(40,65,66,.05)]">
                <div className="flex flex-col justify-between gap-4 border-b border-[#e0e2dc] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#c05c49]"><ShieldCheck className="h-3.5 w-3.5" /> Evidence ledger</div>
                    <h2 className="m-0 mt-2 font-['Georgia'] text-[25px] font-bold tracking-[-.05em] text-[#18333c]">Berkas yang perlu mata Anda.</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden rounded-full bg-[#edf0e9] px-2.5 py-1.5 font-mono text-[9px] text-[#71827b] sm:inline">{visibleApplications.length} berkas</span>
                    <button type="button" aria-label="Buka filter" className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-bold transition ${showFilters ? "border-[#4b8276] bg-[#e3eee7] text-[#2f6a62]" : "border-[#d8dcd5] bg-[#fbfaf4] text-[#657a73] hover:border-[#9db6aa]"}`} onClick={() => setShowFilters((open) => !open)}>
                      <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
                    </button>
                    <button type="button" aria-label="Segarkan data" className="grid h-9 w-9 place-items-center rounded-lg border border-[#d8dcd5] bg-[#fbfaf4] text-[#657a73] transition hover:border-[#9db6aa]" onClick={refresh}>
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="flex flex-col gap-3 border-b border-[#e0e2dc] bg-[#f2f3ed] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                    <div className="relative min-w-0 flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8b9992]" />
                      <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Cari nama, nomor, sekolah, atau wali" className="h-9 w-full rounded-lg border border-[#d6dbd3] bg-[#fffdf7] pl-9 pr-3 text-[11px] text-[#29474d] outline-none focus:border-[#4d8177] focus:ring-2 focus:ring-[#4d8177]/15" />
                    </div>
                    <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as "Semua jenjang" | Level)} className="h-9 rounded-lg border border-[#d6dbd3] bg-[#fffdf7] px-3 text-[11px] text-[#526b66] outline-none">
                      <option>Semua jenjang</option><option>SMP</option><option>SMA</option><option>SMK</option>
                    </select>
                    <button type="button" onClick={clearFilters} className="h-9 rounded-lg px-3 text-[10px] font-bold text-[#4d7b71] hover:bg-[#e4eee7]">Bersihkan</button>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-[#e0e2dc] bg-[#f6f6ef] px-5 py-3 sm:px-6">
                  <span className="flex items-center gap-2 text-[10px] font-bold text-[#60736e]"><FileText className="h-3.5 w-3.5 text-[#5a887b]" /> Antrean verifikasi</span>
                  <span className="font-mono text-[9px] uppercase tracking-[.1em] text-[#9aa39c]">Prioritas · terbaru</span>
                </div>

                {isLoading ? (
                  <div className="space-y-3 p-5">
                    {[1, 2, 3, 4].map((item) => <div key={item} className="flex gap-3 rounded-lg border border-[#e4e7df] p-4"><div className="desk-skeleton h-10 w-10 rounded-lg" /><div className="flex-1"><div className="desk-skeleton h-3 w-2/3 rounded" /><div className="desk-skeleton mt-3 h-2 w-1/2 rounded" /><div className="desk-skeleton mt-4 h-2 w-1/3 rounded" /></div></div>)}
                  </div>
                ) : hasError ? (
                  <div className="grid min-h-[430px] place-items-center px-6 text-center">
                    <div><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f8e2d9] text-[#c05c49]"><RefreshCw className="h-5 w-5" /></div><h3 className="m-0 mt-4 font-['Georgia'] text-[21px] font-bold text-[#18333c]">Ledger belum tersambung</h3><p className="mx-auto mt-2 max-w-[250px] text-[11px] leading-5 text-[#84918b]">Ada gangguan saat mengambil berkas. Coba segarkan sekali lagi.</p><button type="button" onClick={refresh} className="mt-5 rounded-lg bg-[#183d45] px-4 py-2.5 text-[11px] font-bold text-[#f7f4ec] hover:bg-[#24545a]">Coba lagi</button></div>
                  </div>
                ) : visibleApplications.length ? (
                  <div>{visibleApplications.map((application) => <ApplicationRow key={application.id} application={application} selected={selectedId === application.id} onSelect={() => { setSelectedId(application.id); setMobileDetail(true); setDecision(null); }} />)}</div>
                ) : (
                  <div className="grid min-h-[430px] place-items-center px-6 text-center"><div><CheckCircle2 className="mx-auto h-8 w-8 text-[#77a28f]" /><h3 className="m-0 mt-4 font-['Georgia'] text-[21px] font-bold text-[#18333c]">Tidak ada berkas di sini.</h3><p className="mx-auto mt-2 max-w-[240px] text-[11px] leading-5 text-[#84918b]">Coba ubah kata kunci atau bersihkan filter untuk melihat antrean lain.</p><button type="button" onClick={clearFilters} className="mt-5 text-[11px] font-bold text-[#4d7b71] hover:text-[#18333c]">Bersihkan semua filter</button></div></div>
                )}
                <div className="flex flex-col justify-between gap-2 border-t border-[#e0e2dc] bg-[#f5f5ed] px-5 py-3 text-[10px] text-[#8a9891] sm:flex-row sm:items-center sm:px-6"><span className="flex items-center gap-2"><ArrowUp className="h-3.5 w-3.5 text-[#b17a1f]" /><ArrowDown className="h-3.5 w-3.5 text-[#b17a1f]" /> Pilih berkas untuk membuka inspector</span><button type="button" className="font-bold text-[#4d7b71] hover:text-[#18333c]" onClick={() => showNotice("Sinkron terakhir: 09.12 WIB.")}>Sinkron 2 menit lalu</button></div>
              </div>

              <aside className={`${mobileDetail ? "block" : "hidden"} xl:block`}>
                {selected ? (
                  <div className="overflow-hidden rounded-[14px] border border-[#d8dcd5] bg-[#fffdf7] shadow-[0_16px_42px_rgba(40,65,66,.05)]">
                    <div className="flex items-start justify-between gap-3 border-b border-[#e0e2dc] bg-[#183d45] px-5 py-5 text-[#f7f4ec]">
                      <div>
                        <p className="m-0 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-[#e6b34d]"><FileCheck2 className="h-3.5 w-3.5" /> Decision inspector</p>
                        <h2 className="m-0 mt-3 font-['Georgia'] text-[26px] font-bold leading-[.95] tracking-[-.05em]">{selected.name}</h2>
                        <p className="m-0 mt-2 font-mono text-[9px] text-[#9dbab5]">{selected.id} · nomor antre {String(selected.queue).padStart(2, "0")}</p>
                      </div>
                      <button type="button" aria-label="Tutup inspector" className="rounded-lg p-1.5 text-[#a7c3bd] hover:bg-[#2b5960] xl:hidden" onClick={() => setMobileDetail(false)}><X className="h-4 w-4" /></button>
                    </div>

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-[#e9eee6] px-2 py-1 font-mono text-[9px] font-bold text-[#4d746d]">{selected.level}</span><span className="rounded bg-[#e9eee6] px-2 py-1 text-[9px] font-bold text-[#4d746d]">{selected.route}</span><span className="flex items-center gap-1 rounded bg-[#f8e2d9] px-2 py-1 text-[9px] font-bold text-[#b65746]"><Flag className="h-3 w-3 fill-current" />{selected.priority}</span></div>
                      <div className="mt-5 rounded-[11px] border border-[#e0d3a9] bg-[#fbf3d9] p-4"><div className="flex items-center justify-between"><p className="m-0 font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#9b7625]">Catatan reviewer</p><MoreHorizontal className="h-4 w-4 text-[#b38d39]" /></div><p className="m-0 mt-3 text-[12px] leading-5 text-[#6f633f]">{selected.note}</p></div>

                      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-b border-[#e2e2da] pb-5"><div><dt className="font-mono text-[8px] font-bold uppercase tracking-[.13em] text-[#9aa29c]">Sekolah asal</dt><dd className="m-0 mt-1 text-[11px] leading-4 text-[#29474d]">{selected.school}</dd></div><div><dt className="font-mono text-[8px] font-bold uppercase tracking-[.13em] text-[#9aa29c]">Domisili</dt><dd className="m-0 mt-1 text-[11px] leading-4 text-[#29474d]">{selected.domicile}</dd></div><div><dt className="font-mono text-[8px] font-bold uppercase tracking-[.13em] text-[#9aa29c]">Wali murid</dt><dd className="m-0 mt-1 text-[11px] leading-4 text-[#29474d]">{selected.guardian}</dd></div><div><dt className="font-mono text-[8px] font-bold uppercase tracking-[.13em] text-[#9aa29c]">Reviewer</dt><dd className="m-0 mt-1 text-[11px] leading-4 text-[#29474d]">{selected.reviewer}</dd></div></dl>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between"><p className="m-0 text-[11px] font-bold text-[#385e5a]">Bukti pendukung</p><span className="font-mono text-[9px] font-bold text-[#4e806f]">{selected.docs}/{selected.totalDocs} lengkap</span></div>
                        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#e5e8df]"><div className="h-full rounded-full bg-[#4e806f]" style={{ width: `${(selected.docs / selected.totalDocs) * 100}%` }} /></div>
                        <div>{["Kartu Keluarga", "Akta kelahiran", "Rapor semester 5", "Surat domisili"].map((document, index) => <DocumentRow key={document} name={document} available={index < selected.docs} onClick={() => { setActiveDocument(document); showNotice(`${document} dibuka dalam mode pratinjau.`); }} />)}</div>
                        {activeDocument && <p className="m-0 mt-3 rounded-lg bg-[#edf1eb] px-3 py-2 font-mono text-[9px] text-[#58776f]">Pratinjau aktif · {activeDocument}</p>}
                      </div>

                      <div className="mt-6 border-t border-[#e2e2da] pt-5"><p className="m-0 font-mono text-[9px] font-bold uppercase tracking-[.13em] text-[#9aa29c]">Tindakan keputusan</p><div className="mt-3 grid grid-cols-3 gap-2"><button type="button" onClick={() => commitDecision("Sahkan")} className="inline-flex flex-col items-center justify-center gap-1.5 rounded-lg bg-[#347267] py-3 text-[10px] font-bold text-[#f7f4ec] transition hover:bg-[#285f56]"><CheckCircle2 className="h-4 w-4" />Sahkan</button><button type="button" onClick={() => commitDecision("Tahan")} className="inline-flex flex-col items-center justify-center gap-1.5 rounded-lg border border-[#ddc98d] bg-[#fbf3d9] py-3 text-[10px] font-bold text-[#8e6c20] transition hover:bg-[#f7eac0]"><Clock3 className="h-4 w-4" />Tahan</button><button type="button" onClick={() => commitDecision("Kembalikan")} className="inline-flex flex-col items-center justify-center gap-1.5 rounded-lg border border-[#eccdc3] bg-[#fff8f3] py-3 text-[10px] font-bold text-[#b65746] transition hover:bg-[#f8e2d9]"><RefreshCw className="h-4 w-4" />Kembali</button></div>{decision && <p className="m-0 mt-3 text-center font-mono text-[9px] text-[#618077]">Tindakan terakhir: {decision}</p>}</div>
                    </div>
                  </div>
                ) : <div className="grid min-h-[560px] place-items-center rounded-[14px] border border-dashed border-[#cfd8cf] bg-[#f5f6ef] px-6 text-center"><div><FileCheck2 className="mx-auto h-8 w-8 text-[#8ca49a]" /><p className="mt-4 text-[12px] font-bold text-[#60756f]">Pilih satu berkas</p><p className="mt-2 max-w-[210px] text-[10px] leading-5 text-[#8b9992]">Inspector keputusan akan muncul di sini.</p></div></div>}
              </aside>
            </section>

            <footer className="mt-9 flex flex-col justify-between gap-3 border-t border-[#d4dbd4] pt-5 text-[10px] text-[#82918a] sm:flex-row sm:items-center"><p className="m-0">SPMB 2027/2028 · Decision desk panitia</p><p className="m-0 flex items-center gap-1.5 font-mono text-[#5c7b73]"><ShieldCheck className="h-3 w-3" /> Data internal terenkripsi</p></footer>
          </div>
        </main>
      </div>

      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-[70] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-full border border-[#3a6f68] bg-[#183d45] px-4 py-3 text-[11px] font-bold text-[#f7f4ec] shadow-[0_14px_30px_rgba(24,61,69,.25)]"><Check className="h-3.5 w-3.5 shrink-0 text-[#e6b34d]" /><span className="truncate">{notice}</span></div>}
    </div>
  );
}