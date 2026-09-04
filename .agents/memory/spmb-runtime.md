---
name: SPMB runtime decisions
description: Runtime constraints and implementation choices for the SPMB registration app.
---

The SPMB app uses the workspace's runtime-managed `DATABASE_URL` for PostgreSQL through Drizzle ORM. In development, if the injected URL is a placeholder, compose a non-SSL URL from the runtime PG* variables. Uploaded document bytes remain on the server filesystem and only relative paths are stored in PostgreSQL.

**Why:** The project now needs PostgreSQL-backed persistence and the workspace database credentials are supplied securely at runtime.

**How to apply:** Keep database access through `@workspace/db` and runtime-managed connection values; do not put database credentials in source files. The PG* development endpoint does not support SSL, while a complete DATABASE_URL should be used unchanged.

Project artifact services should not override workspace secrets with TOML values such as `$GROQ_API_KEY`; leave secret names to the runtime injection and configure only non-secret service settings explicitly.

**Why:** An artifact-level `$SECRET_NAME` override was passed through as a literal value, causing an otherwise valid Groq request to be rejected until the override was removed.

**How to apply:** When adding a project secret, verify it is available through the runtime environment after a service restart; do not place secret values or interpolation-looking placeholders in artifact configuration.