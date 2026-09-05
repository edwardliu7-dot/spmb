# Formulir SPMB 2027/2028

Formulir pendaftaran siswa baru untuk tahun ajaran 2027/2028 dengan penyimpanan data dan berkas upload di PostgreSQL.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/spmb-2027 run dev` — run the registration form
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Multer
- DB: PostgreSQL melalui Drizzle ORM dan `DATABASE_URL`
- Validation: server-side validation for multipart form values
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/spmb-2027/` — Vite-served frontend application
- `artifacts/api-server/src/routes/submit.ts` — multipart submission endpoint
- `artifacts/api-server/src/lib/spmb-database.ts` — PostgreSQL insert helper
- `artifacts/api-server/uploads/` — legacy uploaded documents
- `lib/db/src/schema/pendaftar.ts` — PostgreSQL schema tabel `pendaftar`
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- The public form is intentionally implemented with vanilla HTML, CSS, and JavaScript even though the Vite artifact scaffold supports React.
- PostgreSQL uses the workspace's runtime-managed `DATABASE_URL`; the credential is never hardcoded in source.
- New uploaded files are stored as byte data in PostgreSQL; legacy filesystem paths remain readable as a compatibility fallback.

## Product

Pengguna dapat mengisi formulir pendaftaran SPMB dalam empat bagian, mengunggah lima berkas persyaratan, mengirim data, dan menerima konfirmasi keberhasilan.

## Aturan usia pendaftaran

- Usia dihitung pada 1 Juli 2027.
- Playgroup: minimal 3 tahun.
- TK-A: minimal 4 tahun.
- TK-B: minimal 5 tahun.
- SD: minimal 6 tahun.
- SMP tidak memiliki batas usia minimum.
- Daycare tidak memiliki batas usia minimum yang ditetapkan.

## User preferences

- Gunakan Bahasa Indonesia pada antarmuka.
- Pertahankan frontend dengan HTML, CSS, dan JavaScript murni.

## Gotchas

- Server membutuhkan secret `DATABASE_URL` yang mengarah ke PostgreSQL.
- Untuk deployment Coolify, sinkronkan tabel `application_file` pada database yang ditunjuk `DATABASE_URL` sebelum menerima pengajuan baru.
- `UPLOADS_DIRECTORY` hanya diperlukan untuk membaca berkas lama dari filesystem; berkas baru tidak lagi disimpan di container.
- Berkas lama yang sudah hilang dari container tidak dapat dipulihkan dari path database saja.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
