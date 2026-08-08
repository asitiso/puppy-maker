import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { sanctuaryUiSummary } from './sanctuary-ui';

describe('sanctuary ui summary', () => {
  it('shows facility level, next cost, affordability and effect', () => {
    const state = {
      ...initialState,
      gold:2000,
      expeditionMaterials:{ star_bark:10, arcane_shard:10, wind_pearl:10 },
    };
    const summary = sanctuaryUiSummary(state);
    const hall = summary.facilities.find(item => item.id === 'training_hall')!;
    expect(hall).toEqual(expect.objectContaining({ level:0, nextLevel:1, canUpgrade:true }));
    expect(hall.nextCost).toEqual({ gold:500, materials:{ star_bark:3, arcane_shard:0, wind_pearl:0 } });
    expect(hall.currentEffect).toContain('0%');
    expect(hall.nextEffect).toContain('1%');
  });

  it('explains a level-three renown block separately from resources', () => {
    const state = {
      ...initialState,
      gold:5000,
      sanctuaryLevels:{ ...initialState.sanctuaryLevels, training_hall:2 as const },
      expeditionMaterials:{ star_bark:20, arcane_shard:20, wind_pearl:20 },
      regionalRenown:{ ...initialState.regionalRenown, starlight_forest:2 },
    };
    const hall = sanctuaryUiSummary(state).facilities.find(item => item.id === 'training_hall')!;
    expect(hall.canUpgrade).toBe(false);
    expect(hall.blockReason).toBe('별빛 숲 명성 3 필요');
  });

  it('marks max-level facilities complete', () => {
    const state = { ...initialState, sanctuaryLevels:{ training_hall:3 as const, archive_library:3 as const, herb_garden:3 as const, observatory:3 as const } };
    expect(sanctuaryUiSummary(state).facilities.every(item => item.complete)).toBe(true);
  });
});
