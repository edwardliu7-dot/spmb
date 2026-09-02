import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Flag,
  LayoutGrid,
  ListFilter,
  MapPin,
  Menu,
  MoreHorizontal,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type Lane = "Perlu perhatian" | "Sedang dicek" | "Selesai";
type Level = "SMP" | "SMA" | "SMK";

type Candidate = {
  id: string;
  name: string;
  initials: string;
  level: Level;
  school: string;
  submitted: string;
  domicile: string;
  guardian: string;
  route: string;
  docs: number;
  totalDocs: number;
  note: string;
  lane: Lane;
  urgent?: boolean;
};

const seedCandidates: Candidate[] = [
  { id: "SPMB-270184", name: "Naila Putri Ramadhani", initials: "NP", level: "SMA", school: "SMP Negeri 5 Yogyakarta", submitted: "08.42 WIB", domicile: "Umbulharjo, Yogyakarta", guardian: "Rina Wulandari", route: "Domisili", docs: 3, totalDocs: 4, note: "Rapor semester terakhir menunggu pengecekan silang.", lane: "Perlu perhatian", urgent: true },
  { id: "SPMB-270179", name: "Raka Aditya Pranowo", initials: "RA", level: "SMK", school: "SMP Negeri 2 Sleman", submitted: "Kemarin, 16.18", domicile: "Ngaglik, Sleman", guardian: "Dwi Prasetyo", route: "Afirmasi", docs: 3, totalDocs: 4, note: "Foto kartu keluarga kurang terbaca pada bagian nomor NIK.", lane: "Perlu perhatian", urgent: true },
  { id: "SPMB-270128", name: "Kiara Ayu Lestari", initials: "KA", level: "SMK", school: "SMP Negeri 1 Wonosari", submitted: "15 Juni, 09.11", domicile: "Wonosari, Gunungkidul", guardian: "Maya Lestari", route: "Domisili", docs: 3, totalDocs: 4, note: "Pengecekan alamat pada Kartu Keluarga belum selesai.", lane: "Perlu perhatian" },
  { id: "SPMB-270166", name: "Salsabila Nur Aini", initials: "SN", level: "SMA", school: "SMP Muhammadiyah 3 Bantul", submitted: "17 Juni, 13.05", domicile: "Kasihan, Bantul", guardian: "Nurhayati", route: "Domisili", docs: 4, totalDocs: 4, note: "Data dan dokumen sesuai. Menunggu rapat penetapan akhir.", lane: "Sedang dicek" },
  { id: "SPMB-270141", name: "Bagas Mahendra Wijaya", initials: "BM", level: "SMP", school: "SD Negeri Kotagede 1", submitted: "16 Juni, 11.26", domicile: "Kotagede, Yogyakarta", guardian: "Arif Wijaya", route: "Domisili", docs: 4, totalDocs: 4, note: "Seluruh data telah disahkan pada rapat verifikasi 16 Juni.", lane: "Selesai" },
  { id: "SPMB-270103", name: "Fauzan Alfarizi", initials: "FA", level: "SMP", school: "SD Islam Terpadu Luqman Al Hakim", submitted: "13 Juni, 14.37", domicile: "Depok, Sleman", guardian: "Hendra Alfarizi", route: "Prestasi", docs: 4, totalDocs: 4, note: "Tidak memenuhi ketentuan jarak pada jalur yang dipilih.", lane: "Selesai" },
];

const lanes: { name: Lane; eyebrow: string; accent: string; tint: string }[] = [
  { name: "Perlu perhatian", eyebrow: "Antrian Anda", accent: "#b55341", tint: "#fbebe2" },
  { name: "Sedang dicek", eyebrow: "Dalam proses", accent: "#b4842b", tint: "#f8efd1" },
  { name: "Selesai", eyebrow: "Sudah ditetapkan", accent: "#4d8474", tint: "#e0eee5" },
];

function LaneCard({
  candidate,
  onSelect,
  selected,
  onAdvance,
}: {
  candidate: Candidate;
  onSelect: () => void;
  selected: boolean;
  onAdvance: () => void;
}) {
  return (
    <article
      className={`group cursor-pointer rounded-[14px] border bg-[#fbf9f1] p-4 shadow-[0_8px_20px_rgba(39,65,58,.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[#7a9e8b] hover:shadow-[0_12px_26px_rgba(39,65,58,.1)] ${selected ? "border-[#1f5a5b] ring-2 ring-[#1f5a5b]/10" : "border-[#ddd9cd]"}`}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(); }}
      role="button"
      aria-label={`Buka pengajuan ${candidate.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] font-['Fraunces'] text-[14px] font-semibold ${candidate.urgent ? "bg-[#f3dccd] text-[#a94f3e]" : "bg-[#dcebe3] text-[#27645e]"}`}>{candidate.initials}</span>
          <div className="min-w-0">
            <h3 className="m-0 truncate text-[12px] font-bold text-[#294646]">{candidate.name}</h3>
            <p className="m-0 mt-1 truncate font-mono text-[9px] tracking-[.02em] text-[#98978c]">{candidate.id}</p>
          </div>
        </div>
        <button type="button" aria-label={`Opsi ${candidate.name}`} className="rounded-md p-1 text-[#a2a49a] opacity-70 transition hover:bg-[#e9ede3] hover:text-[#285b59] group-hover:opacity-100" onClick={(event) => { event.stopPropagation(); onAdvance(); }}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[10px] text-[#747b70]">
        <span className="rounded bg-[#ece9df] px-2 py-1 font-bold text-[#58736c]">{candidate.level}</span>
        <span className="truncate">{candidate.route}</span>
        <span className="ml-auto shrink-0 font-mono text-[9px] text-[#9b9b90]">{candidate.submitted}</span>
      </div>
      <p className="mt-3 truncate text-[10px] text-[#7c8177]"><MapPin className="mr-1 inline h-3 w-3 text-[#7b9a89]" />{candidate.domicile}</p>
      <div className="mt-4 flex items-center justify-between border-t border-[#e7e3d8] pt-3">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#55756b]"><FileText className="h-3.5 w-3.5" />{candidate.docs}/{candidate.totalDocs} berkas</span>
        {candidate.urgent && <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#b55341]"><Flag className="h-3 w-3 fill-current" />Prioritas</span>}
      </div>
    </article>
  );
}

export function CommitteeDashboardVariant() {
  const [candidates, setCandidates] = useState(seedCandidates);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"Semua jenjang" | Level>("Semua jenjang");
  const [activeLane, setActiveLane] = useState<"Semua" | Lane>("Semua");
  const [showFilters, setShowFilters] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"Ringkasan" | "Berkas">("Ringkasan");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 520);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleCandidates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return candidates.filter((candidate) => {
      const matchesText = !normalized || `${candidate.name} ${candidate.id} ${candidate.school}`.toLowerCase().includes(normalized);
      const matchesLevel = level === "Semua jenjang" || candidate.level === level;
      const matchesLane = activeLane === "Semua" || candidate.lane === activeLane;
      return matchesText && matchesLevel && matchesLane;
    });
  }, [activeLane, candidates, level, query]);

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null;
  const attentionCount = candidates.filter((candidate) => candidate.lane === "Perlu perhatian").length;
  const completedCount = candidates.filter((candidate) => candidate.lane === "Selesai").length;

  const moveCandidate = (id: string, nextLane: Lane) => {
    setCandidates((current) => current.map((candidate) => candidate.id === id ? { ...candidate, lane: nextLane, urgent: nextLane === "Perlu perhatian" ? candidate.urgent : false } : candidate));
    const candidate = candidates.find((item) => item.id === id);
    if (candidate) setNotice(`${candidate.name} dipindahkan ke ${nextLane.toLowerCase()}.`);
  };

  const refresh = () => {
    setIsLoading(true);
    setHasError(false);
    window.setTimeout(() => {
      if (query === "error") setHasError(true);
      else { setIsLoading(false); setNotice("Papan kerja sudah diperbarui."); }
    }, 700);
  };

  return (
    <div className="min-h-[100dvh] bg-[#ebe8de] text-[#294646]">
      <style>{`
        @keyframes board-rise { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes board-shimmer { 0% { background-position:120% 0 } 100% { background-position:-120% 0 } }
        .board-rise { animation:board-rise .5s cubic-bezier(.22,.8,.25,1) both }
        .board-delay-1 { animation-delay:.08s } .board-delay-2 { animation-delay:.16s }
        .board-skeleton { background:linear-gradient(100deg,#dfdcd1 20%,#f3f0e7 38%,#dfdcd1 56%); background-size:200% 100%; animation:board-shimmer 1.3s ease-in-out infinite }
        @media (prefers-reduced-motion:reduce) { .board-rise,.board-skeleton { animation:none } }
      `}</style>
      <header className="sticky top-0 z-40 border-b border-[#0d3539] bg-[#123f43] text-[#f8f3e8]">
        <div className="mx-auto flex min-h-[72px] max-w-[1530px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Buka navigasi" className="rounded-lg p-2 text-[#d8e5d9] hover:bg-[#28585a] lg:hidden" onClick={() => setMobileNav((open) => !open)}><Menu className="h-5 w-5" /></button>
            <div className="grid h-10 w-10 place-items-center rounded-[13px_13px_5px_13px] border border-[#edb84b]/70 text-[#edbe52]"><span className="font-['Fraunces'] text-xl font-semibold">S</span></div>
            <div><p className="m-0 text-[13px] font-bold tracking-[.2em]">SPMB</p><p className="m-0 mt-1 text-[10px] tracking-[.05em] text-[#b5cbc3]">Workboard panitia</p></div>
          </div>
          <nav className="hidden items-center gap-6 text-[11px] text-[#aac3b9] lg:flex">
            <button type="button" className="border-b-2 border-[#e8b956] py-7 font-bold text-[#f7e7b9]" onClick={() => setNotice("Anda sedang berada di papan kerja.")}>Papan kerja</button>
            <button type="button" className="py-7 hover:text-[#f7e7b9]" onClick={() => setNotice("Agenda rapat belum memiliki perubahan.")}>Agenda rapat</button>
            <button type="button" className="py-7 hover:text-[#f7e7b9]" onClick={() => setNotice("Panduan verifikasi dibuka.")}>Panduan</button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-5">
            <button type="button" aria-label="Notifikasi" className="relative rounded-lg p-2 text-[#b9d0c7] hover:bg-[#28585a] hover:text-[#f5dfaa]" onClick={() => setNotice("Tidak ada notifikasi baru.")}><Bell className="h-[18px] w-[18px]" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#edbe52]" /></button>
            <div className="hidden items-center gap-2.5 border-l border-[#5e8780]/40 pl-5 sm:flex"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#e6b85a] text-[11px] font-bold text-[#173f43]">DW</div><div className="leading-tight"><p className="m-0 text-[11px] font-bold">Dewi Wulandari</p><p className="m-0 mt-1 text-[10px] text-[#a9c1b7]">Koordinator</p></div><ChevronDown className="h-3.5 w-3.5 text-[#94b2a9]" /></div>
          </div>
        </div>
        {mobileNav && <div className="border-t border-[#396468] bg-[#10383c] px-5 py-3 lg:hidden"><div className="flex gap-2 text-[11px]"><button type="button" className="rounded-md bg-[#e8b956] px-3 py-2 font-bold text-[#173f43]" onClick={() => setMobileNav(false)}>Papan kerja</button><button type="button" className="rounded-md px-3 py-2 text-[#d6e5da]" onClick={() => { setMobileNav(false); setNotice("Agenda rapat belum memiliki perubahan."); }}>Agenda rapat</button></div></div>}
      </header>

      <main className="mx-auto max-w-[1530px] px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pt-11">
        <div className="board-rise mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#b55341]"><span className="h-px w-7 bg-current" />Papan triase · tahun ajaran 2027 / 2028</div>
            <h1 className="m-0 max-w-[760px] font-['Fraunces'] text-[clamp(2.35rem,5.4vw,4.8rem)] font-semibold leading-[.94] tracking-[-.065em] text-[#173f43]">Kerjakan yang <span className="text-[#b55341]">paling penting.</span></h1>
            <p className="mt-4 max-w-[620px] text-[13px] leading-6 text-[#74756b] sm:text-[14px]">Satu papan untuk memindahkan pengajuan dari antrian, ke pemeriksaan, sampai keputusan akhir.</p>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-auto"><div className="hidden h-[68px] w-[68px] rotate-6 flex-col items-center justify-center rounded-full border border-[#c9a545] text-[#a07020] sm:flex"><Sparkles className="mb-1 h-4 w-4" /><span className="font-mono text-[8px] uppercase tracking-[.14em]">Fokus</span></div><div className="border-l border-[#d2cec1] pl-4"><p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#99988e]">Rabu, 18 Juni 2026</p><p className="m-0 mt-2 text-[12px] text-[#696c63]">Sinkronisasi <strong className="text-[#365d5a]">08.35 WIB</strong></p></div></div>
        </div>

        <section className="board-rise board-delay-1 mb-7 grid overflow-hidden rounded-[16px] border border-[#d6d2c6] bg-[#f8f5ec] shadow-[0_15px_45px_rgba(34,61,57,.07)] sm:grid-cols-4">
          <div className="border-b border-[#d6d2c6] px-5 py-5 sm:border-b-0 sm:border-r"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#7a7b71]"><span>Total masuk</span><Users className="h-4 w-4 text-[#9c9b8d]" /></div><p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">128</p><p className="m-0 mt-1 text-[10px] text-[#929188]">SMP, SMA, dan SMK</p></div>
          <button type="button" className={`border-b border-[#d6d2c6] px-5 py-5 text-left transition hover:bg-[#fbefe6] sm:border-b-0 sm:border-r ${activeLane === "Perlu perhatian" ? "bg-[#fbefe6]" : ""}`} onClick={() => setActiveLane(activeLane === "Perlu perhatian" ? "Semua" : "Perlu perhatian")}><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#9b5544]"><span>Perlu perhatian</span><Flag className="h-4 w-4" /></div><p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">{String(attentionCount).padStart(2, "0")}</p><p className="m-0 mt-1 text-[10px] text-[#929188]">Klik untuk memfilter</p></button>
          <button type="button" className={`border-b border-[#d6d2c6] px-5 py-5 text-left transition hover:bg-[#f5efd9] sm:border-b-0 sm:border-r ${activeLane === "Sedang dicek" ? "bg-[#f5efd9]" : ""}`} onClick={() => setActiveLane(activeLane === "Sedang dicek" ? "Semua" : "Sedang dicek")}><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#987529]"><span>Sedang dicek</span><Clock3 className="h-4 w-4" /></div><p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">{String(candidates.filter((candidate) => candidate.lane === "Sedang dicek").length).padStart(2, "0")}</p><p className="m-0 mt-1 text-[10px] text-[#929188]">Klik untuk memfilter</p></button>
          <button type="button" className={`px-5 py-5 text-left transition hover:bg-[#e6f0e7] ${activeLane === "Selesai" ? "bg-[#e6f0e7]" : ""}`} onClick={() => setActiveLane(activeLane === "Selesai" ? "Semua" : "Selesai")}><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#4c7c6d]"><span>Selesai</span><CheckCircle2 className="h-4 w-4" /></div><p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">{String(completedCount).padStart(2, "0")}</p><p className="m-0 mt-1 text-[10px] text-[#929188]">Klik untuk memfilter</p></button>
        </section>

        <section className="board-rise board-delay-2 overflow-hidden rounded-[18px] border border-[#d6d2c6] bg-[#f5f2e9] shadow-[0_15px_45px_rgba(34,61,57,.07)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#dedbd0] bg-[#f8f5ec] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#b55341]"><LayoutGrid className="h-3.5 w-3.5" />Alur pengajuan</div><h2 className="m-0 font-['Fraunces'] text-[26px] font-semibold tracking-[-.04em] text-[#173f43]">Pindahkan, jangan lewatkan.</h2></div>
            <div className="flex items-center gap-2"><span className="hidden rounded-full bg-[#e8e3d7] px-2.5 py-1.5 font-mono text-[10px] text-[#88887e] sm:inline">{visibleCandidates.length} tampil</span><button type="button" className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-bold transition ${showFilters ? "border-[#4d8175] bg-[#e6f0e7] text-[#2b625d]" : "border-[#d4d1c5] bg-[#fbf9f2] text-[#60726b] hover:border-[#8aafa0]"}`} onClick={() => setShowFilters((open) => !open)}><ListFilter className="h-3.5 w-3.5" />Filter</button><button type="button" aria-label="Segarkan papan" className="grid h-9 w-9 place-items-center rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] text-[#60726b] transition hover:border-[#8aafa0] hover:text-[#285b59]" onClick={refresh}><RotateCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /></button></div>
          </div>
          {showFilters && <div className="flex flex-col gap-3 border-b border-[#dedbd0] bg-[#f1eee4] px-5 py-4 sm:flex-row sm:items-center sm:px-6"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8d9086]" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Cari nama, nomor, atau sekolah" className="h-9 w-full rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] pl-9 pr-3 text-[11px] outline-none focus:border-[#527d75] focus:ring-2 focus:ring-[#527d75]/15" /></div><select value={level} onChange={(event) => setLevel(event.target.value as "Semua jenjang" | Level)} className="h-9 rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] px-3 text-[11px] text-[#4e5d59] outline-none"><option>Semua jenjang</option><option>SMP</option><option>SMA</option><option>SMK</option></select><button type="button" className="h-9 rounded-lg px-3 text-[10px] font-bold text-[#52746e] hover:bg-[#e3ede5]" onClick={() => { setQuery(""); setLevel("Semua jenjang"); setActiveLane("Semua"); }}>Bersihkan</button></div>}

          <div className="grid gap-4 overflow-x-auto p-4 sm:p-5 lg:grid-cols-3">
            {isLoading ? [1, 2, 3].map((lane) => <div key={lane} className="min-h-[360px] rounded-[14px] border border-[#dedbd0] bg-[#eeebe1] p-4"><div className="board-skeleton h-3 w-28 rounded" /><div className="board-skeleton mt-3 h-7 w-10 rounded" /><div className="mt-7 space-y-3">{[1, 2].map((card) => <div key={card} className="rounded-[14px] bg-[#f8f5ec] p-4"><div className="flex gap-3"><span className="board-skeleton h-9 w-9 rounded-[10px]" /><div className="flex-1"><div className="board-skeleton h-3 w-3/4 rounded" /><div className="board-skeleton mt-2 h-2 w-1/2 rounded" /></div></div><div className="board-skeleton mt-5 h-2 w-full rounded" /></div>)}</div></div>) : hasError ? <div className="col-span-3 grid min-h-[360px] place-items-center px-8 py-16 text-center"><div><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-[#d4aa8f] text-[#b55341]"><AlertCircle className="h-5 w-5" /></div><h3 className="m-0 font-['Fraunces'] text-[22px] text-[#173f43]">Papan belum bisa dimuat</h3><p className="mx-auto mt-2 max-w-[290px] text-[12px] leading-5 text-[#85867b]">Ada gangguan saat mengambil pembaruan. Coba lagi dalam beberapa saat.</p><button type="button" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1f5a5b] px-4 py-2.5 text-[11px] font-bold text-[#f7f3e9] hover:bg-[#164849]" onClick={refresh}><RotateCcw className="h-3.5 w-3.5" />Coba lagi</button></div></div> : lanes.map((lane) => {
              const laneCandidates = visibleCandidates.filter((candidate) => candidate.lane === lane.name);
              return <div key={lane.name} className="min-w-[280px] rounded-[14px] border border-[#dedbd0] bg-[#eeebe1] p-3.5 sm:min-w-0"><div className="flex items-start justify-between gap-2 border-b border-[#ddd9ce] pb-3"><div><p className="m-0 font-mono text-[9px] font-bold uppercase tracking-[.14em]" style={{ color: lane.accent }}>{lane.eyebrow}</p><h3 className="m-0 mt-1 font-['Fraunces'] text-[19px] font-semibold text-[#234342]">{lane.name}</h3></div><span className="grid h-7 min-w-7 place-items-center rounded-full px-2 font-mono text-[10px] font-bold" style={{ backgroundColor: lane.tint, color: lane.accent }}>{laneCandidates.length}</span></div><div className="mt-3 space-y-3">{laneCandidates.length ? laneCandidates.map((candidate) => <LaneCard key={candidate.id} candidate={candidate} selected={selectedId === candidate.id} onSelect={() => { setSelectedId(candidate.id); setDrawerTab("Ringkasan"); }} onAdvance={() => moveCandidate(candidate.id, candidate.lane === "Perlu perhatian" ? "Sedang dicek" : "Selesai")} />) : <div className="grid min-h-[180px] place-items-center rounded-[12px] border border-dashed border-[#d4d0c4] px-5 text-center"><div><CheckCircle2 className="mx-auto h-6 w-6 text-[#87a694]" /><p className="m-0 mt-2 text-[11px] font-bold text-[#6f8077]">Antrian kosong</p><p className="m-0 mt-1 text-[10px] text-[#999a90]">Bagus, tidak ada yang tertinggal.</p></div></div>}</div></div>;
            })}
          </div>
          <div className="flex flex-col justify-between gap-2 border-t border-[#dedbd0] bg-[#f2eee3] px-5 py-3 text-[10px] text-[#898a80] sm:flex-row sm:items-center sm:px-6"><span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-[#5b8878]" />Papan aktif · pembaruan lokal tersimpan</span><button type="button" className="flex items-center gap-1 font-bold text-[#4f756d] hover:text-[#173f43]" onClick={() => setNotice("Semua pengajuan sudah dimuat dalam workboard ini.")}>Lihat 128 pengajuan <ArrowRight className="h-3 w-3" /></button></div>
        </section>
        <footer className="mt-9 flex flex-col justify-between gap-3 border-t border-[#d2cec2] pt-5 text-[10px] text-[#8e8d83] sm:flex-row sm:items-center"><p className="m-0">SPMB 2027/2028 · Papan triase panitia</p><p className="m-0 font-mono text-[#638077]">Akses internal · aman</p></footer>
      </main>

      {selected && <div className="fixed inset-0 z-50 flex items-end justify-end bg-[#173f43]/20 sm:p-5" onClick={() => setSelectedId("")}><aside className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[20px] border border-[#d6d2c6] bg-[#f8f5ec] shadow-[0_20px_60px_rgba(18,52,52,.25)] sm:max-w-[450px] sm:rounded-[18px]" onClick={(event) => event.stopPropagation()}><div className="sticky top-0 z-10 border-b border-[#dedbd0] bg-[#f8f5ec]/95 px-5 pb-4 pt-5 backdrop-blur sm:px-6"><div className="flex items-start justify-between gap-3"><div><p className="m-0 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#b55341]"><FileText className="h-3.5 w-3.5" />Inspektur pengajuan</p><h2 className="m-0 mt-2 font-['Fraunces'] text-[27px] font-semibold leading-none tracking-[-.045em] text-[#173f43]">{selected.name}</h2><p className="m-0 mt-2 font-mono text-[9px] text-[#8c8d83]">{selected.id} · {selected.submitted}</p></div><button type="button" aria-label="Tutup detail" className="rounded-lg p-2 text-[#7f8980] hover:bg-[#e8ede4] hover:text-[#234342]" onClick={() => setSelectedId("")}><X className="h-4 w-4" /></button></div><div className="mt-5 flex gap-1 border-b border-[#e1ddd2]"><button type="button" className={`border-b-2 px-3 pb-2 text-[11px] font-bold ${drawerTab === "Ringkasan" ? "border-[#b55341] text-[#b55341]" : "border-transparent text-[#92958b]"}`} onClick={() => setDrawerTab("Ringkasan")}>Ringkasan</button><button type="button" className={`border-b-2 px-3 pb-2 text-[11px] font-bold ${drawerTab === "Berkas" ? "border-[#b55341] text-[#b55341]" : "border-transparent text-[#92958b]"}`} onClick={() => setDrawerTab("Berkas")}>Berkas ({selected.docs}/{selected.totalDocs})</button></div></div>
          <div className="px-5 py-5 sm:px-6">{drawerTab === "Ringkasan" ? <><div className="rounded-[12px] border border-[#d7d4c7] bg-[#f0ede3] p-4"><p className="m-0 text-[10px] font-bold uppercase tracking-[.1em] text-[#888a80]">Langkah berikutnya</p><p className="m-0 mt-2 text-[12px] leading-5 text-[#557069]">{selected.note}</p><button type="button" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f5a5b] py-2.5 text-[11px] font-bold text-[#f7f3e9] transition hover:bg-[#164849]" onClick={() => moveCandidate(selected.id, selected.lane === "Perlu perhatian" ? "Sedang dicek" : "Selesai")}><ArrowRight className="h-3.5 w-3.5" />Pindahkan ke tahap berikutnya</button></div><dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5"><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Jenjang</dt><dd className="m-0 mt-1 text-[12px] text-[#253d3e]">{selected.level}</dd></div><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Jalur</dt><dd className="m-0 mt-1 text-[12px] text-[#253d3e]">{selected.route}</dd></div><div className="col-span-2"><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Sekolah asal</dt><dd className="m-0 mt-1 text-[12px] leading-5 text-[#253d3e]">{selected.school}</dd></div><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Wali</dt><dd className="m-0 mt-1 text-[12px] text-[#253d3e]">{selected.guardian}</dd></div><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Domisili</dt><dd className="m-0 mt-1 text-[12px] text-[#253d3e]">{selected.domicile}</dd></div></dl></> : <div className="space-y-2">{["Kartu Keluarga", "Akta kelahiran", "Rapor semester 5", "Surat keterangan domisili"].map((document, index) => { const available = index < selected.docs; return <button key={document} type="button" className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition ${available ? "border-[#d3d8ca] bg-[#f5f5eb] hover:border-[#8aafa0]" : "border-dashed border-[#d8d5ca] bg-[#f1eee5]"}`} onClick={() => available && setNotice(`${document} siap ditinjau.`)}><span className="flex items-center gap-2.5"><span className={`grid h-6 w-6 place-items-center rounded ${available ? "bg-[#dcebe0] text-[#4e806f]" : "bg-[#e7e3d9] text-[#a8a79d]"}`}>{available ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}</span><span><strong className={`block text-[11px] ${available ? "text-[#3c6c66]" : "text-[#9b9c92]"}`}>{document}</strong><small className="mt-0.5 block text-[9px] text-[#999a91]">{available ? "PDF · tersedia" : "Belum diunggah"}</small></span></span><span className="text-[9px] font-bold text-[#6d877c]">{available ? "Buka" : "—"}</span></button>; })}</div>}</div></aside></div>}
      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-full border border-[#406e68] bg-[#173f43] px-4 py-3 text-[11px] font-bold text-[#f7f1e4] shadow-[0_12px_28px_rgba(18,52,52,.24)]"><Check className="h-3.5 w-3.5 shrink-0 text-[#edbe52]" /><span className="truncate">{notice}</span></div>}
    </div>
  );
}