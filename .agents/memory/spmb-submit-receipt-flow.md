---
name: SPMB submit and receipt flow
description: Boundary between multipart submission and receipt PDF generation.
---

The public submission endpoint stores the multipart data and returns the application ID plus a signed receipt URL. It does not call the PDF generator. `createSpmbReceipt` runs only when the receipt URL is opened, so a form that remains in the submitting state should first be investigated at browser validation, multipart upload, or database insert.

**Why:** This distinction prevents receipt rendering from being treated as the cause of a submission request that never reaches or completes the submit endpoint.

**How to apply:** Check API logs for `POST /api/submit` before changing receipt code. If no POST appears, inspect frontend validation, draft-file IndexedDB reads, or the browser/network path first.