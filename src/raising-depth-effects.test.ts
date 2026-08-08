import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';

describe('raising depth training and gift effects', () => {
  it('adds two affection for Runa favorite gift', () => {
    const state = { ...initialState, stats:{ ...initialState.stats, affection:40 } };
    const next = reducer(state, { type:'GIVE_GIFT', item:'herb_tea' });
    expect(next.stats.affection).toBe(46);
  });

  it('adds one personality point when the favorite activity is scheduled', () => {
    const state = { ...initialState, schedule:['hunt','magic','rest','herb'] as typeof initialState.schedule };
    const next = reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(next.personality.calmness).toBe(25);
  });

  it('applies active vanguard power trait on hunt training', () => {
    const state = {
      ...initialState,
      activeCalling:'vanguard' as const,
      purchasedTraits:['vanguard_power' as const],
      schedule:['hunt','magic','rest','herb'] as typeof initialState.schedule,
    };
    const next = reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(next.stats.strength).toBe(35);
  });

  it('does not apply a purchased trait from an inactive Calling', () => {
    const state = {
      ...initialState,
      activeCalling:'arcanist' as const,
      purchasedTraits:['vanguard_power' as const],
      schedule:['hunt','magic','rest','herb'] as typeof initialState.schedule,
    };
    const next = reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(next.stats.strength).toBe(34);
  });

  it('adds caretaker bond affection on a successful gift while active', () => {
    const state = {
      ...initialState,
      stats:{ ...initialState.stats, affection:40 },
      activeCalling:'caretaker' as const,
      purchasedTraits:['caretaker_rest' as const, 'caretaker_bond' as const],
    };
    const next = reducer(state, { type:'GIVE_GIFT', item:'star_cookie' });
    expect(next.stats.affection).toBe(47);
  });
});
