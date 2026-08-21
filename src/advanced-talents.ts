import type { ActivityId, Personality, Stats } from './game-core';

export type AdvancedTalentId =
  | 'hunter_instinct'
  | 'guardian_strike'
  | 'arcane_rhythm'
  | 'star_channel'
  | 'steady_recovery'
  | 'deep_rest'
  | 'field_scholar'
  | 'ancient_remedy';

export type AdvancedTalentDefinition = {
  id: AdvancedTalentId;
  activity: ActivityId;
  requiredLevel: 3 | 5;
  label: string;
  description: string;
};

export const talentDefinitions: AdvancedTalentDefinition[] = [
  { id: 'hunter_instinct', activity: 'hunt', requiredLevel: 3, label: '사냥꾼의 감각', description: '사냥이 포함된 달에는 근력 +2.' },
  { id: 'guardian_strike', activity: 'hunt', requiredLevel: 5, label: '수호 일격', description: '사냥이 포함된 달에는 용감함 +1.' },
  { id: 'arcane_rhythm', activity: 'magic', requiredLevel: 3, label: '마력의 리듬', description: '마법이 포함된 달에는 마력 +2.' },
  { id: 'star_channel', activity: 'magic', requiredLevel: 5, label: '별빛 통로', description: '마법이 포함된 달에는 지식 +2.' },
  { id: 'steady_recovery', activity: 'rest', requiredLevel: 3, label: '안정된 회복', description: '휴식이 포함된 달에는 피로 -3.' },
  { id: 'deep_rest', activity: 'rest', requiredLevel: 5, label: '깊은 휴식', description: '휴식이 포함된 달에는 스트레스 -3.' },
  { id: 'field_scholar', activity: 'herb', requiredLevel: 3, label: '야외 연구가', description: '약초가 포함된 달에는 도덕성 +2.' },
  { id: 'ancient_remedy', activity: 'herb', requiredLevel: 5, label: '고대 처방', description: '약초가 포함된 달에는 호기심 +1.' },
];

export type MasteryLevels = Record<ActivityId, number>;

function normalizeMasteryLevel(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function advancedTalents(levels: MasteryLevels): AdvancedTalentId[] {
  return talentDefinitions
    .filter(talent => normalizeMasteryLevel(levels[talent.activity]) >= talent.requiredLevel)
    .map(talent => talent.id);
}

const clamp = (value: number) => {
  const safe = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, safe));
};

export function applyAdvancedTalentBonuses(
  stats: Stats,
  personality: Personality,
  talents: AdvancedTalentId[],
  schedule: ActivityId[],
) {
  const nextStats = { ...stats };
  const nextPersonality = { ...personality };
  const active = new Set(schedule);

  for (const id of new Set(talents)) {
    const definition = talentDefinitions.find(item => item.id === id);
    if (!definition || !active.has(definition.activity)) continue;
    if (id === 'hunter_instinct') nextStats.strength = clamp(clamp(nextStats.strength) + 2);
    if (id === 'guardian_strike') nextPersonality.courage = clamp(clamp(nextPersonality.courage) + 1);
    if (id === 'arcane_rhythm') nextStats.magic = clamp(clamp(nextStats.magic) + 2);
    if (id === 'star_channel') nextStats.intelligence = clamp(clamp(nextStats.intelligence) + 2);
    if (id === 'steady_recovery') nextStats.fatigue = clamp(clamp(nextStats.fatigue) - 3);
    if (id === 'deep_rest') nextStats.stress = clamp(clamp(nextStats.stress) - 3);
    if (id === 'field_scholar') nextStats.morality = clamp(clamp(nextStats.morality) + 2);
    if (id === 'ancient_remedy') nextPersonality.curiosity = clamp(clamp(nextPersonality.curiosity) + 1);
  }

  return { stats: nextStats, personality: nextPersonality };
}
