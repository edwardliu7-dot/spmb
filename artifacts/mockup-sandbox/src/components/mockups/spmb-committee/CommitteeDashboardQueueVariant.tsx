import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  FileText,
  Flag,
  Inbox,
  Keyboard,
  ListChecks,
  Menu,
  MoreHorizontal,
  PanelLeft,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

type ReviewState = "Perlu dicek" | "Siap diputuskan" | "Tersimpan";
type Level = "SMP" | "SMA" | "SMK";

type Application = {
  id: string;
  name: string;
  initials: string;
  level: Level;
  school: string;
  route: string;
  submitted: string;
  reviewDate: string;
  reviewLabel: string;
  domicile: string;
  guardian: string;
  docs: number;
  totalDocs: number;
  issue: string;
  state: ReviewState;
  priority: "Tinggi" | "Normal";
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
    reviewDate: "18 Jun",
    reviewLabel: "Hari ini",
    domicile: "Umbulharjo, Yogyakarta",
    guardian: "Rina Wulandari",
    docs: 3,
    totalDocs: 4,
    issue: "Rapor semester terakhir menunggu pengecekan silang.",
    state: "Perlu dicek",
    priority: "Tinggi",
  },
  {
    id: "SPMB-270179",
    name: "Raka Aditya Pranowo",
    initials: "RA",
    level: "SMK",
    school: "SMP Negeri 2 Sleman",
    route: "Afirmasi",
    submitted: "Kemarin, 16.18",
    reviewDate: "18 Jun",
    reviewLabel: "Hari ini",
    domicile: "Ngaglik, Sleman",
    guardian: "Dwi Prasetyo",
    docs: 3,
    totalDocs: 4,
    issue: "Foto kartu keluarga kurang terbaca pada bagian nomor NIK.",
    state: "Perlu dicek",
    priority: "Tinggi",
  },
  {
    id: "SPMB-270166",
    name: "Salsabila Nur Aini",
    initials: "SN",
    level: "SMA",
    school: "SMP Muhammadiyah 3 Bantul",
    route: "Domisili",
    submitted: "17 Jun, 13.05",
    reviewDate: "18 Jun",
    reviewLabel: "Hari ini",
    domicile: "Kasihan, Bantul",
    guardian: "Nurhayati",
    docs: 4,
    totalDocs: 4,
    issue: "Data dan dokumen sesuai. Menunggu rapat penetapan akhir.",
    state: "Siap diputuskan",
    priority: "Normal",
  },
  {
    id: "SPMB-270141",
    name: "Bagas Mahendra Wijaya",
    initials: "BM",
    level: "SMP",
    school: "SD Negeri Kotagede 1",
    route: "Domisili",
    submitted: "16 Jun, 11.26",
    reviewDate: "19 Jun",
    reviewLabel: "Besok",
    domicile: "Kotagede, Yogyakarta",
    guardian: "Arif Wijaya",
    docs: 4,
    totalDocs: 4,
    issue: "Seluruh data telah disahkan pada rapat verifikasi 16 Juni.",
    state: "Tersimpan",
    priority: "Normal",
  },
  {
    id: "SPMB-270128",
    name: "Kiara Ayu Lestari",
    initials: "KA",
    level: "SMK",
    school: "SMP Negeri 1 Wonosari",
    route: "Domisili",
    submitted: "15 Jun, 09.11",
    reviewDate: "19 Jun",
    reviewLabel: "Besok",
    domicile: "Wonosari, Gunungkidul",
    guardian: "Maya Lestari",
    docs: 3,
    totalDocs: 4,
    issue: "Pengecekan alamat pada Kartu Keluarga belum selesai.",
    state: "Perlu dicek",
    priority: "Normal",
  },
  {
    id: "SPMB-270103",
    name: "Fauzan Alfarizi",
    initials: "FA",
    level: "SMP",
    school: "SD Islam Terpadu Luqman Al Hakim",
    route: "Prestasi",
    submitted: "13 Jun, 14.37",
    reviewDate: "20 Jun",
    reviewLabel: "Jumat",
    domicile: "Depok, Sleman",
    guardian: "Hendra Alfarizi",
    docs: 4,
    totalDocs: 4,
    issue: "Tidak memenuhi ketentuan jarak pada jalur yang dipilih.",
    state: "Tersimpan",
    priority: "Normal",
  },
];

const reviewDays = [
  { date: "18", day: "RAB", label: "Hari ini", count: 3 },
  { date: "19", day: "KAM", label: "Besok", count: 2 },
  { date: "20", day: "JUM", label: "Jumat", count: 1 },
  { date: "21", day: "SAB", label: "Sabtu", count: 0 },
];

const stateStyles: Record<ReviewState, { ink: string; bg: string; label: string }> = {
  "Perlu dicek": { ink: "#aa4d3d", bg: "#f7e7df", label: "Butuh perhatian" },
  "Siap diputuskan": { ink: "#987027", bg: "#f7efd5", label: "Siap rapat" },
  Tersimpan: { ink: "#427565", bg: "#e1eee5", label: "Sudah disimpan" },
};

function QueueRow({
  application,
  selected,
  onSelect,
  onAdvance,
}: {
  application: Application;
  selected: boolean;
  onSelect: () => void;
  onAdvance: () => void;
}) {
  const state = stateStyles[application.state];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full border-b border-[#e2ded3] px-4 py-4 text-left transition sm:px-5 ${
        selected ? "bg-[#f8f0df]" : "bg-[#fbf9f2] hover:bg-[#f5f1e7]"
      }`}
      aria-label={`Tinjau pengajuan ${application.name}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] font-['Fraunces'] text-[13px] font-semibold ${
            application.priority === "Tinggi" ? "bg-[#f1d9cd] text-[#a34d3e]" : "bg-[#dceae1] text-[#2d665e]"
          }`}
        >
          {application.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <strong className="truncate text-[12px] font-bold text-[#284544]">{application.name}</strong>
            <span className="shrink-0 font-mono text-[9px] text-[#9b9a8f]">{application.submitted}</span>
          </span>
          <span className="mt-1 block truncate font-mono text-[9px] tracking-[.02em] text-[#96958a]">
            {application.id} · {application.route}
          </span>
          <span className="mt-3 flex items-center gap-2">
            <span className="rounded bg-[#eeeade] px-1.5 py-1 text-[9px] font-bold text-[#607770]">{application.level}</span>
            <span className="flex items-center gap-1 text-[9px] text-[#7c827a]">
              <FileText className="h-3 w-3 text-[#7e9a8a]" />
              {application.docs}/{application.totalDocs} berkas
            </span>
            <span className="ml-auto flex items-center gap-1 text-[9px] font-bold" style={{ color: state.ink }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: state.ink }} />
              {state.label}
            </span>
          </span>
        </span>
        <span className="self-center rounded-md p-1 text-[#acaa9f] opacity-0 transition group-hover:opacity-100" onClick={(event) => { event.stopPropagation(); onAdvance(); }}>
          <MoreHorizontal className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

export function CommitteeDashboardQueueVariant() {
  const [applications, setApplications] = useState(seedApplications);
  const [selectedId, setSelectedId] = useState(seedApplications[0].id);
  const [selectedDay, setSelectedDay] = useState("Hari ini");
  const [stateFilter, setStateFilter] = useState<"Semua status" | ReviewState>("Semua status");
  const [levelFilter, setLevelFilter] = useState<"Semua jenjang" | Level>("Semua jenjang");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAgenda, setShowAgenda] = useState(true);
  const [mobileInspector, setMobileInspector] = useState(false);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 480);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleApplications = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesDate = application.reviewLabel === selectedDay;
      const matchesQuery = !normalized || `${application.name} ${application.id} ${application.school}`.toLowerCase().includes(normalized);
      const matchesState = stateFilter === "Semua status" || application.state === stateFilter;
      const matchesLevel = levelFilter === "Semua jenjang" || application.level === levelFilter;
      return matchesDate && matchesQuery && matchesState && matchesLevel;
    });
  }, [applications, levelFilter, query, selectedDay, stateFilter]);

  const selected = applications.find((application) => application.id === selectedId) ?? null;
  const needsAttention = applications.filter((application) => application.state === "Perlu dicek").length;
  const readyCount = applications.filter((application) => application.state === "Siap diputuskan").length;
  const storedCount = applications.filter((application) => application.state === "Tersimpan").length;

  const advance = (id: string) => {
    setApplications((current) =>
      current.map((application) => {
        if (application.id !== id) return application;
        const nextState: ReviewState = application.state === "Perlu dicek" ? "Siap diputuskan" : application.state === "Siap diputuskan" ? "Tersimpan" : "Tersimpan";
        return { ...application, state: nextState, priority: nextState === "Perlu dicek" ? application.priority : "Normal" };
      }),
    );
    const item = applications.find((application) => application.id === id);
    if (item) setNotice(`${item.name} dipindahkan ke tahap berikutnya.`);
  };

  const refresh = () => {
    setIsLoading(true);
    setHasError(false);
    window.setTimeout(() => {
      if (query.toLowerCase() === "error") setHasError(true);
      else {
        setIsLoading(false);
        setNotice("Agenda verifikasi sudah diperbarui.");
      }
    }, 700);
  };

  const clearFilters = () => {
    setQuery("");
    setStateFilter("Semua status");
    setLevelFilter("Semua jenjang");
  };

  return (
    <div className="min-h-[100dvh] bg-[#e9e5d9] text-[#284544]">
      <style>{`
        @keyframes queue-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes queue-shimmer { 0% { background-position: 120% 0 } 100% { background-position: -120% 0 } }
        .queue-in { animation: queue-in .48s cubic-bezier(.22,.8,.25,1) both }
        .queue-delay { animation-delay: .1s }
        .queue-skeleton { background: linear-gradient(100deg,#dfdbd0 20%,#f2eee5 38%,#dfdbd0 56%); background-size: 200% 100%; animation: queue-shimmer 1.3s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .queue-in, .queue-skeleton { animation: none } }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-[#0d3539] bg-[#123f43] text-[#f8f3e8]">
        <div className="mx-auto flex min-h-[70px] max-w-[1530px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Buka menu" className="rounded-lg p-2 text-[#d4e2d8] hover:bg-[#28595a] lg:hidden" onClick={() => setShowAgenda((open) => !open)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="grid h-10 w-10 place-items-center rounded-[13px_13px_5px_13px] border border-[#e6b751]/80 text-[#e6bd58]">
              <span className="font-['Fraunces'] text-xl font-semibold">S</span>
            </div>
            <div>
              <p className="m-0 text-[13px] font-bold tracking-[.2em]">SPMB</p>
              <p className="m-0 mt-1 text-[10px] tracking-[.05em] text-[#b4cbc3]">Ruang keputusan panitia</p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-[11px] text-[#aac3b9] lg:flex">
            <button type="button" className="border-b-2 border-[#e8b956] py-6 font-bold text-[#f7e7b9]" onClick={() => setNotice("Anda sedang berada di antrean review.")}>Antrean review</button>
            <button type="button" className="py-6 hover:text-[#f7e7b9]" onClick={() => setNotice("Agenda rapat hari ini: 14.00 WIB.")}>Agenda rapat</button>
            <button type="button" className="py-6 hover:text-[#f7e7b9]" onClick={() => setNotice("Panduan verifikasi dibuka.")}>Panduan</button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-5">
            <button type="button" aria-label="Notifikasi" className="relative rounded-lg p-2 text-[#b9d0c7] hover:bg-[#28585a] hover:text-[#f5dfaa]" onClick={() => setNotice("Tidak ada notifikasi baru.")}>
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#edbe52]" />
            </button>
            <div className="hidden items-center gap-2.5 border-l border-[#5e8780]/40 pl-5 sm:flex">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#e6b85a] text-[11px] font-bold text-[#173f43]">DW</div>
              <div className="leading-tight"><p className="m-0 text-[11px] font-bold">Dewi Wulandari</p><p className="m-0 mt-1 text-[10px] text-[#a9c1b7]">Koordinator</p></div>
              <ChevronDown className="h-3.5 w-3.5 text-[#94b2a9]" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1530px] px-5 pb-12 pt-7 sm:px-8 lg:px-12 lg:pt-10">
        <div className="queue-in mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#b55341]">
              <span className="h-px w-7 bg-current" />Agenda pemeriksaan · 2027 / 2028
            </div>
            <h1 className="m-0 max-w-[720px] font-['Fraunces'] text-[clamp(2.25rem,5vw,4.6rem)] font-semibold leading-[.94] tracking-[-.065em] text-[#173f43]">
              Review berdasarkan <span className="text-[#b55341]">waktu.</span>
            </h1>
            <p className="mt-4 max-w-[600px] text-[13px] leading-6 text-[#74756b] sm:text-[14px]">
              Bukan memindahkan kartu. Pilih sesi, baca satu pengajuan dengan utuh, lalu simpan keputusan yang bisa dipertanggungjawabkan.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <div className="hidden h-[68px] w-[68px] -rotate-6 flex-col items-center justify-center rounded-full border border-[#c9a545] text-[#a07020] sm:flex">
              <Sparkles className="mb-1 h-4 w-4" /><span className="font-mono text-[8px] uppercase tracking-[.14em]">Fokus</span>
            </div>
            <div className="border-l border-[#d0ccc0] pl-4">
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#99988e]">Rabu, 18 Juni 2026</p>
              <p className="m-0 mt-2 text-[12px] text-[#696c63]">Rapat berikutnya <strong className="text-[#365d5a]">14.00 WIB</strong></p>
            </div>
          </div>
        </div>

        <section className="queue-in queue-delay mb-7 grid overflow-hidden rounded-[16px] border border-[#d5d1c5] bg-[#f8f5ec] shadow-[0_15px_45px_rgba(34,61,57,.07)] sm:grid-cols-4">
          <div className="border-b border-[#d5d1c5] px-5 py-5 sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#7a7b71]"><span>Antrean hari ini</span><Inbox className="h-4 w-4 text-[#9c9b8d]" /></div>
            <p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">{applications.filter((item) => item.reviewLabel === "Hari ini").length}</p>
            <p className="m-0 mt-1 text-[10px] text-[#929188]">pengajuan terjadwal</p>
          </div>
          <button type="button" onClick={() => setStateFilter(stateFilter === "Perlu dicek" ? "Semua status" : "Perlu dicek")} className={`border-b border-[#d5d1c5] px-5 py-5 text-left transition hover:bg-[#fbefe6] sm:border-b-0 sm:border-r ${stateFilter === "Perlu dicek" ? "bg-[#fbefe6]" : ""}`}>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#9b5544]"><span>Perlu dicek</span><Flag className="h-4 w-4" /></div>
            <p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">{String(needsAttention).padStart(2, "0")}</p>
            <p className="m-0 mt-1 text-[10px] text-[#929188]">filter antrean</p>
          </button>
          <button type="button" onClick={() => setStateFilter(stateFilter === "Siap diputuskan" ? "Semua status" : "Siap diputuskan")} className={`border-b border-[#d5d1c5] px-5 py-5 text-left transition hover:bg-[#f5efd9] sm:border-b-0 sm:border-r ${stateFilter === "Siap diputuskan" ? "bg-[#f5efd9]" : ""}`}>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#987529]"><span>Siap rapat</span><Clock3 className="h-4 w-4" /></div>
            <p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">{String(readyCount).padStart(2, "0")}</p>
            <p className="m-0 mt-1 text-[10px] text-[#929188]">menunggu keputusan</p>
          </button>
          <button type="button" onClick={() => setStateFilter(stateFilter === "Tersimpan" ? "Semua status" : "Tersimpan")} className={`px-5 py-5 text-left transition hover:bg-[#e6f0e7] ${stateFilter === "Tersimpan" ? "bg-[#e6f0e7]" : ""}`}>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#4c7c6d]"><span>Tersimpan</span><Archive className="h-4 w-4" /></div>
            <p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">{String(storedCount).padStart(2, "0")}</p>
            <p className="m-0 mt-1 text-[10px] text-[#929188]">keputusan dicatat</p>
          </button>
        </section>

        <section className="overflow-hidden rounded-[18px] border border-[#d5d1c5] bg-[#f5f2e9] shadow-[0_15px_45px_rgba(34,61,57,.07)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#dedbd0] bg-[#f8f5ec] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#b55341]"><CalendarDays className="h-3.5 w-3.5" />Ritme pemeriksaan</div>
              <h2 className="m-0 font-['Fraunces'] text-[26px] font-semibold tracking-[-.04em] text-[#173f43]">Pilih sesi, mulai dari yang penting.</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-[#e8e3d7] px-2.5 py-1.5 font-mono text-[10px] text-[#88887e] sm:inline">{visibleApplications.length} tampil</span>
              <button type="button" className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-bold transition ${showFilters ? "border-[#4d8175] bg-[#e6f0e7] text-[#2b625d]" : "border-[#d4d1c5] bg-[#fbf9f2] text-[#60726b] hover:border-[#8aafa0]"}`} onClick={() => setShowFilters((open) => !open)}><SlidersHorizontal className="h-3.5 w-3.5" />Saring</button>
              <button type="button" aria-label="Segarkan antrean" className="grid h-9 w-9 place-items-center rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] text-[#60726b] transition hover:border-[#8aafa0] hover:text-[#285b59]" onClick={refresh}><RotateCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /></button>
            </div>
          </div>

          {showFilters && <div className="flex flex-col gap-3 border-b border-[#dedbd0] bg-[#f1eee4] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8d9086]" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Cari nama, nomor, atau sekolah" className="h-9 w-full rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] pl-9 pr-3 text-[11px] outline-none focus:border-[#527d75] focus:ring-2 focus:ring-[#527d75]/15" /></div>
            <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as "Semua jenjang" | Level)} className="h-9 rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] px-3 text-[11px] text-[#4e5d59] outline-none"><option>Semua jenjang</option><option>SMP</option><option>SMA</option><option>SMK</option></select>
            <button type="button" className="h-9 rounded-lg px-3 text-[10px] font-bold text-[#52746e] hover:bg-[#e3ede5]" onClick={clearFilters}>Bersihkan</button>
          </div>}

          <div className="grid min-h-[520px] lg:grid-cols-[190px_minmax(320px,390px)_minmax(0,1fr)]">
            <aside className={`${showAgenda ? "block" : "hidden"} border-b border-[#dedbd0] bg-[#eeebe1] p-4 lg:block lg:border-b-0 lg:border-r`}>
              <div className="mb-4 flex items-center justify-between"><p className="m-0 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#898a80]">Agenda</p><button type="button" aria-label="Tutup agenda" className="rounded p-1 text-[#99998e] hover:bg-[#e1ded2] lg:hidden" onClick={() => setShowAgenda(false)}><X className="h-3.5 w-3.5" /></button></div>
              <div className="space-y-2">
                {reviewDays.map((day) => <button key={day.label} type="button" onClick={() => { setSelectedDay(day.label); setMobileInspector(false); }} className={`w-full rounded-[11px] border p-3 text-left transition ${selectedDay === day.label ? "border-[#2f6661] bg-[#e0ece3] shadow-[0_5px_12px_rgba(57,99,86,.08)]" : "border-transparent hover:border-[#d4d0c4] hover:bg-[#f6f3ea]"}`}>
                  <div className="flex items-start justify-between"><span className={`font-mono text-[9px] font-bold tracking-[.12em] ${selectedDay === day.label ? "text-[#2f6962]" : "text-[#999a90]"}`}>{day.day}</span><span className={`font-['Fraunces'] text-[23px] leading-none ${selectedDay === day.label ? "text-[#173f43]" : "text-[#747970]"}`}>{day.date}</span></div>
                  <div className="mt-3 flex items-center justify-between"><span className={`text-[10px] font-bold ${selectedDay === day.label ? "text-[#3f756b]" : "text-[#7c8179]"}`}>{day.label}</span><span className="font-mono text-[9px] text-[#92938a]">{day.count} item</span></div>
                </button>)}
              </div>
              <div className="mt-7 border-t border-[#d8d4c8] pt-4"><p className="m-0 text-[10px] font-bold text-[#627269]">Rapat penetapan</p><p className="m-0 mt-2 text-[11px] leading-5 text-[#8a8b81]">Jumat, 20 Juni<br /><strong className="font-mono text-[10px] text-[#55736d]">14.00 · Ruang Sidang 2</strong></p></div>
            </aside>

            <section className="border-b border-[#dedbd0] bg-[#fbf9f2] lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between border-b border-[#e2ded3] px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-[#5e8678]" /><div><p className="m-0 text-[11px] font-bold text-[#355853]">Antrean {selectedDay.toLowerCase()}</p><p className="m-0 mt-0.5 font-mono text-[9px] text-[#9a9a90]">Urut: prioritas lalu waktu masuk</p></div></div>
                <button type="button" aria-label="Buka panel agenda" className="rounded-md p-1.5 text-[#8f9188] hover:bg-[#ebe8de] lg:hidden" onClick={() => setShowAgenda(true)}><PanelLeft className="h-3.5 w-3.5" /></button>
              </div>
              {isLoading ? <div className="space-y-3 p-4"><div className="queue-skeleton h-3 w-32 rounded" />{[1, 2, 3].map((item) => <div key={item} className="rounded-[12px] border border-[#e5e1d6] p-4"><div className="flex gap-3"><div className="queue-skeleton h-9 w-9 rounded-[11px]" /><div className="flex-1"><div className="queue-skeleton h-3 w-3/4 rounded" /><div className="queue-skeleton mt-2 h-2 w-1/2 rounded" /></div></div><div className="queue-skeleton mt-5 h-2 w-full rounded" /></div>)}</div> : hasError ? <div className="grid min-h-[430px] place-items-center px-6 text-center"><div><div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full border border-[#d4aa8f] text-[#b55341]"><RotateCcw className="h-5 w-5" /></div><h3 className="m-0 font-['Fraunces'] text-[20px] text-[#173f43]">Antrean belum siap</h3><p className="mt-2 text-[11px] leading-5 text-[#85867b]">Ada gangguan saat mengambil agenda.</p><button type="button" className="mt-4 rounded-lg bg-[#1f5a5b] px-4 py-2.5 text-[11px] font-bold text-[#f7f3e9]" onClick={refresh}>Coba lagi</button></div></div> : visibleApplications.length ? <div>{visibleApplications.map((application) => <QueueRow key={application.id} application={application} selected={selectedId === application.id} onSelect={() => { setSelectedId(application.id); setMobileInspector(true); }} onAdvance={() => advance(application.id)} />)}</div> : <div className="grid min-h-[430px] place-items-center px-6 text-center"><div><CheckCircle2 className="mx-auto h-7 w-7 text-[#82a18e]" /><h3 className="m-0 mt-3 font-['Fraunces'] text-[20px] text-[#173f43]">Sesi ini lega.</h3><p className="mx-auto mt-2 max-w-[220px] text-[11px] leading-5 text-[#85867b]">Tidak ada pengajuan yang cocok dengan saringan ini.</p><button type="button" className="mt-4 text-[11px] font-bold text-[#4f756d] hover:text-[#173f43]" onClick={clearFilters}>Bersihkan saringan</button></div></div>}
            </section>

            <section className={`${mobileInspector ? "block" : "hidden"} bg-[#f8f5ec] lg:block`}>
              {selected ? <div className="h-full">
                <div className="flex items-start justify-between gap-4 border-b border-[#dedbd0] px-5 py-5 sm:px-7">
                  <div><p className="m-0 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#b55341]"><FileCheck2 className="h-3.5 w-3.5" />Lembar keputusan</p><h2 className="m-0 mt-2 font-['Fraunces'] text-[29px] font-semibold leading-none tracking-[-.045em] text-[#173f43]">{selected.name}</h2><p className="m-0 mt-2 font-mono text-[9px] text-[#92938a]">{selected.id} · masuk {selected.submitted}</p></div>
                  <button type="button" aria-label="Tutup inspeksi" className="rounded-lg p-2 text-[#818a81] hover:bg-[#e9ede3] lg:hidden" onClick={() => setMobileInspector(false)}><X className="h-4 w-4" /></button>
                </div>
                <div className="px-5 py-5 sm:px-7">
                  <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-[#e8e4d9] px-2 py-1 font-mono text-[9px] font-bold text-[#58736c]">{selected.level}</span><span className="rounded bg-[#e8e4d9] px-2 py-1 text-[9px] font-bold text-[#58736c]">{selected.route}</span><span className="flex items-center gap-1 rounded bg-[#f7e7df] px-2 py-1 text-[9px] font-bold text-[#aa4d3d]"><Flag className="h-3 w-3 fill-current" />{selected.priority}</span></div>
                  <div className="mt-6 rounded-[13px] border border-[#d8d4c8] bg-[#f0ede3] p-4"><div className="flex items-center justify-between"><p className="m-0 font-mono text-[9px] font-bold uppercase tracking-[.11em] text-[#888a80]">Catatan pemeriksaan</p><span className="font-mono text-[9px] text-[#9a9a90]">1 / 3</span></div><p className="m-0 mt-3 text-[13px] leading-6 text-[#557069]">{selected.issue}</p></div>
                  <dl className="mt-7 grid grid-cols-2 gap-x-5 gap-y-5"><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Sekolah asal</dt><dd className="m-0 mt-1 text-[12px] leading-5 text-[#253d3e]">{selected.school}</dd></div><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Domisili</dt><dd className="m-0 mt-1 text-[12px] leading-5 text-[#253d3e]">{selected.domicile}</dd></div><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Wali murid</dt><dd className="m-0 mt-1 flex items-center gap-1.5 text-[12px] text-[#253d3e]"><UserRound className="h-3 w-3 text-[#779589]" />{selected.guardian}</dd></div><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Jadwal review</dt><dd className="m-0 mt-1 flex items-center gap-1.5 text-[12px] text-[#253d3e]"><CalendarDays className="h-3 w-3 text-[#779589]" />{selected.reviewLabel}</dd></div></dl>
                  <div className="mt-7 border-t border-[#dedbd0] pt-5"><div className="mb-3 flex items-center justify-between"><p className="m-0 text-[11px] font-bold text-[#49665f]">Kelengkapan berkas</p><span className="font-mono text-[10px] font-bold text-[#557b70]">{selected.docs}/{selected.totalDocs}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#e3dfd3]"><div className="h-full rounded-full bg-[#5d8b79]" style={{ width: `${(selected.docs / selected.totalDocs) * 100}%` }} /></div><div className="mt-4 grid grid-cols-2 gap-2">{["Kartu Keluarga", "Akta kelahiran", "Rapor semester 5", "Surat domisili"].map((document, index) => { const available = index < selected.docs; return <div key={document} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${available ? "border-[#d3d8ca] bg-[#f4f5ec]" : "border-dashed border-[#d8d5ca] bg-[#efebe2]"}`}><span className={`grid h-5 w-5 place-items-center rounded ${available ? "bg-[#dcebe0] text-[#4e806f]" : "bg-[#e3dfd5] text-[#a3a39a]"}`}>{available ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}</span><span className={`truncate text-[9px] font-bold ${available ? "text-[#52756d]" : "text-[#999a91]"}`}>{document}</span></div>; })}</div></div>
                  <div className="mt-7 flex flex-col gap-2 sm:flex-row"><button type="button" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1f5a5b] py-3 text-[11px] font-bold text-[#f7f3e9] transition hover:bg-[#164849]" onClick={() => advance(selected.id)}><CheckCircle2 className="h-3.5 w-3.5" />Tandai selesai</button><button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d1cec2] bg-[#fbf9f2] px-4 py-3 text-[11px] font-bold text-[#62736d] transition hover:border-[#8aafa0]" onClick={() => setNotice("Pengajuan ditandai untuk dibahas di rapat.")}><Clock3 className="h-3.5 w-3.5" />Bahas di rapat</button></div>
                </div>
              </div> : <div className="grid h-full min-h-[520px] place-items-center text-center"><div><Inbox className="mx-auto h-7 w-7 text-[#9aa69d]" /><p className="mt-3 text-[12px] font-bold text-[#6e7d75]">Pilih satu pengajuan</p></div></div>}
            </section>
          </div>
          <div className="flex flex-col justify-between gap-2 border-t border-[#dedbd0] bg-[#f2eee3] px-5 py-3 text-[10px] text-[#898a80] sm:flex-row sm:items-center sm:px-6"><span className="flex items-center gap-2"><Keyboard className="h-3.5 w-3.5 text-[#5b8878]" />Tip: gunakan ↑ ↓ untuk berpindah antrean</span><button type="button" className="flex items-center gap-1 font-bold text-[#4f756d] hover:text-[#173f43]" onClick={() => setNotice("Seluruh agenda tersimpan secara lokal.")}>Status sinkron <Check className="h-3 w-3" /></button></div>
        </section>
        <footer className="mt-9 flex flex-col justify-between gap-3 border-t border-[#d2cec2] pt-5 text-[10px] text-[#8e8d83] sm:flex-row sm:items-center"><p className="m-0">SPMB 2027/2028 · Agenda keputusan panitia</p><p className="m-0 font-mono text-[#638077]">Akses internal · aman</p></footer>
      </main>
      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-full border border-[#406e68] bg-[#173f43] px-4 py-3 text-[11px] font-bold text-[#f7f1e4] shadow-[0_12px_28px_rgba(18,52,52,.24)]"><Check className="h-3.5 w-3.5 shrink-0 text-[#edbe52]" /><span className="truncate">{notice}</span></div>}
    </div>
  );
}