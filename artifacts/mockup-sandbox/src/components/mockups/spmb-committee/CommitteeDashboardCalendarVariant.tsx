import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  Flag,
  ListChecks,
  MapPin,
  Menu,
  MoreHorizontal,
  PanelRight,
  Play,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

type ReviewState = "Menunggu" | "Berlangsung" | "Selesai";
type Level = "SMP" | "SMA" | "SMK";
type Candidate = {
  id: string;
  name: string;
  initials: string;
  level: Level;
  school: string;
  domicile: string;
  guardian: string;
  route: string;
  docs: number;
  totalDocs: number;
  note: string;
  state: ReviewState;
  urgent?: boolean;
};
type Agenda = {
  time: string;
  title: string;
  detail: string;
  tone: "teal" | "amber" | "coral";
  done?: boolean;
};

const seedCandidates: Candidate[] = [
  {
    id: "SPMB-270184",
    name: "Naila Putri Ramadhani",
    initials: "NP",
    level: "SMA",
    school: "SMP Negeri 5 Yogyakarta",
    domicile: "Umbulharjo, Yogyakarta",
    guardian: "Rina Wulandari",
    route: "Domisili",
    docs: 3,
    totalDocs: 4,
    note: "Rapor semester terakhir menunggu pengecekan silang.",
    state: "Menunggu",
    urgent: true,
  },
  {
    id: "SPMB-270179",
    name: "Raka Aditya Pranowo",
    initials: "RA",
    level: "SMK",
    school: "SMP Negeri 2 Sleman",
    domicile: "Ngaglik, Sleman",
    guardian: "Dwi Prasetyo",
    route: "Afirmasi",
    docs: 3,
    totalDocs: 4,
    note: "Foto kartu keluarga kurang terbaca pada bagian nomor NIK.",
    state: "Menunggu",
    urgent: true,
  },
  {
    id: "SPMB-270166",
    name: "Salsabila Nur Aini",
    initials: "SN",
    level: "SMA",
    school: "SMP Muhammadiyah 3 Bantul",
    domicile: "Kasihan, Bantul",
    guardian: "Nurhayati",
    route: "Domisili",
    docs: 4,
    totalDocs: 4,
    note: "Data dan dokumen sesuai. Menunggu rapat penetapan akhir.",
    state: "Berlangsung",
  },
  {
    id: "SPMB-270141",
    name: "Bagas Mahendra Wijaya",
    initials: "BM",
    level: "SMP",
    school: "SD Negeri Kotagede 1",
    domicile: "Kotagede, Yogyakarta",
    guardian: "Arif Wijaya",
    route: "Domisili",
    docs: 4,
    totalDocs: 4,
    note: "Seluruh data telah disahkan pada rapat verifikasi 16 Juni.",
    state: "Selesai",
  },
  {
    id: "SPMB-270103",
    name: "Fauzan Alfarizi",
    initials: "FA",
    level: "SMP",
    school: "SD Islam Terpadu Luqman Al Hakim",
    domicile: "Depok, Sleman",
    guardian: "Hendra Alfarizi",
    route: "Prestasi",
    docs: 4,
    totalDocs: 4,
    note: "Tidak memenuhi ketentuan jarak pada jalur yang dipilih.",
    state: "Selesai",
  },
  {
    id: "SPMB-270195",
    name: "Aluna Sekar Ayuningtyas",
    initials: "AS",
    level: "SMA",
    school: "SMP Negeri 8 Yogyakarta",
    domicile: "Gondokusuman, Yogyakarta",
    guardian: "Sari Puspitasari",
    route: "Prestasi",
    docs: 4,
    totalDocs: 4,
    note: "Nilai prestasi perlu dicocokkan dengan arsip sekolah.",
    state: "Menunggu",
  },
];

const week = [
  { day: "Sen", date: "16", month: "Jun", count: 8 },
  { day: "Sel", date: "17", month: "Jun", count: 13 },
  { day: "Rab", date: "18", month: "Jun", count: 18, current: true },
  { day: "Kam", date: "19", month: "Jun", count: 11 },
  { day: "Jum", date: "20", month: "Jun", count: 7 },
  { day: "Sab", date: "21", month: "Jun", count: 3 },
  { day: "Min", date: "22", month: "Jun", count: 0 },
];

const agendaSeed: Agenda[] = [
  { time: "08.30", title: "Sinkronisasi data masuk", detail: "Ruang rapat · 15 menit", tone: "teal", done: true },
  { time: "09.00", title: "Verifikasi domisili", detail: "Naila, Raka, Aluna · 45 menit", tone: "coral" },
  { time: "10.00", title: "Pengecekan jalur afirmasi", detail: "4 pengajuan · 30 menit", tone: "amber" },
  { time: "11.00", title: "Rehat panitia", detail: "Sampai pukul 13.00", tone: "teal" },
  { time: "13.00", title: "Rapat penetapan sementara", detail: "Ruang sidang 2 · 60 menit", tone: "coral" },
];

const stateTone: Record<ReviewState, { bg: string; text: string; dot: string }> = {
  Menunggu: { bg: "#f8eee0", text: "#a16c29", dot: "#c79539" },
  Berlangsung: { bg: "#e4efea", text: "#377267", dot: "#4f9180" },
  Selesai: { bg: "#e5eee3", text: "#557963", dot: "#6b9a7d" },
};

function CandidateRow({
  candidate,
  selected,
  onSelect,
  onAdvance,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
  onAdvance: () => void;
}) {
  const tone = stateTone[candidate.state];
  return (
    <article
      className={`group cursor-pointer border-b border-[#e1ddd1] px-4 py-4 transition hover:bg-[#faf7ee] sm:px-5 ${selected ? "bg-[#f8f0e4] shadow-[inset_3px_0_0_#b55341]" : ""}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      tabIndex={0}
      role="button"
      aria-label={`Buka pengajuan ${candidate.name}`}
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] font-['Fraunces'] text-[13px] font-semibold ${candidate.urgent ? "bg-[#f3dccd] text-[#a94f3e]" : "bg-[#dcebe3] text-[#27645e]"}`}>
          {candidate.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="m-0 truncate text-[12px] font-bold text-[#294646]">{candidate.name}</h3>
              <p className="m-0 mt-1 font-mono text-[9px] tracking-[.02em] text-[#98978c]">{candidate.id}</p>
            </div>
            <button
              type="button"
              aria-label={`Tandai tahap ${candidate.name}`}
              className="rounded-md p-1 text-[#9a9c91] opacity-70 transition hover:bg-[#e7eee6] hover:text-[#285b59] group-hover:opacity-100"
              onClick={(event) => {
                event.stopPropagation();
                onAdvance();
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded bg-[#ece9df] px-2 py-1 font-bold text-[9px] text-[#58736c]">{candidate.level}</span>
            <span className="text-[10px] text-[#747b70]">{candidate.route}</span>
            <span className="ml-auto flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-bold" style={{ backgroundColor: tone.bg, color: tone.text }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.dot }} />
              {candidate.state}
            </span>
          </div>
          <p className="m-0 mt-3 truncate text-[10px] text-[#7c8177]">
            <MapPin className="mr-1 inline h-3 w-3 text-[#7b9a89]" />
            {candidate.domicile}
          </p>
          <div className="mt-3 flex items-center gap-3 text-[9px] font-bold text-[#688078]">
            <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />{candidate.docs}/{candidate.totalDocs} berkas</span>
            {candidate.urgent && <span className="flex items-center gap-1 uppercase tracking-[.08em] text-[#b55341]"><Flag className="h-3 w-3 fill-current" />Prioritas</span>}
          </div>
        </div>
      </div>
    </article>
  );
}

export function CommitteeDashboardCalendarVariant() {
  const [candidates, setCandidates] = useState(seedCandidates);
  const [agenda, setAgenda] = useState(agendaSeed);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDate, setSelectedDate] = useState("18");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"Semua jenjang" | Level>("Semua jenjang");
  const [showFilters, setShowFilters] = useState(false);
  const [agendaForm, setAgendaForm] = useState(false);
  const [newAgenda, setNewAgenda] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
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
      return matchesText && matchesLevel;
    });
  }, [candidates, level, query]);

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null;
  const waitingCount = candidates.filter((candidate) => candidate.state === "Menunggu").length;
  const ongoingCount = candidates.filter((candidate) => candidate.state === "Berlangsung").length;
  const finishedCount = candidates.filter((candidate) => candidate.state === "Selesai").length;

  const advanceCandidate = (id: string) => {
    const current = candidates.find((candidate) => candidate.id === id);
    if (!current) return;
    const next: ReviewState = current.state === "Menunggu" ? "Berlangsung" : current.state === "Berlangsung" ? "Selesai" : "Selesai";
    setCandidates((items) => items.map((candidate) => candidate.id === id ? { ...candidate, state: next, urgent: false } : candidate));
    setNotice(next === current.state ? `${current.name} sudah berada di tahap akhir.` : `${current.name} ditandai sebagai ${next.toLowerCase()}.`);
  };

  const refresh = () => {
    setIsLoading(true);
    setHasError(false);
    window.setTimeout(() => {
      if (query.trim().toLowerCase() === "error") setHasError(true);
      else {
        setIsLoading(false);
        setNotice("Agenda dan antrian sudah diperbarui.");
      }
    }, 700);
  };

  const addAgenda = () => {
    if (!newAgenda.trim()) return;
    setAgenda((items) => [...items, { time: "14.00", title: newAgenda.trim(), detail: "Agenda tambahan · hari ini", tone: "amber" }]);
    setNewAgenda("");
    setAgendaForm(false);
    setNotice("Agenda baru ditambahkan ke hari ini.");
  };

  return (
    <div className="min-h-[100dvh] bg-[#ebe8de] text-[#294646]">
      <style>{`
        @keyframes calendar-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes calendar-shimmer { 0% { background-position:120% 0 } 100% { background-position:-120% 0 } }
        .calendar-rise { animation:calendar-rise .5s cubic-bezier(.22,.8,.25,1) both }
        .calendar-delay-1 { animation-delay:.08s } .calendar-delay-2 { animation-delay:.16s }
        .calendar-skeleton { background:linear-gradient(100deg,#dfdcd1 20%,#f3f0e7 38%,#dfdcd1 56%); background-size:200% 100%; animation:calendar-shimmer 1.3s ease-in-out infinite }
        @media (prefers-reduced-motion:reduce) { .calendar-rise,.calendar-skeleton { animation:none } }
      `}</style>
      <header className="sticky top-0 z-40 border-b border-[#0d3539] bg-[#123f43] text-[#f8f3e8]">
        <div className="mx-auto flex min-h-[72px] max-w-[1530px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Buka navigasi" className="rounded-lg p-2 text-[#d8e5d9] hover:bg-[#28585a] lg:hidden" onClick={() => setMobileNav((open) => !open)}><Menu className="h-5 w-5" /></button>
            <div className="grid h-10 w-10 place-items-center rounded-[13px_13px_5px_13px] border border-[#edb84b]/70 text-[#edbe52]"><span className="font-['Fraunces'] text-xl font-semibold">S</span></div>
            <div><p className="m-0 text-[13px] font-bold tracking-[.2em]">SPMB</p><p className="m-0 mt-1 text-[10px] tracking-[.05em] text-[#b5cbc3]">Ruang tinjau panitia</p></div>
          </div>
          <nav className="hidden items-center gap-6 text-[11px] text-[#aac3b9] lg:flex">
            <button type="button" className="border-b-2 border-[#e8b956] py-7 font-bold text-[#f7e7b9]" onClick={() => setNotice("Kalender tinjau hari ini sedang aktif.")}>Kalender tinjau</button>
            <button type="button" className="py-7 hover:text-[#f7e7b9]" onClick={() => setNotice("Semua keputusan tersimpan di arsip panitia.")}>Arsip keputusan</button>
            <button type="button" className="py-7 hover:text-[#f7e7b9]" onClick={() => setNotice("Panduan verifikasi dibuka.")}>Panduan</button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-5">
            <button type="button" aria-label="Notifikasi" className="relative rounded-lg p-2 text-[#b9d0c7] hover:bg-[#28585a] hover:text-[#f5dfaa]" onClick={() => setNotice("Tidak ada notifikasi baru.")}><Bell className="h-[18px] w-[18px]" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#edbe52]" /></button>
            <div className="hidden items-center gap-2.5 border-l border-[#5e8780]/40 pl-5 sm:flex"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#e6b85a] text-[11px] font-bold text-[#173f43]">DW</div><div className="leading-tight"><p className="m-0 text-[11px] font-bold">Dewi Wulandari</p><p className="m-0 mt-1 text-[10px] text-[#a9c1b7]">Koordinator</p></div></div>
          </div>
        </div>
        {mobileNav && <div className="border-t border-[#396468] bg-[#10383c] px-5 py-3 lg:hidden"><div className="flex gap-2 text-[11px]"><button type="button" className="rounded-md bg-[#e8b956] px-3 py-2 font-bold text-[#173f43]" onClick={() => setMobileNav(false)}>Kalender tinjau</button><button type="button" className="rounded-md px-3 py-2 text-[#d6e5da]" onClick={() => { setMobileNav(false); setNotice("Arsip keputusan dibuka."); }}>Arsip keputusan</button></div></div>}
      </header>

      <main className="mx-auto max-w-[1530px] px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pt-11">
        <div className="calendar-rise mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#b55341]"><span className="h-px w-7 bg-current" />Ruang tinjau · tahun ajaran 2027 / 2028</div>
            <h1 className="m-0 max-w-[760px] font-['Fraunces'] text-[clamp(2.35rem,5.4vw,4.8rem)] font-semibold leading-[.94] tracking-[-.065em] text-[#173f43]">Hari ini, <span className="text-[#b55341]">satu per satu.</span></h1>
            <p className="mt-4 max-w-[620px] text-[13px] leading-6 text-[#74756b] sm:text-[14px]">Susun waktu pemeriksaan, masuk ke rapat dengan konteks yang lengkap, lalu tutup hari tanpa antrian yang samar.</p>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-auto"><div className="hidden h-[68px] w-[68px] -rotate-6 flex-col items-center justify-center rounded-full border border-[#c9a545] text-[#a07020] sm:flex"><CalendarDays className="mb-1 h-4 w-4" /><span className="font-mono text-[8px] uppercase tracking-[.14em]">Hari ini</span></div><div className="border-l border-[#d2cec1] pl-4"><p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#99988e]">Rabu, 18 Juni 2026</p><p className="m-0 mt-2 text-[12px] text-[#696c63]">Sinkronisasi <strong className="text-[#365d5a]">08.35 WIB</strong></p></div></div>
        </div>

        <section className="calendar-rise calendar-delay-1 mb-7 overflow-hidden rounded-[16px] border border-[#d6d2c6] bg-[#f8f5ec] shadow-[0_15px_45px_rgba(34,61,57,.07)]">
          <div className="flex items-center justify-between border-b border-[#d6d2c6] px-5 py-4 sm:px-6"><div><p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#b55341]">Jadwal tinjau</p><h2 className="m-0 mt-1 font-['Fraunces'] text-[23px] font-semibold tracking-[-.04em] text-[#173f43]">Minggu ini</h2></div><div className="flex items-center gap-1"><button type="button" aria-label="Minggu sebelumnya" className="rounded-lg p-2 text-[#73847b] hover:bg-[#e9eee6]" onClick={() => setNotice("Minggu sebelumnya belum tersedia.")}><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Minggu berikutnya" className="rounded-lg p-2 text-[#73847b] hover:bg-[#e9eee6]" onClick={() => setNotice("Minggu berikutnya belum tersedia.")}><ChevronRight className="h-4 w-4" /></button></div></div>
          <div className="grid grid-cols-4 divide-x divide-[#e3dfd3] sm:grid-cols-7">
            {week.map((item) => <button key={item.date} type="button" className={`relative min-h-[98px] px-2 py-4 text-center transition hover:bg-[#f5efe2] ${selectedDate === item.date ? "bg-[#f4e8d7]" : ""}`} onClick={() => { setSelectedDate(item.date); setNotice(item.current ? "Menampilkan agenda hari ini." : `Menampilkan agenda ${item.day}, ${item.date} Juni.`); }}><span className={`block font-mono text-[9px] font-bold uppercase tracking-[.13em] ${item.current ? "text-[#b55341]" : "text-[#99998d]"}`}>{item.day}</span><strong className={`mt-2 block font-['Fraunces'] text-[27px] leading-none ${selectedDate === item.date ? "text-[#173f43]" : "text-[#6b756b]"}`}>{item.date}</strong><span className={`mt-2 inline-flex items-center gap-1 text-[9px] ${item.count ? "text-[#638277]" : "text-[#adada3]"}`}><span className={`h-1.5 w-1.5 rounded-full ${item.count ? "bg-[#6d9b87]" : "bg-[#c7c7bb]"}`} />{item.count ? `${item.count} tinjauan` : "kosong"}</span>{item.current && <span className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-[#b55341]" />}</button>)}
          </div>
        </section>

        <section className="calendar-rise calendar-delay-2 mb-7 grid overflow-hidden rounded-[16px] border border-[#d6d2c6] bg-[#f8f5ec] shadow-[0_15px_45px_rgba(34,61,57,.07)] sm:grid-cols-4">
          <div className="border-b border-[#d6d2c6] px-5 py-5 sm:border-b-0 sm:border-r"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#7a7b71]"><span>Terjadwal hari ini</span><CalendarDays className="h-4 w-4 text-[#9c9b8d]" /></div><p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">18</p><p className="m-0 mt-1 text-[10px] text-[#929188]">pengajuan dalam kalender</p></div>
          <button type="button" className="border-b border-[#d6d2c6] px-5 py-5 text-left transition hover:bg-[#fbefe6] sm:border-b-0 sm:border-r" onClick={() => setNotice(`${waitingCount} pengajuan menunggu perhatian.`)}><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#9b5544]"><span>Butuh perhatian</span><Flag className="h-4 w-4" /></div><p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">{String(waitingCount).padStart(2, "0")}</p><p className="m-0 mt-1 text-[10px] text-[#929188]">prioritas ditandai merah</p></button>
          <button type="button" className="border-b border-[#d6d2c6] px-5 py-5 text-left transition hover:bg-[#f5efd9] sm:border-b-0 sm:border-r" onClick={() => setNotice(`${ongoingCount} pengajuan sedang dibahas.`)}><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#987529]"><span>Sedang ditinjau</span><Clock3 className="h-4 w-4" /></div><p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">{String(ongoingCount).padStart(2, "0")}</p><p className="m-0 mt-1 text-[10px] text-[#929188]">dibahas bersama panitia</p></button>
          <button type="button" className="px-5 py-5 text-left transition hover:bg-[#e6f0e7]" onClick={() => setNotice(`${finishedCount} pengajuan sudah ditutup.`)}><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-[#4c7c6d]"><span>Sudah ditutup</span><CheckCircle2 className="h-4 w-4" /></div><p className="mb-0 mt-3 font-['Fraunces'] text-[32px] leading-none tracking-[-.05em] text-[#173f43]">{String(finishedCount).padStart(2, "0")}</p><p className="m-0 mt-1 text-[10px] text-[#929188]">keputusan tersimpan</p></button>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_360px]">
          <section className="overflow-hidden rounded-[18px] border border-[#d6d2c6] bg-[#f5f2e9] shadow-[0_15px_45px_rgba(34,61,57,.07)]">
            <div className="flex flex-col justify-between gap-4 border-b border-[#dedbd0] bg-[#f8f5ec] px-5 py-5 sm:flex-row sm:items-center sm:px-6"><div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#b55341]"><ListChecks className="h-3.5 w-3.5" />Daftar pertemuan</div><h2 className="m-0 font-['Fraunces'] text-[26px] font-semibold tracking-[-.04em] text-[#173f43]">Tinjauan untuk hari ini.</h2></div><div className="flex items-center gap-2"><span className="hidden rounded-full bg-[#e8e3d7] px-2.5 py-1.5 font-mono text-[10px] text-[#88887e] sm:inline">{visibleCandidates.length} tampil</span><button type="button" className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-bold transition ${showFilters ? "border-[#4d8175] bg-[#e6f0e7] text-[#2b625d]" : "border-[#d4d1c5] bg-[#fbf9f2] text-[#60726b] hover:border-[#8aafa0]"}`} onClick={() => setShowFilters((open) => !open)}><Search className="h-3.5 w-3.5" />Cari</button><button type="button" aria-label="Segarkan jadwal" className="grid h-9 w-9 place-items-center rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] text-[#60726b] transition hover:border-[#8aafa0] hover:text-[#285b59]" onClick={refresh}><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /></button></div></div>
            {showFilters && <div className="flex flex-col gap-3 border-b border-[#dedbd0] bg-[#f1eee4] px-5 py-4 sm:flex-row sm:items-center sm:px-6"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8d9086]" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Cari nama, nomor, atau sekolah" className="h-9 w-full rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] pl-9 pr-3 text-[11px] outline-none focus:border-[#527d75] focus:ring-2 focus:ring-[#527d75]/15" /></div><select value={level} onChange={(event) => setLevel(event.target.value as "Semua jenjang" | Level)} className="h-9 rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] px-3 text-[11px] text-[#4e5d59] outline-none"><option>Semua jenjang</option><option>SMP</option><option>SMA</option><option>SMK</option></select><button type="button" className="h-9 rounded-lg px-3 text-[10px] font-bold text-[#52746e] hover:bg-[#e3ede5]" onClick={() => { setQuery(""); setLevel("Semua jenjang"); }}>Bersihkan</button></div>}
            {isLoading ? <div className="space-y-1 p-4 sm:p-5">{[1, 2, 3, 4].map((item) => <div key={item} className="flex gap-3 border-b border-[#e1ddd1] px-1 py-4"><span className="calendar-skeleton h-9 w-9 rounded-[10px]" /><div className="flex-1"><div className="calendar-skeleton h-3 w-2/5 rounded" /><div className="calendar-skeleton mt-3 h-2 w-1/4 rounded" /><div className="calendar-skeleton mt-3 h-2 w-3/4 rounded" /></div></div>)}</div> : hasError ? <div className="grid min-h-[380px] place-items-center px-8 py-16 text-center"><div><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-[#d4aa8f] text-[#b55341]"><AlertCircle className="h-5 w-5" /></div><h3 className="m-0 font-['Fraunces'] text-[22px] text-[#173f43]">Jadwal belum bisa dimuat</h3><p className="mx-auto mt-2 max-w-[290px] text-[12px] leading-5 text-[#85867b]">Ada gangguan saat mengambil pengajuan. Coba lagi dalam beberapa saat.</p><button type="button" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1f5a5b] px-4 py-2.5 text-[11px] font-bold text-[#f7f3e9] hover:bg-[#164849]" onClick={refresh}><RefreshCw className="h-3.5 w-3.5" />Coba lagi</button></div></div> : visibleCandidates.length ? visibleCandidates.map((candidate) => <CandidateRow key={candidate.id} candidate={candidate} selected={selectedId === candidate.id} onSelect={() => { setSelectedId(candidate.id); setDrawerTab("Ringkasan"); }} onAdvance={() => advanceCandidate(candidate.id)} />) : <div className="grid min-h-[330px] place-items-center px-8 py-16 text-center"><div><Search className="mx-auto h-7 w-7 text-[#8aa293]" /><h3 className="m-0 mt-3 font-['Fraunces'] text-[20px] text-[#173f43]">Tidak ada yang cocok</h3><p className="m-0 mt-2 text-[11px] text-[#898b81]">Coba nama, nomor pendaftaran, atau jenjang lain.</p></div></div>}
            <div className="flex flex-col justify-between gap-2 border-t border-[#dedbd0] bg-[#f2eee3] px-5 py-3 text-[10px] text-[#898a80] sm:flex-row sm:items-center sm:px-6"><span className="flex items-center gap-2"><FileCheck2 className="h-3.5 w-3.5 text-[#5b8878]" />Urutan mengikuti waktu pertemuan</span><button type="button" className="flex items-center gap-1 font-bold text-[#4f756d] hover:text-[#173f43]" onClick={() => setNotice("Semua 128 pengajuan sudah terjadwal.")}>Lihat semua pengajuan <ArrowRight className="h-3 w-3" /></button></div>
          </section>

          <aside className="overflow-hidden rounded-[18px] border border-[#d6d2c6] bg-[#f8f5ec] shadow-[0_15px_45px_rgba(34,61,57,.07)]">
            <div className="border-b border-[#dedbd0] px-5 py-5"><div className="flex items-start justify-between gap-3"><div><p className="m-0 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#b55341]"><PanelRight className="h-3.5 w-3.5" />Agenda rapat</p><h2 className="m-0 mt-2 font-['Fraunces'] text-[26px] font-semibold tracking-[-.045em] text-[#173f43]">Jaga ritmenya.</h2></div><span className="rounded-full bg-[#e4efea] px-2 py-1 font-mono text-[9px] font-bold text-[#4d7c70]">18 JUN</span></div><p className="m-0 mt-3 text-[11px] leading-5 text-[#85877d]">Rabu · Ruang sidang 2 · 08.30—14.00 WIB</p></div>
            <div className="divide-y divide-[#e5e1d6]">{agenda.map((item, index) => <button key={`${item.time}-${item.title}`} type="button" className={`flex w-full gap-3 px-5 py-4 text-left transition hover:bg-[#faf7ee] ${item.done ? "opacity-65" : ""}`} onClick={() => { if (item.done) setNotice(`${item.title} sudah selesai.`); else { setAgenda((items) => items.map((agendaItem, agendaIndex) => agendaIndex === index ? { ...agendaItem, done: true } : agendaItem)); setNotice(`${item.title} ditandai selesai.`); } }}><span className="w-10 shrink-0 pt-0.5 font-mono text-[10px] font-bold text-[#8e9086]">{item.time}</span><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.tone === "coral" ? "bg-[#ba6851]" : item.tone === "amber" ? "bg-[#c89b3d]" : "bg-[#609180]"}`} /><span className="min-w-0 flex-1"><strong className={`block text-[11px] ${item.done ? "text-[#839087] line-through" : "text-[#294646]"}`}>{item.title}</strong><small className="mt-1 block text-[10px] text-[#98998f]">{item.detail}</small></span>{item.done && <Check className="mt-0.5 h-3.5 w-3.5 text-[#609180]" />}</button>)}</div>
            <div className="border-t border-[#dedbd0] bg-[#f3efe4] p-5">{agendaForm ? <div><label htmlFor="new-agenda" className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#7d8177]">Agenda tambahan</label><input id="new-agenda" value={newAgenda} onChange={(event) => setNewAgenda(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addAgenda(); }} placeholder="Contoh: cocokkan data sekolah" className="mt-2 h-9 w-full rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] px-3 text-[11px] outline-none focus:border-[#527d75]" /><div className="mt-3 flex gap-2"><button type="button" className="flex-1 rounded-lg bg-[#1f5a5b] py-2 text-[10px] font-bold text-[#f7f3e9] hover:bg-[#164849]" onClick={addAgenda}>Tambah agenda</button><button type="button" className="rounded-lg border border-[#d4d1c5] px-3 text-[10px] font-bold text-[#60726b] hover:bg-[#e7ede5]" onClick={() => { setAgendaForm(false); setNewAgenda(""); }}>Batal</button></div></div> : <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#bfcbbf] py-2.5 text-[10px] font-bold text-[#52746e] hover:border-[#719488] hover:bg-[#e7eee7]" onClick={() => setAgendaForm(true)}><CalendarDays className="h-3.5 w-3.5" />Tambah ke agenda</button>}</div>
          </aside>
        </div>

        <div className="mt-7 flex flex-col justify-between gap-3 rounded-[14px] border border-[#d6d2c6] bg-[#f0ede3] px-5 py-4 sm:flex-row sm:items-center sm:px-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#dcebe0] text-[#4e806f]"><Users className="h-4 w-4" /></span><div><p className="m-0 text-[11px] font-bold text-[#3d625d]">Panitia siap meninjau bersama</p><p className="m-0 mt-1 text-[10px] text-[#898b81]">Dewi, Arif, dan 3 anggota lain hadir hari ini.</p></div></div><button type="button" className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[10px] font-bold transition ${sessionStarted ? "bg-[#e0eee5] text-[#4e806f]" : "bg-[#1f5a5b] text-[#f7f3e9] hover:bg-[#164849]"}`} onClick={() => { setSessionStarted((started) => !started); setNotice(sessionStarted ? "Sesi ditutup." : "Sesi tinjau dimulai. Agenda pertama siap."); }}><Play className="h-3 w-3 fill-current" />{sessionStarted ? "Sesi sedang berjalan" : "Mulai sesi tinjau"}</button></div>
        <footer className="mt-9 flex flex-col justify-between gap-3 border-t border-[#d2cec2] pt-5 text-[10px] text-[#8e8d83] sm:flex-row sm:items-center"><p className="m-0">SPMB 2027/2028 · Kalender tinjau panitia</p><p className="m-0 font-mono text-[#638077]">Akses internal · aman</p></footer>
      </main>

      {selected && <div className="fixed inset-0 z-50 flex items-end justify-end bg-[#173f43]/20 sm:p-5" onClick={() => setSelectedId("")}><aside className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[20px] border border-[#d6d2c6] bg-[#f8f5ec] shadow-[0_20px_60px_rgba(18,52,52,.25)] sm:max-w-[450px] sm:rounded-[18px]" onClick={(event) => event.stopPropagation()}><div className="sticky top-0 z-10 border-b border-[#dedbd0] bg-[#f8f5ec]/95 px-5 pb-4 pt-5 backdrop-blur sm:px-6"><div className="flex items-start justify-between gap-3"><div><p className="m-0 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#b55341]"><FileText className="h-3.5 w-3.5" />Inspektur pengajuan</p><h2 className="m-0 mt-2 font-['Fraunces'] text-[27px] font-semibold leading-none tracking-[-.045em] text-[#173f43]">{selected.name}</h2><p className="m-0 mt-2 font-mono text-[9px] text-[#8c8d83]">{selected.id} · agenda 09.00 WIB</p></div><button type="button" aria-label="Tutup detail" className="rounded-lg p-2 text-[#7f8980] hover:bg-[#e8ede4] hover:text-[#234342]" onClick={() => setSelectedId("")}><X className="h-4 w-4" /></button></div><div className="mt-5 flex gap-1 border-b border-[#e1ddd2]"><button type="button" className={`border-b-2 px-3 pb-2 text-[11px] font-bold ${drawerTab === "Ringkasan" ? "border-[#b55341] text-[#b55341]" : "border-transparent text-[#92958b]"}`} onClick={() => setDrawerTab("Ringkasan")}>Ringkasan</button><button type="button" className={`border-b-2 px-3 pb-2 text-[11px] font-bold ${drawerTab === "Berkas" ? "border-[#b55341] text-[#b55341]" : "border-transparent text-[#92958b]"}`} onClick={() => setDrawerTab("Berkas")}>Berkas ({selected.docs}/{selected.totalDocs})</button></div></div>
        <div className="px-5 py-5 sm:px-6">{drawerTab === "Ringkasan" ? <><div className="rounded-[12px] border border-[#d7d4c7] bg-[#f0ede3] p-4"><p className="m-0 text-[10px] font-bold uppercase tracking-[.1em] text-[#888a80]">Catatan untuk rapat</p><p className="m-0 mt-2 text-[12px] leading-5 text-[#557069]">{selected.note}</p><button type="button" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f5a5b] py-2.5 text-[11px] font-bold text-[#f7f3e9] transition hover:bg-[#164849]" onClick={() => advanceCandidate(selected.id)}><ArrowRight className="h-3.5 w-3.5" />Tandai tahap berikutnya</button></div><dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5"><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Status</dt><dd className="m-0 mt-1 text-[12px] text-[#253d3e]">{selected.state}</dd></div><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Jalur</dt><dd className="m-0 mt-1 text-[12px] text-[#253d3e]">{selected.route}</dd></div><div className="col-span-2"><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Sekolah asal</dt><dd className="m-0 mt-1 text-[12px] leading-5 text-[#253d3e]">{selected.school}</dd></div><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Wali</dt><dd className="m-0 mt-1 text-[12px] text-[#253d3e]">{selected.guardian}</dd></div><div><dt className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#96958a]">Domisili</dt><dd className="m-0 mt-1 text-[12px] text-[#253d3e]">{selected.domicile}</dd></div></dl></> : <div className="space-y-2">{["Kartu Keluarga", "Akta kelahiran", "Rapor semester 5", "Surat keterangan domisili"].map((document, index) => { const available = index < selected.docs; return <button key={document} type="button" className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition ${available ? "border-[#d3d8ca] bg-[#f5f5eb] hover:border-[#8aafa0]" : "border-dashed border-[#d8d5ca] bg-[#f1eee5]"}`} onClick={() => available && setNotice(`${document} siap ditinjau.`)}><span className="flex items-center gap-2.5"><span className={`grid h-6 w-6 place-items-center rounded ${available ? "bg-[#dcebe0] text-[#4e806f]" : "bg-[#e7e3d9] text-[#a8a79d]"}`}>{available ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}</span><span><strong className={`block text-[11px] ${available ? "text-[#3c6c66]" : "text-[#9b9c92]"}`}>{document}</strong><small className="mt-0.5 block text-[9px] text-[#999a91]">{available ? "PDF · tersedia" : "Belum diunggah"}</small></span></span><span className="text-[9px] font-bold text-[#6d877c]">{available ? "Buka" : "—"}</span></button>; })}</div>}</div></aside></div>}
      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-full border border-[#406e68] bg-[#173f43] px-4 py-3 text-[11px] font-bold text-[#f7f1e4] shadow-[0_12px_28px_rgba(18,52,52,.24)]"><Check className="h-3.5 w-3.5 shrink-0 text-[#edbe52]" /><span className="truncate">{notice}</span></div>}
    </div>
  );
}