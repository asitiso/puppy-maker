import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game-sanctuary-astral-base';

describe('astral trial game progression', () => {
  it('hydrates valid astral trial persistence safely', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      astralStarShards:-9,
      claimedAstralTrials:['1-1:scholar_trial','bad','1-1:scholar_trial'],
      astralTrialRecords:[
        { key:'1-1:scholar_trial', grade:'A', power:88 },
        { key:'bad', grade:'S', power:999 },
      ],
    });
    expect(hydrated.astralStarShards).toBe(0);
    expect(hydrated.claimedAstralTrials).toEqual(['1-1:scholar_trial']);
    expect(hydrated.astralTrialRecords).toEqual([{ key:'1-1:scholar_trial', grade:'A', power:88 }]);
  });

  it('returns the same state when the monthly required constellation is locked', () => {
    const state = { ...initialState, year:1, month:1, sanctuaryConstellations:['dawn_compass'] as typeof initialState.sanctuaryConstellations };
    expect(reducer(state,{ type:'CHALLENGE_ASTRAL_TRIAL' })).toBe(state);
  });

  it('rewards and records one accepted monthly astral trial', () => {
    const state = {
      ...initialState,
      year:1,
      month:1,
      stats:{ ...initialState.stats, intelligence:100, magic:100 },
      sanctuaryConstellations:['dawn_compass','scholar_star'] as typeof initialState.sanctuaryConstellations,
    };
    const next = reducer(state,{ type:'CHALLENGE_ASTRAL_TRIAL' });
    expect(next).not.toBe(state);
    expect(next.claimedAstralTrials).toEqual(['1-1:scholar_trial']);
    expect(next.astralStarShards).toBeGreaterThanOrEqual(1);
    expect(next.gold).toBeGreaterThan(state.gold);
    expect(next.astralTrialRecords[0]).toEqual(expect.objectContaining({ key:'1-1:scholar_trial', grade:expect.stringMatching(/^[BAS]$/) }));
    expect(reducer(next,{ type:'CHALLENGE_ASTRAL_TRIAL' })).toBe(next);
  });
});
