import type { AnnualRecord } from './annual-records';
import { guardianRankDefinitions } from './guardian-rank';

export function latestAnnualRecord(records: AnnualRecord[]): AnnualRecord | null {
  if (!records.length) return null;
  return [...records].sort((a, b) => b.year - a.year)[0] ?? null;
}

export function annualRecordHeadline(record: AnnualRecord): string {
  const rankLabel = guardianRankDefinitions.find(item => item.id === record.guardianRank)?.label ?? '견습 수호자';
  return `${record.year}년차 · ${rankLabel} · 최고점수 ${record.bestScore.toLocaleString('ko-KR')}`;
}
