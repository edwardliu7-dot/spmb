---
name: SPMB Safari upload draft
description: Safari may restore IndexedDB file drafts as Blob or a different File realm.
---

Safari can preserve the visible draft filename and size while returning the
stored upload as a Blob or a File object that fails `instanceof File`.

**Why:** The browser draft metadata is stored in localStorage separately from
the binary, so the upload card can look complete while FormData has no usable
file after a reload.

**How to apply:** Store draft binaries as Blob records with explicit filename,
MIME type, and modification time, then reconstruct a File before building the
submission FormData. Do not rely only on `instanceof File` for IndexedDB data.