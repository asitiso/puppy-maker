import { describe, expect, it } from 'vitest';
import { applyCrafting } from './expedition-crafting';
import { resolveExpeditionFinish } from './expedition-rewards';
import { expeditionStageDefinitions } from './expedition-regions';
import { emptyExpeditionPersistentState } from './expedition-state';
import { emptyRegionalRenown, regionalRenownLevel, renownGainForExpedition } from './regional-renown';
import { advanceWorldContracts, emptyWorldContractProgress } from './world-contracts';
import { worldEvent, worldEventExpeditionBonus } from './world-event';

const base = () => ({
  ...emptyExpeditionPersistentState(),
  gold:0,
  gems:0,
  affection:0,
  inventory:{ star_cookie:0, herb_tea:0, fox_charm:0 },
});

describe('guardian expedition full world loop', () => {
  it('runs stage → boss → rewards → relic/crafting/discovery → renown → contract/event without a blocker', () => {
    let state = base();
    let renown = emptyRegionalRenown();
    let contractProgress = emptyWorldContractProgress();
    let rewardedKeys:string[] = [];
    let contractGold = 0;
    let contractGems = 0;
    let eventPoints = 0;
    const event = worldEvent(1,1);

    for (const stage of expeditionStageDefinitions) {
      const result = resolveExpeditionFinish(state,stage.id,stage.target);
      expect(result.summary.accepted).toBe(true);
      expect(result.summary.cleared).toBe(true);
      expect(result.summary.firstClear).toBe(true);
      state = result.state;

      renown = {
        ...renown,
        [stage.region]:renown[stage.region] + renownGainForExpedition(result.summary.grade,stage.boss && result.summary.firstClear),
      };
      const contracts = advanceWorldContracts({
        year:1,
        month:1,
        event,
        progress:contractProgress,
        rewardedKeys,
        region:stage.region,
        grade:result.summary.grade,
      });
      contractProgress = contracts.progress;
      rewardedKeys = contracts.rewardedKeys;
      contractGold += contracts.reward.gold;
      contractGems += contracts.reward.gems;
      eventPoints += worldEventExpeditionBonus(event,stage.region,result.summary.grade).seasonPoints;
    }

    expect(state.expeditionStoryEntries).toHaveLength(9);
    expect(state.expeditionDiscoveries).toHaveLength(9);
    expect(state.expeditionMaterials).toEqual({ star_bark:2, arcane_shard:2, wind_pearl:2 });
    expect(state.ownedExpeditionRelics).toEqual(expect.arrayContaining([
      'moonfang_charm','mana_prism','wind_feather','bond_locket','explorer_compass',
    ]));
    expect(regionalRenownLevel(renown.starlight_forest)).toBe(2);
    expect(regionalRenownLevel(renown.ancient_city)).toBe(2);
    expect(regionalRenownLevel(renown.wind_lakes)).toBe(2);
    expect({ gold:contractGold, gems:contractGems }).toEqual({ gold:250, gems:1 });
    expect(rewardedKeys).toHaveLength(3);
    expect(eventPoints).toBe(15);

    for (const [stageId,target] of [['forest_path',700],['city_square',950],['lake_channel',1200]] as const) {
      state = resolveExpeditionFinish(state,stageId,target).state;
    }
    expect(state.expeditionMaterials).toEqual({ star_bark:3, arcane_shard:3, wind_pearl:3 });

    const craft = applyCrafting('guardian_thread_recipe',state.expeditionMaterials,{
      craftingMilestones:state.craftingMilestones,
      ownedRelics:state.ownedExpeditionRelics,
    });
    expect(craft.crafted).toBe(true);
    expect(craft.relic).toBe('guardian_thread');

    const repeatContract = advanceWorldContracts({
      year:1,
      month:1,
      event,
      progress:contractProgress,
      rewardedKeys,
      region:'starlight_forest',
      grade:'S',
    });
    expect(repeatContract.reward).toEqual({ gold:0, gems:0 });
    expect(repeatContract.progress).toEqual({ expedition_clear:3, high_grade:2, featured_region:2 });
    expect(worldEventExpeditionBonus(event,'starlight_forest','S')).toEqual({ seasonPoints:5, materialBonus:1 });
  });
});
