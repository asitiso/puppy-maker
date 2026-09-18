import type {Personality} from '../game-tactical-base';
import {expeditionOutpostExploration} from './expedition-outpost-world';
import type {ExplorationStoryFrame,ExplorationWorldDefinition} from './exploration-types';
import {herbHillsExploration} from './herb-hills-world';
import type {LivingRegionProgress} from './living-region-state';
import {oldShrineExploration} from './old-shrine-world';
import type {LivingRegionId} from './region-registry';

export type LivingRegionExplorationContext={
  personality:Personality;
  affection:number;
  worldFacts:readonly string[];
  inheritedWorldFacts:readonly string[];
};

export type LivingRegionExploration={
  world:ExplorationWorldDefinition;
  storyFrames:Record<string,ExplorationStoryFrame>;
  discoveryByInteraction:Readonly<Record<string,string>>;
  questStartInteractionId:string;
  questResolveInteractionId:string;
  postResolutionInteractionId:string;
};

type LivingRegionExplorationBuilder=(progress:LivingRegionProgress,context:LivingRegionExplorationContext)=>LivingRegionExploration;

export const livingRegionExplorationBuilders:Record<LivingRegionId,LivingRegionExplorationBuilder>={
  old_shrine:oldShrineExploration,
  herb_hills:herbHillsExploration,
  expedition_outpost:expeditionOutpostExploration,
};
