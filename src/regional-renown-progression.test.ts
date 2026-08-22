import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';

const clearForestPathA = (state: typeof initialState) => reducer(state, {
  type:'FINISH_EXPEDITION_STAGE',
  stageId:'forest_path',
  score:700,
  actionKinds:{ attack:3, dodge:0, charge:0 },
});

describe('regional renown progression integration', () => {
  it('adds repeatable renown only to the cleared stage region and claims level rewards once', () => {
    const first = clearForestPathA(initialState);
    const second = clearForestPathA(first);
    const third = clearForestPathA(second);
    const fourth = clearForestPathA(third);

    expect(first.regionalRenown).toEqual({ starlight_forest:2, ancient_city:0, wind_lakes:0 });
    expect(second.regionalRenown).toEqual({ starlight_forest:4, ancient_city:0, wind_lakes:0 });
    expect(third.regionalRenown).toEqual({ starlight_forest:6, ancient_city:0, wind_lakes:0 });
    expect(fourth.regionalRenown).toEqual({ starlight_forest:8, ancient_city:0, wind_lakes:0 });

    expect(third.rewardedRenownLevels.filter(key => key === 'starlight_forest:2')).toHaveLength(1);
    expect(fourth.rewardedRenownLevels.filter(key => key === 'starlight_forest:2')).toHaveLength(1);
    expect(fourth.rewardedRenownLevels.some(key => key.startsWith('ancient_city:'))).toBe(false);
    expect(fourth.rewardedRenownLevels.some(key => key.startsWith('wind_lakes:'))).toBe(false);
  });
});
