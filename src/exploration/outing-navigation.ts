import {
  getRegionDefinition,
  isLegacyRegionId,
  isLivingRegionId,
  isRegionId,
  type LegacyRegionId,
  type LivingRegionId,
  type RegionId,
} from './region-registry';

export type OutingSceneId='crossroads'|RegionId;

export type OutingRoute=
  | {kind:'crossroads'}
  | {kind:'legacy';regionId:LegacyRegionId}
  | {kind:'living';regionId:LivingRegionId};

export function parseOutingDestination(value:string):RegionId|null{
  return isRegionId(value)?value:null;
}

export function getOutingRoute(sceneId:OutingSceneId):OutingRoute{
  if(sceneId==='crossroads') return {kind:'crossroads'};
  if(isLegacyRegionId(sceneId)) return {kind:'legacy',regionId:sceneId};
  if(isLivingRegionId(sceneId)) return {kind:'living',regionId:sceneId};
  throw new Error(`Unknown outing scene: ${sceneId}`);
}

export function getOutingSceneTitle(sceneId:OutingSceneId,crossroadsTitle:string):string{
  return sceneId==='crossroads'?crossroadsTitle:getRegionDefinition(sceneId).name;
}
