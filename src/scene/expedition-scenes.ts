import type {CompanionId} from '../tactical-companions';
import {resolveScene} from './scene-resolver';
import type {ExpeditionActivityCheckpoint} from './activity-checkpoint';
import {EXPEDITION_NODES,sanitizeExpeditionNode,type ExpeditionSceneNode} from './adapters/expedition-adapter';
import type {ResolvedScene,SceneActorState,SceneCalendarInput} from './scene-types';

type ExpeditionSceneInput=SceneCalendarInput&{
  actorState?:SceneActorState;
  campaignId?:string|null;
  worldFacts?:readonly string[];
  inheritedWorldFacts?:readonly string[];
  companions?:readonly CompanionId[];
};

const COMPANION_NODE_HINTS:Record<CompanionId,Partial<Record<ExpeditionSceneNode,string>> & {default:string}>={
  bear:{
    encounter:'곰이 앞을 막아 방어하기 좋은 지점을 짚어줘요.',
    camp:'곰이 야영지 주변을 단단히 확인해 안전한 자리를 골라줘요.',
    default:'곰이 루나보다 한발 앞에서 위험을 받아낼 준비를 해요.',
  },
  owl:{
    ruin:'부엉이가 유적의 문양과 오래된 기록을 먼저 조사하자고 해요.',
    rift:'부엉이가 균열의 마력 흐름을 차분히 관찰해요.',
    default:'부엉이가 높은 곳에서 주변의 단서와 변화부터 살펴봐요.',
  },
  wolf:{
    crossroads:'늑대가 갈림길의 적 흔적과 이어지는 길을 냄새로 짚어요.',
    path:'늑대가 길가의 발자국과 최근 움직임을 빠르게 찾아내요.',
    default:'늑대가 앞쪽 길과 적의 기척을 먼저 감지해요.',
  },
  cat:{
    treasure:'고양이가 돌 틈에 숨은 보물 흔적을 찾아내요.',
    ruin:'고양이가 다른 이들이 지나친 작은 틈과 숨은 통로를 살펴봐요.',
    default:'고양이가 눈에 잘 띄지 않는 틈과 숨은 물건을 찾아봐요.',
  },
};

export function expeditionJourneyNodes():ExpeditionSceneNode[]{
  return [...EXPEDITION_NODES];
}

export function companionExpeditionHint(companion:CompanionId,node:ExpeditionSceneNode):string{
  return COMPANION_NODE_HINTS[companion][node]??COMPANION_NODE_HINTS[companion].default;
}

export function expeditionSceneForCheckpoint(checkpoint:ExpeditionActivityCheckpoint|null,input:ExpeditionSceneInput):ResolvedScene{
  const base=resolveScene({...input,location:'expedition_field',checkpoint});
  const companions=[...new Set(input.companions??[])].slice(0,2);
  const companionTags=companions.map(companion=>`companion:${companion}`);
  if(!checkpoint)return {...base,presentationTags:[...base.presentationTags,...companionTags]};
  const step=sanitizeExpeditionNode(checkpoint.step);
  const hintTags=companions.map(companion=>`companion-hint:${companion}:${step}`);
  return {
    ...base,
    interactions:base.interactions.map(item=>item.id===step?{...item,required:true,hint:'required' as const}:item),
    presentationTags:[...base.presentationTags,`expedition:${checkpoint.phase}`,`node:${step}`,...companionTags,...hintTags],
  };
}
