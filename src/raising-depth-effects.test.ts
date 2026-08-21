import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';

describe('raising depth training and gift effects', () => {
  it('adds two affection for Runa favorite gift', () => {
    const state = { ...initialState, stats:{ ...initialState.stats, affection:40 } };
    const next = reducer(state, { type:'GIVE_GIFT', item:'herb_tea' });
    expect(next.stats.affection).toBe(42);
  });

  it('adds one personality trace for each scheduled activity matching Runa preference', () => {
    const brave = {
      ...initialState,
      schedule:['hunt','hunt','hunt','hunt'] as typeof initialState.schedule,
      personality:{ courage:30, kindness:20, curiosity:20, calmness:20 },
    };
    const sereneControl = {
      ...brave,
      personality:{ courage:30, kindness:20, curiosity:20, calmness:40 },
    };
    const favored = reducer(brave, { type:'FINISH_TRAINING', eventRoll:0.999 });
    const control = reducer(sereneControl, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(favored.personality.courage).toBe(control.personality.courage + 4);
  });

  it('applies active vanguard power trait on hunt training', () => {
    const state = {
      ...initialState,
      activeCalling:'vanguard' as const,
      purchasedTraits:['vanguard_power' as const],
      schedule:['hunt','magic','rest','herb'] as typeof initialState.schedule,
    };
    const next = reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(next.stats.strength).toBe(37);
  });

  it('does not apply a purchased trait from an inactive Calling', () => {
    const state = {
      ...initialState,
      activeCalling:'arcanist' as const,
      purchasedTraits:['vanguard_power' as const],
      schedule:['hunt','magic','rest','herb'] as typeof initialState.schedule,
    };
    const next = reducer(state, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(next.stats.strength).toBe(36);
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
