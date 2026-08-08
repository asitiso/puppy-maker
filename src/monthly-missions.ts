export type MonthlyMissionId = 'training_once' | 'outing_twice' | 'gift_once';
export type MonthlyCounterKey = 'trainings' | 'outings' | 'gifts';
export type MonthlyCounters = Record<MonthlyCounterKey, number>;

export type MonthlyMissionDefinition = {
  id: MonthlyMissionId;
  title: string;
  counter: MonthlyCounterKey;
  target: number;
  reward: { gold?: number; gems?: number };
};

export const monthlyMissionDefinitions: MonthlyMissionDefinition[] = [
  { id: 'training_once', title: '성장 훈련', counter: 'trainings', target: 1, reward: { gold: 120 } },
  { id: 'outing_twice', title: '함께 걷는 시간', counter: 'outings', target: 2, reward: { gems: 1 } },
  { id: 'gift_once', title: '마음을 담은 선물', counter: 'gifts', target: 1, reward: { gold: 100 } },
];

export const monthlyMissionIds = monthlyMissionDefinitions.map(item => item.id);

export function emptyMonthlyCounters(): MonthlyCounters {
  return { trainings: 0, outings: 0, gifts: 0 };
}

export function completedMonthlyMissions(counters: MonthlyCounters): MonthlyMissionId[] {
  return monthlyMissionDefinitions
    .filter(item => counters[item.counter] >= item.target)
    .map(item => item.id);
}
