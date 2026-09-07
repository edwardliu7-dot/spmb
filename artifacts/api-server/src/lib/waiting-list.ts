import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  pendaftarTable,
  waitingListMatchTable,
  waitingListTable,
} from "@workspace/db";

export type WaitingListItem = {
  id: number;
  nama: string;
  jenjang: string;
  jenis_kelamin: string | null;
  catatan: string | null;
  created_at: Date;
  added_by: string;
};

export type WaitingListApplication = {
  id: number;
  nama_calon: string;
  jenjang: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  created_at: Date;
};

export type WaitingListMatch = {
  waitingListId: number;
  applicationId: number;
  waitingName: string;
  applicationName: string;
  jenjang: string;
  confidence: number;
  reason: string;
  source: "ai" | "heuristic";
};

export function normalizeWaitingListName(value: string): string {
  return value
    .toLocaleLowerCase("id-ID")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(bin|binti|br|bro)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function levenshtein(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column];
      previous[column] = left[row - 1] === right[column - 1]
        ? diagonal
        : Math.min(diagonal + 1, previous[column] + 1, previous[column - 1] + 1);
      diagonal = above;
    }
  }
  return previous[right.length];
}

function heuristicMatch(
  waiting: WaitingListItem,
  application: WaitingListApplication,
): WaitingListMatch | null {
  if (waiting.jenjang !== application.jenjang) return null;
  const waitingName = normalizeWaitingListName(waiting.nama);
  const applicationName = normalizeWaitingListName(application.nama_calon);
  if (!waitingName || !applicationName) return null;
  const waitingTokens = new Set(waitingName.split(" "));
  const applicationTokens = new Set(applicationName.split(" "));
  const sharedTokens = [...waitingTokens].filter((token) => applicationTokens.has(token));
  const shorter = Math.min(waitingName.length, applicationName.length);
  const editSimilarity = shorter
    ? 1 - (levenshtein(waitingName, applicationName) / Math.max(waitingName.length, applicationName.length))
    : 0;
  let confidence = 0;
  let reason = "";
  if (waitingName === applicationName) {
    confidence = 0.99;
    reason = "Nama sama persis.";
  } else if (waitingName.includes(applicationName) || applicationName.includes(waitingName)) {
    confidence = 0.88;
    reason = "Salah satu nama merupakan bagian dari nama lainnya.";
  } else if (sharedTokens.length >= 2) {
    confidence = 0.82;
    reason = `Ada ${sharedTokens.length} kata nama yang sama.`;
  } else if (editSimilarity >= 0.72) {
    confidence = 0.72;
    reason = "Nama memiliki kemiripan ejaan yang tinggi.";
  } else if (sharedTokens.length === 1 && waiting.jenis_kelamin && waiting.jenis_kelamin === application.jenis_kelamin) {
    confidence = 0.62;
    reason = "Ada satu kata nama yang sama dan jenis kelamin sesuai.";
  }
  if (!confidence) return null;
  if (waiting.jenis_kelamin && waiting.jenis_kelamin !== application.jenis_kelamin) {
    confidence = Math.max(0, confidence - 0.2);
    reason += " Jenis kelamin berbeda, mohon periksa lebih teliti.";
  }
  return {
    waitingListId: waiting.id,
    applicationId: application.id,
    waitingName: waiting.nama,
    applicationName: application.nama_calon,
    jenjang: waiting.jenjang,
    confidence: Number(confidence.toFixed(2)),
    reason,
    source: "heuristic",
  };
}

function parseJsonContent(content: string): unknown {
  const withoutFence = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Respons pencocokan AI tidak berbentuk JSON.");
    return JSON.parse(withoutFence.slice(start, end + 1));
  }
}

async function getAiMatches(
  waitingItems: WaitingListItem[],
  applications: WaitingListApplication[],
  rejectedPairs: Set<string>,
): Promise<WaitingListMatch[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !waitingItems.length || !applications.length) return [];
  const input = {
    waiting: waitingItems.map((item) => ({
      id: item.id,
      nama: item.nama,
      jenjang: item.jenjang,
      jenis_kelamin: item.jenis_kelamin,
    })),
    applications: applications.map((item) => ({
      id: item.id,
      nama_calon: item.nama_calon,
      jenjang: item.jenjang,
      jenis_kelamin: item.jenis_kelamin,
    })),
  };
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Anda membantu panitia sekolah mencocokkan daftar tunggu dengan pendaftar baru.",
            "Jangan pernah menyatakan identitas pasti. Berikan hanya kandidat yang layak diperiksa manusia.",
            "Cocokkan hanya jika jenjang sama. Gunakan kemiripan ejaan, nama pendek/panggilan, urutan kata, dan jenis kelamin bila tersedia.",
            "Balas JSON valid dengan bentuk {\"matches\":[{\"waitingListId\":number,\"applicationId\":number,\"confidence\":number,\"reason\":string}]}.",
            "confidence harus antara 0.55 dan 0.99. Jika tidak ada kandidat, matches adalah array kosong.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Layanan pencocokan AI merespons ${response.status}.`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Layanan pencocokan AI tidak mengembalikan hasil.");
  const parsed = parseJsonContent(content);
  const rawMatches = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && "matches" in parsed
      ? (parsed as { matches?: unknown }).matches
      : [];
  if (!Array.isArray(rawMatches)) return [];
  const waitingById = new Map(waitingItems.map((item) => [item.id, item]));
  const applicationById = new Map(applications.map((item) => [item.id, item]));
  return rawMatches.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const waitingListId = Number(item.waitingListId);
    const applicationId = Number(item.applicationId);
    const waiting = waitingById.get(waitingListId);
    const application = applicationById.get(applicationId);
    const confidence = Number(item.confidence);
    if (
      !waiting
      || !application
      || waiting.jenjang !== application.jenjang
      || !Number.isFinite(confidence)
      || confidence < 0.55
      || confidence > 0.99
      || rejectedPairs.has(`${waitingListId}:${applicationId}`)
    ) return [];
    return [{
      waitingListId,
      applicationId,
      waitingName: waiting.nama,
      applicationName: application.nama_calon,
      jenjang: waiting.jenjang,
      confidence: Number(confidence.toFixed(2)),
      reason: typeof item.reason === "string" && item.reason.trim() ? item.reason.trim() : "Nama perlu dikonfirmasi oleh admin.",
      source: "ai" as const,
    }];
  });
}

export async function listWaitingList(allowedJenjang?: readonly string[]) {
  const conditions = [eq(waitingListTable.status, "active")];
  if (allowedJenjang?.length) conditions.push(inArray(waitingListTable.jenjang, [...allowedJenjang]));
  return db
    .select({
      id: waitingListTable.id,
      nama: waitingListTable.nama,
      jenjang: waitingListTable.jenjang,
      jenis_kelamin: waitingListTable.jenis_kelamin,
      catatan: waitingListTable.catatan,
      created_at: waitingListTable.created_at,
      added_by: waitingListTable.added_by,
    })
    .from(waitingListTable)
    .where(and(...conditions))
    .orderBy(desc(waitingListTable.created_at), desc(waitingListTable.id));
}

export async function createWaitingListEntry(input: {
  nama: string;
  jenjang: string;
  jenisKelamin: string | null;
  catatan: string | null;
  addedBy: string;
}) {
  const [item] = await db.insert(waitingListTable).values({
    nama: input.nama,
    jenjang: input.jenjang,
    jenis_kelamin: input.jenisKelamin,
    catatan: input.catatan,
    added_by: input.addedBy,
  }).returning({
    id: waitingListTable.id,
    nama: waitingListTable.nama,
    jenjang: waitingListTable.jenjang,
    jenis_kelamin: waitingListTable.jenis_kelamin,
    catatan: waitingListTable.catatan,
    created_at: waitingListTable.created_at,
    added_by: waitingListTable.added_by,
  });
  return item;
}

export async function listRejectedWaitingMatches(waitingListIds: number[]) {
  if (!waitingListIds.length) return new Set<string>();
  const rows = await db
    .select({
      waitingListId: waitingListMatchTable.waiting_list_id,
      applicationId: waitingListMatchTable.application_id,
    })
    .from(waitingListMatchTable)
    .where(and(
      inArray(waitingListMatchTable.waiting_list_id, waitingListIds),
      eq(waitingListMatchTable.decision, "rejected"),
    ));
  return new Set(rows.map((row) => `${row.waitingListId}:${row.applicationId}`));
}

export async function findWaitingListMatches(
  waitingItems: WaitingListItem[],
  applications: WaitingListApplication[],
) {
  const rejectedPairs = await listRejectedWaitingMatches(waitingItems.map((item) => item.id));
  try {
    const aiMatches = await getAiMatches(waitingItems, applications, rejectedPairs);
    return aiMatches.length ? aiMatches : waitingItems.flatMap((waiting) =>
      applications.flatMap((application) => {
        const match = heuristicMatch(waiting, application);
        return match && !rejectedPairs.has(`${match.waitingListId}:${match.applicationId}`) ? [match] : [];
      }),
    );
  } catch {
    return waitingItems.flatMap((waiting) =>
      applications.flatMap((application) => {
        const match = heuristicMatch(waiting, application);
        return match && !rejectedPairs.has(`${match.waitingListId}:${match.applicationId}`) ? [match] : [];
      }),
    );
  }
}

export type WaitingListReservationInput = {
  nama: string;
  jenjang: string;
  jenisKelamin: string;
};

export type WaitingListReservationMatch = {
  waitingListId: number;
  confidence: number;
  reason: string;
  source: "ai" | "heuristic";
};

const waitingListAccessTtlMs = 30 * 60 * 1000;

function waitingListAccessSecret(): string {
  return process.env.SESSION_SECRET || "";
}

function signWaitingListAccess(body: string): string {
  return createHmac("sha256", waitingListAccessSecret()).update(body).digest("base64url");
}

function createWaitingListAccessToken(input: WaitingListReservationInput, match: WaitingListReservationMatch): string | null {
  const secret = waitingListAccessSecret();
  if (!secret) return null;
  const payload = Buffer.from(JSON.stringify({
    waitingListId: match.waitingListId,
    nama: normalizeWaitingListName(input.nama),
    jenjang: input.jenjang,
    jenisKelamin: input.jenisKelamin,
    expiresAt: Date.now() + waitingListAccessTtlMs,
  })).toString("base64url");
  return `${payload}.${signWaitingListAccess(payload)}`;
}

function readWaitingListAccessToken(token: string): {
  waitingListId: number;
  nama: string;
  jenjang: string;
  jenisKelamin: string;
  expiresAt: number;
} | null {
  const secret = waitingListAccessSecret();
  if (!secret) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expectedSignature = signWaitingListAccess(payload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    const waitingListId = Number(parsed.waitingListId);
    const expiresAt = Number(parsed.expiresAt);
    if (
      !Number.isSafeInteger(waitingListId)
      || waitingListId <= 0
      || !Number.isFinite(expiresAt)
      || expiresAt <= Date.now()
      || typeof parsed.nama !== "string"
      || typeof parsed.jenjang !== "string"
      || typeof parsed.jenisKelamin !== "string"
    ) return null;
    return {
      waitingListId,
      nama: parsed.nama,
      jenjang: parsed.jenjang,
      jenisKelamin: parsed.jenisKelamin,
      expiresAt,
    };
  } catch {
    return null;
  }
}

export async function findWaitingListReservation(input: WaitingListReservationInput): Promise<{
  match: WaitingListReservationMatch;
  token: string;
} | null> {
  const nama = input.nama.trim();
  if (!nama || !input.jenjang || !input.jenisKelamin) return null;

  const waitingItems = await listWaitingList([input.jenjang]);
  const candidate: WaitingListApplication = {
    id: 0,
    nama_calon: nama,
    jenjang: input.jenjang,
    jenis_kelamin: input.jenisKelamin,
    tanggal_lahir: "",
    created_at: new Date(),
  };
  const rejectedPairs = await listRejectedWaitingMatches(waitingItems.map((item) => item.id));
  const heuristicMatches = waitingItems.flatMap((waiting) => {
    const match = heuristicMatch(waiting, candidate);
    return match && !rejectedPairs.has(`${match.waitingListId}:0`) ? [match] : [];
  }).sort((left, right) => right.confidence - left.confidence);

  // Strong local matches avoid sending a simple exact/name-prefix lookup
  // to an external model. The model is used for nickname, token-order, and
  // spelling variations that need a second signal.
  let match = heuristicMatches.find((item) => item.confidence >= 0.72);
  if (!match) {
    try {
      const aiMatches = await getAiMatches(waitingItems, [candidate], rejectedPairs);
      match = aiMatches
        .filter((item) => item.confidence >= 0.7)
        .sort((left, right) => right.confidence - left.confidence)[0];
    } catch {
      match = undefined;
    }
  }
  if (!match) return null;

  const reservationMatch: WaitingListReservationMatch = {
    waitingListId: match.waitingListId,
    confidence: match.confidence,
    reason: match.reason,
    source: match.source,
  };
  const token = createWaitingListAccessToken(input, reservationMatch);
  return token ? { match: reservationMatch, token } : null;
}

export async function verifyWaitingListAccessToken(
  token: string,
  input: WaitingListReservationInput,
): Promise<boolean> {
  const parsed = readWaitingListAccessToken(token);
  if (
    !parsed
    || parsed.jenjang !== input.jenjang
    || parsed.jenisKelamin !== input.jenisKelamin
    || parsed.nama !== normalizeWaitingListName(input.nama)
  ) return false;

  const [waiting] = await db
    .select({
      id: waitingListTable.id,
      nama: waitingListTable.nama,
      jenjang: waitingListTable.jenjang,
      jenisKelamin: waitingListTable.jenis_kelamin,
    })
    .from(waitingListTable)
    .where(and(
      eq(waitingListTable.id, parsed.waitingListId),
      eq(waitingListTable.status, "active"),
    ))
    .limit(1);
  return Boolean(
    waiting
    && waiting.jenjang === input.jenjang
    && (!waiting.jenisKelamin || waiting.jenisKelamin === input.jenisKelamin)
    && normalizeWaitingListName(waiting.nama) === parsed.nama,
  );
}

export async function decideWaitingListMatch(input: {
  waitingListId: number;
  applicationId: number;
  decision: "rejected" | "confirmed";
  decidedBy: string;
}) {
  return db.transaction(async (tx) => {
    const [waiting] = await tx
      .select({ id: waitingListTable.id, jenjang: waitingListTable.jenjang })
      .from(waitingListTable)
      .where(and(eq(waitingListTable.id, input.waitingListId), eq(waitingListTable.status, "active")))
      .limit(1);
    const [application] = await tx
      .select({ id: pendaftarTable.id, jenjang: pendaftarTable.jenjang })
      .from(pendaftarTable)
      .where(eq(pendaftarTable.id, input.applicationId))
      .limit(1);
    if (!waiting || !application || waiting.jenjang !== application.jenjang) return null;
    await tx.insert(waitingListMatchTable).values({
      waiting_list_id: input.waitingListId,
      application_id: input.applicationId,
      decision: input.decision,
      decided_by: input.decidedBy,
    }).onConflictDoUpdate({
      target: [waitingListMatchTable.waiting_list_id, waitingListMatchTable.application_id],
      set: {
        decision: input.decision,
        decided_by: input.decidedBy,
        decided_at: new Date(),
      },
    });
    if (input.decision === "confirmed") {
      await tx.delete(waitingListTable).where(eq(waitingListTable.id, input.waitingListId));
    }
    return { waitingListId: input.waitingListId, applicationId: input.applicationId, decision: input.decision };
  });
}