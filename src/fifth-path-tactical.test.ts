import {describe,expect,it} from 'vitest';
import {createFifthPathBattle,fifthPathTacticalScenarios,resolveFifthTacticalTerminalResult} from './fifth-path-tactical';

const progression={maxHp:140,agility:18,power:28,magic:24};

describe('V3 Fifth Path Tactical reuse contract',()=>{
  it('reuses existing 3v3 encounter stages for Summer/Autumn/Winter without a second battle engine',()=>{
    expect(fifthPathTacticalScenarios.map(s=>s.stageId)).toEqual(['starlight_patrol','rift_vanguard','rift_vanguard']);
    expect(fifthPathTacticalScenarios.every(s=>s.campaign==='true_path'&&s.failForward)).toBe(true);
    for(const [index,scenario] of fifthPathTacticalScenarios.entries()){
      const battle=createFifthPathBattle(scenario,['bear','owl'],progression,700+index);
      expect(battle.units.filter(unit=>unit.side==='ally')).toHaveLength(3);
      expect(battle.units.filter(unit=>unit.side==='enemy')).toHaveLength(3);
      expect(battle.round).toBe(1);
    }
  });

  it.each(['victory','defeat'] as const)('hands off %s as an authoritative fail-forward result',battleResult=>{
    const scenario=fifthPathTacticalScenarios[2];
    const result=resolveFifthTacticalTerminalResult(scenario,{
      attemptKey:'run-5-winter-1',
      battleResult,
      rounds:4,
      survivingAllies:battleResult==='victory'?2:0,
      damageTaken:180,
    });
    expect(result).toEqual({
      scenarioId:'fifth_winter_last_possibility',
      campaign:'true_path',
      season:'winter',
      attemptKey:'run-5-winter-1',
      terminalKey:'fifth_winter_last_possibility:run-5-winter-1',
      objectiveResult:battleResult==='victory'?'success':'failure',
      battleResult,
      failForward:true,
      rounds:4,
      survivingAllies:battleResult==='victory'?2:0,
      damageTaken:180,
    });
  });

  it('sanitizes terminal numeric output and rejects empty attempt keys',()=>{
    const scenario=fifthPathTacticalScenarios[0];
    expect(()=>resolveFifthTacticalTerminalResult(scenario,{attemptKey:'',battleResult:'victory',rounds:1,survivingAllies:3,damageTaken:0})).toThrow();
    const result=resolveFifthTacticalTerminalResult(scenario,{attemptKey:'x',battleResult:'defeat',rounds:Number.NaN,survivingAllies:99,damageTaken:Number.POSITIVE_INFINITY});
    expect(result.rounds).toBe(0);
    expect(result.survivingAllies).toBe(3);
    expect(result.damageTaken).toBe(0);
  });
});
