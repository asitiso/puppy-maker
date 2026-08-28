import {resolveScene} from './scene-resolver';
import type {ExpeditionActivityCheckpoint} from './activity-checkpoint';
import {sanitizeExpeditionNode} from './adapters/expedition-adapter';
import type {ResolvedScene,SceneActorState,SceneCalendarInput} from './scene-types';

type ExpeditionSceneInput=SceneCalendarInput&{
  actorState?:SceneActorState;
  campaignId?:string|null;
  worldFacts?:readonly string[];
  inheritedWorldFacts?:readonly string[];
};

export function expeditionSceneForCheckpoint(checkpoint:ExpeditionActivityCheckpoint|null,input:ExpeditionSceneInput):ResolvedScene{
  const base=resolveScene({...input,location:'expedition_field',checkpoint});
  if(!checkpoint)return base;
  const step=sanitizeExpeditionNode(checkpoint.step);
  return {
    ...base,
    interactions:base.interactions.map(item=>item.id===step?{...item,required:true,hint:'required' as const}:item),
    presentationTags:[...base.presentationTags,`expedition:${checkpoint.phase}`,`node:${step}`],
  };
}
