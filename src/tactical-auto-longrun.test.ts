import { describe, expect, it } from 'vitest';
import { isBattleFinished, type BattleSession } from './tactical-battle';
import { chooseAutoCombinationUltimate, chooseTacticalEngineAction } from './tactical-ai';
import { tacticalActionHand } from './tactical-hand';
import { nextTacticalActor, resolveTacticalAction, skipTacticalTurnIfNoPlayableAction } from './tactical-engine';
import { createTacticalExpeditionBattle } from './tactical-expedition';
import { resolveCombinationUltimate } from './tactical-ultimate';

const progression={power:42,magic:32,agility:13,maxHp:150};
const party=['wolf','owl'] as const;
const bonds={wolf:5,owl:1} as const;
const stages=Array.from({length:16},(_,index)=>`next-wave-${index}`);

function fingerprint(session:BattleSession){
  return JSON.stringify({
    result:isBattleFinished(session),round:session.round,acted:session.acted,
    units:session.units.map(unit=>[unit.id,unit.hp,unit.maxHp,unit.ap,unit.maxAp,unit.mp,unit.maxMp,unit.shield,unit.statuses??[]]),
  });
}

function assertFiniteBattleState(session:BattleSession){
  for(const unit of session.units){
    for(const value of [unit.hp,unit.maxHp,unit.ap,unit.maxAp,unit.mp,unit.maxMp,unit.shield]) expect(Number.isFinite(value),`${unit.id} has non-finite state`).toBe(true);
    expect(unit.hp).toBeGreaterThanOrEqual(0);
    expect(unit.hp).toBeLessThanOrEqual(unit.maxHp);
    expect(unit.ap).toBeGreaterThanOrEqual(0);
    expect(unit.ap).toBeLessThanOrEqual(unit.maxAp);
    expect(unit.mp).toBeGreaterThanOrEqual(0);
    expect(unit.mp).toBeLessThanOrEqual(unit.maxMp);
  }
}

function autoStep(session:BattleSession){
  const actorId=nextTacticalActor(session);
  if(!actorId)return session;
  if(actorId==='runa'){
    const ultimate=chooseAutoCombinationUltimate(session,party,bonds);
    if(ultimate){
      const next=resolveCombinationUltimate(session,ultimate);
      if(next!==session)return next;
    }
  }
  const move=chooseTacticalEngineAction(session,actorId,session.seed+session.round+session.acted.length);
  if(move){
    const next=resolveTacticalAction(session,move);
    if(next!==session)return next;
  }
  return skipTacticalTurnIfNoPlayableAction(session,actorId,tacticalActionHand(session,actorId));
}

function run(seed:number,stageId:string){
  let session=createTacticalExpeditionBattle(stageId,party,progression,seed);
  let steps=0;
  while(!isBattleFinished(session)&&steps<192){
    const before=fingerprint(session);
    session=autoStep(session);
    expect(fingerprint(session),`${stageId} seed ${seed} stalled at ${steps}`).not.toBe(before);
    assertFiniteBattleState(session);
    steps+=1;
  }
  expect(isBattleFinished(session),`${stageId} seed ${seed} did not terminate`).not.toBeNull();
  expect(steps).toBeGreaterThan(0);
  expect(steps).toBeLessThan(192);
  return session;
}

describe('Tactical AUTO next-wave long-run stability',()=>{
  it('finishes 128 consecutive seeded battles without deadlock or non-finite state',()=>{
    let finished=0;
    for(let seed=1;seed<=128;seed+=1){
      run(seed,stages[(seed-1)%stages.length]);
      finished+=1;
    }
    expect(finished).toBe(128);
  });

  it('replays representative long-run seeds with identical final state',()=>{
    for(const seed of [1,32,64,96,128]){
      const stageId=stages[(seed-1)%stages.length];
      expect(fingerprint(run(seed,stageId))).toBe(fingerprint(run(seed,stageId)));
    }
  });
});