import {STARTING_FIELD} from './starting-field';

export type DawnreachHazardSave={
  burning:boolean;
  spent:boolean;
  burnRemaining:number;
};

export type DawnreachAdventureState={
  visitedDiscoveries:string[];
  lastPosition:{x:number;z:number}|null;
  echoSenseUnlocked:boolean;
  ruin:{
    stonePosition:{x:number;z:number};
    brazierLit:boolean;
    solved:boolean;
    rewardClaimed:boolean;
  };
  defeatedEnemyIds:string[];
  hazards:Record<string,DawnreachHazardSave>;
};

export type AdventureWorldState={
  version:1;
  dawnreach:DawnreachAdventureState;
};

const isRecord=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const finite=(value:unknown,fallback:number)=>typeof value==='number'&&Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const uniqueStrings=(value:unknown,max:number)=>Array.isArray(value)
  ?[...new Set(value.filter((item):item is string=>typeof item==='string'&&item.length>0))].slice(0,max)
  :[];

export function emptyAdventureWorldState():AdventureWorldState{
  return {
    version:1,
    dawnreach:{
      visitedDiscoveries:[],
      lastPosition:null,
      echoSenseUnlocked:false,
      ruin:{
        stonePosition:{x:-51,z:-28},
        brazierLit:false,
        solved:false,
        rewardClaimed:false,
      },
      defeatedEnemyIds:[],
      hazards:{},
    },
  };
}

export function hydrateAdventureWorldState(raw:unknown):AdventureWorldState{
  const empty=emptyAdventureWorldState();
  if(!isRecord(raw))return empty;
  const dawn=isRecord(raw.dawnreach)?raw.dawnreach:{};
  const ruin=isRecord(dawn.ruin)?dawn.ruin:{};
  const stone=isRecord(ruin.stonePosition)?ruin.stonePosition:{};
  const last=isRecord(dawn.lastPosition)?dawn.lastPosition:null;
  const half=STARTING_FIELD.halfSize;
  const hazards:Record<string,DawnreachHazardSave>={};
  if(isRecord(dawn.hazards)){
    for(const [id,value] of Object.entries(dawn.hazards).slice(0,24)){
      if(!isRecord(value)||!id)continue;
      hazards[id]={
        burning:value.burning===true&&value.spent!==true,
        spent:value.spent===true,
        burnRemaining:clamp(finite(value.burnRemaining,0),0,12),
      };
    }
  }
  const solved=ruin.solved===true;
  const rewardClaimed=solved&&ruin.rewardClaimed===true;
  return {
    version:1,
    dawnreach:{
      visitedDiscoveries:uniqueStrings(dawn.visitedDiscoveries,STARTING_FIELD.discoveries.length+8),
      lastPosition:last?{
        x:clamp(finite(last.x,STARTING_FIELD.spawn.x),-half,half),
        z:clamp(finite(last.z,STARTING_FIELD.spawn.z),-half,half),
      }:null,
      echoSenseUnlocked:rewardClaimed&&dawn.echoSenseUnlocked===true,
      ruin:{
        stonePosition:{
          x:clamp(finite(stone.x,empty.dawnreach.ruin.stonePosition.x),-half,half),
          z:clamp(finite(stone.z,empty.dawnreach.ruin.stonePosition.z),-half,half),
        },
        brazierLit:ruin.brazierLit===true,
        solved,
        rewardClaimed,
      },
      defeatedEnemyIds:uniqueStrings(dawn.defeatedEnemyIds,16),
      hazards,
    },
  };
}

export function adventureWorldStateEqual(a:AdventureWorldState,b:AdventureWorldState){
  return JSON.stringify(a)===JSON.stringify(b);
}
