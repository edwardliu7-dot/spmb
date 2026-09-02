---
name: SPMB runtime decisions
description: Runtime constraints and implementation choices for the SPMB registration app.
---

The SPMB app uses the workspace's runtime-managed `DATABASE_URL` for PostgreSQL through Drizzle ORM. Uploaded document bytes remain on the server filesystem and only relative paths are stored in PostgreSQL.

**Why:** The project now needs PostgreSQL-backed persistence and the workspace database credentials are supplied securely at runtime.

**How to apply:** Keep database access through `@workspace/db` and the runtime-managed connection; do not put database credentials in source files.