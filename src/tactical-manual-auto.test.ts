import {describe,expect,it} from 'vitest';
import {isBattleFinished,type BattleSession} from './tactical-battle';
import {chooseAutoCombinationUltimate,chooseTacticalEngineAction} from './tactical-ai';
import {tacticalActionHand} from './tactical-hand';
import {validTacticalTargets} from './tactical-actions';
import {nextTacticalActor,resolveTacticalAction,skipTacticalTurnIfNoPlayableAction} from './tactical-engine';
import {createTacticalExpeditionBattle} from './tactical-expedition';
import {resolveCombinationUltimate,validCombinationUltimateTargets} from './tactical-ultimate';

const progression={power:42,magic:32,agility:13,maxHp:150};
const party=['wolf','owl'] as const;
const bonds={wolf:5,owl:1} as const;

function fingerprint(session:BattleSession){
  return JSON.stringify({
    result:isBattleFinished(session),round:session.round,acted:session.acted,
    units:session.units.map(unit=>[unit.id,unit.hp,unit.ap,unit.mp,unit.shield,unit.statuses??[]]),
  });
}

function manualStep(session:BattleSession){
  const actorId=nextTacticalActor(session);
  if(!actorId)return session;
  if(actorId==='runa'){
    for(const companionId of party){
      const bondLevel=bonds[companionId]??1;
      const targets=validCombinationUltimateTargets(session,actorId,companionId,bondLevel);
      if(targets.length){
        const next=resolveCombinationUltimate(session,{actorId,companionId,bondLevel,targetId:targets[0]});
        if(next!==session)return next;
      }
    }
  }
  const hand=tacticalActionHand(session,actorId);
  for(const actionId of hand){
    const targets=validTacticalTargets(session,actorId,actionId);
    if(!targets.length)continue;
    const next=resolveTacticalAction(session,{actorId,actionId,targetId:targets[0]});
    if(next!==session)return next;
  }
  return skipTacticalTurnIfNoPlayableAction(session,actorId,hand);
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

function run(mode:'manual'|'auto',seed:number){
  let session=createTacticalExpeditionBattle('city_gate',party,progression,seed);
  let steps=0;
  while(!isBattleFinished(session)&&steps<160){
    const before=fingerprint(session);
    session=mode==='manual'?manualStep(session):autoStep(session);
    expect(fingerprint(session),`${mode} seed ${seed} stalled at ${steps}`).not.toBe(before);
    steps+=1;
  }
  expect(isBattleFinished(session),`${mode} seed ${seed} did not terminate`).not.toBeNull();
  expect(steps).toBeLessThan(160);
  return {session,steps};
}

describe('manual versus AUTO tactical stability',()=>{
  it('terminates both control modes across the same 25 seeded battles',()=>{
    for(let seed=1;seed<=25;seed+=1){
      const manual=run('manual',seed);
      const auto=run('auto',seed);
      expect(manual.steps).toBeGreaterThan(0);
      expect(auto.steps).toBeGreaterThan(0);
    }
  });

  it('keeps each control mode deterministic for representative seeds',()=>{
    for(const seed of [1,7,13,25]){
      expect(fingerprint(run('manual',seed).session)).toBe(fingerprint(run('manual',seed).session));
      expect(fingerprint(run('auto',seed).session)).toBe(fingerprint(run('auto',seed).session));
    }
  });

  it('preserves real decision diversity instead of making manual and AUTO identical',()=>{
    let distinct=0;
    for(let seed=1;seed<=25;seed+=1){
      const manual=run('manual',seed);
      const auto=run('auto',seed);
      if(fingerprint(manual.session)!==fingerprint(auto.session)||manual.steps!==auto.steps)distinct+=1;
    }
    expect(distinct).toBeGreaterThan(0);
  });
});
