import { describe, expect, it } from 'vitest';
import { createBattleSession, type BattleSession, type TacticalUnit } from './tactical-battle';
import {
  campaignEncounterToTacticalScenario,
  resolveTacticalScenarioResult,
  type CampaignEncounterDefinition,
} from './tactical-scenario';

const unit=(id:string,side:'ally'|'enemy',hp=100,maxHp=100):TacticalUnit=>({
  id,side,position:'front',maxHp,hp,agility:10,ap:3,maxAp:3,mp:0,maxMp:10,shield:0,
});

function baseSession():BattleSession {
  return createBattleSession(
    [unit('runa','ally'),unit('companion-wolf','ally'),unit('companion-owl','ally')],
    [unit('target','enemy'),unit('enemy-2','enemy'),unit('enemy-3','enemy')],
    17,
  );
}

function scenario(failForward:boolean):ReturnType<typeof campaignEncounterToTacticalScenario> {
  const encounter:CampaignEncounterDefinition={
    id:'spring-caretaker-result',
    campaign:'caretaker',
    stageId:'forest-1',
    objective:{type:'protect',unitId:'runa'},
    modifiers:[],
    failForward,
  };
  return campaignEncounterToTacticalScenario(encounter);
}

describe('V3 Tactical fail-forward result contract',()=>{
  it('returns no result while the scenario is still active',()=>{
    expect(resolveTacticalScenarioResult(scenario(true),baseSession(),'attempt-1')).toBeNull();
  });

  it('returns combat facts only when a fail-forward scenario reaches terminal failure',()=>{
    const session=baseSession();
    session.units=session.units.map(entry=>entry.id==='runa'?{...entry,hp:0}:entry);
    const result=resolveTacticalScenarioResult(scenario(true),session,'attempt-1');

    expect(result).toEqual({
      scenarioId:'spring-caretaker-result',
      campaign:'caretaker',
      attemptKey:'attempt-1',
      terminalKey:'spring-caretaker-result:attempt-1',
      objectiveResult:'failure',
      battleResult:null,
      failForward:true,
      rounds:0,
      survivingAllies:2,
      damageTaken:100,
    });
    expect(result).not.toHaveProperty('story');
    expect(result).not.toHaveProperty('campaignState');
    expect(result).not.toHaveProperty('bondState');
    expect(result).not.toHaveProperty('characterBondState');
  });

  it('reports a normal engine victory without mutating the source scenario or session',()=>{
    const sourceScenario=scenario(false);
    const session=baseSession();
    const won={...session,round:4,units:session.units.map(entry=>entry.side==='enemy'?{...entry,hp:0}:entry)};
    const scenarioBefore=structuredClone(sourceScenario);
    const sessionBefore=structuredClone(won);

    const result=resolveTacticalScenarioResult(sourceScenario,won,'attempt-2');

    expect(result?.objectiveResult).toBe('success');
    expect(result?.battleResult).toBe('victory');
    expect(result?.rounds).toBe(3);
    expect(result?.survivingAllies).toBe(3);
    expect(sourceScenario).toEqual(scenarioBefore);
    expect(won).toEqual(sessionBefore);
  });

  it('is deterministic for the same terminal input and attempt key',()=>{
    const session=baseSession();
    session.units=session.units.map(entry=>entry.id==='runa'?{...entry,hp:0}:entry);
    expect(resolveTacticalScenarioResult(scenario(true),session,'attempt-9')).toEqual(
      resolveTacticalScenarioResult(scenario(true),session,'attempt-9'),
    );
  });

  it('rejects a blank attempt key so terminal handoff identity cannot collide',()=>{
    const session=baseSession();
    session.units=session.units.map(entry=>entry.id==='runa'?{...entry,hp:0}:entry);
    expect(()=>resolveTacticalScenarioResult(scenario(true),session,'   ')).toThrow('attempt key');
  });

  it('sanitizes corrupted runtime metrics instead of emitting NaN or Infinity',()=>{
    const session=baseSession();
    session.round=Number.POSITIVE_INFINITY;
    session.units=session.units.map(entry=>entry.id==='runa'
      ? {...entry,hp:0,maxHp:Number.POSITIVE_INFINITY}
      : entry.id==='companion-wolf'
        ? {...entry,hp:Number.NaN,maxHp:Number.NaN}
        : entry);
    const result=resolveTacticalScenarioResult(scenario(true),session,'attempt-corrupt');
    expect(result).not.toBeNull();
    for(const value of [result!.rounds,result!.survivingAllies,result!.damageTaken]) expect(Number.isFinite(value)).toBe(true);
  });
});
