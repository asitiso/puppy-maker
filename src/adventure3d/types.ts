export type Vec3={x:number;y:number;z:number};

export type PlayerMotionState={
  position:Vec3;
  velocity:Vec3;
  grounded:boolean;
  stamina:number;
  facingYaw:number;
};

export type PlayerMotionInput={
  moveX:number;
  moveZ:number;
  sprint:boolean;
  jump:boolean;
};

export type AdventureCameraState={
  yaw:number;
  pitch:number;
  distance:number;
  target:Vec3;
};

export type AdventureDiscoveryKind='landmark'|'vista'|'ruin'|'camp'|'resource'|'secret'|'npc'|'puzzle';

export type AdventureDiscovery={
  id:string;
  kind:AdventureDiscoveryKind;
  label:string;
  hint:string;
  position:Vec3;
  radius:number;
  height:number;
  importance:1|2|3;
};

export type AdventureFieldDefinition={
  id:string;
  label:string;
  halfSize:number;
  spawn:Vec3;
  discoveries:readonly AdventureDiscovery[];
};
