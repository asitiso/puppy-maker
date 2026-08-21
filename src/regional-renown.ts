import type { ExpeditionGrade, ExpeditionRegionId } from './expedition-regions';

export type RegionalRenownState = Record<ExpeditionRegionId, number>;
export type RegionalRenownLevel = 1 | 2 | 3 | 4 | 5;

export const regionalRenownThresholds = [0, 5, 12, 22, 35] as const;

export function emptyRegionalRenown(): RegionalRenownState {
  return {
    starlight_forest:0,
    ancient_city:0,
    wind_lakes:0,
  };
}

export function renownGainForExpedition(grade: ExpeditionGrade, firstBossClear: boolean): number {
  if (grade === 'C') return 0;
  const gradeGain = grade === 'B' ? 1 : grade === 'A' ? 2 : 3;
  return gradeGain + (firstBossClear ? 2 : 0);
}

export function regionalRenownLevel(renown: number): RegionalRenownLevel {
  if (renown === Number.POSITIVE_INFINITY) return 5;
  const safe = Math.max(0, Math.floor(Number.isFinite(renown) ? renown : 0));
  if (safe >= regionalRenownThresholds[4]) return 5;
  if (safe >= regionalRenownThresholds[3]) return 4;
  if (safe >= regionalRenownThresholds[2]) return 3;
  if (safe >= regionalRenownThresholds[1]) return 2;
  return 1;
}

export function regionalRenownReward(level: RegionalRenownLevel): { gold:number; gems:number } {
  if (level === 2) return { gold:100, gems:0 };
  if (level === 3) return { gold:0, gems:1 };
  if (level === 4) return { gold:150, gems:0 };
  if (level === 5) return { gold:0, gems:2 };
  return { gold:0, gems:0 };
}
