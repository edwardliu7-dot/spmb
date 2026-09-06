type SubmissionFailure = {
  occurredAt: string;
  stage: string;
  reason: string;
  status: number;
  jenjang?: string;
};

type SubmissionMonitoring = {
  startedAt: string;
  attempts: number;
  successes: number;
  failures: number;
  failureRate: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  failuresByReason: Record<string, number>;
  recentFailures: SubmissionFailure[];
};

const monitoringStartedAt = new Date().toISOString();
let attempts = 0;
let successes = 0;
let lastSuccessAt: string | null = null;
let lastFailureAt: string | null = null;
const failuresByReason = new Map<string, number>();
const recentFailures: SubmissionFailure[] = [];
const maxRecentFailures = 50;

export function recordSubmissionAttempt(): void {
  attempts += 1;
}

export function recordSubmissionSuccess(): void {
  successes += 1;
  lastSuccessAt = new Date().toISOString();
}

export function recordSubmissionFailure(input: Omit<SubmissionFailure, "occurredAt">): void {
  const occurredAt = new Date().toISOString();
  lastFailureAt = occurredAt;
  failuresByReason.set(input.reason, (failuresByReason.get(input.reason) ?? 0) + 1);
  recentFailures.unshift({ ...input, occurredAt });
  if (recentFailures.length > maxRecentFailures) recentFailures.length = maxRecentFailures;
}

export function getSubmissionMonitoring(): SubmissionMonitoring {
  const failures = [...failuresByReason.values()].reduce((total, count) => total + count, 0);
  return {
    startedAt: monitoringStartedAt,
    attempts,
    successes,
    failures,
    failureRate: attempts ? Number((failures / attempts).toFixed(4)) : 0,
    lastSuccessAt,
    lastFailureAt,
    failuresByReason: Object.fromEntries(
      [...failuresByReason.entries()].sort(([, left], [, right]) => right - left),
    ),
    recentFailures: recentFailures.map((failure) => ({ ...failure })),
  };
}