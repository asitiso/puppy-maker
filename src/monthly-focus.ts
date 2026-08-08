import type { Stats } from './game-core';

export type MonthlyFocusId = 'balanced' | 'hunt' | 'magic' | 'recovery';

export type MonthlyFocusDefinition = {
  id: MonthlyFocusId;
  label: string;
  description: string;
};

export const monthlyFocusDefinitions: MonthlyFocusDefinition[] = [
  { id:'balanced', label:'균형 성장', description:'모든 활동을 고르게 경험해요.' },
  { id:'hunt', label:'사냥 집중', description:'이번 달 훈련 후 근력 +2' },
  { id:'magic', label:'마법 집중', description:'이번 달 훈련 후 마력 +2' },
  { id:'recovery', label:'회복 집중', description:'이번 달 훈련 후 피로와 스트레스를 더 회복해요.' },
];

export const monthlyFocusIds = monthlyFocusDefinitions.map(item => item.id);

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function applyMonthlyFocusBonus(stats: Stats, focus: MonthlyFocusId): Stats {
  const next = { ...stats };
  if (focus === 'hunt') next.strength = clamp(next.strength + 2);
  if (focus === 'magic') next.magic = clamp(next.magic + 2);
  if (focus === 'recovery') {
    next.fatigue = clamp(next.fatigue - 8);
    next.stress = clamp(next.stress - 5);
  }
  return next;
}
