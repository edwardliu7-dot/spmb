---
name: SPMB external database schema sync
description: Runtime database can differ from the Replit database pane and retain older not-null constraints.
---

The SPMB API may run against an external database supplied through DATABASE_URL, while database inspection tools show the separate Replit development database. The source model allows school-origin fields to be empty for Playgroup, Daycare, TK-A, and TK-B, but an older runtime database can still reject null values.

**Why:** A submission can pass all form validation and still fail at insert time when the runtime database schema was not migrated with the source model.

**How to apply:** When this specific insert failure appears, inspect the runtime database schema and make `nama_sekolah_asal`, `tahun_lulus`, and `alamat_sekolah_asal` nullable before asking the user to retry. Do not assume the Replit database pane reflects an external `DATABASE_URL`, and do not apply a blind schema push when the migration tool asks about unrelated historical column changes.