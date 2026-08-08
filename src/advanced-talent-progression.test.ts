import { describe, expect, it } from 'vitest';
import * as Core from './game-core';
import { currentAdvancedTalents, hydrateGameState, initialState, reducer } from './game';

describe('advanced talent progression', () => {
  it('derives talents from mastery without extra saved counters', () => {
    const legacy = hydrateGameState({ screen:'hub', year:1, month:4, week:2, gold:5000, gems:220, schedule:['hunt','magic','rest','herb'], stats:{...initialState.stats}, combo:0, trainingScore:0 });
    expect(currentAdvancedTalents(legacy)).toEqual([]);

    const mastered = {
      ...initialState,
      mastery: { hunt:{xp:7}, magic:{xp:18}, rest:{xp:0}, herb:{xp:0} },
    };
    expect(currentAdvancedTalents(mastered)).toEqual(['hunter_instinct','arcane_rhythm','star_channel']);
  });

  it('applies unlocked talents after core training and schedule synergies without overstacking one stat', () => {
    const state = {
      ...initialState,
      schedule: ['hunt','magic','rest','herb'] as typeof initialState.schedule,
      mastery: { hunt:{xp:7}, magic:{xp:7}, rest:{xp:7}, herb:{xp:7} },
    };
    const core = Core.reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    const trained = reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(trained.stats.strength).toBe(core.stats.strength + 2);
    expect(trained.stats.magic).toBe(core.stats.magic + 2);
    expect(trained.stats.intelligence).toBe(core.stats.intelligence);
    expect(trained.stats.morality).toBe(core.stats.morality + 3);
    expect(trained.stats.fatigue).toBe(Math.max(0, core.stats.fatigue - 8));
  });

  it('does not apply a talent when its activity is absent from the schedule', () => {
    const state = {
      ...initialState,
      schedule: ['rest','rest','herb','herb'] as typeof initialState.schedule,
      mastery: { hunt:{xp:18}, magic:{xp:18}, rest:{xp:0}, herb:{xp:0} },
    };
    const core = Core.reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    const trained = reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(trained.stats.strength).toBe(core.stats.strength);
    expect(trained.stats.magic).toBe(core.stats.magic);
  });
});
