import { describe, expect, it } from 'vitest';
import {
  applyActivity,
  applyDialogueChoice,
  deriveCondition,
  hydrateGameState,
  initialState,
  masteryLevel,
  pickRandomEvent,
  reducer,
  resultQuality,
  trainingGrade,
  unlockedSkills,
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
      screen: 'hub', year: 1, month: 4, week: 2, gold: 5000, gems: 220,
      schedule: ['hunt', 'magic', 'rest', 'herb'], stats: { ...initialState.stats }, combo: 0, trainingScore: 0,
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

  it('rejects malformed schedules and growth reports during hydration', () => {
    const hydrated = hydrateGameState({ ...initialState, schedule: ['hunt'], lastGrowthReport: { quality: 'PERFECT' } });
    expect(hydrated.schedule).toEqual(initialState.schedule);
    expect(hydrated.lastGrowthReport).toBeNull();
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
    expect(trained.lastGrowthReport?.newMemories).toEqual(['first_perfect']);
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

  it('includes training and dialogue personality changes in the monthly report', () => {
    const trained = reducer({ ...initialState, trainingScore: 700 }, { type: 'FINISH_TRAINING' });
    const result = reducer(trained, { type: 'CHOOSE', choice: 'scold' });
    expect(result.lastGrowthReport?.personalityDeltas.courage).toBe(5);
    expect(result.lastGrowthReport?.personalityDeltas.curiosity).toBe(5);
    expect(result.lastGrowthReport?.personalityDeltas.calmness).toBe(5);
    expect(result.lastGrowthReport?.newMemories).toEqual(['first_training']);
  });

  it('clamps personality values during hydration', () => {
    const hydrated = hydrateGameState({ ...initialState, personality: { courage: 200, kindness: -10, curiosity: 30, calmness: 40 } });
    expect(hydrated.personality.courage).toBe(100);
    expect(hydrated.personality.kindness).toBe(0);
  });

  it('advances month, preserves v2 progress and returns to hub', () => {
    const progressed = reducer({ ...initialState, screen: 'training' }, { type: 'FINISH_TRAINING' });
    const next = reducer({ ...progressed, screen: 'result' }, { type: 'NEXT_MONTH' });
    expect(next.month).toBe(5);
    expect(next.screen).toBe('hub');
    expect(next.gold).toBe(5470);
    expect(next.mastery.hunt.xp).toBe(progressed.mastery.hunt.xp);
    expect(next.memories).toContain('first_month_complete');
  });

  it('completes the monthly loop and can enter schedule again after returning home', () => {
    let state = reducer(initialState, { type: 'GO', screen: 'schedule' });
    expect(state.screen).toBe('schedule');
    state = reducer(state, { type: 'GO', screen: 'training' });
    state = reducer(state, { type: 'TRAIN', kind: 'attack', accuracy: 0.8 });
    state = reducer(state, { type: 'FINISH_TRAINING' });
    expect(state.screen).toBe('dialogue');
    state = reducer(state, { type: 'CHOOSE', choice: 'hug' });
    expect(state.screen).toBe('result');
    state = reducer(state, { type: 'NEXT_MONTH' });
    expect(state.screen).toBe('hub');
    expect(state.month).toBe(5);
    state = reducer(state, { type: 'GO', screen: 'schedule' });
    expect(state.screen).toBe('schedule');
  });

  it('unlocks first-tier skills from mastery level two', () => {
    const skilled = { ...initialState, mastery: { hunt: { xp: 3 }, magic: { xp: 3 }, rest: { xp: 3 }, herb: { xp: 3 } } };
    expect(unlockedSkills(initialState)).toEqual([]);
    expect(unlockedSkills(skilled)).toEqual(['quick_strike', 'mana_focus', 'steady_breath', 'trail_instinct']);
  });

  it('selects eligible random events deterministically from state and roll', () => {
    const herbOnly = {
      ...initialState,
      schedule: ['herb', 'herb', 'herb', 'herb'] as typeof initialState.schedule,
      personality: { courage: 20, kindness: 20, curiosity: 20, calmness: 20 },
      stats: { ...initialState.stats, fatigue: 10 }, condition: 'normal' as const,
    };
    const huntOnly = {
      ...initialState,
      schedule: ['hunt', 'hunt', 'hunt', 'hunt'] as typeof initialState.schedule,
      personality: { courage: 30, kindness: 20, curiosity: 20, calmness: 20 },
      stats: { ...initialState.stats, fatigue: 10 }, condition: 'normal' as const,
    };
    expect(pickRandomEvent(herbOnly, 0)).toBe('rare_herb');
    expect(pickRandomEvent(herbOnly, 0)).toBe('rare_herb');
    expect(pickRandomEvent(huntOnly, 0)).toBe('new_move');
    expect(pickRandomEvent(herbOnly, 0.999)).toBeNull();
  });

  it('applies a selected event and records it in the monthly report', () => {
    const state = {
      ...initialState,
      schedule: ['herb', 'herb', 'herb', 'herb'] as typeof initialState.schedule,
      personality: { courage: 20, kindness: 20, curiosity: 20, calmness: 20 },
      stats: { ...initialState.stats, fatigue: 10 }, condition: 'normal' as const,
    };
    const trained = reducer(state, { type: 'FINISH_TRAINING', eventRoll: 0 });
    expect(trained.gold).toBe(initialState.gold + 220);
    expect(trained.personality.curiosity).toBeGreaterThan(state.personality.curiosity);
    expect(trained.lastGrowthReport?.randomEvent).toBe('rare_herb');
  });

  it('reports a newly unlocked skill when training crosses a mastery threshold', () => {
    const state = {
      ...initialState,
      schedule: ['hunt', 'rest', 'rest', 'rest'] as typeof initialState.schedule,
      mastery: { ...initialState.mastery, hunt: { xp: 2 } },
    };
    const trained = reducer(state, { type: 'FINISH_TRAINING', eventRoll: 0.999 });
    expect(unlockedSkills(trained)).toContain('quick_strike');
    expect(trained.lastGrowthReport?.unlockedSkill).toBe('quick_strike');
  });

  it('applies small mastery skill bonuses to existing training actions', () => {
    const huntState = { ...initialState, mastery: { ...initialState.mastery, hunt: { xp: 3 } } };
    const magicState = { ...initialState, mastery: { ...initialState.mastery, magic: { xp: 3 } } };
    const restState = { ...initialState, condition: 'tired' as const, mastery: { ...initialState.mastery, rest: { xp: 3 } } };
    expect(reducer(huntState, { type: 'TRAIN', kind: 'attack', accuracy: 1 }).trainingScore).toBe(147);
    expect(reducer(magicState, { type: 'TRAIN', kind: 'charge', accuracy: 1 }).trainingScore).toBe(84);
    expect(reducer(restState, { type: 'TRAIN', kind: 'attack', accuracy: 1 }).trainingScore).toBe(133);
  });

  it('adds trail instinct intelligence once for each herb schedule slot', () => {
    const state = {
      ...initialState,
      schedule: ['herb', 'herb', 'herb', 'herb'] as typeof initialState.schedule,
      mastery: { ...initialState.mastery, herb: { xp: 3 } },
    };
    const trained = reducer(state, { type: 'FINISH_TRAINING', eventRoll: 0.999 });
    expect(trained.stats.intelligence).toBe(initialState.stats.intelligence + 12);
  });

  it('clears transient discovery report next month while preserving derived skills', () => {
    const state = {
      ...initialState,
      schedule: ['hunt', 'rest', 'rest', 'rest'] as typeof initialState.schedule,
      mastery: { ...initialState.mastery, hunt: { xp: 2 } },
    };
    const trained = reducer(state, { type: 'FINISH_TRAINING', eventRoll: 0.999 });
    const next = reducer({ ...trained, screen: 'result' }, { type: 'NEXT_MONTH' });
    expect(next.lastGrowthReport).toBeNull();
    expect(unlockedSkills(next)).toContain('quick_strike');
  });
});
