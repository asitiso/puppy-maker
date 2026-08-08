import { describe, expect, it } from 'vitest';
import { completedMonthlyMissions, emptyMonthlyCounters, monthlyMissionDefinitions } from './monthly-missions';

describe('monthly mission rules', () => {
  it('starts with zero monthly counters', () => {
    expect(emptyMonthlyCounters()).toEqual({ trainings: 0, outings: 0, gifts: 0 });
  });

  it('uses the intended fixed monthly goals and rewards', () => {
    expect(monthlyMissionDefinitions).toEqual([
      { id: 'training_once', title: '성장 훈련', counter: 'trainings', target: 1, reward: { gold: 120 } },
      { id: 'outing_twice', title: '함께 걷는 시간', counter: 'outings', target: 2, reward: { gems: 1 } },
      { id: 'gift_once', title: '마음을 담은 선물', counter: 'gifts', target: 1, reward: { gold: 100 } },
    ]);
  });

  it('only marks missions complete at or above their target', () => {
    expect(completedMonthlyMissions({ trainings: 0, outings: 1, gifts: 0 })).toEqual([]);
    expect(completedMonthlyMissions({ trainings: 1, outings: 1, gifts: 0 })).toEqual(['training_once']);
    expect(completedMonthlyMissions({ trainings: 1, outings: 2, gifts: 1 })).toEqual(['training_once', 'outing_twice', 'gift_once']);
    expect(completedMonthlyMissions({ trainings: 9, outings: 12, gifts: 3 })).toEqual(['training_once', 'outing_twice', 'gift_once']);
  });
});
