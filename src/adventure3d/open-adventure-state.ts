import {isValidDawnreachWorldEventResolution,type DawnreachWorldEventId,type DawnreachWorldEventOutcome} from './world-events';
import {isWindwalkTraceId,type WindwalkTraceId} from './windwalk-routes';

export const dawnreachDiscoveryIds=[
  'skywatch','echo-ruins','ember-camp','fallen-cart','wind-crystal','stone-switch','hollow-cave','herb-ring','old-bridge',
] as const;

export type DawnreachDiscoveryId=typeof dawnreachDiscoveryIds[number];
export type PersistentPlanarPosition={x:number;z:number};

export type DawnreachRuinProgress={
  stonePosition:PersistentPlanarPosition|null;
  brazierLit:boolean;
  solved:boolean;
  rewardClaimed:boolean;
};

export type DawnreachWorldEventResolution={id:DawnreachWorldEventId;outcome:DawnreachWorldEventOutcome};
export type DawnreachHollowCaveProgress={shortcutOpen:boolean};
export type DawnreachSkybreakProgress={beaconReached:boolean;windwalkTraces:WindwalkTraceId[]};

export type DawnreachAdventureProgress={
  discoveredIds:DawnreachDiscoveryId[];
  echoSenseUnlocked:boolean;
  campCleared:boolean;
  worldEvents:DawnreachWorldEventResolution[];
  hollowCave:DawnreachHollowCaveProgress;
  skybreak:DawnreachSkybreakProgress;
  ruin:DawnreachRuinProgress;
};

export type OpenAdventureState={
  dawnreach:DawnreachAdventureProgress;
};

export type OpenAdventureUpdate=
  |{type:'discover';id:DawnreachDiscoveryId}
  |{type:'sync-ruin';stonePosition?:PersistentPlanarPosition|null;brazierLit?:boolean;solved?:boolean;rewardClaimed?:boolean}
  |{type:'unlock-echo-sense'}
  |{type:'open-hollow-shortcut'}
  |{type:'reach-skybreak-beacon'}
  |{type:'discover-windwalk-trace';id:WindwalkTraceId}
  |{type:'clear-camp'}
  |{type:'resolve-world-event';id:DawnreachWorldEventId;outcome:DawnreachWorldEventOutcome};

const discoverySet=new Set<string>(dawnreachDiscoveryIds);
export const isDawnreachDiscoveryId=(value:string):value is DawnreachDiscoveryId=>discoverySet.has(value);
const isRecord=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export function emptyOpenAdventureState():OpenAdventureState{
  return {
    dawnreach:{
      discoveredIds:[],
      echoSenseUnlocked:false,
      campCleared:false,
      worldEvents:[],
      hollowCave:{shortcutOpen:false},
      skybreak:{beaconReached:false,windwalkTraces:[]},
      ruin:{
        stonePosition:null,
        brazierLit:false,
        solved:false,
        rewardClaimed:false,
      },
    },
  };
}

function hydrateWorldEvents(raw:unknown):DawnreachWorldEventResolution[]{
  if(!Array.isArray(raw))return [];
  const result:DawnreachWorldEventResolution[]=[];
  for(const entry of raw){
    if(!isRecord(entry)||typeof entry.id!=='string'||typeof entry.outcome!=='string')continue;
    if(!isValidDawnreachWorldEventResolution(entry.id,entry.outcome))continue;
    if(result.some(item=>item.id===entry.id))continue;
    result.push({id:entry.id as DawnreachWorldEventId,outcome:entry.outcome as DawnreachWorldEventOutcome});
  }
  return result;
}

function hydratePosition(raw:unknown):PersistentPlanarPosition|null{
  if(!isRecord(raw)||typeof raw.x!=='number'||!Number.isFinite(raw.x)||typeof raw.z!=='number'||!Number.isFinite(raw.z))return null;
  return {x:clamp(raw.x,-140,140),z:clamp(raw.z,-140,140)};
}

export function hydrateOpenAdventureState(raw:unknown):OpenAdventureState{
  const source=isRecord(raw)?raw:{};
  const dawnreach=isRecord(source.dawnreach)?source.dawnreach:{};
  const ruin=isRecord(dawnreach.ruin)?dawnreach.ruin:{};
  const discoveredIds=Array.isArray(dawnreach.discoveredIds)
    ?dawnreach.discoveredIds.filter((value):value is DawnreachDiscoveryId=>typeof value==='string'&&discoverySet.has(value)).filter((value,index,list)=>list.indexOf(value)===index)
    :[];
  const hollowCave=isRecord(dawnreach.hollowCave)?dawnreach.hollowCave:{};
  const skybreak=isRecord(dawnreach.skybreak)?dawnreach.skybreak:{};
  const shortcutOpen=hollowCave.shortcutOpen===true;
  const beaconReached=skybreak.beaconReached===true;
  const windwalkTraces=beaconReached&&Array.isArray(skybreak.windwalkTraces)
    ?skybreak.windwalkTraces.filter((value):value is WindwalkTraceId=>typeof value==='string'&&isWindwalkTraceId(value)).filter((value,index,list)=>list.indexOf(value)===index)
    :[];
  if(shortcutOpen&&!discoveredIds.includes('hollow-cave'))discoveredIds.push('hollow-cave');
  const rewardClaimed=ruin.rewardClaimed===true;
  const solved=rewardClaimed||ruin.solved===true;
  const echoSenseUnlocked=rewardClaimed||dawnreach.echoSenseUnlocked===true;
  return {
    dawnreach:{
      discoveredIds,
      echoSenseUnlocked,
      campCleared:dawnreach.campCleared===true,
      worldEvents:hydrateWorldEvents(dawnreach.worldEvents),
      hollowCave:{shortcutOpen},
      skybreak:{beaconReached,windwalkTraces},
      ruin:{
        stonePosition:hydratePosition(ruin.stonePosition),
        brazierLit:ruin.brazierLit===true,
        solved,
        rewardClaimed,
      },
    },
  };
}

export function applyOpenAdventureUpdate(
  state:OpenAdventureState,
  update:OpenAdventureUpdate,
):OpenAdventureState{
  const current=state;
  const dawnreach=current.dawnreach;

  if(update.type==='discover'){
    if(dawnreach.discoveredIds.includes(update.id))return current;
    return {...current,dawnreach:{...dawnreach,discoveredIds:[...dawnreach.discoveredIds,update.id]}};
  }

  if(update.type==='resolve-world-event'){
    if(!isValidDawnreachWorldEventResolution(update.id,update.outcome))return current;
    if(dawnreach.worldEvents.some(event=>event.id===update.id))return current;
    return {...current,dawnreach:{...dawnreach,worldEvents:[...dawnreach.worldEvents,{id:update.id,outcome:update.outcome}]}};
  }

  if(update.type==='unlock-echo-sense'){
    if(dawnreach.echoSenseUnlocked)return current;
    return {...current,dawnreach:{...dawnreach,echoSenseUnlocked:true}};
  }

  if(update.type==='open-hollow-shortcut'){
    if(dawnreach.hollowCave.shortcutOpen)return current;
    const discoveredIds=dawnreach.discoveredIds.includes('hollow-cave')
      ?dawnreach.discoveredIds
      :[...dawnreach.discoveredIds,'hollow-cave' as DawnreachDiscoveryId];
    return {
      ...current,
      dawnreach:{
        ...dawnreach,
        discoveredIds,
        hollowCave:{shortcutOpen:true},
      },
    };
  }

  if(update.type==='reach-skybreak-beacon'){
    if(dawnreach.skybreak.beaconReached)return current;
    return {...current,dawnreach:{...dawnreach,skybreak:{...dawnreach.skybreak,beaconReached:true}}};
  }

  if(update.type==='discover-windwalk-trace'){
    if(!dawnreach.skybreak.beaconReached||dawnreach.skybreak.windwalkTraces.includes(update.id))return current;
    return {
      ...current,
      dawnreach:{
        ...dawnreach,
        skybreak:{
          ...dawnreach.skybreak,
          windwalkTraces:[...dawnreach.skybreak.windwalkTraces,update.id],
        },
      },
    };
  }

  if(update.type==='clear-camp'){
    if(dawnreach.campCleared)return current;
    return {...current,dawnreach:{...dawnreach,campCleared:true}};
  }

  const previous= dawnreach.ruin;
  const position=update.stonePosition===undefined
    ?previous.stonePosition
    :hydratePosition(update.stonePosition);
  const rewardClaimed=previous.rewardClaimed||update.rewardClaimed===true;
  const solved=previous.solved||update.solved===true||rewardClaimed;
  const brazierLit=previous.brazierLit||update.brazierLit===true;
  const ruin:DawnreachRuinProgress={stonePosition:position,brazierLit,solved,rewardClaimed};
  const echoSenseUnlocked=dawnreach.echoSenseUnlocked||rewardClaimed;
  if(
    previous.stonePosition?.x===ruin.stonePosition?.x&&
    previous.stonePosition?.z===ruin.stonePosition?.z&&
    previous.brazierLit===ruin.brazierLit&&
    previous.solved===ruin.solved&&
    previous.rewardClaimed===ruin.rewardClaimed&&
    dawnreach.echoSenseUnlocked===echoSenseUnlocked
  )return current;
  return {...current,dawnreach:{...dawnreach,echoSenseUnlocked,ruin}};
}
