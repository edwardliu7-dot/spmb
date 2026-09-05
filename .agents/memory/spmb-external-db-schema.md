---
name: SPMB external database schema sync
description: Runtime database can differ from the Replit database pane and retain older not-null constraints.
---

The SPMB API may run against an external database supplied through DATABASE_URL, while database inspection tools show the separate Replit development database. The source model allows school-origin fields to be empty for Playgroup, Daycare, TK-A, and TK-B, but an older runtime database can still reject null values.

**Why:** A submission can pass all form validation and still fail at insert time when the runtime database schema was not migrated with the source model.

**How to apply:** When this specific insert failure appears, inspect the runtime database schema and make `nama_sekolah_asal`, `tahun_lulus`, and `alamat_sekolah_asal` nullable before asking the user to retry. Do not assume the Replit database pane reflects an external `DATABASE_URL`, and do not apply a blind schema push when the migration tool asks about unrelated historical column changes.

The external database may also contain only the legacy `pendaftar` table: newer
columns such as `nis` and feature tables for notifications, status history, and
audit logs can be absent. The health query only checks that `pendaftar` exists,
so it can report `database: ok` while panel feature queries return 500.

**How to apply:** When a deployment reports that the list or panel data cannot
be loaded, inspect both required columns and required relations. Preserve
legacy records with a read-compatible fallback, and migrate additive columns
and feature tables separately rather than assuming a successful health check
means the full schema is current.

New multipart submissions also require the additive `application_file` table
with its `bytea` data column. The API deliberately fails the whole submission
transaction if this table is absent, rather than silently returning to
container-only storage.

**Why:** A successful `pendaftar` insert without its files would recreate the
original failure mode where database paths outlive their file contents.

**How to apply:** Synchronize `application_file` on the external Coolify
database before deploying the new upload flow. Existing path-only records
remain readable only when their legacy files still exist.

Post-insert work is also schema-sensitive: generating a server-side NIS and
creating committee notifications happen after the base pendaftar insert.

**Why:** If either follow-up operation fails on a legacy database, the row can
already exist while the client receives a 500 and may submit the same person
again.

**How to apply:** Check the live column/table inventory before post-insert
updates, skip unavailable additive features, and treat failures in optional
history, audit, or notification writes as non-fatal so the successful core
insert/status update is returned.