# Formulir SPMB 2027/2028

Formulir pendaftaran siswa baru untuk tahun ajaran 2027/2028 dengan penyimpanan data dan berkas secara lokal.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/spmb-2027 run dev` — run the registration form
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Multer
- DB: SQLite via Node.js built-in `node:sqlite`
- Validation: server-side validation for multipart form values
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/spmb-2027/` — Vite-served frontend application
- `artifacts/api-server/src/routes/submit.ts` — multipart submission endpoint
- `artifacts/api-server/src/lib/spmb-database.ts` — SQLite schema and insert statement
- `artifacts/api-server/uploads/` — uploaded documents
- `artifacts/api-server/data/pendaftar.sqlite` — local SQLite database file
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- The public form is intentionally implemented with vanilla HTML, CSS, and JavaScript even though the Vite artifact scaffold supports React.
- SQLite uses Node 24's built-in `node:sqlite`, avoiding a native addon build step while keeping the requested database engine.
- Uploaded files are stored on disk and only their relative paths are persisted in `pendaftar`.

## Product

Pengguna dapat mengisi formulir pendaftaran SPMB dalam empat bagian, mengunggah lima berkas persyaratan, mengirim data, dan menerima konfirmasi keberhasilan.

## User preferences

- Gunakan Bahasa Indonesia pada antarmuka.
- Pertahankan frontend dengan HTML, CSS, dan JavaScript murni.

## Gotchas

- Server membutuhkan Node.js 24 atau lebih baru karena memakai `node:sqlite`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
