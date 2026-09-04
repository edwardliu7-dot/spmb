---
name: SPMB OpenAPI numeric schemas
description: Compatibility constraint between the workspace OpenAPI generator and its installed Zod version
---

For new numeric response and query schemas in the SPMB API contract, prefer the OpenAPI `number` type over `integer` while the current Orval/Zod toolchain is in place.

**Why:** The installed generated Zod client targets a Zod version without `zod.int()`, so `integer` schemas can make codegen fail even though TypeScript and the API implementation are otherwise valid.

**How to apply:** If an API field needs integer semantics, enforce that at runtime or in the server type while keeping the contract as `number`; revisit this after upgrading the generator and Zod versions together.