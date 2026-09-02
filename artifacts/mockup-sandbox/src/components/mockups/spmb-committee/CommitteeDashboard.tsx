import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Filter,
  FolderOpen,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

type Status = "Baru" | "Diverifikasi" | "Perlu perbaikan" | "Diterima" | "Ditolak";
type Level = "SMP" | "SMA" | "SMK";

type Applicant = {
  id: string;
  name: string;
  initials: string;
  level: Level;
  school: string;
  submitted: string;
  date: string;
  status: Status;
  domicile: string;
  nisn: string;
  birth: string;
  gender: string;
  phone: string;
  guardian: string;
  route: string;
  priority: string;
  note: string;
  documents: { name: string; meta: string; available: boolean }[];
};

const applicants: Applicant[] = [
  {
    id: "SPMB-270184",
    name: "Naila Putri Ramadhani",
    initials: "NP",
    level: "SMA",
    school: "SMP Negeri 5 Yogyakarta",
    submitted: "Hari ini, 08.42",
    date: "18 Juni 2026",
    status: "Baru",
    domicile: "Umbulharjo, Kota Yogyakarta",
    nisn: "0093482716",
    birth: "Yogyakarta, 12 Mei 2012",
    gender: "Perempuan",
    phone: "0812 7764 2098",
    guardian: "Rina Wulandari",
    route: "Jalur domisili",
    priority: "Perlu ditinjau hari ini",
    note: "Berkas lengkap. Nilai rapor semester terakhir menunggu pengecekan silang.",
    documents: [
      { name: "Kartu Keluarga", meta: "PDF · 1,2 MB", available: true },
      { name: "Akta kelahiran", meta: "PDF · 842 KB", available: true },
      { name: "Rapor semester 5", meta: "PDF · 2,1 MB", available: true },
      { name: "Surat keterangan domisili", meta: "Belum diunggah", available: false },
    ],
  },
  {
    id: "SPMB-270179",
    name: "Raka Aditya Pranowo",
    initials: "RA",
    level: "SMK",
    school: "SMP Negeri 2 Sleman",
    submitted: "Kemarin, 16.18",
    date: "17 Juni 2026",
    status: "Perlu perbaikan",
    domicile: "Ngaglik, Kabupaten Sleman",
    nisn: "0087261154",
    birth: "Sleman, 7 September 2011",
    gender: "Laki-laki",
    phone: "0857 2031 4486",
    guardian: "Dwi Prasetyo",
    route: "Jalur afirmasi",
    priority: "Menunggu berkas",
    note: "Foto dokumen kartu keluarga kurang terbaca pada bagian nomor NIK.",
    documents: [
      { name: "Kartu Keluarga", meta: "PDF · 620 KB", available: true },
      { name: "Akta kelahiran", meta: "PDF · 920 KB", available: true },
      { name: "KIP / bukti afirmasi", meta: "Belum diunggah", available: false },
      { name: "Rapor semester 5", meta: "PDF · 1,8 MB", available: true },
    ],
  },
  {
    id: "SPMB-270166",
    name: "Salsabila Nur Aini",
    initials: "SN",
    level: "SMA",
    school: "SMP Muhammadiyah 3 Bantul",
    submitted: "17 Juni 2026, 13.05",
    date: "17 Juni 2026",
    status: "Diverifikasi",
    domicile: "Kasihan, Kabupaten Bantul",
    nisn: "0091174432",
    birth: "Bantul, 22 Februari 2012",
    gender: "Perempuan",
    phone: "0822 9140 5571",
    guardian: "Nurhayati",
    route: "Jalur domisili",
    priority: "Selesai diperiksa",
    note: "Data dan dokumen sesuai. Menunggu rapat penetapan akhir.",
    documents: [
      { name: "Kartu Keluarga", meta: "PDF · 1,1 MB", available: true },
      { name: "Akta kelahiran", meta: "PDF · 790 KB", available: true },
      { name: "Rapor semester 5", meta: "PDF · 2,4 MB", available: true },
      { name: "Surat keterangan domisili", meta: "PDF · 410 KB", available: true },
    ],
  },
  {
    id: "SPMB-270141",
    name: "Bagas Mahendra Wijaya",
    initials: "BM",
    level: "SMP",
    school: "SD Negeri Kotagede 1",
    submitted: "16 Juni 2026, 11.26",
    date: "16 Juni 2026",
    status: "Diterima",
    domicile: "Kotagede, Kota Yogyakarta",
    nisn: "0112836049",
    birth: "Yogyakarta, 18 November 2014",
    gender: "Laki-laki",
    phone: "0813 6802 1174",
    guardian: "Arif Wijaya",
    route: "Jalur domisili",
    priority: "Siap ditindaklanjuti",
    note: "Seluruh data telah disahkan pada rapat verifikasi 16 Juni.",
    documents: [
      { name: "Kartu Keluarga", meta: "PDF · 980 KB", available: true },
      { name: "Akta kelahiran", meta: "PDF · 720 KB", available: true },
      { name: "Rapor semester 5", meta: "PDF · 1,9 MB", available: true },
      { name: "Surat keterangan domisili", meta: "PDF · 320 KB", available: true },
    ],
  },
  {
    id: "SPMB-270128",
    name: "Kiara Ayu Lestari",
    initials: "KA",
    level: "SMK",
    school: "SMP Negeri 1 Wonosari",
    submitted: "15 Juni 2026, 09.11",
    date: "15 Juni 2026",
    status: "Baru",
    domicile: "Wonosari, Kabupaten Gunungkidul",
    nisn: "0094507713",
    birth: "Gunungkidul, 2 Agustus 2011",
    gender: "Perempuan",
    phone: "0877 3400 1865",
    guardian: "Maya Lestari",
    route: "Jalur domisili",
    priority: "Perlu ditinjau",
    note: "Menunggu pengecekan alamat pada Kartu Keluarga.",
    documents: [
      { name: "Kartu Keluarga", meta: "PDF · 1,5 MB", available: true },
      { name: "Akta kelahiran", meta: "PDF · 675 KB", available: true },
      { name: "Rapor semester 5", meta: "Belum diunggah", available: false },
      { name: "Surat keterangan domisili", meta: "PDF · 380 KB", available: true },
    ],
  },
  {
    id: "SPMB-270103",
    name: "Fauzan Alfarizi",
    initials: "FA",
    level: "SMP",
    school: "SD Islam Terpadu Luqman Al Hakim",
    submitted: "13 Juni 2026, 14.37",
    date: "13 Juni 2026",
    status: "Ditolak",
    domicile: "Depok, Kabupaten Sleman",
    nisn: "0115903148",
    birth: "Sleman, 11 Januari 2014",
    gender: "Laki-laki",
    phone: "0819 5502 7633",
    guardian: "Hendra Alfarizi",
    route: "Jalur prestasi",
    priority: "Arsip",
    note: "Tidak memenuhi ketentuan jarak pada jalur yang dipilih.",
    documents: [
      { name: "Kartu Keluarga", meta: "PDF · 1,0 MB", available: true },
      { name: "Akta kelahiran", meta: "PDF · 560 KB", available: true },
      { name: "Sertifikat prestasi", meta: "PDF · 3,2 MB", available: true },
      { name: "Rapor semester 5", meta: "PDF · 1,7 MB", available: true },
    ],
  },
];

const statusStyles: Record<Status, string> = {
  Baru: "bg-[#fff1c6] text-[#8b5b12]",
  Diverifikasi: "bg-[#d9eeea] text-[#17645f]",
  "Perlu perbaikan": "bg-[#f9ddd4] text-[#9f493b]",
  Diterima: "bg-[#dcebdc] text-[#356b4a]",
  Ditolak: "bg-[#e9e1de] text-[#785954]",
};

const statusOptions: Status[] = ["Baru", "Diverifikasi", "Perlu perbaikan", "Diterima", "Ditolak"];

function Badge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.02em] ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function StatBlock({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="relative min-w-0 overflow-hidden border-r border-[#d6d2c6] px-5 py-5 last:border-r-0 sm:px-6">
      <div className={`absolute left-0 top-0 h-[3px] w-12 ${accent}`} />
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#74756b]">{label}</p>
        <span className="text-[#9c9b8d]">{icon}</span>
      </div>
      <p className="mb-1 mt-3 font-['Fraunces'] text-[34px] leading-none tracking-[-0.05em] text-[#173f43]">{value}</p>
      <p className="m-0 text-[11px] text-[#8c8c82]">{detail}</p>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#96958a]">{label}</dt>
      <dd className="m-0 break-words text-[12px] leading-5 text-[#253d3e]">{value}</dd>
    </div>
  );
}

export function CommitteeDashboard() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"Semua jenjang" | Level>("Semua jenjang");
  const [statusFilter, setStatusFilter] = useState<"Semua status" | Status>("Semua status");
  const [selectedId, setSelectedId] = useState(applicants[0].id);
  const [localApplicants, setLocalApplicants] = useState(applicants);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [sortNewest, setSortNewest] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const filteredApplicants = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return localApplicants
      .filter((item) => {
        const matchesQuery =
          !normalized ||
          item.name.toLowerCase().includes(normalized) ||
          item.id.toLowerCase().includes(normalized) ||
          item.school.toLowerCase().includes(normalized);
        const matchesLevel = level === "Semua jenjang" || item.level === level;
        const matchesStatus = statusFilter === "Semua status" || item.status === statusFilter;
        return matchesQuery && matchesLevel && matchesStatus;
      })
      .sort((a, b) => (sortNewest ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)));
  }, [level, localApplicants, query, sortNewest, statusFilter]);

  const selectedApplicant = localApplicants.find((item) => item.id === selectedId) ?? filteredApplicants[0];
  const newCount = localApplicants.filter((item) => item.status === "Baru").length;
  const acceptedCount = localApplicants.filter((item) => item.status === "Diterima").length;
  const availableCount = selectedApplicant?.documents.filter((item) => item.available).length ?? 0;

  const updateStatus = (nextStatus: Status) => {
    if (!selectedApplicant || nextStatus === selectedApplicant.status) return;
    setLocalApplicants((current) =>
      current.map((item) => (item.id === selectedApplicant.id ? { ...item, status: nextStatus } : item)),
    );
    setNotice(`Status ${selectedApplicant.name} diperbarui menjadi ${nextStatus.toLowerCase()}.`);
  };

  const refreshData = () => {
    setIsLoading(true);
    setNotice("Memeriksa pembaruan pengajuan…");
    window.setTimeout(() => {
      setIsLoading(false);
      setNotice("Daftar pengajuan sudah paling baru.");
    }, 850);
  };

  return (
    <div className="min-h-[100dvh] bg-[#ebe8de] text-[#253d3e]">
      <style>{`
        @keyframes committee-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes committee-shimmer { 0% { background-position: 120% 0; } 100% { background-position: -120% 0; } }
        .committee-rise { animation: committee-rise .55s cubic-bezier(.22,.8,.25,1) both; }
        .committee-delay-1 { animation-delay: .08s; }
        .committee-delay-2 { animation-delay: .16s; }
        .committee-delay-3 { animation-delay: .24s; }
        .committee-skeleton { background: linear-gradient(100deg, #e3e0d5 20%, #f2efe6 38%, #e3e0d5 56%); background-size: 200% 100%; animation: committee-shimmer 1.3s ease-in-out infinite; }
        .committee-noise { position: relative; }
        .committee-noise:after { content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .035; z-index: 50; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E"); mix-blend-mode: multiply; }
        @media (prefers-reduced-motion: reduce) { .committee-rise, .committee-skeleton { animation: none; } }
      `}</style>

      <div className="committee-noise">
        <header className="sticky top-0 z-40 border-b border-[#0d3539] bg-[#123f43] text-[#f8f3e8]">
          <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-[#d8e5d9] transition hover:bg-[#28585a] lg:hidden"
                aria-label="Buka navigasi"
                onClick={() => setIsMobileNavOpen((open) => !open)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="grid h-10 w-10 place-items-center rounded-[13px_13px_5px_13px] border border-[#edb84b]/70 text-[#edbe52]">
                <span className="font-['Fraunces'] text-xl font-semibold">S</span>
              </div>
              <div>
                <p className="m-0 text-[13px] font-bold tracking-[0.2em]">SPMB</p>
                <p className="m-0 mt-1 text-[10px] tracking-[0.05em] text-[#b5cbc3]">Ruang kerja panitia</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-[#69918a]/40 bg-[#1d4b4e] px-3.5 py-2 text-[11px] text-[#d3e2d7] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#edbe52] shadow-[0_0_0_4px_rgba(237,190,82,.13)]" />
              <span>Akses aktif</span>
              <span className="text-[#91b2a7]">·</span>
              <span>Panitia SMA / SMK</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-5">
              <button type="button" className="relative rounded-lg p-2 text-[#b9d0c7] transition hover:bg-[#28585a] hover:text-[#f5dfaa]" aria-label="Notifikasi" onClick={() => setNotice("Tidak ada notifikasi baru.")}>
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#edbe52]" />
              </button>
              <div className="hidden items-center gap-2.5 border-l border-[#5e8780]/40 pl-5 sm:flex">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#e6b85a] text-[11px] font-bold text-[#173f43]">DW</div>
                <div className="leading-tight">
                  <p className="m-0 text-[11px] font-bold">Dewi Wulandari</p>
                  <p className="m-0 mt-1 text-[10px] text-[#a9c1b7]">Koordinator verifikasi</p>
                </div>
                <ChevronDown className="ml-1 h-3.5 w-3.5 text-[#94b2a9]" />
              </div>
              <button type="button" className="hidden items-center gap-2 border-l border-[#5e8780]/40 pl-5 text-[11px] text-[#c3d5cd] transition hover:text-[#f5dfaa] md:flex" onClick={() => setNotice("Sesi kerja tetap aman dan tersimpan di perangkat ini.")}>
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            </div>
          </div>
          {isMobileNavOpen && (
            <div className="border-t border-[#396468] bg-[#10383c] px-5 py-3 lg:hidden">
              <nav className="flex flex-wrap gap-2 text-[11px]">
                {["Ringkasan", "Pengajuan", "Agenda rapat", "Panduan"].map((item, index) => (
                  <button key={item} type="button" className={`rounded-md px-3 py-2 ${index === 1 ? "bg-[#e8b956] font-bold text-[#173f43]" : "text-[#d6e5da] hover:bg-[#28585a]"}`} onClick={() => setIsMobileNavOpen(false)}>
                    {item}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-[1500px] px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pt-12">
          <div className="mb-8 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="committee-rise min-w-0">
              <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#b55341]">
                <span className="h-px w-7 bg-current" />
                Panel pengelolaan · tahun ajaran 2027 / 2028
              </div>
              <h1 className="m-0 max-w-[780px] font-['Fraunces'] text-[clamp(2.45rem,5.6vw,5rem)] font-semibold leading-[.95] tracking-[-0.065em] text-[#173f43]">
                Selamat pagi, <span className="text-[#b55341]">panitia.</span>
              </h1>
              <p className="mt-4 max-w-[640px] text-[13px] leading-6 text-[#74756b] sm:text-[14px]">
                Semua yang perlu Anda cek hari ini, tersusun rapi. Mulai dari pengajuan terbaru dan pastikan setiap berkas mendapat perhatian yang layak.
              </p>
            </div>
            <div className="committee-rise committee-delay-1 flex items-center gap-3 self-start lg:self-auto">
              <div className="hidden h-[74px] w-[74px] rotate-6 flex-col items-center justify-center rounded-full border border-[#c9a545] text-[#a07020] sm:flex">
                <span className="font-['Fraunces'] text-base font-semibold tracking-[0.08em]">SPMB</span>
                <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em]">Internal</span>
              </div>
              <div className="border-l border-[#d2cec1] pl-4 text-left lg:text-right">
                <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#99988e]">Rabu, 18 Juni 2026</p>
                <p className="m-0 mt-2 text-[12px] text-[#696c63]">Sinkronisasi terakhir <strong className="font-bold text-[#365d5a]">08.35 WIB</strong></p>
              </div>
            </div>
          </div>

          <section className="committee-rise committee-delay-2 mb-8 grid overflow-hidden rounded-[18px] border border-[#d6d2c6] bg-[#f8f5ec] shadow-[0_15px_45px_rgba(34,61,57,.07)] sm:grid-cols-3" aria-label="Ringkasan pendaftaran">
            <StatBlock label="Total pengajuan" value="128" detail="SMA, SMK, dan SMP" icon={<UsersRound className="h-4 w-4" />} accent="bg-[#e4ad3d]" />
            <StatBlock label="Menunggu tinjauan" value={String(newCount).padStart(2, "0")} detail="Perlu perhatian panitia" icon={<Clock3 className="h-4 w-4" />} accent="bg-[#b55341]" />
            <StatBlock label="Telah diterima" value={String(acceptedCount).padStart(2, "0")} detail="Siap ditindaklanjuti" icon={<ClipboardCheck className="h-4 w-4" />} accent="bg-[#4d8474]" />
          </section>

          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] text-[#7b7b70]">
              <ShieldCheck className="h-4 w-4 text-[#4d8474]" />
              <span>Data pendaftar dalam cakupan akun Anda</span>
            </div>
            <button type="button" className="hidden items-center gap-2 rounded-md px-2 py-1 text-[11px] font-bold text-[#52746e] transition hover:bg-[#dfe9df] sm:flex" onClick={() => setNotice("Panduan kerja panitia akan tersedia saat rapat koordinasi berikutnya.")}>
              <CircleHelp className="h-3.5 w-3.5" />
              Butuh bantuan?
            </button>
          </div>

          <section className="committee-rise committee-delay-3 grid items-start gap-5 xl:grid-cols-[minmax(0,1.06fr)_minmax(420px,.94fr)]">
            <div className="min-w-0 overflow-hidden rounded-[18px] border border-[#d6d2c6] bg-[#f8f5ec] shadow-[0_15px_45px_rgba(34,61,57,.07)]">
              <div className="flex flex-col justify-between gap-4 px-5 pb-4 pt-5 sm:flex-row sm:items-end sm:px-6">
                <div>
                  <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#b55341]">
                    <FolderOpen className="h-3.5 w-3.5" />
                    Pengajuan masuk
                  </div>
                  <h2 className="m-0 font-['Fraunces'] text-[26px] font-semibold tracking-[-0.04em] text-[#173f43]">Daftar pendaftar</h2>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-[#88887e]">
                  <span className="rounded-full bg-[#e8e3d7] px-2.5 py-1.5">{filteredApplicants.length} ditampilkan</span>
                  <button type="button" className="rounded-md p-1.5 text-[#6d7c74] transition hover:bg-[#e5e9df] hover:text-[#173f43]" aria-label="Opsi daftar" onClick={() => setNotice("Daftar sedang menampilkan pengajuan paling baru.")}>
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="border-y border-[#dedbd0] bg-[#f3f0e6] px-4 py-4 sm:px-5">
                <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_130px_155px_auto]">
                  <label className="relative block sm:col-span-1">
                    <span className="sr-only">Cari nama atau nomor pengajuan</span>
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[#8d9086]" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      type="search"
                      placeholder="Cari nama atau nomor pengajuan"
                      className="h-10 w-full rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] pl-9 pr-3 text-[11px] text-[#294849] outline-none transition placeholder:text-[#a1a095] focus:border-[#527d75] focus:ring-2 focus:ring-[#527d75]/15"
                    />
                  </label>
                  <label className="relative block">
                    <span className="sr-only">Filter jenjang</span>
                    <select value={level} onChange={(event) => setLevel(event.target.value as "Semua jenjang" | Level)} className="h-10 w-full appearance-none rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] px-3 pr-8 text-[11px] text-[#4e5d59] outline-none transition focus:border-[#527d75] focus:ring-2 focus:ring-[#527d75]/15">
                      <option>Semua jenjang</option>
                      <option>SMA</option>
                      <option>SMK</option>
                      <option>SMP</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-[#84928a]" />
                  </label>
                  <label className="relative block">
                    <span className="sr-only">Filter status</span>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "Semua status" | Status)} className="h-10 w-full appearance-none rounded-lg border border-[#d4d1c5] bg-[#fbf9f2] px-3 pr-8 text-[11px] text-[#4e5d59] outline-none transition focus:border-[#527d75] focus:ring-2 focus:ring-[#527d75]/15">
                      <option>Semua status</option>
                      {statusOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                    <Filter className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-[#84928a]" />
                  </label>
                  <button type="button" onClick={refreshData} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1f5a5b] px-4 text-[11px] font-bold text-[#f7f3e9] transition hover:-translate-y-0.5 hover:bg-[#164849] focus:outline-none focus:ring-2 focus:ring-[#1f5a5b]/30">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Terapkan
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-[#e0ddd2] px-5 py-3 text-[10px] text-[#8b8c82] sm:px-6">
                <span>{isLoading ? "Memuat daftar…" : "Diurutkan berdasarkan pengajuan terbaru"}</span>
                <button type="button" className="inline-flex items-center gap-1 font-bold text-[#52746e] transition hover:text-[#173f43]" onClick={() => setSortNewest((current) => !current)}>
                  <ArrowDownUp className="h-3.5 w-3.5" />
                  {sortNewest ? "Terbaru" : "Terlama"}
                </button>
              </div>

              <div aria-live="polite" aria-busy={isLoading}>
                {isLoading ? (
                  <div className="space-y-3 px-5 py-5 sm:px-6">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex items-center gap-3 border-b border-[#e4e0d5] pb-4 last:border-0">
                        <span className="committee-skeleton h-9 w-9 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-2"><span className="committee-skeleton block h-3 w-2/5 rounded" /><span className="committee-skeleton block h-2.5 w-3/5 rounded" /></div>
                        <span className="committee-skeleton h-5 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredApplicants.length === 0 ? (
                  <div className="grid min-h-[330px] place-items-center px-8 py-14 text-center">
                    <div>
                      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-[#d3b769] text-[#b55341]"><Search className="h-5 w-5" /></div>
                      <h3 className="m-0 font-['Fraunces'] text-[21px] font-semibold text-[#173f43]">Belum ada yang cocok</h3>
                      <p className="mx-auto mt-2 max-w-[260px] text-[12px] leading-5 text-[#85867b]">Coba ubah kata kunci atau longgarkan salah satu filter untuk melihat pengajuan lain.</p>
                      <button type="button" className="mt-4 rounded-md border border-[#a5beb0] px-3 py-2 text-[11px] font-bold text-[#3d7068] transition hover:bg-[#e3ede5]" onClick={() => { setQuery(""); setLevel("Semua jenjang"); setStatusFilter("Semua status"); }}>Bersihkan filter</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {filteredApplicants.map((applicant) => (
                      <button
                        key={applicant.id}
                        type="button"
                        onClick={() => setSelectedId(applicant.id)}
                        className={`group grid w-full grid-cols-[36px_minmax(0,1fr)_auto_16px] items-center gap-3 border-b border-[#e3dfd4] px-5 py-4 text-left transition last:border-b-0 hover:bg-[#edf2e9] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#6b9685] sm:px-6 ${selectedApplicant?.id === applicant.id ? "bg-[#e8f0e9]" : "bg-transparent"}`}
                      >
                        <span className={`grid h-9 w-9 place-items-center rounded-full font-['Fraunces'] text-[14px] font-semibold ${selectedApplicant?.id === applicant.id ? "bg-[#1f5a5b] text-[#f8f3e8]" : "bg-[#f7e6bb] text-[#39635e]"}`}>{applicant.initials}</span>
                        <span className="min-w-0">
                          <strong className="block truncate text-[12px] font-bold text-[#2a4444]">{applicant.name}</strong>
                          <small className="mt-1 block truncate text-[10px] text-[#8a8c82]">{applicant.id} · {applicant.level} · {applicant.school}</small>
                        </span>
                        <span className="min-w-[96px] text-right">
                          <Badge status={applicant.status} />
                          <small className="mt-1.5 block truncate text-[9px] text-[#96968d]">{applicant.submitted}</small>
                        </span>
                        <ChevronRight className={`h-4 w-4 text-[#a2a59b] transition group-hover:translate-x-1 group-hover:text-[#3e706a] ${selectedApplicant?.id === applicant.id ? "text-[#3e706a]" : ""}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between bg-[#f2eee3] px-5 py-3 text-[10px] text-[#898a80] sm:px-6">
                <span>Menampilkan {filteredApplicants.length} dari 128 pengajuan</span>
                <button type="button" className="font-bold text-[#4f756d] transition hover:text-[#173f43]" onClick={() => setNotice("Semua pengajuan sudah dimuat dalam mockup ini.")}>Lihat semua</button>
              </div>
            </div>

            <aside className="min-w-0 overflow-hidden rounded-[18px] border border-[#d6d2c6] bg-[#f8f5ec] shadow-[0_15px_45px_rgba(34,61,57,.07)] xl:sticky xl:top-[92px]">
              {!selectedApplicant ? (
                <div className="grid min-h-[500px] place-items-center px-10 py-16 text-center">
                  <div><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-[#d3b769] text-[#b55341]"><UserRound className="h-5 w-5" /></div><h2 className="m-0 font-['Fraunces'] text-[24px] text-[#173f43]">Pilih satu pengajuan</h2><p className="mt-2 text-[12px] leading-5 text-[#85867b]">Detail calon peserta didik akan muncul di sini.</p></div>
                </div>
              ) : (
                <div>
                  <div className="border-b border-[#dedbd0] px-5 pb-5 pt-5 sm:px-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#b55341]"><FileCheck2 className="h-3.5 w-3.5" /> Detail pengajuan</div>
                        <h2 className="m-0 font-['Fraunces'] text-[27px] font-semibold leading-none tracking-[-0.045em] text-[#173f43]">{selectedApplicant.name}</h2>
                        <p className="m-0 mt-2 font-mono text-[9px] text-[#8c8d83]">{selectedApplicant.id} · Dikirim {selectedApplicant.date}</p>
                      </div>
                      <Badge status={selectedApplicant.status} />
                    </div>
                    <div className="rounded-lg border border-[#d8d4c6] bg-[#f1eee3] p-3.5">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div><p className="m-0 text-[10px] font-bold uppercase tracking-[0.1em] text-[#888a80]">Perbarui status</p><p className="m-0 mt-1 text-[11px] text-[#5f706b]">Perubahan tersimpan lokal</p></div>
                        <label className="relative block sm:w-[155px]"><span className="sr-only">Status pengajuan</span><select value={selectedApplicant.status} onChange={(event) => updateStatus(event.target.value as Status)} className="h-9 w-full appearance-none rounded-md border border-[#c8c8b9] bg-[#fbf9f2] px-3 pr-8 text-[11px] font-bold text-[#315b57] outline-none transition focus:border-[#527d75] focus:ring-2 focus:ring-[#527d75]/15">{statusOptions.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-[#69877e]" /></label>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[700px] overflow-y-auto px-5 sm:px-6">
                    <section className="border-b border-[#dedbd0] py-5">
                      <div className="mb-4 flex items-center justify-between"><h3 className="m-0 font-['Fraunces'] text-[19px] font-semibold text-[#173f43]">Calon peserta didik</h3><span className="rounded bg-[#e9e5d9] px-2 py-1 font-mono text-[9px] text-[#7e8177]">{selectedApplicant.route}</span></div>
                      <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
                        <DetailField label="Nama lengkap" value={selectedApplicant.name} />
                        <DetailField label="Jenjang" value={selectedApplicant.level} />
                        <DetailField label="Tempat, tanggal lahir" value={selectedApplicant.birth} />
                        <DetailField label="Jenis kelamin" value={selectedApplicant.gender} />
                        <DetailField label="NISN" value={selectedApplicant.nisn} />
                        <DetailField label="Nomor HP / WA" value={selectedApplicant.phone} />
                        <div className="col-span-2"><DetailField label="Alamat domisili" value={selectedApplicant.domicile} /></div>
                      </dl>
                    </section>

                    <section className="border-b border-[#dedbd0] py-5">
                      <h3 className="m-0 mb-4 font-['Fraunces'] text-[19px] font-semibold text-[#173f43]">Sekolah asal</h3>
                      <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
                        <div className="col-span-2"><DetailField label="Nama sekolah" value={selectedApplicant.school} /></div>
                        <DetailField label="Jalur pendaftaran" value={selectedApplicant.route} />
                        <DetailField label="Penanggung jawab" value={selectedApplicant.guardian} />
                      </dl>
                    </section>

                    <section className="border-b border-[#dedbd0] py-5">
                      <div className="mb-3 flex items-end justify-between gap-3"><div><h3 className="m-0 font-['Fraunces'] text-[19px] font-semibold text-[#173f43]">Dokumen pendukung</h3><p className="m-0 mt-1 text-[10px] text-[#929288]">{availableCount} dari {selectedApplicant.documents.length} dokumen tersedia</p></div><FileText className="h-5 w-5 text-[#8a9b8f]" /></div>
                      <div className="space-y-2">
                        {selectedApplicant.documents.map((document) => (
                          <button key={document.name} type="button" disabled={!document.available} onClick={() => setNotice(`${document.name} siap ditinjau — pratinjau dokumen dibuka di tab baru.`)} className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition ${document.available ? "border-[#d3d8ca] bg-[#f5f5eb] text-[#3c6c66] hover:border-[#8aafa0] hover:bg-[#e9f0e8]" : "border-dashed border-[#d8d5ca] bg-[#f1eee5] text-[#a09f95]"}`}>
                            <span className="flex min-w-0 items-center gap-2.5"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded ${document.available ? "bg-[#dcebe0] text-[#4e806f]" : "bg-[#e7e3d9] text-[#a8a79d]"}`}>{document.available ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}</span><span className="min-w-0"><strong className="block truncate text-[11px] font-bold">{document.name}</strong><small className="mt-0.5 block truncate text-[9px] text-[#999a91]">{document.meta}</small></span></span>
                            <span className="shrink-0 text-[9px] font-bold">{document.available ? "Buka" : "Belum ada"}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="py-5">
                      <div className="flex gap-3 rounded-lg border border-[#ead9a6] bg-[#fff6d9] p-3.5"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#ad7921]" /><div><p className="m-0 text-[10px] font-bold uppercase tracking-[0.1em] text-[#92702b]">{selectedApplicant.priority}</p><p className="m-0 mt-1.5 text-[11px] leading-5 text-[#756443]">{selectedApplicant.note}</p></div></div>
                    </section>
                  </div>
                </div>
              )}
            </aside>
          </section>

          <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-[#d2cec2] pt-5 text-[10px] text-[#8e8d83] sm:flex-row sm:items-center">
            <p className="m-0">SPMB 2027/2028 · Panel panitia · Akses internal</p>
            <p className="m-0 flex items-center gap-2 font-mono text-[#638077]"><ShieldCheck className="h-3.5 w-3.5" /> Data tersimpan aman</p>
          </footer>
        </main>

        {notice && (
          <div role="status" className="fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-full border border-[#406e68] bg-[#173f43] px-4 py-3 text-[11px] font-bold text-[#f7f1e4] shadow-[0_12px_28px_rgba(18,52,52,.24)]">
            <Check className="h-3.5 w-3.5 shrink-0 text-[#edbe52]" />
            <span className="truncate">{notice}</span>
          </div>
        )}
      </div>
    </div>
  );
}