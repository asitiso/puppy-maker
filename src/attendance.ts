export type AttendanceReward = { gold: number; gems: number };

export function attendanceKey(year: number, month: number): string {
  const safeYear = Math.max(1, Math.floor(year));
  const safeMonth = Math.min(12, Math.max(1, Math.floor(month)));
  return `${safeYear}-${safeMonth}`;
}

export function attendanceReward(_year: number, month: number): AttendanceReward {
  const safeMonth = Math.min(12, Math.max(1, Math.floor(month)));
  return { gold: 150, gems: safeMonth % 3 === 0 ? 1 : 0 };
}
