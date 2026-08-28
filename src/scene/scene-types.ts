export const LOCATION_IDS=[
  'home',
  'training_ground',
  'magic_classroom',
  'herb_garden',
  'forest',
  'village',
  'lakeside',
  'old_shrine',
  'expedition_field',
] as const;

export type LocationId=(typeof LOCATION_IDS)[number];
export type SceneId=string;
export type TimeOfDay='dawn'|'day'|'sunset'|'night';
export type Season='spring'|'summer'|'autumn'|'winter';
export type Weather='clear'|'cloudy'|'rain'|'snow'|'mist';
export type InteractionMode=
  |'dialogue'|'inspect'|'collect'|'travel'|'rest'|'shop'
  |'training'|'choice'|'minigame'|'explore'|'battle'|'reward';
export type SceneActorId='runa'|'bear'|'owl'|'wolf'|'cat'|`npc:${string}`;
export type SceneAnchorId=string;
export type ScenePose=string;
export type SceneExpression=string;
export type SceneMotion='idle'|'approach'|'walk'|'run'|'enter-left'|'enter-right'|'exit-left'|'exit-right'|'bob'|'hop'|'turn'|string;

export interface SceneAnchor{
  id:SceneAnchorId;
  x:number;
  y:number;
  facing?:'left'|'right'|'front';
}

export interface SceneActorDefinition{
  actorId:SceneActorId;
  anchorId:SceneAnchorId;
  pose?:ScenePose;
  expression?:SceneExpression;
  motion?:SceneMotion;
  optional?:boolean;
}

export interface ResolvedSceneActor extends SceneActorDefinition{
  pose:ScenePose;
  motion:SceneMotion;
  presentationTags?:readonly string[];
}

export interface SceneInteractionIntent{
  activityId?:string;
  eventId?:string;
  choiceId?:string;
  destination?:LocationId;
  objectId?:string;
  encounterId?:string;
}

export interface SceneInteractionDefinition{
  id:string;
  label:string;
  mode:InteractionMode;
  anchorId:SceneAnchorId;
  actorId?:SceneActorId;
  enabled?:boolean;
  required?:boolean;
  newlyAvailable?:boolean;
  intent?:SceneInteractionIntent;
}

export interface ResolvedSceneInteraction extends SceneInteractionDefinition{
  enabled:boolean;
  hint:'none'|'required'|'new'|'accessible-idle';
}

export type SceneBeat=
  |{type:'move';actorId:SceneActorId;anchorId:SceneAnchorId;motion?:SceneMotion}
  |{type:'pose';actorId:SceneActorId;pose:ScenePose;expression?:SceneExpression}
  |{type:'dialogue';speaker:SceneActorId|string;text:string;expression?:SceneExpression}
  |{type:'effect';effect:string}
  |{type:'interaction';interactionId:string}
  |{type:'handoff';mode:'training'|'explore'|'battle'|'reward';intent?:SceneInteractionIntent};

export interface SceneVisualLayer{
  id:string;
  kind:'base'|'season'|'lighting'|'weather'|'world-fact'|'story'|'prop';
  token:string;
  src?:string;
  optional?:boolean;
  zIndex?:number;
}

export interface SceneDefinition{
  id:SceneId;
  location:LocationId;
  defaultTime:TimeOfDay;
  anchors:readonly SceneAnchor[];
  cast:readonly SceneActorDefinition[];
  interactions:readonly SceneInteractionDefinition[];
  beats?:readonly SceneBeat[];
}

export interface SceneCalendarInput{
  year:number;
  month:number;
  week:number;
}

export interface SceneActorState{
  condition?:string;
  personality?:string;
  calling?:string;
  bondByActor?:Partial<Record<'bear'|'owl'|'wolf'|'cat',number>>;
}

export interface SceneRequest extends SceneCalendarInput{
  location?:unknown;
  timeOfDay?:TimeOfDay;
  storyEventId?:string|null;
  campaignId?:string|null;
  worldFacts?:readonly string[];
  inheritedWorldFacts?:readonly string[];
  activityId?:string|null;
  checkpoint?:unknown;
  actorState?:SceneActorState;
}

export interface ResolvedScene{
  id:SceneId;
  location:LocationId;
  season:Season;
  timeOfDay:TimeOfDay;
  weather:Weather;
  anchors:readonly SceneAnchor[];
  backgroundLayers:readonly SceneVisualLayer[];
  cast:readonly ResolvedSceneActor[];
  interactions:readonly ResolvedSceneInteraction[];
  beats:readonly SceneBeat[];
  presentationTags:readonly string[];
}
