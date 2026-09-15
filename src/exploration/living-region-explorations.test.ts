import {describe,expect,it} from 'vitest';
import {livingRegionExplorationBuilders} from './living-region-explorations';
import {LIVING_REGION_IDS} from './region-registry';
const progress={phase:'active' as const,discoveries:[],completedInteractions:[]};
const context={personality:{courage:4,kindness:4,curiosity:4,calmness:4},affection:20,worldFacts:[] as string[],inheritedWorldFacts:[] as string[]};
describe('V16 living-region exploration registry',()=>{
 it('has one authored exploration builder for every living region',()=>{expect(Object.keys(livingRegionExplorationBuilders).sort()).toEqual([...LIVING_REGION_IDS].sort());for(const id of LIVING_REGION_IDS){const x=livingRegionExplorationBuilders[id](progress,context);expect(x.world.interactables.some(i=>i.kind==='exit')).toBe(true);expect(x.questStartInteractionId).toBeTruthy();expect(x.questResolveInteractionId).toBeTruthy();expect(x.postResolutionInteractionId).toBeTruthy();}});
});
