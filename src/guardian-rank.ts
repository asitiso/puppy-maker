export type GuardianRankId = 'trainee' | 'junior' | 'guardian' | 'veteran' | 'starlight';

export type GuardianProgress = {
  memories: number;
  skills: number;
  discoveries: number;
  masteryLevels: number[];
};

export const guardianRankDefinitions: Array<{ id: GuardianRankId; label: string; threshold: number; rewardGems: number }> = [
  { id: 'trainee', label: '견습 수호자', threshold: 0, rewardGems: 0 },
  { id: 'junior', label: '초급 수호자', threshold: 8, rewardGems: 1 },
  { id: 'guardian', label: '정식 수호자', threshold: 16, rewardGems: 2 },
  { id: 'veteran', label: '숙련 수호자', threshold: 28, rewardGems: 3 },
  { id: 'starlight', label: '별빛 수호자', threshold: 42, rewardGems: 5 },
];

export const rewardableGuardianRanks: GuardianRankId[] = ['junior', 'guardian', 'veteran', 'starlight'];

const safeCount = (value: number): number => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
const safeMasteryLevel = (value: number): number => Number.isFinite(value) ? Math.max(1, Math.min(5, Math.floor(value))) : 1;

export function guardianGrowthPoints(progress: GuardianProgress): number {
  const masteryPoints = progress.masteryLevels.reduce((sum, rawLevel) => sum + safeMasteryLevel(rawLevel) - 1, 0);
  return safeCount(progress.memories) + safeCount(progress.skills) * 2 + safeCount(progress.discoveries) + masteryPoints;
}

export function guardianRank(points: number): GuardianRankId {
  const safePoints = safeCount(points);
  let result: GuardianRankId = 'trainee';
  for (const definition of guardianRankDefinitions) {
    if (safePoints >= definition.threshold) result = definition.id;
  }
  return result;
}

export function nextGuardianRank(points: number): { rank: GuardianRankId; threshold: number } | null {
  const safePoints = safeCount(points);
  const next = guardianRankDefinitions.find(definition => definition.threshold > safePoints);
  return next ? { rank: next.id, threshold: next.threshold } : null;
}
