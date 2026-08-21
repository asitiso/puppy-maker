import { describe, expect, it } from 'vitest';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import { resolveTacticalAction } from './tactical-engine';

const unit = (id:string, side:'ally'|'enemy', agility:number):TacticalUnit => ({
  id,side,position:'front',maxHp:100,hp:100,agility,ap:3,maxAp:3,mp:0,maxMp:10,shield:0,
});

function battle() {
  return createBattleSession(
    [unit('runa','ally',12),unit('owl','ally',8),unit('bear','ally',6)],
    [unit('bat','enemy',14),unit('wolf','enemy',10),unit('tree','enemy',4)],
    3,
  );
}

describe('tactical runtime resource repair', () => {
  it('repairs a corrupted maxMp before an action can propagate NaN into MP', () => {
    const session = battle();
    session.units = session.units.map(entry => entry.id === 'bat' ? { ...entry,maxMp:Number.NaN } : entry);
    const next = resolveTacticalAction(session,{actorId:'bat',actionId:'attack',targetId:'runa'});
    const bat = next.units.find(entry => entry.id === 'bat')!;
    expect(Number.isFinite(bat.maxMp)).toBe(true);
    expect(Number.isFinite(bat.mp)).toBe(true);
    expect(bat.mp).toBeGreaterThanOrEqual(0);
    expect(bat.mp).toBeLessThanOrEqual(bat.maxMp);
  });

  it('repairs corrupted maxAp at round refresh instead of creating a deadlocked next round', () => {
    let session = battle();
    session.units = session.units.map(entry => entry.id === 'bat' ? { ...entry,maxAp:Number.NaN } : entry);
    const actions:[string,string][] = [
      ['bat','runa'],['runa','wolf'],['wolf','runa'],['owl','wolf'],['bear','tree'],['tree','bear'],
    ];
    for (const [actorId,targetId] of actions) session = resolveTacticalAction(session,{actorId,actionId:'attack',targetId});
    const bat = session.units.find(entry => entry.id === 'bat')!;
    expect(session.round).toBe(2);
    expect(Number.isFinite(bat.maxAp)).toBe(true);
    expect(Number.isFinite(bat.ap)).toBe(true);
    expect(bat.ap).toBe(bat.maxAp);
  });
});