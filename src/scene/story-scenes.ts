import {STORY_EVENTS,type StoryEventId} from '../game/events';
import {resolveScene} from './scene-resolver';
import type {LocationId,ResolvedScene,SceneActorState,SceneCalendarInput} from './scene-types';

export const STORY_SCENE_LOCATIONS:Record<StoryEventId,LocationId>={
  lost_bird:'forest',
  moon_flower:'herb_garden',
  rival_tracks:'training_ground',
  quiet_rain:'home',
  starlight_market:'village',
  old_shrine:'old_shrine',
  firefly_path:'forest',
  training_bell:'training_ground',
  winter_letter:'home',
  guardian_dream:'old_shrine',
};

const STORY_FOCUS_ANCHORS:Record<StoryEventId,string>={
  lost_bird:'trace',
  moon_flower:'herb_patch',
  rival_tracks:'dummy',
  quiet_rain:'bed',
  starlight_market:'square',
  old_shrine:'altar',
  firefly_path:'path',
  training_bell:'dummy',
  winter_letter:'desk',
  guardian_dream:'guardian-light',
};

const STORY_FOCUS_POSES:Record<StoryEventId,string>={
  lost_bird:'curious',
  moon_flower:'inspect',
  rival_tracks:'alert',
  quiet_rain:'sit',
  starlight_market:'happy',
  old_shrine:'focus',
  firefly_path:'surprised',
  training_bell:'training-ready',
  winter_letter:'curious',
  guardian_dream:'focus',
};

type StorySceneInput=SceneCalendarInput&{
  actorState?:SceneActorState;
  campaignId?:string|null;
  worldFacts?:readonly string[];
  inheritedWorldFacts?:readonly string[];
};

export function storySceneForEvent(eventId:StoryEventId,input:StorySceneInput):ResolvedScene{
  const event=STORY_EVENTS.find(item=>item.id===eventId);
  if(!event)throw new Error(`Unknown story event: ${eventId}`);
  const base=resolveScene({...input,location:STORY_SCENE_LOCATIONS[eventId],storyEventId:eventId});
  const focusAnchor=STORY_FOCUS_ANCHORS[eventId];
  const choiceAnchors=event.choices.map((choice,index)=>({
    id:`story-choice:${eventId}:${choice.id}`,
    x:event.choices.length===1?50:30+index*(40/Math.max(1,event.choices.length-1)),
    y:84,
  }));
  const choiceInteractions=event.choices.map((choice,index)=>({
    id:`story:${eventId}:${choice.id}`,
    label:choice.label,
    mode:'choice' as const,
    anchorId:choiceAnchors[index].id,
    enabled:true,
    required:true,
    newlyAvailable:false,
    intent:{eventId,choiceId:choice.id},
    hint:'required' as const,
  }));
  const lockedBaseInteractions=base.interactions.map(item=>({
    ...item,
    enabled:false,
    required:false,
    hint:'none' as const,
  }));
  const beats:ResolvedScene['beats']=[
    {type:'effect',effect:`scene-enter:${STORY_SCENE_LOCATIONS[eventId]}`},
    {type:'move',actorId:'runa',anchorId:focusAnchor,motion:'approach'},
    {type:'pose',actorId:'runa',pose:STORY_FOCUS_POSES[eventId]},
    {type:'effect',effect:`highlight:${focusAnchor}`},
    {type:'dialogue',speaker:'runa',text:event.body},
    ...choiceInteractions.map(item=>({type:'interaction' as const,interactionId:item.id})),
  ];
  return {
    ...base,
    anchors:[...base.anchors,...choiceAnchors],
    interactions:[...lockedBaseInteractions,...choiceInteractions],
    beats,
    presentationTags:[...base.presentationTags,`story:${eventId}`,`story-focus:${focusAnchor}`],
  };
}
