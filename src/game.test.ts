import { describe, expect, it } from 'vitest';
import {
  applyActivity,
  applyDialogueChoice,
  deriveCondition,
  hydrateGameState,
  initialState,
  masteryLevel,
  reducer,
  resultQuality,
  trainingGrade,
} from './game';

describe('game engine', () => {
  it('applies activity effects without exceeding stat bounds', () => {
    const next = applyActivity({ ...initialState.stats, stress: 5, fatigue: 4 }, 'rest');
    expect(next.stress).toBe(0);
    expect(next.fatigue).toBe(0);
    expect(next.affection).toBe(74);
  });

  it('calculates training grades', () => {
    expect(trainingGrade(920)).toBe('S');
    expect(trainingGrade(700)).toBe('A');
    expect(trainingGrade(450)).toBe('B');
    expect(trainingGrade(100)).toBe('C');
  });

  it('hydrates legacy saves with v2 defaults', () => {
    const legacy = {
      screen: 'hub',
      year: 1,
      month: 4,
      week: 2,
      gold: 5000,
      gems: 220,
      schedule: ['hunt', 'magic', 'rest', 'herb'],
      stats: { ...initialState.stats },
      combo: 0,
      trainingScore: 0,
    };

    const hydrated = hydrateGameState(legacy);
    expect(hydrated.condition).toBe('normal');
    expect(hydrated.mastery.hunt.xp).toBe(0);
    expect(hydrated.personality).toEqual({ courage: 20, kindness: 20, curiosity: 20, calmness: 20 });
    expect(hydrated.memories).toEqual([]);
    expect(hydrated.lastGrowthReport).toBeNull();
  });

  it('falls back safely for malformed saves', () => {
    expect(hydrateGameState(null)).toEqual(initialState);
    expect(hydrateGameState('broken')).toEqual(initialState);
  });

  it('maps result quality at stable score boundaries', () => {
    expect(resultQuality(0)).toBe('NORMAL');
    expect(resultQuality(399)).toBe('NORMAL');
    expect(resultQuality(400)).toBe('GOOD');
    expect(resultQuality(649)).toBe('GOOD');
    expect(resultQuality(650)).toBe('GREAT');
    expect(resultQuality(899)).toBe('GREAT');
    expect(resultQuality(900)).toBe('PERFECT');
  });

  it('derives mastery levels from deterministic xp thresholds', () => {
    expect(masteryLevel(0)).toBe(1);
    expect(masteryLevel(3)).toBe(2);
    expect(masteryLevel(7)).toBe(3);
    expect(masteryLevel(12)).toBe(4);
    expect(masteryLevel(18)).toBe(5);
    expect(masteryLevel(999)).toBe(5);
  });

  it('derives condition from fatigue and stress', () => {
    expect(deriveCondition({ ...initialState.stats, fatigue: 80 })).toBe('tired');
    expect(deriveCondition({ ...initialState.stats, fatigue: 20, stress: 10 })).toBe('focused');
    expect(deriveCondition({ ...initialState.stats, fatigue: 10, stress: 40 })).toBe('energetic');
    expect(deriveCondition({ ...initialState.stats, fatigue: 30, stress: 40 })).toBe('normal');
  });

  it('applies dialogue choice and advances to result', () => {
    const next = applyDialogueChoice(initialState, 'hug');
    expect(next.stats.affection).toBe(82);
    expect(next.screen).toBe('result');
  });

  it('adds mastery personality and first training memory once', () => {
    const first = reducer(initialState, { type: 'FINISH_TRAINING' });
    expect(first.mastery.hunt.xp).toBeGreaterThan(0);
    expect(first.mastery.magic.xp).toBeGreaterThan(0);
    expect(first.personality.courage).toBeGreaterThan(initialState.personality.courage);
    expect(first.memories).toContain('first_training');

    const second = reducer({ ...first, screen: 'training' }, { type: 'FINISH_TRAINING' });
    expect(second.memories.filter(id => id === 'first_training')).toHaveLength(1);
  });

  it('records perfect and s-grade memories for exceptional training', () => {
    const trained = reducer({ ...initialState, trainingScore: 920 }, { type: 'FINISH_TRAINING' });
    expect(trained.memories).toContain('first_perfect');
    expect(trained.memories).toContain('first_s_grade');
  });

  it('applies dialogue personality effects and creates a growth report', () => {
    const trained = reducer({ ...initialState, trainingScore: 700 }, { type: 'FINISH_TRAINING' });
    const result = reducer(trained, { type: 'CHOOSE', choice: 'hug' });

    expect(result.personality.kindness).toBeGreaterThan(trained.personality.kindness);
    expect(result.memories).toContain('first_hug');
    expect(result.lastGrowthReport).not.toBeNull();
    expect(result.lastGrowthReport?.grade).toBe('A');
    expect(result.lastGrowthReport?.quality).toBe('GREAT');
    expect(result.lastGrowthReport?.newMemories.length).toBeLessThanOrEqual(1);
  });

  it('clamps personality values during hydration', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      personality: { courage: 200, kindness: -10, curiosity: 30, calmness: 40 },
    });

    expect(hydrated.personality.courage).toBe(100);
    expect(hydrated.personality.kindness).toBe(0);
  });

  it('advances month, preserves v2 progress and returns to hub', () => {
    const progressed = reducer({ ...initialState, screen: 'training' }, { type: 'FINISH_TRAINING' });
    const next = reducer({ ...progressed, screen: 'result' }, { type: 'NEXT_MONTH' });

    expect(next.month).toBe(5);
    expect(next.screen).toBe('hub');
    expect(next.gold).toBe(5350);
    expect(next.mastery.hunt.xp).toBe(progressed.mastery.hunt.xp);
    expect(next.memories).toContain('first_month_complete');
  });
});
