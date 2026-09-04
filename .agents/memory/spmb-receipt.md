---
name: SPMB receipt template
description: Important constraint when generating the SPMB receipt from the supplied PDF template.
---

The supplied SPMB receipt PDF is a flattened, already-populated sample rather than an interactive form. Dynamic receipts must cover the sample values before drawing new values, and uploaded image documents can replace the image areas directly; uploaded PDFs need an additional-page fallback because they cannot be rendered into a PDF rectangle by the current library.

**Why:** Treating the sample as a form or simply drawing new text on top leaves the original applicant's data visible and produces an unusable receipt.

**How to apply:** Keep the template asset bundled with the API service, preserve its seven-page structure, and visually render generated receipts when changing field coordinates or attachment handling.