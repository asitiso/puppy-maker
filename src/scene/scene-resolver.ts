import {seasonForMonth} from './scene-calendar';
import {resolveSceneVisualLayers} from './scene-asset-registry';
import {sceneDefinition} from './scene-registry';
import {LOCATION_IDS,type LocationId,type ResolvedScene,type SceneRequest,type Weather} from './scene-types';
import {weatherForWeek} from './scene-weather';

const locationSet=new Set<unknown>(LOCATION_IDS);

export function sanitizeLocation(value:unknown):LocationId{
  return locationSet.has(value)?value as LocationId:'home';
}

function storyWeather(storyEventId:string|null|undefined,base:Weather):Weather{
  if(storyEventId==='quiet_rain') return 'rain';
  if(storyEventId==='winter_letter') return 'snow';
  if(storyEventId==='guardian_dream') return 'mist';
  return base;
}

export function resolveScene(request:SceneRequest):ResolvedScene{
  const location=sanitizeLocation(request.location);
  const definition=sceneDefinition(location);
  const season=seasonForMonth(request.month);
  const weeklyWeather=weatherForWeek(request.year,request.month,request.week);
  const weather=storyWeather(request.storyEventId,weeklyWeather);
  const timeOfDay=request.timeOfDay??definition.defaultTime;
  const worldFacts=[...(request.worldFacts??[])].filter((value):value is string=>typeof value==='string'&&value.length>0).sort();
  const presentationTags:string[]=[];
  if(request.campaignId) presentationTags.push(`campaign:${request.campaignId}`);
  for(const fact of worldFacts) presentationTags.push(`world-fact:${fact}`);
  if(request.storyEventId) presentationTags.push(`story:${request.storyEventId}`);
  if(request.actorState?.condition) presentationTags.push(`condition:${request.actorState.condition}`);

  const cast=definition.cast.map(actor=>({
    ...actor,
    pose:actor.actorId==='runa'&&request.actorState?.condition==='tired'?'tired':actor.pose??'idle',
    motion:actor.motion??'idle',
    presentationTags:request.actorState?.condition?[`condition:${request.actorState.condition}`]:[],
  }));
  const interactions=definition.interactions.map(item=>({
    ...item,
    enabled:item.enabled!==false,
    hint:item.required?'required':item.newlyAvailable?'new':'none' as const,
  }));
  const backgroundLayers=resolveSceneVisualLayers({location,season,timeOfDay,weather,worldFacts,storyToken:request.storyEventId});
  return {
    id:definition.id,location,season,timeOfDay,weather,anchors:definition.anchors,backgroundLayers,cast,interactions,
    beats:definition.beats??[],presentationTags,
  };
}
