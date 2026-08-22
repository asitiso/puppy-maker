import { describe, expect, it } from 'vitest';
import { mainCampaignIds } from './campaign-model';
import { expeditionRegionDefinitions } from './expedition-regions';
import { campaignWorldObjectives } from './campaign-world';

describe('V3 campaign world objective overlays', () => {
  it('defines one Spring, Summer and Autumn objective for each main campaign', () => {
    for (const season of ['spring', 'summer', 'autumn'] as const) {
      const seasonObjectives = campaignWorldObjectives.filter(item => item.season === season);
      expect(seasonObjectives).toHaveLength(4);
      expect(seasonObjectives.map(item => item.campaign).sort()).toEqual([...mainCampaignIds].sort());
    }
  });

  it('reuses only existing Expedition regions and stages instead of adding campaign maps', () => {
    const stageToRegion = new Map(
      expeditionRegionDefinitions.flatMap(region => region.stages.map(stageId => [stageId, region.id] as const)),
    );

    for (const objective of campaignWorldObjectives) {
      expect(expeditionRegionDefinitions.some(region => region.id === objective.regionId)).toBe(true);
      expect(objective.stageIds.length).toBeGreaterThan(0);
      for (const stageId of objective.stageIds) {
        expect(stageToRegion.get(stageId)).toBe(objective.regionId);
      }
    }
  });

  it('keeps campaign objective semantics distinct on the shared world', () => {
    const expectedKinds = {
      caretaker: 'protect_residents',
      pathfinder: 'discover_route',
      vanguard: 'remove_threat',
      arcanist: 'investigate_relic_rift',
    } as const;

    for (const objective of campaignWorldObjectives) {
      expect(objective.kind).toBe(expectedKinds[objective.campaign]);
    }
  });

  it('uses stable canonical objective ids through Autumn Great Expedition setup', () => {
    expect(campaignWorldObjectives.map(item => item.id)).toEqual([
      'spring_caretaker_resident_guard',
      'spring_pathfinder_hidden_route',
      'spring_vanguard_threat_clear',
      'spring_arcanist_relic_survey',
      'summer_caretaker_festival_rescue',
      'summer_pathfinder_festival_routes',
      'summer_vanguard_festival_threat',
      'summer_arcanist_festival_relic',
      'autumn_caretaker_great_expedition_rescue',
      'autumn_pathfinder_great_expedition_route',
      'autumn_vanguard_great_expedition_command',
      'autumn_arcanist_great_expedition_relic',
    ]);
  });
});
