import assert from "node:assert/strict";
import test from "node:test";
// Node's native TypeScript runner needs the .ts extension; the project build does not.
// @ts-expect-error TS5097: test-only native Node import
import { getMinimumAgeError } from "./age-rules.ts";

test("usia tepat pada 31 Juli memenuhi syarat", () => {
  assert.equal(getMinimumAgeError("SD", "2021-07-31"), null);
});

test("usia yang baru genap 1 Agustus belum memenuhi syarat", () => {
  assert.match(
    getMinimumAgeError("SD", "2021-08-01") ?? "",
    /minimal 6 tahun pada 31 Juli 2027/,
  );
});

test("Daycare dan SMP tidak memiliki batas usia minimum", () => {
  assert.equal(getMinimumAgeError("SMP", "2027-08-01"), null);
});