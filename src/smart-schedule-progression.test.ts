import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';

describe('smart auto schedule progression', () => {
  it('uses the seasonal balanced plan during normal spring conditions', () => {
    const next = reducer(initialState, { type:'AUTO_SCHEDULE' });
    expect(next.schedule).toEqual(['herb','hunt','magic','rest']);
  });

  it('switches to a recovery plan when Runa is tired', () => {
    const state = { ...initialState, month:7, condition:'tired' as const };
    const next = reducer(state, { type:'AUTO_SCHEDULE' });
    expect(next.schedule).toEqual(['rest','herb','rest','hunt']);
  });
});
