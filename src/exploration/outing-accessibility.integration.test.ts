import {describe,expect,it} from 'vitest';
import {forestWorld} from './forest-world';
import {lakesideWorld} from './lakeside-world';
import {livingRegionExplorationBuilders} from './living-region-explorations';
import {emptyLivingRegionState} from './living-region-state';
import {outingCrossroadsWorld} from './outing-crossroads';
import {LEGACY_REGION_IDS,LIVING_REGION_IDS,REGION_IDS,type LegacyRegionId} from './region-registry';
import {villageWorld} from './village-world';

const legacyWorlds={forest:forestWorld,village:villageWorld,lakeside:lakesideWorld} satisfies Record<LegacyRegionId,typeof forestWorld>;
const context={
  personality:{courage:8,kindness:8,curiosity:8,calmness:8},
  affection:50,
  worldFacts:[] as string[],
  inheritedWorldFacts:[] as string[],
};

describe('six-region exploration accessibility contract',()=>{
  it('keeps one physical crossroads portal for every playable region',()=>{
    const portals=outingCrossroadsWorld.interactables.filter(item=>item.kind==='portal');
    expect(portals).toHaveLength(REGION_IDS.length);
    expect(new Set(portals.map(item=>item.destinationId))).toEqual(new Set(REGION_IDS));
  });

  it('gives every legacy region a direct in-world exit back to the crossroads',()=>{
    for(const id of LEGACY_REGION_IDS){
      const exits=legacyWorlds[id].interactables.filter(item=>item.kind==='exit');
      expect(exits).toHaveLength(1);
      expect(exits[0].radius).toBeGreaterThanOrEqual(100);
      expect(exits[0].label.length).toBeGreaterThan(0);
    }
  });

  it('gives every living region a direct in-world exit in every persisted phase',()=>{
    const phases=['unvisited','active','mainQuestInProgress','mainQuestResolved','postResolution'] as const;
    for(const id of LIVING_REGION_IDS){
      for(const phase of phases){
        const base=emptyLivingRegionState()[id];
        const exploration=livingRegionExplorationBuilders[id]({...base,phase},context);
        const exits=exploration.world.interactables.filter(item=>item.kind==='exit');
        expect(exits).toHaveLength(1);
        expect(exits[0].radius).toBeGreaterThanOrEqual(100);
        expect(exits[0].label.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps an explicit exit from the crossroads back to the parent outing screen',()=>{
    const exits=outingCrossroadsWorld.interactables.filter(item=>item.kind==='exit');
    expect(exits).toHaveLength(1);
    expect(exits[0].label).toBe('집으로 돌아가기');
  });
});
