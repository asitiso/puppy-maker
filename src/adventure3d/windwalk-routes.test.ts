import {describe,expect,it} from 'vitest';
import {
  WINDWALK_ROUTE,
  applyWindwalkCurrent,
  findWindwalkTrace,
  windwalkRouteMastered,
  windwalkTraceIds,
  windwalkCurrentPositions,
  windwalkTracePositions,
} from './windwalk-routes';
import type {PlayerMotionState} from './types';

const airborne=(x:number,y:number,z:number):PlayerMotionState=>({
  position:{x,y,z},
  velocity:{x:0,y:-3,z:-4},
  grounded:false,
  stamina:80,
  facingYaw:0,
});

describe('V18 Windwalk re-exploration route',()=>{
  it('defines three chained air discoveries',()=>{
    expect(windwalkTraceIds).toHaveLength(3);
    expect(WINDWALK_ROUTE.currents).toHaveLength(3);
    expect(windwalkTracePositions().every(trace=>trace.position.y>0)).toBe(true);
  });

  it('lets an unlocked airborne glider ride an updraft but not a grounded player',()=>{
    const current=WINDWALK_ROUTE.currents[0];
    const air=airborne(current.x,6,current.z);
    const boosted=applyWindwalkCurrent(air,true,true,.05);
    expect(boosted.boostedCurrentId).toBe(current.id);
    expect(boosted.state.velocity.y).toBe(WINDWALK_ROUTE.liftSpeed);
    expect(applyWindwalkCurrent({...air,grounded:true},true,true,.05).boostedCurrentId).toBeNull();
    expect(applyWindwalkCurrent(air,true,false,.05).boostedCurrentId).toBeNull();
  });

  it('caps each updraft so holding glide cannot create infinite flight',()=>{
    const current=windwalkCurrentPositions()[0];
    const above=airborne(
      current.position.x,
      current.position.y+WINDWALK_ROUTE.currentHeight+1,
      current.position.z,
    );
    expect(applyWindwalkCurrent(above,true,true,.05).boostedCurrentId).toBeNull();
  });

  it('requires physically passing through an aerial trace and never collects it from the ground',()=>{
    const trace=windwalkTracePositions()[0];
    const discovered=new Set<typeof windwalkTraceIds[number]>();
    expect(findWindwalkTrace(airborne(trace.position.x,trace.position.y,trace.position.z),discovered,true)).toBe(trace.id);
    expect(findWindwalkTrace({...airborne(trace.position.x,trace.position.y,trace.position.z),grounded:true},discovered,true)).toBeNull();
    discovered.add(trace.id);
    expect(findWindwalkTrace(airborne(trace.position.x,trace.position.y,trace.position.z),discovered,true)).toBeNull();
  });

  it('derives mastery only after all three traces are found',()=>{
    expect(windwalkRouteMastered([])).toBe(false);
    expect(windwalkRouteMastered(windwalkTraceIds.slice(0,2))).toBe(false);
    expect(windwalkRouteMastered([...windwalkTraceIds])).toBe(true);
  });
});
