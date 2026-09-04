---
name: SPMB production start
description: Startup constraint for the SPMB production container.
---

The production container must start the already-built server directly; it must not run the full workspace build again during startup.

**Why:** The publishing system builds the image before starting it. Rebuilding from the `start` command delays the HTTP response long enough for the container health probe to fail and triggers a rollback even when the build itself succeeded.

**How to apply:** Keep the root production start command focused on `scripts/production-server.mjs`; validate the image build and startup response separately.