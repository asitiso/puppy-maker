import { describe, expect, it } from 'vitest';
import * as Core from './game-core';
import { hydrateGameState, initialState, reducer } from './game';

describe('schedule synergy progression', () => {
  it('hydrates legacy saves with no transient schedule synergy report', () => {
    const state = hydrateGameState({ screen:'hub', year:1, month:4, week:2, gold:5000, gems:220, schedule:['hunt','magic','rest','herb'], stats:{...initialState.stats}, combo:0, trainingScore:0 });
    expect(state.lastScheduleSynergies).toEqual([]);
  });

  it('adds balanced and recovery bonuses after core training effects', () => {
    const core = Core.reducer(initialState, { type:'FINISH_TRAINING', eventRoll:0.999 });
    const trained = reducer(initialState, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(trained.lastScheduleSynergies).toEqual(['balanced_guardian','recovery_rhythm']);
    expect(trained.stats.affection).toBe(Math.min(100, core.stats.affection + 1));
    expect(trained.stats.stress).toBe(Math.max(0, core.stats.stress - 5));
    expect(trained.stats.fatigue).toBe(Math.max(0, core.stats.fatigue - 5));
    expect(trained.personality.kindness).toBe(Math.min(100, core.personality.kindness + 1));
  });

  it('applies focused plan bonuses without changing schedule selection', () => {
    const state = { ...initialState, schedule:['hunt','hunt','rest','herb'] as typeof initialState.schedule };
    const core = Core.reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    const trained = reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(trained.schedule).toEqual(state.schedule);
    expect(trained.lastScheduleSynergies).toEqual(['hunt_focus','recovery_rhythm']);
    expect(trained.stats.strength).toBe(Math.min(100, core.stats.strength + 3));
    expect(trained.personality.courage).toBe(Math.min(100, core.personality.courage + 2));
  });

  it('keeps the synergy report through dialogue and clears it next month', () => {
    const trained = reducer(initialState, { type:'FINISH_TRAINING', eventRoll:0.999 });
    const result = reducer(trained, { type:'CHOOSE', choice:'hug' });
    expect(result.lastScheduleSynergies).toEqual(trained.lastScheduleSynergies);
    const next = reducer(result, { type:'NEXT_MONTH' });
    expect(next.lastScheduleSynergies).toEqual([]);
  });
});
