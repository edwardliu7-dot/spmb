---
name: Publish lockfile compatibility
description: Compatibility rule for reproducible pnpm installs during publishing.
---

The lockfile must be generated and validated with the same pnpm version used by the publishing builder; a newer local pnpm can report the lockfile as valid while the builder rejects it.

**Why:** The publish builder uses pnpm 9.15.9, and a lockfile produced under pnpm 10 triggered `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` during frozen installation.

**How to apply:** Before publishing after dependency or workspace-config changes, run the builder's exact pnpm version with `install --frozen-lockfile` and the artifact's production build command.