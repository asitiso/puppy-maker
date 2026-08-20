import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import { createTacticalBattleFromGame, tacticalCompletionMetrics, tacticalEncounterForExpeditionStage } from './tactical-launcher';

describe('tactical expedition launcher', () => {
  it('maps expedition regions onto reusable tactical encounters', () => {
    expect(tacticalEncounterForExpeditionStage('forest_path')).toBe('training_ground');
    expect(tacticalEncounterForExpeditionStage('city_square')).toBe('starlight_patrol');
    expect(tacticalEncounterForExpeditionStage('lake_channel')).toBe('rift_vanguard');
  });

  it('creates a 3v3 battle from the saved party and existing raising stats', () => {
    const state = { ...initialState, selectedTacticalCompanions:['bear','owl'] as const };
    const battle = createTacticalBattleFromGame(state,'forest_path',17);
    expect(battle.units.filter(unit=>unit.side==='ally')).toHaveLength(3);
    expect(battle.units.filter(unit=>unit.side==='enemy')).toHaveLength(3);
    expect(battle.units.some(unit=>unit.id==='runa')).toBe(true);
    expect(battle.units.some(unit=>unit.id==='companion-bear')).toBe(true);
    expect(battle.units.some(unit=>unit.id==='companion-owl')).toBe(true);
  });

  it('falls back to bear and owl when an old save has no selected pair', () => {
    const state = { ...initialState, selectedTacticalCompanions:[] };
    const battle = createTacticalBattleFromGame(state,'forest_path',17);
    expect(battle.units.map(unit=>unit.id)).toEqual(expect.arrayContaining(['companion-bear','companion-owl']));
  });

  it('derives completion metrics from the final battle state', () => {
    const unit=(id:string,side:'ally'|'enemy',hp:number,maxHp=100):TacticalUnit=>({id,side,position:'front',maxHp,hp,agility:10,ap:3,maxAp:3,mp:0,maxMp:10,shield:0});
    const battle=createBattleSession([unit('runa','ally',70),unit('bear','ally',0),unit('owl','ally',90)],[unit('e1','enemy',0),unit('e2','enemy',0),unit('e3','enemy',0)],3);
    const metrics=tacticalCompletionMetrics(battle);
    expect(metrics.survivingAllies).toBe(2);
    expect(metrics.damageTaken).toBe(140);
    expect(metrics.rounds).toBe(1);
  });
});
