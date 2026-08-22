import { describe, expect, it } from 'vitest';
import { createBattleSession, type BattleSession, type TacticalUnit } from './tactical-battle';
import { tacticalBattleNodeForStage } from './tactical-expedition';
import {
  campaignEncounterToTacticalScenario,
  evaluateTacticalScenarioObjective,
  type CampaignEncounterDefinition,
  type TacticalScenarioObjective,
} from './tactical-scenario';

const unit=(id:string,side:'ally'|'enemy',hp=100):TacticalUnit=>({
  id,side,position:'front',maxHp:100,hp,agility:10,ap:3,maxAp:3,mp:0,maxMp:10,shield:0,
});

function session():BattleSession {
  return createBattleSession(
    [unit('runa','ally'),unit('escort','ally'),unit('ally-3','ally')],
    [unit('target','enemy'),unit('enemy-2','enemy'),unit('enemy-3','enemy')],
    41,
  );
}

function scenarioFor(objective:TacticalScenarioObjective) {
  return campaignEncounterToTacticalScenario({
    id:`scenario-${objective.type}`,
    campaign:'caretaker',
    stageId:'forest-1',
    objective,
    modifiers:[],
    failForward:false,
  });
}

describe('V3 Tactical scenario adapter', () => {
  it('compiles a campaign encounter onto the existing Tactical battle node contract', () => {
    const encounter:CampaignEncounterDefinition = {
      id:'spring-caretaker-standard',
      campaign:'caretaker',
      stageId:'forest-1',
      objective:{type:'standard'},
      modifiers:[],
      failForward:false,
    };

    const scenario = campaignEncounterToTacticalScenario(encounter);

    expect(scenario).toEqual({
      id:'spring-caretaker-standard',
      campaign:'caretaker',
      stageId:'forest-1',
      battleNode:tacticalBattleNodeForStage('forest-1'),
      objective:{type:'standard'},
      modifiers:[],
      failForward:false,
    });
  });

  it('evaluates standard victory without replacing the existing battle result', () => {
    const active=session();
    expect(evaluateTacticalScenarioObjective(scenarioFor({type:'standard'}),active)).toBeNull();
    const won={...active,units:active.units.map(entry=>entry.side==='enemy'?{...entry,hp:0}:entry)};
    expect(evaluateTacticalScenarioObjective(scenarioFor({type:'standard'}),won)).toBe('success');
  });

  it('fails protect immediately when the protected ally is down and succeeds only after victory with it alive', () => {
    const active=session();
    const protect=scenarioFor({type:'protect',unitId:'escort'});
    const failed={...active,units:active.units.map(entry=>entry.id==='escort'?{...entry,hp:0}:entry)};
    expect(evaluateTacticalScenarioObjective(protect,failed)).toBe('failure');
    const won={...active,units:active.units.map(entry=>entry.side==='enemy'?{...entry,hp:0}:entry)};
    expect(evaluateTacticalScenarioObjective(protect,won)).toBe('success');
  });

  it('uses completed rounds for survive so round one is not counted as already survived', () => {
    const survive=scenarioFor({type:'survive',rounds:3});
    expect(evaluateTacticalScenarioObjective(survive,{...session(),round:3})).toBeNull();
    expect(evaluateTacticalScenarioObjective(survive,{...session(),round:4})).toBe('success');
    const lost=session();
    lost.units=lost.units.map(entry=>entry.side==='ally'?{...entry,hp:0}:entry);
    expect(evaluateTacticalScenarioObjective(survive,{...lost,round:3})).toBe('failure');
  });

  it('opens escape only after the required completed rounds and fails if the party is wiped first', () => {
    const escape=scenarioFor({type:'escape',afterRounds:2});
    expect(evaluateTacticalScenarioObjective(escape,{...session(),round:2})).toBeNull();
    expect(evaluateTacticalScenarioObjective(escape,{...session(),round:3})).toBe('success');
    const lost=session();
    lost.units=lost.units.map(entry=>entry.side==='ally'?{...entry,hp:0}:entry);
    expect(evaluateTacticalScenarioObjective(escape,{...lost,round:2})).toBe('failure');
  });

  it('ends target-elimination when the named target dies even if other enemies remain', () => {
    const targetScenario=scenarioFor({type:'target-elimination',targetId:'target'});
    const active=session();
    expect(evaluateTacticalScenarioObjective(targetScenario,active)).toBeNull();
    const eliminated={...active,units:active.units.map(entry=>entry.id==='target'?{...entry,hp:0}:entry)};
    expect(evaluateTacticalScenarioObjective(targetScenario,eliminated)).toBe('success');
    expect(eliminated.units.some(entry=>entry.side==='enemy'&&entry.hp>0)).toBe(true);
  });
});
