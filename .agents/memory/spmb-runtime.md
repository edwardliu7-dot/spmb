---
name: SPMB runtime decisions
description: Runtime constraints and implementation choices for the SPMB registration app.
---

The SPMB app uses Node.js 24's built-in `node:sqlite` instead of a native SQLite npm addon. This keeps the requested SQLite backend runnable in the workspace without requiring native addon build approval.

**Why:** Native addon installation was blocked from running build scripts in this environment, while `node:sqlite` is available in the configured Node runtime.

**How to apply:** Keep the API server on Node.js 24+ and preserve the `uploads/` plus SQLite file layout when extending the registration flow.