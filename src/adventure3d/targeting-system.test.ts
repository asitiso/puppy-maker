import {describe,expect,it} from 'vitest';
import {LOCK_ON_BREAK_DISTANCE,cycleLockOnTarget,lockedTargetStillValid,selectLockOnTarget,smoothLockOnYaw,targetCandidates,yawToTarget} from './targeting-system';
import type {AdventureEnemyState} from './enemy-ai';

const enemy=(id:string,x:number,z:number,patch:Partial<AdventureEnemyState>={}):AdventureEnemyState=>({
  id,label:id,archetype:'rusher',
  position:{x,y:0,z},
  home:{x,y:0,z},
  patrol:[{x,y:0,z}],
  patrolIndex:0,
  hp:42,maxHp:42,
  mode:'patrol',
  timer:0,
  facingYaw:0,
  lastHitAttackSerial:-1,
  ...patch,
});

describe('V18 combat targeting system',()=>{
  it('locks the nearest useful target in the camera-facing field instead of behind the player',()=>{
    const enemies=[
      enemy('near-front',1,-8),
      enemy('far-front',-2,-16),
      enemy('behind',0,5),
    ];
    const candidates=targetCandidates(enemies,{x:0,y:0,z:0},0);
    expect(candidates.map(entry=>entry.enemy.id)).toContain('near-front');
    expect(candidates.map(entry=>entry.enemy.id)).not.toContain('behind');
    expect(selectLockOnTarget(enemies,{x:0,y:0,z:0},0)?.id).toBe('near-front');
  });

  it('ignores defeated targets and breaks lock when the target escapes far away',()=>{
    const dead=enemy('dead',0,-6,{hp:0,mode:'defeated'});
    expect(selectLockOnTarget([dead],{x:0,y:0,z:0},0)).toBeNull();
    const far=enemy('far',0,-LOCK_ON_BREAK_DISTANCE-1);
    expect(lockedTargetStillValid(far,{x:0,y:0,z:0})).toBe(false);
  });

  it('cycles among live candidates without inventing targets',()=>{
    const enemies=[enemy('left',-5,-10),enemy('center',0,-8),enemy('right',5,-10)];
    const first=selectLockOnTarget(enemies,{x:0,y:0,z:0},0)!;
    const next=cycleLockOnTarget(enemies,{x:0,y:0,z:0},0,first.id);
    expect(next).not.toBeNull();
    expect(next?.id).not.toBe(first.id);
    expect(enemies.some(item=>item.id===next?.id)).toBe(true);
  });

  it('smoothly turns the camera toward a locked target instead of snapping',()=>{
    const player={x:0,y:0,z:0};
    const target={x:10,y:0,z:0};
    const desired=yawToTarget(player,target);
    const stepped=smoothLockOnYaw(0,player,target,.016);
    expect(desired).toBeCloseTo(Math.PI/2,5);
    expect(stepped).toBeGreaterThan(0);
    expect(stepped).toBeLessThan(desired);
  });

  it('uses the shortest angular path across the plus/minus pi seam',()=>{
    const player={x:0,y:0,z:0};
    const target={x:-.1,y:0,z:10};
    const current=Math.PI-.03;
    const stepped=smoothLockOnYaw(current,player,target,.016);
    expect(Math.abs(stepped-current)).toBeLessThan(.2);
  });
});
