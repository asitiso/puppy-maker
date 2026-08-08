import type { ActivityId, Personality, Stats } from './game-core';

export type ScheduleSynergyId = 'balanced_guardian' | 'hunt_focus' | 'magic_focus' | 'herb_focus' | 'recovery_rhythm';

export type ScheduleSynergyDefinition = {
  id: ScheduleSynergyId;
  label: string;
  description: string;
};

export const scheduleSynergyDefinitions: ScheduleSynergyDefinition[] = [
  { id: 'balanced_guardian', label: '균형 수련', description: '네 가지 활동을 고르게 배치해 호감도와 마음의 균형이 조금 좋아져요.' },
  { id: 'hunt_focus', label: '사냥 집중', description: '사냥 훈련을 반복해 힘과 용기가 추가로 성장해요.' },
  { id: 'magic_focus', label: '마법 집중', description: '마법 수업을 반복해 마력과 호기심이 추가로 성장해요.' },
  { id: 'herb_focus', label: '약초 연구', description: '약초 채집을 반복해 지능과 침착함이 추가로 성장해요.' },
  { id: 'recovery_rhythm', label: '회복 루틴', description: '휴식과 약초 채집을 함께 넣어 스트레스와 피로를 더 낮춰요.' },
];

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function scheduleSynergies(schedule: ActivityId[]): ScheduleSynergyId[] {
  const counts = schedule.reduce<Record<ActivityId, number>>((acc, id) => {
    acc[id] += 1;
    return acc;
  }, { hunt: 0, magic: 0, rest: 0, herb: 0 });

  const result: ScheduleSynergyId[] = [];
  if (Object.values(counts).every(count => count === 1)) result.push('balanced_guardian');
  if (counts.hunt >= 2) result.push('hunt_focus');
  if (counts.magic >= 2) result.push('magic_focus');
  if (counts.herb >= 2) result.push('herb_focus');
  if (counts.rest >= 1 && counts.herb >= 1) result.push('recovery_rhythm');
  return result;
}

export function applyScheduleSynergyBonuses(stats: Stats, personality: Personality, synergies: ScheduleSynergyId[]) {
  const nextStats = { ...stats };
  const nextPersonality = { ...personality };

  for (const synergy of synergies) {
    if (synergy === 'balanced_guardian') {
      nextStats.affection = clamp(nextStats.affection + 1);
      nextPersonality.kindness = clamp(nextPersonality.kindness + 1);
      nextPersonality.calmness = clamp(nextPersonality.calmness + 1);
    } else if (synergy === 'hunt_focus') {
      nextStats.strength = clamp(nextStats.strength + 3);
      nextPersonality.courage = clamp(nextPersonality.courage + 2);
    } else if (synergy === 'magic_focus') {
      nextStats.magic = clamp(nextStats.magic + 3);
      nextPersonality.curiosity = clamp(nextPersonality.curiosity + 2);
    } else if (synergy === 'herb_focus') {
      nextStats.intelligence = clamp(nextStats.intelligence + 3);
      nextPersonality.calmness = clamp(nextPersonality.calmness + 2);
    } else if (synergy === 'recovery_rhythm') {
      nextStats.stress = clamp(nextStats.stress - 5);
      nextStats.fatigue = clamp(nextStats.fatigue - 5);
    }
  }

  return { stats: nextStats, personality: nextPersonality };
}
