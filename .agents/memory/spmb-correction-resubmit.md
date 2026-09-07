---
name: SPMB correction resubmit files
description: Durable rule for validating uploads during public correction and resubmission.
---

Correction mode must track files that already exist on the server separately from files restored from the browser's local draft store. A server-retained file can satisfy the required-upload check even when no browser File object exists; a local metadata placeholder alone must not do so.

**Why:** A correction submission intentionally allows the registrant to leave an existing document unchanged, while ordinary drafts still need a real Blob/File before they can be sent.

**How to apply:** Keep server-file availability scoped to the active correction record, clear it when returning to a new submission, and let the API remain authoritative for retaining or replacing each document.