import type { GuardianLegacyId } from './guardian-legacy';
import type { GuardianRankId } from './guardian-rank';

export type GuardianEvolutionId = 'apprentice' | 'guardian' | 'star_guardian' | 'legendary_guardian';

export type GuardianEvolutionInput = {
  guardianRank: GuardianRankId;
  bossClears: number;
  allStagesS: boolean;
  archiveCurrent: number;
  legacyId: GuardianLegacyId;
};

export const guardianEvolutionDefinitions: Array<{ id: GuardianEvolutionId; label: string; description: string }> = [
  { id: 'apprentice', label: '견습 수호자', description: '수호자의 길에 첫발을 내딛은 단계.' },
  { id: 'guardian', label: '수호자', description: '기본 성장을 쌓고 자신의 힘을 증명한 단계.' },
  { id: 'star_guardian', label: '별의 수호자', description: '세 지역의 보스를 넘어 원정과 수집을 함께 완성해 가는 단계.' },
  { id: 'legendary_guardian', label: '전설의 수호자', description: '모든 원정 기록과 연대기를 완성한 최종 수호 단계.' },
];

const guardianRankOrder: GuardianRankId[] = ['trainee', 'junior', 'guardian', 'veteran', 'starlight'];

export function guardianEvolution(input: GuardianEvolutionInput): GuardianEvolutionId {
  const guardianOrHigher = guardianRankOrder.indexOf(input.guardianRank) >= guardianRankOrder.indexOf('guardian');
  if (!guardianOrHigher) return 'apprentice';
  const starReady = input.bossClears >= 3 && input.archiveCurrent >= 75;
  if (!starReady) return 'guardian';
  // Legendary Guardian is itself the final archive milestone. Requiring 100 before
  // awarding it would deadlock the archive at 99/100, so 99 is the pre-award gate.
  const legendaryReady = input.allStagesS && input.archiveCurrent >= 99 && input.legacyId === 'eternal_guardian';
  return legendaryReady ? 'legendary_guardian' : 'star_guardian';
}
