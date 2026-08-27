import {getMobileVisualAsset,type MobileVisualSlot} from '../mobile-visual-assets';
import {runaPoseAsset,type RunaPose} from '../runa-presentation';
import type {LocationId,SceneActorId,SceneVisualLayer,Season,TimeOfDay,Weather} from './scene-types';

type VisualLayerInput={
  location:LocationId;
  season:Season;
  timeOfDay:TimeOfDay;
  weather:Weather;
  worldFacts?:readonly string[];
  storyToken?:string|null;
};

export type ResolvedActorVisual={
  actorId:SceneActorId;
  requestedPose:string;
  resolvedPose:string;
  slot:MobileVisualSlot;
  src?:string;
};

const knownRunaPoses=new Set<RunaPose>(['idle','talk','surprised','training-ready','tired','happy','worried','sit']);
const companionIds=new Set<SceneActorId>(['bear','owl','wolf','cat']);

export function resolveSceneVisualLayers(input:VisualLayerInput):SceneVisualLayer[]{
  const layers:SceneVisualLayer[]=[
    {id:`base:${input.location}`,kind:'base',token:`location:${input.location}`,zIndex:0},
    {id:`season:${input.season}`,kind:'season',token:`season:${input.season}`,optional:true,zIndex:10},
    {id:`lighting:${input.timeOfDay}`,kind:'lighting',token:`lighting:${input.timeOfDay}`,optional:true,zIndex:20},
    {id:`weather:${input.weather}`,kind:'weather',token:`weather:${input.weather}`,optional:true,zIndex:30},
  ];
  for(const fact of input.worldFacts??[]){
    if(typeof fact==='string'&&fact.length>0){
      layers.push({id:`world-fact:${fact}`,kind:'world-fact',token:`world-fact:${fact}`,optional:true,zIndex:40});
    }
  }
  if(input.storyToken){
    layers.push({id:`story:${input.storyToken}`,kind:'story',token:`story:${input.storyToken}`,optional:true,zIndex:50});
  }
  return layers;
}

function companionSlot(actorId:'bear'|'owl'|'wolf'|'cat',requestedPose:string):MobileVisualSlot{
  return requestedPose==='battle'?`companion.${actorId}.battle`:`companion.${actorId}.portrait`;
}

export function resolveActorVisual(actorId:SceneActorId,requestedPose:string='idle'):ResolvedActorVisual{
  if(actorId==='runa'){
    const resolvedPose=knownRunaPoses.has(requestedPose as RunaPose)?requestedPose as RunaPose:'idle';
    return {
      actorId,
      requestedPose,
      resolvedPose,
      slot:'home.hero',
      src:runaPoseAsset(resolvedPose),
    };
  }
  if(companionIds.has(actorId)){
    const companion=actorId as 'bear'|'owl'|'wolf'|'cat';
    const resolvedPose=requestedPose==='battle'?'battle':'idle';
    const slot=companionSlot(companion,resolvedPose);
    return {actorId,requestedPose,resolvedPose,slot,src:getMobileVisualAsset(slot).src};
  }
  return {actorId,requestedPose,resolvedPose:'idle',slot:'home.hero',src:getMobileVisualAsset('home.hero').src};
}
