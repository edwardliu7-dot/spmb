---
name: SPMB runtime decisions
description: Runtime constraints and implementation choices for the SPMB registration app.
---

The SPMB app uses the workspace's runtime-managed `DATABASE_URL` for PostgreSQL through Drizzle ORM. In development, if the injected URL is a placeholder, compose a non-SSL URL from the runtime PG* variables. New uploaded document bytes are stored in PostgreSQL in `application_file`; legacy relative paths remain a filesystem fallback.

**Why:** Container filesystems are not durable across Coolify releases, while the workspace database credentials are supplied securely at runtime.

**How to apply:** Keep database access through `@workspace/db` and runtime-managed connection values; do not put database credentials in source files. Keep the additive `application_file` table synchronized before accepting new multipart submissions. The PG* development endpoint does not support SSL, while a complete DATABASE_URL should be used unchanged.

The API workflow reads its database connection at process startup; after the runtime database secret or endpoint changes, an already-running API can query the previous connection until it is restarted.

**Why:** A newly submitted SPMB record was absent from the API response while present in the runtime database, then became available immediately after restarting the API workflow.

**How to apply:** Restart the API service before diagnosing a newly submitted record as missing, especially after changing database secrets, deployment settings, or external database endpoints.

Upload and asset paths must be derived from the module location rather than `process.cwd()`, because filtered pnpm workflows can launch an artifact with the package directory as the current directory while production launches from the workspace root.

**Why:** Using the current directory created a nested upload directory in development, making database paths valid but unreadable when the receipt was generated from the normal package root.

**How to apply:** Resolve package assets from the compiled module's package root and keep a compatibility lookup for files created by the old nested path.

Project artifact services should not override workspace secrets with TOML values such as `$GROQ_API_KEY`; leave secret names to the runtime injection and configure only non-secret service settings explicitly.

**Why:** An artifact-level `$SECRET_NAME` override was passed through as a literal value, causing an otherwise valid Groq request to be rejected until the override was removed.

**How to apply:** When adding a project secret, verify it is available through the runtime environment after a service restart; do not place secret values or interpolation-looking placeholders in artifact configuration.

The external Coolify release process does not run the Replit post-merge hook automatically, so its PostgreSQL schema must be synchronized separately before serving a build that adds columns.

**Why:** A basic `select 1 from pendaftar` health check can still pass while an insert fails because one of the newer application or upload columns is absent.

**How to apply:** Include the database schema synchronization command in the Coolify release procedure, with the production `DATABASE_URL` available, before restarting the application.

When the parent identity field changed, existing `nik_orangtua` values were preserved as `nik_ayah`; existing records may have no `nik_ibu`, while new submissions still require it.

**Why:** A mother's NIK cannot be safely inferred from existing data, but discarding the old parent NIK would lose useful information.

**How to apply:** Keep `nik_ibu` nullable for legacy detail responses and do not backfill it with a guessed value; enforce it at the new-submission form and endpoint boundary.