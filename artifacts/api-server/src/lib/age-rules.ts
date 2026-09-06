export const minimumAgeByLevel: Record<string, number> = {
  Playgroup: 3,
  "TK-A": 4,
  "TK-B": 5,
  SD: 6,
};

export function getMinimumAgeError(level: string, birthDateValue: string): string | null {
  const minimumAge = minimumAgeByLevel[level];
  if (!minimumAge) return null;

  const birthDate = new Date(`${birthDateValue}T00:00:00.000Z`);
  const latestAllowedBirthDate = Date.UTC(2027 - minimumAge, 6, 31);
  return birthDate.getTime() <= latestAllowedBirthDate
    ? null
    : `Untuk jenjang ${level}, calon peserta didik harus berusia minimal ${minimumAge} tahun pada 31 Juli 2027.`;
}