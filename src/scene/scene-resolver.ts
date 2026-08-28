import {resolveCompanionAmbient,resolveHomeAmbientBehavior} from './home-living-behavior';
import {seasonForMonth} from './scene-calendar';
import {resolveSceneVisualLayers} from './scene-asset-registry';
import {sceneDefinition} from './scene-registry';
import {LOCATION_IDS,type LocationId,type ResolvedScene,type ResolvedSceneInteraction,type SceneActorId,type SceneRequest,type Weather} from './scene-types';
import {weatherForWeek} from './scene-weather';

const locationSet=new Set<string>(LOCATION_IDS);
const companionAnchorByBias={near:'runa',watch:'world_map',forward:'door',prop:'bed'} as const;
const hazardousWorldFacts=new Set(['rift_unstable','hollow_rift_entrenched']);

type RunaReaction={pose:string;motion:string;tag:string};

function isCompanionActorId(actorId:SceneActorId):actorId is 'bear'|'owl'|'wolf'|'cat'{
  return actorId==='bear'||actorId==='owl'||actorId==='wolf'||actorId==='cat';
}

export function sanitizeLocation(value:unknown):LocationId{
  return typeof value==='string'&&locationSet.has(value)?value as LocationId:'home';
}

function storyWeather(storyEventId:string|null|undefined,base:Weather):Weather{
  if(storyEventId==='quiet_rain') return 'rain';
  if(storyEventId==='winter_letter') return 'snow';
  if(storyEventId==='guardian_dream') return 'mist';
  return base;
}

function contextualRunaReaction(request:SceneRequest,location:LocationId,worldFacts:readonly string[]):RunaReaction|null{
  if(location==='training_ground'&&request.activityId==='hunt')return {pose:'training-ready',motion:'approach',tag:'actor-reaction:training-ready'};
  if(location==='magic_classroom'&&request.activityId==='magic')return {pose:'focus',motion:'bob',tag:'actor-reaction:focus'};
  if(location==='herb_garden'&&request.activityId==='herb')return {pose:'inspect',motion:'approach',tag:'actor-reaction:inspect'};
  if(worldFacts.some(fact=>hazardousWorldFacts.has(fact)))return {pose:'alert',motion:'turn',tag:'actor-reaction:alert'};
  if(request.actorState?.condition==='tired')return {pose:'tired',motion:'bob',tag:'actor-reaction:tired'};
  if(request.actorState?.condition==='happy'||request.actorState?.condition==='energetic')return {pose:'happy',motion:'hop',tag:'actor-reaction:happy'};
  if((location==='forest'||location==='village'||location==='lakeside')&&request.actorState?.personality==='curious')return {pose:'curious',motion:'turn',tag:'actor-reaction:curious'};
  return null;
}

export function resolveScene(request:SceneRequest):ResolvedScene{
  const location=sanitizeLocation(request.location);
  const definition=sceneDefinition(location);
  const season=seasonForMonth(request.month);
  const weeklyWeather=weatherForWeek(request.year,request.month,request.week);
  const weather=storyWeather(request.storyEventId,weeklyWeather);
  const timeOfDay=request.timeOfDay??definition.defaultTime;
  const worldFacts=[...(request.worldFacts??[])].filter((value):value is string=>typeof value==='string'&&value.length>0).sort();
  const inheritedWorldFacts=[...(request.inheritedWorldFacts??[])].filter((value):value is string=>typeof value==='string'&&value.length>0).sort();
  const presentationTags:string[]=[];
  if(request.campaignId) presentationTags.push(`campaign:${request.campaignId}`);
  for(const fact of worldFacts) presentationTags.push(`world-fact:${fact}`);
  if(request.storyEventId) presentationTags.push(`story:${request.storyEventId}`);
  if(request.actorState?.condition) presentationTags.push(`condition:${request.actorState.condition}`);

  const homeAmbient=location==='home'?resolveHomeAmbientBehavior({
    condition:request.actorState?.condition,
    personality:request.actorState?.personality,
    year:request.year,month:request.month,week:request.week,
  }):null;
  const runaReaction=location==='home'?null:contextualRunaReaction(request,location,worldFacts);
  if(runaReaction)presentationTags.push(runaReaction.tag);

  const cast:ResolvedScene['cast']=definition.cast.map(actor=>{
    if(homeAmbient&&actor.actorId==='runa'){
      return {
        ...actor,
        anchorId:homeAmbient.anchorId,
        pose:homeAmbient.pose,
        motion:homeAmbient.motion,
        presentationTags:[
          ...(request.actorState?.condition?[`condition:${request.actorState.condition}`]:[]),
          homeAmbient.tag,
        ],
      };
    }
    if(location==='home'&&isCompanionActorId(actor.actorId)){
      const bondLevel=request.actorState?.bondByActor?.[actor.actorId]??0;
      const ambient=resolveCompanionAmbient({actorId:actor.actorId,bondLevel});
      return {
        ...actor,
        anchorId:companionAnchorByBias[ambient.anchorBias],
        pose:actor.pose??'idle',
        motion:ambient.motion,
        presentationTags:[ambient.tag],
      };
    }
    if(actor.actorId==='runa'&&runaReaction){
      return {
        ...actor,
        pose:runaReaction.pose,
        motion:runaReaction.motion,
        presentationTags:[
          ...(request.actorState?.condition?[`condition:${request.actorState.condition}`]:[]),
          runaReaction.tag,
        ],
      };
    }
    return {
      ...actor,
      pose:actor.pose??'idle',
      motion:actor.motion??'idle',
      presentationTags:request.actorState?.condition?[`condition:${request.actorState.condition}`]:[],
    };
  });
  const interactions:ResolvedScene['interactions']=definition.interactions.map(item=>{
    const hint:ResolvedSceneInteraction['hint']=item.required?'required':item.newlyAvailable?'new':'none';
    return {...item,enabled:item.enabled!==false,hint};
  });
  const backgroundLayers=resolveSceneVisualLayers({
    location,season,timeOfDay,weather,worldFacts,inheritedWorldFacts,
    bondByActor:request.actorState?.bondByActor,storyToken:request.storyEventId,
  });
  for(const layer of backgroundLayers){
    if(layer.token.startsWith('inherited-world-fact:')||layer.token.startsWith('bond:')) presentationTags.push(layer.token);
  }
  return {
    id:definition.id,location,season,timeOfDay,weather,anchors:definition.anchors,backgroundLayers,cast,interactions,
    beats:definition.beats??[],presentationTags,
  };
}
