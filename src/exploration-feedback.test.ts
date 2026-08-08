import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';

describe('exploration feedback', () => {
  it('records the latest exploration event for the home UI', () => {
    const result = reducer(initialState, { type: 'GO_OUTING', location: 'forest', eventRoll: 0 });
    expect(result.lastExploration).toEqual({ location: 'forest', event: 'glowing_tracks', discovery: null });
  });

  it('records a hidden discovery for immediate feedback', () => {
    const levelTwo = { ...initialState, explorationXp: { ...initialState.explorationXp, lakeside: 3 } };
    const result = reducer(levelTwo, { type: 'GO_OUTING', location: 'lakeside', eventRoll: 0.5 });
    expect(result.lastExploration).toEqual({ location: 'lakeside', event: null, discovery: 'glass_shell' });
  });

  it('clears transient exploration feedback on reset', () => {
    const explored = reducer(initialState, { type: 'GO_OUTING', location: 'village', eventRoll: 0 });
    expect(explored.lastExploration).not.toBeNull();
    expect(reducer(explored, { type: 'RESET' }).lastExploration).toBeNull();
  });
});
