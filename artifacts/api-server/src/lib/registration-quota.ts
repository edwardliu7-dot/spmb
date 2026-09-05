import { sql } from "drizzle-orm";
import { db, pendaftarTable } from "@workspace/db";

export const registrationQuotaDefinitions = [
  { jenjang: "Playgroup", quota: 15, genderQuotas: null },
  { jenjang: "Daycare", quota: null, genderQuotas: null },
  { jenjang: "TK-A", quota: 21, genderQuotas: null },
  { jenjang: "TK-B", quota: 6, genderQuotas: null },
  {
    jenjang: "SD",
    quota: 52,
    genderQuotas: { "Laki-laki": 26, Perempuan: 26 },
  },
  { jenjang: "SMP", quota: 25, genderQuotas: null },
] as const;

export type RegistrationQuotaDefinition = (typeof registrationQuotaDefinitions)[number];

export class RegistrationQuotaFullError extends Error {
  readonly code = "REGISTRATION_QUOTA_FULL";
  readonly jenjang: string;
  readonly jenisKelamin: string | null;

  constructor(jenjang: string, jenisKelamin: string | null, quota: number) {
    const genderLabel = jenisKelamin === "Laki-laki" ? "putra" : jenisKelamin === "Perempuan" ? "putri" : null;
    super(genderLabel
      ? `Kuota ${jenjang} untuk ${genderLabel} sudah penuh (${quota} pendaftar).`
      : `Kuota ${jenjang} sudah penuh (${quota} pendaftar).`);
    this.name = "RegistrationQuotaFullError";
    this.jenjang = jenjang;
    this.jenisKelamin = jenisKelamin;
  }
}

export function getQuotaDefinition(jenjang: string): RegistrationQuotaDefinition | undefined {
  return registrationQuotaDefinitions.find((definition) => definition.jenjang === jenjang);
}

function remaining(quota: number | null, filled: number): number | null {
  return quota === null ? null : Math.max(0, quota - filled);
}

export async function getRegistrationQuotaSummary() {
  const rows = await db
    .select({
      jenjang: pendaftarTable.jenjang,
      jenisKelamin: pendaftarTable.jenis_kelamin,
      count: sql<number>`count(*)`,
    })
    .from(pendaftarTable)
    .groupBy(pendaftarTable.jenjang, pendaftarTable.jenis_kelamin);

  return {
    levels: registrationQuotaDefinitions.map((definition) => {
      const levelRows = rows.filter((row) => row.jenjang === definition.jenjang);
      const filled = levelRows.reduce((total, row) => total + Number(row.count), 0);
      const gender = definition.genderQuotas
        ? Object.entries(definition.genderQuotas).map(([jenisKelamin, quota]) => {
            const genderFilled = levelRows
              .filter((row) => row.jenisKelamin === jenisKelamin)
              .reduce((total, row) => total + Number(row.count), 0);
            return {
              jenisKelamin,
              quota,
              filled: genderFilled,
              remaining: remaining(quota, genderFilled),
              isFull: genderFilled >= quota,
            };
          })
        : null;

      return {
        jenjang: definition.jenjang,
        quota: definition.quota,
        filled,
        remaining: remaining(definition.quota, filled),
        isFull: definition.quota !== null && filled >= definition.quota,
        gender,
      };
    }),
    updatedAt: new Date().toISOString(),
  };
}