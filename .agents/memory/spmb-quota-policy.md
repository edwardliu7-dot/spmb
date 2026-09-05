---
name: SPMB quota policy
description: Registration quota rules and the handling of the unconfigured Daycare quota.
---

Numeric quotas are enforced server-side from current database counts. SD has both a total quota and separate putra/putri limits; Daycare remains unlimited until an explicit quota is provided.

**Why:** The supplied quota list included Playgroup, TK-A, TK-B, SD, and SMP, but no Daycare value. Treating Daycare as unlimited preserves the existing registration path instead of inventing a capacity.

**How to apply:** If a Daycare quota is later supplied, update the shared quota definition and keep the public summary, admin recap, WhatsApp message, and transactional enforcement driven by that same definition.