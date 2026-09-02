---
name: Committee access
description: Authentication and authorization decisions for the SPMB committee panel.
---

The committee panel uses four fixed local accounts with scrypt-hashed passwords and a signed, HTTP-only cookie session. The server enforces each account's allowed jenjang scope on list, detail, document, and status endpoints; the frontend only mirrors that scope for usability.

**Why:** The panel contains applicant and document data, so hiding filters in the browser is insufficient. A signed session and server-side scope checks prevent unauthenticated access and cross-jenjang reads or updates.

**How to apply:** Keep all committee API authorization in the server middleware and scope checks. If accounts or permissions change, update the account definitions and the UI's displayed scope together; never expose password hashes or raw upload paths.