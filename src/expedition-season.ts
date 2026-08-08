import type { ExpeditionGrade } from './expedition-regions';
import { seasonalProfile, type SeasonId } from './seasonal-cycle';

export type ExpeditionSeasonKey = `${number}-${SeasonId}`;
export type ExpeditionSeasonTier = 1 | 2 | 3 | 4;

export const expeditionSeasonTiers: ReadonlyArray<{
  tier: ExpeditionSeasonTier;
  threshold: number;
  reward: { gold:number; gems:number };
}> = [
  { tier:1, threshold:50, reward:{ gold:150, gems:0 } },
  { tier:2, threshold:120, reward:{ gold:0, gems:1 } },
  { tier:3, threshold:220, reward:{ gold:250, gems:0 } },
  { tier:4, threshold:350, reward:{ gold:0, gems:2 } },
];

export function expeditionSeasonKey(year:number, month:number): ExpeditionSeasonKey {
  const safeYear = Math.max(1, Math.floor(Number.isFinite(year) ? year : 1));
  return `${safeYear}-${seasonalProfile(month).season}`;
}

export function expeditionSeasonPoints(grade:ExpeditionGrade, firstBossClear:boolean): number {
  if (grade === 'C') return 0;
  const gradePoints = grade === 'B' ? 10 : grade === 'A' ? 20 : 30;
  return gradePoints + (firstBossClear ? 20 : 0);
}

export function earnedExpeditionSeasonTiers(points:number): ExpeditionSeasonTier[] {
  const safe = Math.max(0, Math.floor(Number.isFinite(points) ? points : 0));
  return expeditionSeasonTiers.filter(item => safe >= item.threshold).map(item => item.tier);
}

export function expeditionSeasonClaimKey(seasonKey:ExpeditionSeasonKey, tier:ExpeditionSeasonTier): string {
  return `${seasonKey}:${tier}`;
}
