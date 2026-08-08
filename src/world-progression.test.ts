import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { expeditionSeasonKey } from './expedition-season';

describe('world progression reducer integration', () => {
  it('hydrates legacy saves with safe empty world progression state', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      regionalRenown:undefined,
      rewardedRenownLevels:undefined,
      expeditionSeasonScores:undefined,
      claimedExpeditionSeasonTiers:undefined,
      worldContractProgress:undefined,
      rewardedWorldContracts:undefined,
    });
    expect(hydrated.regionalRenown).toEqual({ starlight_forest:0, ancient_city:0, wind_lakes:0 });
    expect(hydrated.rewardedRenownLevels).toEqual([]);
    expect(hydrated.expeditionSeasonScores).toEqual({});
    expect(hydrated.claimedExpeditionSeasonTiers).toEqual([]);
    expect(hydrated.worldContractProgress).toEqual({ expedition_clear:0, high_grade:0, featured_region:0 });
    expect(hydrated.rewardedWorldContracts).toEqual([]);
    expect(hydrated.lastWorldProgress).toBeNull();
  });

  it('adds renown, season points, event bonus and contract progress on a successful expedition', () => {
    const next = reducer(initialState, {
      type:'FINISH_EXPEDITION_STAGE',
      stageId:'forest_path',
      score:700,
      actionKinds:{ attack:1, dodge:0, charge:0 },
    });
    const seasonKey = expeditionSeasonKey(initialState.year, initialState.month);
    expect(next.regionalRenown.starlight_forest).toBe(2);
    expect(next.expeditionSeasonScores[seasonKey]).toBe(25);
    expect(next.worldContractProgress).toEqual({ expedition_clear:1, high_grade:1, featured_region:1 });
    expect(next.lastWorldProgress).toEqual(expect.objectContaining({
      region:'starlight_forest',
      renownGain:2,
      seasonPoints:25,
      eventSeasonPoints:5,
    }));
  });

  it('auto-pays regional renown and world contract rewards only once', () => {
    const state = {
      ...initialState,
      regionalRenown:{ ...initialState.regionalRenown, starlight_forest:4 },
      worldContractProgress:{ expedition_clear:2, high_grade:1, featured_region:1 },
    };
    const first = reducer(state, { type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 });
    expect(first.regionalRenown.starlight_forest).toBe(6);
    expect(first.rewardedRenownLevels).toContain('starlight_forest:2');
    expect(first.rewardedWorldContracts).toEqual(expect.arrayContaining([
      '1-4:expedition_clear',
      '1-4:high_grade',
      '1-4:featured_region',
    ]));
    const goldAfterFirst = first.gold;
    const gemsAfterFirst = first.gems;
    const second = reducer(first, { type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 });
    expect(second.rewardedRenownLevels.filter(key => key === 'starlight_forest:2')).toHaveLength(1);
    expect(second.rewardedWorldContracts.filter(key => key === '1-4:high_grade')).toHaveLength(1);
    expect(second.gold - goldAfterFirst).toBeLessThan(250);
    expect(second.gems - gemsAfterFirst).toBeLessThan(1);
  });

  it('claims earned expedition season tiers once', () => {
    const seasonKey = expeditionSeasonKey(initialState.year, initialState.month);
    const ready = { ...initialState, expeditionSeasonScores:{ [seasonKey]:50 } };
    const claimed = reducer(ready, { type:'CLAIM_EXPEDITION_SEASON_TIER', tier:1 });
    expect(claimed.gold).toBe(ready.gold + 150);
    expect(claimed.claimedExpeditionSeasonTiers).toContain(`${seasonKey}:1`);
    const repeat = reducer(claimed, { type:'CLAIM_EXPEDITION_SEASON_TIER', tier:1 });
    expect(repeat).toBe(claimed);
  });

  it('resets only monthly contract progress on next month', () => {
    const seasonKey = expeditionSeasonKey(initialState.year, initialState.month);
    const state = {
      ...initialState,
      regionalRenown:{ starlight_forest:9, ancient_city:2, wind_lakes:1 },
      expeditionSeasonScores:{ [seasonKey]:75 },
      worldContractProgress:{ expedition_clear:2, high_grade:1, featured_region:1 },
      rewardedWorldContracts:['1-4:expedition_clear'],
    };
    const next = reducer(state, { type:'NEXT_MONTH' });
    expect(next.regionalRenown).toEqual(state.regionalRenown);
    expect(next.expeditionSeasonScores).toEqual(state.expeditionSeasonScores);
    expect(next.worldContractProgress).toEqual({ expedition_clear:0, high_grade:0, featured_region:0 });
    expect(next.rewardedWorldContracts).toEqual(state.rewardedWorldContracts);
    expect(next.lastWorldProgress).toBeNull();
  });
});
