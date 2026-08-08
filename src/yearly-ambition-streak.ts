import type { AnnualRecord } from './annual-records';
import type { YearlyAmbitionSelections } from './yearly-ambition-selection';
import { completedYearAmbition } from './yearly-ambition-history';

export type AmbitionStreakHonorId = 'promise_keeper' | 'star_path' | 'eternal_vow';

export const ambitionStreakHonors: Array<{ id: AmbitionStreakHonorId; label: string; description: string; required: number }> = [
  { id:'promise_keeper', label:'약속을 지킨 수호자', description:'2년 연속으로 한 해의 야망을 완수했어요.', required:2 },
  { id:'star_path', label:'이어지는 별길', description:'3년 연속으로 루나와의 약속을 끝까지 지켰어요.', required:3 },
  { id:'eternal_vow', label:'영원의 맹세', description:'5년 연속 야망을 완수한 전설적인 수호 기록이에요.', required:5 },
];

export function ambitionStreak(records: AnnualRecord[], selections: YearlyAmbitionSelections): number {
  const ordered = [...records].sort((a, b) => b.year - a.year);
  if (ordered.length === 0) return 0;
  let streak = 0;
  let expectedYear = ordered[0].year;
  for (const record of ordered) {
    if (record.year !== expectedYear) break;
    const result = completedYearAmbition(records, selections, record.year);
    if (!result?.progress.complete) break;
    streak += 1;
    expectedYear -= 1;
  }
  return streak;
}

export function ambitionStreakHonor(streak: number) {
  return [...ambitionStreakHonors].reverse().find(item => streak >= item.required) ?? null;
}
