---
name: SPMB multipart validation
description: Contract validation rules for the multipart registration submission flow.
---

For multipart submissions, validate the generated text contract together with explicit placeholders for uploaded file fields. The schema describes uploads as strings, while the runtime request contains Multer files, so validating only `request.body` makes every otherwise valid submission fail on required file fields.

**Why:** The generated contract includes the five required uploads, but file metadata is exposed separately from text fields by Multer.

**How to apply:** Use uploaded filenames only for contract presence/type validation, keep actual file checks (required, size, MIME, and signature) in the upload-specific validation path, and convert blank nullable text fields to `null` before schema parsing.