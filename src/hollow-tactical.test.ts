import {describe,expect,it} from 'vitest';
import {createHollowBattle,hollowTacticalScenarios,resolveHollowTacticalTerminalResult} from './hollow-tactical';

const progression={maxHp:140,agility:18,power:28,magic:24};

describe('V3 Hollow Tactical reuse contract',()=>{
  it('reuses existing 3v3 encounter stages for Summer/Autumn/Winter without a second battle engine',()=>{
    expect(hollowTacticalScenarios.map(s=>s.id)).toEqual([
      'hollow_summer_predatory_shortcut',
      'hollow_autumn_rift_bargain',
      'hollow_winter_veyr_convergence',
    ]);
    expect(hollowTacticalScenarios.map(s=>s.stageId)).toEqual(['starlight_patrol','rift_vanguard','rift_vanguard']);
    expect(hollowTacticalScenarios.every(s=>s.route==='hollow'&&s.failForward)).toBe(true);
    for(const [index,scenario] of hollowTacticalScenarios.entries()){
      const battle=createHollowBattle(scenario,['bear','owl'],progression,900+index);
      expect(battle.units.filter(unit=>unit.side==='ally')).toHaveLength(3);
      expect(battle.units.filter(unit=>unit.side==='enemy')).toHaveLength(3);
      expect(battle.round).toBe(1);
    }
  });

  it.each(['victory','defeat'] as const)('hands off %s as an authoritative fail-forward Hollow result',battleResult=>{
    const scenario=hollowTacticalScenarios[2];
    const result=resolveHollowTacticalTerminalResult(scenario,{
      attemptKey:'run-6-winter-1',
      battleResult,
      rounds:5,
      survivingAllies:battleResult==='victory'?1:0,
      damageTaken:240,
    });
    expect(result).toEqual({
      scenarioId:'hollow_winter_veyr_convergence',
      route:'hollow',
      season:'winter',
      attemptKey:'run-6-winter-1',
      terminalKey:'hollow_winter_veyr_convergence:run-6-winter-1',
      objectiveResult:battleResult==='victory'?'success':'failure',
      battleResult,
      failForward:true,
      rounds:5,
      survivingAllies:battleResult==='victory'?1:0,
      damageTaken:240,
    });
  });

  it('makes the terminal key deterministic and sanitizes malformed numeric output',()=>{
    const scenario=hollowTacticalScenarios[0];
    expect(()=>resolveHollowTacticalTerminalResult(scenario,{attemptKey:'   ',battleResult:'victory',rounds:1,survivingAllies:3,damageTaken:0})).toThrow();
    const first=resolveHollowTacticalTerminalResult(scenario,{attemptKey:' same-attempt ',battleResult:'defeat',rounds:Number.NaN,survivingAllies:99,damageTaken:Number.POSITIVE_INFINITY});
    const repeated=resolveHollowTacticalTerminalResult(scenario,{attemptKey:'same-attempt',battleResult:'defeat',rounds:Number.NaN,survivingAllies:99,damageTaken:Number.POSITIVE_INFINITY});
    expect(first.terminalKey).toBe(repeated.terminalKey);
    expect(first.attemptKey).toBe('same-attempt');
    expect(first.rounds).toBe(0);
    expect(first.survivingAllies).toBe(3);
    expect(first.damageTaken).toBe(0);
  });
});
