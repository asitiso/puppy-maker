import {describe,expect,it} from 'vitest';
import {
  DEFAULT_PLAYER_COMBAT,
  PLAYER_ATTACK_ACTIVE_START,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_DODGE_STAMINA,
  PLAYER_COUNTER_DAMAGE,
  applyDodgeMotion,
  applyPlayerDamage,
  playerAttackConnects,
  playerAttackDamage,
  playerAttackIsCounter,
  playerAttackWindowOpen,
  resolveEnemyAttack,
  stepPlayerCombat,
  tryStartPlayerAttack,
  tryStartPlayerDodge,
} from './combat-system';
import {DEFAULT_PLAYER_STATE} from './player-controller';

const flat=()=>0;

describe('V18 realtime combat system',()=>{
  it('gives attacks a windup before the active hit window',()=>{
    let combat=tryStartPlayerAttack(DEFAULT_PLAYER_COMBAT);
    expect(combat.attackSerial).toBe(1);
    expect(playerAttackWindowOpen(combat)).toBe(false);
    for(let frame=0;frame<3;frame++)combat=stepPlayerCombat(combat,.05);
    expect(combat.attackClock).toBeGreaterThan(PLAYER_ATTACK_ACTIVE_START);
    expect(playerAttackWindowOpen(combat)).toBe(true);
  });

  it('requires facing and range instead of auto-hitting nearby enemies',()=>{
    const player={x:0,y:0,z:0};
    expect(playerAttackConnects(player,0,{x:0,y:0,z:-2})).toBe(true);
    expect(playerAttackConnects(player,0,{x:0,y:0,z:2})).toBe(false);
    expect(playerAttackConnects(player,0,{x:0,y:0,z:-8})).toBe(false);
  });

  it('spends stamina for a dodge and grants a short invulnerability window',()=>{
    const result=tryStartPlayerDodge(DEFAULT_PLAYER_COMBAT,100,{x:1,z:0},0);
    expect(result.started).toBe(true);
    expect(result.stamina).toBe(100-PLAYER_DODGE_STAMINA);
    expect(result.state.invulnerability).toBeGreaterThan(0);
    const hit=applyPlayerDamage(result.state,30);
    expect(hit.damaged).toBe(false);
    expect(hit.state.hp).toBe(100);
  });

  it('turns an early dodge through an enemy strike into one counter opportunity',()=>{
    let combat=tryStartPlayerDodge(DEFAULT_PLAYER_COMBAT,100,{x:1,z:0},0).state;
    combat=stepPlayerCombat(combat,.05);
    const evaded=resolveEnemyAttack(combat,30);
    expect(evaded.damaged).toBe(false);
    expect(evaded.perfectDodged).toBe(true);
    expect(evaded.state.counterWindow).toBeGreaterThan(0);

    combat=tryStartPlayerAttack(evaded.state);
    expect(playerAttackIsCounter(combat)).toBe(true);
    expect(playerAttackDamage(combat)).toBe(PLAYER_COUNTER_DAMAGE);
    expect(combat.counterWindow).toBe(0);

    combat=stepPlayerCombat(combat,.5);
    combat=tryStartPlayerAttack(combat);
    expect(playerAttackIsCounter(combat)).toBe(false);
    expect(playerAttackDamage(combat)).toBe(PLAYER_ATTACK_DAMAGE);
  });

  it('does not award a counter to a late invulnerability dodge',()=>{
    let combat=tryStartPlayerDodge(DEFAULT_PLAYER_COMBAT,100,{x:1,z:0},0).state;
    combat=stepPlayerCombat(combat,.2);
    const evaded=resolveEnemyAttack(combat,30);
    expect(evaded.damaged).toBe(false);
    expect(evaded.perfectDodged).toBe(false);
    expect(evaded.state.counterWindow).toBe(0);
  });

  it('moves a dodge as a burst instead of a stat-only defense',()=>{
    const dodge=tryStartPlayerDodge(DEFAULT_PLAYER_COMBAT,100,{x:1,z:0},0);
    const moved=applyDodgeMotion(
      {...DEFAULT_PLAYER_STATE,position:{x:0,y:0,z:0}},
      dodge.state,
      .05,
      flat,
      100,
    );
    expect(moved.position.x).toBeGreaterThan(.5);
    expect(Math.abs(moved.position.z)).toBeLessThan(.01);
  });

  it('turns a real enemy hit into hp loss and hit reaction',()=>{
    const hit=applyPlayerDamage(DEFAULT_PLAYER_COMBAT,PLAYER_ATTACK_DAMAGE);
    expect(hit.damaged).toBe(true);
    expect(hit.state.hp).toBe(82);
    expect(hit.state.hitstun).toBeGreaterThan(0);
    expect(hit.state.invulnerability).toBeGreaterThan(0);
  });
});
