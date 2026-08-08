import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('monthly growth focus progression', () => {
  it('hydrates legacy saves with balanced focus', () => {
    const state = hydrateGameState({ screen:'hub', year:1, month:4, week:1, gold:5000, gems:220, schedule:['hunt','magic','rest','herb'], stats:{...initialState.stats}, combo:0, trainingScore:0 });
    expect(state.monthlyFocus).toBe('balanced');
  });

  it('lets the player choose a monthly focus', () => {
    const next = reducer(initialState, { type:'SET_MONTHLY_FOCUS', focus:'hunt' });
    expect(next.monthlyFocus).toBe('hunt');
  });

  it('applies the chosen focus bonus to training results', () => {
    const base = { ...initialState, trainingScore: 300, schedule:['hunt','magic','rest','herb'] as typeof initialState.schedule };
    const balanced = reducer({ ...base, monthlyFocus:'balanced' }, { type:'FINISH_TRAINING', eventRoll:0.999 });
    const hunt = reducer({ ...base, monthlyFocus:'hunt' }, { type:'FINISH_TRAINING', eventRoll:0.999 });
    const magic = reducer({ ...base, monthlyFocus:'magic' }, { type:'FINISH_TRAINING', eventRoll:0.999 });
    const recovery = reducer({ ...base, monthlyFocus:'recovery' }, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(hunt.stats.strength).toBe(balanced.stats.strength + 2);
    expect(magic.stats.magic).toBe(balanced.stats.magic + 2);
    expect(recovery.stats.fatigue).toBeLessThan(balanced.stats.fatigue);
  });

  it('resets the monthly focus when a new month begins', () => {
    const next = reducer({ ...initialState, screen:'result', monthlyFocus:'magic' }, { type:'NEXT_MONTH' });
    expect(next.monthlyFocus).toBe('balanced');
  });
});
