export type Vec2={x:number;y:number};

export type WorldBounds={width:number;height:number};

export type CollisionRect={
  id:string;
  x:number;
  y:number;
  width:number;
  height:number;
};

export type ExplorationLayer={
  id:string;
  src:string;
  zIndex:number;
  parallax?:number;
};

export type ExplorationInteractableKind='story'|'inspect'|'exit'|'portal';

export type ExplorationInteractable={
  id:string;
  label:string;
  kind:ExplorationInteractableKind;
  position:Vec2;
  radius:number;
  storyFrameId?:string;
  artSrc?:string;
  destinationId?:string;
  enabled?:boolean;
  repeatable?:boolean;
  requiresCompleted?:readonly string[];
};

export type ExplorationStoryFrame={
  id:string;
  title:string;
  eyebrow?:string;
  speaker?:string;
  text:string;
  artSrc:string;
  frameSrc:string;
  actionLabel:string;
  progression:boolean;
};

export type ExplorationWorldDefinition={
  id:string;
  label:string;
  objective:string;
  width:number;
  height:number;
  playerRadius:number;
  playerSpeed:number;
  start:Vec2;
  obstacles:readonly CollisionRect[];
  interactables:readonly ExplorationInteractable[];
  layers:readonly ExplorationLayer[];
};
