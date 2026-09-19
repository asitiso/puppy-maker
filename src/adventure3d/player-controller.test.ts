import {describe,expect,it} from 'vitest';
import {cameraRelativeMove,DEFAULT_PLAYER_STATE,stepPlayerMotion} from './player-controller';

const flat=()=>0;

describe('V18 open adventure player controller',()=>{
  it('accelerates instead of teleporting to full speed and brakes on release',()=>{
    const first=stepPlayerMotion(DEFAULT_PLAYER_STATE,{moveX:0,moveZ:-1,sprint:false,jump:false},.05,flat,100);
    expect(Math.abs(first.velocity.z)).toBeGreaterThan(0);
    expect(Math.abs(first.velocity.z)).toBeLessThan(5.4);
    const stopped=stepPlayerMotion(first,{moveX:0,moveZ:0,sprint:false,jump:false},.05,flat,100);
    expect(Math.abs(stopped.velocity.z)).toBeLessThan(Math.abs(first.velocity.z));
  });

  it('makes sprint a real movement tradeoff by consuming stamina',()=>{
    let walk={...DEFAULT_PLAYER_STATE,position:{x:0,y:0,z:0}};
    let sprint={...DEFAULT_PLAYER_STATE,position:{x:0,y:0,z:0}};
    for(let i=0;i<20;i++){
      walk=stepPlayerMotion(walk,{moveX:0,moveZ:-1,sprint:false,jump:false},.05,flat,100);
      sprint=stepPlayerMotion(sprint,{moveX:0,moveZ:-1,sprint:true,jump:false},.05,flat,100);
    }
    expect(Math.abs(sprint.position.z)).toBeGreaterThan(Math.abs(walk.position.z));
    expect(sprint.stamina).toBeLessThan(walk.stamina);
  });

  it('supports jump, gravity and grounded landing',()=>{
    let state={...DEFAULT_PLAYER_STATE,position:{x:0,y:0,z:0}};
    state=stepPlayerMotion(state,{moveX:0,moveZ:0,sprint:false,jump:true},.016,flat,100);
    expect(state.grounded).toBe(false);
    expect(state.velocity.y).toBeGreaterThan(0);
    for(let i=0;i<100;i++)state=stepPlayerMotion(state,{moveX:0,moveZ:0,sprint:false,jump:false},.016,flat,100);
    expect(state.grounded).toBe(true);
    expect(state.position.y).toBe(0);
  });

  it('maps forward input through camera yaw for free camera exploration',()=>{
    const north=cameraRelativeMove(0,1,0);
    expect(north.x).toBeCloseTo(0,5);
    expect(north.z).toBeLessThan(-.99);
    const east=cameraRelativeMove(0,1,Math.PI/2);
    expect(east.x).toBeGreaterThan(.99);
    expect(Math.abs(east.z)).toBeLessThan(.01);
  });

  it('keeps the player inside authored field bounds',()=>{
    const state={...DEFAULT_PLAYER_STATE,position:{x:99.9,y:0,z:99.9},velocity:{x:20,y:0,z:20}};
    const next=stepPlayerMotion(state,{moveX:1,moveZ:1,sprint:true,jump:false},.05,flat,100);
    expect(next.position.x).toBeLessThanOrEqual(100);
    expect(next.position.z).toBeLessThanOrEqual(100);
  });
});
