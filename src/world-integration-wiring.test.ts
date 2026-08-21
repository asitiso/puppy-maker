import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('World shared integration wiring', () => {
  it('records an accepted C expedition attempt without advancing clear-only world/live-ops progression', () => {
    const next = reducer(initialState, {
      type:'FINISH_EXPEDITION_STAGE',
      stageId:'forest_path',
      score:0,
    });

    expect(next.lastExpeditionResult).toMatchObject({ accepted:true, cleared:false, grade:'C' });
    expect(next.regionalRenown).toEqual(initialState.regionalRenown);
    expect(next.expeditionSeasonScores).toEqual(initialState.expeditionSeasonScores);
    expect(next.worldContractProgress).toEqual(initialState.worldContractProgress);
    expect(next.rewardedWorldContracts).toEqual(initialState.rewardedWorldContracts);
    expect(next.seasonJourneyScores).toEqual(initialState.seasonJourneyScores);
    expect(next.weeklyDirectiveProgress).toEqual(initialState.weeklyDirectiveProgress);
    expect(next.lastWorldProgress).toBeNull();
    expect(next.lastLiveOpsProgress).toBeNull();
  });

  it('prevents recrafting Guardian Thread once the persistent milestone/relic is owned', () => {
    const ready = {
      ...initialState,
      expeditionMaterials:{ star_bark:6, arcane_shard:6, wind_pearl:6 },
      craftingMilestones:[],
      ownedExpeditionRelics:[],
    };
    const first = reducer(ready, { type:'CRAFT_EXPEDITION_RECIPE', recipe:'guardian_thread_recipe' });

    expect(first.craftingMilestones).toContain('crafted_guardian_thread');
    expect(first.ownedExpeditionRelics).toContain('guardian_thread');
    expect(first.expeditionMaterials).toEqual({ star_bark:3, arcane_shard:3, wind_pearl:3 });

    const repeated = reducer(first, { type:'CRAFT_EXPEDITION_RECIPE', recipe:'guardian_thread_recipe' });
    expect(repeated).toBe(first);
    expect(repeated.expeditionMaterials).toEqual({ star_bark:3, arcane_shard:3, wind_pearl:3 });
  });

  it('restores Guardian Thread through the public persistent hydration path', () => {
    const hydrated = hydrateGameState({
      craftingMilestones:['crafted_guardian_thread'],
      ownedExpeditionRelics:[],
      equippedExpeditionRelics:[],
    });

    expect(hydrated.craftingMilestones).toEqual(['crafted_guardian_thread']);
    expect(hydrated.ownedExpeditionRelics).toContain('guardian_thread');
  });
});
