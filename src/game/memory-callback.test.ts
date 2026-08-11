import { describe, expect, it } from 'vitest';
import { eligibleMemoryCallbacks, memoryCallbackLine, pickMemoryCallback } from './memory-callback';
import { initialState } from '../game';
import type { GameState } from '../game';

const withMemories = (overrides: Partial<GameState>): GameState => ({ ...initialState, ...overrides });

describe('memory callback eligibility', () => {
  it('excludes memories younger than 2 months', () => {
    const state = withMemories({
      year: 1,
      month: 3,
      memories: [{ id: 'first_training', year: 1, month: 2 }],
    });
    expect(eligibleMemoryCallbacks(state)).toHaveLength(0);
  });

  it('includes memories at least 2 months old', () => {
    const state = withMemories({
      year: 1,
      month: 4,
      memories: [{ id: 'first_training', year: 1, month: 2 }],
    });
    expect(eligibleMemoryCallbacks(state)).toHaveLength(1);
  });

  it('handles year boundaries when computing memory age', () => {
    const state = withMemories({
      year: 2,
      month: 1,
      memories: [{ id: 'first_training', year: 1, month: 11 }],
    });
    expect(eligibleMemoryCallbacks(state)).toHaveLength(1);
  });
});

describe('picking a memory callback', () => {
  it('returns null when there are no eligible memories', () => {
    const state = withMemories({ year: 1, month: 1, memories: [] });
    expect(pickMemoryCallback(state)).toBeNull();
  });

  it('deterministically picks the same memory for the same state', () => {
    const state = withMemories({
      year: 1,
      month: 6,
      memories: [
        { id: 'first_training', year: 1, month: 1 },
        { id: 'first_hug', year: 1, month: 2 },
      ],
    });
    expect(pickMemoryCallback(state)).toEqual(pickMemoryCallback(state));
  });

  it('only ever returns an eligible (old enough) memory', () => {
    const state = withMemories({
      year: 1,
      month: 4,
      memories: [
        { id: 'first_training', year: 1, month: 1 },
        { id: 'first_hug', year: 1, month: 3 },
      ],
    });
    const picked = pickMemoryCallback(state);
    expect(picked?.id).toBe('first_training');
  });
});

describe('memory callback line', () => {
  it('mentions the memory month and its catalog title', () => {
    const line = memoryCallbackLine({ id: 'first_perfect', year: 1, month: 5 });
    expect(line).toContain('5월');
    expect(line).toContain('완벽한 순간');
  });
});
