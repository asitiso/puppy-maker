import { describe, expect, it } from 'vitest';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import type { TacticalActionId } from './tactical-actions';
import { nextTacticalActor, resolveTacticalAction, skipTacticalTurnIfNoPlayableAction } from './tactical-engine';

const unit = (id:string, side:'ally'|'enemy', agility:number, ap=3, mp=0, shield=0):TacticalUnit => ({
  id, side, position:'front', maxHp:100, hp:100, agility, ap, maxAp:3, mp, maxMp:10, shield,
});
const battle = () => createBattleSession(
  [unit('runa','ally',12),unit('owl','ally',8),unit('bear','ally',6)],
  [unit('bat','enemy',14),unit('wolf','enemy',10),unit('tree','enemy',4)],
  3,
);

describe('tactical turn engine', () => {
  it('uses the stable timeline to identify the next actor', () => {
    expect(nextTacticalActor(battle())).toBe('bat');
  });

  it('rejects an out-of-turn action as the same session object', () => {
    const session = battle();
    expect(resolveTacticalAction(session,{ actorId:'runa', actionId:'attack', targetId:'wolf' })).toBe(session);
  });

  it('rejects an unknown runtime action id instead of throwing or spending a turn', () => {
    const session = battle();
    const invalid = 'stale-action' as TacticalActionId;
    expect(resolveTacticalAction(session,{ actorId:'bat', actionId:invalid, targetId:'runa' })).toBe(session);
    expect(skipTacticalTurnIfNoPlayableAction(session,'bat',[invalid])).not.toBe(session);
  });

  it('rejects a stale or dead target without spending the turn', () => {
    const session = battle();
    session.units = session.units.map(entry => entry.id === 'runa' ? { ...entry, hp:0 } : entry);
    expect(resolveTacticalAction(session,{ actorId:'bat', actionId:'attack', targetId:'runa' })).toBe(session);
    expect(session.acted).toEqual([]);
  });

  it('rejects insufficient resources without partial mutation or negative balances', () => {
    const session = battle();
    session.units = session.units.map(entry => entry.id === 'bat' ? { ...entry, ap:1, mp:9 } : entry);
    const before = session.units.find(entry => entry.id === 'bat')!;
    const next = resolveTacticalAction(session,{ actorId:'bat', actionId:'skill', targetId:'runa' });
    expect(next).toBe(session);
    expect(next.units.find(entry => entry.id === 'bat')).toEqual(before);
    expect(next.acted).toEqual([]);
    expect(before.ap).toBeGreaterThanOrEqual(0);
    expect(before.mp).toBeGreaterThanOrEqual(0);
  });

  it('clamps inflated finite max resources to the tactical AP and MP caps', () => {
    const inflated = { ...unit('bat','enemy',14),ap:999,maxAp:999,mp:999,maxMp:999 };
    const session = createBattleSession(
      [unit('runa','ally',12),unit('owl','ally',8),unit('bear','ally',6)],
      [inflated,unit('wolf','enemy',10),unit('tree','enemy',4)],
      3,
    );
    const bat = session.units.find(entry => entry.id === 'bat')!;
    expect(bat.maxAp).toBe(3);
    expect(bat.ap).toBe(3);
    expect(bat.maxMp).toBe(10);
    expect(bat.mp).toBe(10);
  });

  it('spends an exact cost once and blocks a same-turn double spend', () => {
    const session = battle();
    session.units = session.units.map(entry => entry.id === 'bat' ? { ...entry, ap:2, mp:0 } : entry);
    const once = resolveTacticalAction(session,{ actorId:'bat', actionId:'skill', targetId:'runa' });
    const spent = once.units.find(entry => entry.id === 'bat')!;
    expect(spent.ap).toBe(0);
    expect(spent.mp).toBe(3);
    expect(once.acted).toEqual(['bat']);

    const twice = resolveTacticalAction(once,{ actorId:'bat', actionId:'skill', targetId:'runa' });
    expect(twice).toBe(once);
    expect(twice.units.find(entry => entry.id === 'bat')).toEqual(spent);
    expect(twice.acted).toEqual(['bat']);
  });

  it('clamps MP gain at maxMp instead of overflowing the resource cap', () => {
    const session = battle();
    session.units = session.units.map(entry => entry.id === 'bat' ? { ...entry, mp:9 } : entry);
    const next = resolveTacticalAction(session,{ actorId:'bat', actionId:'attack', targetId:'runa' });
    const bat = next.units.find(entry => entry.id === 'bat')!;
    expect(bat.mp).toBe(10);
    expect(bat.mp).toBeLessThanOrEqual(bat.maxMp);
  });

  it('spends AP, gains MP and lets shield absorb damage first', () => {
    const session = battle();
    session.units = session.units.map(entry => entry.id === 'runa' ? { ...entry, shield:8 } : entry);
    const next = resolveTacticalAction(session,{ actorId:'bat', actionId:'attack', targetId:'runa' });
    const bat = next.units.find(entry => entry.id === 'bat')!;
    const runa = next.units.find(entry => entry.id === 'runa')!;
    expect(bat.ap).toBe(2);
    expect(bat.mp).toBe(2);
    expect(runa.shield).toBe(0);
    expect(runa.hp).toBe(88);
    expect(next.acted).toEqual(['bat']);
  });

  it('support heals an ally and still consumes the acting turn', () => {
    const session = battle();
    session.units = session.units.map(entry => entry.id === 'bat' ? { ...entry, hp:50 } : entry);
    const next = resolveTacticalAction(session,{ actorId:'bat', actionId:'support', targetId:'bat' });
    expect(next.units.find(entry => entry.id === 'bat')?.hp).toBe(74);
    expect(next.acted).toEqual(['bat']);
  });

  it('becomes terminal immediately after a lethal action', () => {
    const session = battle();
    session.units = session.units.map(entry => entry.side === 'ally' ? { ...entry, hp:entry.id === 'runa' ? 10 : 0 } : entry);
    const next = resolveTacticalAction(session,{ actorId:'bat', actionId:'attack', targetId:'runa' });
    expect(next.units.find(entry => entry.id === 'runa')?.hp).toBe(0);
    expect(nextTacticalActor(next)).toBeNull();
  });

  it('starts the next round after every living unit acts and refreshes AP', () => {
    let session = battle();
    const actions:[string,string][] = [
      ['bat','runa'],['runa','wolf'],['wolf','runa'],['owl','wolf'],['bear','tree'],['tree','bear'],
    ];
    for (const [actorId,targetId] of actions) {
      session = resolveTacticalAction(session,{ actorId, actionId:'attack', targetId });
    }
    expect(session.round).toBe(2);
    expect(session.acted).toEqual([]);
    expect(session.units.every(entry => entry.hp <= 0 || entry.ap === entry.maxAp)).toBe(true);
    expect(nextTacticalActor(session)).toBe('bat');
  });
});
