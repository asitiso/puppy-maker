import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';

describe('raising depth expedition progression', () => {
  it('stacks active Pathfinder supply, trail reading, and featured-event bonuses on an S first clear', () => {
    const pathfinder = {
      ...initialState,
      activeCalling:'pathfinder' as const,
      purchasedTraits:['pathfinder_herb','pathfinder_eye','pathfinder_supply'] as typeof initialState.purchasedTraits,
    };
    const next = reducer(pathfinder, { type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:900 });
    expect(next.lastExpeditionResult?.grade).toBe('S');
    expect(next.expeditionMaterials.star_bark).toBe(5);
    expect(next.lastExpeditionResult?.materialReward).toBe(5);
  });

  it('still grants the featured world-event material when Pathfinder is inactive', () => {
    const inactive = {
      ...initialState,
      activeCalling:'vanguard' as const,
      purchasedTraits:['pathfinder_herb','pathfinder_eye','pathfinder_supply'] as typeof initialState.purchasedTraits,
    };
    const next = reducer(inactive, { type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:900 });
    expect(next.expeditionMaterials.star_bark).toBe(3);
    expect(next.lastExpeditionResult?.materialReward).toBe(3);
  });
});
