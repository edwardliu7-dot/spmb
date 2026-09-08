import { and, eq, sql } from "drizzle-orm";
import { db, pendaftarTable, registrationQuotaAdjustmentTable, waitingListTable } from "@workspace/db";

export const registrationQuotaDefinitions = [
  { jenjang: "Playgroup", quota: 15, genderQuotas: null },
  { jenjang: "Daycare", quota: null, genderQuotas: null },
  { jenjang: "TK-A", quota: 21, genderQuotas: null },
  { jenjang: "TK-B", quota: 6, genderQuotas: null },
  {
    jenjang: "SD",
    quota: 53,
    genderQuotas: { "Laki-laki": 26, Perempuan: 27 },
  },
  { jenjang: "SMP", quota: 25, genderQuotas: null },
] as const;

export type RegistrationQuotaDefinition = (typeof registrationQuotaDefinitions)[number];
export type RegistrationQuotaAdjustment = {
  jenjang: string;
  jenisKelamin: string | null;
  filled: number;
};

export type ActiveWaitingCount = {
  jenjang: string;
  jenisKelamin: string | null;
  count: number;
};

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

export function adjustmentScope(jenjang: string, jenisKelamin: string | null): string {
  return jenisKelamin ? `${jenjang}:${jenisKelamin}` : jenjang;
}

function configuredAdjustmentScopes(): RegistrationQuotaAdjustment[] {
  const scopes: RegistrationQuotaAdjustment[] = [];
  for (const definition of registrationQuotaDefinitions) {
    if (definition.genderQuotas) {
      for (const jenisKelamin of Object.keys(definition.genderQuotas)) {
        scopes.push({ jenjang: definition.jenjang, jenisKelamin, filled: 0 });
      }
    } else {
      scopes.push({ jenjang: definition.jenjang, jenisKelamin: null, filled: 0 });
    }
  }
  return scopes;
}

async function readManualAdjustments(): Promise<RegistrationQuotaAdjustment[]> {
  try {
    const result = await db.execute(sql`
      SELECT jenjang, jenis_kelamin, filled
      FROM registration_quota_adjustment
    `);
    return (result.rows as Array<{ jenjang: string; jenis_kelamin: string | null; filled: number | string }>)
      .map((row) => ({
        jenjang: row.jenjang,
        jenisKelamin: row.jenis_kelamin,
        filled: Math.max(0, Number(row.filled) || 0),
      }));
  } catch (error) {
    const errorWithCause = error as { code?: unknown; cause?: unknown } | null;
    const causeWithCode = errorWithCause?.cause as { code?: unknown } | null;
    if (
      String(errorWithCause?.code || "") === "42P01"
      || String(causeWithCode?.code || "") === "42P01"
    ) {
      return [];
    }
    throw error;
  }
}

export async function listActiveWaitingCounts(): Promise<ActiveWaitingCount[]> {
  try {
    const rows = await db
      .select({
        jenjang: waitingListTable.jenjang,
        jenisKelamin: waitingListTable.jenis_kelamin,
        count: sql<number>`count(*)`,
      })
      .from(waitingListTable)
      .where(eq(waitingListTable.status, "active"))
      .groupBy(waitingListTable.jenjang, waitingListTable.jenis_kelamin);
    return rows.map((row) => ({
      jenjang: row.jenjang,
      jenisKelamin: row.jenisKelamin,
      count: Number(row.count) || 0,
    }));
  } catch (error) {
    const errorWithCause = error as { code?: unknown; cause?: unknown } | null;
    const causeWithCode = errorWithCause?.cause as { code?: unknown } | null;
    if (
      String(errorWithCause?.code || "") === "42P01"
      || String(causeWithCode?.code || "") === "42P01"
    ) {
      return [];
    }
    throw error;
  }
}

export async function listRegistrationQuotaAdjustments(): Promise<RegistrationQuotaAdjustment[]> {
  const stored = await readManualAdjustments();
  const storedByScope = new Map(stored.map((item) => [adjustmentScope(item.jenjang, item.jenisKelamin), item.filled]));
  return configuredAdjustmentScopes().map((item) => ({
    ...item,
    filled: storedByScope.get(adjustmentScope(item.jenjang, item.jenisKelamin)) || 0,
  }));
}

export async function saveRegistrationQuotaAdjustments(
  adjustments: RegistrationQuotaAdjustment[],
  updatedBy: string,
): Promise<RegistrationQuotaAdjustment[]> {
  await db.transaction(async (tx) => {
    await tx.delete(registrationQuotaAdjustmentTable);
    const values = adjustments
      .filter((item) => item.filled > 0)
      .map((item) => ({
        scope: adjustmentScope(item.jenjang, item.jenisKelamin),
        jenjang: item.jenjang,
        jenis_kelamin: item.jenisKelamin,
        filled: item.filled,
        updated_by: updatedBy,
      }));
    if (values.length) await tx.insert(registrationQuotaAdjustmentTable).values(values);
  });
  return listRegistrationQuotaAdjustments();
}

export async function getRegistrationQuotaSummary() {
  const [rows, manualAdjustments, waitingCounts] = await Promise.all([
    db
      .select({
        jenjang: pendaftarTable.jenjang,
        jenisKelamin: pendaftarTable.jenis_kelamin,
        count: sql<number>`count(*)`,
      })
      .from(pendaftarTable)
      .groupBy(pendaftarTable.jenjang, pendaftarTable.jenis_kelamin),
    listRegistrationQuotaAdjustments(),
    listActiveWaitingCounts(),
  ]);

  return {
    levels: registrationQuotaDefinitions.map((definition) => {
      const levelRows = rows.filter((row) => row.jenjang === definition.jenjang);
      const registeredFilled = levelRows.reduce((total, row) => total + Number(row.count), 0);
      const waitingLevelCount = waitingCounts
        .filter((item) => item.jenjang === definition.jenjang)
        .reduce((total, item) => total + item.count, 0);
      const levelManual = manualAdjustments.find((item) => item.jenjang === definition.jenjang && item.jenisKelamin === null)?.filled || 0;
      const gender = definition.genderQuotas
        ? Object.entries(definition.genderQuotas).map(([jenisKelamin, quota]) => {
            const genderFilled = levelRows
              .filter((row) => row.jenisKelamin === jenisKelamin)
              .reduce((total, row) => total + Number(row.count), 0);
            const manualFilled = manualAdjustments.find((item) => item.jenjang === definition.jenjang && item.jenisKelamin === jenisKelamin)?.filled || 0;
            const waitingFilled = waitingCounts
              .filter((item) => item.jenjang === definition.jenjang && item.jenisKelamin === jenisKelamin)
              .reduce((total, item) => total + item.count, 0);
            return {
              jenisKelamin,
              quota,
              registeredFilled: genderFilled,
              manualFilled,
              waitingFilled,
              filled: genderFilled + manualFilled + waitingFilled,
              remaining: remaining(quota, genderFilled + manualFilled + waitingFilled),
              isFull: genderFilled + manualFilled + waitingFilled >= quota,
            };
          })
        : null;
      const manualFilled = definition.genderQuotas
        ? (gender || []).reduce((total, item) => total + item.manualFilled, 0)
        : levelManual;
      const waitingFilled = definition.genderQuotas
        ? (gender || []).reduce((total, item) => total + item.waitingFilled, 0)
        : waitingLevelCount;
      const filled = registeredFilled + manualFilled + waitingFilled;

      return {
        jenjang: definition.jenjang,
        quota: definition.quota,
        registeredFilled,
        manualFilled,
        waitingFilled,
        filled,
        remaining: remaining(definition.quota, filled),
        isFull: definition.quota !== null && filled >= definition.quota,
        gender,
      };
    }),
    updatedAt: new Date().toISOString(),
  };
}