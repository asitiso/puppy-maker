import type {OutingLocationId} from '../adventure';
import {resolveScene} from './scene-resolver';
import type {ResolvedScene,SceneActorState,SceneCalendarInput} from './scene-types';

type OutingSceneInput=SceneCalendarInput&{
  actorState?:SceneActorState;
  campaignId?:string|null;
  worldFacts?:readonly string[];
  inheritedWorldFacts?:readonly string[];
};

export type OutingTarget={
  interactionId:string;
  location:OutingLocationId;
  presentationHint:string;
};

const outingTargetIds:Record<OutingLocationId,readonly string[]>={
  forest:['trace','tree','herb','path'],
  village:['square','shop','performance','repair','alley'],
  lakeside:['water','fish','rest','wind-crystal'],
};

const targetHints:Record<string,string>={
  trace:'빛나는 흔적을 따라 주변을 조사해요.',tree:'오래된 나무에 남은 이야기를 살펴봐요.',herb:'숲 가장자리의 약초 군락을 찾아봐요.',path:'이어지는 숲길을 더 깊게 탐색해요.',
  square:'광장 사람들의 움직임과 소문을 살펴봐요.',shop:'상점 주변에서 새로운 물건과 이야기를 확인해요.',performance:'공연이 열리는 곳에 가까이 가봐요.',repair:'수리점에서 도움이 필요한 일이 있는지 봐요.',alley:'조용한 골목에 숨은 흔적을 살펴봐요.',
  water:'물가의 반짝임과 흔적을 관찰해요.',fish:'은빛 물고기가 나타나는 곳을 살펴봐요.',rest:'호숫가 바람을 느끼며 주변을 관찰해요.', 'wind-crystal':'바람 결정이 반응하는 곳을 조사해요.',
};

export function outingTargets(location:OutingLocationId):readonly OutingTarget[]{
  return outingTargetIds[location].map(interactionId=>({interactionId,location,presentationHint:targetHints[interactionId]??'주변을 살펴봐요.'}));
}

export function outingScene(location:OutingLocationId,input:OutingSceneInput):ResolvedScene{
  return resolveScene({...input,location});
}
