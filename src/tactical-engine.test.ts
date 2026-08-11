import { describe, expect, it } from 'vitest';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import { nextTacticalActor, resolveTacticalAction } from './tactical-engine';

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
