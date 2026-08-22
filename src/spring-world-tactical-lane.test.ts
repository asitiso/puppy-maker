import { describe, expect, it } from 'vitest';
import { campaignWorldObjectives, resolveGuardianFestivalWorldOutcome } from './campaign-world';
import {
  createTacticalScenarioBattle,
  createTacticalTerminalHandoffState,
  handoffTacticalTerminalResult,
  invokeTacticalBondIntervention,
  resolveTacticalScenarioResult,
} from './tactical-scenario';
import {
  mapTacticalResultToGuardianFestivalOutcome,
  worldObjectiveToTacticalEncounter,
  worldObjectiveToTacticalScenario,
} from './spring-world-tactical-lane';

const progression={maxHp:120,agility:15,power:24,magic:20};
const companions=['bear','owl'] as const;

describe('V3 Spring Lane B World + Tactical vertical slice',()=>{
  it('compiles each World objective kind into the existing Tactical scenario contract',()=>{
    const spring=campaignWorldObjectives.filter(item=>item.season==='spring');
    const expected={
      caretaker:{objective:{type:'protect',unitId:'runa'},modifier:{campaign:'caretaker',kind:'protect',unitId:'runa'}},
      pathfinder:{objective:{type:'escape',afterRounds:1},modifier:{campaign:'pathfinder',kind:'escape',afterRounds:1}},
      vanguard:{objective:{type:'target-elimination',targetId:'lake_channel-enemy-1'},modifier:{campaign:'vanguard',kind:'elite',levelBonus:1}},
      arcanist:{objective:{type:'standard'},modifier:{campaign:'arcanist',kind:'rule-shift',ruleId:'world-objective'}},
    } as const;

    for(const worldObjective of spring){
      const encounter=worldObjectiveToTacticalEncounter(worldObjective);
      const scenario=worldObjectiveToTacticalScenario(worldObjective);
      expect(encounter.id).toBe(`world:${worldObjective.id}`);
      expect(encounter.campaign).toBe(worldObjective.campaign);
      expect(encounter.stageId).toBe(worldObjective.stageIds[0]);
      expect(encounter.objective).toEqual(expected[worldObjective.campaign].objective);
      expect(encounter.modifiers).toEqual([expected[worldObjective.campaign].modifier]);
      expect(encounter.failForward).toBe(true);
      expect(scenario.id).toBe(encounter.id);
      expect(scenario.stageId).toBe(encounter.stageId);
      expect(scenario.battleNode.stageId).toBe(encounter.stageId);
    }
  });

  it('runs World objective -> existing 3v3 battle -> terminal handoff -> canonical World victory',()=>{
    const worldObjective=campaignWorldObjectives.find(item=>item.id==='summer_caretaker_festival_rescue')!;
    const scenario=worldObjectiveToTacticalScenario(worldObjective);
    const battle=createTacticalScenarioBattle(scenario,companions,progression,41);
    expect(battle.units.filter(unit=>unit.side==='ally')).toHaveLength(3);
    expect(battle.units.filter(unit=>unit.side==='enemy')).toHaveLength(3);

    const won={...battle,round:3,units:battle.units.map(unit=>unit.side==='enemy'?{...unit,hp:0}:unit)};
    const terminal=resolveTacticalScenarioResult(scenario,won,'festival-attempt-1');
    expect(terminal?.objectiveResult).toBe('success');
    expect(terminal?.battleResult).toBe('victory');

    const handed=handoffTacticalTerminalResult(createTacticalTerminalHandoffState(),terminal);
    expect(handed.result).not.toBeNull();
    const outcome=mapTacticalResultToGuardianFestivalOutcome(handed.result!);
    expect(outcome).toBe('victory');

    const inherited=['ancient_route_opened'] as const;
    const world=resolveGuardianFestivalWorldOutcome({
      outcome,
      worldHistory:{currentFacts:[],inheritedFacts:[...inherited]},
      majorOutcomes:{},
      failForwardOutcomes:[],
    });
    expect(world.applied).toBe(true);
    expect(world.worldHistory.currentFacts).toEqual(['festival_saved']);
    expect(world.worldHistory.inheritedFacts).toEqual([...inherited]);
    expect(world.failForwardOutcomes).toEqual([]);

    const replay=handoffTacticalTerminalResult(handed.state,terminal);
    expect(replay.result).toBeNull();
  });

  it('returns a Tactical failure as a canonical fail-forward World defeat exactly once',()=>{
    const worldObjective=campaignWorldObjectives.find(item=>item.id==='summer_caretaker_festival_rescue')!;
    const scenario=worldObjectiveToTacticalScenario(worldObjective);
    const battle=createTacticalScenarioBattle(scenario,companions,progression,43);
    const failed={...battle,units:battle.units.map(unit=>unit.id==='runa'?{...unit,hp:0}:unit)};
    const terminal=resolveTacticalScenarioResult(scenario,failed,'festival-attempt-2');
    expect(terminal?.objectiveResult).toBe('failure');

    const handed=handoffTacticalTerminalResult(createTacticalTerminalHandoffState(),terminal);
    const outcome=mapTacticalResultToGuardianFestivalOutcome(handed.result!);
    expect(outcome).toBe('defeat');
    const world=resolveGuardianFestivalWorldOutcome({
      outcome,
      worldHistory:{currentFacts:['festival_saved'],inheritedFacts:['rift_unstable']},
      majorOutcomes:{},
      failForwardOutcomes:[],
    });
    expect(world.worldHistory.currentFacts).toEqual(['festival_heavy_losses']);
    expect(world.worldHistory.inheritedFacts).toEqual(['rift_unstable']);
    expect(world.failForwardOutcomes).toEqual(['guardian_festival']);

    const replay=handoffTacticalTerminalResult(handed.state,terminal);
    expect(replay.result).toBeNull();
  });

  it('keeps Bond Intervention as I/O only while the World state remains untouched',()=>{
    const worldObjective=campaignWorldObjectives.find(item=>item.id==='spring_pathfinder_hidden_route')!;
    const scenario=worldObjectiveToTacticalScenario(worldObjective);
    const worldState={currentFacts:['ancient_route_opened'],inheritedFacts:['rift_unstable']};
    const before=structuredClone(worldState);
    const requests:unknown[]=[];
    const response=invokeTacticalBondIntervention(scenario,'mira','before-battle',request=>{
      requests.push(request);
      return {accepted:true,interventionId:'mira-route-support'};
    });
    expect(requests).toEqual([{
      scenarioId:scenario.id,
      campaign:'pathfinder',
      characterId:'mira',
      timing:'before-battle',
    }]);
    expect(response).toEqual({accepted:true,interventionId:'mira-route-support'});
    expect(worldState).toEqual(before);
  });
});
