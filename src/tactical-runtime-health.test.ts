import { describe, expect, it } from 'vitest';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import { resolveTacticalAction } from './tactical-engine';
import { addTacticalStatus, advanceTacticalStatuses } from './tactical-status';
import { resolveCombinationUltimate } from './tactical-ultimate';

const unit = (id:string, side:'ally'|'enemy', agility:number, hp=100, mp=0):TacticalUnit => ({
  id,side,position:'front',maxHp:100,hp,agility,ap:3,maxAp:3,mp,maxMp:10,shield:0,
});

function battle() {
  return createBattleSession(
    [unit('runa','ally',12),unit('owl','ally',8),unit('bear','ally',6)],
    [unit('bat','enemy',14),unit('wolf','enemy',10),unit('tree','enemy',4)],
    3,
  );
}

describe('tactical runtime health repair', () => {
  it('keeps SUPPORT finite when a living target has corrupted maxHp', () => {
    const session = battle();
    session.units = session.units.map(entry => entry.id === 'bat' ? { ...entry,hp:50,maxHp:Number.NaN } : entry);
    const next = resolveTacticalAction(session,{actorId:'bat',actionId:'support',targetId:'bat'});
    const bat = next.units.find(entry => entry.id === 'bat')!;
    expect(Number.isFinite(bat.maxHp)).toBe(true);
    expect(Number.isFinite(bat.hp)).toBe(true);
    expect(bat.hp).toBeGreaterThanOrEqual(0);
    expect(bat.hp).toBeLessThanOrEqual(bat.maxHp);
  });

  it('keeps REGEN finite when maxHp is corrupted between rounds', () => {
    const runa = addTacticalStatus(unit('runa','ally',12,50),'regen',2);
    const corrupted = { ...runa,maxHp:Number.POSITIVE_INFINITY };
    const next = advanceTacticalStatuses(corrupted);
    expect(Number.isFinite(next.maxHp)).toBe(true);
    expect(Number.isFinite(next.hp)).toBe(true);
    expect(next.hp).toBeLessThanOrEqual(next.maxHp);
  });

  it('keeps Owl Joint Ultimate healing finite with corrupted ally maxHp', () => {
    const session = createBattleSession(
      [unit('runa','ally',30,100,10),unit('companion-owl','ally',12,60),unit('companion-bear','ally',8)],
      [unit('enemy-a','enemy',10),unit('enemy-b','enemy',7),unit('enemy-c','enemy',5)],
      17,
    );
    session.units = session.units.map(entry => entry.id === 'companion-owl' ? { ...entry,maxHp:Number.NaN } : entry);
    const next = resolveCombinationUltimate(session,{actorId:'runa',companionId:'owl',bondLevel:5,targetId:'companion-owl'});
    const owl = next.units.find(entry => entry.id === 'companion-owl')!;
    expect(Number.isFinite(owl.maxHp)).toBe(true);
    expect(Number.isFinite(owl.hp)).toBe(true);
    expect(owl.hp).toBeLessThanOrEqual(owl.maxHp);
  });
});