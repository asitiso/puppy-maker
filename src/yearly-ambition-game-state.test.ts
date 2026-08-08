import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('yearly ambitions in game save state', () => {
  it('hydrates valid year selections and drops malformed legacy values', () => {
    const state = hydrateGameState({
      ...initialState,
      yearlyAmbitions: { 1:'training', 2:'exploration', 0:'bond', 3:'unknown', nope:'season' },
    });
    expect(state.yearlyAmbitions).toEqual({ 1:'training', 2:'exploration' });
  });

  it('locks one ambition choice per year inside the main reducer', () => {
    const chosen = reducer(initialState, { type:'SET_YEARLY_AMBITION', ambition:'bond' });
    expect(chosen.yearlyAmbitions).toEqual({ 1:'bond' });
    expect(reducer(chosen, { type:'SET_YEARLY_AMBITION', ambition:'training' })).toBe(chosen);
  });

  it('preserves prior-year selections when entering a new year', () => {
    const december = { ...initialState, month:12, yearlyAmbitions:{ 1:'season' as const } };
    const next = reducer(december, { type:'NEXT_MONTH' });
    expect(next.year).toBe(2);
    expect(next.yearlyAmbitions).toEqual({ 1:'season' });
    expect(next.yearlyAmbitions[2]).toBeUndefined();
  });
});
