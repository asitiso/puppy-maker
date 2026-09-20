import {startingFieldHeight} from './starting-field';
import type {PlayerMotionState,Vec3} from './types';

export const windwalkTraceIds=['sky-thread','ruin-crown','west-aerie'] as const;
export type WindwalkTraceId=typeof windwalkTraceIds[number];

export const WINDWALK_ROUTE={
  currentRadius:6,
  currentHeight:10,
  restoredCurrentRadius:8,
  restoredCurrentHeight:12,
  traceRadius:3.4,
  liftSpeed:6.4,
  restoredLiftSpeed:8,
  currents:[
    {id:'skywatch-current',x:-6,z:-55},
    {id:'ruin-current',x:-29,z:-42},
    {id:'ridge-current',x:-52,z:-27},
  ],
  traces:[
    {id:'sky-thread' as const,label:'하늘실 매듭',x:-17,z:-49,height:7.5},
    {id:'ruin-crown' as const,label:'폐허 위 바람문양',x:-40,z:-35,height:8},
    {id:'west-aerie' as const,label:'서쪽 능선 깃표식',x:-65,z:-16,height:7},
  ],
};

export type WindwalkRouteVisual={
  currents:readonly {id:string;position:Vec3;active:boolean}[];
  traces:readonly {id:WindwalkTraceId;label:string;position:Vec3;collected:boolean}[];
  mastered:boolean;
  restored:boolean;
  currentHeight:number;
};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const planarDistance=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.z-b.z);
const distance3=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

const routePoint=(x:number,z:number,height=0):Vec3=>({
  x,
  y:startingFieldHeight(x,z)+height,
  z,
});

export function windwalkCurrentPositions(){
  return WINDWALK_ROUTE.currents.map(current=>({
    ...current,
    position:routePoint(current.x,current.z,1.2),
  }));
}

export function windwalkTracePositions(){
  return WINDWALK_ROUTE.traces.map(trace=>({
    ...trace,
    position:routePoint(trace.x,trace.z,trace.height),
  }));
}

export function isWindwalkTraceId(value:string):value is WindwalkTraceId{
  return (windwalkTraceIds as readonly string[]).includes(value);
}

export function windwalkRouteMastered(discovered:Iterable<WindwalkTraceId>){
  return new Set(discovered).size===windwalkTraceIds.length;
}

export function applyWindwalkCurrent(
  state:PlayerMotionState,
  held:boolean,
  unlocked:boolean,
  dtRaw:number,
  restored=false,
):{state:PlayerMotionState;boostedCurrentId:string|null}{
  if(!unlocked||!held||state.grounded||state.stamina<=.5){
    return {state,boostedCurrentId:null};
  }
  const radius=restored?WINDWALK_ROUTE.restoredCurrentRadius:WINDWALK_ROUTE.currentRadius;
  const height=restored?WINDWALK_ROUTE.restoredCurrentHeight:WINDWALK_ROUTE.currentHeight;
  const current=windwalkCurrentPositions().find(item=>
    planarDistance(state.position,item.position)<=radius&&
    state.position.y>=item.position.y-1.5&&
    state.position.y<=item.position.y+height
  );
  if(!current)return {state,boostedCurrentId:null};
  const dt=clamp(Number.isFinite(dtRaw)?dtRaw:0,0,.05);
  if(dt<=0)return {state,boostedCurrentId:null};
  return {
    state:{
      ...state,
      velocity:{
        ...state.velocity,
        y:Math.max(state.velocity.y,restored?WINDWALK_ROUTE.restoredLiftSpeed:WINDWALK_ROUTE.liftSpeed),
      },
    },
    boostedCurrentId:current.id,
  };
}

export function findWindwalkTrace(
  player:PlayerMotionState,
  discovered:ReadonlySet<WindwalkTraceId>,
  unlocked:boolean,
):WindwalkTraceId|null{
  if(!unlocked||player.grounded)return null;
  for(const trace of windwalkTracePositions()){
    if(discovered.has(trace.id))continue;
    if(distance3(player.position,trace.position)<=WINDWALK_ROUTE.traceRadius)return trace.id;
  }
  return null;
}

export function windwalkRouteVisual(
  unlocked:boolean,
  discovered:ReadonlySet<WindwalkTraceId>,
  boostedCurrentId:string|null,
  restored=false,
):WindwalkRouteVisual|null{
  if(!unlocked)return null;
  return {
    currents:windwalkCurrentPositions().map(current=>({
      id:current.id,
      position:current.position,
      active:current.id===boostedCurrentId,
    })),
    traces:windwalkTracePositions().map(trace=>({
      id:trace.id,
      label:trace.label,
      position:trace.position,
      collected:discovered.has(trace.id),
    })),
    mastered:windwalkRouteMastered(discovered),
    restored,
    currentHeight:restored?WINDWALK_ROUTE.restoredCurrentHeight:WINDWALK_ROUTE.currentHeight,
  };
}
