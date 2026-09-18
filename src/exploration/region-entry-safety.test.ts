import {describe,expect,it} from 'vitest';
import {expeditionOutpostExploration} from './expedition-outpost-world';
import {forestWorld} from './forest-world';
import {herbHillsExploration} from './herb-hills-world';
import {lakesideWorld} from './lakeside-world';
import type {LivingRegionProgress} from './living-region-state';
import {nearestInteractable} from './exploration-runtime';
import {oldShrineExploration} from './old-shrine-world';
import {outingCrossroadsWorld} from './outing-crossroads';
import type {ExplorationWorldDefinition} from './exploration-types';
import {villageWorld} from './village-world';

const progress:LivingRegionProgress={phase:'active',discoveries:[],completedInteractions:[]};
const context={
  personality:{courage:4,kindness:4,curiosity:4,calmness:4},
  affection:20,
  worldFacts:[] as string[],
  inheritedWorldFacts:[] as string[],
};

const worlds:ExplorationWorldDefinition[]=[
  outingCrossroadsWorld,
  forestWorld,
  villageWorld,
  lakesideWorld,
  oldShrineExploration(progress,context).world,
  herbHillsExploration(progress,context).world,
  expeditionOutpostExploration(progress,context).world,
];

describe('outing region entry safety',()=>{
  for(const world of worlds){
    it(`${world.label} starts clear of its immediate return action`,()=>{
      const exit=world.interactables.find(item=>item.kind==='exit');
      expect(exit).toBeDefined();
      const distance=Math.hypot(world.start.x-exit!.position.x,world.start.y-exit!.position.y);
      expect(distance).toBeGreaterThan(exit!.radius+world.playerRadius);
      expect(nearestInteractable(world.start,world.interactables)?.kind).not.toBe('exit');
    });
  }
});
